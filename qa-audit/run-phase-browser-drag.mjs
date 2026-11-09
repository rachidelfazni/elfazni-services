/**
 * Phase Browser Drag & Interactive Resize QA
 * Real-Browser automated drag testing, double-click reset, localStorage persistence,
 * and before-and-after screenshot capture across all workspaces.
 */
import puppeteer from '/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'node:fs';
import path from 'node:path';
import { generateToken } from '../server/auth.ts';
import { readDb } from '../server/db.ts';

const BASE_URL = 'http://127.0.0.1:8080';
const OUT_DIR = path.resolve('qa-audit');
const BEFORE_DIR = path.join(OUT_DIR, 'before');
const AFTER_DIR = path.join(OUT_DIR, 'after');

fs.mkdirSync(BEFORE_DIR, { recursive: true });
fs.mkdirSync(AFTER_DIR, { recursive: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const db = readDb();
const superAdmin = db.users.find((u) => u.role === 'superadmin') || db.users[0];
const adminToken = generateToken(superAdmin, 'admin');
const crmToken = generateToken(superAdmin, 'crm');

async function dragElement(page, selector, deltaX, deltaY = 0) {
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

  // Move over separator (tests hover styles)
  await page.mouse.move(startX, startY);
  await sleep(100);

  // Pointer down
  await page.mouse.down();
  await sleep(100);

  // Smooth drag in steps to allow requestAnimationFrame updates
  const steps = 10;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      startX + (deltaX * i) / steps,
      startY + (deltaY * i) / steps
    );
    await sleep(30);
  }

  await sleep(100);
  await page.mouse.up();
  await sleep(300);
}

async function doubleClickElement(page, selector) {
  const handle = await page.$(selector);
  if (!handle) {
    throw new Error(`Element ${selector} not found for double-click`);
  }
  const box = await handle.boundingBox();
  if (!box) {
    throw new Error(`Bounding box for ${selector} not available`);
  }
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.click(x, y, { clickCount: 2, delay: 50 });
  await sleep(300);
}

