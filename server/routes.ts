import { homepageSections, type HomepageSection } from '../src/data/siteVisibility';
import { randomBytes, randomUUID } from 'node:crypto';
import { isEmailAddress, sendEmail } from './mail';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  readDb,
  writeDb,
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogRevision,
  BlogTemplate,
  BlogSettings,
  BlogLanguage,
  BlogStatus,
  MediaAsset,
  ContactMessage,
  ServiceTag,
  FollowUpStatus,
  RequestSource,
  ChatMessage,
  VisitorLogEntry,
  TodoItem,
  PageSeoItem,
  computeTrafficPeriods,
  getDefaultSeoPages,
  getDefaultBlogSettings,
  getDefaultBlogTemplates,
  RoleDefinition,
  AuditLogItem,
  PERMISSIONS_REGISTRY,
  CanonicalRole,
  UserDepartment,
  SystemAccessScope,
  User,
} from './db';
import { generateToken, requireAuth, getAuthenticatedUser, getBearerUser, hasAccess, hasPermission, publicUser, AuthRequest, getCookieOptions } from './auth';
import { loginRateLimitMiddleware, recordLoginFailure, resetLoginRateLimit, publicSubmissionRateLimiter } from './rateLimiter';
import { registerSSEClient, broadcastRealtime } from './realtime';
import {
  dispatchAdminEmailAlert,
  getSystemHealthReport,
  recordSystemLog,
  scheduleCloudStatePush,
} from './cloudSync';

import { Request } from 'express';
import { productivityRouter } from './productivityRoutes';
import { themeRouter } from './themeRoutes';
import { documentExportRouter } from './documentExportRoutes';
import { syncInquiryToCrmLead } from './crmLeadSync';

export const apiRouter = Router();

// Prevent iOS Safari / WebKit / Reverse Proxy caching on all API endpoints
apiRouter.use((req, res, next) => {
  if (req.path !== '/realtime/stream') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  next();
});

export function detectClientFromRequest(req: Request, body: any = {}) {
  const ua = String(req.headers['user-agent'] || '');
  const screenW = Number(body.screenW) || 0;
  const maxTouchPoints = Number(body.maxTouchPoints) || 0;
  const clientDevice = String(body.device || '');
  const clientBrowser = String(body.browser || '');

  let device = 'الكمبيوتر المكتبي';
  let category: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  const isIPhone =
    /iPhone|iPod/i.test(ua) ||
    clientDevice.toLowerCase().includes('iphone') ||
    clientDevice.includes('آيفون') ||
    (/Macintosh/i.test(ua) && maxTouchPoints > 0 && screenW > 0 && screenW <= 500);

  const isIPad =
    !isIPhone &&
    (/iPad/i.test(ua) ||
      clientDevice.toLowerCase().includes('ipad') ||
      clientDevice.includes('آيباد') ||
      (/Macintosh/i.test(ua) && maxTouchPoints > 0 && (screenW === 0 || screenW > 500)));

  const isAndroidPhone =
    /Android/i.test(ua) && (/Mobile/i.test(ua) || (screenW > 0 && screenW < 768));

  const isAndroidTablet = /Android/i.test(ua) && !isAndroidPhone;

  if (isIPhone) {
    device = 'هاتف آيفون (iPhone)';
    category = 'mobile';
  } else if (isIPad) {
    device = 'جهاز آيباد (iPad)';
    category = 'tablet';
  } else if (isAndroidPhone) {
    device = 'هاتف أندرويد (Android)';
    category = 'mobile';
  } else if (isAndroidTablet) {
    device = 'جهاز لوحي (Android)';
    category = 'tablet';
  } else if (
    /Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
    clientDevice.includes('هاتف') ||
    clientDevice.toLowerCase().includes('mobile') ||
    (maxTouchPoints > 0 && screenW > 0 && screenW < 768)
  ) {
    device = clientDevice || 'الهاتف الذكي';
    category = 'mobile';
  } else if (
    /Tablet|Kindle|Silk/i.test(ua) ||
    clientDevice.includes('لوحي') ||
    clientDevice.toLowerCase().includes('tablet') ||
    (maxTouchPoints > 0 && screenW >= 768 && screenW <= 1024)
  ) {
    device = clientDevice || 'الأجهزة اللوحية';
    category = 'tablet';
  } else {
    device = clientDevice || 'الكمبيوتر المكتبي';
    category = 'desktop';
  }

  let browser = clientBrowser || 'متصفح الويب';
  if (/CriOS/i.test(ua)) browser = 'Chrome (iPhone)';
  else if (/FxiOS/i.test(ua)) browser = 'Firefox (iPhone)';
  else if (/EdgiOS|Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/OPR\/|Opera|OPiOS/i.test(ua)) browser = 'Opera';
  else if (/Safari/i.test(ua) && !/Chrome|CriOS|Android/i.test(ua)) {
    browser = isIPhone ? 'Safari (iPhone)' : isIPad ? 'Safari (iPad)' : 'Apple Safari';
  } else if (/Chrome/i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/Firefox/i.test(ua)) {
    browser = 'Firefox';
  }

  const country = String(body.country || 'المغرب').replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '').trim() || 'المغرب';
  const flag =
    body.flag ||
    (country.includes('تركيا')
      ? '🇹🇷'
      : country.includes('فرنسا')
      ? '🇫🇷'
      : country.includes('إسبانيا')
      ? '🇪🇸'
      : country.includes('ألمانيا')
      ? '🇩🇪'
      : country.includes('بلجيكا')
      ? '🇧🇪'
      : country.includes('هولندا')
      ? '🇳🇱'
      : country.includes('السعودية')
      ? '🇸🇦'
      : country.includes('الإمارات')
      ? '🇦🇪'
      : '🇲🇦');
  const city = body.city || (country.includes('تركيا') ? 'إسطنبول' : 'الدار البيضاء');

  return { device, category, browser, country, flag, city };
}

export function recordGenuineVisit(
  db: ReturnType<typeof readDb>,
  req: Request,
  body: any = {},
  defaultAction = 'زيارة وتصفح',
  onlyIfNewVisitor = false
) {
  const page = String(body.page || '/');
  // Do not count admin dashboard views as public visitor traffic
  if (page.startsWith('/admin')) {
    return null;
  }

  if (!db.analytics) {
    db.analytics = {
      totalVisits: 0,
      uniqueVisitors: 0,
      activeVisitors: 0,
      topCountries: [],
      recentVisits: [],
      trafficHistory: [],
      deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
      todoList: [],
      activeSessions: {},
      uniqueVisitorIds: [],
      visitTimestamps: [],
    };
  }

  const vid =
    body.visitorId ||
    `vis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  if (!db.analytics.uniqueVisitorIds) db.analytics.uniqueVisitorIds = [];
  const isNewUnique = !db.analytics.uniqueVisitorIds.includes(vid);

  if (onlyIfNewVisitor && !isNewUnique) {
    return null;
  }

  const clientInfo = detectClientFromRequest(req, body);

  // 1. Total Visits
  db.analytics.totalVisits += 1;

  // 2. Unique Visitors Tracking
  if (isNewUnique) {
    db.analytics.uniqueVisitorIds.push(vid);
  }
  db.analytics.uniqueVisitors = db.analytics.uniqueVisitorIds.length;

  // 3. Active / Live Visitors Tracking
  if (!db.analytics.activeSessions) db.analytics.activeSessions = {};
  db.analytics.activeSessions[vid] = Date.now();
  const now = Date.now();
  for (const [id, ts] of Object.entries(db.analytics.activeSessions)) {
    if (now - Number(ts) > 180000) {
      delete db.analytics.activeSessions[id];
    }
  }
  db.analytics.activeVisitors = Object.keys(db.analytics.activeSessions).length;

  // 4. Device Breakdown
  if (!db.analytics.deviceBreakdown) {
    db.analytics.deviceBreakdown = { desktop: 0, mobile: 0, tablet: 0 };
  }
  if (clientInfo.category === 'mobile') {
    db.analytics.deviceBreakdown.mobile += 1;
  } else if (clientInfo.category === 'tablet') {
    db.analytics.deviceBreakdown.tablet += 1;
  } else {
    db.analytics.deviceBreakdown.desktop += 1;
  }

  // 5. Top Countries & Geo Tracking
  const visitCountry = clientInfo.country;
  const visitFlag = clientInfo.flag;
  const visitCity = clientInfo.city;

  if (!db.analytics.topCountries) db.analytics.topCountries = [];
  const countryEntry = db.analytics.topCountries.find(
    (c) => c.name.toLowerCase() === visitCountry.toLowerCase()
  );
  if (countryEntry) {
    countryEntry.visits += 1;
    if (visitCity && !countryEntry.city.includes(visitCity)) {
      countryEntry.city = `${countryEntry.city}، ${visitCity}`;
    }
  } else {
    const code = visitCountry.includes('تركيا')
      ? 'TR'
      : visitCountry.includes('المغرب')
      ? 'MA'
      : visitCountry.includes('فرنسا')
      ? 'FR'
      : visitCountry.includes('إسبانيا')
      ? 'ES'
      : visitCountry.includes('ألمانيا')
      ? 'DE'
      : 'INTL';
    db.analytics.topCountries.push({
      code,
      name: visitCountry,
      flag: visitFlag,
      city: visitCity,
      visits: 1,
      percentage: 100,
    });
  }

  const totalCountryVisits = db.analytics.topCountries.reduce((sum, c) => sum + c.visits, 0);
  db.analytics.topCountries.forEach((c) => {
    c.percentage = totalCountryVisits > 0 ? Math.round((c.visits / totalCountryVisits) * 100) : 0;
  });
  db.analytics.topCountries.sort((a, b) => b.visits - a.visits);

  // 6. Recent Visits Log & Timestamp Tracking
  const nowIso = new Date().toISOString();
  if (!db.analytics.visitTimestamps) db.analytics.visitTimestamps = [];
  db.analytics.visitTimestamps.push(nowIso);

  const durationSec = Number(body.durationSec) || 0;
  const durationBadge = durationSec > 0 ? ` (${Math.round(durationSec)} ثانية)` : '';

  if (!db.analytics.recentVisits) db.analytics.recentVisits = [];
  const newVisit: VisitorLogEntry = {
    id: `v_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    country: visitCountry,
    flag: visitFlag,
    city: visitCity,
    device: clientInfo.device,
    browser: clientInfo.browser,
    page: page === '/' ? 'الصفحة الرئيسية' : page,
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    action: `${body.action || defaultAction}${durationBadge}`,
    durationSec: durationSec > 0 ? Math.round(durationSec) : undefined,
    timestamp: nowIso,
  };
  db.analytics.recentVisits.unshift(newVisit);
  if (db.analytics.recentVisits.length > 30) {
    db.analytics.recentVisits = db.analytics.recentVisits.slice(0, 30);
  }

  // 7. Compute Multi-Period Traffic History
  db.analytics.trafficPeriods = computeTrafficPeriods(db);
  db.analytics.trafficHistory = db.analytics.trafficPeriods.weekly;

  return { newVisit, vid, clientInfo };
}

// ==========================================
// 0. REAL-TIME SERVER-SENT EVENTS (SSE) STREAM
// ==========================================
apiRouter.get('/realtime/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  const cookie = req.headers.cookie?.match(/(?:^|; *)elfazni_stream=([^;]+)/)?.[1];
  const admin = req.query.admin === '1' && getAuthenticatedUser(cookie)?.role === 'superadmin';
  const visitorId = typeof req.query.visitorId === 'string' ? req.query.visitorId : undefined;
  const unregister = registerSSEClient(res, { admin, visitorId });
  res.on('close', unregister);
});

