import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire('/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const OUT_DIR = path.resolve('qa/performance');

async function measurePage(browser, url, options = {}) {
  const {
    isMobile = false,
    viewport = isMobile ? { width: 390, height: 844, isMobile: true, hasTouch: true } : { width: 1440, height: 900 },
    screenshotPath = null,
    cookies = [],
    localStorageData = {},
    networkThrottling = false,
  } = options;

  const page = await browser.newPage();
  await page.setViewport(viewport);

  if (isMobile) {
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    );
  }

  if (cookies.length) {
    await page.setCookie(...cookies);
  }

  if (Object.keys(localStorageData).length > 0) {
    await page.evaluateOnNewDocument((data) => {
      for (const [k, v] of Object.entries(data)) {
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      }
    }, localStorageData);
  }

  // Network tracking
  const requests = [];
  let totalBytes = 0;
  const byType = {};

  const client = await page.target().createCDPSession();
  await client.send('Network.enable');

  if (networkThrottling) {
    // Fast 4G throttling: 150ms RTT, 1.6Mbps down, 750Kbps up
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });
  }

  client.on('Network.loadingFinished', (event) => {
    totalBytes += event.encodedDataLength || 0;
  });

  client.on('Network.responseReceived', (event) => {
    const { response, type } = event;
    const url = response.url;
    const size = response.encodedDataLength || 0;
    const mime = response.mimeType || '';
    requests.push({ url, type, size, mime, status: response.status });

    const key = type || 'Other';
    if (!byType[key]) byType[key] = { count: 0, bytes: 0 };
    byType[key].count++;
    byType[key].bytes += size;
  });

  // Inject Web Vitals observer before page load
  await page.evaluateOnNewDocument(() => {
    window.__perfMetrics = {
      lcp: null,
      lcpElement: null,
      lcpUrl: null,
      cls: 0,
      fcp: null,
      fp: null,
      longTasks: 0,
      longTaskDuration: 0,
    };

    // LCP
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          window.__perfMetrics.lcp = lastEntry.startTime;
          window.__perfMetrics.lcpUrl = lastEntry.url || '';
          window.__perfMetrics.lcpElement = lastEntry.element
            ? `${lastEntry.element.tagName.toLowerCase()}${lastEntry.element.id ? '#' + lastEntry.element.id : ''}${
                lastEntry.element.className ? '.' + String(lastEntry.element.className).trim().split(/\s+/)[0] : ''
              }`
            : '';
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}

    // CLS
    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__perfMetrics.cls += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (e) {}

    // Long Tasks
    try {
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          window.__perfMetrics.longTasks++;
          window.__perfMetrics.longTaskDuration += entry.duration;
        }
      }).observe({ type: 'longtask', buffered: true });
    } catch (e) {}
  });

  const startTime = Date.now();
  const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
  const loadDuration = Date.now() - startTime;

  // Settle paint events
  await new Promise((r) => setTimeout(r, 2000));

  if (screenshotPath) {
    const dir = path.dirname(screenshotPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: false });
  }

  // Extract browser metrics
  const browserData = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const paints = performance.getEntriesByType('paint');
    const fpEntry = paints.find((p) => p.name === 'first-paint');
    const fcpEntry = paints.find((p) => p.name === 'first-contentful-paint');

    const memory = performance.memory
      ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        }
      : null;

    return {
      nav: {
        ttfb: nav.responseStart ? Math.round(nav.responseStart - nav.requestStart) : 0,
        domInteractive: nav.domInteractive ? Math.round(nav.domInteractive) : 0,
        domContentLoaded: nav.domContentLoadedEventEnd ? Math.round(nav.domContentLoadedEventEnd) : 0,
        loadEventEnd: nav.loadEventEnd ? Math.round(nav.loadEventEnd) : 0,
        duration: nav.duration ? Math.round(nav.duration) : 0,
      },
      paint: {
        fp: fpEntry ? Math.round(fpEntry.startTime) : 0,
        fcp: fcpEntry ? Math.round(fcpEntry.startTime) : 0,
      },
      vitals: window.__perfMetrics || {},
      memory,
    };
  });

  await page.close();

  // Top heaviest requests
  const topRequests = requests
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)
    .map((r) => ({
      url: r.url.length > 80 ? '...' + r.url.slice(-77) : r.url,
      type: r.type,
      sizeKB: Math.round(r.size / 1024),
      mime: r.mime,
    }));

  return {
    url,
    httpStatus: response ? response.status() : 0,
    isMobile,
    loadDurationMs: loadDuration,
    ttfbMs: browserData.nav.ttfb,
    fcpMs: browserData.paint.fcp,
    lcpMs: browserData.vitals.lcp ? Math.round(browserData.vitals.lcp) : browserData.paint.fcp,
    lcpElement: browserData.vitals.lcpElement || 'unknown',
    lcpUrl: browserData.vitals.lcpUrl || '',
    cls: parseFloat(browserData.vitals.cls.toFixed(4)),
    longTasks: browserData.vitals.longTasks,
    longTaskDurationMs: Math.round(browserData.vitals.longTaskDuration),
    totalRequests: requests.length,
    totalTransferredBytes: totalBytes,
    totalTransferredMB: parseFloat((totalBytes / (1024 * 1024)).toFixed(2)),
    byType,
    topRequests,
    memoryMB: browserData.memory ? parseFloat((browserData.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2)) : null,
  };
}

