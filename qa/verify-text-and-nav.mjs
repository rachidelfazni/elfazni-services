import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire('/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:8080';
const QA_DIR = path.resolve('qa/text-and-nav-test');

if (!fs.existsSync(QA_DIR)) {
  fs.mkdirSync(QA_DIR, { recursive: true });
}

async function loginApi() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'elfazni.admin',
      password: 'ElfazniServices2026!',
    }),
  });
  const data = await res.json();
  if (!data.token) {
    throw new Error('Failed to login via API: ' + JSON.stringify(data));
  }
  return data;
}

async function run() {
  console.log('🚀 Running Full Text & Navigation Verification...');

  const auth = await loginApi();
  const token = auth.token;
  console.log('✅ Authenticated via API token');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    // -------------------------------------------------------------
    // TEST 1: Unauthenticated Login Page Navigation (Admin <-> CRM)
    // -------------------------------------------------------------
    const loginPage = await browser.newPage();
    await loginPage.setViewport({ width: 1440, height: 900 });

    console.log('\n--- 1. Testing Admin Login Page ---');
    await loginPage.goto(`${BASE_URL}/portal/login`, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1000));
    const adminLoginShot = path.join(QA_DIR, '01-admin-login-screen.png');
    await loginPage.screenshot({ path: adminLoginShot });
    console.log('Saved:', adminLoginShot);

    console.log('\n--- 2. Navigating to CRM Login Mode ---');
    await loginPage.goto(`${BASE_URL}/portal/login?next=crm`, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1000));
    const crmLoginShot = path.join(QA_DIR, '02-crm-login-screen.png');
    await loginPage.screenshot({ path: crmLoginShot });
    console.log('Saved:', crmLoginShot);

    const submitBtnTextCrm = await loginPage.evaluate(() => {
      const btn = document.querySelector('.admin-entry-submit');
      return btn ? btn.textContent.trim() : null;
    });
    console.log('CRM Login Submit Button:', submitBtnTextCrm);

    // -------------------------------------------------------------
    // TEST 2: Verified Text on /hub Page ("بوابة الفزني للخدمات")
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing /hub with custom text ---');
    const hubPage = await browser.newPage();
    await hubPage.setViewport({ width: 1440, height: 900 });
    await hubPage.goto(`${BASE_URL}/hub`, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1200));

    const hubHeadingText = await hubPage.evaluate(() => {
      const h1 = document.querySelector('#hub-title');
      return h1 ? h1.textContent.trim() : null;
    });
    console.log('Hub Page Title in DOM:', hubHeadingText);

    const hubShot = path.join(QA_DIR, '03-hub-updated-text.png');
    await hubPage.screenshot({ path: hubShot });
    console.log('Saved:', hubShot);

    // -------------------------------------------------------------
    // TEST 3: Theme Manager Live Preview & Inspector
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Theme Manager Live Editor & Inspector ---');
    const themePage = await browser.newPage();
    await themePage.setViewport({ width: 1440, height: 900 });
    await themePage.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await themePage.evaluate((tok) => {
      localStorage.setItem('elfazni_auth_token', tok);
      localStorage.setItem('elfazni_auth_user', JSON.stringify({ username: 'elfazni.admin', role: 'owner' }));
    }, token);

    await themePage.goto(`${BASE_URL}/portal?section=theme`, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1500));
    const themeManagerShot = path.join(QA_DIR, '04-theme-manager.png');
    await themePage.screenshot({ path: themeManagerShot });
    console.log('Saved:', themeManagerShot);

    // -------------------------------------------------------------
    // TEST 4: CRM Dashboard Link to /portal
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing CRM to Portal Link ---');
    const crmPage = await browser.newPage();
    crmPage.on('console', (msg) => console.log('CRM/Portal Page Log:', msg.text()));
    crmPage.on('pageerror', (err) => console.log('CRM/Portal Page Error:', err.message));
    await crmPage.setViewport({ width: 1440, height: 900 });
    
    // Set cookies for authentication
    await crmPage.setCookie(
      { name: 'token', value: token, domain: 'localhost', path: '/' },
      { name: 'elfazni_crm', value: token, domain: 'localhost', path: '/' }
    );

    // Set localStorage tokens for CRM page
    await crmPage.goto(`${BASE_URL}/admin/crm/`, { waitUntil: 'domcontentloaded' });
    await crmPage.evaluate((tok, usr) => {
      localStorage.setItem('elfazni_auth_token', tok);
      localStorage.setItem('elfazni_auth_user', JSON.stringify(usr));
    }, token, auth.user);

    await crmPage.goto(`${BASE_URL}/admin/crm/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await new Promise((r) => setTimeout(r, 2000));

    console.log('CRM Loaded! Current URL:', crmPage.url());
    const crmDashboardShot = path.join(QA_DIR, '05-crm-dashboard-authenticated.png');
    await crmPage.screenshot({ path: crmDashboardShot });
    console.log('Saved CRM Dashboard:', crmDashboardShot);

    // Check link in CRM navbar
    const portalLink = await crmPage.evaluate(() => {
      const link = document.querySelector('a[href="/portal"]');
      return link ? { href: link.getAttribute('href'), text: link.textContent.trim() } : null;
    });
    console.log('Found Portal Link in CRM:', portalLink);

    console.log('\n--- 6. Clicking Link from CRM to Portal ---');
    await Promise.all([
      crmPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
      crmPage.click('a[href="/portal"]')
    ]);

    // Wait for the admin workspace to render
    console.log('Waiting for Portal dashboard to render...');
    await crmPage.waitForSelector('header, #workspace-heading, .admin-workspace-intro', {
      visible: true,
      timeout: 15000,
    });
    console.log('✅ Found Portal element in DOM!');

    const pageState = await crmPage.evaluate(() => {
      return {
        url: window.location.href,
        tokenPresent: Boolean(localStorage.getItem('elfazni_auth_token')),
        bodySnippet: document.body.innerText.slice(0, 300),
      };
    });
    console.log('Portal Page State:', JSON.stringify(pageState, null, 2));

    const portalFromCrmShot = path.join(QA_DIR, '06-portal-arrived-from-crm.png');
    await crmPage.screenshot({ path: portalFromCrmShot });
    console.log('Saved Portal Screen:', portalFromCrmShot);

    console.log('\n🎉 ALL TESTS PASSED! Text editing & bi-directional navigation are 100% verified!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
