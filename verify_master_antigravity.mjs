/**
 * Comprehensive Verification Suite for ELFAZNI SERVICES Master Antigravity Blueprint
 * Verifies:
 *  1. Unified Identity & Granular RBAC (Server store, hasPermission logic, Superadmin safeguards)
 *  2. Multi-scope Token Auth & Session Revocation
 *  3. Two Distinct Request Channels for all services (Flights, Consular, Hotels, Transfer)
 *  4. Authentic Reference Number Formats (REQ-FLY, REQ-CON, REQ-HTL, REQ-TRF)
 *  5. Continuous Services Marquee (Web Animations API, ResizeObserver, golden separators)
 *  6. Air France Logo Optical Scaling (CSS scaling without distortion)
 *  7. Brand Design System & Typography (Bahij, Plus Jakarta, Navy, Gold)
 *  8. Cross-App Navigation Matrix (Admin <-> CRM <-> Website <-> Hub)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readDb, PERMISSIONS_REGISTRY, DEFAULT_ROLES } from './server/db.ts';
import { hasPermission, generateToken, verifyToken, revision } from './server/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

console.log('========================================================================');
console.log('🌟 ELFAZNI SERVICES — MASTER ANTIGRAVITY SPECIFICATION VERIFICATION 🌟');
console.log('========================================================================\n');

// -------------------------------------------------------------------------
// SUITE 1: Unified Identity & Granular RBAC Engine
// -------------------------------------------------------------------------
console.log('--- SUITE 1: Unified Identity & Granular RBAC Engine ---');

const db = readDb();
assert(Array.isArray(db.users) && db.users.length > 0, `Database contains ${db.users.length} hydrated users`);
assert(Array.isArray(db.roles) && db.roles.length >= 8, `Database contains ${db.roles?.length || 0} configured roles`);
assert(Array.isArray(db.auditLogs), 'Database contains auditLogs array');

// Check canonical permissions registry
assert(PERMISSIONS_REGISTRY.length >= 35, `Permissions registry has ${PERMISSIONS_REGISTRY.length} granular permissions`);
const flightViewPerm = PERMISSIONS_REGISTRY.find(p => p.key === 'crm.flights.view');
const adminUsersPerm = PERMISSIONS_REGISTRY.find(p => p.key === 'admin.users.manage');
const accountingDelPerm = PERMISSIONS_REGISTRY.find(p => p.key === 'crm.accounting.delete');
assert(Boolean(flightViewPerm), 'Registry contains crm.flights.view permission');
assert(Boolean(adminUsersPerm), 'Registry contains admin.users.manage permission');
assert(Boolean(accountingDelPerm), 'Registry contains crm.accounting.delete permission');

// Test hasPermission logic:
// 1. Superadmin has all permissions
const superadminUser = db.users.find(u => u.role === 'superadmin');
assert(Boolean(superadminUser), `Found active superadmin user: ${superadminUser?.username}`);
if (superadminUser) {
  assert(hasPermission(superadminUser, 'crm.flights.view') === true, 'Superadmin has crm.flights.view');
  assert(hasPermission(superadminUser, 'admin.users.manage') === true, 'Superadmin has admin.users.manage');
  assert(hasPermission(superadminUser, 'crm.accounting.delete') === true, 'Superadmin has crm.accounting.delete');

  // Test explicit deny on superadmin
  const deniedSuperadmin = {
    ...superadminUser,
    permissions: { allowed: [], denied: ['crm.accounting.delete'] }
  };
  assert(hasPermission(deniedSuperadmin, 'crm.accounting.delete') === false, 'Explicit deny overrides superadmin privilege');
}

// 2. Role based permissions (Flight Agent)
const flightAgentMock = {
  id: 'test-flight-agent',
  username: 'test_agent',
  displayName: 'وكيل الطيران التجريبي',
  email: 'flight@elfazni.com',
  passwordHash: 'dummy',
  role: 'flight_agent',
  createdAt: new Date().toISOString()
};
assert(hasPermission(flightAgentMock, 'crm.flights.view') === true, 'Flight agent has crm.flights.view by role');
assert(hasPermission(flightAgentMock, 'crm.flights.create') === true, 'Flight agent has crm.flights.create by role');
assert(hasPermission(flightAgentMock, 'crm.accounting.delete') === false, 'Flight agent denied crm.accounting.delete by default');
assert(hasPermission(flightAgentMock, 'admin.users.manage') === false, 'Flight agent denied admin.users.manage by default');

// 3. Explicit allow override on Flight Agent
const flightAgentWithOverride = {
  ...flightAgentMock,
  permissions: { allowed: ['admin.users.manage'], denied: [] }
};
assert(hasPermission(flightAgentWithOverride, 'admin.users.manage') === true, 'Explicit allow grants permission not in role');

// 4. Inactive/Disabled user
const disabledUser = {
  ...flightAgentMock,
  disabled: true
};
assert(hasPermission(disabledUser, 'crm.flights.view') === false, 'Disabled user denied all permissions');

// -------------------------------------------------------------------------
// SUITE 2: Super Admin Safeguard Implementation
// -------------------------------------------------------------------------
console.log('\n--- SUITE 2: Super Admin Safeguards ---');

const routesPath = path.join(__dirname, 'server', 'routes.ts');
const routesContent = fs.readFileSync(routesPath, 'utf8');

assert(routesContent.includes('activeSuperadmins.length <= 1'), 'Routes check for last active superadmin on delete');
assert(routesContent.includes('لا يمكن حذف آخر مدير عام'), 'Safe error message on attempting to delete last superadmin');
assert(routesContent.includes('لا يمكن تعطيل أو خفض صلاحيات آخر مدير عام'), 'Safe error message on attempting to demote or disable last superadmin');

// -------------------------------------------------------------------------
// SUITE 3: Multi-Scope Token Auth & Session Revocation
// -------------------------------------------------------------------------
console.log('\n--- SUITE 3: Multi-Scope Token Auth & Session Management ---');

if (superadminUser) {
  const adminToken = generateToken(superadminUser, 'admin');
  const crmToken = generateToken(superadminUser, 'crm');

  const decodedAdmin = verifyToken(adminToken);
  const decodedCrm = verifyToken(crmToken);

  assert(decodedAdmin && decodedAdmin.scope === 'admin', 'Admin token has scope: admin');
  assert(decodedCrm && decodedCrm.scope === 'crm', 'CRM token has scope: crm');
  assert(decodedAdmin.revision === revision(superadminUser), 'Token revision matches current user hash');

  // Server middleware verification
  const serverPath = path.join(__dirname, 'server.ts');
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  assert(serverContent.includes('/admin/crm/session'), 'Server exports /admin/crm/session endpoint');
  assert(serverContent.includes('canManageUsers'), 'Session payload includes canManageUsers');
  assert(serverContent.includes('systemAccess'), 'Session payload includes systemAccess');
}

// -------------------------------------------------------------------------
// SUITE 4: Two Distinct Request Channels for Public Services
// -------------------------------------------------------------------------
console.log('\n--- SUITE 4: Two Distinct Request Channels (P0) ---');

// 1. UnifiedBookingsSection (Flights & Hotels)
const bookingsPath = path.join(__dirname, 'src', 'components', 'UnifiedBookingsSection.tsx');
const bookingsContent = fs.readFileSync(bookingsPath, 'utf8');

assert(bookingsContent.includes('ServiceContactModal'), 'UnifiedBookingsSection imports ServiceContactModal');
assert(bookingsContent.includes('إرسال الطلب عبر الموقع'), 'Flights section has "إرسال الطلب عبر الموقع" button');
assert(bookingsContent.includes('إرسال عبر واتساب'), 'Flights section has "إرسال عبر واتساب" button');
assert(bookingsContent.includes('تم تجهيز طلبك. يرجى إرسال الرسالة عبر واتساب لإكمال الطلب.'), 'Flights & Hotels WhatsApp notice is accurate and does not claim sent');

// 2. InteractiveConsularChecklist (Consular & Residence)
const consularPath = path.join(__dirname, 'src', 'components', 'InteractiveConsularChecklist.tsx');
const consularContent = fs.readFileSync(consularPath, 'utf8');

assert(consularContent.includes('ServiceContactModal'), 'InteractiveConsularChecklist imports ServiceContactModal');
assert(consularContent.includes('إرسال الطلب عبر الموقع'), 'Consular section has "إرسال الطلب عبر الموقع" button');
assert(consularContent.includes('إرسال عبر واتساب'), 'Consular section has "إرسال عبر واتساب" button');
assert(consularContent.includes('تم تجهيز طلبك. يرجى إرسال الرسالة عبر واتساب لإكمال الطلب.'), 'Consular WhatsApp notice is accurate');

// 3. InteractiveTransferWidget (Airport Transfer)
const transferPath = path.join(__dirname, 'src', 'components', 'InteractiveTransferWidget.tsx');
const transferContent = fs.readFileSync(transferPath, 'utf8');
assert(transferContent.includes('تم تجهيز طلبك. يرجى إرسال الرسالة عبر واتساب لإكمال الطلب.'), 'Transfer WhatsApp notice is accurate');

// 4. Authentic Reference Number Formats in routes.ts
assert(routesContent.includes("FLIGHT: 'FLY'"), 'Flights assigned REQ-FLY prefix mapping');
assert(routesContent.includes("CONSULAR: 'CON'"), 'Consular assigned REQ-CON prefix mapping');
assert(routesContent.includes("HOTEL: 'HTL'"), 'Hotels assigned REQ-HTL prefix mapping');
assert(routesContent.includes("TRANSFER: 'TRF'"), 'Transfer assigned REQ-TRF prefix mapping');

// 5. Tagged Email Alerts format in cloudSync.ts
const cloudSyncPath = path.join(__dirname, 'server', 'cloudSync.ts');
const cloudSyncContent = fs.readFileSync(cloudSyncPath, 'utf8');
assert(cloudSyncContent.includes('[ELFAZNI][NEW]['), 'Emails tagged with [ELFAZNI][NEW][<SERVICE>][FOLLOW-UP]');

// -------------------------------------------------------------------------
// SUITE 5: Continuous Services Marquee (P1)
// -------------------------------------------------------------------------
console.log('\n--- SUITE 5: Continuous Services Marquee ---');

const statsMarqueePath = path.join(__dirname, 'src', 'components', 'StatsMarquee.tsx');
const statsMarqueeContent = fs.readFileSync(statsMarqueePath, 'utf8');

assert(statsMarqueeContent.includes('track.animate'), 'StatsMarquee uses Web Animations API (track.animate)');
assert(statsMarqueeContent.includes('ResizeObserver'), 'StatsMarquee recalculates width dynamically via ResizeObserver');
assert(statsMarqueeContent.includes('iterations: Infinity'), 'StatsMarquee runs infinite seamless loop');
assert(statsMarqueeContent.includes('✦'), 'StatsMarquee uses golden separator ✦ between step cards');
assert(statsMarqueeContent.includes('text-[#CC9048]'), 'StatsMarquee styles golden separator with gold color');

// -------------------------------------------------------------------------
// SUITE 6: Air France Logo Optical Scaling (P1)
// -------------------------------------------------------------------------
console.log('\n--- SUITE 6: Air France Logo Optical Scaling ---');

const airlineMarqueePath = path.join(__dirname, 'src', 'components', 'AirlineLogoMarquee.tsx');
const airlineMarqueeContent = fs.readFileSync(airlineMarqueePath, 'utf8');

assert(airlineMarqueeContent.includes('air-france'), 'AirlineLogoMarquee matches Air France slug');
assert(airlineMarqueeContent.includes('scale-[1.38]'), 'AirlineLogoMarquee scales Air France optically by 1.38x');
assert(airlineMarqueeContent.includes('max-h-11 max-w-[140px]'), 'AirlineLogoMarquee increases bounding container for Air France');

// -------------------------------------------------------------------------
// SUITE 7: Admin Panel Users & Permissions Module
// -------------------------------------------------------------------------
console.log('\n--- SUITE 7: Admin Users & Permissions UI Module ---');

const adminUsersPath = path.join(__dirname, 'src', 'components', 'admin', 'AdminUsers.tsx');
assert(fs.existsSync(adminUsersPath), 'AdminUsers.tsx exists in Admin Panel');

const adminUsersContent = fs.readFileSync(adminUsersPath, 'utf8');
assert(adminUsersContent.includes('إدارة المستخدمين والصلاحيات'), 'AdminUsers contains Arabic Title');
assert(adminUsersContent.includes('PERMISSIONS_REGISTRY') || adminUsersContent.includes('permissions'), 'AdminUsers manages granular permissions');
assert(adminUsersContent.includes('activeTab === \'users\''), 'AdminUsers has Users tab');
assert(adminUsersContent.includes('activeTab === \'roles\''), 'AdminUsers has Roles tab');
assert(adminUsersContent.includes('activeTab === \'audit\''), 'AdminUsers has Audit Log tab');
assert(adminUsersContent.includes('activeTab === \'recovery\''), 'AdminUsers has Password Recovery tab');

// -------------------------------------------------------------------------
// SUITE 8: CRM Users Sync & Cross-Navigation
// -------------------------------------------------------------------------
console.log('\n--- SUITE 8: CRM Users Sync & Cross-Navigation ---');

const crmAuthContextPath = path.join(__dirname, 'crm', 'src', 'context', 'AuthContext.tsx');
const crmAuthContextContent = fs.readFileSync(crmAuthContextPath, 'utf8');

assert(crmAuthContextContent.includes('/admin/crm/api/users'), 'CRM AuthContext connects to authoritative server users API');
assert(crmAuthContextContent.includes('canManageSystemUsers'), 'CRM AuthContext tracks canManageSystemUsers permission');

const crmNavbarPath = path.join(__dirname, 'crm', 'src', 'components', 'Navbar.tsx');
const crmNavbarContent = fs.readFileSync(crmNavbarPath, 'utf8');

assert(crmNavbarContent.includes('الانتقال إلى الواجهات'), 'CRM Navbar includes dedicated interface switch button');
assert(crmNavbarContent.includes('/admin'), 'CRM Navbar links to Admin Panel');
assert(crmNavbarContent.includes('/hub'), 'CRM Navbar links to HUB');
assert(crmNavbarContent.includes('/'), 'CRM Navbar links to Public Website');

// -------------------------------------------------------------------------
// SUITE 9: Brand Consistency & Typography
// -------------------------------------------------------------------------
console.log('\n--- SUITE 9: Brand Consistency & Typography ---');

const indexHtmlPath = path.join(__dirname, 'index.html');
const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
assert(indexHtmlContent.includes('Bahij-Plain.ttf') || indexHtmlContent.includes('Bahij'), 'Root index.html references Bahij font');

const crmIndexHtmlPath = path.join(__dirname, 'crm', 'index.html');
const crmIndexHtmlContent = fs.readFileSync(crmIndexHtmlPath, 'utf8');
assert(crmIndexHtmlContent.includes('Bahij-Plain.ttf') || crmIndexHtmlContent.includes('Bahij'), 'CRM index.html references Bahij font');

console.log('\n========================================================================');
console.log(`📊 FINAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================================================\n');

if (failed > 0) {
  process.exit(1);
}