async function runAudit() {
  console.log('========================================================================');
  console.log('⚡ ELFAZNI SERVICES — COMPREHENSIVE PERFORMANCE BENCHMARK & AUDIT');
  console.log('========================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const results = {};

  try {
    // 1. Homepage Desktop (Cold Load)
    console.log('📊 1. Measuring Homepage Desktop (Baseline)...');
    results.homepageDesktop = await measurePage(browser, `${BASE_URL}/`, {
      isMobile: false,
      screenshotPath: path.join(OUT_DIR, 'baseline/01-homepage-desktop-baseline.png'),
    });
    console.log(`   LCP: ${results.homepageDesktop.lcpMs}ms | FCP: ${results.homepageDesktop.fcpMs}ms | Transferred: ${results.homepageDesktop.totalTransferredMB} MB | Requests: ${results.homepageDesktop.totalRequests}`);

    // 2. Homepage Mobile (Baseline)
    console.log('📊 2. Measuring Homepage Mobile (Baseline)...');
    results.homepageMobile = await measurePage(browser, `${BASE_URL}/`, {
      isMobile: true,
      screenshotPath: path.join(OUT_DIR, 'baseline/02-homepage-mobile-baseline.png'),
    });
    console.log(`   LCP: ${results.homepageMobile.lcpMs}ms | FCP: ${results.homepageMobile.fcpMs}ms | Transferred: ${results.homepageMobile.totalTransferredMB} MB`);

    // 3. Homepage Mobile 4G Emulated
    console.log('📊 3. Measuring Homepage Mobile (Fast 4G Throttled)...');
    results.homepageMobile4G = await measurePage(browser, `${BASE_URL}/`, {
      isMobile: true,
      networkThrottling: true,
      screenshotPath: path.join(OUT_DIR, 'baseline/03-homepage-mobile-4g.png'),
    });
    console.log(`   LCP: ${results.homepageMobile4G.lcpMs}ms | FCP: ${results.homepageMobile4G.fcpMs}ms | Transferred: ${results.homepageMobile4G.totalTransferredMB} MB`);

    // Authenticated credentials
    const token = 'test-perf-token';
    const user = { id: 'test_admin', username: 'elfazni.admin', role: 'superadmin', displayName: 'المدير العام' };
    const authStorage = {
      elfazni_auth_token: token,
      elfazni_crm_token: token,
      token: token,
      user: JSON.stringify(user),
    };
    const authCookies = [
      { name: 'token', value: token, domain: '127.0.0.1', path: '/' },
      { name: 'elfazni_crm', value: token, domain: '127.0.0.1', path: '/' },
    ];

    // 4. Admin Portal Login
    console.log('📊 4. Measuring Admin Login (/portal/login)...');
    results.adminLogin = await measurePage(browser, `${BASE_URL}/portal/login`, {
      screenshotPath: path.join(OUT_DIR, 'baseline/04-admin-login.png'),
    });
    console.log(`   LCP: ${results.adminLogin.lcpMs}ms | Transferred: ${results.adminLogin.totalTransferredMB} MB`);

    // 5. CRM Login
    console.log('📊 5. Measuring CRM Login (/portal/login?next=crm)...');
    results.crmLogin = await measurePage(browser, `${BASE_URL}/portal/login?next=crm`, {
      screenshotPath: path.join(OUT_DIR, 'baseline/05-crm-login.png'),
    });
    console.log(`   LCP: ${results.crmLogin.lcpMs}ms | Transferred: ${results.crmLogin.totalTransferredMB} MB`);

    // 6. Admin Portal Dashboard (Overview / Geo-Analytics)
    console.log('📊 6. Measuring Admin Management Portal (/portal)...');
    results.adminPortal = await measurePage(browser, `${BASE_URL}/portal`, {
      localStorageData: authStorage,
      cookies: authCookies,
      screenshotPath: path.join(OUT_DIR, 'baseline/06-admin-portal.png'),
    });
    console.log(`   LCP: ${results.adminPortal.lcpMs}ms | Memory: ${results.adminPortal.memoryMB} MB`);

    // 7. Theme Manager (/portal?section=theme)
    console.log('📊 7. Measuring Theme & Appearance Manager (/portal?section=theme)...');
    results.themeManager = await measurePage(browser, `${BASE_URL}/portal?section=theme`, {
      localStorageData: authStorage,
      cookies: authCookies,
      screenshotPath: path.join(OUT_DIR, 'baseline/07-theme-manager.png'),
    });
    console.log(`   LCP: ${results.themeManager.lcpMs}ms | Transferred: ${results.themeManager.totalTransferredMB} MB`);

    // 8. CRM Workspace (/admin/crm/)
    console.log('📊 8. Measuring CRM Workspace Dashboard (/admin/crm/)...');
    results.crmDashboard = await measurePage(browser, `${BASE_URL}/admin/crm/`, {
      localStorageData: authStorage,
      cookies: authCookies,
      screenshotPath: path.join(OUT_DIR, 'baseline/08-crm-dashboard.png'),
    });
    console.log(`   LCP: ${results.crmDashboard.lcpMs}ms | Memory: ${results.crmDashboard.memoryMB} MB`);

    // 9. CRM Calendar Workspace (/admin/crm/?tool=calendar)
    console.log('📊 9. Measuring CRM Calendar Workspace (/admin/crm/?tool=calendar)...');
    results.crmCalendar = await measurePage(browser, `${BASE_URL}/admin/crm/?tool=calendar`, {
      localStorageData: authStorage,
      cookies: authCookies,
      screenshotPath: path.join(OUT_DIR, 'baseline/09-crm-calendar.png'),
    });
    console.log(`   LCP: ${results.crmCalendar.lcpMs}ms | Memory: ${results.crmCalendar.memoryMB} MB`);

    // Save full JSON report
    const reportPath = path.join(OUT_DIR, 'baseline-performance-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ Baseline report written to ${reportPath}`);

    // Print top heaviest assets on Homepage
    console.log('\n--- TOP HEAVIEST ASSETS LOADED ON HOMEPAGE ---');
    results.homepageDesktop.topRequests.forEach((r, idx) => {
      console.log(`  ${idx + 1}. [${r.type}] ${r.sizeKB} KB - ${r.url}`);
    });

  } finally {
    await browser.close();
  }
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
