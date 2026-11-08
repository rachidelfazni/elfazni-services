import { verifyPassword } from "../utils/verifyPassword";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, SystemUser, UserRole, PasswordResetRequest, ROLE_DEFINITIONS } from '../types';
import { BRAND_CONFIG } from '../config/brandConfig';

interface AuthContextType {
  user: AuthUser | null;
  users: SystemUser[];
  isAuthenticated: boolean;
  isLocked: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>; 
  logout: () => void;
  lockScreen: () => void;
  unlockScreen: (password: string) => Promise<{ success: boolean; message?: string }>;

  // Role & Permission Evaluation Helpers
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canViewAccounting: boolean;
  canManageSystemUsers: boolean;
  canEditOperations: boolean;

  // Secure Account State Query (used by LoginPortal for recovery without exposing credentials)
  lookupAccountForRecovery: (query: string) => {
    exists: boolean;
    username?: string;
    displayName?: string;
    roleLabel?: string;
    isActive?: boolean;
  };

  // User Management Methods
  addUser: (newUser: {
    username: string;
    password: string;
    displayName: string;
    role: UserRole;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    canAccessConsulate?: boolean;
    canAccessFlights?: boolean;
    canAccessAccounting?: boolean;
    canAccessDebts?: boolean;
    canAccessReports?: boolean;
    canManageUsers?: boolean;
    canEditFinances?: boolean;
    notes?: string;
  }) => { success: boolean; message?: string };