// Configure Multer for File Uploads
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e5)}`;
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 }, // 12MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('الملف غير مدعوم، يرجى رفع صور آمنة (JPG, PNG, WebP, GIF) أو ملف PDF فقط'));
    }
  },
});

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

apiRouter.post('/auth/logout', (req, res) => {
  res.clearCookie('elfazni_crm', getCookieOptions({ path: '/' }));
  res.clearCookie('elfazni_crm', getCookieOptions({ path: '/admin/crm' }));
  res.clearCookie('token', getCookieOptions({ path: '/' }));
  res.clearCookie('elfazni_stream', getCookieOptions({ path: '/api/realtime/stream' }));
  res.json({ success: true });
});

apiRouter.post('/auth/login', loginRateLimitMiddleware, (req, res) => {
  const { username, password, purpose } = req.body;
  if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
    res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور' });
    return;
  }

  const db = readDb();
  const user = db.users.find((u) => u.username.toLowerCase() === String(username).trim().toLowerCase());

  if (!user || user.disabled) {
    recordLoginFailure(req);
    res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    return;
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    recordLoginFailure(req);
    res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    return;
  }

  const allowedCrm =
    user.role === 'superadmin' ||
    user.systemAccess === 'both' ||
    user.systemAccess === 'crm' ||
    hasPermission(user, 'crm.dashboard.view');

  const allowedAdmin =
    user.role === 'superadmin' ||
    user.systemAccess === 'both' ||
    user.systemAccess === 'admin' ||
    hasPermission(user, 'admin.dashboard.view');

  if (purpose === 'crm' && !allowedCrm) {
    res.status(403).json({ error: 'هذا الحساب لا يملك صلاحية الدخول إلى نظام CRM.' });
    return;
  }

  if (purpose === 'admin' && !allowedAdmin) {
    res.status(403).json({ error: 'هذا الحساب لا يملك صلاحية الدخول إلى لوحة إدارة الموقع.' });
    return;
  }

  // Reset rate limiting counter upon successful authentication
  resetLoginRateLimit(req);

  user.lastLoginAt = new Date().toISOString();
  writeDb(db);

  const token = generateToken(user);
  if (allowedCrm) {
    res.cookie('elfazni_crm', generateToken(user, 'crm'), getCookieOptions({
      maxAge: 12 * 60 * 60 * 1000,
    }));
  }
  res.cookie('token', token, getCookieOptions({
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }));
  res.cookie('elfazni_stream', token, getCookieOptions({
    path: '/api/realtime/stream',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }));
  res.json({
    token,
    user: publicUser(user),
  });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

apiRouter.patch('/auth/profile', requireAuth, (req: AuthRequest, res) => {
  const { displayName, email, avatarUrl } = req.body;
  if (typeof displayName !== 'string' || !displayName.trim() || displayName.length > 100 ||
      typeof email !== 'string' || (email && !isEmailAddress(email)) ||
      (avatarUrl !== undefined && (typeof avatarUrl !== 'string' || avatarUrl.length > 600000 ||
       (avatarUrl !== '' && !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(avatarUrl))))) {
    return res.status(400).json({error:'راجع الاسم والبريد والصورة.'});
  }
  const db = readDb();
  const user = db.users.find(u => u.id === req.user!.id)!;
  user.displayName = displayName.trim();
  user.email = email;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  writeDb(db);
  res.json({user: publicUser(user)});
});

const staffProfiles = ['content', 'support', 'analytics'];
const validPassword = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 10 && Buffer.byteLength(value) <= 72;

apiRouter.get('/admin/users', requireAuth, (_req, res) => {
  const db = readDb();
  res.json({
    users: db.users.map(publicUser),
    roles: db.roles || [],
    requests: db.passwordRequests || [],
    auditLogs: (db.auditLogs || []).slice(-100).reverse(),
  });
});

apiRouter.post('/admin/users', requireAuth, (req: AuthRequest, res) => {
  const {
    username,
    displayName,
    password,
    role,
    department,
    systemAccess,
    permissions,
    email,
    phone,
    access,
    disabled,
    readOnly,
  } = req.body;

  if (
    typeof username !== 'string' ||
    !/^[a-zA-Z0-9._-]{3,40}$/.test(username.trim()) ||
    typeof displayName !== 'string' ||
    !displayName.trim() ||
    !validPassword(password)
  ) {
    return res.status(400).json({
      error: 'يرجى إدخال اسم مستخدم صالح واسم ظاهر وكلمة مرور قوية لا تقل عن 10 أحرف.',
    });
  }

  const db = readDb();
  const cleanUsername = username.trim().toLowerCase();
  if (db.users.some((user) => user.username.toLowerCase() === cleanUsername)) {
    return res.status(409).json({ error: 'اسم المستخدم مسجل مسبقاً في النظام.' });
  }

  const assignedRole = (typeof role === 'string' && role.trim()) ? role.trim() : 'editor';
  const assignedAccess = access && staffProfiles.includes(access) ? access : 'content';
  const assignedSystem = (['crm', 'admin', 'both'] as const).includes(systemAccess) ? systemAccess : 'both';

  const newUser: User = {
    id: randomUUID(),
    username: username.trim(),
    displayName: displayName.trim().slice(0, 100),
    role: assignedRole,
    department: department || 'general',
    systemAccess: assignedSystem,
    permissions: permissions && typeof permissions === 'object' ? permissions : { allowed: [], denied: [] },
    email: email && typeof email === 'string' ? email.trim() : '',
    phone: phone && typeof phone === 'string' ? phone.trim() : '',
    access: assignedAccess,
    disabled: Boolean(disabled),
    readOnly: Boolean(readOnly),
    passwordHash: bcrypt.hashSync(password, 10),
    sessionVersion: 1,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  // Add audit log
  const auditItem: AuditLogItem = {
    id: randomUUID(),
    actorId: req.user?.id || 'system',
    actorUsername: req.user?.username || 'system',
    action: 'USER_CREATED',
    targetType: 'user',
    targetId: newUser.id,
    details: `تم إنشاء المستخدم ${newUser.displayName} (${newUser.username}) بدور ${newUser.role}`,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.push(auditItem);

  writeDb(db);
  return res.status(201).json({ success: true, user: publicUser(newUser) });
});

apiRouter.patch('/admin/users/:id', requireAuth, (req: AuthRequest, res) => {
  const db = readDb();
  const user = db.users.find((item) => item.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود في النظام.' });

  const {
    displayName,
    email,
    phone,
    role,
    department,
    systemAccess,
    permissions,
    disabled,
    password,
    grants,
    access,
    readOnly,
    revokeSessions,
  } = req.body;

  // Superadmin Safeguard: protect last active superadmin from demotion/disabling
  const activeSuperadmins = db.users.filter((u) => u.role === 'superadmin' && !u.disabled);
  const isTargetActiveSuperadmin = user.role === 'superadmin' && !user.disabled;
  if (isTargetActiveSuperadmin && activeSuperadmins.length <= 1) {
    if ((role !== undefined && role !== 'superadmin') || disabled === true) {
      return res.status(400).json({
        error: 'إجراء محظور: لا يمكن تعطيل أو خفض صلاحيات آخر مدير عام (Super Admin) نشط في النظام.',
      });
    }
  }

  if (password !== undefined && !validPassword(password)) {
    return res.status(400).json({ error: 'كلمة المرور يجب أن لا تقل عن 10 أحرف.' });
  }

  if (displayName !== undefined && typeof displayName === 'string') {
    user.displayName = displayName.trim().slice(0, 100);
  }
  if (email !== undefined && typeof email === 'string') {
    user.email = email.trim();
  }
  if (phone !== undefined && typeof phone === 'string') {
    user.phone = phone.trim();
  }
  if (role !== undefined && typeof role === 'string' && role.trim()) {
    user.role = role.trim();
  }
  if (department !== undefined) {
    user.department = department;
  }
  if (systemAccess !== undefined && ['crm', 'admin', 'both'].includes(systemAccess)) {
    user.systemAccess = systemAccess;
  }
  if (permissions !== undefined && typeof permissions === 'object') {
    user.permissions = permissions;
  }
  if (access !== undefined && staffProfiles.includes(access)) {
    user.access = access;
  }
  if (grants !== undefined && Array.isArray(grants)) {
    user.grants = [...new Set(grants)] as typeof user.grants;
  }
  if (readOnly !== undefined && typeof readOnly === 'boolean') {
    user.readOnly = readOnly;
  }
  if (disabled !== undefined && typeof disabled === 'boolean') {
    user.disabled = disabled;
    if (disabled) user.sessionVersion = (user.sessionVersion || 0) + 1;
  }
  if (revokeSessions === true) {
    user.sessionVersion = (user.sessionVersion || 0) + 1;
  }
  if (password !== undefined) {
    user.passwordHash = bcrypt.hashSync(password, 10);
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    db.passwordRequests = db.passwordRequests?.filter((item) => item.userId !== user.id);
  }

  user.updatedAt = new Date().toISOString();

  // Audit log
  const auditItem: AuditLogItem = {
    id: randomUUID(),
    actorId: req.user?.id || 'system',
    actorUsername: req.user?.username || 'system',
    action: 'USER_UPDATED',
    targetType: 'user',
    targetId: user.id,
    details: `تم تحديث بيانات المستخدم ${user.displayName} (${user.username})`,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.push(auditItem);

  writeDb(db);
  return res.json({ success: true, user: publicUser(user) });
});

apiRouter.delete('/admin/users/:id', requireAuth, (req: AuthRequest, res) => {
  const db = readDb();
  const index = db.users.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'المستخدم غير موجود.' });

  const targetUser = db.users[index];

  // Superadmin Safeguard: protect last active superadmin from deletion
  const activeSuperadmins = db.users.filter((u) => u.role === 'superadmin' && !u.disabled);
  if (targetUser.role === 'superadmin' && activeSuperadmins.length <= 1) {
    return res.status(400).json({
      error: 'إجراء محظور: لا يمكن حذف آخر مدير عام (Super Admin) نشط في النظام.',
    });
  }

  db.users.splice(index, 1);
  if (db.passwordRequests) {
    db.passwordRequests = db.passwordRequests.filter((r) => r.userId !== targetUser.id);
  }

  // Audit log
  const auditItem: AuditLogItem = {
    id: randomUUID(),
    actorId: req.user?.id || 'system',
    actorUsername: req.user?.username || 'system',
    action: 'USER_DELETED',
    targetType: 'user',
    targetId: targetUser.id,
    details: `تم حذف المستخدم ${targetUser.displayName} (${targetUser.username})`,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.push(auditItem);

  writeDb(db);
  return res.json({ success: true });
});

apiRouter.get('/admin/roles', requireAuth, (_req, res) => {
  const db = readDb();
  res.json({
    roles: db.roles || [],
    permissionsRegistry: PERMISSIONS_REGISTRY,
  });
});

apiRouter.post('/admin/roles', requireAuth, (req: AuthRequest, res) => {
  const { id, name, nameAr, nameFr, description, systemAccess, permissions } = req.body;
  if (!id || !name || !nameAr) {
    return res.status(400).json({ error: 'يرجى إدخال معرف الدور واسمه بالعربية والإنجليزية.' });
  }

  const db = readDb();
  db.roles = db.roles || [];
  const cleanId = String(id).trim().toLowerCase().replace(/\s+/g, '_');
  if (db.roles.some((r) => r.id === cleanId)) {
    return res.status(409).json({ error: 'معرف الدور موجود مسبقاً.' });
  }

  const now = new Date().toISOString();
  const newRole: RoleDefinition = {
    id: cleanId,
    name: String(name).trim(),
    nameAr: String(nameAr).trim(),
    nameFr: nameFr ? String(nameFr).trim() : undefined,
    description: String(description || '').trim(),
    systemAccess: ['crm', 'admin', 'both'].includes(systemAccess) ? systemAccess : 'both',
    permissions: Array.isArray(permissions) ? permissions : [],
    isSystemRole: false,
    createdAt: now,
    updatedAt: now,
  };

  db.roles.push(newRole);

  const auditItem: AuditLogItem = {
    id: randomUUID(),
    actorId: req.user?.id || 'system',
    actorUsername: req.user?.username || 'system',
    action: 'ROLE_CREATED',
    targetType: 'role',
    targetId: newRole.id,
    details: `تم إنشاء الدور ${newRole.nameAr} (${newRole.id})`,
    timestamp: now,
  };
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.push(auditItem);

  writeDb(db);
  return res.status(201).json({ success: true, role: newRole });
});

apiRouter.patch('/admin/roles/:id', requireAuth, (req: AuthRequest, res) => {
  const db = readDb();
  db.roles = db.roles || [];
  const role = db.roles.find((r) => r.id === req.params.id);
  if (!role) return res.status(404).json({ error: 'الدور غير موجود.' });

  const { name, nameAr, nameFr, description, systemAccess, permissions } = req.body;
  if (name !== undefined) role.name = String(name).trim();
  if (nameAr !== undefined) role.nameAr = String(nameAr).trim();
  if (nameFr !== undefined) role.nameFr = String(nameFr).trim();
  if (description !== undefined) role.description = String(description).trim();
  if (systemAccess !== undefined && ['crm', 'admin', 'both'].includes(systemAccess)) {
    role.systemAccess = systemAccess;
  }
  if (permissions !== undefined && Array.isArray(permissions)) {
    role.permissions = [...new Set(permissions)];
  }
  role.updatedAt = new Date().toISOString();

  const auditItem: AuditLogItem = {
    id: randomUUID(),
    actorId: req.user?.id || 'system',
    actorUsername: req.user?.username || 'system',
    action: 'ROLE_UPDATED',
    targetType: 'role',
    targetId: role.id,
    details: `تم تعديل بيانات الدور ${role.nameAr} (${role.id})`,
    timestamp: role.updatedAt,
  };
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.push(auditItem);

  writeDb(db);
  return res.json({ success: true, role });
});

apiRouter.delete('/admin/roles/:id', requireAuth, (req: AuthRequest, res) => {
  const db = readDb();
  db.roles = db.roles || [];
  const index = db.roles.findIndex((r) => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'الدور غير موجود.' });

  const role = db.roles[index];
  if (role.isSystemRole) {
    return res.status(400).json({ error: 'لا يمكن حذف الأدوار الأساسية للنظام.' });
  }

  const assignedUsers = db.users.filter((u) => u.role === role.id);
  if (assignedUsers.length > 0) {
    return res.status(400).json({
      error: `لا يمكن حذف هذا الدور لوجود ${assignedUsers.length} مستخدم معينين عليه. قم بتغيير أدوارهم أولاً.`,
    });
  }

  db.roles.splice(index, 1);

  const auditItem: AuditLogItem = {
    id: randomUUID(),
    actorId: req.user?.id || 'system',
    actorUsername: req.user?.username || 'system',
    action: 'ROLE_DELETED',
    targetType: 'role',
    targetId: role.id,
    details: `تم حذف الدور المخصص ${role.nameAr} (${role.id})`,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.push(auditItem);

  writeDb(db);
  return res.json({ success: true });
});

apiRouter.get('/admin/audit-logs', requireAuth, (_req, res) => {
  const db = readDb();
  res.json({ auditLogs: (db.auditLogs || []).slice(-200).reverse() });
});

apiRouter.post('/auth/recovery', (req, res) => {
  const username = typeof req.body.username === 'string' ? req.body.username.trim().toLowerCase() : '';
  const db = readDb();
  const user = db.users.find((item) => !item.disabled && item.username.toLowerCase() === username);
  const requests = db.passwordRequests ||= [];
  if (user && !requests.some((item) => item.userId === user.id)) {
    requests.push({ userId: user.id, requestedAt: new Date().toISOString() });
    writeDb(db);
    const to = process.env.SMTP_ADMIN_TO || db.users.find((item) => item.role === 'superadmin')?.email;
    if (to) void sendEmail({
      to,
      subject: 'طلب استعادة كلمة مرور — ELFAZNI SERVICES',
      text: `وصل طلب استعادة للحساب ${user.username}. افتح قسم المستخدمين في لوحة الإدارة لمراجعته.`,
    });
  }
  return res.status(202).json({ success: true });
});

apiRouter.post('/auth/change-password', requireAuth, (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (typeof currentPassword !== 'string' || !currentPassword || !validPassword(newPassword)) {
    res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 10 أحرف على الأقل' });
    return;
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ error: 'المستخدم غير موجود' });
    return;
  }

  const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
  if (!isMatch) {
    res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  user.passwordHash = bcrypt.hashSync(newPassword, salt);
  db.passwordRequests = db.passwordRequests?.filter((request) => request.userId !== user.id);
  writeDb(db);

  res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
});

// ==========================================
// 2. BLOG POSTS, REVISIONS, SCHEDULER & SANITIZATION
// ==========================================

export function sanitizeBlogHtml(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  let clean = raw
    // Strip dangerous container tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    // Only allow approved YouTube / Vimeo iframes
    .replace(/<iframe\b([^>]*)>[\s\S]*?<\/iframe>/gi, (match, attrs) => {
      const srcMatch = String(attrs).match(/\bsrc\s*=\s*["']([^"']+)["']/i);
      const src = srcMatch ? srcMatch[1].trim() : '';
      if (/^https:\/\/(www\.youtube\.com\/embed\/|youtube\.com\/embed\/|player\.vimeo\.com\/video\/)[a-zA-Z0-9_-]+/i.test(src)) {
        return `<iframe src="${src}" class="w-full aspect-video rounded-2xl border border-slate-200 my-4" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
      }
      return '';
    })
    // Strip all inline event handlers (onclick, onerror, onload, onmouseover, etc.)
    .replace(/\s+on[a-z0-9_-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // Neutralize javascript:, vbscript:, data:text/html in href/src
    .replace(/\b(href|src|action)\s*=\s*["']\s*(?:javascript:|vbscript:|data:text\/html)[^"']*["']/gi, '$1="#"')
    // Strip temporary blob: URLs or huge embedded base64 images (>4KB)
    .replace(/\bsrc\s*=\s*["']\s*blob:[^"']*["']/gi, 'src=""')
    .replace(/\bsrc\s*=\s*["']\s*data:image\/[^"']{4096,}["']/gi, 'src=""')
    // Clean Word MSO artifacts
    .replace(/\s*mso-[a-z-]+:[^;"]+;?/gi, '')
    .replace(/<\/?o:p[^>]*>/gi, '');

  return clean.trim();
}

export function estimateReadingTime(content: string, lang: BlogLanguage = 'ar'): string {
  const plain = String(content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = plain ? plain.split(' ').length : 0;
  const mins = Math.max(1, Math.ceil(words / 180));
  if (lang === 'en') return `${mins} min read`;
  if (lang === 'fr') return `${mins} min de lecture`;
  return `${mins} دقائق`;
}

export function recordPostRevision(
  db: ReturnType<typeof readDb>,
  post: BlogPost,
  actorName: string,
  actorId?: string,
  summary = 'حفظ نسخة من المقال'
) {
  if (!db.postRevisions) db.postRevisions = [];
  const rev: BlogRevision = {
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    postId: post.id,
    revision: post.revision || 1,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    contentJson: post.contentJson,
    status: post.status,
    language: post.language || 'ar',
    author: actorName,
    authorId: actorId,
    summary,
    createdAt: new Date().toISOString(),
  };
  db.postRevisions.unshift(rev);
  // Keep up to 35 revisions per post
  const forPost = db.postRevisions.filter((r) => r.postId === post.id);
  if (forPost.length > 35) {
    const removeIds = new Set(forPost.slice(35).map((r) => r.id));
    db.postRevisions = db.postRevisions.filter((r) => !removeIds.has(r.id));
  }
  return rev;
}

export function syncPostTagsToDb(db: ReturnType<typeof readDb>, tags: string[]) {
  if (!db.tags) db.tags = [];
  for (const rawTag of tags) {
    const name = rawTag.trim();
    if (!name) continue;
    const exists = db.tags.some((t) => t.name.toLowerCase() === name.toLowerCase());
    if (!exists) {
      const slug =
        name
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') || `tag-${Date.now()}`;
      db.tags.push({
        id: `tag_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        slug,
        name,
      });
    }
  }
}

export function processScheduledPosts(): boolean {
  const db = readDb();
  const nowMs = Date.now();
  let changed = false;
  for (const post of db.posts) {
    if (post.status === 'scheduled' && post.scheduledAt) {
      const targetMs = new Date(post.scheduledAt).getTime();
      if (!isNaN(targetMs) && targetMs <= nowMs) {
        post.status = 'published';
        post.publishedAt = post.scheduledAt;
        post.updatedAt = new Date().toISOString();
        post.revision = (post.revision || 1) + 1;
        recordPostRevision(db, post, 'الجدولة التلقائية (Server Scheduler)', 'system', 'نشر مجدول تلقائي في الموعد المحدد');
        changed = true;
      }
    }
  }
  if (changed) {
    writeDb(db);
  }
  return changed;
}

// Run server-side scheduled publishing check every 10 seconds
const schedulerTimer = setInterval(() => {
  try {
    processScheduledPosts();
  } catch (err) {
    console.warn('Scheduled post check error:', err);
  }
}, 10000);
if (typeof (schedulerTimer as any).unref === 'function') {
  (schedulerTimer as any).unref();
}

const normalizeArabicSearch = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0653-\u0655\u0640]/g, '') // Remove tashkeel & tatweel
    .replace(/[\u0622\u0623\u0625\u0671\u0627]/g, '\u0627') // Normalize all Alef variants to standard Alef
    .replace(/\u0629/g, '\u0647') // Normalize Taa Marbuta to Haa
    .replace(/[\u0649\u064A]/g, '\u064A') // Normalize Alif Maqsura to Yaa
    .trim();

const VALID_STATUSES: BlogStatus[] = ['published', 'draft', 'in_review', 'scheduled', 'archived', 'trash'];
const VALID_LANGUAGES: BlogLanguage[] = ['ar', 'en', 'fr'];

// Public: Get published blog posts
apiRouter.get('/posts', (req, res) => {
  processScheduledPosts();
  const { category, tag, lang, search, limit, page } = req.query;
  const db = readDb();

  let posts = db.posts.filter((p) => p.status === 'published');

  if (category && category !== 'all') {
    posts = posts.filter((p) => p.category === category);
  }

  if (tag && typeof tag === 'string') {
    const targetTag = tag.toLowerCase().trim();
    posts = posts.filter((p) => Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase() === targetTag));
  }

  const langParam = (req.query.language || req.query.lang) as string | undefined;
  if (langParam && typeof langParam === 'string' && langParam !== 'all') {
    posts = posts.filter((p) => (p.language || 'ar') === langParam);
  }

  if (search && typeof search === 'string') {
    const raw = search.toLowerCase().trim();
    if (raw.length > 0) {
      const q = normalizeArabicSearch(raw);
      posts = posts.filter((p) => {
        const fields = [
          p.title,
          p.excerpt,
          typeof p.content === 'string' ? p.content : '',
          Array.isArray(p.tags) ? p.tags.join(' ') : '',
          p.category,
        ];
        return fields.some((field) =>
          (field ? normalizeArabicSearch(String(field)) : '').includes(q)
        );
      });
    }
  }

  posts.sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime());

  const total = posts.length;
  if (limit) {
    const lim = parseInt(String(limit), 10);
    const pg = page ? Math.max(1, parseInt(String(page), 10)) : 1;
    if (!isNaN(lim) && lim > 0) {
      const start = (pg - 1) * lim;
      posts = posts.slice(start, start + lim);
    }
  }

  res.json({ posts, total, blogSettings: db.blogSettings || getDefaultBlogSettings() });
});

// Public (or Authenticated Preview): Get single post by slug
apiRouter.get('/posts/:slug', (req, res) => {
  processScheduledPosts();
  const rawSlug = String(req.params.slug || '');
  let decodedSlug = rawSlug;
  try {
    decodedSlug = decodeURIComponent(rawSlug);
  } catch {
    // ignore
  }
  const isPreview = req.query.preview === '1' || req.query.preview === 'true';
  const bearerUser = getBearerUser(req);
  const canPreviewDraft = Boolean(bearerUser && (bearerUser.role === 'superadmin' || hasAccess(bearerUser, 'content')));

  const db = readDb();
  const post = db.posts.find(
    (p) =>
      (p.slug === rawSlug || p.slug === decodedSlug || p.id === rawSlug) &&
      (p.status === 'published' || (isPreview && canPreviewDraft))
  );

  if (!post) {
    res.status(404).json({ error: 'المقال غير موجود أو غير منشور للعامة' });
    return;
  }

  if (post.status === 'published' && !isPreview) {
    post.views = (post.views || 0) + 1;
    writeDb(db);
  }

  let related: BlogPost[] = [];
  if (Array.isArray(post.relatedPostIds) && post.relatedPostIds.length > 0) {
    related = db.posts.filter((p) => p.status === 'published' && p.id !== post.id && post.relatedPostIds!.includes(p.id));
  }
  if (related.length < 3) {
    const extra = db.posts
      .filter(
        (p) =>
          p.status === 'published' &&
          p.id !== post.id &&
          !related.some((r) => r.id === p.id) &&
          (p.category === post.category || (p.language || 'ar') === (post.language || 'ar'))
      )
      .slice(0, 3 - related.length);
    related = [...related, ...extra];
  }

  const translations = post.translationGroupId
    ? db.posts
        .filter(
          (p) =>
            p.id !== post.id &&
            p.translationGroupId === post.translationGroupId &&
            (p.status === 'published' || canPreviewDraft)
        )
        .map((p) => ({
          id: p.id,
          language: p.language || 'ar',
          slug: p.slug,
          title: p.title,
          status: p.status,
        }))
    : [];

  res.json({ post, related, translations, isPreview: Boolean(isPreview && canPreviewDraft) });
});

// Admin: Get all posts (including drafts, scheduled, archived, trash)
apiRouter.get('/admin/posts', requireAuth, (_req, res) => {
  processScheduledPosts();
  const db = readDb();
  const posts = [...db.posts].sort(
    (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  );
  res.json({ posts });
});

// Admin: Get single post by ID with revisions & translations
apiRouter.get('/admin/posts/:id', requireAuth, (req, res) => {
  processScheduledPosts();
  const db = readDb();
  const post = db.posts.find((p) => p.id === req.params.id || p.slug === req.params.id);
  if (!post) {
    return res.status(404).json({ error: 'المقال غير موجود' });
  }
  const revisions = (db.postRevisions || []).filter((r) => r.postId === post.id);
  const translations = post.translationGroupId
    ? db.posts
        .filter((p) => p.translationGroupId === post.translationGroupId)
        .map((p) => ({ id: p.id, language: p.language || 'ar', slug: p.slug, title: p.title, status: p.status }))
    : [];
  return res.json({ post, revisions, translations });
});

// Admin: Create new blog post
apiRouter.post('/admin/posts', requireAuth, (req: AuthRequest, res) => {
  const {
    title,
    slug,
    excerpt,
    content,
    contentJson,
    language,
    translationGroupId,
    category,
    tags,
    coverImage,
    coverAlt,
    coverMediaId,
    status,
    author,
    readTime,
    featured,
    pdfUrl,
    seoTitle,
    seoDescription,
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImage,
    scheduledAt,
    timezone,
    relatedPostIds,
  } = req.body;

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'حالة المقال غير صالحة.' });
  }
  const lang: BlogLanguage = VALID_LANGUAGES.includes(language) ? language : 'ar';

  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'يرجى كتابة عنوان المقال' });
  }
  if (!content && status === 'published') {
    return res.status(400).json({ error: 'يرجى كتابة محتوى المقال قبل النشر' });
  }

  const rawContent = String(content || '');
  if (/data:image\/[^;]+;base64,[A-Za-z0-9+/=]{5000,}/.test(rawContent)) {
    return res.status(400).json({ error: 'لا يُسمح بتضمين صور Base64 كبيرة داخل النص. يرجى رفع الصورة عبر مكتبة الوسائط.' });
  }

  const sanitizedContent = sanitizeBlogHtml(rawContent);
  const db = readDb();

  const finalSlug =
    (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `post-${Date.now()}`;

  let uniqueSlug = finalSlug;
  let counter = 1;
  while (db.posts.some((p) => p.slug === uniqueSlug)) {
    uniqueSlug = `${finalSlug}-${counter++}`;
  }

  const parsedTags = Array.isArray(tags)
    ? tags.map((t: string) => String(t).trim()).filter(Boolean)
    : typeof tags === 'string'
    ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
    : [];

  let finalStatus: BlogStatus = status || 'draft';
  if (finalStatus === 'scheduled' && (!scheduledAt || isNaN(new Date(scheduledAt).getTime()))) {
    return res.status(400).json({ error: 'يرجى تحديد تاريخ ووقت صالحين لجدولة نشر المقال.' });
  }
  if (finalStatus === 'scheduled' && new Date(scheduledAt).getTime() <= Date.now()) {
    finalStatus = 'published';
  }

  const now = new Date().toISOString();
  const postId = `post_${Date.now()}`;
  const newPost: BlogPost = {
    id: postId,
    title: String(title).trim(),
    slug: uniqueSlug,
    excerpt: String(excerpt || title).trim(),
    content: sanitizedContent,
    contentJson: contentJson || undefined,
    schemaVersion: 2,
    language: lang,
    translationGroupId: translationGroupId || `tg_${postId}`,
    category: category || 'general',
    tags: [...new Set(parsedTags)],
    coverImage: coverImage || '/assets/slides/10-all-services.webp',
    coverAlt: coverAlt ? String(coverAlt).trim() : String(title).trim(),
    coverMediaId: coverMediaId || undefined,
    status: finalStatus,
    author: (author && String(author).trim()) || req.user?.displayName || db.blogSettings?.defaultAuthorName || 'ELFAZNI SERVICES',
    authorId: req.user?.id,
    readTime: readTime || estimateReadingTime(sanitizedContent, lang),
    views: 0,
    featured: Boolean(featured),
    pdfUrl: pdfUrl || undefined,
    seoTitle: (seoTitle && String(seoTitle).trim()) || String(title).trim(),
    seoDescription: (seoDescription && String(seoDescription).trim()) || String(excerpt || title).trim(),
    canonicalUrl: canonicalUrl ? String(canonicalUrl).trim() : undefined,
    ogTitle: ogTitle ? String(ogTitle).trim() : undefined,
    ogDescription: ogDescription ? String(ogDescription).trim() : undefined,
    ogImage: ogImage ? String(ogImage).trim() : undefined,
    scheduledAt: scheduledAt || undefined,
    timezone: timezone || db.blogSettings?.defaultTimezone || 'Europe/Istanbul',
    relatedPostIds: Array.isArray(relatedPostIds) ? relatedPostIds : [],
    revision: 1,
    createdAt: now,
    updatedAt: now,
    publishedAt: finalStatus === 'published' ? now : undefined,
  };

  db.posts.unshift(newPost);
  syncPostTagsToDb(db, newPost.tags);
  recordPostRevision(
    db,
    newPost,
    req.user?.displayName || newPost.author,
    req.user?.id,
    finalStatus === 'published' ? 'إنشاء ونشر المقال' : 'إنشاء مسودة المقال'
  );
  writeDb(db);

  return res.status(201).json({ success: true, post: newPost });
});

// Admin: Update blog post
apiRouter.put('/admin/posts/:id', requireAuth, (req: AuthRequest, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.posts.findIndex((p) => p.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'المقال غير موجود' });
    return;
  }

  const current = db.posts[index];
  const {
    title,
    slug,
    excerpt,
    content,
    contentJson,
    language,
    translationGroupId,
    category,
    tags,
    coverImage,
    coverAlt,
    coverMediaId,
    status,
    author,
    readTime,
    featured,
    pdfUrl,
    seoTitle,
    seoDescription,
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImage,
    scheduledAt,
    timezone,
    relatedPostIds,
    expectedRevision,
    forceOverwrite,
    isAutosave,
    revisionSummary,
  } = req.body;

  // Optimistic concurrency conflict check
  if (
    expectedRevision !== undefined &&
    !forceOverwrite &&
    typeof current.revision === 'number' &&
    Number(expectedRevision) !== current.revision
  ) {
    return res.status(409).json({
      error: 'تعارض في النسخة: تم تعديل هذا المقال في جلسة أخرى. يرجى مراجعة النسخة الأحدث أو تأكيد الكتابة فوقها.',
      conflict: true,
      serverPost: current,
    });
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'حالة المقال غير صالحة.' });
  }

  if (content !== undefined && /data:image\/[^;]+;base64,[A-Za-z0-9+/=]{5000,}/.test(String(content))) {
    return res.status(400).json({ error: 'لا يُسمح بتضمين صور Base64 كبيرة داخل النص. يرجى رفع الصورة عبر مكتبة الوسائط.' });
  }

  const now = new Date().toISOString();
  let updatedSlug = current.slug;
  if (slug && slug !== current.slug) {
    const baseSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (baseSlug) {
      let checkSlug = baseSlug;
      let counter = 1;
      while (db.posts.some((p) => p.id !== id && p.slug === checkSlug)) {
        checkSlug = `${baseSlug}-${counter++}`;
      }
      updatedSlug = checkSlug;
    }
  }

  const updatedLang: BlogLanguage =
    language !== undefined && VALID_LANGUAGES.includes(language) ? language : current.language || 'ar';
  const sanitizedContent = content !== undefined ? sanitizeBlogHtml(String(content)) : current.content;

  let nextStatus: BlogStatus = status !== undefined ? status : current.status;
  const nextScheduledAt = scheduledAt !== undefined ? scheduledAt : current.scheduledAt;
  if (nextStatus === 'scheduled') {
    if (!nextScheduledAt || isNaN(new Date(nextScheduledAt).getTime())) {
      return res.status(400).json({ error: 'يرجى تحديد تاريخ ووقت صالحين لجدولة نشر المقال.' });
    }
    if (new Date(nextScheduledAt).getTime() <= Date.now()) {
      nextStatus = 'published';
    }
  }

  const parsedTags =
    tags !== undefined
      ? Array.isArray(tags)
        ? [...new Set(tags.map((t: string) => String(t).trim()).filter(Boolean))]
        : typeof tags === 'string'
        ? [...new Set(tags.split(',').map((t: string) => t.trim()).filter(Boolean))]
        : current.tags
      : current.tags;

  const nextRevision = (current.revision || 1) + 1;

  db.posts[index] = {
    ...current,
    title: title !== undefined ? String(title).trim() : current.title,
    slug: updatedSlug,
    excerpt: excerpt !== undefined ? String(excerpt).trim() : current.excerpt,
    content: sanitizedContent,
    contentJson: contentJson !== undefined ? contentJson : current.contentJson,
    schemaVersion: 2,
    language: updatedLang,
    translationGroupId: translationGroupId !== undefined ? translationGroupId : current.translationGroupId || `tg_${current.id}`,
    category: category !== undefined ? category : current.category,
    tags: parsedTags,
    coverImage: coverImage !== undefined ? coverImage : current.coverImage,
    coverAlt: coverAlt !== undefined ? String(coverAlt).trim() : current.coverAlt,
    coverMediaId: coverMediaId !== undefined ? coverMediaId : current.coverMediaId,
    status: nextStatus,
    author: author !== undefined && String(author).trim() ? String(author).trim() : current.author,
    readTime: readTime !== undefined ? readTime : estimateReadingTime(sanitizedContent, updatedLang),
    featured: featured !== undefined ? Boolean(featured) : current.featured,
    pdfUrl: pdfUrl !== undefined ? pdfUrl : current.pdfUrl,
    seoTitle: seoTitle !== undefined ? seoTitle : current.seoTitle,
    seoDescription: seoDescription !== undefined ? seoDescription : current.seoDescription,
    canonicalUrl: canonicalUrl !== undefined ? canonicalUrl : current.canonicalUrl,
    ogTitle: ogTitle !== undefined ? ogTitle : current.ogTitle,
    ogDescription: ogDescription !== undefined ? ogDescription : current.ogDescription,
    ogImage: ogImage !== undefined ? ogImage : current.ogImage,
    scheduledAt: nextScheduledAt,
    timezone: timezone !== undefined ? timezone : current.timezone || 'Europe/Istanbul',
    relatedPostIds: Array.isArray(relatedPostIds) ? relatedPostIds : current.relatedPostIds,
    revision: nextRevision,
    updatedAt: now,
    publishedAt: nextStatus === 'published' && !current.publishedAt ? now : current.publishedAt,
  };

  syncPostTagsToDb(db, parsedTags);

  if (!isAutosave) {
    const summaryText =
      revisionSummary ||
      (nextStatus === 'published' && current.status !== 'published'
        ? 'نشر المقال للعامة'
        : nextStatus === 'scheduled'
        ? `جدولة النشر بتاريخ ${nextScheduledAt}`
        : 'تحديث وحفظ المقال');
    recordPostRevision(db, db.posts[index], req.user?.displayName || db.posts[index].author, req.user?.id, summaryText);
  }

  writeDb(db);
  return res.json({ success: true, post: db.posts[index] });
});

// Admin: Duplicate post as draft
apiRouter.post('/admin/posts/:id/duplicate', requireAuth, (req: AuthRequest, res) => {
  const db = readDb();
  const source = db.posts.find((p) => p.id === req.params.id);
  if (!source) {
    return res.status(404).json({ error: 'المقال المراد نسخه غير موجود' });
  }
  const targetLang: BlogLanguage = VALID_LANGUAGES.includes(req.body?.language)
    ? req.body.language
    : source.language || 'ar';
  const isTranslation = Boolean(req.body?.asTranslation && targetLang !== (source.language || 'ar'));

  const baseSlug = `${source.slug}-${isTranslation ? targetLang : 'copy'}`;
  let uniqueSlug = baseSlug;
  let counter = 1;
  while (db.posts.some((p) => p.slug === uniqueSlug)) {
    uniqueSlug = `${baseSlug}-${counter++}`;
  }

  const now = new Date().toISOString();
  const newId = `post_${Date.now()}`;
  const suffix =
    isTranslation
      ? targetLang === 'en'
        ? ' (EN)'
        : targetLang === 'fr'
        ? ' (FR)'
        : ' (AR)'
      : targetLang === 'en'
      ? ' (Copy)'
      : targetLang === 'fr'
      ? ' (Copie)'
      : ' (نسخة)';

  const duplicated: BlogPost = {
    ...source,
    id: newId,
    title: `${source.title}${suffix}`,
    slug: uniqueSlug,
    language: targetLang,
    translationGroupId: isTranslation
      ? source.translationGroupId || `tg_${source.id}`
      : `tg_${newId}`,
    status: 'draft',
    views: 0,
    engagedReads: 0,
    sharesCount: 0,
    consultClicks: 0,
    featured: false,
    revision: 1,
    createdAt: now,
    updatedAt: now,
    publishedAt: undefined,
    scheduledAt: undefined,
  };

  db.posts.unshift(duplicated);
  recordPostRevision(
    db,
    duplicated,
    req.user?.displayName || duplicated.author,
    req.user?.id,
    isTranslation ? `إنشاء مسودة ترجمة (${targetLang.toUpperCase()})` : 'نسخ المقال كمسودة جديدة'
  );
  writeDb(db);
  return res.status(201).json({ success: true, post: duplicated });
});

// Admin: Get revisions for a post
apiRouter.get('/admin/posts/:id/revisions', requireAuth, (req, res) => {
  const db = readDb();
  const revisions = (db.postRevisions || []).filter((r) => r.postId === req.params.id);
  res.json({ revisions });
});

// Admin: Restore a specific revision
apiRouter.post('/admin/posts/:id/revisions/:revisionId/restore', requireAuth, (req: AuthRequest, res) => {
  const db = readDb();
  const postIndex = db.posts.findIndex((p) => p.id === req.params.id);
  if (postIndex === -1) {
    return res.status(404).json({ error: 'المقال غير موجود' });
  }
  const rev = (db.postRevisions || []).find((r) => r.id === req.params.revisionId && r.postId === req.params.id);
  if (!rev) {
    return res.status(404).json({ error: 'نسخة المراجعة غير موجودة' });
  }

  const current = db.posts[postIndex];
  const now = new Date().toISOString();
  db.posts[postIndex] = {
    ...current,
    title: rev.title,
    excerpt: rev.excerpt,
    content: rev.content,
    contentJson: rev.contentJson,
    revision: (current.revision || 1) + 1,
    updatedAt: now,
  };

  recordPostRevision(
    db,
    db.posts[postIndex],
    req.user?.displayName || current.author,
    req.user?.id,
    `استعادة النسخة رقم #${rev.revision}`
  );
  writeDb(db);
  return res.json({ success: true, post: db.posts[postIndex], revisions: (db.postRevisions || []).filter((r) => r.postId === current.id) });
});

// Admin: Bulk actions on posts
apiRouter.post('/admin/posts/bulk', requireAuth, (req: AuthRequest, res) => {
  const { ids, action } = req.body;
  if (!Array.isArray(ids) || ids.length === 0 || typeof action !== 'string') {
    return res.status(400).json({ error: 'يرجى تحديد المقالات والإجراء المطلوب.' });
  }
  const db = readDb();
  const idSet = new Set(ids.map(String));
  const now = new Date().toISOString();

  if (action === 'delete') {
    db.posts = db.posts.filter((p) => !idSet.has(p.id));
  } else if (VALID_STATUSES.includes(action as BlogStatus)) {
    db.posts.forEach((p) => {
      if (idSet.has(p.id)) {
        p.status = action as BlogStatus;
        p.updatedAt = now;
        p.revision = (p.revision || 1) + 1;
        if (action === 'published' && !p.publishedAt) p.publishedAt = now;
      }
    });
  } else {
    return res.status(400).json({ error: 'إجراء غير مدعوم.' });
  }

  writeDb(db);
  return res.json({ success: true, posts: db.posts });
});

// Admin: Delete blog post
apiRouter.delete('/admin/posts/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const initialLength = db.posts.length;
  db.posts = db.posts.filter((p) => p.id !== id);

  if (db.posts.length === initialLength) {
    res.status(404).json({ error: 'المقال غير موجود' });
    return;
  }

  writeDb(db);
  res.json({ success: true, message: 'تم حذف المقال بنجاح' });
});

// ==========================================
// 3. BLOG CATEGORIES, TAGS, TEMPLATES & SETTINGS ROUTES
// ==========================================

// Public: Get categories with post count
apiRouter.get('/categories', (_req, res) => {
  const db = readDb();
  const counts: Record<string, number> = {};
  db.posts.forEach((p) => {
    if (p.status === 'published') {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
  });

  const categories = db.categories.map((c) => ({
    ...c,
    postCount: counts[c.slug] || 0,
  }));

  res.json({ categories });
});

// Admin: Create category
apiRouter.post('/admin/categories', requireAuth, (req, res) => {
  const { name, nameEn, nameFr, slug, description, descriptionEn, descriptionFr, color } = req.body;
  if (!name || !String(name).trim()) {
    res.status(400).json({ error: 'يرجى إدخال اسم التصنيف' });
    return;
  }

  const db = readDb();
  const finalSlug =
    (slug || nameEn || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `cat-${Date.now()}`;

  if (db.categories.some((c) => c.slug === finalSlug)) {
    res.status(400).json({ error: 'اسم الرابط اللاتيني (Slug) مستخدم بالفعل' });
    return;
  }

  const newCat: BlogCategory = {
    id: `cat_${Date.now()}`,
    name: String(name).trim(),
    nameEn: nameEn ? String(nameEn).trim() : undefined,
    nameFr: nameFr ? String(nameFr).trim() : undefined,
    slug: finalSlug,
    description: String(description || '').trim(),
    descriptionEn: descriptionEn ? String(descriptionEn).trim() : undefined,
    descriptionFr: descriptionFr ? String(descriptionFr).trim() : undefined,
    color: color || '#004AA5',
  };

  db.categories.push(newCat);
  writeDb(db);

  res.status(201).json({ success: true, category: newCat });
});

// Admin: Update category
apiRouter.put('/admin/categories/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.categories.findIndex((c) => c.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'التصنيف غير موجود' });
    return;
  }

  const { name, nameEn, nameFr, slug, description, descriptionEn, descriptionFr, color } = req.body;
  const current = db.categories[index];
  const nextSlug = slug !== undefined && String(slug).trim() ? String(slug).trim() : current.slug;

  if (nextSlug !== current.slug) {
    db.posts.forEach((p) => {
      if (p.category === current.slug) p.category = nextSlug;
    });
  }

  db.categories[index] = {
    ...current,
    name: name !== undefined ? String(name).trim() : current.name,
    nameEn: nameEn !== undefined ? String(nameEn).trim() : current.nameEn,
    nameFr: nameFr !== undefined ? String(nameFr).trim() : current.nameFr,
    slug: nextSlug,
    description: description !== undefined ? String(description).trim() : current.description,
    descriptionEn: descriptionEn !== undefined ? String(descriptionEn).trim() : current.descriptionEn,
    descriptionFr: descriptionFr !== undefined ? String(descriptionFr).trim() : current.descriptionFr,
    color: color !== undefined ? color : current.color,
  };

  writeDb(db);
  res.json({ success: true, category: db.categories[index] });
});

// Admin: Delete category
apiRouter.delete('/admin/categories/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const cat = db.categories.find((c) => c.id === id);

  if (!cat) {
    res.status(404).json({ error: 'التصنيف غير موجود' });
    return;
  }

  const inUse = db.posts.some((p) => p.category === cat.slug);
  if (inUse) {
    res.status(400).json({ error: 'لا يمكن حذف التصنيف لأنه مستخدم في مقالات حالية. يرجى نقل المقالات أولاً.' });
    return;
  }

  db.categories = db.categories.filter((c) => c.id !== id);
  writeDb(db);
  res.json({ success: true, message: 'تم حذف التصنيف بنجاح' });
});

// Public & Admin: Get Tags with post count
apiRouter.get('/tags', (_req, res) => {
  const db = readDb();
  const counts: Record<string, number> = {};
  db.posts.forEach((p) => {
    (p.tags || []).forEach((t) => {
      const key = t.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
  });

  const tags = (db.tags || []).map((t) => ({
    ...t,
    postCount: counts[t.name.toLowerCase()] || 0,
  }));
  res.json({ tags });
});

apiRouter.post('/admin/tags', requireAuth, (req, res) => {
  const { name, nameEn, nameFr, slug, description } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'يرجى إدخال اسم الوسم (Tag)' });
  }
  const db = readDb();
  if (!db.tags) db.tags = [];
  const trimmed = String(name).trim();
  if (db.tags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())) {
    return res.status(400).json({ error: 'هذا الوسم موجود بالفعل' });
  }
  const finalSlug =
    (slug || nameEn || trimmed)
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `tag-${Date.now()}`;

  const newTag: BlogTag = {
    id: `tag_${Date.now()}`,
    name: trimmed,
    nameEn: nameEn ? String(nameEn).trim() : undefined,
    nameFr: nameFr ? String(nameFr).trim() : undefined,
    slug: finalSlug,
    description: description ? String(description).trim() : undefined,
  };
  db.tags.push(newTag);
  writeDb(db);
  return res.status(201).json({ success: true, tag: newTag });
});

apiRouter.put('/admin/tags/:id', requireAuth, (req, res) => {
  const db = readDb();
  if (!db.tags) db.tags = [];
  const idx = db.tags.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'الوسم غير موجود' });

  const oldName = db.tags[idx].name;
  const { name, nameEn, nameFr, slug, description } = req.body;
  const nextName = name !== undefined && String(name).trim() ? String(name).trim() : oldName;

  if (nextName !== oldName) {
    db.posts.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags = p.tags.map((t) => (t.toLowerCase() === oldName.toLowerCase() ? nextName : t));
      }
    });
  }

  db.tags[idx] = {
    ...db.tags[idx],
    name: nextName,
    nameEn: nameEn !== undefined ? String(nameEn).trim() : db.tags[idx].nameEn,
    nameFr: nameFr !== undefined ? String(nameFr).trim() : db.tags[idx].nameFr,
    slug: slug !== undefined && String(slug).trim() ? String(slug).trim() : db.tags[idx].slug,
    description: description !== undefined ? String(description).trim() : db.tags[idx].description,
  };
  writeDb(db);
  return res.json({ success: true, tag: db.tags[idx] });
});

