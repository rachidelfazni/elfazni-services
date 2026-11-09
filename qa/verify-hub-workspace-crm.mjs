import puppeteer from '/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('qa/hub-workspace-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runQA() {
  console.log('======================================================================');
  console.log('🔍 VERIFYING HUB, WORKSPACE, AND CRM BUTTONS & DESTINATIONS');
  console.log('======================================================================');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const testResults = [];

  // TEST 1: Inspect HUB page (http://127.0.0.1:8080/hub)
  console.log('\n--- 1. Testing /hub page ---');
  await page.goto('http://127.0.0.1:8080/hub', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  const hubLinks = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a'));
    return anchors.map(a => ({
      href: a.getAttribute('href') || '',
      text: a.innerText.trim().replace(/\s+/g, ' ').slice(0, 40)
    })).filter(item => item.href);
  });

  console.log('Links found on HUB:');
  console.table(hubLinks);

  const hubCrmLink = hubLinks.find(l => l.href === '/crm' || l.href.includes('/crm'));
  const hubPortalLink = hubLinks.find(l => l.href === '/portal' || l.href.includes('/portal'));
  const hubHasNoOldAdmin = !hubLinks.some(l => l.href === '/admin' || l.href === '/admin/login' || l.href === '/admin/crm');

  console.log('HUB has CRM link pointing to /crm:', Boolean(hubCrmLink));
  console.log('HUB has Management link pointing to /portal:', Boolean(hubPortalLink));
  console.log('HUB has NO old /admin links:', hubHasNoOldAdmin);

  testResults.push({
    test: 'HUB card 1 points to /crm',
    passed: Boolean(hubCrmLink)
  });
  testResults.push({
    test: 'HUB card 2 points to /portal',
    passed: Boolean(hubPortalLink)
  });
  testResults.push({
    test: 'HUB has 0 old /admin links',
    passed: hubHasNoOldAdmin
  });

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-hub-page.png'), fullPage: true });
  console.log('Captured screenshot -> 01-hub-page.png');

  // TEST 2: Inspect Workspace page (http://127.0.0.1:8080/workspace)
  console.log('\n--- 2. Testing /workspace page ---');
  await page.goto('http://127.0.0.1:8080/workspace', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));

  const workspaceLinks = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a'));
    return anchors.map(a => ({
      href: a.getAttribute('href') || '',
      text: a.innerText.trim().replace(/\s+/g, ' ').slice(0, 40)
    })).filter(item => item.href);
  });

  console.log('Links found on Workspace:');
  console.table(workspaceLinks);

  const wsCrmLink = workspaceLinks.find(l => l.href === '/crm' || l.href.includes('/crm'));
  const wsPortalLink = workspaceLinks.find(l => l.href === '/portal' || l.href.includes('/portal'));
  const wsHasNoOldAdmin = !workspaceLinks.some(l => l.href === '/admin' || l.href === '/admin/login' || l.href === '/admin/crm');

  console.log('Workspace has CRM link pointing to /crm:', Boolean(wsCrmLink));
  console.log('Workspace has Management link pointing to /portal:', Boolean(wsPortalLink));
  console.log('Workspace has NO old /admin links:', wsHasNoOldAdmin);

  testResults.push({
    test: 'Workspace card 1 points to /crm',
    passed: Boolean(wsCrmLink)
  });
  testResults.push({
    test: 'Workspace card 2 points to /portal',
    passed: Boolean(wsPortalLink)
  });
  testResults.push({
    test: 'Workspace has 0 old /admin links',
    passed: wsHasNoOldAdmin
  });

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-workspace-page.png'), fullPage: true });
  console.log('Captured screenshot -> 02-workspace-page.png');

  // TEST 3: Login through /portal/login?next=crm and inspect CRM interior buttons
  console.log('\n--- 3. Testing Login and CRM Internal Buttons ---');
  await page.goto('http://127.0.0.1:8080/portal/login?next=crm', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  await page.type('input[type="text"], input[name="username"]', 'elfazni.admin');
  await page.type('input[type="password"]', 'ElfazniServices2026!');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
  ]);
  await new Promise(r => setTimeout(r, 2500));

  console.log('Current page URL after login:', page.url());
  if (!page.url().includes('/admin/crm')) {
    console.log('Navigating explicitly to /admin/crm/ ...');
    await page.goto('http://127.0.0.1:8080/admin/crm/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
  }

  const crmInternalLinks = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a'));
    return anchors.map(a => ({
      href: a.getAttribute('href') || '',
      text: a.innerText.trim().replace(/\s+/g, ' ').slice(0, 40)
    })).filter(item => item.href.includes('admin') || item.href.includes('portal') || item.href.includes('hub'));
  });

  console.log('CRM Internal Cross-System Links found:');
  console.table(crmInternalLinks);

  const crmHasNoOldAdminLink = !crmInternalLinks.some(l => l.href === '/admin' || l.href === '/admin/login');
  const crmHasPortalLink = crmInternalLinks.some(l => l.href === '/portal');

  console.log('CRM has NO old /admin links:', crmHasNoOldAdminLink);
  console.log('CRM has button pointing to /portal:', crmHasPortalLink);

  testResults.push({
    test: 'CRM interior top button and navbar point to /portal (no old /admin)',
    passed: crmHasNoOldAdminLink && crmHasPortalLink
  });

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-crm-interior.png') });
  console.log('Captured screenshot -> 03-crm-interior.png');

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

runQA().catch(err => {
  console.error('QA crashed:', err);
  process.exit(1);
});