  updateUser: (userId: string, updates: Partial<SystemUser>) => { success: boolean; message?: string };
  updateUserPassword: (userId: string, newPass: string) => { success: boolean; message?: string };
  deleteUser: (userId: string) => { success: boolean; message?: string };
  changeMyPassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message?: string }>;
  updateMyProfile: (updates: { displayName?: string; email?: string; phone?: string; avatarUrl?: string }) => { success: boolean; message?: string };

  // Password Reset Requests Queue (For Root Admin & Recovery)
  passwordResetRequests: PasswordResetRequest[];
  pendingResetRequestsCount: number;
  submitPasswordResetRequest: (username: string, contactInfo?: string, notes?: string) => { success: boolean; message: string };
  resolvePasswordResetRequest: (requestId: string, resolvedPassword?: string, notes?: string) => { success: boolean; message: string };
  deletePasswordResetRequest: (requestId: string) => void;

  // UI Dialog Controls for User Profile & User Management
  isUserProfileModalOpen: boolean;
  setIsUserProfileModalOpen: (open: boolean) => void;
  isUserManagementModalOpen: boolean;
  setIsUserManagementModalOpen: (open: boolean) => void;

  defaultCredentials: { username: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ownerProfileKey = (id: string) => `elfazni_crm_owner_profile_${id}`;
const founderAvatar = '/admin/crm/assets/founder-rachid-elfazni-v2.webp';

const STORAGE_KEY_USER = 'elfazni_auth_user';
const STORAGE_KEY_USERS_LIST = 'elfazni_system_users_v4';
const STORAGE_KEY_RESET_REQUESTS = 'elfazni_pwd_reset_requests';
const STORAGE_KEY_LOCKED = 'elfazni_auth_locked';
const STORAGE_KEY_REMEMBER = 'elfazni_auth_remember';

export const getPermissionsForRole = (role: UserRole) => {
  switch (role) {
    case 'super_admin':
    case 'admin':
      return {
        canAccessConsulate: true,
        canAccessFlights: true,
        canAccessAccounting: true,
        canAccessDebts: true,
        canAccessReports: true,
        canManageUsers: true,
        canEditFinances: true,
      };
    case 'accountant':
      return {
        canAccessConsulate: false,
        canAccessFlights: false,
        canAccessAccounting: true,
        canAccessDebts: true,
        canAccessReports: true,
        canManageUsers: false,
        canEditFinances: true,
      };
    case 'editor':
    case 'agent':
      return {
        canAccessConsulate: true,
        canAccessFlights: true,
        canAccessAccounting: false,
        canAccessDebts: false,
        canAccessReports: false,
        canManageUsers: false,
        canEditFinances: false,
      };
    case 'viewer':
    default:
      return {
        canAccessConsulate: true,
        canAccessFlights: true,
        canAccessAccounting: false,
        canAccessDebts: false,
        canAccessReports: false,
        canManageUsers: false,
        canEditFinances: false,
      };
  }
};

const INITIAL_USERS: SystemUser[] = [];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<SystemUser[]>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY_USERS_LIST) ||
        localStorage.getItem('elfazni_system_users_v3') ||
        localStorage.getItem('elfazni_system_users_v2');
      if (saved) {
        const parsed = JSON.parse(saved) as SystemUser[];
        const rootIndex = parsed.findIndex(
          (u) => u.username === (BRAND_CONFIG.adminAuth.username || 'elfazni.admin')
        );

        const hydrated: SystemUser[] = parsed.map((u) => {
          const defaults = getPermissionsForRole(u.role);
          return {
            ...u,
            canAccessConsulate: u.canAccessConsulate ?? defaults.canAccessConsulate,
            canAccessFlights: u.canAccessFlights ?? defaults.canAccessFlights,
            canAccessAccounting: u.canAccessAccounting ?? defaults.canAccessAccounting,
            canAccessDebts: u.canAccessDebts ?? defaults.canAccessDebts,
            canAccessReports: u.canAccessReports ?? defaults.canAccessReports,
            canManageUsers: u.canManageUsers ?? defaults.canManageUsers,
            canEditFinances: u.canEditFinances ?? defaults.canEditFinances,
          };
        });

        // Ensure editor default user is also available if migrating from v3
        if (!hydrated.some((u) => u.username === 'editor.elfazni')) {
          hydrated.push(INITIAL_USERS[2]);
        }

        if (rootIndex === -1) {
          return [INITIAL_USERS[0], ...hydrated];
        } else {
          hydrated[rootIndex] = {
            ...INITIAL_USERS[0],
            ...hydrated[rootIndex],
            passwordHash: BRAND_CONFIG.adminAuth.password || "$pbkdf2-sha256$100000$218feb5975a99d06e181e114dcc63c6c$e1d6155e2b0f1136cd24549e975213b734f2b5b5a58c7a3690c67e4a3646e03d",
            canAccessConsulate: true,
            canAccessFlights: true,
            canAccessAccounting: true,
            canAccessDebts: true,
            canAccessReports: true,
            canManageUsers: true,
            canEditFinances: true,
            role: 'super_admin',
            isActive: true,
          };
          return hydrated;
        }
      }
    } catch (e) {
      console.error('Error loading users:', e);
    }
    return INITIAL_USERS;
  });

  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RESET_REQUESTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading reset requests:', e);
    }
    return [];
  });

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);

  // Save users list whenever it updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS_LIST, JSON.stringify(users));
    } catch (e) {
      console.error('Error saving users:', e);
    }
  }, [users]);

  // Save password reset requests whenever it updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RESET_REQUESTS, JSON.stringify(passwordResetRequests));
    } catch (e) {
      console.error('Error saving reset requests:', e);
    }
  }, [passwordResetRequests]);

  // The website server verifies the owner before serving the private CRM.
  useEffect(() => {
    const controller = new AbortController();
    fetch('/admin/crm/session', { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('CRM session expired');
        const owner = await response.json();
        let profile: Partial<Pick<AuthUser, 'displayName' | 'email' | 'phone' | 'avatarUrl'>> = {};
        try {
          profile = JSON.parse(localStorage.getItem(ownerProfileKey(owner.id)) || '{}') || {};
        } catch {}
        const crmRole: UserRole =
          owner.role === 'superadmin' ? 'super_admin'
          : owner.role === 'accountant' ? 'accountant'
          : owner.role === 'editor' ? 'editor'
          : 'admin';

        const canManageUsers = Boolean(owner.canManageUsers || owner.role === 'superadmin');

        setUser({
          id: owner.id,
          username: owner.username,
          displayName: profile.displayName || owner.displayName,
          email: profile.email ?? owner.email,
          phone: profile.phone ?? BRAND_CONFIG.phone,
          avatarUrl: profile.avatarUrl || founderAvatar,
          role: crmRole,
          lastLoginAt: new Date().toISOString(),
          ...getPermissionsForRole(crmRole),
          canManageUsers,
        });
        setIsAuthenticated(true);
        setLoading(false);

        // Sync with authoritative server users store
        if (canManageUsers) {
          fetch('/admin/crm/api/users', { headers: { 'x-elfazni-crm': '1' } })
            .then(async (r) => {
              if (r.ok) {
                const data = await r.json();
                if (data.users && Array.isArray(data.users)) {
                  const mapped: SystemUser[] = data.users.map((su: any) => ({
                    id: su.id,
                    username: su.username,
                    displayName: su.displayName,
                    role: su.role === 'superadmin' ? 'super_admin' : su.role === 'accountant' ? 'accountant' : 'editor',
                    email: su.email,
                    phone: su.phone,
                    isActive: !su.disabled,
                    canAccessConsulate: true,
                    canAccessFlights: true,
                    canAccessAccounting: su.role === 'superadmin' || su.role === 'accountant',
                    canAccessDebts: su.role === 'superadmin' || su.role === 'accountant',
                    canAccessReports: su.role === 'superadmin' || su.role === 'accountant',
                    canManageUsers: su.role === 'superadmin',
                    canEditFinances: su.role === 'superadmin' || su.role === 'accountant',
                    createdAt: su.createdAt,
                    lastLoginAt: su.lastLoginAt,
                  }));
                  setUsers(mapped);
                }
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) window.location.replace('/admin');
      });
    return () => controller.abort();
  }, []);

  // Role & Permission evaluation helpers based on current logged-in user
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  };

  const canViewAccounting = Boolean(
    user &&
      (user.role === 'super_admin' ||
        user.role === 'admin' ||
        user.role === 'accountant' ||
        user.canAccessAccounting ||
        user.canAccessDebts ||
        user.canAccessReports ||
        user.canEditFinances)
  );

  const canManageSystemUsers = Boolean(user && (user.role === 'super_admin' || user.canManageUsers));

  const canEditOperations = Boolean(
    user &&
      (user.role === 'super_admin' ||
        user.role === 'admin' ||
        user.role === 'editor' ||
        user.role === 'agent' ||
        user.canAccessConsulate ||
        user.canAccessFlights)
  );

  // Secure Account State Query (never returns passwordHash)
  const lookupAccountForRecovery = (query: string) => {
    const clean = query.trim().toLowerCase();
    if (!clean) return { exists: false };

    const matched = users.find(
      (u) =>
        u.username.toLowerCase() === clean ||
        (u.email && u.email.toLowerCase() === clean) ||
        (u.phone && u.phone.replace(/\s+/g, '') === clean.replace(/\s+/g, ''))
    );

    if (!matched) {
      return { exists: false };
    }

    return {
      exists: true,
      username: matched.username,
      displayName: matched.displayName,
      roleLabel: ROLE_DEFINITIONS[matched.role]?.label || matched.role,
      isActive: matched.isActive,
    };
  };

  const login = async (username: string, password: string, rememberMe: boolean = true) => {
    const cleanUser = username.trim();
    const cleanPass = password;

    // Query registered users from administrative state
    const targetUser = users.find(
      (u) => u.username.toLowerCase() === cleanUser.toLowerCase()
    );

    const isRootMatch =
      cleanUser.toLowerCase() === (BRAND_CONFIG.adminAuth.username || 'elfazni.admin').toLowerCase() &&
      (await verifyPassword(cleanPass, BRAND_CONFIG.adminAuth.password || "$pbkdf2-sha256$100000$218feb5975a99d06e181e114dcc63c6c$e1d6155e2b0f1136cd24549e975213b734f2b5b5a58c7a3690c67e4a3646e03d"));

    if (!targetUser && !isRootMatch) {
      return { success: false, message: 'اسم المستخدم غير مسجل في قاعدة بيانات النظام الإدارية' };
    }

    const matchedUser = targetUser || INITIAL_USERS[0];

    const isPasswordValid =
      (await verifyPassword(cleanPass, matchedUser.passwordHash)) ||
      (isRootMatch && (await verifyPassword(cleanPass, BRAND_CONFIG.adminAuth.password || "$pbkdf2-sha256$100000$218feb5975a99d06e181e114dcc63c6c$e1d6155e2b0f1136cd24549e975213b734f2b5b5a58c7a3690c67e4a3646e03d")));

    if (!isPasswordValid) {
      return {
        success: false,
        message: 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى أو استخدام خيار "نسيت كلمة المرور؟"',
      };
    }

    if (!matchedUser.isActive) {
      return {
        success: false,
        message: 'تم إيقاف هذا الحساب مؤقتاً من قِبل الإدارة، يرجى مراجعة المسؤول العام',
      };
    }

    const nowStr = new Date().toISOString();
    const roleDefaults = getPermissionsForRole(matchedUser.role);

    const authUser: AuthUser = {
      id: matchedUser.id,
      username: matchedUser.username,
      displayName: matchedUser.displayName,
      role: matchedUser.role,
      email: matchedUser.email,
      phone: matchedUser.phone,
      avatarUrl: matchedUser.avatarUrl || '/admin/crm/assets/founder-rachid-elfazni-v2.webp',
      lastLoginAt: nowStr,
      canAccessConsulate: matchedUser.canAccessConsulate ?? roleDefaults.canAccessConsulate,
      canAccessFlights: matchedUser.canAccessFlights ?? roleDefaults.canAccessFlights,
      canAccessAccounting: matchedUser.canAccessAccounting ?? roleDefaults.canAccessAccounting,
      canAccessDebts: matchedUser.canAccessDebts ?? roleDefaults.canAccessDebts,
      canAccessReports: matchedUser.canAccessReports ?? roleDefaults.canAccessReports,
      canManageUsers: matchedUser.canManageUsers ?? roleDefaults.canManageUsers,
      canEditFinances: matchedUser.canEditFinances ?? roleDefaults.canEditFinances,
    };

    setUsers((prev) =>
      prev.map((u) => (u.id === matchedUser.id ? { ...u, lastLoginAt: nowStr } : u))
    );

    setUser(authUser);
    setIsAuthenticated(true);
    setIsLocked(false);

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEY_USER, JSON.stringify(authUser));
    storage.setItem(STORAGE_KEY_LOCKED, 'false');
    localStorage.setItem(STORAGE_KEY_REMEMBER, rememberMe ? 'true' : 'false');

    if (!rememberMe) {
      localStorage.removeItem(STORAGE_KEY_USER);
    }

    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem('elfazni_auth_token');
    void fetch('/api/auth/logout', { method: 'POST' }).finally(() => window.location.replace('/admin'));
  };

  const lockScreen = logout;

  const unlockScreen = async (password: string) => {
    if (!user) return { success: false, message: 'لا توجد جلسة نشطة' };
    const currentUserRecord = users.find((u) => u.id === user.id);
    const validPass = currentUserRecord?.passwordHash || BRAND_CONFIG.adminAuth.password;

    if (await verifyPassword(password, validPass)) {
      setIsLocked(false);
      const remember = localStorage.getItem(STORAGE_KEY_REMEMBER) === 'true';
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEY_LOCKED, 'false');
      return { success: true };
    }
    return { success: false, message: 'كلمة المرور غير صحيحة' };
  };

  // Add new user with role and granular permissions
  const addUser = (newUser: {
    username: string;
    password: string;
    displayName: string;
    role: UserRole;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    canAccessConsulate?: boolean;
    canAccessFlights?: boolean;
    canAccessAccounting?: boolean;
    canAccessDebts?: boolean;
    canAccessReports?: boolean;
    canManageUsers?: boolean;
    canEditFinances?: boolean;
    notes?: string;
  }) => {
    const cleanUser = newUser.username.trim().toLowerCase();
    if (!cleanUser) {
      return { success: false, message: 'يجب تحديد اسم المستخدم' };
    }
    if (newUser.password.length < 4) {
      return { success: false, message: 'يجب أن لا تقل كلمة المرور عن 4 أحرف أو أرقام' };
    }
    const exists = users.some((u) => u.username.toLowerCase() === cleanUser);
    if (exists) {
      return { success: false, message: 'اسم المستخدم هذا موجود مسبقاً، اختر اسماً آخر' };
    }

    const roleDefaults = getPermissionsForRole(newUser.role);

    const created: SystemUser = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      username: cleanUser,
      passwordHash: newUser.password,
      displayName: newUser.displayName || cleanUser,
      role: newUser.role,
      email: newUser.email || '',
      phone: newUser.phone || '',
      avatarUrl: newUser.avatarUrl || '',
      isActive: true,
      createdAt: new Date().toISOString(),
      canAccessConsulate: newUser.canAccessConsulate ?? roleDefaults.canAccessConsulate,
      canAccessFlights: newUser.canAccessFlights ?? roleDefaults.canAccessFlights,
      canAccessAccounting: newUser.canAccessAccounting ?? roleDefaults.canAccessAccounting,
      canAccessDebts: newUser.canAccessDebts ?? roleDefaults.canAccessDebts,
      canAccessReports: newUser.canAccessReports ?? roleDefaults.canAccessReports,
      canManageUsers: newUser.canManageUsers ?? roleDefaults.canManageUsers,
      canEditFinances: newUser.canEditFinances ?? roleDefaults.canEditFinances,
      notes: newUser.notes || '',
    };

    setUsers((prev) => [created, ...prev]);

    // Sync to authoritative backend
    void fetch('/admin/crm/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-elfazni-crm': '1' },
      body: JSON.stringify({
        username: cleanUser,
        displayName: newUser.displayName || cleanUser,
        password: newUser.password.length >= 10 ? newUser.password : newUser.password.padEnd(10, '0'),
        role: newUser.role === 'super_admin' ? 'superadmin' : newUser.role,
        email: newUser.email,
        phone: newUser.phone,
        systemAccess: 'crm',
      }),
    }).catch(() => {});

    return {
      success: true,
      message: `تمت إضافة المستخدم (${created.displayName}) بدور (${ROLE_DEFINITIONS[created.role]?.label || created.role}) بنجاح!`,
    };
  };

  // Update existing user
  const updateUser = (userId: string, updates: Partial<SystemUser>) => {
    if (updates.username) {
      const cleanUser = updates.username.trim().toLowerCase();
      const duplicate = users.some((u) => u.id !== userId && u.username.toLowerCase() === cleanUser);
      if (duplicate) {
        return { success: false, message: 'اسم المستخدم مأخوذ من قبل حساب آخر' };
      }
      updates.username = cleanUser;
    }

    const existing = users.find((u) => u.id === userId);
    if (existing && user && user.id === userId) {
      const updated = { ...existing, ...updates };
      const updatedAuth: AuthUser = {
        ...user,
        username: updated.username,
        displayName: updated.displayName,
        role: updated.role,
        email: updated.email,
        phone: updated.phone,
        avatarUrl: updated.avatarUrl || '/admin/crm/assets/founder-rachid-elfazni-v2.webp',
        canAccessConsulate: updated.canAccessConsulate,
        canAccessFlights: updated.canAccessFlights,
        canAccessAccounting: updated.canAccessAccounting,
        canAccessDebts: updated.canAccessDebts,
        canAccessReports: updated.canAccessReports,
        canManageUsers: updated.canManageUsers,
        canEditFinances: updated.canEditFinances,
      };
      setUser(updatedAuth);
      try {
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedAuth));
        if (sessionStorage.getItem(STORAGE_KEY_USER)) {
          sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedAuth));
        }
      } catch {
        // Ignore storage quota errors
      }
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );

    // Sync to authoritative backend
    void fetch(`/admin/crm/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-elfazni-crm': '1' },
      body: JSON.stringify({
        displayName: updates.displayName,
        email: updates.email,
        phone: updates.phone,
        role: updates.role === 'super_admin' ? 'superadmin' : updates.role,
        disabled: updates.isActive !== undefined ? !updates.isActive : undefined,
      }),
    }).catch(() => {});

    return { success: true, message: 'تم تحديث دور وصلاحيات المستخدم بنجاح' };
  };

  const updateUserPassword = (userId: string, newPass: string) => {
    if (!newPass || newPass.length < 4) {
      return { success: false, message: 'يجب أن لا تقل كلمة المرور عن 4 أحرف أو أرقام' };
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, passwordHash: newPass };
        }
        return u;
      })
    );

    // Sync to authoritative backend if >= 10 chars
    if (newPass.length >= 10) {
      void fetch(`/admin/crm/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-elfazni-crm': '1' },
        body: JSON.stringify({ password: newPass }),
      }).catch(() => {});
    }

    return { success: true, message: 'تم تغيير كلمة المرور بنجاح!' };
  };

  const deleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, message: 'المستخدم غير موجود' };

    if (target.username === 'elfazni.admin' || target.id === 'root-admin') {
      return { success: false, message: 'لا يمكن حذف حساب الإدارة الرئيسي (Root User) نهائياً' };
    }

    if (user && user.id === userId) {
      return { success: false, message: 'لا يمكنك حذف حسابك أثناء تسجيل الدخول منه' };
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId));

    // Sync to authoritative backend
    void fetch(`/admin/crm/api/users/${userId}`, {
      method: 'DELETE',
      headers: { 'x-elfazni-crm': '1' },
    }).catch(() => {});

    return { success: true, message: `تم حذف الحساب (${target.displayName}) بنجاح` };
  };

  const changeMyPassword = async (currentPass: string, newPass: string) => {
    if (!user) return { success: false, message: 'غير مسجل' };
    const currentRecord = users.find((u) => u.id === user.id);
    if (!currentRecord) return { success: false, message: 'المستخدم غير موجود' };

    if (!(await verifyPassword(currentPass, currentRecord.passwordHash))) {
      return { success: false, message: 'كلمة المرور الحالية غير صحيحة' };
    }
    if (newPass.length < 4) {
      return { success: false, message: 'كلمة المرور الجديدة يجب أن تكون 4 خانات على الأقل' };
    }

    return updateUserPassword(user.id, newPass);
  };

  const updateMyProfile = (updates: { displayName?: string; email?: string; phone?: string; avatarUrl?: string }) => {
    if (!user) return { success: false, message: 'غير مسجل' };
    const { displayName, email, phone, avatarUrl } = { ...user, ...updates };
    try {
      localStorage.setItem(ownerProfileKey(user.id), JSON.stringify({ displayName, email, phone, avatarUrl }));
      setUser({ ...user, displayName, email, phone, avatarUrl: avatarUrl || founderAvatar });
      return { success: true };
    } catch {
      return { success: false, message: 'تعذّر حفظ الملف الشخصي في هذا المتصفح.' };
    }
  };

  const submitPasswordResetRequest = (username: string, contactInfo?: string, notes?: string) => {
    const cleanUser = username.trim().toLowerCase();
    if (!cleanUser) {
      return { success: false, message: 'يرجى إدخال اسم المستخدم الخاص بك' };
    }

    const matchedAccount = lookupAccountForRecovery(cleanUser);
    if (!matchedAccount.exists) {
      return {
        success: false,
        message: 'لم يتم العثور على حساب مسجل بهذا الاسم في الحالة الإدارية للنظام، يرجى التأكد من الاسم أو التواصل مع الإدارة.',
      };
    }

    const req: PasswordResetRequest = {
      id: 'req_' + Date.now(),
      username: matchedAccount.username || cleanUser,
      contactInfo: contactInfo || '',
      notes: notes || '',
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };

    setPasswordResetRequests((prev) => [req, ...prev]);
    return {
      success: true,
      message: `تم التحقق من الحساب (${matchedAccount.displayName}) وإرسال إشعار فوري إلى إدارة النظام لإعادة تعيين كلمة المرور.`,
    };
  };

  const resolvePasswordResetRequest = (requestId: string, resolvedPassword?: string, notes?: string) => {
    const req = passwordResetRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, message: 'الطلب غير موجود' };

    if (resolvedPassword && resolvedPassword.length >= 4) {
      const targetUser = users.find((u) => u.username.toLowerCase() === req.username.toLowerCase());
      if (targetUser) {
        updateUserPassword(targetUser.id, resolvedPassword);
      }
    }

    setPasswordResetRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'resolved',
              resolvedAt: new Date().toISOString(),
              resolvedBy: user?.username || 'elfazni.admin',
              notes: notes || r.notes,
            }
          : r
      )
    );

    return { success: true, message: 'تمت معالجة وإغلاق طلب استعادة كلمة المرور بنجاح!' };
  };

  const deletePasswordResetRequest = (requestId: string) => {
    setPasswordResetRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const pendingResetRequestsCount = passwordResetRequests.filter((r) => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white" dir="rtl">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-400 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-300">جاري التحقق من الصلاحيات الأمنية والتهيئة...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated,
        isLocked,
        login,
        logout,
        lockScreen,
        unlockScreen,
        hasRole,
        canViewAccounting,
        canManageSystemUsers,
        canEditOperations,
        lookupAccountForRecovery,
        addUser,
        updateUser,
        updateUserPassword,
        deleteUser,
        changeMyPassword,
        updateMyProfile,
        passwordResetRequests,
        pendingResetRequestsCount,
        submitPasswordResetRequest,
        resolvePasswordResetRequest,
        deletePasswordResetRequest,
        isUserProfileModalOpen,
        setIsUserProfileModalOpen,
        isUserManagementModalOpen,
        setIsUserManagementModalOpen,
        defaultCredentials: {
          username: BRAND_CONFIG.adminAuth.username || 'elfazni.admin',
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