apiRouter.delete('/admin/tags/:id', requireAuth, (req, res) => {
  const db = readDb();
  if (!db.tags) db.tags = [];
  const tag = db.tags.find((t) => t.id === req.params.id);
  if (!tag) return res.status(404).json({ error: 'الوسم غير موجود' });

  db.tags = db.tags.filter((t) => t.id !== req.params.id);
  db.posts.forEach((p) => {
    if (Array.isArray(p.tags)) {
      p.tags = p.tags.filter((t) => t.toLowerCase() !== tag.name.toLowerCase());
    }
  });
  writeDb(db);
  return res.json({ success: true });
});

// Admin: Article Templates CRUD
apiRouter.get('/admin/templates', requireAuth, (_req, res) => {
  const db = readDb();
  if (!db.blogTemplates || db.blogTemplates.length === 0) {
    db.blogTemplates = getDefaultBlogTemplates();
    writeDb(db);
  }
  res.json({ templates: db.blogTemplates });
});

apiRouter.post('/admin/templates', requireAuth, (req, res) => {
  const { name, nameEn, nameFr, description, category, language, titleTemplate, excerptTemplate, contentHtml, tags } = req.body;
  if (!name || !contentHtml) {
    return res.status(400).json({ error: 'يرجى إدخال اسم القالب ومحتواه.' });
  }
  const db = readDb();
  if (!db.blogTemplates) db.blogTemplates = getDefaultBlogTemplates();
  const tpl: BlogTemplate = {
    id: `tpl_${Date.now()}`,
    name: String(name).trim(),
    nameEn: String(nameEn || name).trim(),
    nameFr: String(nameFr || name).trim(),
    description: String(description || '').trim(),
    category: category || 'general',
    language: VALID_LANGUAGES.includes(language) ? language : 'ar',
    titleTemplate: String(titleTemplate || '').trim(),
    excerptTemplate: String(excerptTemplate || '').trim(),
    contentHtml: sanitizeBlogHtml(String(contentHtml)),
    tags: Array.isArray(tags) ? tags : [],
    updatedAt: new Date().toISOString(),
  };
  db.blogTemplates.unshift(tpl);
  writeDb(db);
  return res.status(201).json({ success: true, template: tpl });
});

