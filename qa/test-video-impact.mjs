import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire('/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/');
const puppeteer = require('puppeteer-core');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const OUT_DIR = path.resolve('qa/performance');

async function runTest(withVideo, label) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const client = await page.target().createCDPSession();
  await client.send('Network.enable');

  if (!withVideo) {
    // Block video requests
    await client.send('Network.setBlockedURLs', {
      urls: ['*.mp4', '*.webm', '*assets/videos/*'],
    });
  }

  let totalBytes = 0;
  let videoBytes = 0;
  const requests = [];

  client.on('Network.loadingFinished', (event) => {
    totalBytes += event.encodedDataLength || 0;
  });

  client.on('Network.responseReceived', (event) => {
    const { response, type } = event;
    const url = response.url;
    const size = response.encodedDataLength || 0;
    requests.push({ url, type, size });
    if (url.includes('.mp4') || url.includes('/assets/videos/')) {
      videoBytes += size;
    }
  });

  // Inject LCP and performance observer
  await page.evaluateOnNewDocument(() => {
    window.__perf = { lcp: 0, fcp: 0, longTasks: 0, longTaskDuration: 0 };
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) window.__perf.lcp = entries[entries.length - 1].startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        window.__perf.longTasks++;
        window.__perf.longTaskDuration += entry.duration;
      }
    }).observe({ type: 'longtask', buffered: true });
  });

  const t0 = Date.now();
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 45000 });
  const loadDuration = Date.now() - t0;
  await new Promise((r) => setTimeout(r, 2000));

  const screenshotPath = path.join(
    OUT_DIR,
    withVideo ? 'video-enabled/homepage-video-enabled.png' : 'video-disabled/homepage-video-disabled.png'
  );
  const dir = path.dirname(screenshotPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: false });

  const metrics = await page.evaluate(() => {
    const paints = performance.getEntriesByType('paint');
    const fcp = paints.find((p) => p.name === 'first-contentful-paint')?.startTime || 0;
    const nav = performance.getEntriesByType('navigation')[0] || {};
    return {
      fcp: Math.round(fcp),
      lcp: Math.round(window.__perf.lcp || fcp),
      ttfb: nav.responseStart ? Math.round(nav.responseStart - nav.requestStart) : 0,
      longTasks: window.__perf.longTasks,
      longTaskDurationMs: Math.round(window.__perf.longTaskDuration),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
    };
  });

  await browser.close();

  return {
    label,
    withVideo,
    loadDurationMs: loadDuration,
    fcpMs: metrics.fcp,
    lcpMs: metrics.lcp,
    ttfbMs: metrics.ttfb,
    longTasks: metrics.longTasks,
    longTaskDurationMs: metrics.longTaskDurationMs,
    totalRequests: requests.length,
    totalTransferredMB: parseFloat((totalBytes / (1024 * 1024)).toFixed(2)),
    videoTransferredMB: parseFloat((videoBytes / (1024 * 1024)).toFixed(2)),
    screenshotPath,
  };
}

async function main() {
  console.log('🎬 Running Controlled Video Impact Test...\n');

  console.log('▶️ Running Test A: Video ENABLED...');
  const testA = await runTest(true, 'Test A: Video ENABLED');
  console.log(`   Load: ${testA.loadDurationMs}ms | LCP: ${testA.lcpMs}ms | Total Transfer: ${testA.totalTransferredMB} MB | Video Transfer: ${testA.videoTransferredMB} MB | Long Tasks: ${testA.longTasks} (${testA.longTaskDurationMs}ms)`);

  console.log('⏹️ Running Test B: Video DISABLED (Blocked)...');
  const testB = await runTest(false, 'Test B: Video DISABLED');
  console.log(`   Load: ${testB.loadDurationMs}ms | LCP: ${testB.lcpMs}ms | Total Transfer: ${testB.totalTransferredMB} MB | Video Transfer: ${testB.videoTransferredMB} MB | Long Tasks: ${testB.longTasks} (${testB.longTaskDurationMs}ms)`);

  const report = { testA, testB, timestamp: new Date().toISOString() };
  const outPath = path.join(OUT_DIR, 'video-comparison-results.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log('\n========================================================================');
  console.log('📊 COMPARISON SUMMARY:');
  console.log(`   Data Transfer: ${testA.totalTransferredMB} MB (With Video) ➔ ${testB.totalTransferredMB} MB (Without Video) [Saved: ${(testA.totalTransferredMB - testB.totalTransferredMB).toFixed(2)} MB]`);
  console.log(`   Load Duration: ${testA.loadDurationMs}ms ➔ ${testB.loadDurationMs}ms [Diff: ${testA.loadDurationMs - testB.loadDurationMs}ms]`);
  console.log(`   LCP: ${testA.lcpMs}ms (With Video) vs ${testB.lcpMs}ms (Without Video)`);
  console.log(`   CPU Long Tasks: ${testA.longTasks} tasks (${testA.longTaskDurationMs}ms) ➔ ${testB.longTasks} tasks (${testB.longTaskDurationMs}ms)`);
  console.log('========================================================================\n');
}

main().catch(console.error);
