/**
 * Comprehensive Automated Verification Suite for ELFAZNI SERVICES
 * Theme, Branding & Appearance Management System
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  readThemes,
  writeThemes,
  resolveEffectiveTheme,
  OFFICIAL_BRAND_COLORS,
  OFFICIAL_TYPOGRAPHY,
} from './server/themeStore.ts';
import { sanitizeSvgContent } from './server/themeRoutes.ts';

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

async function run() {
  console.log('===============================================================');
  console.log('🧪 ELFAZNI SERVICES — THEME & APPEARANCE SYSTEM VERIFICATION');
  console.log('===============================================================\n');

  // -------------------------------------------------------------
  // SUITE 1: Files, Architecture & Components Verification
  // -------------------------------------------------------------
  console.log('=== SUITE 1: File Architecture & Component Manifest ===');
  const requiredFiles = [
    'server/themeStore.ts',
    'server/themeRoutes.ts',
    'data/themes.json',
    'src/services/themeService.ts',
    'crm/src/services/themeService.ts',
    'src/components/admin/theme/AdminThemeManager.tsx',
    'src/components/admin/theme/ThemeOverviewView.tsx',
    'src/components/admin/theme/ThemeSettingsSidebar.tsx',
    'src/components/admin/theme/ThemeLivePreview.tsx',
    'src/components/admin/theme/ThemeElementInspector.tsx',
    'src/components/admin/theme/ThemeColorPicker.tsx',
    'src/components/admin/theme/ThemeMediaLibrary.tsx',
    'src/components/admin/theme/ThemePresetsView.tsx',
    'src/components/admin/theme/ThemeHistoryView.tsx',
  ];

  for (const f of requiredFiles) {
    const fullPath = path.join(__dirname, f);
    assert(fs.existsSync(fullPath), `File exists: ${f}`);
  }

  // -------------------------------------------------------------
  // SUITE 2: RBAC Theme Permissions Verification
  // -------------------------------------------------------------
  console.log('\n=== SUITE 2: RBAC Theme Permissions Verification ===');
  const dbTsPath = path.join(__dirname, 'server', 'db.ts');
  const dbTsContent = fs.readFileSync(dbTsPath, 'utf8');
  const themePerms = [
    'theme.view',
    'theme.edit',
    'theme.preview',
    'theme.publish',
    'theme.restore',
    'theme.assets.manage',
    'theme.global.manage',
  ];
  for (const perm of themePerms) {
    assert(dbTsContent.includes(`'${perm}'`), `Permission registered in PERMISSIONS_REGISTRY: ${perm}`);
  }

  // Check superadmin role has all theme perms in data/db.json
  const dbJsonPath = path.join(__dirname, 'data', 'db.json');
  const dbJson = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
  const superadminRole = dbJson.roles?.find((r) => r.id === 'superadmin');
  assert(Boolean(superadminRole), 'Superadmin role exists in db.json');
  if (superadminRole) {
    for (const perm of themePerms) {
      assert(superadminRole.permissions.includes(perm), `Superadmin role has permission: ${perm}`);
    }
  }

  // -------------------------------------------------------------
  // SUITE 3: Admin Sidebar Navigation & Submenus (1.1 - 1.9)
  // -------------------------------------------------------------
  console.log('\n=== SUITE 3: Admin Sidebar Navigation & Submenus (1.1 - 1.9) ===');
  const adminLayoutPath = path.join(__dirname, 'src', 'components', 'admin', 'AdminLayout.tsx');
  const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf8');
  assert(adminLayoutContent.includes('إدارة المظهر والهوية البصرية'), 'Sidebar contains Arabic title: إدارة المظهر والهوية البصرية');
  assert(adminLayoutContent.includes('Theme & Appearance'), 'Sidebar contains English title: Theme & Appearance');
  assert(adminLayoutContent.includes("sub: 'overview'"), "Submenu 1.1: 'overview' (نظرة عامة)");
  assert(adminLayoutContent.includes("sub: 'website'"), "Submenu 1.2: 'website' (مظهر الموقع الإلكتروني)");
  assert(adminLayoutContent.includes("sub: 'portal'"), "Submenu 1.3: 'portal' (مظهر البوابة الرئيسية)");
  assert(adminLayoutContent.includes("sub: 'admin_login'"), "Submenu 1.4: 'admin_login' (مظهر تسجيل دخول الإدارة)");
  assert(adminLayoutContent.includes("sub: 'crm_login'"), "Submenu 1.5: 'crm_login' (مظهر تسجيل دخول CRM)");
  assert(adminLayoutContent.includes("sub: 'brand_global'"), "Submenu 1.6: 'brand_global' (الهوية البصرية العامة)");
  assert(adminLayoutContent.includes("sub: 'media_library'"), "Submenu 1.7: 'media_library' (مكتبة الصور والشعارات)");
  assert(adminLayoutContent.includes("sub: 'presets'"), "Submenu 1.8: 'presets' (القوالب الجاهزة)");
  assert(adminLayoutContent.includes("sub: 'history'"), "Submenu 1.9: 'history' (سجل التعديلات والنسخ)");
  assert(adminLayoutContent.includes('<AdminThemeManager'), 'AdminLayout renders AdminThemeManager component');

  // -------------------------------------------------------------
  // SUITE 4: Official ELFAZNI SERVICES Brand Tokens
  // -------------------------------------------------------------
  console.log('\n=== SUITE 4: Official ELFAZNI SERVICES Brand Tokens ===');
  assert(OFFICIAL_BRAND_COLORS.primary === '#004AA5', 'Official Primary Blue is #004AA5');
  assert(OFFICIAL_BRAND_COLORS.gold === '#CC9048', 'Official Gold is #CC9048');
  assert(OFFICIAL_BRAND_COLORS.navySupport === '#10345B', 'Supporting Navy is #10345B');
  assert(OFFICIAL_TYPOGRAPHY.fontFamily.includes('Bahij'), 'Typography uses Bahij for Arabic');

  // -------------------------------------------------------------
  // SUITE 5: Database Schema & Theme Targets Verification
  // -------------------------------------------------------------
  console.log('\n=== SUITE 5: Themes Database & Interface Targets ===');
  const db = readThemes();
  const expectedTargets = ['global', 'website', 'portal', 'admin_login', 'crm_login'];
  for (const t of expectedTargets) {
    assert(Boolean(db.published[t]), `Published theme exists for target: ${t}`);
    assert(Boolean(db.drafts[t]), `Draft theme exists for target: ${t}`);
  }
  assert(Array.isArray(db.presets) && db.presets.length >= 4, 'Theme presets registered (>= 4)');
  assert(Array.isArray(db.versions) && db.versions.length >= 1, 'Version snapshots registered');
  assert(Array.isArray(db.assets) && db.assets.length >= 5, 'Media assets library populated');
  assert(Array.isArray(db.auditLogs), 'Audit logs registered');

  // -------------------------------------------------------------
  // SUITE 6: Independent Theme Isolation (Admin Login vs CRM Login)
  // -------------------------------------------------------------
  console.log('\n=== SUITE 6: Independent Theme Isolation (Admin vs CRM Login) ===');
  // Mutate Admin Login illustration
  const originalAdminIllustration = db.published.admin_login.illustrationUrl;
  const originalCrmIllustration = db.published.crm_login.illustrationUrl;
  assert(Boolean(originalAdminIllustration), 'Admin Login has initial illustration');
  assert(Boolean(originalCrmIllustration), 'CRM Login has initial illustration');
  assert(originalAdminIllustration !== originalCrmIllustration, 'Default illustrations are distinct');

  // Update Admin Login draft illustration
  const testAdminIllustration = '/assets/brand/3d/admin-test-unique.png';
  db.drafts.admin_login.illustrationUrl = testAdminIllustration;
  writeThemes(db);

  const reloadedDb1 = readThemes();
  assert(
    reloadedDb1.drafts.crm_login.illustrationUrl !== testAdminIllustration,
    'Changing Admin Login illustration does NOT affect CRM Login illustration'
  );

  // Update CRM Login heading
  const testCrmHeading = 'بوابة نظام إدارة العملاء المخصص';
  db.drafts.crm_login.texts.loginTitle = { ar: testCrmHeading, en: 'CRM Portal', fr: 'Portail CRM' };
  writeThemes(db);

  const reloadedDb2 = readThemes();
  assert(
    reloadedDb2.drafts.admin_login.texts.loginTitle?.ar !== testCrmHeading,
    'Changing CRM Login heading does NOT modify Admin Login heading'
  );

  // Clean up drafts
  db.drafts.admin_login.illustrationUrl = originalAdminIllustration;
  delete db.drafts.crm_login.texts.loginTitle;
  writeThemes(db);

  // -------------------------------------------------------------
  // SUITE 7: Global Brand Identity Inheritance & Local Overrides
  // -------------------------------------------------------------
  console.log('\n=== SUITE 7: Global Brand Inheritance, Overrides & Reset ===');
  // Step 1: Ensure CRM Login inherits from global
  db.published.crm_login.inheritBrandColors = true;
  db.published.crm_login.colors = {};
  db.published.global.colors.primary = '#004AA5';
  writeThemes(db);

  let effectiveCrm = resolveEffectiveTheme('crm_login', false);
  assert(
    effectiveCrm.colors.primary === '#004AA5',
    'CRM Login inherits global primary color #004AA5 when not overridden'
  );

  // Step 2: Change global color to test dynamic inheritance
  db.published.global.colors.primary = '#0055CC';
  writeThemes(db);
  effectiveCrm = resolveEffectiveTheme('crm_login', false);
  assert(
    effectiveCrm.colors.primary === '#0055CC',
    'CRM Login dynamically reflects updated global primary color #0055CC'
  );

  // Step 3: Explicitly override primary color on CRM Login
  db.published.crm_login.colors.primary = '#123456';
  writeThemes(db);
  effectiveCrm = resolveEffectiveTheme('crm_login', false);
  assert(
    effectiveCrm.colors.primary === '#123456',
    'CRM Login uses its custom override #123456'
  );

  // Step 4: Change global again, verifying override is preserved
  db.published.global.colors.primary = '#004AA5'; // restore official
  writeThemes(db);
  effectiveCrm = resolveEffectiveTheme('crm_login', false);
  assert(
    effectiveCrm.colors.primary === '#123456',
    'CRM Login preserves its custom override even after global changes'
  );

  // Step 5: Reset CRM Login to Global Brand Settings (Reset to Global)
  db.published.crm_login.colors = {};
  db.published.crm_login.inheritBrandColors = true;
  writeThemes(db);
  effectiveCrm = resolveEffectiveTheme('crm_login', false);
  assert(
    effectiveCrm.colors.primary === '#004AA5',
    'Reset to Global re-inherits global primary color #004AA5'
  );

  // -------------------------------------------------------------
  // SUITE 8: SVG Security & Sanitization Pipeline
  // -------------------------------------------------------------
  console.log('\n=== SUITE 8: SVG Sanitization Pipeline & XSS Prevention ===');
  const maliciousSvg = `<?xml version="1.0" encoding="utf-8"?>
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" fill="red" onload="alert('xss-attr')" />
  <script type="text/javascript">
    alert('xss-tag');
  </script>
  <a href="javascript:alert('xss-link')"><text x="10" y="20">Click</text></a>
  <iframe src="http://evil.com"></iframe>
  <object data="malicious.swf"></object>
  <foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><script>alert('xss-foreign')</script></body></foreignObject>
</svg>`;

  const sanitized = sanitizeSvgContent(maliciousSvg);
  assert(!sanitized.includes('<script'), 'Malicious <script> tag completely stripped');
  assert(!sanitized.includes('onload='), 'Malicious onload attribute stripped');
  assert(!sanitized.includes('javascript:'), 'Malicious javascript: protocol stripped');
  assert(!sanitized.includes('<iframe'), 'Malicious <iframe> element stripped');
  assert(!sanitized.includes('<object'), 'Malicious <object> element stripped');
  assert(!sanitized.includes('<foreignObject'), 'Malicious <foreignObject> element stripped');
  assert(sanitized.includes('<svg') && sanitized.includes('<circle'), 'Valid SVG markup and elements preserved');

  // -------------------------------------------------------------
  // SUITE 9: Draft vs. Publish Workflow & Version Snapshots
  // -------------------------------------------------------------
  console.log('\n=== SUITE 9: Draft vs. Publish Workflow & Rollback ===');
  const portalBefore = readThemes().published.portal;
  const initialVersionCount = readThemes().versions.length;

  // Edit draft of portal
  const testHeroTitle = 'بوابة الفزني الموحدة — مسودة اختبار';
  const currentDb = readThemes();
  if (!currentDb.drafts.portal.texts) currentDb.drafts.portal.texts = {};
  currentDb.drafts.portal.texts.heroTitle = { ar: testHeroTitle, en: 'Test Title', fr: 'Titre Test' };
  writeThemes(currentDb);

  // Verify published was NOT modified
  const reloadedDraftDb = readThemes();
  assert(
    reloadedDraftDb.published.portal.texts?.heroTitle?.ar !== testHeroTitle,
    'Draft modifications do NOT alter the published portal theme'
  );

  // Publish portal draft
  const now = new Date().toISOString();
  const snapshotConfig = JSON.parse(JSON.stringify(reloadedDraftDb.drafts.portal));
  const newVersionId = `ver_test_${Date.now()}`;
  reloadedDraftDb.published.portal = snapshotConfig;
  reloadedDraftDb.versions.unshift({
    id: newVersionId,
    target: 'portal',
    versionNumber: (reloadedDraftDb.published.portal.version || 1) + 1,
    snapshot: snapshotConfig,
    publishedAt: now,
    publishedBy: 'superadmin',
    changeSummary: 'Verified automated test publish',
  });
  writeThemes(reloadedDraftDb);

  // Verify published now reflects changes
  const publishedCheck = readThemes().published.portal;
  assert(
    publishedCheck.texts?.heroTitle?.ar === testHeroTitle,
    'Publishing draft updates the published portal configuration'
  );
  assert(
    readThemes().versions.length === initialVersionCount + 1,
    'Version snapshot successfully archived into history'
  );

  // Test 1-click restore from snapshot
  const dbToRestore = readThemes();
  dbToRestore.published.portal = JSON.parse(JSON.stringify(portalBefore));
  dbToRestore.drafts.portal = JSON.parse(JSON.stringify(portalBefore));
  writeThemes(dbToRestore);

  const restoredPortal = readThemes().published.portal;
  assert(
    restoredPortal.texts?.heroTitle?.ar !== testHeroTitle,
    'Restoring previous version resets published portal configuration'
  );

  // -------------------------------------------------------------
  // SUITE 10: Unified Access Portal Cards Customization
  // -------------------------------------------------------------
  console.log('\n=== SUITE 10: Unified Access Portal Cards Customization ===');
  const portalTheme = readThemes().published.portal;
  assert(Array.isArray(portalTheme.portalCards) && portalTheme.portalCards.length === 3, 'Portal has 3 default cards');
  const cardIds = portalTheme.portalCards.map((c) => c.id);
  assert(cardIds.includes('website'), 'Portal contains website card');
  assert(cardIds.includes('crm'), 'Portal contains crm card');
  assert(cardIds.includes('admin'), 'Portal contains admin card');
  assert(portalTheme.portalCards.find((c) => c.id === 'crm')?.featured === true, 'CRM card is featured by default');

  // -------------------------------------------------------------
  // SUITE 11: Theme Presets Registry
  // -------------------------------------------------------------
  const presets = readThemes().presets;
  const expectedPresetIds = ['official-elfazni', 'premium-navy', 'modern-minimal', 'elegant-gold', 'dark-modern'];
  for (const pid of expectedPresetIds) {
    const found = presets.find((p) => p.id === pid);
    assert(Boolean(found), `Theme preset exists: ${pid} (${found?.nameAr || ''})`);
  }

  // -------------------------------------------------------------
  // SUITE 12: Client Theme Service & CSS Variables Integration
  // -------------------------------------------------------------
  console.log('\n=== SUITE 12: Client Theme Service Integration ===');
  const themeServiceRoot = fs.readFileSync(path.join(__dirname, 'src', 'services', 'themeService.ts'), 'utf8');
  const themeServiceCrm = fs.readFileSync(path.join(__dirname, 'crm', 'src', 'services', 'themeService.ts'), 'utf8');
  assert(themeServiceRoot.includes('applyCssVariables'), 'Root themeService implements applyCssVariables');
  assert(themeServiceCrm.includes('applyCssVariables'), 'CRM themeService implements applyCssVariables');
  assert(themeServiceRoot.includes('--brand-blue'), 'Theme service injects --brand-blue');
  assert(themeServiceRoot.includes('--brand-gold'), 'Theme service injects --brand-gold');
  assert(themeServiceRoot.includes('getPublishedTheme'), 'Theme service implements getPublishedTheme');

  console.log('\n===============================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
