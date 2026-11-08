import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Lock,
  Unlock,
  Check,
  X,
  Phone,
  Mail,
  Building,
  Briefcase,
  History,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Copy,
  Sliders,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { api, User } from '../../services/api';

export type CanonicalRole =
  | 'superadmin'
  | 'crm_manager'
  | 'flight_agent'
  | 'hotel_agent'
  | 'residence_agent'
  | 'accountant'
  | 'support_agent'
  | 'editor'
  | 'auditor'
  | string;

export type UserDepartment =
  | 'flights'
  | 'hotels'
  | 'consular'
  | 'accounting'
  | 'support'
  | 'content'
  | 'general';

export type SystemAccessScope = 'crm' | 'admin' | 'both';

export interface UserPermissionsOverride {
  allowed: string[];
  denied: string[];
}

export interface ExtendedUser extends User {
  department?: UserDepartment;
  systemAccess?: SystemAccessScope;
  permissions?: UserPermissionsOverride;
  disabled?: boolean;
  phone?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  nameAr: string;
  nameFr?: string;
  description: string;
  systemAccess: SystemAccessScope;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionDefinition {
  key: string;
  system: 'crm' | 'admin' | 'shared';
  module: string;
  action: string;
  labelAr: string;
  labelEn: string;
  description?: string;
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorUsername: string;
  action: string;
  targetType: 'user' | 'role' | 'permission' | 'system' | 'request';
  targetId?: string;
  details?: string;
  timestamp: string;
}

export interface PasswordRequestItem {
  userId: string;
  requestedAt: string;
}

export interface UsersResponse {
  users: ExtendedUser[];
  roles: RoleDefinition[];
  requests: PasswordRequestItem[];
  auditLogs?: AuditLogItem[];
}

export interface RolesResponse {
  roles: RoleDefinition[];
  permissionsRegistry: PermissionDefinition[];
}

const DEPARTMENT_LABELS: Record<UserDepartment, string> = {
  flights: 'حجوزات الطيران',
  hotels: 'الفنادق والإقامة',
  consular: 'المعاملات القنصلية',
  accounting: 'المحاسبة والمالية',
  support: 'خدمة العملاء والدردشة',
  content: 'إدارة المحتوى والمدونة',
  general: 'إدارة عامة',
};

const SYSTEM_ACCESS_LABELS: Record<SystemAccessScope, { label: string; badgeClass: string }> = {
  both: { label: 'النظامان معاً (CRM + الموقع)', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  crm: { label: 'نظام CRM فقط', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  admin: { label: 'لوحة الإدارة فقط', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' },
};

export function AdminUsers() {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [requests, setRequests] = useState<PasswordRequestItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [permissionsRegistry, setPermissionsRegistry] = useState<PermissionDefinition[]>([]);

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit' | 'recovery'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);

  // Modals & Drawers
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  const [passwordTargetUser, setPasswordTargetUser] = useState<ExtendedUser | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Add User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<string>('flight_agent');
  const [newDepartment, setNewDepartment] = useState<UserDepartment>('flights');
  const [newSystemAccess, setNewSystemAccess] = useState<SystemAccessScope>('crm');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newShowPass, setNewShowPass] = useState(false);

  // Create Role State
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleNameAr, setNewRoleNameAr] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleSystem, setNewRoleSystem] = useState<SystemAccessScope>('crm');
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);

  // Load Data
  const loadUsersAndRoles = async () => {
    try {
      setBusy(true);
      const res = await api.request<UsersResponse>('/admin/users');
      setUsers(res.users || []);
      setRoles(res.roles || []);
      setRequests(res.requests || []);
      if (res.auditLogs) setAuditLogs(res.auditLogs);

      const rolesRes = await api.request<RolesResponse>('/admin/roles');
      if (rolesRes.permissionsRegistry) {
        setPermissionsRegistry(rolesRes.permissionsRegistry);
      }
      if (rolesRes.roles) {
        setRoles(rolesRes.roles);
      }
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'تعذر تحميل بيانات المستخدمين.', type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void loadUsersAndRoles();
  }, []);

  const activeSuperadminsCount = useMemo(() => {
    return users.filter((u) => u.role === 'superadmin' && !u.disabled).length;
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.username.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q));

