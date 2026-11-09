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

  page.on('response', (response) => {
    const req = response.request();
    const type = req.resourceType();
    const headers = response.headers();
    const contentLength = parseInt(headers['content-length'] || '0', 10);
    byType[type] = (byType[type] || 0) + 1;
    requests.push({
      url: req.url(),
      type,
      status: response.status(),
      contentLength,
    });
  });

  // Track long tasks
  await page.evaluateOnNewDocument(() => {
    window.__longTasks = [];
    window.__lcpCandidate = null;
    window.__clsScore = 0;

    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__longTasks.push({
            duration: entry.duration,
            startTime: entry.startTime,
          });
        }
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });
    } catch (e) {}

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length) {
          const last = entries[entries.length - 1];
          window.__lcpCandidate = {
            startTime: last.startTime,
            renderTime: last.renderTime,
            loadTime: last.loadTime,
            size: last.size,
            element: last.element ? last.element.tagName + (last.element.className ? '.' + last.element.className.slice(0, 30) : '') : null,
            url: last.url || null,
          };
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {}

    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__clsScore += entry.value;
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {}
  });

  const t0 = Date.now();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 35000 }).catch(async () => {
    console.warn(`   Timeout on networkidle2 for ${url}, continuing with loaded state`);
  });
  await new Promise((r) => setTimeout(r, 2000));
  const pageLoadDuration = Date.now() - t0;

  // Extract performance timings
  const metrics = await page.evaluate(() => {
    const navEntries = performance.getEntriesByType('navigation');
    const nav = navEntries.length ? navEntries[0] : null;
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find((p) => p.name === 'first-contentful-paint');
    const fpEntry = paintEntries.find((p) => p.name === 'first-paint');

    const jsHeap = performance.memory
      ? {
          usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024 * 100) / 100,
          totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024 * 100) / 100,
        }
      : null;

    return {
      ttfb: nav ? Math.round(nav.responseStart - nav.requestStart) : null,
      domInteractive: nav ? Math.round(nav.domInteractive) : null,
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      loadEventEnd: nav ? Math.round(nav.loadEventEnd) : null,
      fp: fpEntry ? Math.round(fpEntry.startTime) : null,
      fcp: fcpEntry ? Math.round(fcpEntry.startTime) : null,
      lcp: window.__lcpCandidate,
      cls: Math.round(window.__clsScore * 1000) / 1000,
      longTasks: window.__longTasks || [],
      longTasksCount: (window.__longTasks || []).length,
      longTasksTotalDuration: Math.round((window.__longTasks || []).reduce((acc, t) => acc + t.duration, 0)),
      jsHeap,
    };
  });

  if (screenshotPath) {
    fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`   📸 Captured screenshot: ${screenshotPath}`);
  }

  await page.close();

  const totalTransferredMB = Math.round((totalBytes / 1024 / 1024) * 100) / 100;
  return {
    url,
    pageLoadDurationMs: pageLoadDuration,
    ttfbMs: metrics.ttfb,
    fcpMs: metrics.fcp,
    lcpMs: metrics.lcp ? Math.round(metrics.lcp.startTime || metrics.lcp.renderTime || metrics.lcp.loadTime) : null,
    lcpDetails: metrics.lcp,
    cls: metrics.cls,
    longTasksCount: metrics.longTasksCount,
    longTasksTotalMs: metrics.longTasksTotalDuration,
    requestsCount: requests.length,
    requestsByType: byType,
    totalTransferredMB,
    memoryMB: metrics.jsHeap ? metrics.jsHeap.usedJSHeapSize : null,
    topRequests: requests
      .sort((a, b) => b.contentLength - a.contentLength)
      .slice(0, 10)
      .map((r) => ({
        url: r.url.replace(BASE_URL, ''),
        type: r.type,
        sizeKB: Math.round(r.contentLength / 1024),
      })),
  };
}

