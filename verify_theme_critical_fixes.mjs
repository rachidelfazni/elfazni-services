import 'dotenv/config';
import { readDb } from './server/db.ts';
import { generateToken } from './server/auth.ts';

const BASE_URL = 'http://127.0.0.1:8080';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
    failed++;
  }
}

async function run() {
  console.log('================================================================');
  console.log('🧪 ELFAZNI SERVICES THEME ENGINE & LAYER CRITICAL FIX VERIFICATION');
  console.log('================================================================\n');

  // Step 0: Super Admin Authentication Token
  console.log('🔑 Authenticating as Super Admin (elfazni.admin)...');
  const adminUser = readDb().users.find((u) => u.role === 'superadmin');
  assert(!!adminUser, 'Found Super Admin user in database');
  const token = generateToken(adminUser, 'admin');
  assert(!!token, 'Generated valid Super Admin JWT token');

  // TEST 1 — Red Heading Test
  console.log('\n--- TEST 1: Red Heading Test (#FF0000) ---');
  const redDraftPatch = {
    titleColor: '#FF0000',
    kickerColor: '#CC9048',
    noteColor: '#E2E8F0',
  };
  const saveRedRes = await fetch(`${BASE_URL}/api/theme/draft/admin_login`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(redDraftPatch),
  });
  const saveRedData = await saveRedRes.json();
  assert(saveRedRes.ok && saveRedData.success, 'Draft update with red titleColor accepted');

  const effDraftRes = await fetch(`${BASE_URL}/api/theme/preview/admin_login`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const effDraft = await effDraftRes.json();
  assert(effDraft.theme?.titleColor === '#FF0000', 'Effective draft reflects titleColor = #FF0000', `Got ${effDraft.theme?.titleColor}`);

  // TEST 2 — Gold Gradient Test
  console.log('\n--- TEST 2: Gold Gradient Test (#CC9048, 80% opacity) ---');
  const goldGradientConfig = {
    enabled: true,
    type: 'linear',
    direction: 'to top',
    angle: 0,
    opacity: 0.8,
    stops: [
      { position: 0, color: '#CC9048', opacity: 0.95 },
      { position: 50, color: '#004AA5', opacity: 0.6 },
      { position: 100, color: '#CC9048', opacity: 0.2 },
    ],
  };
  const saveGoldRes = await fetch(`${BASE_URL}/api/theme/draft/admin_login`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ gradient: goldGradientConfig }),
  });
  const saveGoldData = await saveGoldRes.json();
  assert(saveGoldRes.ok && saveGoldData.success, 'Draft update with gold gradient accepted');

  const effGoldRes = await fetch(`${BASE_URL}/api/theme/preview/admin_login`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const effGold = await effGoldRes.json();
  assert(effGold.theme?.gradient?.enabled === true, 'Gradient is enabled in effective theme');
  assert(effGold.theme?.gradient?.opacity === 0.8, 'Gradient opacity is 0.8 in effective theme');
  assert(effGold.theme?.gradient?.stops?.[0]?.color === '#CC9048', 'Gradient start color is #CC9048');

  // TEST 3 — Opacity Slider Test (20% -> 90%)
  console.log('\n--- TEST 3: Opacity Slider Test (20% -> 90%) ---');
  // First set to 20%
  await fetch(`${BASE_URL}/api/theme/draft/admin_login`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ gradient: { ...goldGradientConfig, opacity: 0.2 } }),
  });
  let effOp = await (await fetch(`${BASE_URL}/api/theme/preview/admin_login`, { headers: { Authorization: `Bearer ${token}` } })).json();
  assert(effOp.theme?.gradient?.opacity === 0.2, 'Gradient opacity updated immediately to 20% (0.2)');

  // Then set to 90%
  await fetch(`${BASE_URL}/api/theme/draft/admin_login`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ gradient: { ...goldGradientConfig, opacity: 0.9 } }),
  });
  effOp = await (await fetch(`${BASE_URL}/api/theme/preview/admin_login`, { headers: { Authorization: `Bearer ${token}` } })).json();
  assert(effOp.theme?.gradient?.opacity === 0.9, 'Gradient opacity updated immediately to 90% (0.9)');

  // TEST 4 — Foreground Transparent PNG Test
  console.log('\n--- TEST 4: Foreground Transparent PNG Test ---');
  const transparentPngUrl = '/assets/brand/3d/02-consular-documents-transparent.png';
  const saveIllustrationRes = await fetch(`${BASE_URL}/api/theme/draft/admin_login`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      illustrationUrl: transparentPngUrl,
      illustrationScale: 110,
      illustrationOpacity: 95,
      illustrationRotation: 5,
    }),
  });
  assert(saveIllustrationRes.ok, 'Draft update with transparent PNG and rotation accepted');
  const effIllus = await (await fetch(`${BASE_URL}/api/theme/preview/admin_login`, { headers: { Authorization: `Bearer ${token}` } })).json();
  assert(effIllus.theme?.illustrationUrl === transparentPngUrl, 'Transparent PNG URL matches configured asset');
  assert(effIllus.theme?.illustrationScale === 110, 'Illustration scale is 110%');
  assert(effIllus.theme?.illustrationRotation === 5, 'Illustration rotation is 5deg');

  // TEST 5 — Background Layer Test (Solid Navy #071629)
  console.log('\n--- TEST 5: Background Layer Test (Solid Navy #071629) ---');
  await fetch(`${BASE_URL}/api/theme/draft/admin_login`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      backgroundColor: '#071629',
      backgroundImage: '',
      backgroundOpacity: 100,
      backgroundBlur: 0,
      backgroundBrightness: 100,
    }),
  });
  const effBg = await (await fetch(`${BASE_URL}/api/theme/preview/admin_login`, { headers: { Authorization: `Bearer ${token}` } })).json();
  assert(effBg.theme?.backgroundColor === '#071629', 'Background color is #071629 in effective draft');
  assert(effBg.theme?.backgroundImage === '', 'Background image set to empty string for solid background');

  // TEST 6 — Logo Size and Appearance Test
  console.log('\n--- TEST 6: Logo Size and Scale Test (260px, 120%) ---');
  await fetch(`${BASE_URL}/api/theme/draft/admin_login`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      logoWidth: 260,
      logoScale: 120,
      logoOpacity: 95,
      logoPosition: 'center',
      illustrationLogoVariant: 'horizontal-on-blue',
    }),
  });
  const effLogo = await (await fetch(`${BASE_URL}/api/theme/preview/admin_login`, { headers: { Authorization: `Bearer ${token}` } })).json();
  assert(effLogo.theme?.logoWidth === 260, 'Logo width is 260px in effective draft');
  assert(effLogo.theme?.logoScale === 120, 'Logo scale is 120% in effective draft');
  assert(effLogo.theme?.logoPosition === 'center', 'Logo position is centered');

  // TEST 7 — Isolation and Stacking Context Test
  console.log('\n--- TEST 7: Isolation and Stacking Context Test ---');
  const customLayers = [
    { id: 'logo', labelAr: 'الشعار', labelEn: 'Logo', visible: true, zIndex: 5, opacity: 100 },
    { id: 'content', labelAr: 'العنوان والنصوص', labelEn: 'Headings & Text', visible: true, zIndex: 4, opacity: 100 },
    { id: 'illustration', labelAr: 'المجسم التوضيحي', labelEn: 'Illustration', visible: true, zIndex: 3, opacity: 100 },
    { id: 'gradient', labelAr: 'التدرج اللوني', labelEn: 'Gradient Overlay', visible: true, zIndex: 2, opacity: 85 },
    { id: 'background', labelAr: 'الخلفية', labelEn: 'Background', visible: true, zIndex: 1, opacity: 100 },
  ];
  await fetch(`${BASE_URL}/api/theme/draft/admin_login`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ layers: customLayers }),
  });
  const effLayers = await (await fetch(`${BASE_URL}/api/theme/preview/admin_login`, { headers: { Authorization: `Bearer ${token}` } })).json();
  assert(effLayers.theme?.layers?.length === 5, 'All 5 layers present in effective draft');
  const zMap = effLayers.theme?.layers?.reduce((acc, l) => ({ ...acc, [l.id]: l.zIndex }), {});
  assert(zMap.logo === 5, 'Layer 5 (Logo) has zIndex 5');
  assert(zMap.content === 4, 'Layer 4 (Content) has zIndex 4');
  assert(zMap.illustration === 3, 'Layer 3 (Illustration) has zIndex 3');
  assert(zMap.gradient === 2, 'Layer 2 (Gradient) has zIndex 2');
  assert(zMap.background === 1, 'Layer 1 (Background) has zIndex 1');

  // TEST 8 — Persistence Test: Publish and verify public /api/theme/published/admin_login
  console.log('\n--- TEST 8: Publish and Persistence Test ---');
  const pubRes = await fetch(`${BASE_URL}/api/theme/publish/admin_login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ changeSummary: 'اختبار النشر والتحقق من بقاء التعديلات' }),
  });
  const pubData = await pubRes.json();
  assert(pubRes.ok && pubData.success, 'Theme published successfully to public');

  // Fetch as unauthenticated visitor (like Admin Login page would)
  const publicThemeRes = await fetch(`${BASE_URL}/api/theme/published/admin_login`);
  const publicTheme = await publicThemeRes.json();
  assert(publicTheme.theme?.titleColor === '#FF0000', 'Publicly rendered theme has titleColor = #FF0000');
  assert(publicTheme.theme?.gradient?.enabled === true, 'Publicly rendered theme has gradient enabled');
  assert(publicTheme.theme?.logoWidth === 260, 'Publicly rendered theme has logoWidth = 260');
  assert(publicTheme.theme?.backgroundColor === '#071629', 'Publicly rendered theme has backgroundColor = #071629');
  assert(publicTheme.theme?.layers?.length === 5, 'Publicly rendered theme preserves 5 visual layers');

  // TEST 9 — Restore Previous Version Test
  console.log('\n--- TEST 9: Version History and Rollback Test ---');
  const allRes = await fetch(`${BASE_URL}/api/theme/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const allData = await allRes.json();
  const versions = (allData.versions || []).filter((v) => v.target === 'admin_login');
  assert(versions.length >= 1, `Version snapshots exist for admin_login (total: ${versions.length})`);

  const earliestVer = versions[versions.length - 1];
  console.log(`  Restoring snapshot v${earliestVer.versionNumber} (${earliestVer.id})...`);
  const restoreRes = await fetch(`${BASE_URL}/api/theme/restore/admin_login/${earliestVer.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const restoreData = await restoreRes.json();
  assert(restoreRes.ok && restoreData.success, 'Theme rollback executed successfully');

  const afterRestoreRes = await fetch(`${BASE_URL}/api/theme/preview/admin_login`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const afterRestore = await afterRestoreRes.json();
  assert(afterRestore.theme?.version >= 1, 'Restored theme version loaded cleanly');

  // Re-apply official elegant theme to ensure production looks impeccable
  console.log('\n  Restoring official balanced theme for admin_login...');
  await fetch(`${BASE_URL}/api/theme/draft/admin_login`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      titleColor: '#FFFFFF',
      kickerColor: '#CC9048',
      noteColor: '#E2E8F0',
      backgroundColor: '#071629',
      backgroundImage: '/assets/brand/3d/01-flight-globe-transparent.png',
      backgroundOpacity: 40,
      illustrationUrl: '/assets/brand/3d/02-consular-documents-transparent.png',
      illustrationScale: 100,
      illustrationOpacity: 100,
      gradient: {
        enabled: true,
        type: 'linear',
        direction: 'to top',
        angle: 0,
        opacity: 0.88,
        stops: [
          { position: 0, color: '#012247', opacity: 0.95 },
          { position: 50, color: '#004AA5', opacity: 0.7 },
          { position: 100, color: '#071629', opacity: 0.25 },
        ],
      },
      layers: customLayers,
    }),
  });
  await fetch(`${BASE_URL}/api/theme/publish/admin_login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ changeSummary: 'تطبيق الهوية الرسمية المتناسقة مع نظام الطبقات الجديد' }),
  });

  // TEST 10 — Role-Based Access Control (RBAC) Test
  console.log('\n--- TEST 10: Role-Based Access Control (RBAC) ---');
  // Attempt 1: Unauthenticated request to draft endpoint
  const noAuthRes = await fetch(`${BASE_URL}/api/theme/draft/admin_login`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titleColor: '#000000' }),
  });
  assert(noAuthRes.status === 401, 'Unauthenticated request correctly rejected with 401');

  // Attempt 2: Unauthenticated request to publish endpoint
  const noAuthPubRes = await fetch(`${BASE_URL}/api/theme/publish/admin_login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ changeSummary: 'unauthorized' }),
  });
  assert(noAuthPubRes.status === 401, 'Unauthenticated publish correctly rejected with 401');

  console.log('\n================================================================');
  console.log(`🏁 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