apiRouter.put('/admin/templates/:id', requireAuth, (req, res) => {
  const db = readDb();
  if (!db.blogTemplates) db.blogTemplates = getDefaultBlogTemplates();
  const idx = db.blogTemplates.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'القالب غير موجود' });

  const cur = db.blogTemplates[idx];
  db.blogTemplates[idx] = {
    ...cur,
    ...req.body,
    id: cur.id,
    contentHtml: req.body.contentHtml !== undefined ? sanitizeBlogHtml(String(req.body.contentHtml)) : cur.contentHtml,
    updatedAt: new Date().toISOString(),
  };
  writeDb(db);
  return res.json({ success: true, template: db.blogTemplates[idx] });
});

apiRouter.delete('/admin/templates/:id', requireAuth, (req, res) => {
  const db = readDb();
  if (!db.blogTemplates) return res.status(404).json({ error: 'القالب غير موجود' });
  db.blogTemplates = db.blogTemplates.filter((t) => t.id !== req.params.id);
  writeDb(db);
  return res.json({ success: true });
});

// Public & Admin: Blog Settings
apiRouter.get('/blog-settings', (_req, res) => {
  const db = readDb();
  res.json({ blogSettings: db.blogSettings || getDefaultBlogSettings() });
});

apiRouter.put('/admin/blog-settings', requireAuth, (req, res) => {
  const db = readDb();
  const current = db.blogSettings || getDefaultBlogSettings();
  db.blogSettings = {
    ...current,
    ...req.body,
  };
  writeDb(db);
  res.json({ success: true, blogSettings: db.blogSettings });
});

// ==========================================
// 4. MEDIA LIBRARY & UPLOADS
// ==========================================

function getMediaUsage(db: ReturnType<typeof readDb>, url: string) {
  return db.posts
    .filter((p) => p.coverImage === url || (typeof p.content === 'string' && p.content.includes(url)) || p.pdfUrl === url)
    .map((p) => ({ id: p.id, title: p.title, slug: p.slug, status: p.status }));
}

// Admin: Get all media assets with usage info
apiRouter.get('/admin/media', requireAuth, (_req, res) => {
  const db = readDb();
  const mediaWithUsage = db.media.map((asset) => {
    const usedInPosts = getMediaUsage(db, asset.url);
    return {
      ...asset,
      usageCount: usedInPosts.length,
      usedInPosts,
    };
  });
  res.json({ media: mediaWithUsage });
});

// Admin: Upload new media asset with explicit Multer error handling
apiRouter.post('/admin/media/upload', requireAuth, (req: AuthRequest, res) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      res.status(400).json({ error: err.message || 'فشل رفع الملف، تأكد من الصيغة والحجم (أقصى حد 12MB).' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'لم يتم استلام أي ملف' });
      return;
    }

    const db = readDb();
    const newAsset: MediaAsset = {
      id: `med_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      altText: req.body.altText || req.file.originalname.replace(/\.[^.]+$/, ''),
      caption: req.body.caption || '',
      uploader: req.user?.displayName || 'ELFAZNI SERVICES',
      createdAt: new Date().toISOString(),
    };

    db.media.unshift(newAsset);
    writeDb(db);

    res.status(201).json({ success: true, asset: newAsset });
  });
});

// Admin: Update media asset metadata (altText, caption)
apiRouter.patch('/admin/media/:id', requireAuth, (req, res) => {
  const db = readDb();
  const asset = db.media.find((m) => m.id === req.params.id);
  if (!asset) {
    return res.status(404).json({ error: 'الملف غير موجود' });
  }
  if (req.body.altText !== undefined) asset.altText = String(req.body.altText).trim();
  if (req.body.caption !== undefined) asset.caption = String(req.body.caption).trim();
  writeDb(db);
  return res.json({ success: true, asset });
});

// Admin: Delete media asset (checks usage across articles first)
apiRouter.delete('/admin/media/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const force = req.query.force === 'true' || req.query.force === '1';
  const db = readDb();
  const asset = db.media.find((m) => m.id === id);

  if (!asset) {
    res.status(404).json({ error: 'الملف غير موجود' });
    return;
  }

  const usedInPosts = getMediaUsage(db, asset.url);
  if (usedInPosts.length > 0 && !force) {
    res.status(400).json({
      error: `هذا الملف مستخدم حالياً في (${usedInPosts.length}) مقالات. يرجى تأكيد الحذف أو استبداله أولاً.`,
      usedInPosts,
    });
    return;
  }

  if (asset.url.startsWith('/uploads/')) {
    const filePath = path.join(process.cwd(), 'public', asset.url);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn('Could not delete file from disk:', err);
      }
    }
  }

  db.media = db.media.filter((m) => m.id !== id);
  writeDb(db);
  res.json({ success: true, message: 'تم حذف الملف بنجاح' });
});

// ==========================================
// 5. SITE SERVICES MANAGEMENT & SECTIONS
// ==========================================

apiRouter.get('/services', (_req, res) => {
  const db = readDb();
  const services = db.services.filter((service) => service.active !== false).sort((a, b) => a.sortOrder - b.sortOrder);
  res.json({ services });
});

apiRouter.get('/admin/services', requireAuth, (_req, res) => {
  const services = [...readDb().services].sort((a, b) => a.sortOrder - b.sortOrder);
  res.json({ services });
});

apiRouter.post('/admin/services', requireAuth, (req, res) => {
  const db = readDb();
  const newService = {
    id: `srv_${Date.now()}`,
    key: req.body.key || `srv_${Date.now()}`,
    title: req.body.title || 'خدمة جديدة',
    description: req.body.description || '',
    category: req.body.category || 'عام',
    icon: req.body.icon || 'star',
    image: req.body.image || '/assets/slides/10-all-services.webp',
    active: req.body.active !== false,
    sortOrder: (db.services.length + 1),
    featured: !!req.body.featured,
  };

  db.services.push(newService);
  writeDb(db);
  broadcastRealtime('services:updated', { services: db.services.filter((service) => service.active !== false).sort((a, b) => a.sortOrder - b.sortOrder) });
  res.status(201).json({ success: true, service: newService });
});

apiRouter.put('/admin/services/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.services.findIndex((s) => s.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'الخدمة غير موجودة' });
    return;
  }

  if (req.body.active !== undefined && typeof req.body.active !== 'boolean') {
    return res.status(400).json({ error: 'حالة ظهور الخدمة غير صالحة.' });
  }

  db.services[index] = {
    ...db.services[index],
    ...req.body,
  };

  writeDb(db);
  broadcastRealtime('services:updated', { services: db.services.filter((service) => service.active !== false).sort((a, b) => a.sortOrder - b.sortOrder) });
  res.json({ success: true, service: db.services[index] });
});

apiRouter.delete('/admin/services/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  db.services = db.services.filter((s) => s.id !== id);
  writeDb(db);
  broadcastRealtime('services:updated', { services: db.services.filter((service) => service.active !== false).sort((a, b) => a.sortOrder - b.sortOrder) });
  res.json({ success: true, message: 'تم حذف الخدمة' });
});

// ==========================================
// 6. SITE SETTINGS & CONTENT MANAGEMENT
// ==========================================

apiRouter.get('/settings', (_req, res) => {
  const db = readDb();
  res.json({ settings: db.settings });
});

apiRouter.patch('/admin/settings/sections/:id', requireAuth, (req, res) => {
  const id = req.params.id as HomepageSection;
  if (!Object.hasOwn(homepageSections, id) || typeof req.body.visible !== 'boolean') {
    return res.status(400).json({ error: 'القسم أو حالة الظهور غير صالحة.' });
  }
  const db = readDb();
  const hidden = new Set(db.settings.hiddenSections || []);
  if (req.body.visible) hidden.delete(id);
  else hidden.add(id);
  db.settings.hiddenSections = [...hidden];
  writeDb(db);
  broadcastRealtime('settings:updated', { settings: db.settings });
  return res.json({ settings: db.settings });
});

apiRouter.put('/admin/settings', requireAuth, (req, res) => {
  const db = readDb();
  const { hiddenSections, ...updates } = req.body;
  const langs = ['ar','en','fr','tr'];
  const validCopy = (value: unknown) => value && typeof value === 'object' && !Array.isArray(value) && Object.entries(value).every(([k,v]) => langs.includes(k) && typeof v === 'string' && v.length <= 3000);
  if ((updates.sectionOrder !== undefined && (!Array.isArray(updates.sectionOrder) || !updates.sectionOrder.every((id: string) => Object.hasOwn(homepageSections,id)) || new Set(updates.sectionOrder).size !== updates.sectionOrder.length)) ||
      (updates.sectionTitles !== undefined && (!updates.sectionTitles || typeof updates.sectionTitles !== 'object' || Object.entries(updates.sectionTitles).some(([key,value]) => !Object.hasOwn(homepageSections,key) || !validCopy(value)))) ||
      (updates.heroTitle !== undefined && !validCopy(updates.heroTitle)) ||
      (updates.heroDescription !== undefined && !validCopy(updates.heroDescription)) ||
      (updates.faqItems !== undefined && (!Array.isArray(updates.faqItems) || updates.faqItems.length > 50 || !updates.faqItems.every((item: any) => item && ['q','a','qEn','aEn','qFr','aFr','qTr','aTr'].every(k => typeof item[k] === 'string' && item[k].length <= 5000))))) {
    return res.status(400).json({error:'راجع نصوص الأقسام وترتيبها والأسئلة الشائعة.'});
  }
  db.settings = {
    ...db.settings,
    ...updates,
    siteNameEn: 'ELFAZNI SERVICES', // brand rule
  };

  writeDb(db);
  broadcastRealtime('settings:updated', { settings: db.settings });
  res.json({ success: true, settings: db.settings });
});

// ==========================================
// UNIFIED REQUESTS & INBOX INTAKE
// ==========================================

// UNIFIED REQUESTS & INBOX INTAKE
// ==========================================

// Public: Save consented draft for incomplete inquiries (Consent-Based Auto-Save)
apiRouter.post('/public/requests/draft', async (req, res) => {
  const {
    draftId,
    consent,
    name,
    phone,
    whatsappPhone,
    email,
    serviceTag,
    serviceRequested,
    city,
    notes,
    source,
    country,
  } = req.body;

  // Strict Consent Check: Do not collect or transmit personal contact info before explicit consent
  if (!consent) {
    res.status(400).json({ error: 'موافقة المستخدم الصريحة مطلوبة لحفظ المسودة' });
    return;
  }

  if (!name || (!phone && !email)) {
    res.status(400).json({ error: 'يرجى إدخال الاسم ورقم الهاتف أو البريد الإلكتروني' });
    return;
  }

  const db = readDb();
  const clientInfo = detectClientFromRequest(req, req.body);
  const stableDraftId = String(draftId || randomUUID()).trim();

  const validServiceTag: ServiceTag =
    ['FLIGHT', 'HOTEL', 'TRANSFER', 'CONSULAR', 'GENERAL', 'OFFLINE_CHAT'].includes(serviceTag)
      ? serviceTag
      : 'GENERAL';

  const draftRef = `REQ-DFT-${stableDraftId.slice(0, 6).toUpperCase()}`;
  const now = new Date().toISOString();

  // Find existing draft by draftId or by matching phone/email
  const existingDraft = db.messages.find(
    (m) =>
      m.draftId === stableDraftId ||
      (m.isConsentedDraft &&
        ((phone && m.phone === String(phone).trim()) || (email && m.email === String(email).trim())))
  );

  if (existingDraft) {
    existingDraft.name = String(name).trim();
    existingDraft.phone = String(phone || '').trim();
    if (whatsappPhone) existingDraft.whatsappPhone = String(whatsappPhone).trim();
    if (email) existingDraft.email = String(email).trim();
    if (serviceRequested) existingDraft.serviceRequested = serviceRequested;
    existingDraft.serviceTag = validServiceTag;
    existingDraft.message = `المدينة: ${city || 'إسطنبول'}\n${notes || ''}`.trim();
    existingDraft.followUpStatus = 'INCOMPLETE_CONSENTED';
    existingDraft.needsFollowUp = true;
    if (!existingDraft.activityTimeline) existingDraft.activityTimeline = [];
    existingDraft.activityTimeline.push({
      id: randomUUID(),
      action: 'تحديث مسودة التواصل بموافقة صريحة من العميل',
      actor: String(name).trim(),
      details: `المرجع المؤقت: ${existingDraft.reference || draftRef}`,
      createdAt: now,
    });
    existingDraft.updatedAt = now;
    writeDb(db);

    broadcastRealtime('mailbox:update', { message: existingDraft });
    res.json({
      success: true,
      draftId: stableDraftId,
      reference: existingDraft.reference || draftRef,
      message: 'تم تحديث مسودة التواصل بنجاح',
      request: existingDraft,
    });
    return;
  }

  const newDraft: ContactMessage = {
    id: randomUUID(),
    draftId: stableDraftId,
    isConsentedDraft: true,
    ticketNumber: draftRef,
    reference: draftRef,
    name: String(name).trim(),
    phone: String(phone || '').trim(),
    whatsappPhone: whatsappPhone ? String(whatsappPhone).trim() : undefined,
    email: email ? String(email).trim() : undefined,
    serviceRequested: serviceRequested || 'استفسار أولي',
    serviceTag: validServiceTag,
    followUpStatus: 'INCOMPLETE_CONSENTED',
    needsFollowUp: true,
    requestSource: (source as RequestSource) || 'website_form',
    subject: `استفسار غير مكتمل — بيانات تواصل محفوظة (${serviceRequested || 'خدمة'})`,
    message: `المدينة: ${city || 'إسطنبول'}\n${notes || ''}`.trim(),
    folder: 'inbox',
    status: 'new',
    starred: false,
    country: country || `${clientInfo.country} ${clientInfo.flag}`,
    attachments: [],
    replies: [],
    internalNotes: [],
    activityTimeline: [
      {
        id: randomUUID(),
        action: 'حفظ مسودة بيانات التواصل بموافقة صريحة من العميل',
        actor: String(name).trim(),
        details: `المرجع المؤقت: ${draftRef}`,
        createdAt: now,
      },
    ],
    source: source ? `${source} (مسودة)` : `معالج الموقع (مسودة)`,
    createdAt: now,
  };

  db.messages.unshift(newDraft);
  writeDb(db);

  broadcastRealtime('mailbox:new', {
    message: newDraft,
    unreadCount: db.messages.filter((m) => m.status === 'new').length,
  });

  res.status(201).json({
    success: true,
    draftId: stableDraftId,
    reference: draftRef,
    message: 'تم حفظ مسودة التواصل بنجاح',
    request: newDraft,
  });
});

// Public: Unified intake for website service forms (Flight, Hotel, Transfer, Consular, General)
apiRouter.post(['/public/requests', '/requests'], publicSubmissionRateLimiter, async (req, res) => {
  const {
    draftId,
    name,
    phone,
    whatsappPhone,
    email,
    serviceTag,
    serviceRequested,
    subject,
    message,
    payloadJson,
    source,
    country,
  } = req.body;

  if (!name || (!phone && !email)) {
    res.status(400).json({ error: 'يرجى إدخال الاسم ورقم الهاتف أو البريد الإلكتروني للتواصل' });
    return;
  }

  const db = readDb();
  const clientInfo = detectClientFromRequest(req, req.body);
  const tagPrefixMap: Record<ServiceTag, string> = {
    FLIGHT: 'FLY',
    HOTEL: 'HTL',
    TRANSFER: 'TRF',
    CONSULAR: 'CON',
    GENERAL: 'GEN',
    OFFLINE_CHAT: 'CHT',
  };

  const validServiceTag: ServiceTag =
    ['FLIGHT', 'HOTEL', 'TRANSFER', 'CONSULAR', 'GENERAL', 'OFFLINE_CHAT'].includes(serviceTag)
      ? serviceTag
      : 'GENERAL';

  const prefix = tagPrefixMap[validServiceTag] || 'REQ';
  const refCode = `REQ-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

  const serviceLabelMap: Record<ServiceTag, string> = {
    FLIGHT: 'حجز واستعلام طيران',
    HOTEL: 'حجز فندق',
    TRANSFER: 'توصيل مطار VIP وسيارات',
    CONSULAR: 'موعد قنصلي مغربي',
    GENERAL: 'استفسار عام',
    OFFLINE_CHAT: 'رسالة أثناء عدم التواجد',
  };

  const resolvedServiceName = serviceRequested || serviceLabelMap[validServiceTag];
  const now = new Date().toISOString();

  // Check if there is an existing consented draft to update in-place (Prevents Duplicate Records)
  let targetRequest: ContactMessage;
  const existingDraft = draftId
    ? db.messages.find((m) => m.draftId === String(draftId).trim())
    : undefined;

  if (existingDraft) {
    targetRequest = existingDraft;
    targetRequest.ticketNumber = refCode;
    targetRequest.reference = refCode;
    targetRequest.name = String(name).trim();
    targetRequest.phone = String(phone || '').trim();
    targetRequest.whatsappPhone = whatsappPhone ? String(whatsappPhone).trim() : undefined;
    targetRequest.email = email ? String(email).trim() : undefined;
    targetRequest.serviceRequested = resolvedServiceName;
    targetRequest.serviceTag = validServiceTag;
    targetRequest.followUpStatus = 'NEW';
    targetRequest.needsFollowUp = true;
    targetRequest.isConsentedDraft = false;
    targetRequest.requestSource = (source as RequestSource) || 'website_form';
    targetRequest.subject = subject ? String(subject).trim() : `طلب ${resolvedServiceName}`;
    targetRequest.message = message ? String(message).trim() : 'طلب خدمة عبر موقع ELFAZNI SERVICES';
    targetRequest.payloadJson = payloadJson && typeof payloadJson === 'object' ? payloadJson : undefined;
    targetRequest.source = source ? `${source} (${clientInfo.device})` : `نموذج الموقع (${clientInfo.device})`;
    targetRequest.updatedAt = now;
    if (!targetRequest.activityTimeline) targetRequest.activityTimeline = [];
    targetRequest.activityTimeline.push({
      id: randomUUID(),
      action: `تأكيد وإرسال الطلب نهائياً عبر الموقع [${validServiceTag}]`,
      actor: String(name).trim(),
      details: `المرجع الرسمي: ${refCode}`,
      createdAt: now,
    });
  } else {
    targetRequest = {
      id: randomUUID(),
      ticketNumber: refCode,
      reference: refCode,
      name: String(name).trim(),
      phone: String(phone || '').trim(),
      whatsappPhone: whatsappPhone ? String(whatsappPhone).trim() : undefined,
      email: email ? String(email).trim() : undefined,
      serviceRequested: resolvedServiceName,
      serviceTag: validServiceTag,
      followUpStatus: 'NEW',
      needsFollowUp: true,
      requestSource: (source as RequestSource) || 'website_form',
      subject: subject ? String(subject).trim() : `طلب ${resolvedServiceName}`,
      message: message ? String(message).trim() : 'طلب خدمة عبر موقع ELFAZNI SERVICES',
      payloadJson: payloadJson && typeof payloadJson === 'object' ? payloadJson : undefined,
      folder: 'inbox',
      status: 'new',
      starred: false,
      country: country || `${clientInfo.country} ${clientInfo.flag}`,
      attachments: [],
      replies: [],
      internalNotes: [],
      activityTimeline: [
        {
          id: randomUUID(),
          action: `تقديم طلب جديد [${validServiceTag}] عبر الموقع`,
          actor: String(name).trim(),
          details: `المرجع: ${refCode}`,
          createdAt: now,
        },
      ],
      source: source ? `${source} (${clientInfo.device})` : `نموذج الموقع (${clientInfo.device})`,
      createdAt: now,
    };
    db.messages.unshift(targetRequest);
  }

  const visitInfo = recordGenuineVisit(
    db,
    req,
    { ...req.body, action: `طلب خدمة: ${resolvedServiceName}` },
    'طلب خدمة موحد عبر الموقع',
    false
  );
  if (db.analytics) {
    db.analytics.trafficPeriods = computeTrafficPeriods(db);
    db.analytics.trafficHistory = db.analytics.trafficPeriods.weekly;
  }
  writeDb(db);

  syncInquiryToCrmLead({
    name: targetRequest.name,
    phone: targetRequest.phone || targetRequest.whatsappPhone,
    email: targetRequest.email,
    serviceRequested: targetRequest.serviceRequested,
    reference: targetRequest.reference,
    message: targetRequest.message,
  });

  // Enqueue tagged email alert
  const emailAlertPromise = dispatchAdminEmailAlert({
    ticketNumber: targetRequest.ticketNumber,
    reference: targetRequest.reference,
    serviceTag: validServiceTag,
    followUpStatus: 'NEW',
    needsFollowUp: true,
    senderName: targetRequest.name,
    senderPhone: targetRequest.phone,
    senderWhatsapp: targetRequest.whatsappPhone,
    senderEmail: targetRequest.email,
    serviceRequested: targetRequest.serviceRequested,
    subject: targetRequest.subject,
    message: targetRequest.message,
    device: clientInfo.device,
    country: targetRequest.country,
    source: targetRequest.source,
    details: targetRequest.payloadJson,
  });

  broadcastRealtime(existingDraft ? 'mailbox:update' : 'mailbox:new', {
    message: targetRequest,
    unreadCount: db.messages.filter((m) => m.status === 'new').length,
  });

  const emailResult = await emailAlertPromise;
  targetRequest.emailDeliveryStatus = emailResult.status === 'accepted' ? 'sent' : emailResult.status;
  writeDb(db);

  res.status(existingDraft ? 200 : 201).json({
    success: true,
    reference: refCode,
    ticketNumber: refCode,
    emailDeliveryStatus: targetRequest.emailDeliveryStatus,
    message: 'تم استلام طلبكم بنجاح وسيتواصل معكم فريقنا لتأكيد التفاصيل.',
    request: targetRequest,
  });
});