async function runPostOptimizationAudit() {
  console.log('🚀 Starting Post-Optimization Performance Benchmark Audit...');
  fs.mkdirSync(path.join(OUT_DIR, 'final'), { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1440,900',
    ],
  });

  const results = {
    timestamp: new Date().toISOString(),
    environment: 'Optimized (Lazy Video, Splitted Vendor Chunks, Non-blocking Fonts, Hero Preload, Static Caching)',
  };

  try {
    // 1. Homepage Desktop
    console.log('\n📊 1. Measuring Optimized Homepage (Desktop)...');
    results.homepageDesktop = await measurePage(browser, `${BASE_URL}/`, {
      screenshotPath: path.join(OUT_DIR, 'final/01-homepage-desktop-optimized.png'),
    });
    console.log(`   FCP: ${results.homepageDesktop.fcpMs}ms | LCP: ${results.homepageDesktop.lcpMs}ms | CLS: ${results.homepageDesktop.cls} | Transferred: ${results.homepageDesktop.totalTransferredMB} MB`);

    // 2. Homepage Mobile (iPhone 14)
    console.log('📊 2. Measuring Optimized Homepage (Mobile iPhone 14)...');
    results.homepageMobile = await measurePage(browser, `${BASE_URL}/`, {
      isMobile: true,
      screenshotPath: path.join(OUT_DIR, 'final/02-homepage-mobile-optimized.png'),
    });
    console.log(`   FCP: ${results.homepageMobile.fcpMs}ms | LCP: ${results.homepageMobile.lcpMs}ms | CLS: ${results.homepageMobile.cls} | Transferred: ${results.homepageMobile.totalTransferredMB} MB`);

    // 3. Homepage Fast 4G
    console.log('📊 3. Measuring Optimized Homepage (Fast 4G Emulated)...');
    results.homepageFast4G = await measurePage(browser, `${BASE_URL}/`, {
      networkThrottling: true,
      screenshotPath: path.join(OUT_DIR, 'final/03-homepage-fast4g-optimized.png'),
    });
    console.log(`   FCP: ${results.homepageFast4G.fcpMs}ms | LCP: ${results.homepageFast4G.lcpMs}ms | CLS: ${results.homepageFast4G.cls}`);

    // Auth credentials for protected routes
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
    console.log('📊 4. Measuring Optimized Admin Login (/portal/login)...');
    results.adminLogin = await measurePage(browser, `${BASE_URL}/portal/login`, {
      screenshotPath: path.join(OUT_DIR, 'final/04-admin-login-optimized.png'),
    });
    console.log(`   LCP: ${results.adminLogin.lcpMs}ms | Transferred: ${results.adminLogin.totalTransferredMB} MB`);

    // 5. CRM Login
    console.log('📊 5. Measuring Optimized CRM Login (/portal/login?next=crm)...');
    results.crmLogin = await measurePage(browser, `${BASE_URL}/portal/login?next=crm`, {
      screenshotPath: path.join(OUT_DIR, 'final/05-crm-login-optimized.png'),
    });
    console.log(`   LCP: ${results.crmLogin.lcpMs}ms | Transferred: ${results.crmLogin.totalTransferredMB} MB`);

    // 6. Admin Portal Dashboard
    console.log('📊 6. Measuring Optimized Admin Portal (/portal)...');
    results.adminPortal = await measurePage(browser, `${BASE_URL}/portal`, {
      localStorageData: authStorage,
      cookies: authCookies,
      screenshotPath: path.join(OUT_DIR, 'final/06-admin-portal-optimized.png'),
    });
    console.log(`   LCP: ${results.adminPortal.lcpMs}ms | Memory: ${results.adminPortal.memoryMB} MB`);

    // 7. Theme Manager
    console.log('📊 7. Measuring Optimized Theme Manager (/portal?section=theme)...');
    results.themeManager = await measurePage(browser, `${BASE_URL}/portal?section=theme`, {
      localStorageData: authStorage,
      cookies: authCookies,
      screenshotPath: path.join(OUT_DIR, 'final/07-theme-manager-optimized.png'),
    });
    console.log(`   LCP: ${results.themeManager.lcpMs}ms | Transferred: ${results.themeManager.totalTransferredMB} MB`);

    // 8. CRM Workspace Dashboard
    console.log('📊 8. Measuring Optimized CRM Workspace Dashboard (/admin/crm/)...');
    results.crmDashboard = await measurePage(browser, `${BASE_URL}/admin/crm/`, {
      localStorageData: authStorage,
      cookies: authCookies,
      screenshotPath: path.join(OUT_DIR, 'final/08-crm-dashboard-optimized.png'),
    });
    console.log(`   LCP: ${results.crmDashboard.lcpMs}ms | Memory: ${results.crmDashboard.memoryMB} MB`);

    // 9. CRM Calendar Workspace
    console.log('📊 9. Measuring Optimized CRM Calendar Workspace (/admin/crm/?tool=calendar)...');
    results.crmCalendar = await measurePage(browser, `${BASE_URL}/admin/crm/?tool=calendar`, {
      localStorageData: authStorage,
      cookies: authCookies,
      screenshotPath: path.join(OUT_DIR, 'final/09-crm-calendar-optimized.png'),
    });
    console.log(`   LCP: ${results.crmCalendar.lcpMs}ms | Memory: ${results.crmCalendar.memoryMB} MB`);

    // Save full JSON report
    const reportPath = path.join(OUT_DIR, 'post-optimization-performance-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ Post-optimization report written to ${reportPath}`);

    // Read baseline and compute comparative metrics
    const baselinePath = path.join(OUT_DIR, 'baseline-performance-results.json');
    if (fs.existsSync(baselinePath)) {
      const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      console.log('\n======================================================');
      console.log('🏆 PERFORMANCE COMPARISON: BASELINE vs OPTIMIZED');
      console.log('======================================================');
      const compare = (name, base, opt) => {
        if (!base || !opt) return;
        const lcpDiff = base.lcpMs && opt.lcpMs ? base.lcpMs - opt.lcpMs : 0;
        const lcpPct = base.lcpMs && opt.lcpMs ? Math.round((lcpDiff / base.lcpMs) * 100) : 0;
        const byteDiff = Math.round((base.totalTransferredMB - opt.totalTransferredMB) * 100) / 100;
        const bytePct = base.totalTransferredMB > 0 ? Math.round((byteDiff / base.totalTransferredMB) * 100) : 0;
        console.log(`📌 ${name}:`);
        console.log(`   • LCP: ${base.lcpMs}ms ➔ ${opt.lcpMs}ms (${lcpDiff > 0 ? '-' : '+'}${Math.abs(lcpDiff)}ms, ${lcpPct}% improvement)`);
        console.log(`   • Transferred: ${base.totalTransferredMB}MB ➔ ${opt.totalTransferredMB}MB (${byteDiff > 0 ? '-' : '+'}${Math.abs(byteDiff)}MB, ${bytePct}% bandwidth saved)`);
        console.log(`   • CLS: ${base.cls} ➔ ${opt.cls}`);
        console.log(`   • Long Tasks: ${base.longTasksCount} (${base.longTasksTotalMs}ms) ➔ ${opt.longTasksCount} (${opt.longTasksTotalMs}ms)`);
      };

      compare('Homepage Desktop', baseline.homepageDesktop, results.homepageDesktop);
      compare('Homepage Mobile', baseline.homepageMobile, results.homepageMobile);
      compare('Admin Portal', baseline.adminPortal, results.adminPortal);
      compare('CRM Dashboard', baseline.crmDashboard, results.crmDashboard);
    }
  } finally {
    await browser.close();
  }
}

runPostOptimizationAudit().catch((err) => {
  console.error('Post-optimization audit failed:', err);
  process.exit(1);
});
