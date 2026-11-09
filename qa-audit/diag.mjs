import puppeteer from '/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import { generateToken } from '../server/auth.ts';
import { readDb } from '../server/db.ts';

const db = readDb();
const superAdmin = db.users.find((u) => u.role === 'superadmin') || db.users[0];
const adminToken = generateToken(superAdmin, 'admin');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.evaluateOnNewDocument((tk, usr) => {
    localStorage.setItem('elfazni_auth_token', tk);
    localStorage.setItem('token', tk);
    localStorage.setItem('user', JSON.stringify(usr));
    document.cookie = 'admin_session=' + tk + '; path=/';
    document.cookie = 'token=' + tk + '; path=/';
  }, adminToken, superAdmin);

  await page.goto('http://127.0.0.1:8080/admin', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  const handle = await page.$('#handle-admin-sidebar');
  const box = await handle.boundingBox();
  console.log('Admin handle box:', box);

  const sidebar = await page.$('aside');
  const sideBox = await sidebar.boundingBox();
  console.log('Sidebar box:', sideBox);

  // Check if pointer events fire and update localStorage
  const result = await page.evaluate(() => {
    const el = document.getElementById('handle-admin-sidebar');
    if (!el) return 'no element';

    const downEvt = new PointerEvent('pointerdown', { bubbles: true, clientX: 1152, clientY: 400, button: 0 });
    el.dispatchEvent(downEvt);

    const moveEvt = new PointerEvent('pointermove', { bubbles: true, clientX: 1072, clientY: 400 });
    el.dispatchEvent(moveEvt);

    const upEvt = new PointerEvent('pointerup', { bubbles: true, clientX: 1072, clientY: 400 });
    el.dispatchEvent(upEvt);

    return localStorage.getItem('elfazni_admin_sidebar_width');
  });

  console.log('Direct pointer event result in localStorage:', result);

  await browser.close();
})();
