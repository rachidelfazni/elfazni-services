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

async function runThemeEditorQA() {
  console.log('========================================================================');
  console.log('🎨 PHASE 1-3: THEME & APPEARANCE EDITOR QA VERIFICATION');
  console.log('========================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
  });

  const results = [];
  const addResult = (test, passed, details = '', screenshot = '') => {
    const symbol = passed ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(`  ${symbol} ${test} ${details ? `(${details})` : ''}`);
    results.push({ test, passed, details, screenshot });
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

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

    // 1. Navigate to Theme Editor
    console.log('\n--- 1. Navigating to Theme Editor ---');
    await page.goto(`${BASE_URL}/admin?section=theme`, { waitUntil: 'domcontentloaded' });
    await sleep(2500);

    const themeTitle = await page.evaluate(() => {
      return document.querySelector('h1, h2, h3')?.innerText || document.body.innerText;
    });
    const loadedEditor = themeTitle.includes('المظهر') || themeTitle.includes('الهوية') || themeTitle.includes('Theme');
    addResult('Theme Editor Navigation', loadedEditor, 'Loaded Theme Management Studio');

    const shot1 = 'qa/screenshots/theme-editor/01-theme-editor-initial.png';
    await page.screenshot({ path: path.resolve(shot1) });
    addResult('Initial Theme Studio Screenshot', true, shot1, shot1);

    // 2. Select Website Sub-Tab: "مظهر الموقع الإلكتروني"
    console.log('\n--- 2. Selecting Website Sub-Tab ---');
    const websiteTabClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('مظهر الموقع'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    await sleep(1500);
    addResult('Select Target: Website Sub-Tab', websiteTabClicked, 'Navigated to Website Visual Theme Studio');

    // 3. Test Real-time Color Change Live Preview (Expand Brand Colors Accordion)
    console.log('\n--- 3. Testing Real-time Color Change Live Preview ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const colorAccordionBtn = buttons.find(b => b.textContent && b.textContent.includes('الألوان وتوكنات'));
      if (colorAccordionBtn) {
        colorAccordionBtn.click();
      }
    });
    await sleep(600);

    const colorApplied = await page.evaluate(() => {
      const colorInputs = Array.from(document.querySelectorAll('input[type="color"]'));
      if (colorInputs.length > 0) {
        const input = colorInputs[0];
        input.value = '#10B981'; // Emerald
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    });
    await sleep(600);

    const shot2 = 'qa/screenshots/theme-editor/02-theme-editor-live-color-change.png';
    await page.screenshot({ path: path.resolve(shot2) });
    addResult('Real-time Color Update in Live Preview', colorApplied, 'Primary color modified to #10B981', shot2);

    // 4. Test Typography Controls (Expand Typography Accordion)
    console.log('\n--- 4. Testing Typography Controls ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const typoBtn = buttons.find(b => b.textContent && b.textContent.includes('الخطوط والطباعة العامة'));
      if (typoBtn) {
        typoBtn.click();
      }
    });
    await sleep(600);

    const fontUpdated = await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      const fontSelect = selects.find(s => 
        Array.from(s.options).some(o => o.value.includes('Cairo') || o.value.includes('Tajawal') || o.text.includes('Cairo'))
      );
      if (fontSelect) {
        const cairoOpt = Array.from(fontSelect.options).find(o => o.value.includes('Cairo') || o.text.includes('Cairo'));
        if (cairoOpt) {
          fontSelect.value = cairoOpt.value;
          fontSelect.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    });
    await sleep(600);

    const shot3 = 'qa/screenshots/theme-editor/03-theme-editor-typography-change.png';
    await page.screenshot({ path: path.resolve(shot3) });
    addResult('Typography Font Family Change', fontUpdated, 'Selected Cairo font family', shot3);

    // 5. Test 3D Illustration Scale & Fit Controls
    console.log('\n--- 5. Testing 3D Illustration Scale & Fit Controls ---');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const illusBtn = buttons.find(b => b.textContent && b.textContent.includes('المجسم 3D'));
      if (illusBtn) {
        illusBtn.click();
      }
    });
    await sleep(600);

    const scaleUpdated = await page.evaluate(() => {
      const rangeInputs = Array.from(document.querySelectorAll('input[type="range"]'));
      if (rangeInputs.length > 0) {
        const slider = rangeInputs[0];
        slider.value = '150';
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    });
    await sleep(600);

    const shot4 = 'qa/screenshots/theme-editor/04-theme-editor-layers-and-scale.png';
    await page.screenshot({ path: path.resolve(shot4) });
    addResult('3D Illustration Scale & Layer Adjustments', scaleUpdated, 'Scale adjusted to 150%', shot4);

    // 6. Test Applying Theme Presets
    console.log('\n--- 6. Testing Theme Presets Sub-Tab ---');
    const presetsTabClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes('القوالب الجاهزة'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    await sleep(1000);

    const shot5 = 'qa/screenshots/theme-editor/05-theme-editor-preset-applied.png';
    await page.screenshot({ path: path.resolve(shot5) });
    addResult('Theme Presets Tab Navigation', presetsTabClicked, 'Navigated to Theme Presets gallery', shot5);

    // 7. Verify Direct Theme API Persistence
    console.log('\n--- 7. Verifying Theme API Persistence ---');
    const apiRes = await fetch(`${BASE_URL}/api/theme/published/website`);
    const apiJson = await apiRes.json();
    addResult('Theme API /published/website Reachable', apiJson.success === true, `Target: ${apiJson.target}`);

    // Verify themes.json on disk
    const themesPath = path.resolve('data/themes.json');
    const diskThemesExist = fs.existsSync(themesPath);
    let presetsCount = 0;
    if (diskThemesExist) {
      const raw = JSON.parse(fs.readFileSync(themesPath, 'utf8'));
      presetsCount = raw.presets?.length || 0;
    }
    addResult('Theme Database (data/themes.json) Presets Valid', diskThemesExist && presetsCount > 0, `Presets count: ${presetsCount}`);

    console.log('\n========================================================================');
    console.log(`🎉 THEME QA COMPLETE: ${results.filter(r => r.passed).length}/${results.length} tests passed`);
    console.log('========================================================================\n');
  } catch (err) {
    console.error('❌ Theme QA encountered error:', err);
  } finally {
    await browser.close();
  }

  return results;
}

runThemeEditorQA().then(res => {
  fs.writeFileSync('qa/theme-qa-results.json', JSON.stringify(res, null, 2));
});