// Admin/API: Convert mailbox message / inquiry to CRM Customer / Lead
apiRouter.post(['/api/mailbox/:id/convert-to-crm', '/admin/mailbox/:id/convert-to-crm'], async (req, res) => {
  const db = readDb();
  const id = req.params.id;
  const msg = db.messages.find((m) => m.id === id || m.ticketNumber === id || m.reference === id);
  if (!msg) {
    res.status(404).json({ error: 'الرسالة غير موجودة' });
    return;
  }

  const syncResult = syncInquiryToCrmLead({
    name: msg.name,
    phone: msg.phone || msg.whatsappPhone,
    email: msg.email,
    serviceRequested: msg.serviceRequested,
    reference: msg.reference || msg.ticketNumber,
    message: msg.message,
  });

  const contactId = syncResult?.contactId || randomUUID();
  msg.crmContactId = contactId;
  if (!msg.activityTimeline) msg.activityTimeline = [];
  msg.activityTimeline.push({
    id: randomUUID(),
    action: syncResult?.matched ? 'ربط الطلب بجهة اتصال موجودة في CRM' : 'إنشاء جهة اتصال وعميل جديد في CRM',
    actor: 'المسؤول (Admin)',
    details: `معرف العميل في CRM: ${contactId}`,
    createdAt: new Date().toISOString(),
  });

  writeDb(db);
  broadcastRealtime('mailbox:update', { message: msg });
  res.json({
    success: true,
    contactId,
    matched: syncResult?.matched ?? false,
    message: 'تم تحويل وربط الطلب بنظام إدارة العملاء (CRM) بنجاح',
    request: msg,
  });
});

// Admin/API: Create follow-up task for mailbox message
apiRouter.post(['/api/mailbox/:id/create-task', '/admin/mailbox/:id/create-task'], async (req, res) => {
  const db = readDb();
  const id = req.params.id;
  const msg = db.messages.find((m) => m.id === id || m.ticketNumber === id || m.reference === id);
  if (!msg) {
    res.status(404).json({ error: 'الرسالة غير موجودة' });
    return;
  }

  const taskTitle = req.body.title || `متابعة الطلب ${msg.reference || msg.ticketNumber} — ${msg.name}`;
  const taskId = `TSK-${Date.now().toString(36).toUpperCase()}`;

  if (!msg.activityTimeline) msg.activityTimeline = [];
  msg.activityTimeline.push({
    id: randomUUID(),
    action: 'إنشاء مهمة متابعة للطلب',
    actor: 'المسؤول (Admin)',
    details: `${taskTitle} (${taskId})`,
    createdAt: new Date().toISOString(),
  });
  msg.needsFollowUp = true;

  writeDb(db);
  broadcastRealtime('mailbox:update', { message: msg });
  res.json({
    success: true,
    taskId,
    title: taskTitle,
    message: 'تم إنشاء مهمة المتابعة بنجاح',
    request: msg,
  });
});


// Public: Offline live chat capture when staff is not available
apiRouter.post('/public/offline-messages', publicSubmissionRateLimiter, async (req, res) => {
  const {
    name,
    phone,
    whatsappPhone,
    email,
    serviceCategory,
    message,
    visitorId,
    country,
  } = req.body;

  if (!name || (!phone && !email) || !message) {
    res.status(400).json({ error: 'يرجى إدخال الاسم، ورقم الهاتف أو البريد، وتفاصيل الرسالة' });
    return;
  }

  const db = readDb();
  const clientInfo = detectClientFromRequest(req, req.body);
  const effectiveVisitorId = visitorId || `vis_${Date.now()}`;
  const categoryToTagMap: Record<string, ServiceTag> = {
    flight: 'FLIGHT',
    hotel: 'HOTEL',
    transfer: 'TRANSFER',
    consular: 'CONSULAR',
    general: 'GENERAL',
  };

  const mappedServiceTag: ServiceTag = categoryToTagMap[serviceCategory] || 'OFFLINE_CHAT';
  const tagPrefixMap: Record<ServiceTag, string> = {
    FLIGHT: 'FLY',
    HOTEL: 'HTL',
    TRANSFER: 'TRF',
    CONSULAR: 'CON',
    GENERAL: 'GEN',
    OFFLINE_CHAT: 'CHT',
  };
  const prefix = tagPrefixMap[mappedServiceTag] || 'CHT';
  const refCode = `REQ-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

  if (!db.chatSessions) db.chatSessions = [];
  if (!db.chatMessages) db.chatMessages = [];

  let session = db.chatSessions.find((s) => s.visitorId === effectiveVisitorId && s.status === 'active');
  if (!session) {
    session = {
      id: randomUUID(),
      visitorId: effectiveVisitorId,
      visitorName: String(name).trim(),
      visitorPhone: phone ? String(phone).trim() : undefined,
      visitorEmail: email ? String(email).trim() : undefined,
      visitorCountry: country || `${clientInfo.country} ${clientInfo.flag}`,
      currentPage: req.body.currentPage || 'الرئيسية (رسالة عدم تواجد)',
      unreadAdmin: 1,
      unreadVisitor: 0,
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      status: 'active',
    };
    db.chatSessions.unshift(session);
  } else {
    session.unreadAdmin = (session.unreadAdmin || 0) + 1;
    session.lastMessageAt = new Date().toISOString();
    if (name) session.visitorName = String(name).trim();
    if (phone) session.visitorPhone = String(phone).trim();
    if (email) session.visitorEmail = String(email).trim();
  }

  const chatMsg: ChatMessage = {
    id: randomUUID(),
    sessionId: session.id,
    sender: 'visitor',
    senderName: String(name).trim(),
    text: `[رسالة أثناء عدم التواجد | ${refCode}]\nالخدمة: ${serviceCategory || 'عام'}\n\n${String(message).trim()}`,
    createdAt: new Date().toISOString(),
  };
  db.chatMessages.push(chatMsg);

  const newRequest: ContactMessage = {
    id: randomUUID(),
    ticketNumber: refCode,
    reference: refCode,
    name: String(name).trim(),
    phone: String(phone || '').trim(),
    whatsappPhone: whatsappPhone ? String(whatsappPhone).trim() : undefined,
    email: email ? String(email).trim() : undefined,
    serviceRequested: `رسالة دردشة عدم تواجد (${serviceCategory || 'عام'})`,
    serviceTag: 'OFFLINE_CHAT',
    followUpStatus: 'NEW',
    needsFollowUp: true,
    requestSource: 'offline_chat',
    chatSessionId: session.id,
    subject: `رسالة أثناء عدم التواجد — ${name}`,
    message: String(message).trim(),
    payloadJson: {
      serviceCategory: serviceCategory || 'general',
      mappedServiceTag,
      chatSessionId: session.id,
      visitorId: effectiveVisitorId,
    },
    folder: 'inbox',
    status: 'new',
    starred: false,
    country: country || `${clientInfo.country} ${clientInfo.flag}`,
    attachments: [],
    replies: [],
    internalNotes: [],
    activityTimeline: [
      {
        id: randomUUID(),
        action: 'تسجيل رسالة زائر أثناء عدم تواجد الفريق (Offline Chat)',
        actor: String(name).trim(),
        details: `المرجع: ${refCode} · جلسة الدردشة: ${session.id}`,
        createdAt: new Date().toISOString(),
      },
    ],
    source: `محادثة فورية - وضع عدم التواجد (${clientInfo.device})`,
    createdAt: new Date().toISOString(),
  };

  db.messages.unshift(newRequest);
  writeDb(db);

  syncInquiryToCrmLead({
    name: newRequest.name,
    phone: newRequest.phone || newRequest.whatsappPhone,
    email: newRequest.email,
    serviceRequested: newRequest.serviceRequested,
    reference: newRequest.reference,
    message: newRequest.message,
  });

  const emailAlertPromise = dispatchAdminEmailAlert({
    ticketNumber: refCode,
    reference: refCode,
    serviceTag: 'OFFLINE_CHAT',
    followUpStatus: 'NEW',
    needsFollowUp: true,
    senderName: newRequest.name,
    senderPhone: newRequest.phone,
    senderWhatsapp: newRequest.whatsappPhone,
    senderEmail: newRequest.email,
    serviceRequested: `رسالة دردشة غير متواجد (${serviceCategory || 'عام'})`,
    subject: `رسالة أثناء عدم التواجد من ${newRequest.name}`,
    message: newRequest.message,
    device: clientInfo.device,
    country: newRequest.country,
    source: newRequest.source,
    details: newRequest.payloadJson,
  });

  broadcastRealtime('chat:message', {
    sessionId: session.id,
    visitorId: session.visitorId,
    message: chatMsg,
    session,
  });

  broadcastRealtime('mailbox:new', {
    message: newRequest,
    unreadCount: db.messages.filter((m) => m.status === 'new').length,
  });

  const emailResult = await emailAlertPromise;
  newRequest.emailDeliveryStatus = emailResult.status === 'accepted' ? 'sent' : emailResult.status;
  writeDb(db);

  res.status(201).json({
    success: true,
    reference: refCode,
    ticketNumber: refCode,
    sessionId: session.id,
    emailDeliveryStatus: newRequest.emailDeliveryStatus,
    message: 'تم استلام رسالتكم بنجاح وسيتواصل معكم فريقنا عند عودتنا.',
  });
});

// Public: Submit message from dual contact portal (Enhanced backwards-compatible)
apiRouter.post('/mailbox', publicSubmissionRateLimiter, async (req, res) => {
  const { name, phone, whatsappPhone, email, serviceRequested, serviceTag, subject, message, attachments, source, country, payloadJson } = req.body;
  if (!name || (!phone && !email)) {
    res.status(400).json({ error: 'يرجى إدخال الاسم ورقم الهاتف/الواتساب' });
    return;
  }

  const db = readDb();
  const clientInfo = detectClientFromRequest(req, req.body);
  let resolvedTag: ServiceTag = serviceTag || 'GENERAL';
  if (!['FLIGHT', 'HOTEL', 'TRANSFER', 'CONSULAR', 'GENERAL', 'OFFLINE_CHAT'].includes(resolvedTag)) {
    const s = String(serviceRequested || '').toLowerCase();
    if (s.includes('طيران') || s.includes('flight')) resolvedTag = 'FLIGHT';
    else if (s.includes('فندق') || s.includes('hotel')) resolvedTag = 'HOTEL';
    else if (s.includes('توصيل') || s.includes('سيارة') || s.includes('transfer')) resolvedTag = 'TRANSFER';
    else if (s.includes('قنصل') || s.includes('consul')) resolvedTag = 'CONSULAR';
    else resolvedTag = 'GENERAL';
  }

  const tagPrefixMap: Record<ServiceTag, string> = {
    FLIGHT: 'FLY',
    HOTEL: 'HTL',
    TRANSFER: 'TRF',
    CONSULAR: 'CON',
    GENERAL: 'GEN',
    OFFLINE_CHAT: 'CHT',
  };
  const prefix = tagPrefixMap[resolvedTag] || 'GEN';
  const refCode = req.body.reference || `REQ-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

  const newMessage: ContactMessage = {
    id: randomUUID(),
    ticketNumber: refCode,
    reference: refCode,
    name: String(name).trim(),
    phone: String(phone || '').trim(),
    whatsappPhone: whatsappPhone ? String(whatsappPhone).trim() : undefined,
    email: email ? String(email).trim() : undefined,
    serviceRequested: serviceRequested ? String(serviceRequested).trim() : 'خدمات عامة',
    serviceTag: resolvedTag,
    followUpStatus: 'NEW',
    needsFollowUp: true,
    requestSource: 'website_form',
    subject: subject ? String(subject).trim() : `طلب خدمة (${serviceRequested || 'عام'})`,
    message: message ? String(message).trim() : '',
    payloadJson: payloadJson && typeof payloadJson === 'object' ? payloadJson : undefined,
    folder: 'inbox',
    status: 'new',
    starred: false,
    country: country || `${clientInfo.country} ${clientInfo.flag}`,
    attachments: Array.isArray(attachments) ? attachments : [],
    replies: [],
    internalNotes: [],
    activityTimeline: [
      {
        id: randomUUID(),
        action: `تقديم رسالة/طلب جديد [${resolvedTag}]`,
        actor: String(name).trim(),
        details: `المرجع: ${refCode}`,
        createdAt: new Date().toISOString(),
      },
    ],
    source: source ? `${source} (${clientInfo.device})` : `مراسلة الموقع (${clientInfo.device})`,
    createdAt: new Date().toISOString(),
  };

  db.messages.unshift(newMessage);
  const visitInfo = recordGenuineVisit(
    db,
    req,
    { ...req.body, action: `إرسال رسالة: ${newMessage.serviceRequested}` },
    'إرسال رسالة لبوابة التواصل',
    false
  );
  if (db.analytics) {
    db.analytics.trafficPeriods = computeTrafficPeriods(db);
    db.analytics.trafficHistory = db.analytics.trafficPeriods.weekly;
  }
  writeDb(db);

  syncInquiryToCrmLead({
    name: newMessage.name,
    phone: newMessage.phone || newMessage.whatsappPhone,
    email: newMessage.email,
    serviceRequested: newMessage.serviceRequested,
    reference: newMessage.reference,
    message: newMessage.message,
  });

  const notification = dispatchAdminEmailAlert({
    ticketNumber: newMessage.ticketNumber,
    reference: newMessage.reference,
    serviceTag: resolvedTag,
    followUpStatus: 'NEW',
    needsFollowUp: true,
    senderName: newMessage.name,
    senderPhone: newMessage.phone,
    senderWhatsapp: newMessage.whatsappPhone,
    senderEmail: newMessage.email,
    serviceRequested: newMessage.serviceRequested,
    subject: newMessage.subject || `تذكرة جديدة ${newMessage.ticketNumber}`,
    message: newMessage.message,
    device: clientInfo.device,
    country: newMessage.country,
    source: newMessage.source,
    details: newMessage.payloadJson,
  });

  broadcastRealtime('mailbox:new', {
    message: newMessage,
    unreadCount: db.messages.filter((m) => m.status === 'new').length,
  });

  if (db.analytics) {
    broadcastRealtime('analytics:visit', {
      newVisit: visitInfo?.newVisit,
      totalVisits: db.analytics.totalVisits,
      uniqueVisitors: db.analytics.uniqueVisitors,
      activeVisitors: db.analytics.activeVisitors,
      deviceBreakdown: db.analytics.deviceBreakdown,
      recentVisits: db.analytics.recentVisits,
      topCountries: db.analytics.topCountries,
      trafficHistory: db.analytics.trafficHistory,
      trafficPeriods: db.analytics.trafficPeriods,
    });
  }

  const emailResult = await notification;
  newMessage.emailDeliveryStatus = emailResult.status === 'accepted' ? 'sent' : emailResult.status;
  writeDb(db);

  res.status(201).json({
    success: true,
    emailStatus: emailResult.status,
    emailDeliveryStatus: newMessage.emailDeliveryStatus,
    ticketNumber: refCode,
    reference: refCode,
    message: 'تم إرسال رسالتكم بنجاح إلى إدارة الموقع وسنرد عليكم في أقرب وقت.',
  });
});

