import puppeteer from '/Users/elfazni/.npm/_npx/3de4f70850fc23c2/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://127.0.0.1:8080';
const OUT_DIR = path.resolve('qa/button-link-audit');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runAudit() {
  console.log('======================================================================');
  console.log('🔍 STARTING COMPREHENSIVE BUTTONS & LINKS AUDIT');
  console.log('======================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const auditResults = {
    totalChecked: 0,
    internalButtonsAndLinks: 0,
    externalLinksFound: [],
    chatgptLinksFound: [],
    pagesAudited: [],
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const pagesToAudit = [
      { url: `${BASE_URL}/`, name: 'Homepage' },
      { url: `${BASE_URL}/blog`, name: 'Blog Index' },
      { url: `${BASE_URL}/hub`, name: 'Services Hub' },
    ];

    for (const target of pagesToAudit) {
      console.log(`\n--- Auditing: ${target.name} (${target.url}) ---`);
      await page.goto(target.url, { waitUntil: 'networkidle2' });
      await sleep(1000);

      const elements = await page.evaluate(() => {
        const results = [];
        // Scan all <a> tags
        document.querySelectorAll('a').forEach((el) => {
          const href = el.getAttribute('href') || '';
          const text = (el.innerText || el.getAttribute('aria-label') || '').trim();
          results.push({
            type: 'a',
            href,
            text: text.slice(0, 60),
            tag: el.outerHTML.slice(0, 150),
          });
        });
        // Scan all <button> tags
        document.querySelectorAll('button').forEach((el) => {
          const text = (el.innerText || el.getAttribute('aria-label') || '').trim();
          results.push({
            type: 'button',
            href: el.getAttribute('data-href') || el.getAttribute('data-url') || '',
            text: text.slice(0, 60),
            tag: el.outerHTML.slice(0, 150),
          });
        });
        return results;
      });

      console.log(`Found ${elements.length} interactive elements on ${target.name}`);

      const pageReport = {
        name: target.name,
        url: target.url,
        totalElements: elements.length,
        items: [],
      };

      for (const el of elements) {
        auditResults.totalChecked++;
        const isChatGPT = el.href.toLowerCase().includes('chatgpt') || el.tag.toLowerCase().includes('chatgpt');
        if (isChatGPT) {
          auditResults.chatgptLinksFound.push({ page: target.name, ...el });
          console.error(`🚨 CHATGPT LINK FOUND on ${target.name}: ${el.href} (${el.text})`);
        }

        const isHttp = el.href.startsWith('http://') || el.href.startsWith('https://');
        const isMailOrTel = el.href.startsWith('mailto:') || el.href.startsWith('tel:');
        const isInternalDomain = el.href.includes('elfazni.com') || el.href.includes('127.0.0.1') || el.href.includes('localhost');
        const isAnchorOrPath = el.href.startsWith('/') || el.href.startsWith('#') || el.href === '';

        if (isHttp && !isInternalDomain) {
          auditResults.externalLinksFound.push({ page: target.name, ...el });
          console.warn(`⚠️ External link: ${el.href} [${el.text}]`);
        } else {
          auditResults.internalButtonsAndLinks++;
        }

        pageReport.items.push(el);
      }

      await page.screenshot({ path: path.join(OUT_DIR, `${target.name.toLowerCase().replace(/\s+/g, '-')}.png`), fullPage: false });
      auditResults.pagesAudited.push(pageReport);
    }

    // Also audit first published blog post if available
    console.log('\n--- Checking for Published Blog Post ---');
    await page.goto(`${BASE_URL}/blog`, { waitUntil: 'networkidle2' });
    const firstArticleSlug = await page.evaluate(() => {
      const articleLink = document.querySelector('a[href^="/blog/"]');
      return articleLink ? articleLink.getAttribute('href') : null;
    });

    if (firstArticleSlug) {
      console.log(`Auditing article: ${firstArticleSlug}`);
      await page.goto(`${BASE_URL}${firstArticleSlug}`, { waitUntil: 'networkidle2' });
      await sleep(1000);

      const articleElements = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('a, button').forEach((el) => {
          results.push({
            type: el.tagName.toLowerCase(),
            href: el.getAttribute('href') || '',
            text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 60),
            tag: el.outerHTML.slice(0, 150),
          });
        });
        return results;
      });

      for (const el of articleElements) {
        auditResults.totalChecked++;
        if (el.href.toLowerCase().includes('chatgpt')) {
          auditResults.chatgptLinksFound.push({ page: 'Blog Post', ...el });
        }
      }
      await page.screenshot({ path: path.join(OUT_DIR, 'blog-post.png'), fullPage: false });
    }

    // Test clicking key buttons on homepage
    console.log('\n--- Testing Functional Clicks on Homepage Buttons ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
    await sleep(800);

    // 1. Click Hero CTA "ابدأ طلبك"
    console.log('Testing "ابدأ طلبك" button modal opening...');
    const startBtn = await page.$('button[aria-label="ابدأ طلبك"], #hero button');
    if (startBtn) {
      await startBtn.click();
      await sleep(600);
      const modalVisible = await page.$eval('div[role="dialog"]', (el) => Boolean(el)).catch(() => false);
      console.log(`Start Request Modal open: ${modalVisible ? 'SUCCESS' : 'FAILED'}`);
      await page.screenshot({ path: path.join(OUT_DIR, 'start-request-modal.png') });
      await page.keyboard.press('Escape');
      await sleep(400);
    }

    // 2. Click CampaignSlider CTA button
    console.log('Testing CampaignSlider CTA button click...');
    const sliderBtn = await page.$('#service-slides button');
    if (sliderBtn) {
      await sliderBtn.click();
      await sleep(600);
      const urlAfterSlider = page.url();
      console.log(`URL after slider click: ${urlAfterSlider} (stays on site: ${!urlAfterSlider.includes('chatgpt')})`);
    }

    console.log('\n======================================================================');
    console.log('📊 AUDIT SUMMARY:');
    console.log(`Total elements checked: ${auditResults.totalChecked}`);
    console.log(`Internal elements: ${auditResults.internalButtonsAndLinks}`);
    console.log(`ChatGPT links found: ${auditResults.chatgptLinksFound.length}`);
    console.log(`External links found: ${auditResults.externalLinksFound.length}`);
    console.log('======================================================================\n');

    fs.writeFileSync(
      path.join(OUT_DIR, 'audit-results.json'),
      JSON.stringify(auditResults, null, 2),
      'utf-8'
    );

  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    await browser.close();
  }
}

runAudit();
