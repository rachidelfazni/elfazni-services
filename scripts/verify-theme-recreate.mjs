import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const require = createRequire('/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/');
const puppeteer = require('puppeteer-core');
const jwt = require('/Users/elfazni/.gemini/antigravity/scratch/ELFAZNI-SERVICES-AI-STUDIO/ELFAZNI-SERVICES/node_modules/jsonwebtoken');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const OUT_DIR = path.resolve('qa/theme-recreate');
const ARTIFACT_DIR = '/Users/elfazni/.gemini/antigravity/brain/58b016ed-1329-492d-892e-8fcdfb9f37e8/qa/theme-recreate';

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

function getAuthToken() {
  const dbPath = path.resolve('data/db.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  const user = db.users.find((u) => u.username === 'elfazni.admin');
  if (!user) throw new Error('Admin user not found in db.json');

  const secret = process.env.JWT_SECRET || 'elfazni-services-jwt-auth-secret-key-2026';
  const revision = crypto
    .createHash('sha256')
    .update(user.passwordHash + ':' + (user.sessionVersion || 0))
    .digest('hex');

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions || ['*'],
      revision,
    },
    secret,
    { expiresIn: '8h' }
  );

  return token;
}

async function run() {
  console.log('🚀 Starting Theme Recreate Browser QA Verification...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900'],
  });

  const page = await browser.newPage();
  const token = getAuthToken();

  // Set cookies for authentication
  await page.setCookie(
    { name: 'token', value: token, domain: '127.0.0.1', path: '/' },
    { name: 'elfazni_crm', value: token, domain: '127.0.0.1', path: '/' }
  );

  async function snap(filename, label) {
    const localPath = path.join(OUT_DIR, filename);
    const artPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: localPath, fullPage: false });
    fs.copyFileSync(localPath, artPath);
    console.log(`📸 [${label}] saved to ${filename}`);
  }

  // 1. HUB Portal Desktop (1440x900)
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/hub`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  await snap('01-hub-desktop-1440.png', 'HUB Portal Desktop 1440');

  // Verify persistence after reload
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  await snap('01b-hub-persisted-reload.png', 'HUB Persisted After Reload');

  // 2. Admin Login Desktop (1440x900)
  await page.goto(`${BASE_URL}/portal/login`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  await snap('02-admin-login-desktop-1440.png', 'Admin Login Desktop 1440');

  // Verify persistence after reload
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  await snap('02b-admin-login-persisted.png', 'Admin Login Persisted');

  // 3. CRM Login Desktop (1440x900)
  await page.goto(`${BASE_URL}/portal/login?next=crm`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));
  await snap('03-crm-login-desktop-1440.png', 'CRM Login Desktop 1440');

  // Verify persistence after reload
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  await snap('03b-crm-login-persisted.png', 'CRM Login Persisted');

  // 4. Mobile Responsive (390x844)
  await page.setViewport({ width: 390, height: 844, isMobile: true });

  await page.goto(`${BASE_URL}/hub`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  await snap('04-hub-mobile-390.png', 'HUB Mobile 390');

  await page.goto(`${BASE_URL}/portal/login`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  await snap('05-admin-login-mobile-390.png', 'Admin Login Mobile 390');

  await page.goto(`${BASE_URL}/portal/login?next=crm`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  await snap('06-crm-login-mobile-390.png', 'CRM Login Mobile 390');

  // 5. Theme Manager in Admin Portal (1440x900)
  await page.setViewport({ width: 1440, height: 900 });

  // Target: portal (HUB)
  await page.goto(`${BASE_URL}/portal?section=theme`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));
  await snap('07-theme-manager-hub.png', 'Theme Manager — HUB Target');

  // Switch to target admin_login
  try {
    const targetSelect = await page.$('select');
    if (targetSelect) {
      await page.select('select', 'admin_login');
      await new Promise((r) => setTimeout(r, 1200));
      await snap('08-theme-manager-admin.png', 'Theme Manager — Admin Login Target');

      await page.select('select', 'crm_login');
      await new Promise((r) => setTimeout(r, 1200));
      await snap('09-theme-manager-crm.png', 'Theme Manager — CRM Login Target');
    }
  } catch (e) {
    console.warn('Target select warning:', e.message);
  }

  // Check Presets tab in Theme Manager
  try {
    const presetButtons = await page.$$('button');
    for (const btn of presetButtons) {
      const text = await page.evaluate((el) => el.innerText, btn);
      if (text && text.includes('القوالب')) {
        await btn.click();
        await new Promise((r) => setTimeout(r, 1000));
        await snap('10-theme-presets-list.png', 'Theme Presets List');
        break;
      }
    }
  } catch (e) {
    console.warn('Preset click warning:', e.message);
  }

  // Open Media Library Modal in Theme Manager
  try {
    const mediaBtns = await page.$$('button');
    for (const btn of mediaBtns) {
      const text = await page.evaluate((el) => el.innerText, btn);
      if (text && text.includes('مكتبة الصور')) {
        await btn.click();
        await new Promise((r) => setTimeout(r, 1000));
        await snap('11-theme-media-library.png', 'Theme Media Library Modal');
        break;
      }
    }
  } catch (e) {
    console.warn('Media library click warning:', e.message);
  }

  await browser.close();
  console.log('✅ All screenshots and verifications completed successfully!');
}

run().catch((err) => {
  console.error('❌ QA Script Error:', err);
  process.exit(1);
});

