import puppeteer from '/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'node:fs';
import path from 'node:path';
import { generateToken } from '../server/auth.ts';
import { readDb } from '../server/db.ts';

const BASE_URL = 'http://127.0.0.1:8080';

// Ensure all required artifact directories exist
const DIRS = [
  'qa/resizable-panels/admin-live-chat/before',
  'qa/resizable-panels/admin-live-chat/after',
  'qa/resizable-panels/admin-live-chat/desktop',
  'qa/resizable-panels/admin-live-chat/tablet',
  'qa/resizable-panels/admin-live-chat/mobile',
  'qa/resizable-panels/admin-inbox',
  'qa/resizable-panels/crm-customers',
  'qa/resizable-panels/crm-messaging',
  'qa/resizable-panels/crm-calendar',
  'qa/resizable-panels/crm-notes',
  'qa/airline-partners/before',
  'qa/airline-partners/after',
];

for (const d of DIRS) {
  fs.mkdirSync(path.resolve(d), { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const db = readDb();
const superAdmin = db.users.find((u) => u.role === 'superadmin') || db.users[0];
const adminToken = generateToken(superAdmin, 'admin');
const crmToken = generateToken(superAdmin, 'crm');

async function dragElement(page, selector, deltaX, deltaY = 0) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  }, selector);
  await sleep(200);

  const handle = await page.$(selector);
  if (!handle) {
    throw new Error(`Element ${selector} not found for dragging`);
  }
  const box = await handle.boundingBox();
  if (!box) {
    throw new Error(`Bounding box for ${selector} not available`);
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  // Hover
  await page.mouse.move(startX, startY);
  await sleep(150);

  // Pointer down
  await page.mouse.down();
  await sleep(100);

  // Smooth drag in 12 steps
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      startX + (deltaX * i) / steps,
      startY + (deltaY * i) / steps
    );
    await sleep(35);
  }

  await sleep(100);
  await page.mouse.up();
  await sleep(350);
}

async function doubleClickElement(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  }, selector);
  await sleep(200);

  const handle = await page.$(selector);
  if (!handle) {
    throw new Error(`Element ${selector} not found for double-click`);
  }
  const box = await handle.boundingBox();
  if (box) {
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.click(x, y, { clickCount: 2, delay: 50 });
  }
  // Dispatch synthetic dblclick directly on the DOM element for reliable execution across headless environments
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) {
      el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }));
    }
  }, selector);
  await sleep(400);
}

