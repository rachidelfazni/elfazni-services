import puppeteer from '/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('qa/stealth-qa-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runQA() {
  console.log('======================================================================');
  console.log('🛡️ STARTING STEALTH ROUTING & LINK REMOVAL QA');
  console.log('======================================================================');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const testResults = [];

  // TEST 1: Check robots.txt
  console.log('\n--- 1. Testing robots.txt ---');
  await page.goto('http://127.0.0.1:8080/robots.txt', { waitUntil: 'networkidle2' });
  const robotsText = await page.evaluate(() => document.body.innerText);
  const hasDisallowPortal = robotsText.includes('Disallow: /portal');
  const hasDisallowCrm = robotsText.includes('Disallow: /crm');
  const hasDisallowHub = robotsText.includes('Disallow: /hub');
  const hasDisallowAdmin = robotsText.includes('Disallow: /admin');
  console.log('robots.txt disallows /portal:', hasDisallowPortal);
  console.log('robots.txt disallows /crm:', hasDisallowCrm);
  console.log('robots.txt disallows /hub:', hasDisallowHub);
  console.log('robots.txt disallows /admin:', hasDisallowAdmin);
  testResults.push({
    test: 'robots.txt rules',
    passed: hasDisallowPortal && hasDisallowCrm && hasDisallowHub && hasDisallowAdmin
  });

  // TEST 2: Inspect Homepage for any /admin, /hub, /crm links
  console.log('\n--- 2. Auditing Public Homepage (Desktop) ---');
  await page.goto('http://127.0.0.1:8080/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 1000));

  const exposedLinks = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a, button'));
    const suspicious = [];
    for (const el of anchors) {
      const href = el.getAttribute('href') || '';
      const text = el.innerText || '';
      const onclick = el.getAttribute('onclick') || '';
      if (
        href.includes('/admin') ||
        href.includes('/hub') ||
        href.includes('/crm') ||
        href.includes('/portal') ||
        href.includes('/workspace') ||
        text.includes('لوحة التحكم') ||
        text.includes('بوابة HUB') ||
        text.includes('الخدمات الموحدة')
      ) {
        suspicious.push({ tag: el.tagName, href, text: text.trim().slice(0, 40) });
      }
    }
    return suspicious;
  });

  console.log('Suspicious administrative links found on Desktop homepage:', exposedLinks.length);
  if (exposedLinks.length > 0) {
    console.log(exposedLinks);
  }
  testResults.push({
    test: 'Desktop Homepage 0 admin/hub links',
    passed: exposedLinks.length === 0
  });

  // Take Footer screenshot
  const footerEl = await page.$('footer');
  if (footerEl) {
    await footerEl.screenshot({ path: path.join(SCREENSHOT_DIR, '01-clean-footer.png') });
    console.log('Captured footer screenshot -> 01-clean-footer.png');
  }

  // TEST 3: Inspect Mobile Drawer on Homepage
  console.log('\n--- 3. Auditing Mobile Navigation Drawer ---');
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8080/', { waitUntil: 'networkidle2' });

  // Find hamburger menu button and click it
  const menuBtn = await page.$('button[aria-label*="قائمة"], header button');
  if (menuBtn) {
    await menuBtn.click();
    await new Promise(r => setTimeout(r, 600));

    const mobileSuspicious = await page.evaluate(() => {
      const drawer = document.querySelector('nav');
      if (!drawer) return [];
      const links = Array.from(document.querySelectorAll('a, button'));
      return links
        .filter(el => {
          const href = el.getAttribute('href') || '';
          const text = el.innerText || '';
          return (
            href.includes('/admin') ||
            href.includes('/hub') ||
            href.includes('/crm') ||
            href.includes('/portal') ||
            text.includes('لوحة التحكم') ||
            text.includes('بوابة HUB')
          );
        })
        .map(el => ({ tag: el.tagName, text: el.innerText.trim() }));
    });

    console.log('Suspicious links in Mobile menu:', mobileSuspicious.length);
    testResults.push({
      test: 'Mobile Drawer 0 admin/hub links',
      passed: mobileSuspicious.length === 0
    });

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-clean-mobile-drawer.png') });
    console.log('Captured mobile drawer screenshot -> 02-clean-mobile-drawer.png');
  }

  // Reset viewport to desktop
  await page.setViewport({ width: 1440, height: 900 });

  // TEST 4: Test stealth protection on legacy /admin
  console.log('\n--- 4. Testing Stealth Protection on /admin ---');
  await page.goto('http://127.0.0.1:8080/admin', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  const urlAfterAdmin = page.url();
  console.log('URL after navigating to /admin (unauthenticated):', urlAfterAdmin);
  const isRedirectedHome = urlAfterAdmin === 'http://127.0.0.1:8080/' || urlAfterAdmin === 'http://localhost:8080/';
  console.log('Successfully redirected to Homepage:', isRedirectedHome);
  testResults.push({
    test: '/admin unauthenticated stealth redirect to /',
    passed: isRedirectedHome
  });

  // TEST 5: Test new secure portal login at /portal/login
  console.log('\n--- 5. Testing Secure Login at /portal/login ---');
  await page.goto('http://127.0.0.1:8080/portal/login', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  const hasLoginForm = await page.evaluate(() => {
    return Boolean(document.querySelector('input[type="password"]'));
  });
  console.log('Login form rendered on /portal/login:', hasLoginForm);
  testResults.push({
    test: '/portal/login renders secure login',
    passed: hasLoginForm
  });
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-secure-portal-login.png') });
  console.log('Captured secure login screenshot -> 03-secure-portal-login.png');

  // TEST 6: Test /crm unauthenticated redirect
  console.log('\n--- 6. Testing /crm Unauthenticated Redirect ---');
  await page.goto('http://127.0.0.1:8080/crm', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  const urlAfterCrm = page.url();
  console.log('URL after navigating to /crm (unauthenticated):', urlAfterCrm);
  const isCrmLoginRedirect = urlAfterCrm.includes('/portal/login') || urlAfterCrm.includes('/admin/crm');
  console.log('Protected /crm correctly requires authentication:', isCrmLoginRedirect);
  testResults.push({
    test: '/crm requires authentication and redirects to login',
    passed: isCrmLoginRedirect
  });

  console.log('\n======================================================================');
  console.log('📊 FINAL TEST RESULTS:');
  console.log('======================================================================');
  let allPassed = true;
  for (const r of testResults) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} ${r.test}: ${r.passed ? 'PASSED' : 'FAILED'}`);
    if (!r.passed) allPassed = false;
  }
  console.log('======================================================================');

  await browser.close();
  process.exit(allPassed ? 0 : 1);
}

runQA().catch((err) => {
  console.error('QA script crashed:', err);
  process.exit(1);
});
