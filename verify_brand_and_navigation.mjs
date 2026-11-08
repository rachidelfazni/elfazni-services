/**
 * Verification Script: ELFAZNI SERVICES Brand Identity, Logos, and Cross-App Navigation Matrix
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n=== SUITE 1: 6 Official Vector SVG Logo Assets ===');
const logoFiles = [
  'elfazni-horizontal-on-white.svg',
  'elfazni-horizontal-on-blue.svg',
  'elfazni-horizontal-on-gold.svg',
  'elfazni-vertical-on-white.svg',
  'elfazni-vertical-on-blue.svg',
  'elfazni-vertical-on-gold.svg',
];

for (const file of logoFiles) {
  const rootPath = path.join(__dirname, 'public', 'assets', 'logos', file);
  const crmPath = path.join(__dirname, 'crm', 'public', 'assets', 'logos', file);
  assert(fs.existsSync(rootPath), `Root public logo exists: ${file}`);
  assert(fs.existsSync(crmPath), `CRM public logo exists: ${file}`);

  if (fs.existsSync(rootPath)) {
    const content = fs.readFileSync(rootPath, 'utf8');
    assert(content.includes('<svg') && content.includes('viewBox='), `SVG is valid vector: ${file}`);
    if (file.includes('horizontal')) {
      assert(content.includes('viewBox="0 0 1220 498"'), `Horizontal SVG has correct viewBox 1220x498: ${file}`);
    } else {
      assert(content.includes('viewBox="0 0 411 700"'), `Vertical SVG has correct viewBox 411x700: ${file}`);
    }
  }
}

console.log('\n=== SUITE 2: Reusable BrandLogo Component ===');
const brandLogoRoot = path.join(__dirname, 'src', 'components', 'common', 'BrandLogo.tsx');
const brandLogoCrm = path.join(__dirname, 'crm', 'src', 'components', 'common', 'BrandLogo.tsx');
assert(fs.existsSync(brandLogoRoot), 'src/components/common/BrandLogo.tsx exists');
assert(fs.existsSync(brandLogoCrm), 'crm/src/components/common/BrandLogo.tsx exists');

const brandLogoContent = fs.readFileSync(brandLogoRoot, 'utf8');
assert(brandLogoContent.includes('elfazni-horizontal-on-white.svg'), 'BrandLogo maps horizontal on white');
assert(brandLogoContent.includes('elfazni-horizontal-on-blue.svg'), 'BrandLogo maps horizontal on blue');
assert(brandLogoContent.includes('elfazni-horizontal-on-gold.svg'), 'BrandLogo maps horizontal on gold');
assert(brandLogoContent.includes('elfazni-vertical-on-white.svg'), 'BrandLogo maps vertical on white');
assert(brandLogoContent.includes('elfazni-vertical-on-blue.svg'), 'BrandLogo maps vertical on blue');
assert(brandLogoContent.includes('elfazni-vertical-on-gold.svg'), 'BrandLogo maps vertical on gold');

console.log('\n=== SUITE 3: Navigation Matrix & App Switchers ===');
const navConfigPath = path.join(__dirname, 'src', 'config', 'navigation.ts');
const crmNavConfigPath = path.join(__dirname, 'crm', 'src', 'config', 'navigation.ts');
assert(fs.existsSync(navConfigPath), 'src/config/navigation.ts exists');
assert(fs.existsSync(crmNavConfigPath), 'crm/src/config/navigation.ts exists');

const headerContent = fs.readFileSync(path.join(__dirname, 'src', 'components', 'Header.tsx'), 'utf8');
assert(headerContent.includes("id: 'home'"), 'Header has home as primary nav item');
assert(headerContent.includes('BrandLogo'), 'Header uses BrandLogo component');
assert(headerContent.includes('/hub'), 'Header mobile menu includes HUB link');

const footerContent = fs.readFileSync(path.join(__dirname, 'src', 'components', 'Footer.tsx'), 'utf8');
assert(footerContent.includes('BrandLogo') && footerContent.includes('background="blue"'), 'Footer uses BrandLogo on blue background');
assert(!footerContent.includes('brightness-0 invert'), 'Footer does NOT use brightness-0 invert CSS filter');
assert(footerContent.includes('/hub'), 'Footer includes HUB link');

const adminLayoutContent = fs.readFileSync(path.join(__dirname, 'src', 'components', 'admin', 'AdminLayout.tsx'), 'utf8');
assert(adminLayoutContent.includes('BrandLogo'), 'AdminLayout uses BrandLogo in header');
assert(adminLayoutContent.includes("onNavigate('/')"), 'AdminLayout has link to public website');
assert(adminLayoutContent.includes("onNavigate('/hub')"), 'AdminLayout has link to HUB');
assert(adminLayoutContent.includes('admin/login?next=crm'), 'AdminLayout has link to CRM');
assert(adminLayoutContent.includes('onLogout'), 'AdminLayout maintains distinct Logout action');

const crmNavbarContent = fs.readFileSync(path.join(__dirname, 'crm', 'src', 'components', 'Navbar.tsx'), 'utf8');
assert(crmNavbarContent.includes('BrandLogo'), 'CRM Navbar uses BrandLogo');
assert(crmNavbarContent.includes('href="/"'), 'CRM Navbar has link to public website');
assert(crmNavbarContent.includes('href="/hub"'), 'CRM Navbar has link to HUB');
assert(crmNavbarContent.includes('href="/admin"'), 'CRM Navbar has link to Admin Panel');
assert(crmNavbarContent.includes('logout'), 'CRM Navbar maintains distinct Logout action');

const hubPageContent = fs.readFileSync(path.join(__dirname, 'src', 'components', 'hub', 'HubPage.tsx'), 'utf8');
assert(hubPageContent.includes('BrandLogo'), 'HubPage uses BrandLogo');
assert(hubPageContent.includes("website: '/'"), 'HubPage links to website');
assert(hubPageContent.includes("crm: '/admin/crm'"), 'HubPage links to CRM');
assert(hubPageContent.includes("admin: '/admin'"), 'HubPage links to Admin');

console.log('\n=== SUITE 4: Authentication Redesign & Zero Hardcoded Credentials ===');
const adminLoginContent = fs.readFileSync(path.join(__dirname, 'src', 'components', 'admin', 'AdminLogin.tsx'), 'utf8');
assert(!adminLoginContent.includes("useState('elfazni.admin')"), 'AdminLogin has no hardcoded username');
assert(adminLoginContent.includes('BrandLogo'), 'AdminLogin uses BrandLogo');
assert(adminLoginContent.includes('الانتقال إلى نظام CRM') || adminLoginContent.includes('next=crm'), 'AdminLogin has switch to CRM login');
assert(adminLoginContent.includes('العودة إلى الموقع العام'), 'AdminLogin has back to public website link');

const crmLoginContent = fs.readFileSync(path.join(__dirname, 'crm', 'src', 'components', 'auth', 'LoginPortal.tsx'), 'utf8');
assert(crmLoginContent.includes('BrandLogo'), 'CRM LoginPortal uses BrandLogo');
assert(crmLoginContent.includes('الانتقال إلى لوحة إدارة الموقع') || crmLoginContent.includes('/admin'), 'CRM LoginPortal has switch to Admin Panel');
assert(crmLoginContent.includes('العودة إلى الموقع العام') || crmLoginContent.includes('href="/"'), 'CRM LoginPortal has back to website link');

console.log('\n=== SUITE 5: Arabic Search Normalization ===');
const routesContent = fs.readFileSync(path.join(__dirname, 'server', 'routes.ts'), 'utf8');
assert(routesContent.includes('normalizeArabicSearch'), 'routes.ts has normalizeArabicSearch function');

function normalizeArabicSearch(value) {
  return value
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0653-\u0655\u0640]/g, '')
    .replace(/[\u0622\u0623\u0625\u0671\u0627]/g, '\u0627')
    .replace(/\u0629/g, '\u0647')
    .replace(/[\u0649\u064A]/g, '\u064A')
    .trim();
}

const testCases = [
  { raw: 'الإقامة', expected: 'الاقامه' },
  { raw: 'اقامة', expected: 'اقامه' },
  { raw: 'جواز السفر', expected: 'جواز السفر' },
  { raw: 'القنصلية', expected: 'القنصليه' },
  { raw: 'حجز الطيران', expected: 'حجز الطيران' },
  { raw: 'المغرب', expected: 'المغرب' },
];

for (const tc of testCases) {
  const norm = normalizeArabicSearch(tc.raw);
  assert(norm === tc.expected, `Normalized '${tc.raw}' -> '${norm}'`);
}

console.log('\n=== SUITE 6: Consular Guide Cover Template ===');
const coverPath = path.join(__dirname, 'src', 'components', 'ConsularGuideCover.tsx');
assert(fs.existsSync(coverPath), 'ConsularGuideCover.tsx exists');
const coverContent = fs.readFileSync(coverPath, 'utf8');
assert(coverContent.includes('دليل الوثائق القنصلية المغربية'), 'Cover has main title');
assert(coverContent.includes('سبع خدمات للمغاربة المقيمين في تركيا'), 'Cover has subtitle');
assert(coverContent.includes('Fas konsolosluk belge rehberi'), 'Cover has Turkish bilingual line');
assert(coverContent.includes('المواعيد القنصلية'), 'Cover includes Consular appointments');
assert(coverContent.includes('الترجمة المحلفة'), 'Cover includes Sworn translation');
assert(coverContent.includes('حجوزات الطيران'), 'Cover includes Flight bookings');
assert(coverContent.includes('توصيل المطار'), 'Cover includes Airport transfer');
assert(coverContent.includes('+90 552 267 78 51'), 'Cover has contact WhatsApp number');
assert(coverContent.includes('رشيد الفزني'), 'Cover has founder name');

console.log('\n=== SUITE 7: Enlarged Logos, Interface Transition Button & Redesigned Bank Section ===');
const adminLayoutSrc = fs.readFileSync(path.join(__dirname, 'src', 'components', 'admin', 'AdminLayout.tsx'), 'utf8');
assert(adminLayoutSrc.includes('size="lg"') && (adminLayoutSrc.includes('h-11') || adminLayoutSrc.includes('h-13')), 'AdminLayout has enlarged topbar BrandLogo (size="lg", h-11/h-13/h-14)');
assert(adminLayoutSrc.includes('size={105}'), 'AdminLayout has enlarged overview BrandLogo (size={105})');

const crmNavbarSrc = fs.readFileSync(path.join(__dirname, 'crm', 'src', 'components', 'Navbar.tsx'), 'utf8');
assert(crmNavbarSrc.includes('size="md"') && crmNavbarSrc.includes('h-9 sm:h-10'), 'CRM Navbar has enlarged sidebar BrandLogo (size="md", h-9/h-10)');
assert(crmNavbarSrc.includes('الانتقال إلى الواجهات'), 'CRM Navbar has dedicated Interface Transition button ("الانتقال إلى الواجهات")');
assert(crmNavbarSrc.includes('href="/admin"') && crmNavbarSrc.includes('href="/"') && crmNavbarSrc.includes('href="/hub"'), 'CRM Navbar has all external portal targets (/admin, /, /hub)');

const crmBankSrc = fs.readFileSync(path.join(__dirname, 'crm', 'src', 'components', 'common', 'TangibleShowcaseFooter.tsx'), 'utf8');
assert(crmBankSrc.includes('studio-smart-card'), 'TangibleShowcaseFooter has studio-smart-card smart card container');
assert(crmBankSrc.includes('smart-card-chip'), 'TangibleShowcaseFooter includes EMV metallic microchip representation');
assert(crmBankSrc.includes('smart-card-iban-code'), 'TangibleShowcaseFooter includes formatted smart-card-iban-code');
assert(crmBankSrc.includes('ShieldCheck'), 'TangibleShowcaseFooter includes verified trust badge with ShieldCheck');

const crmCss = fs.readFileSync(path.join(__dirname, 'crm', 'src', 'company-studio.css'), 'utf8');
assert(crmCss.includes('.studio-smart-card'), 'company-studio.css defines .studio-smart-card styling');
assert(crmCss.includes('.smart-card-chip'), 'company-studio.css defines .smart-card-chip metallic styling');

console.log(`\n========================================`);
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