// Public: Track Ticket Status & Replies by Ticket Number (ELF-2026-XXXX)
apiRouter.get('/tickets/:ticketNumber', (req, res) => {
  const rawTicket = String(req.params.ticketNumber || '').trim().toUpperCase();
  const db = readDb();
  const found = (db.messages || []).find(
    (m) => (m.ticketNumber || '').toUpperCase() === rawTicket && m.folder !== 'trash'
  );

  if (!found) {
    res.status(404).json({ error: 'لم يتم العثور على تذكرة بهذا الرقم، يرجى التأكد من الرقم (مثال: ELF-2026-1000)' });
    return;
  }

  res.json({
    ticket: {
      id: found.id,
      ticketNumber: found.ticketNumber,
      name: found.name,
      serviceRequested: found.serviceRequested,
      subject: found.subject,
      message: found.message,
      status: found.status,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
      replies: found.replies || [],
    },
  });
});

// Public: Visitor follow-up reply on an existing Ticket
apiRouter.post('/tickets/:ticketNumber/reply', (req, res) => {
  const rawTicket = String(req.params.ticketNumber || '').trim().toUpperCase();
  const { message: replyText } = req.body;
  if (!replyText || !String(replyText).trim()) {
    res.status(400).json({ error: 'يرجى كتابة نص الرد' });
    return;
  }

  const db = readDb();
  const found = (db.messages || []).find(
    (m) => (m.ticketNumber || '').toUpperCase() === rawTicket && m.folder !== 'trash'
  );

  if (!found) {
    res.status(404).json({ error: 'التذكرة غير موجودة' });
    return;
  }

  if (!found.replies) found.replies = [];
  const replyItem = {
    id: `reply_vis_${Date.now()}`,
    sender: 'visitor' as const,
    authorName: found.name,
    message: String(replyText).trim(),
    sentAt: new Date().toISOString(),
    channel: 'site' as const,
  };
  found.replies.push(replyItem);
  found.status = 'new';
  found.updatedAt = new Date().toISOString();
  writeDb(db);

  dispatchAdminEmailAlert({
    ticketNumber: found.ticketNumber,
    senderName: found.name,
    senderPhone: found.phone,
    subject: `رد جديد من العميل على التذكرة ${found.ticketNumber}`,
    message: replyItem.message,
  });

  broadcastRealtime('mailbox:new', {
    message: found,
    unreadCount: db.messages.filter((m) => m.status === 'new').length,
  });

  res.json({
    success: true,
    reply: replyItem,
    ticket: {
      id: found.id,
      ticketNumber: found.ticketNumber,
      name: found.name,
      serviceRequested: found.serviceRequested,
      subject: found.subject,
      message: found.message,
      status: found.status,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
      replies: found.replies,
    },
  });
});

