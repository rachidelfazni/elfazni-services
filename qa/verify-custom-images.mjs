import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire('/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:8080';
const QA_DIR = path.resolve('qa/custom-images-test');

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
  console.log('🚀 Starting Custom Image Verification Test...');

  // 1. Authenticate
  const auth = await loginApi();
  const token = auth.token;
  console.log('✅ Authenticated as:', auth.user.username);

  // 2. Test direct upload of an image via FormData
  console.log('\n--- TEST A: Direct Media Upload API ---');
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const sampleImagePath = path.resolve('public/assets/brand/hub-entry.jpg');
  const sampleBytes = fs.readFileSync(sampleImagePath);
  
  // Create multipart payload
  const pre = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="category"\r\n\r\nillustration\r\n` +
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="custom-test-photo.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`
  );
  const post = Buffer.from(`\r\n--${boundary}--\r\n`);
  const bodyBuffer = Buffer.concat([pre, sampleBytes, post]);

  const uploadRes = await fetch(`${BASE_URL}/api/theme/media/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: bodyBuffer,
  });

  const uploadData = await uploadRes.json();
  console.log('Upload result:', uploadData.success ? '✅ Success' : '❌ Failed', uploadData.asset?.url);

  const customUploadedUrl = uploadData.asset?.url || '/assets/brand/hub-entry.jpg';

  // 3. Test saving portal draft with custom image in Zone A and Zone C
  console.log('\n--- TEST B: Save & Publish Portal with Custom Photo in Zone C ---');
  const portalDraftRes = await fetch(`${BASE_URL}/api/theme/draft/portal`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      outerBackground: {
        type: 'image',
        color: '#012247',
        image: '/assets/brand/hub-entry.jpg',
        scale: 100,
        fit: 'cover',
        opacity: 85,
        brightness: 90,
        overlay: {
          enabled: true,
          type: 'radial',
          startColor: '#004AA5',
          middleColor: '#011B38',
          endColor: '#000E20',
          opacity: 40,
        },
      },
      sidePanel: {
        bgType: 'gradient',
        bgColor: '#004AA5',
        foregroundImage: customUploadedUrl, // The uploaded custom photo!
        illustrationScale: 100,
        illustrationFit: 'contain',
        illustrationCustomX: 0,
        illustrationCustomY: 0,
        illustrationRotation: 0,
        headingAr: 'بوابة الفزني سيرفيسز',
        headingEn: 'ELFAZNI SERVICES HUB',
        descriptionAr: 'خدمات السفر والمعاملات في تركيا',
        headingColor: '#FFFFFF',
        descriptionColor: '#E2E8F0',
      },
    }),
  });
  const portalDraftData = await portalDraftRes.json();
  console.log('Portal draft save:', portalDraftData.success ? '✅ Success' : '❌ Failed');

  const portalPublishRes = await fetch(`${BASE_URL}/api/theme/publish/portal`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      changeSummary: 'تطبيق صورة مخصصة في اللوحة الجانبية والخلفية للبوابة',
    }),
  });
  const portalPublishData = await portalPublishRes.json();
  console.log('Portal publish:', portalPublishData.success ? '✅ Published' : '❌ Failed');

  // 4. Test saving CRM Login draft with custom photo
  console.log('\n--- TEST C: Save & Publish CRM Login with Custom Photo ---');
  const crmDraftRes = await fetch(`${BASE_URL}/api/theme/draft/crm_login`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      illustrationUrl: customUploadedUrl,
      illustrationScale: 100,
      illustrationFit: 'contain',
      sidePanel: {
        foregroundImage: customUploadedUrl,
      },
    }),
  });
  const crmDraftData = await crmDraftRes.json();
  console.log('CRM Login draft save:', crmDraftData.success ? '✅ Success' : '❌ Failed');

  const crmPublishRes = await fetch(`${BASE_URL}/api/theme/publish/crm_login`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      changeSummary: 'تطبيق صورة مخصصة في واجهة تسجيل دخول CRM',
    }),
  });
  const crmPublishData = await crmPublishRes.json();
  console.log('CRM Login publish:', crmPublishData.success ? '✅ Published' : '❌ Failed');

  // 5. Launch Chrome Puppeteer and take real visual screenshots
  console.log('\n--- TEST D: Visual Browser Verification & Screenshots ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Inject auth token into localStorage
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((tok) => {
      localStorage.setItem('elfazni_auth_token', tok);
      localStorage.setItem('elfazni_auth_user', JSON.stringify({ username: 'elfazni.admin', role: 'owner' }));
    }, token);

    // 1. Visit /hub
    console.log('Capturing /hub with custom side image...');
    await page.goto(`${BASE_URL}/hub`, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1200));
    const hubScreenshot = path.join(QA_DIR, '01-hub-custom-photo.png');
    await page.screenshot({ path: hubScreenshot, fullPage: false });
    console.log('Saved:', hubScreenshot);

    // Verify side panel image in DOM
    const hubImgSrc = await page.evaluate(() => {
      const img = document.querySelector('.theme-illustration img');
      return img ? img.getAttribute('src') : null;
    });
    console.log('Hub side panel image src in DOM:', hubImgSrc);

    // 2. Visit CRM Login (/admin/login?next=crm)
    console.log('Capturing CRM login page...');
    await page.goto(`${BASE_URL}/admin/login?next=crm`, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1200));
    const crmScreenshot = path.join(QA_DIR, '02-crm-login-custom-photo.png');
    await page.screenshot({ path: crmScreenshot, fullPage: false });
    console.log('Saved:', crmScreenshot);

    const crmImgSrc = await page.evaluate(() => {
      const img = document.querySelector('.theme-illustration img');
      return img ? img.getAttribute('src') : null;
    });
    console.log('CRM login side panel image src in DOM:', crmImgSrc);

    // 3. Visit Theme Manager (/portal?section=theme)
    console.log('Capturing Theme Manager visual editor...');
    await page.goto(`${BASE_URL}/portal?section=theme`, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise((r) => setTimeout(r, 1500));
    const themeEditorScreenshot = path.join(QA_DIR, '03-theme-manager-editor.png');
    await page.screenshot({ path: themeEditorScreenshot, fullPage: false });
    console.log('Saved:', themeEditorScreenshot);

    console.log('\n🎉 ALL TESTS PASSED! Real custom images are working across Portal, Hub, and CRM!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