      const matchRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
      const matchDept = selectedDeptFilter === 'all' || u.department === selectedDeptFilter;
      const matchStatus =
        selectedStatusFilter === 'all' ||
        (selectedStatusFilter === 'active' && !u.disabled) ||
        (selectedStatusFilter === 'disabled' && Boolean(u.disabled));

      return matchSearch && matchRole && matchDept && matchStatus;
    });
  }, [users, searchQuery, selectedRoleFilter, selectedDeptFilter, selectedStatusFilter]);

  // Save changes helper
  const handleApiAction = async (
    endpoint: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    body?: any,
    successMsg?: string
  ) => {
    setStatusMessage(null);
    setBusy(true);
    try {
      await api.request(endpoint, {
        method,
        body: body ? JSON.stringify(body) : undefined,
      });
      await loadUsersAndRoles();
      if (successMsg) {
        setStatusMessage({ text: successMsg, type: 'success' });
      }
      return true;
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'حدث خطأ أثناء معالجة الطلب.', type: 'error' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Toggle user active / disabled with Super Admin Safeguard
  const handleToggleDisabled = async (user: ExtendedUser) => {
    if (user.role === 'superadmin' && !user.disabled && activeSuperadminsCount <= 1) {
      setStatusMessage({
        text: 'إجراء محظور: لا يمكن تعطيل آخر مدير عام (Super Admin) نشط في النظام لحماية استمرارية الإدارة.',
        type: 'error',
      });
      return;
    }

    const nextState = !user.disabled;
    const ok = await handleApiAction(
      `/admin/users/${user.id}`,
      'PATCH',
      { disabled: nextState },
      nextState ? `تم تعطيل حساب ${user.displayName} وإنهاء جلساته النشطة.` : `تم تفعيل حساب ${user.displayName} بنجاح.`
    );
  };

  // Delete User with Super Admin Safeguard
  const handleDeleteUser = async (user: ExtendedUser) => {
    if (user.role === 'superadmin' && activeSuperadminsCount <= 1) {
      setStatusMessage({
        text: 'إجراء محظور: لا يمكن حذف آخر مدير عام (Super Admin) نشط في النظام.',
        type: 'error',
      });
      return;
    }

    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف الحساب "${user.displayName}" (${user.username}) نهائياً؟`)) {
      return;
    }

    await handleApiAction(`/admin/users/${user.id}`, 'DELETE', null, `تم حذف حساب "${user.displayName}" بنجاح.`);
  };

  // Revoke User Sessions
  const handleRevokeSessions = async (user: ExtendedUser) => {
    await handleApiAction(
      `/admin/users/${user.id}`,
      'PATCH',
      { revokeSessions: true },
      `تم إنهاء كافة الجلسات النشطة للمستخدم ${user.displayName}.`
    );
  };

  // Submit Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 10) {
      setStatusMessage({ text: 'كلمة المرور يجب أن لا تقل عن 10 أحرف وفق معايير أمان النظام.', type: 'error' });
      return;
    }

    const ok = await handleApiAction(
      '/admin/users',
      'POST',
      {
        username: newUsername.trim(),
        displayName: newDisplayName.trim(),
        password: newPassword,
        role: newRole,
        department: newDepartment,
        systemAccess: newSystemAccess,
        email: newEmail.trim() || undefined,
        phone: newPhone.trim() || undefined,
      },
      `تم إنشاء الحساب "${newDisplayName}" بدور (${getRoleName(newRole)}) بنجاح!`
    );

    if (ok) {
      setShowAddUserModal(false);
      setNewUsername('');
      setNewDisplayName('');
      setNewPassword('');
      setNewEmail('');
      setNewPhone('');
    }
  };

  // Submit Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUser) return;
    if (newPasswordValue.length < 10) {
      setStatusMessage({ text: 'كلمة المرور يجب أن لا تقل عن 10 أحرف.', type: 'error' });
      return;
    }

    const ok = await handleApiAction(
      `/admin/users/${passwordTargetUser.id}`,
      'PATCH',
      { password: newPasswordValue },
      `تم تعيين كلمة المرور الجديدة للمستخدم "${passwordTargetUser.displayName}" بنجاح.`
    );

    if (ok) {
      setPasswordTargetUser(null);
      setNewPasswordValue('');
    }
  };

  // Submit Update User
  const handleUpdateUserDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Safeguard check
    if (
      editingUser.role !== 'superadmin' &&
      users.find((u) => u.id === editingUser.id)?.role === 'superadmin' &&
      activeSuperadminsCount <= 1
    ) {
      setStatusMessage({
        text: 'إجراء محظور: لا يمكن خفض رتبة آخر مدير عام (Super Admin) نشط في النظام.',
        type: 'error',
      });
      return;
    }

    const ok = await handleApiAction(
      `/admin/users/${editingUser.id}`,
      'PATCH',
      {
        displayName: editingUser.displayName,
        email: editingUser.email,
        phone: editingUser.phone,
        role: editingUser.role,
        department: editingUser.department,
        systemAccess: editingUser.systemAccess,
        permissions: editingUser.permissions,
        readOnly: editingUser.readOnly,
      },
      `تم تحديث بيانات وصلاحيات "${editingUser.displayName}" بنجاح.`
    );

    if (ok) {
      setEditingUser(null);
    }
  };

  // Add Custom Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleId || !newRoleNameAr || !newRoleName) {
      setStatusMessage({ text: 'يرجى إدخال معرف الدور واسمه بالعربية والإنجليزية.', type: 'error' });
      return;
    }

    const ok = await handleApiAction(
      '/admin/roles',
      'POST',
      {
        id: newRoleId.trim().toLowerCase().replace(/\s+/g, '_'),
        name: newRoleName.trim(),
        nameAr: newRoleNameAr.trim(),
        description: newRoleDesc.trim(),
        systemAccess: newRoleSystem,
        permissions: newRolePermissions,
      },
      `تم إنشاء الدور الجديد "${newRoleNameAr}" بنجاح.`
    );

    if (ok) {
      setShowAddRoleModal(false);
      setNewRoleId('');
      setNewRoleName('');
      setNewRoleNameAr('');
      setNewRoleDesc('');
      setNewRolePermissions([]);
    }
  };

  // Helper function to resolve role label
  const getRoleName = (roleId: string) => {
    const r = roles.find((item) => item.id === roleId);
    return r ? r.nameAr : roleId;
  };

  return (
    <section className="space-y-6 max-w-7xl mx-auto pb-16 font-sans" aria-labelledby="admin-users-heading" dir="rtl">
      {/* Header */}
      <header className="rounded-3xl border border-[#D7E7F7] bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0B2E57] text-[#CC9048] flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 id="admin-users-heading" className="text-xl sm:text-2xl font-black text-[#0B2E57]">
                إدارة المستخدمين والصلاحيات الموحدة
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                حسابات الفريق المشتركة بين نظام CRM ولوحة إدارة الموقع ومصفوفة الصلاحيات الدقيقة (RBAC)
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadUsersAndRoles}
            disabled={busy}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddUserModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0B2E57] to-[#004AA5] hover:from-[#004AA5] hover:to-[#2A83D5] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>إضافة مستخدم جديد</span>
          </button>
        </div>
      </header>

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div
          role="status"
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm font-bold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-[#0B2E57] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>دليل المستخدمين ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'roles'
              ? 'bg-[#0B2E57] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>الأدوار ومصفوفة الصلاحيات ({roles.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-[#0B2E57] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل العمليات والتدقيق ({auditLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recovery')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
            activeTab === 'recovery'
              ? 'bg-[#0B2E57] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>طلبات استعادة كلمة المرور</span>
          {requests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Users Directory */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم، اسم المستخدم، البريد..."
                className="w-full pr-9 pl-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#004AA5] outline-none"
              />
            </div>

            <div>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#004AA5] outline-none text-[#0B2E57] font-semibold"
              >
                <option value="all">جميع الأدوار الوظيفية</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nameAr}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#004AA5] outline-none text-[#0B2E57] font-semibold"
              >
                <option value="all">كافة الأقسام</option>
                {Object.entries(DEPARTMENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#004AA5] outline-none text-[#0B2E57] font-semibold"
              >
                <option value="all">جميع الحالات (نشط ومعطّل)</option>
                <option value="active">الحسابات النشطة فقط</option>
                <option value="disabled">الحسابات المعطلة فقط</option>
              </select>
            </div>
          </div>

          {/* Users List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const isOwner = user.role === 'superadmin';
              const reqItem = requests.find((r) => r.userId === user.id);
              const systemMeta = SYSTEM_ACCESS_LABELS[user.systemAccess || 'both'] || SYSTEM_ACCESS_LABELS.both;

              return (
                <div
                  key={user.id}
                  className={`rounded-2xl border p-5 bg-white shadow-sm transition-all flex flex-col justify-between ${
                    user.disabled
                      ? 'border-red-200 bg-red-50/20 opacity-80'
                      : isOwner
                      ? 'border-amber-200/80 hover:border-amber-400'
                      : 'border-slate-200 hover:border-[#004AA5]/40'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: User Avatar & Status Toggle */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                            isOwner
                              ? 'bg-gradient-to-br from-[#0B2E57] to-[#004AA5] text-[#CC9048]'
                              : user.disabled
                              ? 'bg-slate-200 text-slate-500'
                              : 'bg-slate-100 text-[#0B2E57]'
                          }`}
                        >
                          {user.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-[#0B2E57] truncate flex items-center gap-1.5">
                            <span>{user.displayName}</span>
                            {isOwner && (
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800"
                                title="المدير العام للنظام"
                              >
                                Super Admin
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-slate-500 font-mono" dir="ltr">
                            @{user.username}
                          </p>
                        </div>
                      </div>

                      {/* Active / Inactive Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleDisabled(user)}
                        disabled={busy || (isOwner && !user.disabled && activeSuperadminsCount <= 1)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                          user.disabled
                            ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                        } ${isOwner && !user.disabled && activeSuperadminsCount <= 1 ? 'opacity-60 cursor-not-allowed' : ''}`}
                        title={
                          isOwner && !user.disabled && activeSuperadminsCount <= 1
                            ? 'محمي: آخر Super Admin نشط'
                            : user.disabled
                            ? 'انقر لتفعيل الحساب'
                            : 'انقر لتعطيل الحساب'
                        }
                      >
                        {user.disabled ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        <span>{user.disabled ? 'معطّل' : 'نشط'}</span>
                      </button>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#EAF4FA] text-[#004AA5] border border-[#D7E7F7]">
                        {getRoleName(user.role)}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600">
                        {DEPARTMENT_LABELS[user.department || 'general']}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[11px] font-medium border ${systemMeta.badgeClass}`}>
                        {systemMeta.label}
                      </span>
                    </div>

                    {/* Contact & Activity */}
                    <div className="space-y-1 text-xs text-slate-500 pt-1">
                      {user.email && (
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate" dir="ltr">
                            {user.email}
                          </span>
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span dir="ltr">{user.phone}</span>
                        </div>
                      )}
                      {user.lastLoginAt && (
                        <div className="text-[11px] text-slate-400">
                          آخر دخول: {new Date(user.lastLoginAt).toLocaleDateString('ar')}
                        </div>
                      )}
                    </div>

                    {/* Recovery Request Alert */}
                    {reqItem && (
                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between">
                        <span>طلب استعادة كلمة مرور بانتظار الاعتماد</span>
                        <button
                          type="button"
                          onClick={() => setPasswordTargetUser(user)}
                          className="underline cursor-pointer"
                        >
                          تعيين
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingUser(user)}
                        className="p-2 rounded-xl text-slate-600 hover:text-[#004AA5] hover:bg-slate-100 transition-all cursor-pointer"
                        title="تعديل الحساب والصلاحيات"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setPasswordTargetUser(user)}
                        className="p-2 rounded-xl text-slate-600 hover:text-[#004AA5] hover:bg-slate-100 transition-all cursor-pointer"
                        title="تعيين كلمة مرور جديدة"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRevokeSessions(user)}
                        className="p-2 rounded-xl text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-all cursor-pointer"
                        title="إنهاء الجلسات النشطة"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user)}
                      disabled={isOwner && activeSuperadminsCount <= 1}
                      className={`p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer ${
                        isOwner && activeSuperadminsCount <= 1 ? 'opacity-30 cursor-not-allowed' : ''
                      }`}
                      title={
                        isOwner && activeSuperadminsCount <= 1
                          ? 'محمي من الحذف'
                          : 'حذف الحساب نهائياً'
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">لا توجد حسابات تطابق خيارات البحث الحالية.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Roles & Permissions Matrix */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0B2E57]">
                أدوار النظام ومصفوفة الصلاحيات
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                تحكم بالصلاحيات الممنوحة لكل دور وظيفي عبر نظامي CRM ولوحة إدارة الموقع
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddRoleModal(true)}
              className="px-4 py-2 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>إضافة دور مخصص</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div key={r.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#0B2E57] flex items-center gap-1.5">
                      <span>{r.nameAr}</span>
                      {r.isSystemRole && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-700">
                          نظامي
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono" dir="ltr">
                      {r.id}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${SYSTEM_ACCESS_LABELS[r.systemAccess]?.badgeClass || ''}`}>
                    {SYSTEM_ACCESS_LABELS[r.systemAccess]?.label || r.systemAccess}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-normal min-h-[36px]">
                  {r.description || 'لا يوجد وصف مخصص لهذا الدور.'}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>الصلاحيات الممنوحة:</span>
                  <span className="font-bold text-[#004AA5]">{r.permissions.length} صلاحية</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Security & Activity Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#0B2E57] flex items-center gap-2">
              <History className="w-5 h-5 text-[#004AA5]" />
              <span>سجل التدقيق الأمني وعمليات إدارة المستخدمين</span>
            </h2>
            <span className="text-xs text-slate-500">آخر {auditLogs.length} عملية مسجلة</span>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0B2E57]">{log.actorUsername}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-slate-600 font-medium">{log.details}</p>
                </div>
                <span className="text-slate-400 whitespace-nowrap text-[11px]" dir="ltr">
                  {new Date(log.timestamp).toLocaleString('ar')}
                </span>
              </div>
            ))}

            {auditLogs.length === 0 && (
              <div className="py-8 text-center text-slate-400">لا توجد سجلات تدقيق سابقة.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Recovery Requests */}
      {activeTab === 'recovery' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#0B2E57]">طلبات استعادة كلمة المرور المعلقة</h2>
          <p className="text-xs text-slate-500">
            راجع طلبات استعادة كلمة المرور المقدمة من أعضاء الفريق وقم بتعيين كلمة مرور جديدة آمنة لهم.
          </p>

          <div className="divide-y divide-slate-100">
            {requests.map((req) => {
              const reqUser = users.find((u) => u.id === req.userId);
              return (
                <div key={req.userId} className="py-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#0B2E57]">
                      {reqUser ? reqUser.displayName : `مستخدم #${req.userId}`}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      @{reqUser?.username || req.userId} · تاريخ الطلب:{' '}
                      {new Date(req.requestedAt).toLocaleString('ar')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => reqUser && setPasswordTargetUser(reqUser)}
                    className="px-4 py-2 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white text-xs font-bold cursor-pointer"
                  >
                    تعيين كلمة مرور جديدة
                  </button>
                </div>
              );
            })}

            {requests.length === 0 && (
              <div className="py-8 text-center text-slate-400">لا توجد طلبات استعادة كلمة مرور حالياً.</div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#D7E7F7] animate-fade-in space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-black text-[#0B2E57] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#004AA5]" />
                <span>إضافة مستخدم جديد للنظام</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل الظاهر</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="مثال: يوسف الإدريسي"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-[#004AA5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المستخدم (لتسجيل الدخول)</label>
                <input
                  type="text"
                  required
                  pattern="[A-Za-z0-9._\-]{3,40}"
                  dir="ltr"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="youssef.elfazni"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-[#004AA5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور المؤقتة (لا تقل عن 10 أحرف)
                </label>
                <div className="relative">
                  <input
                    type={newShowPass ? 'text' : 'password'}
                    required
                    minLength={10}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="كلمة مرور قوية ومؤقتة..."
                    className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none focus:border-[#004AA5]"
                  />
                  <button
                    type="button"
                    onClick={() => setNewShowPass(!newShowPass)}
                    className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {newShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الدور الوظيفي (Role)</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-[#0B2E57] outline-none"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم الرئيسي</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-[#0B2E57] outline-none"
                  >
                    {Object.entries(DEPARTMENT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نطاق الوصول إلى الأنظمة</label>
                <select
                  value={newSystemAccess}
                  onChange={(e) => setNewSystemAccess(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-[#0B2E57] outline-none"
                >
                  <option value="both">النظامان معاً (CRM + لوحة إدارة الموقع)</option>
                  <option value="crm">نظام CRM فقط</option>
                  <option value="admin">لوحة إدارة الموقع فقط</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني (اختياري)</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="youssef@elfazni.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف (اختياري)</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+90 5XX XXX XX XX"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white text-xs sm:text-sm font-bold cursor-pointer shadow-md disabled:opacity-60"
                >
                  {busy ? 'جاري الإنشاء...' : 'إضافة الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Password */}
      {passwordTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#D7E7F7] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#0B2E57] flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#004AA5]" />
                <span>تعيين كلمة مرور جديدة لـ {passwordTargetUser.displayName}</span>
              </h2>
              <button
                type="button"
                onClick={() => setPasswordTargetUser(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور الجديدة (10 أحرف على الأقل)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={10}
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    placeholder="أدخل كلمة مرور جديدة..."
                    className="w-full px-3.5 py-2.5 pl-10 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordTargetUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white text-xs font-bold cursor-pointer shadow-md disabled:opacity-60"
                >
                  {busy ? 'جاري الحفظ...' : 'تأكيد كلمة المرور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer / Modal: Edit User Details & Permissions */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#D7E7F7] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#0B2E57] flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#004AA5]" />
                <span>تعديل بيانات وصلاحيات {editingUser.displayName}</span>
              </h2>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUserDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الظاهر</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={editingUser.displayName}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الدور الوظيفي</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-[#0B2E57] outline-none"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">القسم</label>
                  <select
                    value={editingUser.department || 'general'}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-[#0B2E57] outline-none"
                  >
                    {Object.entries(DEPARTMENT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نطاق الوصول إلى الأنظمة</label>
                <select
                  value={editingUser.systemAccess || 'both'}
                  onChange={(e) => setEditingUser({ ...editingUser, systemAccess: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-[#0B2E57] outline-none"
                >
                  <option value="both">النظامان معاً (CRM + لوحة إدارة الموقع)</option>
                  <option value="crm">نظام CRM فقط</option>
                  <option value="admin">لوحة إدارة الموقع فقط</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    dir="ltr"
                    value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    dir="ltr"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(editingUser.readOnly)}
                    onChange={(e) => setEditingUser({ ...editingUser, readOnly: e.target.checked })}
                    className="w-4 h-4 rounded text-[#004AA5]"
                  />
                  <span>حساب للعرض فقط (Read-only) — لا يمكنه تعديل أو حذف السجلات</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white text-xs sm:text-sm font-bold cursor-pointer shadow-md disabled:opacity-60"
                >
                  {busy ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Role */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#D7E7F7] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-[#0B2E57] flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#004AA5]" />
                <span>إضافة دور وظيفي مخصص</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowAddRoleModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">معرف الدور الفريد (ID بالإنجليزية)</label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  pattern="[a-z0-9_]{3,30}"
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value)}
                  placeholder="flight_coordinator"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الدور بالعربية</label>
                <input
                  type="text"
                  required
                  value={newRoleNameAr}
                  onChange={(e) => setNewRoleNameAr(e.target.value)}
                  placeholder="منسق حجوزات الطيران"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الدور بالإنجليزية</label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Flight Coordinator"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الوصف</label>
                <textarea
                  rows={2}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="مهام ومسؤوليات هذا الدور..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نظام الوصول</label>
                <select
                  value={newRoleSystem}
                  onChange={(e) => setNewRoleSystem(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-[#0B2E57] outline-none"
                >
                  <option value="crm">نظام CRM</option>
                  <option value="admin">لوحة إدارة الموقع</option>
                  <option value="both">النظامان معاً</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">الصلاحيات الممنوحة لهذا الدور:</label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-1.5 divide-y divide-slate-100">
                  {permissionsRegistry.map((p) => {
                    const isChecked = newRolePermissions.includes(p.key);
                    return (
                      <label key={p.key} className="pt-1.5 flex items-center justify-between text-xs cursor-pointer">
                        <span className="font-medium text-slate-700">{p.labelAr}</span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewRolePermissions([...newRolePermissions, p.key]);
                            } else {
                              setNewRolePermissions(newRolePermissions.filter((k) => k !== p.key));
                            }
                          }}
                          className="w-4 h-4 rounded text-[#004AA5]"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2.5 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white text-xs sm:text-sm font-bold cursor-pointer shadow-md disabled:opacity-60"
                >
                  {busy ? 'جاري الإنشاء...' : 'إضافة الدور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
