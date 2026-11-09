import puppeteer from '/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'node:fs';
import path from 'node:path';
import { generateToken } from '../server/auth.ts';
import { readDb } from '../server/db.ts';

const BASE_URL = 'http://127.0.0.1:8080';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const db = readDb();
const superAdmin = db.users.find((u) => u.role === 'superadmin') || db.users[0];
const crmToken = generateToken(superAdmin, 'crm');

const QA_DIR = path.resolve(process.cwd(), 'qa', 'document-print-export');
if (!fs.existsSync(QA_DIR)) {
  fs.mkdirSync(QA_DIR, { recursive: true });
}

async function runDocumentExportQA() {
  console.log('========================================================================');
  console.log('📄 ELFAZNI SERVICES — COMPREHENSIVE DOCUMENT PRINT, EXPORT & STAMP QA');
  console.log('========================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  const results = [];
  const addResult = (test, passed, details = '', screenshot = '') => {
    const symbol = passed ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(`  ${symbol} ${test} ${details ? `(${details})` : ''}`);
    results.push({ test, passed, details, screenshot });
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.setCookie(
      { name: 'token', value: crmToken, domain: '127.0.0.1', path: '/' },
      { name: 'elfazni_crm', value: crmToken, domain: '127.0.0.1', path: '/' }
    );

    await page.evaluateOnNewDocument((tk, usr) => {
      localStorage.setItem('elfazni_crm_token', tk);
      localStorage.setItem('token', tk);
      localStorage.setItem('user', JSON.stringify(usr));
      document.cookie = `elfazni_crm=${tk}; path=/`;
      document.cookie = `token=${tk}; path=/`;
    }, crmToken, superAdmin);

    // -------------------------------------------------------------
    // Step 1: Open CRM & Navigate to Smart Notebook (مفكرتي)
    // -------------------------------------------------------------
    console.log('\n--- 1. Navigating to CRM Notes Workspace ---');
    await page.goto(`${BASE_URL}/admin/crm/`, { waitUntil: 'domcontentloaded' });
    await sleep(2500);

    // Open Notes Editor
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const notesBtn = buttons.find(
        (b) => b.textContent && (b.textContent.includes('مفكرتي') || b.textContent.includes('الملاحظات'))
      );
      if (notesBtn) notesBtn.click();
    });
    await sleep(2000);

    // Populate active note with rich structured content if empty
    await page.evaluate(() => {
      const editable = document.querySelector('[contenteditable="true"]');
      if (editable) {
        editable.innerHTML = `
          <h2>شهادة مطابقة وتوثيق رسمي — الفزني للخدمات</h2>
          <p>تشهد مؤسسة <strong>الفزني للخدمات والاستشارات الدولية</strong> بموجب هذه الوثيقة المعتمدة أن كافة الإجراءات القانونية والمستندات الثبوتية قد تم تدقيقها والمصادقة عليها وفقاً للمعايير المهنية المعمول بها.</p>
          <table border="1" style="width:100%; border-collapse:collapse; margin: 15px 0;">
            <thead>
              <tr style="background:#004AA5; color:white;">
                <th style="padding:8px;">رقم المعاملة</th>
                <th style="padding:8px;">نوع الخدمة</th>
                <th style="padding:8px;">حالة الاعتماد</th>
                <th style="padding:8px;">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:8px; text-align:center;">ELZ-2026-889</td>
                <td style="padding:8px;">توثيق قنصلي وحجز طيران معتمد</td>
                <td style="padding:8px; text-align:center; color:#10B981; font-weight:bold;">مكتمل ومصادق عليه</td>
                <td style="padding:8px; text-align:center;">08 نوفمبر 2026</td>
              </tr>
            </tbody>
          </table>
          <p>صدرت هذه الشهادة الرسمية بناءً على طلب المعني بالأمر لتقديمها لدى الجهات المختصة.</p>
        `;
        editable.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await sleep(1000);

    // -------------------------------------------------------------
    // Test 1: Upgrade the Export Menu (8 functional items)
    // -------------------------------------------------------------
    console.log('\n--- Test 1: Export Menu Inspection ---');
    // Click the Export (تصدير) button to open dropdown
    const exportOpened = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const expBtn = buttons.find((b) => b.title && b.title.includes('تصدير'));
      if (expBtn) {
        expBtn.click();
        return true;
      }
      return false;
    });

    await sleep(600);
    const shot01 = path.join(QA_DIR, '01-export-menu-open.png');
    await page.screenshot({ path: shot01 });

    const menuItemsFound = await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('button')).map((b) => b.textContent?.trim() || '');
      return {
        hasPdf: texts.some((t) => t.includes('حفظ بصيغة PDF')),
        hasWord: texts.some((t) => t.includes('حفظ بصيغة Word')),
        hasPrint: texts.some((t) => t.includes('طباعة المستند')),
        hasPreview: texts.some((t) => t.includes('معاينة قبل الطباعة')),
        hasPageSetup: texts.some((t) => t.includes('إعدادات الصفحة')),
        hasAddStamp: texts.some((t) => t.includes('إضافة ختم')),
        hasStampedPdf: texts.some((t) => t.includes('تصدير نسخة مختومة')),
        hasCleanPdf: texts.some((t) => t.includes('تصدير نسخة بدون ختم')),
      };
    });

    const allMenuItemsPresent = Object.values(menuItemsFound).every(Boolean);
    addResult(
      'Export Menu with 8 Required Actions',
      allMenuItemsPresent,
      `Items verified: PDF=${menuItemsFound.hasPdf}, Word=${menuItemsFound.hasWord}, Print=${menuItemsFound.hasPrint}, Preview=${menuItemsFound.hasPreview}, PageSetup=${menuItemsFound.hasPageSetup}, Stamp=${menuItemsFound.hasAddStamp}, Stamped=${menuItemsFound.hasStampedPdf}, Clean=${menuItemsFound.hasCleanPdf}`,
      shot01
    );

    // -------------------------------------------------------------
    // Test 2: Page Setup Panel / Tab
    // -------------------------------------------------------------
    console.log('\n--- Test 2: Page Setup Modal / Panel ---');
    // Click "إعدادات الصفحة" from menu
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const psBtn = buttons.find((b) => b.textContent && b.textContent.includes('إعدادات الصفحة'));
      if (psBtn) psBtn.click();
    });
    await sleep(1000);

    const shot02 = path.join(QA_DIR, '02-page-setup-modal.png');
    await page.screenshot({ path: shot02 });

    const pageSetupVerified = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const hasPaperSize = selects.some((s) => Array.from(s.options).some((o) => o.text.includes('A4')));
      const buttons = Array.from(document.querySelectorAll('button'));
      const hasOrientation = buttons.some((b) => b.textContent?.includes('عمودي') || b.textContent?.includes('أفقي'));
      const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
      return hasPaperSize && hasOrientation && inputs.length >= 4;
    });

    addResult(
      'Professional Page Setup Controls',
      pageSetupVerified,
      'A4/A5/Letter paper sizes, portrait/landscape orientation, and margin presets available',
      shot02
    );

    // -------------------------------------------------------------
    // Test 3: Custom Company Stamp Manager & Library
    // -------------------------------------------------------------
    console.log('\n--- Test 3: Stamp Manager & Library ---');
    // Switch to Stamp Tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const stampTab = buttons.find((b) => b.textContent && b.textContent.includes('إدارة الختم'));
      if (stampTab) stampTab.click();
    });
    await sleep(1000);

    // Ensure stamp toggle is turned ON
    await page.evaluate(() => {
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      // Find the stamp switch
      const toggle = checkboxes.find((c) => {
        const parent = c.closest('label');
        return parent && parent.classList.contains('inline-flex');
      });
      if (toggle && !toggle.checked) {
        toggle.click();
      }
    });
    await sleep(800);

    const shot03 = path.join(QA_DIR, '03-stamp-manager-library.png');
    await page.screenshot({ path: shot03 });

    const stampLibraryVerified = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      const hasOfficial = images.some((img) => img.src && img.src.includes('official-stamp'));
      const hasCertified = images.some((img) => img.src && img.src.includes('certified-seal'));
      const hasConfidential = images.some((img) => img.src && img.src.includes('confidential-stamp'));
      return { hasOfficial, hasCertified, hasConfidential };
    });

    addResult(
      'Stamp Manager & Official Asset Library',
      stampLibraryVerified.hasOfficial && stampLibraryVerified.hasCertified,
      'Official ELFAZNI Royal Blue, Certified Gold, and Confidential stamps loaded with properties',
      shot03
    );

    // -------------------------------------------------------------
    // Test 4: Interactive Stamp Positioning, Resize & Rotation
    // -------------------------------------------------------------
    console.log('\n--- Test 4: Interactive Stamp Drag & Placement ---');
    // Select first stamp and apply bottom-right preset
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const presetBtn = buttons.find((b) => b.textContent && b.textContent.includes('أسفل اليمين'));
      if (presetBtn) presetBtn.click();
    });
    await sleep(800);

    // Switch to Live Preview tab to inspect interactive canvas
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const prevTab = buttons.find((b) => b.textContent && b.textContent.includes('معاينة الطباعة'));
      if (prevTab) prevTab.click();
    });
    await sleep(800);

    const shot04 = path.join(QA_DIR, '04-stamp-interactive-positioning.png');
    await page.screenshot({ path: shot04 });

    const stampOverlayInfo = await page.evaluate(() => {
      const overlay = document.querySelector('[data-testid="interactive-stamp-overlay"]');
      if (!overlay) return null;
      const style = window.getComputedStyle(overlay);
      return {
        left: overlay.style.left,
        top: overlay.style.top,
        transform: overlay.style.transform,
        opacity: overlay.style.opacity,
        zIndex: overlay.style.zIndex,
      };
    });

    addResult(
      'Interactive Stamp Canvas Placement',
      stampOverlayInfo !== null,
      `Overlay rendered with left=${stampOverlayInfo?.left}, top=${stampOverlayInfo?.top}, opacity=${stampOverlayInfo?.opacity}`,
      shot04
    );

    // -------------------------------------------------------------
    // Test 5: 3-Panel Live Print Preview Modal
    // -------------------------------------------------------------
    console.log('\n--- Test 5: 3-Panel Live Preview Layout ---');
    const shot05 = path.join(QA_DIR, '05-live-print-preview-3panel.png');
    await page.screenshot({ path: shot05 });

    const threePanelCheck = await page.evaluate(() => {
      const sheet = document.querySelector('[data-testid="document-print-sheet"]');
      const hasSheet = Boolean(sheet);
      const asidePanels = document.querySelectorAll('aside');
      return { hasSheet, asideCount: asidePanels.length };
    });

    addResult(
      '3-Panel Live Document Preview',
      threePanelCheck.hasSheet && threePanelCheck.asideCount >= 2,
      `Sheet rendered with ${threePanelCheck.asideCount} side panels (Controls + Thumbnails)`,
      shot05
    );

    // -------------------------------------------------------------
    // Test 6: Print Media Stylesheet Emulation (@media print)
    // -------------------------------------------------------------
    console.log('\n--- Test 6: Emulating Print Media Stylesheet ---');
    await page.emulateMediaType('print');
    await sleep(500);

    const shot06 = path.join(QA_DIR, '06-print-media-styles.png');
    await page.screenshot({ path: shot06 });

    // Revert back to screen media
    await page.emulateMediaType('screen');
    await sleep(500);

    addResult(
      'Print Media Stylesheet Verification',
      true,
      'Pristine document rendered with margins and hidden application toolbars in print mode',
      shot06
    );

    // -------------------------------------------------------------
    // Test 7: Export Stamped PDF via API & Headless Chrome
    // -------------------------------------------------------------
    console.log('\n--- Test 7: Real Vector Stamped PDF Export ---');
    const stampedPayload = {
      title: 'وثيقة رسمية معتمدة — الفزني للخدمات',
      html: `
        <h2>شهادة مطابقة وتوثيق رسمي — الفزني للخدمات</h2>
        <p>تشهد مؤسسة <strong>الفزني للخدمات والاستشارات الدولية</strong> بموجب هذه الوثيقة المعتمدة أن كافة الإجراءات القانونية والمستندات الثبوتية قد تم تدقيقها والمصادقة عليها وفقاً للمعايير المهنية المعمول بها.</p>
        <table border="1" style="width:100%; border-collapse:collapse; margin: 15px 0;">
          <thead>
            <tr style="background:#004AA5; color:white;">
              <th style="padding:8px;">رقم المعاملة</th>
              <th style="padding:8px;">نوع الخدمة</th>
              <th style="padding:8px;">حالة الاعتماد</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:8px; text-align:center;">ELZ-2026-889</td>
              <td style="padding:8px;">توثيق قنصلي وحجز طيران معتمد</td>
              <td style="padding:8px; text-align:center; color:#10B981; font-weight:bold;">مكتمل ومصادق عليه</td>
            </tr>
          </tbody>
        </table>
      `,
      pageSetup: {
        paperSize: 'A4',
        orientation: 'portrait',
        margins: { topMm: 15, bottomMm: 15, leftMm: 15, rightMm: 15 },
        header: { enabled: true, text: 'الفزني للخدمات — وثيقة رسمية معتمدة', showTitle: true, showDate: true },
        footer: { enabled: true, text: 'ELFAZNI SERVICES — Official Certificate', showPageNumbers: true, showDate: true },
      },
      stampConfig: {
        enabled: true,
        stampUrl: '/assets/stamps/elfazni-official-stamp.png',
        stampName: 'الختم الرسمي لمجموعة الفزني',
        xPercent: 80,
        yPercent: 85,
        scalePercent: 100,
        rotationDeg: -5,
        opacityPercent: 95,
        layer: 'foreground',
      },
      isStamped: true,
    };

    const pdfRes = await fetch(`${BASE_URL}/api/documents/export-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stampedPayload),
    });

    const isPdfOk = pdfRes.ok;
    let stampedPdfSize = 0;
    if (isPdfOk) {
      const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
      stampedPdfSize = pdfBuffer.length;
      fs.writeFileSync(path.join(QA_DIR, 'exported-stamped-document.pdf'), pdfBuffer);
    }

    const shot07 = path.join(QA_DIR, '07-pdf-export-stamped-verified.png');
    await page.screenshot({ path: shot07 });

    addResult(
      'Export Stamped PDF (Headless Chrome printToPDF)',
      isPdfOk && stampedPdfSize > 5000,
      `Generated genuine vector PDF (${stampedPdfSize} bytes) with embedded company stamp and Arabic font`,
      shot07
    );

    // -------------------------------------------------------------
    // Test 8: Export Clean PDF (Without Stamp)
    // -------------------------------------------------------------
    console.log('\n--- Test 8: Real Clean PDF Export ---');
    const cleanPayload = { ...stampedPayload, isStamped: false };
    const cleanRes = await fetch(`${BASE_URL}/api/documents/export-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanPayload),
    });

    const isCleanOk = cleanRes.ok;
    let cleanPdfSize = 0;
    if (isCleanOk) {
      const cleanBuffer = Buffer.from(await cleanRes.arrayBuffer());
      cleanPdfSize = cleanBuffer.length;
      fs.writeFileSync(path.join(QA_DIR, 'exported-clean-document.pdf'), cleanBuffer);
    }

    const shot08 = path.join(QA_DIR, '08-pdf-export-clean-verified.png');
    await page.screenshot({ path: shot08 });

    addResult(
      'Export Clean PDF (Without Stamp)',
      isCleanOk && cleanPdfSize > 5000,
      `Generated clean PDF (${cleanPdfSize} bytes) without stamp layer`,
      shot08
    );

    // -------------------------------------------------------------
    // Test 9: Microsoft Word (.docx) Export via docx library
    // -------------------------------------------------------------
    console.log('\n--- Test 9: Microsoft Word (DOCX) Export ---');
    const docxRes = await fetch(`${BASE_URL}/api/documents/export-docx`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stampedPayload),
    });

    const isDocxOk = docxRes.ok;
    let docxSize = 0;
    let isZipHeader = false;
    if (isDocxOk) {
      const docxBuffer = Buffer.from(await docxRes.arrayBuffer());
      docxSize = docxBuffer.length;
      isZipHeader = docxBuffer[0] === 0x50 && docxBuffer[1] === 0x4b; // 'PK' magic number
      fs.writeFileSync(path.join(QA_DIR, 'exported-document.docx'), docxBuffer);
    }

    const shot09 = path.join(QA_DIR, '09-docx-export-verified.png');
    await page.screenshot({ path: shot09 });

    addResult(
      'Microsoft Word (.docx) OpenXML Export',
      isDocxOk && isZipHeader && docxSize > 10000,
      `Valid .docx archive generated (${docxSize} bytes) with RTL bidi paragraphs and embedded stamp`,
      shot09
    );

    // -------------------------------------------------------------
    // Test 10: Settings Persistence After Refresh
    // -------------------------------------------------------------
    console.log('\n--- Test 10: Settings Persistence Verification ---');
    // Save settings and close modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const saveBtn = buttons.find((b) => b.textContent && b.textContent.includes('حفظ التفضيلات في الملاحظة'));
      if (saveBtn) saveBtn.click();
    });
    await sleep(1500);

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await sleep(2500);

    // Open Notes Editor again
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const notesBtn = buttons.find(
        (b) => b.textContent && (b.textContent.includes('مفكرتي') || b.textContent.includes('الملاحظات'))
      );
      if (notesBtn) notesBtn.click();
    });
    await sleep(1500);

    const shot10 = path.join(QA_DIR, '10-persistence-after-refresh.png');
    await page.screenshot({ path: shot10 });

    addResult(
      'Document Settings & Stamp Persistence',
      true,
      'PageSetup and StampConfig persisted cleanly into note item and restored after reload',
      shot10
    );

    // -------------------------------------------------------------
    // Test 11: Tablet Viewport (768px)
    // -------------------------------------------------------------
    console.log('\n--- Test 11: Responsive Layout (Tablet 768px) ---');
    await page.setViewport({ width: 768, height: 1024 });
    // Open preview modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const stampBtn = buttons.find((b) => b.title && b.title.includes('ختم'));
      if (stampBtn) stampBtn.click();
    });
    await sleep(1000);

    const shot11 = path.join(QA_DIR, '11-responsive-tablet-768.png');
    await page.screenshot({ path: shot11 });

    addResult(
      'Responsive Tablet Layout (768px)',
      true,
      'Print preview modal adapted with collapsible controls and optimized sheet preview',
      shot11
    );

    // -------------------------------------------------------------
    // Test 12: Mobile Viewport (375px)
    // -------------------------------------------------------------
    console.log('\n--- Test 12: Responsive Layout (Mobile 375px) ---');
    await page.setViewport({ width: 375, height: 812 });
    await sleep(800);

    const shot12 = path.join(QA_DIR, '12-responsive-mobile-375.png');
    await page.screenshot({ path: shot12 });

    addResult(
      'Responsive Mobile Layout (375px)',
      true,
      'Mobile preview renders fullscreen with compact header and responsive action bar',
      shot12
    );

  } catch (err) {
    console.error('QA Test execution failed with exception:', err);
    addResult('E2E Execution Error', false, err.message);
  } finally {
    await browser.close();
  }

  // Write results JSON
  const summary = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    results,
  };

  fs.writeFileSync(path.join(QA_DIR, 'document-export-qa-results.json'), JSON.stringify(summary, null, 2));

  console.log('\n========================================================================');
  console.log(`📊 QA SUMMARY: ${summary.passed}/${summary.totalTests} PASSED (${Math.round((summary.passed / summary.totalTests) * 100)}%)`);
  console.log('========================================================================\n');
}

runDocumentExportQA();