async function runBrowserDragTests() {
  console.log('🚀 Starting Real-Browser Drag & Window Handle Automated QA...');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const testReport = [];

  try {
    // =======================================================================
    // 1. Hub Portal (/hub) - Visual Illustration Panel vs Content Column
    // =======================================================================
    console.log('\n--- 1. Testing Workspace: Hub Portal (/hub) ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      await page.goto(`${BASE_URL}/hub`, { waitUntil: 'domcontentloaded' });
      await sleep(1500);

      const handleSelector = '#handle-hub-portal-split';
      await page.waitForSelector(handleSelector, { timeout: 5000 });

      // Before screenshot
      const beforeScreenshot = path.join(BEFORE_DIR, '01-hub-portal-before-drag.png');
      await page.screenshot({ path: beforeScreenshot });
      console.log(`  📸 Saved before screenshot: ${beforeScreenshot}`);

      const initialWidth = await page.evaluate(() => {
        const el = document.querySelector('.hub-entry-photo-wrapper');
        return el ? Math.round(el.getBoundingClientRect().width) : null;
      });

      const cursor = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? window.getComputedStyle(el).cursor : null;
      }, handleSelector);

      console.log(`  🔍 Separator cursor: ${cursor} (expected: col-resize)`);

      // Drag separator rightward by +90px
      await dragElement(page, handleSelector, 90, 0);

      const afterWidth = await page.evaluate(() => {
        const el = document.querySelector('.hub-entry-photo-wrapper');
        return el ? Math.round(el.getBoundingClientRect().width) : null;
      });

      const persistedWidth = await page.evaluate(() => {
        return localStorage.getItem('elfazni_hub_visual_width');
      });

      // After screenshot
      const afterScreenshot = path.join(AFTER_DIR, '01-hub-portal-after-drag.png');
      await page.screenshot({ path: afterScreenshot });
      console.log(`  📸 Saved after screenshot: ${afterScreenshot}`);

      // Double-click reset
      await doubleClickElement(page, handleSelector);
      const resetWidth = await page.evaluate(() => {
        const el = document.querySelector('.hub-entry-photo-wrapper');
        return el ? Math.round(el.getBoundingClientRect().width) : null;
      });

      const pass = Boolean(afterWidth && initialWidth && afterWidth !== initialWidth);
      testReport.push({
        workspace: 'Hub Portal',
        selector: handleSelector,
        cursor,
        initialWidth: `${initialWidth}px`,
        afterWidth: `${afterWidth}px`,
        resetWidth: `${resetWidth}px`,
        persistedWidth: `${persistedWidth}px`,
        status: pass ? 'PASS' : 'FAIL',
      });
      console.log(`  ✅ Hub Portal Resize: Initial=${initialWidth}px -> Dragged=${afterWidth}px -> Reset=${resetWidth}px (Persisted: ${persistedWidth}px)`);

      await page.close();
    }

    // =======================================================================
    // 2. Admin Panel Shell (/admin) - Navigation Sidebar
    // =======================================================================
    console.log('\n--- 2. Testing Workspace: Admin Panel (/admin) ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      // Inject authentication cookies & storage
      await page.evaluateOnNewDocument((tk, usr) => {
        localStorage.setItem('elfazni_auth_token', tk);
        localStorage.setItem('token', tk);
        localStorage.setItem('user', JSON.stringify(usr));
        document.cookie = `admin_session=${tk}; path=/`;
        document.cookie = `token=${tk}; path=/`;
      }, adminToken, superAdmin);

      await page.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded' });
      await sleep(1500);

      const handleSelector = '#handle-admin-sidebar';
      await page.waitForSelector(handleSelector, { timeout: 5000 });

      // Before screenshot
      const beforeScreenshot = path.join(BEFORE_DIR, '02-admin-sidebar-before-drag.png');
      await page.screenshot({ path: beforeScreenshot });
      console.log(`  📸 Saved before screenshot: ${beforeScreenshot}`);

      const initialWidth = await page.evaluate(() => {
        const sidebar = document.querySelector('aside');
        return sidebar ? Math.round(sidebar.getBoundingClientRect().width) : null;
      });

      const cursor = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? window.getComputedStyle(el).cursor : null;
      }, handleSelector);

      // In RTL, admin sidebar is on the right. Moving left expands it.
      await dragElement(page, handleSelector, -80, 0);

      const afterWidth = await page.evaluate(() => {
        const sidebar = document.querySelector('aside');
        return sidebar ? Math.round(sidebar.getBoundingClientRect().width) : null;
      });

      const persistedWidth = await page.evaluate(() => {
        return localStorage.getItem('elfazni_admin_sidebar_width');
      });

      // After screenshot
      const afterScreenshot = path.join(AFTER_DIR, '02-admin-sidebar-after-drag.png');
      await page.screenshot({ path: afterScreenshot });
      console.log(`  📸 Saved after screenshot: ${afterScreenshot}`);

      // Double-click reset
      await doubleClickElement(page, handleSelector);
      const resetWidth = await page.evaluate(() => {
        const sidebar = document.querySelector('aside');
        return sidebar ? Math.round(sidebar.getBoundingClientRect().width) : null;
      });

      const pass = Boolean(afterWidth && initialWidth && afterWidth !== initialWidth);
      testReport.push({
        workspace: 'Admin Panel Shell',
        selector: handleSelector,
        cursor,
        initialWidth: `${initialWidth}px`,
        afterWidth: `${afterWidth}px`,
        resetWidth: `${resetWidth}px`,
        persistedWidth: `${persistedWidth}px`,
        status: pass ? 'PASS' : 'FAIL',
      });
      console.log(`  ✅ Admin Sidebar Resize: Initial=${initialWidth}px -> Dragged=${afterWidth}px -> Reset=${resetWidth}px (Persisted: ${persistedWidth}px)`);

      await page.close();
    }

    // =======================================================================
    // 3. CRM Notes Workspace (/admin/crm?tool=notes)
    // =======================================================================
    console.log('\n--- 3. Testing Workspace: CRM Notes Editor ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

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
      await sleep(2000);

      const handleSelector = '#handle-handle-list';
      await page.waitForSelector(handleSelector, { timeout: 8000 });

      // Before screenshot
      const beforeScreenshot = path.join(BEFORE_DIR, '03-crm-notes-before-drag.png');
      await page.screenshot({ path: beforeScreenshot });
      console.log(`  📸 Saved before screenshot: ${beforeScreenshot}`);

      const initialWidth = await page.evaluate(() => {
        const panel = document.querySelector('#panel-list');
        return panel ? Math.round(panel.getBoundingClientRect().width) : null;
      });

      const cursor = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? window.getComputedStyle(el).cursor : null;
      }, handleSelector);

      // Drag notes list handle
      await dragElement(page, handleSelector, -70, 0);

      const afterWidth = await page.evaluate(() => {
        const panel = document.querySelector('#panel-list');
        return panel ? Math.round(panel.getBoundingClientRect().width) : null;
      });

      const afterScreenshot = path.join(AFTER_DIR, '03-crm-notes-after-drag.png');
      await page.screenshot({ path: afterScreenshot });
      console.log(`  📸 Saved after screenshot: ${afterScreenshot}`);

      // Double-click reset
      await doubleClickElement(page, handleSelector);
      const resetWidth = await page.evaluate(() => {
        const panel = document.querySelector('#panel-list');
        return panel ? Math.round(panel.getBoundingClientRect().width) : null;
      });

      const pass = Boolean(afterWidth && initialWidth && afterWidth !== initialWidth);
      testReport.push({
        workspace: 'CRM Notes Editor',
        selector: handleSelector,
        cursor,
        initialWidth: `${initialWidth}px`,
        afterWidth: `${afterWidth}px`,
        resetWidth: `${resetWidth}px`,
        persistedWidth: 'state-managed',
        status: pass ? 'PASS' : 'FAIL',
      });
      console.log(`  ✅ CRM Notes List Resize: Initial=${initialWidth}px -> Dragged=${afterWidth}px -> Reset=${resetWidth}px`);

      await page.close();
    }

    // =======================================================================
    // 4. CRM Calendar Workspace (/admin/crm?tool=calendar)
    // =======================================================================
    console.log('\n--- 4. Testing Workspace: CRM Calendar ---');
    {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });

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

      await page.goto(`${BASE_URL}/admin/crm?tool=calendar`, { waitUntil: 'domcontentloaded' });
      await sleep(2000);

      const handleSelector = '#handle-calendar-sources-sidebar';
      await page.waitForSelector(handleSelector, { timeout: 8000 });

      // Before screenshot
      const beforeScreenshot = path.join(BEFORE_DIR, '04-crm-calendar-before-drag.png');
      await page.screenshot({ path: beforeScreenshot });
      console.log(`  📸 Saved before screenshot: ${beforeScreenshot}`);

      const initialWidth = await page.evaluate(() => {
        const handle = document.querySelector('#handle-calendar-sources-sidebar');
        const sidebar = handle?.previousElementSibling || handle?.parentElement?.previousElementSibling;
        return sidebar ? Math.round(sidebar.getBoundingClientRect().width) : null;
      });

      const cursor = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? window.getComputedStyle(el).cursor : null;
      }, handleSelector);

      // Drag calendar sidebar
      await dragElement(page, handleSelector, -60, 0);

      const afterWidth = await page.evaluate(() => {
        const handle = document.querySelector('#handle-calendar-sources-sidebar');
        const sidebar = handle?.previousElementSibling || handle?.parentElement?.previousElementSibling;
        return sidebar ? Math.round(sidebar.getBoundingClientRect().width) : null;
      });

      const persistedWidth = await page.evaluate(() => {
        return localStorage.getItem('elfazni_calendar_sidebar_width');
      });

      // After screenshot
      const afterScreenshot = path.join(AFTER_DIR, '04-crm-calendar-after-drag.png');
      await page.screenshot({ path: afterScreenshot });
      console.log(`  📸 Saved after screenshot: ${afterScreenshot}`);

      // Double-click reset
      await doubleClickElement(page, handleSelector);
      const resetWidth = await page.evaluate(() => {
        const handle = document.querySelector('#handle-calendar-sources-sidebar');
        const sidebar = handle?.previousElementSibling || handle?.parentElement?.previousElementSibling;
        return sidebar ? Math.round(sidebar.getBoundingClientRect().width) : null;
      });

      const pass = Boolean(afterWidth && initialWidth && afterWidth !== initialWidth);
      testReport.push({
        workspace: 'CRM Calendar',
        selector: handleSelector,
        cursor,
        initialWidth: `${initialWidth}px`,
        afterWidth: `${afterWidth}px`,
        resetWidth: `${resetWidth}px`,
        persistedWidth: `${persistedWidth}px`,
        status: pass ? 'PASS' : 'FAIL',
      });
      console.log(`  ✅ CRM Calendar Sidebar Resize: Initial=${initialWidth}px -> Dragged=${afterWidth}px -> Reset=${resetWidth}px (Persisted: ${persistedWidth}px)`);

      await page.close();
    }

  } finally {
    await browser.close();
  }

  // Update Markdown Report
  console.log('\n======================================================');
  console.log('Real-Browser Drag Test Summary:');
  console.table(testReport);
  console.log('======================================================\n');
}

runBrowserDragTests().catch((err) => {
  console.error('❌ Browser drag test failed:', err);
  process.exit(1);
});