// Backward compatibility alias for /api/inbox
apiRouter.post('/inbox', (req, res) => {
  const { name, phone, email, serviceRequested, message, source, attachments } = req.body;
  const db = readDb();
  const clientInfo = detectClientFromRequest(req, req.body);
  const ticketNumber = `ELF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const newMessage: ContactMessage = {
    id: `msg_${Date.now()}`,
    ticketNumber,
    name: String(name || 'عميل').trim(),
    phone: String(phone || '').trim(),
    email: email ? String(email).trim() : undefined,
    serviceRequested: serviceRequested ? String(serviceRequested).trim() : 'خدمات عامة',
    subject: `طلب خدمة عبر الموقع (${serviceRequested || 'عام'})`,
    message: message ? String(message).trim() : '',
    folder: 'inbox',
    status: 'new',
    starred: false,
    country: `${clientInfo.country} ${clientInfo.flag}`,
    attachments: Array.isArray(attachments) ? attachments : [],
    replies: [],
    source: source ? `${source} (${clientInfo.device})` : `نموذج التواصل (${clientInfo.device})`,
    createdAt: new Date().toISOString(),
  };

  db.messages.unshift(newMessage);
  const visitInfo = recordGenuineVisit(
    db,
    req,
    { ...req.body, action: `طلب خدمة: ${newMessage.serviceRequested}` },
    'طلب خدمة عبر الموقع',
    false
  );
  if (db.analytics) {
    db.analytics.trafficPeriods = computeTrafficPeriods(db);
    db.analytics.trafficHistory = db.analytics.trafficPeriods.weekly;
  }
  writeDb(db);

  dispatchAdminEmailAlert({
    ticketNumber: newMessage.ticketNumber,
    senderName: newMessage.name,
    senderPhone: newMessage.phone,
    senderEmail: newMessage.email,
    serviceRequested: newMessage.serviceRequested,
    subject: newMessage.subject || `طلب خدمة ${newMessage.ticketNumber}`,
    message: newMessage.message,
    device: clientInfo.device,
    country: newMessage.country,
  });

  broadcastRealtime('mailbox:new', {
    message: newMessage,
    unreadCount: db.messages.filter((m) => m.status === 'new').length,
  });

  if (db.analytics) {
    broadcastRealtime('analytics:visit', {
      newVisit: visitInfo?.newVisit,
      totalVisits: db.analytics.totalVisits,
      uniqueVisitors: db.analytics.uniqueVisitors,
      activeVisitors: db.analytics.activeVisitors,
      deviceBreakdown: db.analytics.deviceBreakdown,
      recentVisits: db.analytics.recentVisits,
      topCountries: db.analytics.topCountries,
      trafficHistory: db.analytics.trafficHistory,
      trafficPeriods: db.analytics.trafficPeriods,
    });
  }

  res.status(201).json({
    success: true,
    ticketNumber,
    message: 'تم استلام طلبكم بنجاح وسيتواصل معكم فريقنا.',
  });
});

// Admin: Get mailbox / unified requests with rich filtering & counts
const handleGetAdminMailbox = (req: any, res: any) => {
  const { folder, search, serviceTag, followUpStatus, source, assignedTo } = req.query;
  const db = readDb();

  let messages = [...db.messages];

  // Folder filter
  if (folder && folder !== 'all') {
    if (folder === 'starred') {
      messages = messages.filter((m) => m.starred && m.folder !== 'trash');
    } else if (folder === 'sent') {
      messages = messages.filter((m) => m.folder === 'sent' || (m.replies && m.replies.length > 0));
    } else if (folder === 'in_progress') {
      messages = messages.filter((m) => (m.status === 'in_progress' || m.followUpStatus === 'IN_PROGRESS') && m.folder !== 'trash');
    } else if (folder === 'resolved') {
      messages = messages.filter((m) => (m.status === 'resolved' || m.followUpStatus === 'RESOLVED') && m.folder !== 'trash');
    } else if (folder === 'trash') {
      messages = messages.filter((m) => m.folder === 'trash');
    } else {
      // default inbox: exclude trash
      messages = messages.filter((m) => m.folder !== 'trash');
    }
  }

  // Service tag filter
  if (serviceTag && serviceTag !== 'ALL') {
    messages = messages.filter((m) => m.serviceTag === serviceTag);
  }

  // Follow-up status filter
  if (followUpStatus && followUpStatus !== 'ALL') {
    if (followUpStatus === 'FOLLOW_UP_REQUIRED') {
      messages = messages.filter((m) => m.needsFollowUp || m.followUpStatus === 'FOLLOW_UP_REQUIRED');
    } else if (followUpStatus === 'NEW') {
      messages = messages.filter((m) => m.followUpStatus === 'NEW' || m.status === 'new');
    } else {
      messages = messages.filter((m) => m.followUpStatus === followUpStatus);
    }
  }

  // Source filter
  if (source && source !== 'ALL') {
    messages = messages.filter((m) => m.requestSource === source || (m.source && m.source.includes(source)));
  }

  // Assignee filter
  if (assignedTo && assignedTo !== 'ALL') {
    messages = messages.filter((m) => m.assignedTo === assignedTo);
  }

  // Search filter
  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    messages = messages.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.ticketNumber && m.ticketNumber.toLowerCase().includes(q)) ||
        (m.reference && m.reference.toLowerCase().includes(q)) ||
        (m.subject && m.subject.toLowerCase().includes(q)) ||
        m.message.toLowerCase().includes(q) ||
        (m.serviceRequested && m.serviceRequested.toLowerCase().includes(q))
    );
  }

  // Calculate counts per folder and per service/status
  const counts = {
    inbox: db.messages.filter((m) => m.folder !== 'trash' && m.status === 'new').length,
    starred: db.messages.filter((m) => m.starred && m.folder !== 'trash').length,
    sent: db.messages.filter((m) => m.replies && m.replies.length > 0 && m.folder !== 'trash').length,
    in_progress: db.messages.filter((m) => (m.status === 'in_progress' || m.followUpStatus === 'IN_PROGRESS') && m.folder !== 'trash').length,
    resolved: db.messages.filter((m) => (m.status === 'resolved' || m.followUpStatus === 'RESOLVED') && m.folder !== 'trash').length,
    trash: db.messages.filter((m) => m.folder === 'trash').length,
    total: db.messages.length,
    newCount: db.messages.filter((m) => m.folder !== 'trash' && (m.status === 'new' || m.followUpStatus === 'NEW')).length,
    followUpCount: db.messages.filter((m) => m.folder !== 'trash' && (m.needsFollowUp || m.followUpStatus === 'FOLLOW_UP_REQUIRED')).length,
    byService: {
      ALL: db.messages.filter((m) => m.folder !== 'trash').length,
      FLIGHT: db.messages.filter((m) => m.folder !== 'trash' && m.serviceTag === 'FLIGHT').length,
      HOTEL: db.messages.filter((m) => m.folder !== 'trash' && m.serviceTag === 'HOTEL').length,
      TRANSFER: db.messages.filter((m) => m.folder !== 'trash' && m.serviceTag === 'TRANSFER').length,
      CONSULAR: db.messages.filter((m) => m.folder !== 'trash' && m.serviceTag === 'CONSULAR').length,
      GENERAL: db.messages.filter((m) => m.folder !== 'trash' && (m.serviceTag === 'GENERAL' || !m.serviceTag)).length,
      OFFLINE_CHAT: db.messages.filter((m) => m.folder !== 'trash' && m.serviceTag === 'OFFLINE_CHAT').length,
    },
    byStatus: {
      ALL: db.messages.filter((m) => m.folder !== 'trash').length,
      NEW: db.messages.filter((m) => m.folder !== 'trash' && (m.followUpStatus === 'NEW' || m.status === 'new')).length,
      FOLLOW_UP_REQUIRED: db.messages.filter((m) => m.folder !== 'trash' && (m.needsFollowUp || m.followUpStatus === 'FOLLOW_UP_REQUIRED')).length,
      IN_PROGRESS: db.messages.filter((m) => m.folder !== 'trash' && (m.followUpStatus === 'IN_PROGRESS' || m.status === 'in_progress')).length,
      WAITING_CUSTOMER: db.messages.filter((m) => m.folder !== 'trash' && m.followUpStatus === 'WAITING_CUSTOMER').length,
      RESOLVED: db.messages.filter((m) => m.folder !== 'trash' && (m.followUpStatus === 'RESOLVED' || m.status === 'resolved')).length,
      CLOSED: db.messages.filter((m) => m.folder !== 'trash' && m.followUpStatus === 'CLOSED').length,
    },
  };

  res.json({ messages, counts });
};

apiRouter.get('/admin/mailbox', requireAuth, handleGetAdminMailbox);
apiRouter.get('/admin/requests', requireAuth, handleGetAdminMailbox);

// Admin: Update mailbox / request item (star, folder, status, followUpStatus, assignedTo, internal notes)
const handlePatchAdminMailbox = (req: any, res: any) => {
  const { id } = req.params;
  const { starred, folder, status, followUpStatus, needsFollowUp, assignedTo, note } = req.body;
  const db = readDb();
  const message = db.messages.find((m) => m.id === id);

  if (!message) {
    res.status(404).json({ error: 'الرسالة غير موجودة' });
    return;
  }

  const currentUser = getBearerUser(req);
  const actorName = currentUser?.displayName || 'مسؤول النظام (Admin)';

  if (typeof starred === 'boolean') message.starred = starred;
  if (folder) message.folder = folder;
  
  // NOTE: Marking read must not clear FOLLOW_UP_REQUIRED
  if (status) {
    message.status = status;
  }

  if (followUpStatus) {
    const oldStatus = message.followUpStatus;
    message.followUpStatus = followUpStatus;
    if (followUpStatus === 'RESOLVED' || followUpStatus === 'CLOSED') {
      message.needsFollowUp = false;
    } else if (followUpStatus === 'FOLLOW_UP_REQUIRED') {
      message.needsFollowUp = true;
    }
    if (!message.activityTimeline) message.activityTimeline = [];
    message.activityTimeline.unshift({
      id: randomUUID(),
      action: `تعديل حالة المتابعة: ${followUpStatus}`,
      actor: actorName,
      details: oldStatus ? `الحالة السابقة: ${oldStatus}` : undefined,
      createdAt: new Date().toISOString(),
    });
  }

  if (typeof needsFollowUp === 'boolean') {
    message.needsFollowUp = needsFollowUp;
  }

  if (assignedTo !== undefined) {
    message.assignedTo = assignedTo;
    if (!message.activityTimeline) message.activityTimeline = [];
    message.activityTimeline.unshift({
      id: randomUUID(),
      action: `إسناد المعاملة إلى: ${assignedTo || 'غير محدد'}`,
      actor: actorName,
      createdAt: new Date().toISOString(),
    });
  }

  if (note && typeof note === 'string' && note.trim()) {
    if (!message.internalNotes) message.internalNotes = [];
    message.internalNotes.unshift({
      id: randomUUID(),
      author: actorName,
      text: note.trim(),
      createdAt: new Date().toISOString(),
    });
    if (!message.activityTimeline) message.activityTimeline = [];
    message.activityTimeline.unshift({
      id: randomUUID(),
      action: 'إضافة ملاحظة داخلية للمتابعة',
      actor: actorName,
      details: note.trim().slice(0, 80),
      createdAt: new Date().toISOString(),
    });
  }

  message.updatedAt = new Date().toISOString();

  writeDb(db);
  broadcastRealtime('mailbox:updated', { message });
  res.json({ success: true, message });
};

apiRouter.patch('/admin/mailbox/:id', requireAuth, handlePatchAdminMailbox);
apiRouter.patch('/admin/requests/:id', requireAuth, handlePatchAdminMailbox);

// Admin: Add reply to message thread
apiRouter.post('/admin/mailbox/:id/reply', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { message: replyText, channel } = req.body;

  if (typeof replyText !== 'string' || !replyText.trim()) {
    res.status(400).json({ error: 'يرجى كتابة نص الرد' });
    return;
  }

  const db = readDb();
  const message = db.messages.find((m) => m.id === id);

  if (!message) {
    res.status(404).json({ error: 'الرسالة غير موجودة' });
    return;
  }

  if (channel === 'email') {
    if (!isEmailAddress(message.email)) {
      res.status(400).json({ error: 'عنوان بريد المرسل غير متاح أو غير صالح.' });
      return;
    }
    const status = await sendEmail({
      to: message.email,
      subject: `رد على تذكرة ${message.ticketNumber} — ELFAZNI SERVICES`,
      text: replyText.trim(),
      replyTo: isEmailAddress(db.settings.email) ? db.settings.email : undefined,
    });
    if (status !== 'accepted') {
      res.status(503).json({ error: status === 'not_configured'
        ? 'إرسال البريد غير مهيأ على الخادم. يمكنك حفظ الرد في التذكرة.'
        : 'تعذّر إرسال البريد. يرجى المحاولة مجددًا.' });
      return;
    }
  }

  if (!message.replies) message.replies = [];

  const replyItem = {
    id: randomUUID(),
    sender: 'admin' as const,
    authorName: 'رشيد الفزني (Rachid ELFAZNI)',
    message: replyText.trim(),
    sentAt: new Date().toISOString(),
    channel: (channel || 'site') as 'site' | 'email' | 'whatsapp',
  };

  message.replies.push(replyItem);
  message.status = 'resolved';
  message.updatedAt = new Date().toISOString();

  writeDb(db);
  broadcastRealtime('mailbox:updated', { message });
  res.json({ success: true, message, reply: replyItem });
});

// Admin: Delete or permanently remove message
apiRouter.delete('/admin/mailbox/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { permanent } = req.query;
  const db = readDb();

  const msgIndex = db.messages.findIndex((m) => m.id === id);
  if (msgIndex === -1) {
    res.status(404).json({ error: 'الرسالة غير موجودة' });
    return;
  }

  if (permanent === 'true' || db.messages[msgIndex].folder === 'trash') {
    db.messages.splice(msgIndex, 1);
  } else {
    db.messages[msgIndex].folder = 'trash';
  }

  writeDb(db);
  res.json({ success: true, message: 'تم التحديث بنجاح' });
});

// ==========================================
// 8. REAL-TIME LIVE CHAT SYSTEM
// ==========================================

// Get Admin Online/Offline status
apiRouter.get('/chat/status', (_req, res) => {
  const db = readDb();
  const chatStatus = db.chatStatus || { adminOnline: true, lastActive: new Date().toISOString() };
  res.json({ chatStatus });
});

// Admin toggle Online/Offline
apiRouter.post('/admin/chat/status', requireAuth, (req, res) => {
  const { adminOnline } = req.body;
  const db = readDb();
  db.chatStatus = {
    adminOnline: typeof adminOnline === 'boolean' ? adminOnline : true,
    lastActive: new Date().toISOString(),
    updatedBy: 'رشيد الفزني (Rachid ELFAZNI)',
  };
  writeDb(db);
  broadcastRealtime('chat:status', db.chatStatus);
  res.json({ success: true, chatStatus: db.chatStatus });
});

// List only the visitor's sessions, or all sessions for a signed-in administrator.
apiRouter.get('/chat/sessions', (req, res) => {
  const { visitorId } = req.query;
  if (!visitorId && !hasAccess(getBearerUser(req), 'support')) {
    res.status(401).json({ error: 'يرجى تسجيل الدخول' });
    return;
  }
  const sessions = readDb().chatSessions || [];
  res.json({ sessions: visitorId ? sessions.filter((s) => s.visitorId === visitorId) : sessions });
});

// Visitor / Admin creates or joins a chat session
apiRouter.post('/chat/sessions', (req, res) => {
  const { visitorId, visitorName, visitorPhone, visitorEmail, visitorCountry, currentPage } = req.body;
  if (typeof visitorId !== 'string' || !visitorId) {
    res.status(400).json({ error: 'معرف الزائر مطلوب' });
    return;
  }
  const db = readDb();
  const clientInfo = detectClientFromRequest(req, req.body);
  if (!db.chatSessions) db.chatSessions = [];

  let session = db.chatSessions.find((s) => s.visitorId === visitorId && s.status === 'active');

  if (!session) {
    const defaultVisitorLabel =
      !visitorName || visitorName === 'زائر الموقع' || visitorName === 'الزائر'
        ? `زائر (${clientInfo.device})`
        : visitorName;

    session = {
      id: randomUUID(),
      visitorId: visitorId || `vis_${Date.now()}`,
      visitorName: defaultVisitorLabel,
      visitorPhone,
      visitorEmail,
      visitorCountry: visitorCountry || `${clientInfo.country} ${clientInfo.flag}`,
      currentPage: currentPage || 'الرئيسية',
      unreadAdmin: 0,
      unreadVisitor: 0,
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      status: 'active',
    };
    db.chatSessions.unshift(session);

    // Ensure visitor is registered in analytics
    recordGenuineVisit(db, req, { ...req.body, visitorId: session.visitorId, action: 'فتح نافذة المحادثة الفورية' }, 'بدء محادثة فورية', true);
    if (db.analytics) {
      db.analytics.trafficPeriods = computeTrafficPeriods(db);
      db.analytics.trafficHistory = db.analytics.trafficPeriods.weekly;
    }

    writeDb(db);
    broadcastRealtime('chat:session', { session });
  }

  res.status(201).json({ session });
});

// Get messages for a chat session
apiRouter.get('/chat/messages/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const db = readDb();
  const session = db.chatSessions?.find((item) => item.id === sessionId);
  if (!session || (!hasAccess(getBearerUser(req), 'support') && session.visitorId !== req.get('X-Visitor-Id'))) {
    res.status(404).json({ error: 'المحادثة غير متاحة' });
    return;
  }
  const allMessages = db.chatMessages || [];
  const messages = allMessages.filter((m) => m.sessionId === sessionId);
  res.json({ messages });
});

// Send message in chat (Real-time broadcasted)
apiRouter.post('/chat/messages', (req, res) => {
  const { sessionId, sender, senderName, text, attachmentUrl, visitorId, visitorPhone, visitorCountry } = req.body;
  if (sender === 'admin' ? !hasAccess(getBearerUser(req), 'support') : sender !== 'visitor' || typeof visitorId !== 'string' || !visitorId) {
    res.status(403).json({ error: 'لا تملك صلاحية إرسال الرسالة' });
    return;
  }
  if (!(typeof text === 'string' && text.trim()) && !attachmentUrl) {
    res.status(400).json({ error: 'يرجى كتابة نص الرسالة أو إرفاق ملف' });
    return;
  }

  const db = readDb();
  const clientInfo = detectClientFromRequest(req, req.body);
  if (!db.chatMessages) db.chatMessages = [];
  if (!db.chatSessions) db.chatSessions = [];

  const requestedSession = sessionId ? db.chatSessions.find((s) => s.id === sessionId) : undefined;
  if (requestedSession && sender === 'visitor' && requestedSession.visitorId !== visitorId) {
    res.status(403).json({ error: 'لا تملك صلاحية استخدام هذه المحادثة' });
    return;
  }
  let session = requestedSession?.status === 'active' ? requestedSession : undefined;
  if (!session && sender === 'visitor') {
    session = db.chatSessions.find((s) => s.visitorId === visitorId && s.status === 'active');
  }
  if (!session && sender === 'admin') {
    res.status(404).json({ error: 'المحادثة غير متاحة' });
    return;
  }
  const finalSessionId = session?.id || randomUUID();
  const effectiveSenderName =
    sender === 'admin'
      ? senderName || 'رشيد الفزني'
      : !senderName || senderName === 'الزائر' || senderName === 'زائر الموقع'
      ? `زائر (${clientInfo.device})`
      : senderName;

  // Auto-create session if it didn't exist (e.g. direct message from iPhone/Mobile)
  if (!session) {
    session = {
      id: finalSessionId,
      visitorId,
      visitorName: effectiveSenderName,
      visitorPhone: visitorPhone || '',
      visitorCountry: visitorCountry || `${clientInfo.country} ${clientInfo.flag}`,
      currentPage: req.body.currentPage || 'الرئيسية',
      unreadAdmin: sender === 'visitor' ? 1 : 0,
      unreadVisitor: sender === 'admin' ? 1 : 0,
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      status: 'active',
    };
    db.chatSessions.unshift(session);
    broadcastRealtime('chat:session', { session });
  } else {
    session.lastMessageAt = new Date().toISOString();
    if (sender === 'visitor' && visitorPhone && !session.visitorPhone) {
      session.visitorPhone = visitorPhone;
    }
    if (
      sender === 'visitor' &&
      senderName &&
      senderName !== 'الزائر' &&
      senderName !== 'زائر الموقع'
    ) {
      session.visitorName = senderName;
    }
    if (sender === 'admin') {
      session.unreadVisitor = (session.unreadVisitor || 0) + 1;
    } else {
      session.unreadAdmin = (session.unreadAdmin || 0) + 1;
    }
  }

  const newMsg: ChatMessage = {
    id: randomUUID(),
    sessionId: session.id,
    sender: sender === 'admin' ? 'admin' : 'visitor',
    senderName: effectiveSenderName,
    text: text ? String(text).trim() : '',
    attachmentUrl,
    createdAt: new Date().toISOString(),
  };

  db.chatMessages.push(newMsg);

  // If visitor sent message, also ensure visitor is tracked in analytics & traffic curve
  let visitResult = null;
  if (sender !== 'admin') {
    visitResult = recordGenuineVisit(
      db,
      req,
      {
        ...req.body,
        visitorId: session.visitorId,
        action: 'إرسال رسالة في المحادثة الفورية',
      },
      'إرسال رسالة في المحادثة الفورية',
      true
    );
  }
  if (db.analytics) {
    db.analytics.trafficPeriods = computeTrafficPeriods(db);
    db.analytics.trafficHistory = db.analytics.trafficPeriods.weekly;
  }

  writeDb(db);

  if (sender !== 'admin') {
    dispatchAdminEmailAlert({
      senderName: effectiveSenderName,
      senderPhone: session.visitorPhone || 'محادثة فورية',
      subject: `رسالة محادثة فورية من ${effectiveSenderName}`,
      message: newMsg.text || 'مرفق مصور',
      device: clientInfo.device,
      country: session.visitorCountry,
    });
  }

  // Broadcast instantly to all connected clients (desktop admin, mobile, other tabs)
  broadcastRealtime('chat:message', {
    sessionId: session.id,
    visitorId: session.visitorId,
    message: newMsg,
    session,
  });

  if (db.analytics && sender !== 'admin') {
    broadcastRealtime('analytics:visit', {
      newVisit: visitResult?.newVisit,
      totalVisits: db.analytics.totalVisits,
      uniqueVisitors: db.analytics.uniqueVisitors,
      activeVisitors: db.analytics.activeVisitors,
      deviceBreakdown: db.analytics.deviceBreakdown,
      recentVisits: db.analytics.recentVisits,
      topCountries: db.analytics.topCountries,
      trafficHistory: db.analytics.trafficHistory,
      trafficPeriods: db.analytics.trafficPeriods,
    });
  }

  res.status(201).json({ success: true, message: newMsg, session });
});

// Typing indicator endpoint
apiRouter.post('/chat/typing', (req, res) => {
  const { sessionId, sender, visitorId } = req.body;
  const session = readDb().chatSessions?.find((item) => item.id === sessionId);
  if (!session || (sender === 'admin' ? !hasAccess(getBearerUser(req), 'support') : session.visitorId !== visitorId)) {
    res.status(403).json({ error: 'المحادثة غير متاحة' });
    return;
  }
  broadcastRealtime('chat:typing', { sessionId, sender, visitorId: session.visitorId });
  res.json({ ok: true });
});

// Mark session messages as read
apiRouter.post('/chat/messages/:sessionId/read', (req, res) => {
  const { sessionId } = req.params;
  const { reader } = req.body; // 'admin' or 'visitor'
  const db = readDb();
  const session = (db.chatSessions || []).find((s) => s.id === sessionId);
  if (!session || (reader === 'admin' ? !hasAccess(getBearerUser(req), 'support') : session.visitorId !== req.body.visitorId)) {
    res.status(403).json({ error: 'المحادثة غير متاحة' });
    return;
  }
  if (session) {
    if (reader === 'admin') session.unreadAdmin = 0;
    else session.unreadVisitor = 0;
    writeDb(db);
    broadcastRealtime('chat:read', { sessionId, reader });
  }
  res.json({ success: true });
});

// Admin: Delete a chat session and its messages
apiRouter.delete('/admin/chat/sessions/:sessionId', requireAuth, (req, res) => {
  const { sessionId } = req.params;
  const db = readDb();
  const visitorId = db.chatSessions?.find((s) => s.id === sessionId)?.visitorId;
  db.chatSessions = (db.chatSessions || []).filter((s) => s.id !== sessionId);
  db.chatMessages = (db.chatMessages || []).filter((m) => m.sessionId !== sessionId);
  writeDb(db);
  broadcastRealtime('chat:session_deleted', { sessionId, visitorId });
  res.json({ success: true, message: 'تم حذف جلسة المحادثة بنجاح' });
});

// ==========================================
// 9. ADMINLTE 4 ANALYTICS & VISITOR METRICS
// ==========================================

apiRouter.get('/analytics', requireAuth, (_req, res) => {
  const db = readDb();
  if (!db.analytics) {
    db.analytics = {
      totalVisits: 0,
      uniqueVisitors: 0,
      activeVisitors: 0,
      topCountries: [],
      recentVisits: [],
      trafficHistory: [],
      deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
      todoList: [],
      activeSessions: {},
      uniqueVisitorIds: [],
    };
  }

  // Calculate live active visitors (last 3 minutes)
  const now = Date.now();
  if (!db.analytics.activeSessions) db.analytics.activeSessions = {};
  for (const [id, ts] of Object.entries(db.analytics.activeSessions)) {
    if (now - Number(ts) > 180000) {
      delete db.analytics.activeSessions[id];
    }
  }
  db.analytics.activeVisitors = Object.keys(db.analytics.activeSessions).length;
  db.analytics.uniqueVisitors = (db.analytics.uniqueVisitorIds || []).length;
  db.analytics.trafficPeriods = computeTrafficPeriods(db);
  db.analytics.trafficHistory = db.analytics.trafficPeriods.weekly;

  const totalMessages = db.messages.length;
  const totalChats = (db.chatSessions || []).length;
  const unreadMessages = db.messages.filter((m) => m.status === 'new').length;

  res.json({
    analytics: db.analytics,
    kpis: {
      totalVisits: db.analytics.totalVisits || 0,
      totalLeads: totalMessages + totalChats,
      uniqueVisitors: db.analytics.uniqueVisitors || 0,
      activeVisitors: db.analytics.activeVisitors || 0,
      unreadMessages,
    },
  });
});

// Admin: Get genuine visitor analytics & engagement rate per blog post
apiRouter.get('/admin/analytics/blog-posts', requireAuth, (_req, res) => {
  const db = readDb();
  const posts = db.posts || [];

  const postsAnalytics = posts.map((post) => {
    const views = Number(post.views) || 0;
    const readMin = parseInt(String(post.readTime)) || 4;
    const consultRequests = Number(post.consultClicks) || 0;
    const shares = Number(post.sharesCount) || 0;
    const engagedReads = Number(post.engagedReads) || 0;

    // Real engagement rate = actual interactions (reads past 30s + shares + consult clicks) / views
    const totalInteractions = engagedReads + consultRequests + shares;
    const engagementRate = views > 0 ? parseFloat(Math.min(100, (totalInteractions / views) * 100).toFixed(1)) : 0;
    const avgDuration = views > 0 ? (engagedReads > 0 ? `${readMin} دقائق` : `${Math.max(1, Math.round(readMin * 0.6))} دقائق`) : '0 دقيقة';

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      category: post.category,
      coverImage: post.coverImage,
      status: post.status,
      readTime: post.readTime,
      publishedAt: post.publishedAt || post.createdAt,
      views,
      engagementRate,
      avgDuration,
      consultRequests,
      shares,
    };
  });

  const totalViews = postsAnalytics.reduce((sum, p) => sum + p.views, 0);
  const avgEngagementRate = postsAnalytics.length > 0
    ? parseFloat((postsAnalytics.reduce((sum, p) => sum + p.engagementRate, 0) / postsAnalytics.length).toFixed(1))
    : 0;
  const avgViewsPerPost = postsAnalytics.length > 0 ? Math.round(totalViews / postsAnalytics.length) : 0;
  const topPost = postsAnalytics.filter(p => p.views > 0).sort((a, b) => b.views - a.views)[0] || null;

  res.json({
    posts: postsAnalytics,
    summary: {
      totalPosts: postsAnalytics.length,
      totalViews,
      avgViewsPerPost,
      avgEngagementRate,
      topPost,
    },
  });
});

// Public: Track genuine visitor hit
apiRouter.post('/analytics/visit', (req, res) => {
  const db = readDb();
  const result = recordGenuineVisit(db, req, req.body, 'زيارة وتصفح', false);

  if (!result) {
    res.json({
      success: true,
      ignoredAdmin: true,
      totalVisits: db.analytics?.totalVisits || 0,
      uniqueVisitors: db.analytics?.uniqueVisitors || 0,
      activeVisitors: db.analytics?.activeVisitors || 0,
    });
    return;
  }

  writeDb(db);
  const liveActiveCount = Object.keys(db.analytics?.activeSessions || {}).length;

  // Broadcast instantly to all admin tabs/screens
  broadcastRealtime('analytics:visit', {
    newVisit: result.newVisit,
    totalVisits: db.analytics!.totalVisits,
    uniqueVisitors: db.analytics!.uniqueVisitors,
    activeVisitors: liveActiveCount,
    deviceBreakdown: db.analytics!.deviceBreakdown,
    recentVisits: db.analytics!.recentVisits,
    topCountries: db.analytics!.topCountries,
    trafficHistory: db.analytics!.trafficHistory,
    trafficPeriods: db.analytics!.trafficPeriods,
  });

  res.json({
    success: true,
    totalVisits: db.analytics!.totalVisits,
    uniqueVisitors: db.analytics!.uniqueVisitors,
    activeVisitors: liveActiveCount,
    newVisit: result.newVisit,
  });
});

// Public: Heartbeat to keep active visitors count accurate (and auto-register open phone tabs!)
apiRouter.post('/analytics/heartbeat', (req, res) => {
  const { visitorId, page } = req.body;
  const db = readDb();
  if (!db.analytics) {
    res.json({ ok: true, activeVisitors: 0 });
    return;
  }
  if (!db.analytics.activeSessions) db.analytics.activeSessions = {};
  if (!db.analytics.uniqueVisitorIds) db.analytics.uniqueVisitorIds = [];

  const isAdminPage = String(page || '').startsWith('/admin');
  const vid = visitorId || `vis_guest_${Date.now()}`;

  if (!isAdminPage) {
    db.analytics.activeSessions[vid] = Date.now();
  }

  // If this non-admin visitor (e.g. an iPhone tab woken from sleep or after analytics reset) is not in uniqueVisitorIds yet, auto-register the visit!
  if (!isAdminPage && !db.analytics.uniqueVisitorIds.includes(vid)) {
    const result = recordGenuineVisit(
      db,
      req,
      { ...req.body, visitorId: vid, action: 'متصل الآن (تحديث حي)' },
      'زيارة وتصفح نشط',
      false
    );
    writeDb(db);
    if (result) {
      broadcastRealtime('analytics:visit', {
        newVisit: result.newVisit,
        totalVisits: db.analytics.totalVisits,
        uniqueVisitors: db.analytics.uniqueVisitors,
        activeVisitors: db.analytics.activeVisitors,
        deviceBreakdown: db.analytics.deviceBreakdown,
        recentVisits: db.analytics.recentVisits,
        topCountries: db.analytics.topCountries,
        trafficHistory: db.analytics.trafficHistory,
        trafficPeriods: db.analytics.trafficPeriods,
      });
    }
    res.json({
      activeVisitors: db.analytics.activeVisitors,
      totalVisits: db.analytics.totalVisits,
    });
    return;
  }

  const now = Date.now();
  for (const [id, ts] of Object.entries(db.analytics.activeSessions)) {
    if (now - Number(ts) > 180000) {
      delete db.analytics.activeSessions[id];
    }
  }
  db.analytics.activeVisitors = Object.keys(db.analytics.activeSessions).length;
  writeDb(db);

  broadcastRealtime('analytics:heartbeat', {
    activeVisitors: db.analytics.activeVisitors,
    totalVisits: db.analytics.totalVisits,
  });

  res.json({
    activeVisitors: db.analytics.activeVisitors,
    totalVisits: db.analytics.totalVisits,
  });
});

// Public: Mobile Beacon Endpoint (navigator.sendBeacon on pagehide, visibilitychange, unload)
apiRouter.post('/analytics/beacon', (req, res) => {
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {};
  const { visitorId, page, durationSec, eventType, action } = body;
  const db = readDb();

  if (!db.analytics) {
    res.status(204).end();
    return;
  }

  const isAdminPage = String(page || '').startsWith('/admin');
  if (isAdminPage) {
    res.status(204).end();
    return;
  }

  const vid = visitorId || `vis_beacon_${Date.now()}`;
  const dur = Math.max(0, Math.round(Number(durationSec) || 0));
  const clientInfo = detectClientFromRequest(req, body);

  if (!db.analytics.uniqueVisitorIds) db.analytics.uniqueVisitorIds = [];
  if (!db.analytics.activeSessions) db.analytics.activeSessions = {};

  // If this mobile visitor wasn't recorded yet, record full visit now!
  if (!db.analytics.uniqueVisitorIds.includes(vid)) {
    const result = recordGenuineVisit(
      db,
      req,
      {
        ...body,
        visitorId: vid,
        durationSec: dur,
        action: action || (dur > 0 ? `زيارة من الهاتف (مدة التصفح: ${dur} ثانية)` : 'زيارة من الهاتف (SendBeacon)'),
      },
      'زيارة من الهاتف',
      false
    );
    writeDb(db);
    if (result) {
      broadcastRealtime('analytics:visit', {
        newVisit: result.newVisit,
        totalVisits: db.analytics.totalVisits,
        uniqueVisitors: db.analytics.uniqueVisitors,
        activeVisitors: db.analytics.activeVisitors,
        deviceBreakdown: db.analytics.deviceBreakdown,
        recentVisits: db.analytics.recentVisits,
        topCountries: db.analytics.topCountries,
        trafficHistory: db.analytics.trafficHistory,
        trafficPeriods: db.analytics.trafficPeriods,
      });
    }
    res.status(204).end();
    return;
  }

  // Update active session or remove if pagehide/unload
  if (eventType === 'pagehide' || eventType === 'unload') {
    delete db.analytics.activeSessions[vid];
  } else {
    db.analytics.activeSessions[vid] = Date.now();
  }

  const now = Date.now();
  for (const [id, ts] of Object.entries(db.analytics.activeSessions)) {
    if (now - Number(ts) > 180000) {
      delete db.analytics.activeSessions[id];
    }
  }
  db.analytics.activeVisitors = Object.keys(db.analytics.activeSessions).length;

  // Update the latest visit entry with final duration if available
  if (dur > 0 && db.analytics.recentVisits && db.analytics.recentVisits.length > 0) {
    const latestEntry = db.analytics.recentVisits.find(
      (v) => v.device === clientInfo.device || v.country === clientInfo.country
    );
    if (latestEntry) {
      latestEntry.durationSec = dur;
      const baseAction = latestEntry.action.replace(/\s*\(\d+\s*ثانية\)/g, '').replace(/\s*·\s*مدة التصفح:.*$/g, '');
      latestEntry.action = `${baseAction} · مدة التصفح: ${dur} ثانية`;
    }
  }

  writeDb(db);
  recordSystemLog(
    'info',
    'SendBeacon',
    `نبضة إغلاق/تبديل من ${clientInfo.device} (${clientInfo.city}) - مدة الجلسة: ${dur} ثانية`
  );

  broadcastRealtime('analytics:visit', {
    totalVisits: db.analytics.totalVisits,
    uniqueVisitors: db.analytics.uniqueVisitors,
    activeVisitors: db.analytics.activeVisitors,
    deviceBreakdown: db.analytics.deviceBreakdown,
    recentVisits: db.analytics.recentVisits,
    topCountries: db.analytics.topCountries,
    trafficHistory: db.analytics.trafficHistory,
    trafficPeriods: db.analytics.trafficPeriods,
  });

  res.status(204).end();
});

// Public: Track blog post interaction (engaged reading, share, or consult click)
apiRouter.post('/analytics/post-action', (req, res) => {
  const { slug, type } = req.body;
  if (!slug || !type) {
    res.status(400).json({ error: 'Missing parameters' });
    return;
  }

  const db = readDb();
  const post = (db.posts || []).find((p) => p.slug === slug || p.id === slug);
  if (post) {
    if (type === 'engaged_read') post.engagedReads = (post.engagedReads || 0) + 1;
    else if (type === 'share') post.sharesCount = (post.sharesCount || 0) + 1;
    else if (type === 'consult_click') post.consultClicks = (post.consultClicks || 0) + 1;
    writeDb(db);
    broadcastRealtime('analytics:post', { slug, type });
  }
  res.json({ success: true });
});

// Admin: Reset all analytics and post views to ZERO
apiRouter.post('/admin/analytics/reset', requireAuth, (_req, res) => {
  const db = readDb();
  db.analytics = {
    totalVisits: 0,
    uniqueVisitors: 0,
    activeVisitors: 0,
    topCountries: [],
    recentVisits: [],
    visitTimestamps: [],
    trafficHistory: [
      { label: 'السبت', visits: 0, chats: 0, messages: 0 },
      { label: 'الأحد', visits: 0, chats: 0, messages: 0 },
      { label: 'الإثنين', visits: 0, chats: 0, messages: 0 },
      { label: 'الثلاثاء', visits: 0, chats: 0, messages: 0 },
      { label: 'الأربعاء', visits: 0, chats: 0, messages: 0 },
      { label: 'الخميس', visits: 0, chats: 0, messages: 0 },
      { label: 'الجمعة', visits: 0, chats: 0, messages: 0 },
    ],
    deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
    todoList: db.analytics?.todoList || [],
    activeSessions: {},
    uniqueVisitorIds: [],
  };
  db.analytics.trafficPeriods = computeTrafficPeriods(db);

  if (db.posts) {
    db.posts.forEach((p) => {
      p.views = 0;
      p.engagedReads = 0;
      p.sharesCount = 0;
      p.consultClicks = 0;
    });
  }
  writeDb(db);

  broadcastRealtime('analytics:reset', {
    totalVisits: 0,
    uniqueVisitors: 0,
    activeVisitors: 0,
  });

  res.json({ success: true, message: 'تم تصفير جميع الإحصائيات والمشاهدات إلى الصفر بنجاح' });
});

// Admin: To-Do list actions
apiRouter.patch('/admin/analytics/todos/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { done, text, priority, dueDate, kind, time } = req.body;
  const db = readDb();
  if (!db.analytics || !db.analytics.todoList) return res.status(404).json({ error: 'No todos' });

  const todo = db.analytics.todoList.find((t) => t.id === id);
  if (todo) {
    if (typeof done === 'boolean') todo.done = done;
    if (text) todo.text = text;
    if (priority) todo.priority = priority;
    if (dueDate) todo.dueDate = dueDate;
    if (kind === 'task' || kind === 'reminder') todo.kind = kind;
    if (typeof time === 'string') todo.time = time;
  }
  writeDb(db);
  res.json({ success: true, todoList: db.analytics.todoList });
});

apiRouter.post('/admin/analytics/todos', requireAuth, (req, res) => {
  const { text, priority, dueDate, kind, time } = req.body;
  const db = readDb();
  if (!db.analytics) return res.status(400).json({ error: 'Analytics not ready' });
  if (!db.analytics.todoList) db.analytics.todoList = [];

  const newTodo: TodoItem = {
    id: `todo_${Date.now()}`,
    text: String(text).trim(),
    done: false,
    priority: priority || 'medium',
    dueDate: dueDate || 'اليوم',
    kind: kind === 'reminder' ? 'reminder' : 'task',
    ...(typeof time === 'string' && time ? { time } : {}),
  };

  db.analytics.todoList.unshift(newTodo);
  writeDb(db);
  res.status(201).json({ success: true, todoList: db.analytics.todoList });
});

apiRouter.delete('/admin/analytics/todos/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (db.analytics && db.analytics.todoList) {
    db.analytics.todoList = db.analytics.todoList.filter((t) => t.id !== id);
    writeDb(db);
  }
  res.json({ success: true, todoList: db.analytics?.todoList || [] });
});

// ==========================================
// 10. BACKUP EXPORT & IMPORT
// ==========================================

apiRouter.get('/admin/backup/export', requireAuth, (_req, res) => {
  const db = readDb();
  res.setHeader('Content-Disposition', `attachment; filename=ELFAZNI_SERVICES_BACKUP_${Date.now()}.json`);
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(db, null, 2));
});

apiRouter.post('/admin/backup/import', requireAuth, (req, res) => {
  const importedData = req.body;
  if (!importedData || !Array.isArray(importedData.posts) || !Array.isArray(importedData.services)) {
    res.status(400).json({ error: 'ملف النسخة الاحتياطية غير صالح' });
    return;
  }

  writeDb(importedData);
  res.json({ success: true, message: 'تم استرجاع النسخة الاحتياطية بنجاح' });
});

// Admin stats overview compatibility
apiRouter.get('/admin/stats', requireAuth, (_req, res) => {
  const db = readDb();
  res.json({
    stats: {
      totalPosts: db.posts.length,
      publishedPosts: db.posts.filter((p) => p.status === 'published').length,
      draftPosts: db.posts.filter((p) => p.status === 'draft').length,
      totalViews: db.posts.reduce((acc, p) => acc + (p.views || 0), 0),
      totalCategories: db.categories.length,
      totalMedia: db.media.length,
      totalMessages: db.messages.length,
      newMessages: db.messages.filter((m) => m.status === 'new').length,
    },
    recentPosts: db.posts.slice(0, 5),
    recentMessages: db.messages.slice(0, 5),
  });
});

// ==========================================
// 11. SEO & META MANAGEMENT MODULE
// ==========================================

apiRouter.get('/seo', (_req, res) => {
  const db = readDb();
  if (!db.seoPages || db.seoPages.length === 0) {
    db.seoPages = getDefaultSeoPages();
    writeDb(db);
  }
  res.json({ seoPages: db.seoPages });
});

apiRouter.put('/admin/seo/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (!db.seoPages) db.seoPages = getDefaultSeoPages();

  const index = db.seoPages.findIndex((item) => item.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'صفحة السيو غير موجودة' });
    return;
  }

  const current = db.seoPages[index];
  const {
    pagePath,
    pageNameAr,
    metaTitle,
    metaDescription,
    metaKeywords,
    ogTitle,
    ogDescription,
    ogImage,
    canonicalUrl,
    robots,
  } = req.body;

  db.seoPages[index] = {
    ...current,
    pagePath: pagePath !== undefined ? String(pagePath).trim() : current.pagePath,
    pageNameAr: pageNameAr !== undefined ? String(pageNameAr).trim() : current.pageNameAr,
    metaTitle: metaTitle !== undefined ? String(metaTitle).trim() : current.metaTitle,
    metaDescription: metaDescription !== undefined ? String(metaDescription).trim() : current.metaDescription,
    metaKeywords: metaKeywords !== undefined ? String(metaKeywords).trim() : current.metaKeywords,
    ogTitle: ogTitle !== undefined ? String(ogTitle).trim() : current.ogTitle,
    ogDescription: ogDescription !== undefined ? String(ogDescription).trim() : current.ogDescription,
    ogImage: ogImage !== undefined ? String(ogImage).trim() : current.ogImage,
    canonicalUrl: canonicalUrl !== undefined ? String(canonicalUrl).trim() : current.canonicalUrl,
    robots: robots !== undefined ? String(robots).trim() : current.robots,
    updatedAt: new Date().toISOString(),
  };

  writeDb(db);
  broadcastRealtime('seo:updated', { seoPages: db.seoPages });

  res.json({ success: true, seoPage: db.seoPages[index], seoPages: db.seoPages });
});

apiRouter.post('/admin/seo', requireAuth, (req, res) => {
  const {
    pagePath,
    pageNameAr,
    metaTitle,
    metaDescription,
    metaKeywords,
    ogTitle,
    ogDescription,
    ogImage,
    canonicalUrl,
    robots,
  } = req.body;

  if (!pagePath || !pageNameAr) {
    res.status(400).json({ error: 'يرجى تحديد مسار الصفحة واسمها' });
    return;
  }

  const db = readDb();
  if (!db.seoPages) db.seoPages = getDefaultSeoPages();

  const newSeo: PageSeoItem = {
    id: `seo_${Date.now()}`,
    pagePath: String(pagePath).trim(),
    pageNameAr: String(pageNameAr).trim(),
    metaTitle: String(metaTitle || 'ELFAZNI SERVICES').trim(),
    metaDescription: String(metaDescription || '').trim(),
    metaKeywords: String(metaKeywords || '').trim(),
    ogTitle: String(ogTitle || metaTitle || 'ELFAZNI SERVICES').trim(),
    ogDescription: String(ogDescription || metaDescription || '').trim(),
    ogImage: String(ogImage || '/assets/slides/10-all-services.webp').trim(),
    canonicalUrl: String(canonicalUrl || `https://elfazni.com${pagePath}`).trim(),
    robots: String(robots || 'index, follow').trim(),
    updatedAt: new Date().toISOString(),
  };

  db.seoPages.push(newSeo);
  writeDb(db);
  broadcastRealtime('seo:updated', { seoPages: db.seoPages });

  res.status(201).json({ success: true, seoPage: newSeo, seoPages: db.seoPages });
});

