import puppeteer from '/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';

const BASE_URL = 'http://127.0.0.1:8080';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function captureAfterGuideRemoval() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Desktop after guide removal
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await sleep(1500);

  await page.evaluate(() => {
    const el = document.getElementById('guides');
    if (el) el.scrollIntoView();
  });
  await sleep(1000);
  await page.screenshot({ path: 'qa/document-studio-repair/02-guide-removal/01-homepage-guides-after-desktop.png' });
  console.log('Captured 01-homepage-guides-after-desktop.png');

  // 2. Mobile after guide removal
  await page.setViewport({ width: 375, height: 812 });
  await sleep(800);
  await page.evaluate(() => {
    const el = document.getElementById('guides');
    if (el) el.scrollIntoView();
  });
  await sleep(800);
  await page.screenshot({ path: 'qa/document-studio-repair/02-guide-removal/02-homepage-guides-after-mobile.png' });
  console.log('Captured 02-homepage-guides-after-mobile.png');

  // Check whether guide card is absent
  const guideCardExists = await page.evaluate(() => {
    return !!document.querySelector('a[href="/guide-cover"]');
  });
  console.log('Is guide-cover card still present?', guideCardExists);

  await browser.close();
}

captureAfterGuideRemoval().catch(console.error);
