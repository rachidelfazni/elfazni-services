import puppeteer from '/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'node:fs';
import path from 'node:path';
import { generateToken } from '../server/auth.ts';
import { readDb } from '../server/db.ts';

const BASE_URL = 'http://127.0.0.1:8080';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const db = readDb();
const superAdmin = db.users.find((u) => u.role === 'superadmin') || db.users[0];
const adminToken = generateToken(superAdmin, 'admin');
const crmToken = generateToken(superAdmin, 'crm');

const DEVICES = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'tablet', width: 768, height: 1024, isMobile: true },
  { name: 'mobile', width: 375, height: 812, isMobile: true },
];

async function runResponsiveQA() {
  console.log('========================================================================');
  console.log('📱 PHASE 9: MULTI-DEVICE RESPONSIVE VISUAL AUDIT (Desktop, Tablet, Mobile)');
  console.log('========================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const results = [];
  const addResult = (test, passed, details = '', screenshot = '') => {
    const symbol = passed ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(`  ${symbol} ${test} ${details ? `(${details})` : ''}`);
    results.push({ test, passed, details, screenshot });
  };

  try {
    for (const dev of DEVICES) {
      console.log(`\n--- Capturing Device: ${dev.name.toUpperCase()} (${dev.width}x${dev.height}) ---`);
      const page = await browser.newPage();
      await page.setViewport({ width: dev.width, height: dev.height, isMobile: dev.isMobile });

      // 1. Website Homepage
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await sleep(1500);
      const shotWeb = `qa/screenshots/responsive/01-website-${dev.name}.png`;
      await page.screenshot({ path: path.resolve(shotWeb) });
      addResult(`Website Homepage: ${dev.name}`, true, `${dev.width}px viewport`, shotWeb);

      // 2. Admin Theme Studio
      await page.setCookie(
        { name: 'token', value: adminToken, domain: '127.0.0.1', path: '/' },
        { name: 'admin_session', value: adminToken, domain: '127.0.0.1', path: '/' }
      );
      await page.evaluateOnNewDocument((tk, usr) => {
        localStorage.setItem('elfazni_auth_token', tk);
        localStorage.setItem('token', tk);
        localStorage.setItem('user', JSON.stringify(usr));
        document.cookie = `admin_session=${tk}; path=/`;
        document.cookie = `token=${tk}; path=/`;
      }, adminToken, superAdmin);

      await page.goto(`${BASE_URL}/admin?section=theme`, { waitUntil: 'domcontentloaded' });
      await sleep(2000);
      const shotTheme = `qa/screenshots/responsive/02-admin-theme-${dev.name}.png`;
      await page.screenshot({ path: path.resolve(shotTheme) });
      addResult(`Admin Theme Studio: ${dev.name}`, true, `${dev.width}px viewport`, shotTheme);

      // 3. CRM Notes Editor
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

      await page.goto(`${BASE_URL}/admin/crm/?tab=notes`, { waitUntil: 'domcontentloaded' });
      await sleep(2000);
      const shotNotes = `qa/screenshots/responsive/03-crm-notes-${dev.name}.png`;
      await page.screenshot({ path: path.resolve(shotNotes) });
      addResult(`CRM Notes Editor: ${dev.name}`, true, `${dev.width}px viewport`, shotNotes);

      // 4. CRM Customers
      await page.goto(`${BASE_URL}/admin/crm/?tab=customers`, { waitUntil: 'domcontentloaded' });
      await sleep(2000);
      const shotCust = `qa/screenshots/responsive/04-crm-customers-${dev.name}.png`;
      await page.screenshot({ path: path.resolve(shotCust) });
      addResult(`CRM Customers Module: ${dev.name}`, true, `${dev.width}px viewport`, shotCust);

      await page.close();
    }

    console.log('\n========================================================================');
    console.log(`🎉 RESPONSIVE AUDIT COMPLETE: ${results.filter(r => r.passed).length}/${results.length} tests passed`);
    console.log('========================================================================\n');
  } catch (err) {
    console.error('Responsive audit error:', err);
  } finally {
    await browser.close();
  }

  return results;
}

runResponsiveQA().then(res => {
  fs.writeFileSync('qa/responsive-qa-results.json', JSON.stringify(res, null, 2));
});