apiRouter.delete('/admin/seo/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const db = readDb();
  if (!db.seoPages) db.seoPages = getDefaultSeoPages();

  db.seoPages = db.seoPages.filter((item) => item.id !== id);
  writeDb(db);
  broadcastRealtime('seo:updated', { seoPages: db.seoPages });

  res.json({ success: true, seoPages: db.seoPages });
});

// ==========================================
// 12. SYSTEM HEALTH, STABILITY & CLOUD SYNC MONITOR
// ==========================================

apiRouter.get('/admin/system/health', requireAuth, (_req, res) => {
  const report = getSystemHealthReport();
  res.json({ health: report });
});

apiRouter.post('/admin/system/sync-cloud', requireAuth, (_req, res) => {
  const db = readDb();
  scheduleCloudStatePush(db);
  recordSystemLog('success', 'CloudSync', 'تم تنفيذ مزامنة سحابية فورية يدوياً من لوحة التحكم.');
  res.json({
    success: true,
    message: 'تمت مزامنة كافة البيانات مع قاعدة البيانات السحابية الموحدة بنجاح',
    health: getSystemHealthReport(),
  });
});

apiRouter.use('/productivity', productivityRouter);
apiRouter.use('/theme', themeRouter);
apiRouter.use('/documents', documentExportRouter);

// 404 handler for unmatched API routes
apiRouter.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});
