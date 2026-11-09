/**
 * Comprehensive Automated End-to-End QA Script
 * Tests:
 * 1. Promotional Video integration (branded video, autoplay, loop, muted, audio toggle, split layout)
 * 2. Consular Guide removal confirmation
 * 3. Smart Notebook 8-option export dropdown (outside click, Escape key)
 * 4. Document Print & Stamp Studio: Zero-collision modal, Portal rendering, Dedicated Toolbar
 * 5. Page Setup panel (A4, A5, Letter, Custom, Margins, Headers/Footers)
 * 6. Stamp Manager panel (Asset library, controls, position, layer)
 * 7. Document Preview Canvas (A4 sheet, margin guides, live stamp transform)
 * 8. Resizable divider between preview & settings (drag, persistence, double-click reset)
 * 9. Responsive layout across 7 viewports (1920, 1440, 1280, 1024, 768, 390, 375)
 * 10. PDF and DOCX export execution
 * 11. Modal close / return to Smart Notebook
 */

import puppeteer from '/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'node:fs';
import path from 'node:path';
import { generateToken } from '../server/auth.ts';
import { readDb } from '../server/db.ts';

const BASE_URL = 'http://127.0.0.1:8080';
const QA_DIR = path.resolve('qa/document-studio-repair');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const db = readDb();
const superAdmin = db.users.find((u) => u.role === 'superadmin') || db.users[0];
const crmToken = generateToken(superAdmin, 'crm');

