import { createHash, randomBytes } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { readDb, StaffAccess, User, RoleDefinition } from './db';

const getJwtSecret = () => process.env.JWT_SECRET || 'elfazni-services-jwt-auth-secret-key-2026';

export interface AuthRequest extends Request {
  user?: Omit<User, 'passwordHash'>;
}

export const revision = (user: User) =>
  createHash('sha256').update(user.passwordHash + ':' + (user.sessionVersion || 0)).digest('hex');

export function hasAccess(user: User | undefined, access: StaffAccess): boolean {
  if (!user || user.disabled) return false;
  return Boolean(user.role === 'superadmin' || (user.grants ? user.grants.includes(access) : user.access === access));
}

export function hasPermission(user: User | undefined, permKey: string): boolean {
  if (!user || user.disabled) return false;
  // 1. Explicit deny overrides all
  if (user.permissions?.denied?.includes(permKey)) return false;
  // 2. Superadmin has full access unless explicitly denied
  if (user.role === 'superadmin') return true;
  // 3. Explicit allow override
  if (user.permissions?.allowed?.includes(permKey)) return true;
  // 4. Role definition permissions
  const db = readDb();
  const roleDef = (db.roles || []).find((r) => r.id === user.role);
  if (roleDef && roleDef.permissions.includes(permKey)) {
    return true;
  }
  // 5. Default deny
  return false;
}

export function publicUser({ passwordHash, ...user }: User) {
  return user;
}

export function generateToken(user: User, scope: 'admin' | 'crm' = 'admin'): string {
  return jwt.sign(
    {
      id: user.id,
      scope,
      revision: revision(user),
      username: user.username,
      role: user.role,
      displayName: user.displayName,
      sessionVersion: user.sessionVersion || 0,
    },
    getJwtSecret(),
    { expiresIn: scope === 'crm' ? '12h' : '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (err) {
    return null;
  }
}

export function getAuthenticatedUser(token?: string, scope: 'admin' | 'crm' = 'admin'): User | undefined {
  const decoded = token ? verifyToken(token) : null;
  if (!decoded) return undefined;
  const db = readDb();
  const user = db.users.find(
    (u) =>
      u.id === decoded.id &&
      !u.disabled &&
      decoded.revision === revision(u) &&
      (decoded.sessionVersion === undefined || decoded.sessionVersion === (u.sessionVersion || 0))
  );
  if (!user) return undefined;

  // Superadmin has access to both CRM and Admin Panel
  if (user.role === 'superadmin') return user;

  const userScope = user.systemAccess || 'admin';
  if (userScope === 'both' || userScope === scope) {
    return user;
  }

  // If scope doesn't match and not 'both', deny access
  return undefined;
}

export function getBearerUser(req: Request): User | undefined {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (token) {
    return getAuthenticatedUser(token, 'admin') || getAuthenticatedUser(token, 'crm');
  }

  const cookieToken =
    req.headers.cookie?.match(/(?:^|; *)token=([^;]+)/)?.[1] ||
    req.headers.cookie?.match(/(?:^|; *)elfazni_crm=([^;]+)/)?.[1];
  if (cookieToken) {
    return getAuthenticatedUser(cookieToken, 'admin') || getAuthenticatedUser(cookieToken, 'crm');
  }

  return undefined;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const user = getBearerUser(req);
  if (!user) {
    res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً' });
    return;
  }

  if (user.disabled) {
    res.status(403).json({ error: 'هذا الحساب معطّل. يرجى مراجعة إدارة النظام.' });
    return;
  }

  const path = req.path;
  const content = /^\/admin\/(posts|categories|tags|templates|blog-settings|media|services|settings|seo)(?:\/|$)/.test(path);
  const support = /^\/admin\/(mailbox|chat)(?:\/|$)/.test(path);
  const analytics = path === '/analytics' || path === '/admin/analytics/blog-posts';
  const userManagement = /^\/admin\/(users|roles|audit-logs)(?:\/|$)/.test(path);
  const permitted =
    user.role === 'superadmin' ||
    path === '/auth/me' ||
    path === '/auth/change-password' ||
    path === '/auth/profile' ||
    (userManagement && (hasPermission(user, 'admin.users.manage') || user.role === 'superadmin')) ||
    (content && (hasAccess(user, 'content') || hasPermission(user, 'admin.blog.view'))) ||
    (support && (hasAccess(user, 'support') || hasPermission(user, 'admin.requests.view'))) ||
    (analytics && (hasAccess(user, 'analytics') || hasPermission(user, 'admin.dashboard.view'))) ||
    hasPermission(user, 'admin.dashboard.view');

  if (!permitted) {
    res.status(403).json({ error: 'لا تملك صلاحية الوصول إلى هذا القسم.' });
    return;
  }

  if (
    user.role !== 'superadmin' &&
    user.readOnly &&
    !['GET', 'HEAD'].includes(req.method) &&
    !path.startsWith('/auth/')
  ) {
    res.status(403).json({ error: 'هذا الحساب مخصص للعرض فقط.' });
    return;
  }

  req.user = publicUser(user);
  next();
}

export function requirePermission(permKey: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = getBearerUser(req);
    if (!user) {
      res.status(401).json({ error: 'يرجى تسجيل الدخول أولاً' });
      return;
    }

    if (user.disabled) {
      res.status(403).json({ error: 'هذا الحساب معطّل. يرجى مراجعة إدارة النظام.' });
      return;
    }

    if (!hasPermission(user, permKey)) {
      res.status(403).json({ error: `لا تملك الصلاحية الكافية: (${permKey})` });
      return;
    }

    req.user = publicUser(user);
    next();
  };
}
