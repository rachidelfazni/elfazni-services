import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { createCrmStore, CrmStoreError } from './crmStore';
import { productivityRouter } from './productivityRoutes';
import { themeRouter } from './themeRoutes';
import {
  readDb,
  writeDb,
  User,
  RoleDefinition,
  AuditLogItem,
  PERMISSIONS_REGISTRY,
} from './db';
import { publicUser, hasPermission } from './auth';

export const crmRouter = Router();
const store = createCrmStore();

const validPassword = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 10 && Buffer.byteLength(value) <= 72;

crmRouter.use((req, res, next) => {
  const user = res.locals.crmOwner;
  if (!user || user.disabled) {
    return res.status(403).json({ error: 'الحساب غير مصرح له أو معطّل.' });
  }

  if (user.readOnly && !['GET', 'HEAD'].includes(req.method)) {
    return res.status(403).json({ error: 'هذا الحساب مخصص للعرض فقط.' });
  }

  if (!['GET', 'HEAD'].includes(req.method)) {
    const origin = req.get('origin');
    const sameOrigin = origin === req.protocol + '://' + req.get('host');
    if (req.get('x-elfazni-crm') !== '1' && (!origin || !sameOrigin) && req.get('sec-fetch-site') === 'cross-site') {
      return res.status(403).json({ error: 'مصدر الطلب غير مسموح.' });
    }
  }
  next();
});

crmRouter.get('/state', (_req, res, next) => {
  try {
    const { data, revision, updatedAt } = store.read();
    res.json({ data, revision, updatedAt });
  } catch (error) { next(error); }
});

crmRouter.put('/state', (req, res, next) => {
  try { res.json(store.save(req.body.data, req.body.revision, req.body.requestId, res.locals.crmOwner.id)); }
  catch (error) { next(error); }
});

crmRouter.get('/backups', (_req, res, next) => {
  try { res.json({ backups: store.backups().map(name => ({ name, revision: Number(name.split('-')[1]) })) }); }
  catch (error) { next(error); }
});

crmRouter.get('/backups/:name', (req, res, next) => {
  try {
    const backup = store.getBackup(String(req.params.name));
    res.attachment('ELFAZNI-CRM-revision-' + backup.revision + '.json');
    res.json({ app: 'ELFAZNI_SERVICES_CRM', version: 6, exportedAt: new Date().toISOString(), ...backup.data });
  } catch (error) { next(error); }
});

crmRouter.use('/productivity', productivityRouter);
crmRouter.use('/theme', themeRouter);

// Unified Users & Roles Management for CRM
const canManageUsers = (_req: any, res: any, next: any) => {
  const user = res.locals.crmOwner;
  if (user?.role === 'superadmin' || hasPermission(user, 'crm.users.manage')) {
    return next();
  }
  return res.status(403).json({ error: 'لا تملك صلاحية إدارة المستخدمين في نظام CRM.' });
};

crmRouter.get('/users', canManageUsers, (_req, res) => {
  const db = readDb();
  res.json({
    users: db.users.map(publicUser),
    roles: db.roles || [],
    requests: db.passwordRequests || [],
    auditLogs: (db.auditLogs || []).slice(-100).reverse(),
  });
});

crmRouter.post('/users', canManageUsers, (req, res) => {
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
  const assignedSystem = (['crm', 'admin', 'both'] as const).includes(systemAccess) ? systemAccess : 'crm';

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
    disabled: Boolean(disabled),
    readOnly: Boolean(readOnly),
    passwordHash: bcrypt.hashSync(password, 10),
    sessionVersion: 1,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);

  const auditItem: AuditLogItem = {
    id: randomUUID(),
    actorId: res.locals.crmOwner?.id || 'system',
    actorUsername: res.locals.crmOwner?.username || 'system',
    action: 'USER_CREATED',
    targetType: 'user',
    targetId: newUser.id,
    details: `CRM: تم إنشاء المستخدم ${newUser.displayName} (${newUser.username}) بدور ${newUser.role}`,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.push(auditItem);

  writeDb(db);
  return res.status(201).json({ success: true, user: publicUser(newUser) });
});

crmRouter.patch('/users/:id', canManageUsers, (req, res) => {
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

  if (displayName !== undefined && typeof displayName === 'string') user.displayName = displayName.trim().slice(0, 100);
  if (email !== undefined && typeof email === 'string') user.email = email.trim();
  if (phone !== undefined && typeof phone === 'string') user.phone = phone.trim();
  if (role !== undefined && typeof role === 'string' && role.trim()) user.role = role.trim();
  if (department !== undefined) user.department = department;
  if (systemAccess !== undefined && ['crm', 'admin', 'both'].includes(systemAccess)) user.systemAccess = systemAccess;
  if (permissions !== undefined && typeof permissions === 'object') user.permissions = permissions;
  if (readOnly !== undefined && typeof readOnly === 'boolean') user.readOnly = readOnly;
  if (disabled !== undefined && typeof disabled === 'boolean') {
    user.disabled = disabled;
    if (disabled) user.sessionVersion = (user.sessionVersion || 0) + 1;
  }
  if (revokeSessions === true) user.sessionVersion = (user.sessionVersion || 0) + 1;
  if (password !== undefined) {
    user.passwordHash = bcrypt.hashSync(password, 10);
    user.sessionVersion = (user.sessionVersion || 0) + 1;
    db.passwordRequests = db.passwordRequests?.filter((item) => item.userId !== user.id);
  }

  user.updatedAt = new Date().toISOString();

  const auditItem: AuditLogItem = {
    id: randomUUID(),
    actorId: res.locals.crmOwner?.id || 'system',
    actorUsername: res.locals.crmOwner?.username || 'system',
    action: 'USER_UPDATED',
    targetType: 'user',
    targetId: user.id,
    details: `CRM: تم تحديث بيانات المستخدم ${user.displayName} (${user.username})`,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.push(auditItem);

  writeDb(db);
  return res.json({ success: true, user: publicUser(user) });
});

crmRouter.delete('/users/:id', canManageUsers, (req, res) => {
  const db = readDb();
  const index = db.users.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'المستخدم غير موجود.' });

  const targetUser = db.users[index];

  // Superadmin Safeguard
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

  const auditItem: AuditLogItem = {
    id: randomUUID(),
    actorId: res.locals.crmOwner?.id || 'system',
    actorUsername: res.locals.crmOwner?.username || 'system',
    action: 'USER_DELETED',
    targetType: 'user',
    targetId: targetUser.id,
    details: `CRM: تم حذف المستخدم ${targetUser.displayName} (${targetUser.username})`,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs = db.auditLogs || [];
  db.auditLogs.push(auditItem);

  writeDb(db);
  return res.json({ success: true });
});

crmRouter.get('/roles', canManageUsers, (_req, res) => {
  const db = readDb();
  res.json({
    roles: db.roles || [],
    permissionsRegistry: PERMISSIONS_REGISTRY,
  });
});

crmRouter.get('/audit-logs', canManageUsers, (_req, res) => {
  const db = readDb();
  res.json({ auditLogs: (db.auditLogs || []).slice(-200).reverse() });
});

crmRouter.use((error: unknown, _req: any, res: any, _next: any) => {
  if (error instanceof CrmStoreError) return res.status(error.status).json({ error: error.message });
  console.error('CRM storage request failed', error);
  res.status(503).json({ error: 'تعذّر حفظ أو قراءة بيانات CRM. احتفظ بنسخة من تعديلاتك ثم أعد المحاولة.' });
});