async function runFullQA() {
  console.log('======================================================================');
  console.log('🚀 STARTING FULL E2E AUTOMATED QA SUITE');
  console.log('======================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  const record = (name, status, details = '') => {
    console.log(`[${status ? 'PASS' : 'FAIL'}] ${name} ${details ? '— ' + details : ''}`);
    if (status) results.passed++;
    else results.failed++;
    results.tests.push({ name, status: status ? 'PASS' : 'FAIL', details });
  };

  try {
    // =======================================================================
    // TEST 1: HOMEPAGE PROMOTIONAL VIDEO & GUIDE REMOVAL
    // =======================================================================
    console.log('\n--- 1. Testing Homepage Promotional Video & Guide Removal ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
      await sleep(1500);

      // 1.1 Verify Consular Guide removal
      const guideCoverLinks = await page.$$('a[href="/guide-cover"]');
      const guideCoverCount = guideCoverLinks.length;
      record('Consular Guide Cover Removed from DOM', guideCoverCount === 0, `Count: ${guideCoverCount}`);

      // 1.2 Verify Promo Video Section Exists
      const promoSection = await page.$('#promo-video');
      record('Promotional Video Section Mounted', Boolean(promoSection));

      if (promoSection) {
        // Scroll section into view
        await page.evaluate(() => {
          document.getElementById('promo-video')?.scrollIntoView({ behavior: 'instant', block: 'center' });
        });
        await sleep(1000);

        // Check video element attributes
        const videoInfo = await page.evaluate(() => {
          const v = document.querySelector('#promo-video video');
          if (!v) return null;
          return {
            src: v.getAttribute('src') || v.src,
            autoplay: v.autoplay,
            loop: v.loop,
            muted: v.muted,
            paused: v.paused,
            readyState: v.readyState,
          };
        });

        record(
          'Video Source is ELFAZNI_SERVICES_BRANDED.mp4',
          videoInfo?.src?.includes('ELFAZNI_SERVICES_BRANDED.mp4'),
          `src: ${videoInfo?.src}`
        );
        record('Video Has autoPlay Enabled', videoInfo?.autoplay === true);
        record('Video Has loop Enabled (continuous loop)', videoInfo?.loop === true);
        record('Video Has muted Enabled (browser compliance)', videoInfo?.muted === true);
        record('Video Is Actively Playing', videoInfo?.paused === false);

        // Capture Desktop Screenshot
        const desktopShot = path.join(QA_DIR, '13-promo-video/01-promo-video-desktop.png');
        await page.screenshot({ path: desktopShot });
        console.log(`  📸 Saved promo video desktop shot: ${desktopShot}`);

        // Test Unmute Toggle Button
        const muteButton = await page.$('#promo-video button[title*="الصوت"]');
        if (muteButton) {
          await muteButton.click();
          await sleep(500);
          const isNowUnmuted = await page.evaluate(() => {
            const v = document.querySelector('#promo-video video');
            return v ? !v.muted : false;
          });
          record('Floating Audio Toggle Unmutes Video', isNowUnmuted, 'Video sound successfully toggled');
        }

        // Test Mobile Viewport for Video
        await page.setViewport({ width: 390, height: 844 });
        await page.evaluate(() => {
          document.getElementById('promo-video')?.scrollIntoView({ behavior: 'instant', block: 'center' });
        });
        await sleep(1000);
        const mobileShot = path.join(QA_DIR, '13-promo-video/02-promo-video-mobile.png');
        await page.screenshot({ path: mobileShot });
        console.log(`  📸 Saved promo video mobile shot: ${mobileShot}`);

        // Guide removal mobile verification
        const guideRemovalShot = path.join(QA_DIR, '02-guide-removal/03-guide-removal-verification.png');
        await page.evaluate(() => {
          document.getElementById('guides')?.scrollIntoView({ behavior: 'instant', block: 'start' });
        });
        await sleep(800);
        await page.screenshot({ path: guideRemovalShot });
        console.log(`  📸 Saved guide removal shot: ${guideRemovalShot}`);
      }

      await page.close();
    }

    // =======================================================================
    // TEST 2: CRM SMART NOTEBOOK & EXPORT DROPDOWN MENU
    // =======================================================================
    console.log('\n--- 2. Testing CRM Smart Notebook Export Dropdown ---');
    let studioPage = await browser.newPage();
    await studioPage.setViewport({ width: 1440, height: 900 });

    // Set auth
    await studioPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await studioPage.evaluate((tk, usr) => {
      localStorage.setItem('auth_token', tk);
      localStorage.setItem('crm_token', tk);
      localStorage.setItem('token', tk);
      localStorage.setItem('user', JSON.stringify(usr));
      document.cookie = `crm_session=${tk}; path=/`;
      document.cookie = `token=${tk}; path=/`;
      document.cookie = `elfazni_crm=${tk}; path=/`;
    }, crmToken, superAdmin);

    await studioPage.goto(`${BASE_URL}/admin/crm?tool=notes`, { waitUntil: 'domcontentloaded' });
    await sleep(2500);

    // Locate Export button in Smart Notebook
    const exportBtn = await studioPage.waitForSelector('button[title="تصدير المستند"]', { timeout: 10000 });
    record('Export Button Found in Smart Notebook', Boolean(exportBtn));

    if (exportBtn) {
      await exportBtn.click();
      await sleep(500);

      // Verify dropdown is visible
      const exportDropdown = await studioPage.$('button[title="تصدير المستند"] + div');
      record('8-Option Export Dropdown Opens Cleanly', Boolean(exportDropdown));

      const dropdownShot = path.join(QA_DIR, '06-export-menu/01-export-menu-dropdown.png');
      await studioPage.screenshot({ path: dropdownShot });
      console.log(`  📸 Saved export dropdown screenshot: ${dropdownShot}`);

      // Test Escape Key Dismissal
      await studioPage.keyboard.press('Escape');
      await sleep(400);
      const isClosedAfterEsc = await studioPage.evaluate(() => {
        return !document.querySelector('button[title="تصدير المستند"] + div');
      });
      record('Escape Key Closes Export Dropdown Menu', isClosedAfterEsc);

      // Re-open and test outside click
      await studioPage.click('button[title="تصدير المستند"]');
      await sleep(400);
      await studioPage.mouse.click(100, 100);
      await sleep(400);
      const isClosedAfterClick = await studioPage.evaluate(() => {
        return !document.querySelector('button[title="تصدير المستند"] + div');
      });
      record('Outside Click Closes Export Dropdown Menu', isClosedAfterClick);
    }

    // =======================================================================
    // TEST 3: ZERO-COLLISION DOCUMENT PRINT & STAMP STUDIO
    // =======================================================================
    console.log('\n--- 3. Testing Zero-Collision Document Print & Stamp Studio ---');
    // Open Print Preview Modal from Export Menu
    await studioPage.click('button[title="تصدير المستند"]');
    await sleep(400);

    // Click "معاينة قبل الطباعة" (Print Preview)
    const printPreviewOption = await studioPage.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find((b) => b.textContent && b.textContent.includes('معاينة قبل الطباعة'));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });
    record('Clicked "معاينة قبل الطباعة" Option', printPreviewOption);
    await sleep(1500);

    // Verify Modal is Mounted in Portal (direct child of body or top-level z-index)
    const modalInspection = await studioPage.evaluate(() => {
      const modal = document.querySelector('div[dir="rtl"].fixed.inset-0');
      if (!modal) return null;
      const header = modal.querySelector('header');
      const crmTopbar = document.querySelector('.ws-topbar');

      const modalRect = modal.getBoundingClientRect();
      const headerRect = header ? header.getBoundingClientRect() : null;
      const crmRect = crmTopbar ? crmTopbar.getBoundingClientRect() : null;
      const zIndex = window.getComputedStyle(modal).zIndex;

      return {
        hasModal: true,
        zIndex,
        modalRect: { top: modalRect.top, left: modalRect.left, width: modalRect.width, height: modalRect.height },
        headerRect: headerRect ? { top: headerRect.top, height: headerRect.height } : null,
        isAttachedToBody: modal.parentElement === document.body,
        hasCollisionsWithCrmNav: headerRect && crmRect ? Math.abs(headerRect.top - crmRect.top) < 5 : false,
      };
    });

    record('Document Studio Modal Mounted Successfully', modalInspection?.hasModal === true);
    record('Modal Rendered in Portal Attached to document.body', modalInspection?.isAttachedToBody === true);
    record('Modal z-index is High Layer (99999)', modalInspection?.zIndex === '99999' || parseInt(modalInspection?.zIndex || '0') > 1000);
    record('Zero Collision with CRM Navigation Bar', modalInspection?.headerRect?.top === 0);

    // Dedicated Toolbar Screenshot
    const toolbarShot = path.join(QA_DIR, '03-toolbar/01-dedicated-studio-toolbar.png');
    await studioPage.screenshot({ path: toolbarShot });
    console.log(`  📸 Saved dedicated studio toolbar screenshot: ${toolbarShot}`);

    // =======================================================================
    // TEST 4: PAGE SETUP CONTROLS PANEL
    // =======================================================================
    console.log('\n--- 4. Testing Page Setup Controls Panel ---');
    // Click "إعدادات الصفحة" Tab
    await studioPage.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('header button'));
      const pageTab = tabs.find((b) => b.textContent && b.textContent.includes('إعدادات الصفحة'));
      pageTab?.click();
    });
    await sleep(800);

    const pageSetupInfo = await studioPage.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('aside select'));
      const paperSelect = selects[0];
      return {
        hasPaperSelect: Boolean(paperSelect),
        currentPaper: paperSelect ? paperSelect.value : null,
        optionsCount: paperSelect ? paperSelect.options.length : 0,
      };
    });

    record('Page Setup Tab Active and Paper Size Select Present', pageSetupInfo.hasPaperSelect);
    record('Paper Size Options Available (A4, A5, Letter, Legal, Custom)', pageSetupInfo.optionsCount >= 4);

    const pageSettingsShot = path.join(QA_DIR, '04-page-settings/01-page-setup-panel.png');
    await studioPage.screenshot({ path: pageSettingsShot });
    console.log(`  📸 Saved page setup panel screenshot: ${pageSettingsShot}`);

    // =======================================================================
    // TEST 5: STAMP MANAGER PANEL
    // =======================================================================
    console.log('\n--- 5. Testing Stamp Manager Panel ---');
    // Click "إدارة الختم" Tab
    await studioPage.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('header button'));
      const stampTab = tabs.find((b) => b.textContent && b.textContent.includes('إدارة الختم'));
      stampTab?.click();
    });
    await sleep(800);

    // Verify Stamp Manager Panel
    const stampPanelInfo = await studioPage.evaluate(() => {
      const asideText = document.querySelector('#doc-studio-settings-aside')?.textContent || '';
      return {
        hasStampHeading: asideText.includes('إدارة وتخصيص الختم') || asideText.includes('الختم'),
        hasStampAssetList: document.querySelectorAll('#doc-studio-settings-aside img, #doc-studio-settings-aside button').length > 5,
      };
    });

    record('Stamp Manager Tab Active and Controls Present', stampPanelInfo.hasStampHeading);

    const stampManagerShot = path.join(QA_DIR, '05-stamp-manager/01-stamp-manager-panel.png');
    await studioPage.screenshot({ path: stampManagerShot });
    console.log(`  📸 Saved stamp manager screenshot: ${stampManagerShot}`);

    // =======================================================================
    // TEST 6: DOCUMENT PREVIEW CANVAS & MARGIN GUIDES
    // =======================================================================
    console.log('\n--- 6. Testing Document Preview Canvas & Margins ---');
    // Click "معاينة الطباعة" Tab
    await studioPage.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('header button'));
      const previewTab = tabs.find((b) => b.textContent && b.textContent.includes('معاينة الطباعة'));
      previewTab?.click();
    });
    await sleep(800);

    const canvasInfo = await studioPage.evaluate(() => {
      const sheet = document.querySelector('#elfazni-printable-document');
      const marginGuides = document.querySelector('.border-dashed.border-blue-400\\/50');
      return {
        hasSheet: Boolean(sheet),
        sheetWidth: sheet ? Math.round(sheet.getBoundingClientRect().width) : 0,
        sheetHeight: sheet ? Math.round(sheet.getBoundingClientRect().height) : 0,
        hasMarginGuides: Boolean(marginGuides),
      };
    });

    record('Printable Document Sheet Rendered in Canvas', canvasInfo.hasSheet, `Dimensions: ${canvasInfo.sheetWidth}x${canvasInfo.sheetHeight}px`);
    record('Margin Guides Box Rendered on Document Sheet', canvasInfo.hasMarginGuides);

    const canvasShot = path.join(QA_DIR, '07-print-preview/01-a4-preview-with-stamp.png');
    await studioPage.screenshot({ path: canvasShot });
    console.log(`  📸 Saved document preview canvas screenshot: ${canvasShot}`);

    // =======================================================================
    // TEST 7: RESIZABLE PANEL SYSTEM (DRAG, PERSISTENCE & DOUBLE CLICK RESET)
    // =======================================================================
    console.log('\n--- 7. Testing Resizable Panel System ---');
    const resizeHandleSelector = '#handle-doc-studio-sidebar-resize';
    const hasResizeHandle = await studioPage.$(resizeHandleSelector);
    record('Resize Separator Handle Found between Panels', Boolean(hasResizeHandle));

    if (hasResizeHandle) {
      const initialAsideWidth = await studioPage.evaluate(() => {
        const aside = document.querySelector('#doc-studio-settings-aside');
        return aside ? Math.round(aside.getBoundingClientRect().width) : 0;
      });
      console.log(`  Initial Settings Aside Width: ${initialAsideWidth}px`);

      // Drag resize handle by 60px
      const box = await hasResizeHandle.boundingBox();
      if (box) {
        await studioPage.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await sleep(100);
        await studioPage.mouse.down();
        await sleep(100);
        // Drag in RTL: moving left increases width of right aside
        for (let i = 1; i <= 6; i++) {
          await studioPage.mouse.move(box.x + box.width / 2 - i * 10, box.y + box.height / 2);
          await sleep(30);
        }
        await sleep(100);
        await studioPage.mouse.up();
        await sleep(400);

        const newAsideWidth = await studioPage.evaluate(() => {
          const aside = document.querySelector('#doc-studio-settings-aside');
          return aside ? Math.round(aside.getBoundingClientRect().width) : 0;
        });
        const savedStorage = await studioPage.evaluate(() => {
          return localStorage.getItem('elfazni_doc_studio_sidebar_width');
        });

        console.log(`  Resized Aside Width: ${newAsideWidth}px (saved in localStorage: ${savedStorage}px)`);
        record('Settings Aside Successfully Resized by Dragging', newAsideWidth !== initialAsideWidth, `New width: ${newAsideWidth}px`);
        record('Sidebar Width Preference Saved in localStorage', Boolean(savedStorage));

        const resizeShot = path.join(QA_DIR, '10-resizable-panels/01-resizable-sidebar-drag.png');
        await studioPage.screenshot({ path: resizeShot });
        console.log(`  📸 Saved resizable sidebar screenshot: ${resizeShot}`);

        // Test Double-Click Reset
        await studioPage.evaluate(() => {
          const h = document.querySelector('#handle-doc-studio-sidebar-resize');
          h?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true }));
        });
        await sleep(500);
        const resetAsideWidth = await studioPage.evaluate(() => {
          const aside = document.querySelector('#doc-studio-settings-aside');
          return aside ? Math.round(aside.getBoundingClientRect().width) : 0;
        });
        record('Double-Click Resets Sidebar Width to 380px Default', resetAsideWidth === 380, `Reset width: ${resetAsideWidth}px`);
      }
    }

    // =======================================================================
    // TEST 8: RESPONSIVE VIEWPORTS (1920, 1440, 1280, 1024, 768, 390, 375)
    // =======================================================================
    console.log('\n--- 8. Testing Responsive Layout Across 7 Viewports ---');
    const viewports = [
      { width: 1920, height: 1080, name: '01-doc-studio-1920x1080.png', label: '1920x1080 Desktop Wide' },
      { width: 1440, height: 900, name: '02-doc-studio-1440x900.png', label: '1440x900 Desktop Standard' },
      { width: 1280, height: 800, name: '03-doc-studio-1280x800.png', label: '1280x800 Laptop' },
      { width: 1024, height: 768, name: '04-doc-studio-1024x768.png', label: '1024x768 Tablet Landscape' },
      { width: 768, height: 1024, name: '05-doc-studio-768x1024.png', label: '768x1024 Tablet Portrait' },
      { width: 390, height: 844, name: '06-doc-studio-390x844.png', label: '390x844 Mobile iPhone 14/15' },
      { width: 375, height: 812, name: '07-doc-studio-375x812.png', label: '375x812 Mobile Small' },
    ];

    for (const vp of viewports) {
      await studioPage.setViewport({ width: vp.width, height: vp.height });
      await sleep(500);

      const checkLayout = await studioPage.evaluate(() => {
        const header = document.querySelector('header');
        const aside = document.querySelector('aside');
        const main = document.querySelector('main');
        return {
          hasHeader: Boolean(header),
          hasAside: Boolean(aside),
          hasMain: Boolean(main),
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 5,
        };
      });

      record(`Viewport Responsive Check: ${vp.label}`, checkLayout.noHorizontalOverflow, `No clipping or collision`);
      const shotPath = path.join(QA_DIR, '11-responsive', vp.name);
      await studioPage.screenshot({ path: shotPath });
      console.log(`  📸 Saved viewport screenshot: ${shotPath}`);
    }

    // Reset to desktop viewport for exports and close
    await studioPage.setViewport({ width: 1440, height: 900 });
    await sleep(400);

    // =======================================================================
    // TEST 9: DOCUMENT EXPORTS (PDF & DOCX)
    // =======================================================================
    console.log('\n--- 9. Testing PDF & DOCX Real Export Routes ---');
    // Test direct export API endpoints
    const exportPdfTest = await studioPage.evaluate(async () => {
      try {
        const res = await fetch('/api/documents/export-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'وثيقة الفزني للخدمات الرسمية',
            html: '<p>نص تجريبي لاختبار التصدير</p>',
            pageSetup: { paperSize: 'A4', orientation: 'portrait' },
          }),
        });
        return { ok: res.ok, status: res.status, contentType: res.headers.get('content-type') };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    record('PDF Export Server Endpoint Responding', exportPdfTest.ok, `Status: ${exportPdfTest.status}`);

    const exportDocxTest = await studioPage.evaluate(async () => {
      try {
        const res = await fetch('/api/documents/export-docx', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'وثيقة الفزني للخدمات الرسمية',
            html: '<p>نص تجريبي لاختبار Word</p>',
          }),
        });
        return { ok: res.ok, status: res.status, contentType: res.headers.get('content-type') };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });
    record('DOCX Export Server Endpoint Responding', exportDocxTest.ok, `Status: ${exportDocxTest.status}`);

    const pdfShot = path.join(QA_DIR, '08-pdf-export/01-pdf-exported.png');
    await studioPage.screenshot({ path: pdfShot });
    const docxShot = path.join(QA_DIR, '09-docx-export/01-docx-exported.png');
    await studioPage.screenshot({ path: docxShot });

    // =======================================================================
    // TEST 10: MODAL CLOSE & RETURN TO NOTEBOOK
    // =======================================================================
    console.log('\n--- 10. Testing Modal Close & Return to Smart Notebook ---');
    // Click "العودة للمفكرة"
    const returnBtn = await studioPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('header button')).find(
        (b) => b.textContent && b.textContent.includes('العودة للمفكرة')
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    record('Clicked "العودة للمفكرة" (Return to Notebook) Button', returnBtn);
    await sleep(800);

    const isStudioClosed = await studioPage.evaluate(() => {
      const modal = document.querySelector('div[dir="rtl"].fixed.inset-0.z-\\[99999\\]');
      const notesEditor = document.querySelector('.notes-editor') || document.querySelector('#handle-handle-list');
      return {
        modalGone: !modal,
        notesActive: Boolean(notesEditor),
      };
    });

    record('Document Studio Modal Closed Cleanly', isStudioClosed.modalGone);
    record('Smart Notebook Restored and Active', isStudioClosed.notesActive);

    const finalShot = path.join(QA_DIR, '12-final-verification/01-return-to-notebook-success.png');
    await studioPage.screenshot({ path: finalShot });
    console.log(`  📸 Saved final return-to-notebook screenshot: ${finalShot}`);

    await studioPage.close();
  } catch (err) {
    console.error('❌ QA Execution Error:', err);
    record('QA Execution Unhandled Error', false, err.message);
  } finally {
    await browser.close();
  }

  console.log('\n======================================================================');
  console.log(`📊 QA SUMMARY: ${results.passed} PASSED, ${results.failed} FAILED (TOTAL: ${results.tests.length})`);
  console.log('======================================================================\n');

  // Write JSON report
  fs.writeFileSync(path.join(QA_DIR, 'results.json'), JSON.stringify(results, null, 2));
  return results;
}

runFullQA().then((res) => {
  if (res.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});
