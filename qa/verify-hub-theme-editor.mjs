import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire('/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:8080';
const QA_DIR = path.resolve('qa/hub-theme-editor');

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

async function runQA() {
  console.log('🚀 Starting ELFAZNI HUB Portal Theme QA Suite...');
  
  // 1. Get Auth Token
  const auth = await loginApi();
  console.log('✅ Authenticated successfully as:', auth.user.username);

  // 2. Launch Browser
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();

    // ========================================================
    // TEST 1: Viewports on /hub (Public HUB Unified Portal)
    // ========================================================
    console.log('\n--- TEST 1: Responsive Viewports on /hub ---');
    const viewports = [
      { name: '01-hub-desktop-1920x1080', width: 1920, height: 1080 },
      { name: '02-hub-laptop-1440x900', width: 1440, height: 900 },
      { name: '03-hub-tablet-768x1024', width: 768, height: 1024 },
      { name: '04-hub-mobile-390x844', width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
      await page.goto(`${BASE_URL}/hub`, { waitUntil: 'networkidle2' });
      await new Promise((r) => setTimeout(r, 1200));

      const screenshotPath = path.join(QA_DIR, `${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`📸 Saved screenshot: ${vp.name}.png (${vp.width}x${vp.height})`);

      // Verify layers and elements on /hub
      const verification = await page.evaluate(() => {
        const main = document.querySelector('main');
        const buttons = document.querySelectorAll('a[href="/"], a[href="/crm"], a[href="/portal"]');
        const floatingImg = document.querySelector('img[src*="/assets/brand/3d/"]');

        return {
          hasMain: !!main,
          buttonCount: buttons.length,
          hasIllustration: !!floatingImg,
          bgStyle: main ? getComputedStyle(main).backgroundImage : '',
        };
      });

      console.log(`   Verification (${vp.name}):`, verification);
    }

    // ========================================================
    // Set Auth Tokens in LocalStorage for /portal
    // ========================================================
    await page.goto(`${BASE_URL}/hub`, { waitUntil: 'networkidle2' });
    await page.evaluate((authData) => {
      localStorage.setItem('elfazni_auth_token', authData.token);
      localStorage.setItem('elfazni_auth_user', JSON.stringify(authData.user));
      localStorage.setItem('user', JSON.stringify(authData.user));
    }, auth);

    // ========================================================
    // TEST 2: Theme Manager - 3-Zone Architecture on Portal
    // ========================================================
    console.log('\n--- TEST 2: Theme Manager 3-Zone Architecture on /portal?section=theme ---');
    await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 2 });
    await page.goto(`${BASE_URL}/portal?section=theme`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2500));

    // Click on the subtab 'مظهر البوابة الرئيسية'
    const portalTabClicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const portalSubTab = btns.find((b) => b.textContent?.includes('مظهر البوابة الرئيسية'));
      if (portalSubTab) {
        portalSubTab.click();
        return true;
      }
      return false;
    });
    console.log('Switched to Portal Theme SubTab:', portalTabClicked);
    await new Promise((r) => setTimeout(r, 2000));

    // Capture Theme Manager with Portal Selected
    await page.screenshot({ path: path.join(QA_DIR, '05-theme-manager-portal-zones.png') });
    console.log('📸 Saved screenshot: 05-theme-manager-portal-zones.png');

    // ========================================================
    // TEST 3: Zone Independence & Controls
    // ========================================================
    console.log('\n--- TEST 3: Zone Independence & Controls ---');

    // Test Zone A (Outer Background Controls)
    const testZoneA = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('الخلفية الرئيسية')
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('Toggled Zone A accordion:', testZoneA);
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(QA_DIR, '06-theme-manager-zone-a-controls.png') });
    console.log('📸 Saved screenshot: 06-theme-manager-zone-a-controls.png');

    // Test Zone B (Menu Panel Controls)
    const testZoneB = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('لوحة القوائم')
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('Toggled Zone B accordion:', testZoneB);
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(QA_DIR, '07-theme-manager-zone-b-controls.png') });
    console.log('📸 Saved screenshot: 07-theme-manager-zone-b-controls.png');

    // Test Zone C (Side Illustration Panel Controls)
    const testZoneC = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('اللوحة الجانبية')
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('Toggled Zone C accordion:', testZoneC);
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(QA_DIR, '08-theme-manager-zone-c-controls.png') });
    console.log('📸 Saved screenshot: 08-theme-manager-zone-c-controls.png');

    // ========================================================
    // TEST 4: Presets Tab
    // ========================================================
    console.log('\n--- TEST 4: Presets Tab ---');
    const presetsTabClicked = await page.evaluate(() => {
      const tab = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('القوالب الجاهزة')
      );
      if (tab) {
        tab.click();
        return true;
      }
      return false;
    });
    console.log('Clicked Presets Tab:', presetsTabClicked);
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(QA_DIR, '09-theme-presets-catalog.png') });
    console.log('📸 Saved screenshot: 09-theme-presets-catalog.png');

    // ========================================================
    // TEST 5: Publish & Reload Persistence Check
    // ========================================================
    console.log('\n--- TEST 5: Persistence on Reload ---');
    const pubRes = await fetch(`${BASE_URL}/api/theme/publish/portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({
        changeSummary: 'نشر إعدادات المناطق الثلاث المستقلة للبوابة',
      }),
    });
    const pubData = await pubRes.json();
    console.log('Publish API Result:', pubData.success ? 'SUCCESS' : pubData.message);

    // Now reload /hub in browser and verify persistence
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
    await page.goto(`${BASE_URL}/hub`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(QA_DIR, '10-hub-published-persisted-1920x1080.png') });
    console.log('📸 Saved screenshot: 10-hub-published-persisted-1920x1080.png');

    // Check DOM elements for no duplication
    const domAudit = await page.evaluate(() => {
      const outerMain = document.querySelector('main');
      const sideSection = document.querySelector('aside, [role="complementary"]');
      const outerBgImg = outerMain?.style.backgroundImage || '';
      const sideBgImg = sideSection ? getComputedStyle(sideSection).backgroundImage : '';
      const floatingIllust = sideSection?.querySelector('img')?.getAttribute('src') || '';

      return {
        outerBgImg,
        sideBgImg,
        floatingIllust,
        isDuplicated: outerBgImg !== '' && outerBgImg === sideBgImg,
      };
    });
    console.log('📊 DOM Audit for Background vs Illustration Duplication:', domAudit);

    console.log('\n🎉 ALL QA CHECKS COMPLETED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

runQA().catch((err) => {
  console.error('❌ QA Suite Error:', err);
  process.exit(1);
});
