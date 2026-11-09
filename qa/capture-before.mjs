import puppeteer from '/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { generateToken } from '../server/auth.ts';
import { readDb } from '../server/db.ts';

const BASE_URL = 'http://127.0.0.1:8080';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function captureBefore() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Homepage desktop guides before
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await sleep(1500);

  // Scroll to guides section
  await page.evaluate(() => {
    const el = document.getElementById('guides');
    if (el) el.scrollIntoView();
  });
  await sleep(1000);
  await page.screenshot({ path: 'qa/document-studio-repair/01-before/01-homepage-guides-before-desktop.png' });
  console.log('Captured 01-homepage-guides-before-desktop.png');

  // 2. Homepage mobile guides before
  await page.setViewport({ width: 375, height: 812 });
  await sleep(800);
  await page.evaluate(() => {
    const el = document.getElementById('guides');
    if (el) el.scrollIntoView();
  });
  await sleep(800);
  await page.screenshot({ path: 'qa/document-studio-repair/01-before/02-homepage-guides-before-mobile.png' });
  console.log('Captured 02-homepage-guides-before-mobile.png');

  // 3. Document studio before (desktop)
  const db = readDb();
  const superAdmin = db.users.find((u) => u.role === 'superadmin') || db.users[0];
  const crmToken = generateToken(superAdmin, 'crm');

  await page.setViewport({ width: 1440, height: 900 });
  await page.setCookie(
    { name: 'token', value: crmToken, domain: '127.0.0.1', path: '/' },
    { name: 'elfazni_crm', value: crmToken, domain: '127.0.0.1', path: '/' }
  );
  await page.evaluateOnNewDocument((tk, usr) => {
    localStorage.setItem('elfazni_crm_token', tk);
    localStorage.setItem('token', tk);
    localStorage.setItem('user', JSON.stringify(usr));
    document.cookie = 'elfazni_crm=' + tk + '; path=/';
    document.cookie = 'token=' + tk + '; path=/';
  }, crmToken, superAdmin);

  await page.goto(BASE_URL + '/admin/crm/', { waitUntil: 'domcontentloaded' });
  await sleep(2000);

  // Click notes
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const notesBtn = buttons.find((b) => b.textContent && (b.textContent.includes('مفكرتي') || b.textContent.includes('الملاحظات')));
    if (notesBtn) notesBtn.click();
  });
  await sleep(1500);

  // Open Document Studio
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const stampBtn = buttons.find((b) => b.title && b.title.includes('ختم'));
    if (stampBtn) stampBtn.click();
  });
  await sleep(1500);

  await page.screenshot({ path: 'qa/document-studio-repair/01-before/03-document-studio-before-desktop.png' });
  console.log('Captured 03-document-studio-before-desktop.png');

  await browser.close();
}

captureBefore().catch(console.error);