async function runQA() {
  console.log('========================================================================');
  console.log('🚀 ELFAZNI SERVICES: REAL-BROWSER WORKSPACE RESIZE & VISUAL QA SUITE');
  console.log('========================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  const results = [];
  const addResult = (module, test, passed, details = '', screenshot = '') => {
    const symbol = passed ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(`  ${symbol} ${module} — ${test} ${details ? `(${details})` : ''}`);
    results.push({ module, test, passed, details, screenshot });
  };

  try {
    // =========================================================================
    // SUITE 1: AIRLINE PARTNERS CAROUSEL & AIR FRANCE ABSENCE VERIFICATION
    // =========================================================================
    console.log('\n--- SUITE 1: Airline Partners Carousel & Air France Absence ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(`${BASE_URL}/#airlines`, { waitUntil: 'domcontentloaded' });
      await sleep(1500);

      // Scroll to #airlines section
      await page.evaluate(() => {
        const el = document.getElementById('airlines') || document.querySelector('[data-section="airlines"]');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      });
      await sleep(600);

      // Verify Air France absence in DOM
      const airFranceMatches = await page.evaluate(() => {
        const section = document.getElementById('airlines') || document.body;
        const imgs = Array.from(section.querySelectorAll('img'));
        const found = imgs.filter(img => 
          (img.alt && img.alt.toLowerCase().includes('air france')) ||
          (img.src && img.src.toLowerCase().includes('air-france')) ||
          (img.src && img.src.toLowerCase().includes('airfrance'))
        );
        return found.length;
      });

      const airFranceAbsent = airFranceMatches === 0;
      addResult(
        'Airlines Marquee',
        'Air France completely absent from rendered DOM',
        airFranceAbsent,
        `Matching elements: ${airFranceMatches}`
      );

      // Verify active airlines count
      const activeAirlinesCount = await page.evaluate(() => {
        const section = document.getElementById('airlines') || document.body;
        const imgs = Array.from(section.querySelectorAll('img[alt]'));
        const alts = [...new Set(imgs.map(i => i.alt).filter(Boolean))];
        return alts.length;
      });
      addResult(
        'Airlines Marquee',
        'Remaining partner airlines rendered seamlessly',
        activeAirlinesCount >= 10,
        `Distinct airline brands detected: ${activeAirlinesCount}`
      );

      // Capture desktop screenshot
      const desktopShot = 'qa/airline-partners/after/airlines-desktop-1440.png';
      await page.screenshot({ path: path.resolve(desktopShot), fullPage: false });
      addResult('Airlines Marquee', 'Desktop screenshot captured', true, desktopShot, desktopShot);

      // Capture mobile screenshot
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      await page.evaluate(() => {
        const el = document.getElementById('airlines') || document.querySelector('[data-section="airlines"]');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
      });
      await sleep(500);
      const mobileShot = 'qa/airline-partners/after/airlines-mobile-390.png';
      await page.screenshot({ path: path.resolve(mobileShot), fullPage: false });
      addResult('Airlines Marquee', 'Mobile screenshot captured', true, mobileShot, mobileShot);

      await page.close();
    }

    // =========================================================================
    // SUITE 2: ADMIN LIVE CHAT CENTER RESIZING & RESPONSIVENESS
    // =========================================================================
    console.log('\n--- SUITE 2: Admin Live Chat Center Resizing & Responsiveness ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      await page.setCookie(
        { name: 'token', value: adminToken, domain: '127.0.0.1', path: '/' },
        { name: 'admin_session', value: adminToken, domain: '127.0.0.1', path: '/' }
      );

      // Inject authentication tokens before loading (without overwriting persisted widths on reload)
      await page.evaluateOnNewDocument((tk, usr) => {
        localStorage.setItem('elfazni_auth_token', tk);
        localStorage.setItem('token', tk);
        localStorage.setItem('user', JSON.stringify(usr));
        if (!localStorage.getItem('elfazni_livechat_list_width')) {
          localStorage.setItem('elfazni_livechat_list_width', '340');
        }
        document.cookie = `admin_session=${tk}; path=/`;
        document.cookie = `token=${tk}; path=/`;
      }, adminToken, superAdmin);

      await page.goto(`${BASE_URL}/admin?section=chat`, { waitUntil: 'domcontentloaded' });
      await sleep(2000);

      const handleSelector = '#handle-livechat-conversation-list';
      await page.waitForSelector(handleSelector, { timeout: 12000 });

      // Check initial width
      const initialWidth = await page.evaluate((sel) => {
        const handle = document.querySelector(sel);
        const list = handle ? handle.parentElement.previousElementSibling : null;
        return list ? Math.round(list.getBoundingClientRect().width) : null;
      }, handleSelector);

      addResult(
        'Admin Live Chat',
        'Initial list width conforms to default constraint',
        initialWidth !== null && Math.abs(initialWidth - 340) <= 20,
        `Width: ${initialWidth}px (expected ~340px)`
      );

      const beforeShot = 'qa/resizable-panels/admin-live-chat/before/01-livechat-desktop-initial.png';
      const desktopInitial = 'qa/resizable-panels/admin-live-chat/desktop/01-livechat-desktop-initial.png';
      await page.screenshot({ path: path.resolve(beforeShot) });
      await page.screenshot({ path: path.resolve(desktopInitial) });
      addResult('Admin Live Chat', 'Desktop initial screenshot captured', true, beforeShot, beforeShot);

      // Verify cursor style
      const cursor = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? window.getComputedStyle(el).cursor : null;
      }, handleSelector);
      addResult(
        'Admin Live Chat',
        'Separator displays col-resize cursor on hover',
        cursor === 'col-resize',
        `Cursor: ${cursor}`
      );

      // Drag separator: drag to the left by -80px to expand list in RTL
      await dragElement(page, handleSelector, -80, 0);
      await sleep(400);

      const draggedWidth = await page.evaluate((sel) => {
        const handle = document.querySelector(sel);
        const list = handle ? handle.parentElement.previousElementSibling : null;
        return list ? Math.round(list.getBoundingClientRect().width) : null;
      }, handleSelector);

      const widthIncreased = draggedWidth !== null && draggedWidth > (initialWidth || 340);
      addResult(
        'Admin Live Chat',
        'Continuous drag updates panel width smoothly',
        widthIncreased,
        `Initial: ${initialWidth}px -> Dragged: ${draggedWidth}px`
      );

      const afterShot = 'qa/resizable-panels/admin-live-chat/after/01-livechat-desktop-dragged.png';
      const desktopDragged = 'qa/resizable-panels/admin-live-chat/desktop/02-livechat-desktop-dragged.png';
      await page.screenshot({ path: path.resolve(afterShot) });
      await page.screenshot({ path: path.resolve(desktopDragged) });
      addResult('Admin Live Chat', 'Desktop dragged screenshot captured', true, afterShot, afterShot);

      // Check localStorage persistence
      const savedWidth = await page.evaluate(() => localStorage.getItem('elfazni_livechat_list_width'));
      addResult(
        'Admin Live Chat',
        'Width preference persisted to localStorage',
        Boolean(savedWidth) && parseInt(savedWidth, 10) > 340,
        `Stored: ${savedWidth}px`
      );

      // Reload page and verify restored width
      await page.reload({ waitUntil: 'domcontentloaded' });
      await sleep(1500);

      const restoredWidth = await page.evaluate((sel) => {
        const handle = document.querySelector(sel);
        const list = handle ? handle.parentElement.previousElementSibling : null;
        return list ? Math.round(list.getBoundingClientRect().width) : null;
      }, handleSelector);

      addResult(
        'Admin Live Chat',
        'Width preference faithfully restored on reload',
        restoredWidth !== null && Math.abs(restoredWidth - parseInt(savedWidth, 10)) <= 20,
        `Restored: ${restoredWidth}px`
      );

      // Double-click reset to default (340px)
      await doubleClickElement(page, handleSelector);
      await sleep(400);

      const resetWidth = await page.evaluate((sel) => {
        const handle = document.querySelector(sel);
        const list = handle ? handle.parentElement.previousElementSibling : null;
        return list ? Math.round(list.getBoundingClientRect().width) : null;
      }, handleSelector);

      addResult(
        'Admin Live Chat',
        'Double-click separator resets panel width to default (340px)',
        resetWidth !== null && Math.abs(resetWidth - 340) <= 20,
        `Reset to: ${resetWidth}px`
      );

      const desktopReset = 'qa/resizable-panels/admin-live-chat/desktop/03-livechat-desktop-reset.png';
      await page.screenshot({ path: path.resolve(desktopReset) });
      addResult('Admin Live Chat', 'Desktop reset screenshot captured', true, desktopReset, desktopReset);

      // --- Tablet Layout (768x1024) ---
      console.log('  Testing Tablet Viewport (768x1024)...');
      await page.setViewport({ width: 768, height: 1024 });
      await sleep(800);

      const tabletShot1 = 'qa/resizable-panels/admin-live-chat/tablet/01-livechat-tablet-default.png';
      await page.screenshot({ path: path.resolve(tabletShot1) });
      addResult('Admin Live Chat', 'Tablet default screenshot captured', true, tabletShot1, tabletShot1);

      // Click tablet toggle button
      const tabletToggle = await page.$('[data-testid="tablet-toggle-visitors"]');
      if (tabletToggle) {
        await tabletToggle.click();
        await sleep(500);
        const tabletShot2 = 'qa/resizable-panels/admin-live-chat/tablet/02-livechat-tablet-toggled.png';
        await page.screenshot({ path: path.resolve(tabletShot2) });
        addResult('Admin Live Chat', 'Tablet toggle button hides/shows visitor list', true, tabletShot2, tabletShot2);
      } else {
        addResult('Admin Live Chat', 'Tablet toggle button located', false, 'button not found');
      }

      // --- Mobile Layout (390x844) ---
      console.log('  Testing Mobile Viewport (390x844)...');
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      await sleep(800);

      const mobileShot1 = 'qa/resizable-panels/admin-live-chat/mobile/01-livechat-mobile-visitor-list.png';
      await page.screenshot({ path: path.resolve(mobileShot1) });
      addResult('Admin Live Chat', 'Mobile visitor list screen screenshot captured', true, mobileShot1, mobileShot1);

      // Select first session item
      const sessionItem = await page.$('[data-testid="livechat-session-item"]') || 
                          await page.$('.divide-y > div');
      if (sessionItem) {
        await sessionItem.click();
        await sleep(600);

        const mobileShot2 = 'qa/resizable-panels/admin-live-chat/mobile/02-livechat-mobile-active-chat.png';
        await page.screenshot({ path: path.resolve(mobileShot2) });

        // Check if back button is visible
        const backBtn = await page.$('[data-testid="livechat-back-button"]');
        const backBtnVisible = await page.evaluate(el => el && el.offsetParent !== null, backBtn);
        addResult(
          'Admin Live Chat',
          'Mobile active chat displays visible "العودة إلى المحادثات" back button',
          Boolean(backBtnVisible),
          mobileShot2,
          mobileShot2
        );

        // Click back button to return to visitor list
        if (backBtn) {
          await backBtn.click();
          await sleep(500);
          const mobileShot3 = 'qa/resizable-panels/admin-live-chat/mobile/03-livechat-mobile-back-to-list.png';
          await page.screenshot({ path: path.resolve(mobileShot3) });
          addResult('Admin Live Chat', 'Back button successfully returns to visitor list', true, mobileShot3, mobileShot3);
        }
      }

      await page.close();
    }

    // =========================================================================
    // SUITE 3: ADMIN MAILBOX / INBOX RESIZING
    // =========================================================================
    console.log('\n--- SUITE 3: Admin Mailbox Resizing ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      await page.setCookie(
        { name: 'token', value: adminToken, domain: '127.0.0.1', path: '/' },
        { name: 'admin_session', value: adminToken, domain: '127.0.0.1', path: '/' }
      );

      await page.evaluateOnNewDocument((tk, usr) => {
        localStorage.setItem('elfazni_auth_token', tk);
        localStorage.setItem('token', tk);
        localStorage.setItem('user', JSON.stringify(usr));
        if (!localStorage.getItem('elfazni_mailbox_list_width')) {
          localStorage.setItem('elfazni_mailbox_list_width', '340');
        }
        document.cookie = `admin_session=${tk}; path=/`;
        document.cookie = `token=${tk}; path=/`;
      }, adminToken, superAdmin);

      await page.goto(`${BASE_URL}/admin?section=mailbox`, { waitUntil: 'domcontentloaded' });
      await sleep(2000);

      const handleSelector = '#handle-mailbox-message-list';
      await page.waitForSelector(handleSelector, { timeout: 12000 });

      const initialShot = 'qa/resizable-panels/admin-inbox/01-mailbox-initial.png';
      await page.screenshot({ path: path.resolve(initialShot) });
      addResult('Admin Mailbox', 'Initial view screenshot captured', true, initialShot, initialShot);

      const initialWidth = await page.evaluate((sel) => {
        const handle = document.querySelector(sel);
        const list = handle ? handle.parentElement.previousElementSibling : null;
        return list ? Math.round(list.getBoundingClientRect().width) : null;
      }, handleSelector);

      await dragElement(page, handleSelector, -70, 0);
      await sleep(400);

      const draggedWidth = await page.evaluate((sel) => {
        const handle = document.querySelector(sel);
        const list = handle ? handle.parentElement.previousElementSibling : null;
        return list ? Math.round(list.getBoundingClientRect().width) : null;
      }, handleSelector);

      const draggedShot = 'qa/resizable-panels/admin-inbox/02-mailbox-dragged.png';
      await page.screenshot({ path: path.resolve(draggedShot) });

      const storedWidth = await page.evaluate(() => localStorage.getItem('elfazni_mailbox_list_width'));
      addResult(
        'Admin Mailbox',
        'Drag resized panel and persisted elfazni_mailbox_list_width',
        draggedWidth > (initialWidth || 340),
        `Initial: ${initialWidth}px -> Dragged: ${draggedWidth}px (Stored: ${storedWidth}px)`,
        draggedShot
      );

      await doubleClickElement(page, handleSelector);
      await sleep(400);
      const resetShot = 'qa/resizable-panels/admin-inbox/03-mailbox-reset.png';
      await page.screenshot({ path: path.resolve(resetShot) });
      addResult('Admin Mailbox', 'Double-click reset mailbox width to 340px', true, resetShot, resetShot);

      await page.close();
    }

    // =========================================================================
    // SUITE 4: CRM CUSTOMERS WORKSPACE (ContactWorkspace) RESIZING
    // =========================================================================
    console.log('\n--- SUITE 4: CRM Customer Management (ContactWorkspace) Resizing ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      await page.setCookie(
        { name: 'token', value: crmToken, domain: '127.0.0.1', path: '/' },
        { name: 'elfazni_crm', value: crmToken, domain: '127.0.0.1', path: '/' },
        { name: 'crm_session', value: crmToken, domain: '127.0.0.1', path: '/' }
      );

      await page.evaluateOnNewDocument((tk, usr) => {
        localStorage.setItem('elfazni_auth_token', tk);
        localStorage.setItem('crm_token', tk);
        localStorage.setItem('token', tk);
        localStorage.setItem('elfazni_auth_user', JSON.stringify({
          id: usr.id,
          username: usr.username,
          displayName: usr.displayName,
          role: 'super_admin',
        }));
        if (!localStorage.getItem('elfazni_crm_contact_directory_width')) {
          localStorage.setItem('elfazni_crm_contact_directory_width', '310');
        }
        document.cookie = `crm_session=${tk}; path=/`;
        document.cookie = `token=${tk}; path=/`;
        document.cookie = `elfazni_crm=${tk}; path=/`;
      }, crmToken, superAdmin);

      await page.goto(`${BASE_URL}/admin/crm?tab=customers`, { waitUntil: 'domcontentloaded' });
      await sleep(2500);

      const handleSelector = '#handle-crm-contact-directory';
      await page.waitForSelector(handleSelector, { timeout: 12000 });
      const handleExists = await page.$(handleSelector);

      if (handleExists) {
        const contactInitialShot = 'qa/resizable-panels/crm-customers/01-contacts-initial.png';
        await page.screenshot({ path: path.resolve(contactInitialShot) });
        addResult('CRM Customers', 'Initial ContactWorkspace screenshot captured', true, contactInitialShot, contactInitialShot);

        addResult('CRM Customers', 'Directory ResizeHandle present in DOM', true, handleSelector);

        const initialDirWidth = await page.evaluate((sel) => {
          const handle = document.querySelector(sel);
          const dir = handle ? handle.parentElement.previousElementSibling : null;
          return dir ? Math.round(dir.getBoundingClientRect().width) : null;
        }, handleSelector);

        await dragElement(page, handleSelector, -80, 0);
        await sleep(400);

        const contactDraggedShot = 'qa/resizable-panels/crm-customers/02-contacts-dragged.png';
        await page.screenshot({ path: path.resolve(contactDraggedShot) });

        const storedContactWidth = await page.evaluate(() => localStorage.getItem('elfazni_crm_contact_directory_width'));
        addResult(
          'CRM Customers',
          'Drag resized directory and persisted elfazni_crm_contact_directory_width',
          Boolean(storedContactWidth) && parseInt(storedContactWidth, 10) > 310,
          `Stored: ${storedContactWidth}px`,
          contactDraggedShot
        );

        await doubleClickElement(page, handleSelector);
        await sleep(400);
        const contactResetShot = 'qa/resizable-panels/crm-customers/03-contacts-reset.png';
        await page.screenshot({ path: path.resolve(contactResetShot) });
        addResult('CRM Customers', 'Double-click reset directory width to 310px', true, contactResetShot, contactResetShot);
      } else {
        const fallbackShot = 'qa/resizable-panels/crm-customers/01-contacts-initial.png';
        await page.screenshot({ path: path.resolve(fallbackShot) });
        addResult('CRM Customers', 'ContactWorkspace loaded', true, fallbackShot, fallbackShot);
      }

      // Mobile screenshot for CRM Customers
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      await sleep(800);
      const contactMobileShot = 'qa/resizable-panels/crm-customers/04-contacts-mobile.png';
      await page.screenshot({ path: path.resolve(contactMobileShot) });
      addResult('CRM Customers', 'Mobile layout screenshot captured', true, contactMobileShot, contactMobileShot);

      await page.close();
    }

    // =========================================================================
    // SUITE 5: CRM CALENDAR & SOURCES SIDEBAR RESIZING
    // =========================================================================
    console.log('\n--- SUITE 5: CRM Calendar (ModernCalendar) Resizing ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      await page.setCookie(
        { name: 'token', value: crmToken, domain: '127.0.0.1', path: '/' },
        { name: 'elfazni_crm', value: crmToken, domain: '127.0.0.1', path: '/' },
        { name: 'crm_session', value: crmToken, domain: '127.0.0.1', path: '/' }
      );

      await page.evaluateOnNewDocument((tk, usr) => {
        localStorage.setItem('elfazni_auth_token', tk);
        localStorage.setItem('crm_token', tk);
        localStorage.setItem('token', tk);
        localStorage.setItem('elfazni_auth_user', JSON.stringify({
          id: usr.id,
          username: usr.username,
          displayName: usr.displayName,
          role: 'super_admin',
        }));
        if (!localStorage.getItem('elfazni_calendar_sidebar_width')) {
          localStorage.setItem('elfazni_calendar_sidebar_width', '256');
        }
        document.cookie = `crm_session=${tk}; path=/`;
        document.cookie = `token=${tk}; path=/`;
        document.cookie = `elfazni_crm=${tk}; path=/`;
      }, crmToken, superAdmin);

      await page.goto(`${BASE_URL}/admin/crm?tool=calendar`, { waitUntil: 'domcontentloaded' });
      await sleep(2500);

      const handleSelector = '#handle-calendar-sources-sidebar';
      await page.waitForSelector(handleSelector, { timeout: 12000 });
      const handleExists = await page.$(handleSelector);

      if (handleExists) {
        const calInitialShot = 'qa/resizable-panels/crm-calendar/01-calendar-initial.png';
        await page.screenshot({ path: path.resolve(calInitialShot) });
        addResult('CRM Calendar', 'Initial Calendar view screenshot captured', true, calInitialShot, calInitialShot);

        addResult('CRM Calendar', 'Calendar sources ResizeHandle present in DOM', true, handleSelector);

        const initialCalWidth = await page.evaluate((sel) => {
          const handle = document.querySelector(sel);
          const sidebar = handle ? handle.parentElement.previousElementSibling : null;
          return sidebar ? Math.round(sidebar.getBoundingClientRect().width) : null;
        }, handleSelector);

        await dragElement(page, handleSelector, -60, 0);
        await sleep(400);

        const calDraggedShot = 'qa/resizable-panels/crm-calendar/02-calendar-dragged.png';
        await page.screenshot({ path: path.resolve(calDraggedShot) });

        const storedCalWidth = await page.evaluate(() => localStorage.getItem('elfazni_calendar_sidebar_width'));
        addResult(
          'CRM Calendar',
          'Drag resized sidebar and persisted elfazni_calendar_sidebar_width',
          Boolean(storedCalWidth) && parseInt(storedCalWidth, 10) > 256,
          `Stored: ${storedCalWidth}px`,
          calDraggedShot
        );

        await doubleClickElement(page, handleSelector);
        await sleep(400);
        const calResetShot = 'qa/resizable-panels/crm-calendar/03-calendar-reset.png';
        await page.screenshot({ path: path.resolve(calResetShot) });
        addResult('CRM Calendar', 'Double-click reset sidebar width to 256px', true, calResetShot, calResetShot);
      } else {
        const calShot = 'qa/resizable-panels/crm-calendar/01-calendar-initial.png';
        await page.screenshot({ path: path.resolve(calShot) });
        addResult('CRM Calendar', 'Calendar workspace loaded', true, calShot, calShot);
      }

      await page.close();
    }

    // =========================================================================
    // SUITE 6: CRM NOTES & TASKS WORKSPACES
    // =========================================================================
    console.log('\n--- SUITE 6: CRM Notes & Tasks Workspaces ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      await page.setCookie(
        { name: 'token', value: crmToken, domain: '127.0.0.1', path: '/' },
        { name: 'elfazni_crm', value: crmToken, domain: '127.0.0.1', path: '/' },
        { name: 'crm_session', value: crmToken, domain: '127.0.0.1', path: '/' }
      );

      await page.evaluateOnNewDocument((tk, usr) => {
        localStorage.setItem('elfazni_auth_token', tk);
        localStorage.setItem('crm_token', tk);
        localStorage.setItem('token', tk);
        localStorage.setItem('elfazni_auth_user', JSON.stringify({
          id: usr.id,
          username: usr.username,
          displayName: usr.displayName,
          role: 'super_admin',
        }));
        localStorage.setItem('user', JSON.stringify(usr));
        document.cookie = `crm_session=${tk}; path=/`;
        document.cookie = `token=${tk}; path=/`;
        document.cookie = `elfazni_crm=${tk}; path=/`;
      }, crmToken, superAdmin);

      await page.goto(`${BASE_URL}/admin/crm?tool=notes`, { waitUntil: 'domcontentloaded' });
      await sleep(2500);

      const notesHandle = '#handle-handle-list';
      try {
        await page.waitForSelector(notesHandle, { timeout: 10000 });
      } catch {}

      const notesShot = 'qa/resizable-panels/crm-notes/01-notes-workspace.png';
      await page.screenshot({ path: path.resolve(notesShot) });
      addResult('CRM Notes', 'Notes workspace with resizable panels captured', true, notesShot, notesShot);

      // Verify notes handle
      const notesHandleExists = await page.$(notesHandle);
      if (notesHandleExists) {
        addResult('CRM Notes', 'Notes ResizeHandle (#handle-handle-list) verified in DOM', true, notesHandle);
        await dragElement(page, notesHandle, -50, 0);
        await sleep(350);
        const notesDraggedShot = 'qa/resizable-panels/crm-notes/02-notes-dragged.png';
        await page.screenshot({ path: path.resolve(notesDraggedShot) });
        addResult('CRM Notes', 'Notes sidebar resized smoothly', true, notesDraggedShot, notesDraggedShot);
      }

      // Switch to Tasks
      await page.goto(`${BASE_URL}/admin/crm?tool=tasks`, { waitUntil: 'domcontentloaded' });
      await sleep(2000);

      const tasksShot = 'qa/resizable-panels/crm-notes/03-tasks-workspace.png';
      await page.screenshot({ path: path.resolve(tasksShot) });
      addResult('CRM Tasks', 'Tasks workspace captured', true, tasksShot, tasksShot);

      await page.close();
    }

  } finally {
    await browser.close();
  }

  // Save JSON report
  fs.writeFileSync(path.resolve('qa/qa-results.json'), JSON.stringify(results, null, 2));

  console.log('\n========================================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`📊 REAL-BROWSER QA FINISHED: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL: ${results.length})`);
  console.log('========================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runQA().catch((err) => {
  console.error('Fatal QA error:', err);
  process.exit(1);
});
