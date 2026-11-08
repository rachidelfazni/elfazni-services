import { useUITranslation } from "../../i18n/useUITranslation";
import React, { useState } from "react";
import { useAuth, getPermissionsForRole } from "../../context/AuthContext";
import {
  SystemUser,
  UserRole,
  PasswordResetRequest,
  ROLE_DEFINITIONS,
} from "../../types";
import {
  Users,
  UserPlus,
  KeyRound,
  Shield,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Lock,
  Phone,
  Mail,
  UserCheck,
  UserX,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  CalendarCheck,
  Plane,
  Receipt,
  FileSpreadsheet,
  Clock,
  MessageSquare,
  Check,
} from "lucide-react";

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUserProfile?: () => void;
  defaultTab?: "users" | "requests";
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  defaultTab = "users",
}) => {
  const { ui, isRTL } = useUITranslation();
  const {
    user: currentUser,
    users,
    addUser,
    updateUser,
    updateUserPassword,
    deleteUser,
    passwordResetRequests,
    pendingResetRequestsCount,
    resolvePasswordResetRequest,
    deletePasswordResetRequest,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"users" | "requests">(defaultTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Add User Form Modal
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("editor");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCanAccessConsulate, setNewCanAccessConsulate] = useState(true);
  const [newCanAccessFlights, setNewCanAccessFlights] = useState(true);
  const [newCanAccessAccounting, setNewCanAccessAccounting] = useState(false);
  const [newCanAccessDebts, setNewCanAccessDebts] = useState(false);
  const [newCanAccessReports, setNewCanAccessReports] = useState(false);
  const [newCanManageUsers, setNewCanManageUsers] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Edit Password Modal
  const [passwordTargetUser, setPasswordTargetUser] =
    useState<SystemUser | null>(null);
  const [targetNewPassword, setTargetNewPassword] = useState("");
  const [showTargetPass, setShowTargetPass] = useState(false);

  // Edit User Details Modal
  const [editTargetUser, setEditTargetUser] = useState<SystemUser | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("editor");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCanAccessConsulate, setEditCanAccessConsulate] = useState(true);
  const [editCanAccessFlights, setEditCanAccessFlights] = useState(true);
  const [editCanAccessAccounting, setEditCanAccessAccounting] = useState(false);
  const [editCanAccessDebts, setEditCanAccessDebts] = useState(false);
  const [editCanAccessReports, setEditCanAccessReports] = useState(false);
  const [editCanManageUsers, setEditCanManageUsers] = useState(false);

  // Resolve Request Modal State
  const [selectedRequest, setSelectedRequest] =
    useState<PasswordResetRequest | null>(null);
  const [resolvePass, setResolvePass] = useState("");

  if (!isOpen) return null;

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  const applyRoleDefaultsToAdd = (role: UserRole) => {
    setNewRole(role);
    const perms = getPermissionsForRole(role);
    setNewCanAccessConsulate(perms.canAccessConsulate);
    setNewCanAccessFlights(perms.canAccessFlights);
    setNewCanAccessAccounting(perms.canAccessAccounting);
    setNewCanAccessDebts(perms.canAccessDebts);
    setNewCanAccessReports(perms.canAccessReports);
    setNewCanManageUsers(perms.canManageUsers);
  };

  const applyRoleDefaultsToEdit = (role: UserRole) => {
    setEditRole(role);
    const perms = getPermissionsForRole(role);
    setEditCanAccessConsulate(perms.canAccessConsulate);
    setEditCanAccessFlights(perms.canAccessFlights);
    setEditCanAccessAccounting(perms.canAccessAccounting);
    setEditCanAccessDebts(perms.canAccessDebts);
    setEditCanAccessReports(perms.canAccessReports);
    setEditCanManageUsers(perms.canManageUsers);
  };

  // Presets
  const applyPresetToAdd = (
    preset: "consulate" | "flights" | "editor" | "finance" | "admin",
  ) => {
    if (preset === "consulate") {
      setNewCanAccessConsulate(true);
      setNewCanAccessFlights(false);
      setNewCanAccessAccounting(false);
      setNewCanAccessDebts(false);
      setNewCanAccessReports(false);
      setNewCanManageUsers(false);
      setNewRole("agent");
    } else if (preset === "flights") {
      setNewCanAccessConsulate(false);
      setNewCanAccessFlights(true);
      setNewCanAccessAccounting(false);
      setNewCanAccessDebts(false);
      setNewCanAccessReports(false);
      setNewCanManageUsers(false);
      setNewRole("agent");
    } else if (preset === "editor") {
      applyRoleDefaultsToAdd("editor");
    } else if (preset === "finance") {
      applyRoleDefaultsToAdd("accountant");
    } else if (preset === "admin") {
      applyRoleDefaultsToAdd("admin");
    }
  };

  const applyPresetToEdit = (
    preset: "consulate" | "flights" | "editor" | "finance" | "admin",
  ) => {
    if (preset === "consulate") {
      setEditCanAccessConsulate(true);
      setEditCanAccessFlights(false);
      setEditCanAccessAccounting(false);
      setEditCanAccessDebts(false);
      setEditCanAccessReports(false);
      setEditCanManageUsers(false);
      setEditRole("agent");
    } else if (preset === "flights") {
      setEditCanAccessConsulate(false);
      setEditCanAccessFlights(true);
      setEditCanAccessAccounting(false);
      setEditCanAccessDebts(false);
      setEditCanAccessReports(false);
      setEditCanManageUsers(false);
      setEditRole("agent");
    } else if (preset === "editor") {
      applyRoleDefaultsToEdit("editor");
    } else if (preset === "finance") {
      applyRoleDefaultsToEdit("accountant");
    } else if (preset === "admin") {
      applyRoleDefaultsToEdit("admin");
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addUser({
      username: newUsername,
      password: newPassword,
      displayName: newDisplayName,
      role: newRole,
      email: newEmail,
      phone: newPhone,
      canAccessConsulate: newCanAccessConsulate,
      canAccessFlights: newCanAccessFlights,
      canAccessAccounting: newCanAccessAccounting,
      canAccessDebts: newCanAccessDebts,
      canAccessReports: newCanAccessReports,
      canManageUsers: newCanManageUsers,
    });

    if (res.success) {
      showNotification(
        "success",
        res.message || "تمت إضافة المستخدم وتعيين صلاحياته بنجاح",
      );
      setIsAddingUser(false);
      setNewUsername("");
      setNewPassword("");
      setNewDisplayName("");
      setNewEmail("");
      setNewPhone("");
      setNewRole("agent");
      setNewCanAccessConsulate(true);
      setNewCanAccessFlights(true);
      setNewCanAccessAccounting(false);
      setNewCanAccessDebts(false);
      setNewCanAccessReports(false);
      setNewCanManageUsers(false);
    } else {
      showNotification("error", res.message || "فشلت إضافة المستخدم");
    }
  };

  const handleUpdateUserPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetUser) return;
    const res = updateUserPassword(passwordTargetUser.id, targetNewPassword);
    if (res.success) {
      showNotification(
        "success",
        `تم تغيير كلمة مرور المستخدم (${passwordTargetUser.displayName}) بنجاح!`,
      );
      setPasswordTargetUser(null);
      setTargetNewPassword("");
    } else {
      showNotification("error", res.message || "فشل تغيير كلمة المرور");
    }
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTargetUser) return;
    const res = updateUser(editTargetUser.id, {
      displayName: editDisplayName,
      role: editRole,
      email: editEmail,
      phone: editPhone,
      canAccessConsulate: editCanAccessConsulate,
      canAccessFlights: editCanAccessFlights,
      canAccessAccounting: editCanAccessAccounting,
      canAccessDebts: editCanAccessDebts,
      canAccessReports: editCanAccessReports,
      canManageUsers: editCanManageUsers,
    });
    if (res.success) {
      showNotification("success", "تم تحديث بيانات المستخدم وصلاحياته بنجاح");
      setEditTargetUser(null);
    } else {
      showNotification("error", res.message || "فشل التحديث");
    }
  };

  const handleToggleStatus = (target: SystemUser) => {
    if (target.username === "elfazni.admin" || target.id === "root-admin") {
      showNotification("error", "لا يمكن تعطيل الحساب الأساسي للإدارة العامة");
      return;
    }
    const res = updateUser(target.id, { isActive: !target.isActive });
    if (res.success) {
      showNotification(
        "success",
        target.isActive
          ? `تم تعطيل حساب (${target.displayName})`
          : `تم تفعيل حساب (${target.displayName}) بنجاح`,
      );
    }
  };

  const handleDeleteUser = (target: SystemUser) => {
    if (
      confirm(
        `هل أنت متأكد من حذف المستخدم (${target.displayName}) نهائياً من النظام؟`,
      )
    ) {
      const res = deleteUser(target.id);
      if (res.success) {
        showNotification("success", res.message || "تم حذف المستخدم");
      } else {
        showNotification("error", res.message || "تعذر حذف المستخدم");
      }
    }
  };

  const generateRandomPassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 9; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleName = (role: UserRole) => {
    return ui(ROLE_DEFINITIONS[role]?.label || role);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-crm-dialog="UserManagementModal"
      className="crm-dialog fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0B2E57]/60 backdrop-blur-md animate-fade-in select-none"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="bg-white border border-[#D7E7F7]/90 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="crm-dialog-header p-5 sm:p-6 bg-[#F8FAFC] border-b border-[#D7E7F7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-[#0B2E57]">
                  {ui("إدارة المستخدمين والصلاحيات")}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EEF3FA] text-amber-300 border border-[#D7E7F7] font-mono">
                  {users.length} {ui("مستخدمين")}
                </span>
                {pendingResetRequestsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-700 border border-red-500/40 animate-pulse">
                    {pendingResetRequestsCount} {ui("طلبات استعادة")}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8190A3] mt-0.5">
                {ui(
                  "تحديد الصلاحيات المخصصة لكل موظف (مواعيد القنصلية، الطيران، المحاسبة والمالية)",
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingUser(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{ui("+ إضافة مستخدم جديد")}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#8190A3] hover:text-[#0B2E57] hover:bg-[#EEF3FA] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center border-b border-[#D7E7F7] bg-[#F8FAFC]/60 px-6 pt-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === "users"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-[#8190A3] hover:text-[#31516E]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>
              {ui("المستخدمون النشطون (")}
              {users.length})
            </span>
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === "requests"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-[#8190A3] hover:text-[#31516E]"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{ui("طلبات استعادة كلمة المرور")}</span>
            {pendingResetRequestsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-[#0B2E57] text-[10px] font-black">
                {pendingResetRequestsCount}
              </span>
            )}
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="px-6 pt-4">
            <div
              className={`p-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 ${
                feedback.type === "success"
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-200"
                  : "bg-red-500/20 border border-red-500/40 text-red-200"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{ui(feedback.message)}</span>
            </div>
          </div>
        )}

        {/* Tab 1: Users List */}
        {activeTab === "users" && (
          <>
            {/* Filter and Search Bar */}
            <div className="p-4 bg-[#F8FAFC]/40 border-b border-[#D7E7F7]/80 flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-[#8190A3] absolute right-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={ui("بحث بالاسم أو اسم المستخدم أو الهاتف...")}
                  className="w-full pr-10 pl-4 py-2 bg-white border border-[#D7E7F7]/80 rounded-xl text-[#0B2E57] text-xs placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#8190A3]">{ui("تصفية حسب الدور:")}</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-white border border-[#D7E7F7] rounded-xl px-3 py-2 text-xs text-[#31516E] focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">{ui("كافة الأدوار")}</option>
                  <option value="super_admin">{ui("مدير عام (Root)")}</option>
                  <option value="admin">{ui("مدير نظام (Admin)")}</option>
                  <option value="accountant">
                    {ui("محاسب مالي (Accountant)")}
                  </option>
                  <option value="editor">{ui("محرر عمليات (Editor)")}</option>
                  <option value="agent">{ui("موظف حجوزات (Agent)")}</option>
                  <option value="viewer">{ui("مشاهد فقط (Viewer)")}</option>
                </select>
              </div>
            </div>

            {/* Users Table / List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-[#8190A3] text-sm">
                  {ui("لا يوجد مستخدمون يطابقون خيارات البحث")}
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isRoot =
                    u.username === "elfazni.admin" || u.id === "root-admin";
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <div
                      key={u.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? "bg-[#EEF3FA]/70 border-amber-500/40"
                          : "bg-white/60 border-[#D7E7F7] hover:border-[#D7E7F7]"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* User Info */}
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={
                                u.avatarUrl ||
                                "/admin/crm/assets/founder-rachid-elfazni-v2.webp"
                              }
                              alt={u.displayName}
                              className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-700"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  "/admin/crm/assets/founder-rachid-elfazni-v2.webp";
                              }}
                            />
                            <span
                              className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full ring-2 ring-slate-900 ${
                                u.isActive ? "bg-emerald-400" : "bg-red-500"
                              }`}
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-[#0B2E57]">
                                {u.displayName}
                              </span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  {ui("أنت (الحساب الحالي)")}
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isRoot
                                    ? "bg-amber-400 text-slate-950 font-black"
                                    : ROLE_DEFINITIONS[u.role]?.badgeColor ||
                                      "bg-[#2A83D5]/20 text-[#82B1E4]"
                                }`}
                              >
                                {getRoleName(u.role)}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-[#8190A3] mt-1 flex-wrap">
                              <span className="font-mono text-amber-300 font-bold">
                                @{u.username}
                              </span>
                              {u.phone && <span dir="ltr">{u.phone}</span>}
                              {u.email && <span>{u.email}</span>}
                            </div>

                            {/* Module Permissions Chips */}
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {u.canAccessConsulate && (
                                <span className="crm-access-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0B2E57]/40 text-[#82B1E4] border border-[#004AA5]/40">
                                  <CalendarCheck className="w-3 h-3 text-[#4083D0]" />
                                  <span>{ui("القنصلية")}</span>
                                </span>
                              )}
                              {u.canAccessFlights && (
                                <span className="crm-access-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0B2E57]/50 text-[#B9D5F6] border border-[#2A83D5]/40">
                                  <Plane className="w-3 h-3 text-[#8FBAEE]" />
                                  <span>{ui("الطيران")}</span>
                                </span>
                              )}
                              {u.canAccessAccounting && (
                                <span className="crm-access-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-900/40 text-emerald-700 border border-emerald-700/40">
                                  <Receipt className="w-3 h-3 text-emerald-700" />
                                  <span>{ui("المحاسبة")}</span>
                                </span>
                              )}
                              {u.canAccessDebts && (
                                <span className="crm-access-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-yellow-900/40 text-yellow-300 border border-yellow-700/40">
                                  <span>{ui("الديون")}</span>
                                </span>
                              )}
                              {u.canAccessReports && (
                                <span className="crm-access-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#CC9048]/30 text-[#E3C88F] border border-[#CC9048]/40">
                                  <FileSpreadsheet className="w-3 h-3 text-[#E3C88F]" />
                                  <span>{ui("التقارير")}</span>
                                </span>
                              )}
                              {u.canManageUsers && (
                                <span className="crm-access-badge inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-900/40 text-amber-300 border border-amber-700/40">
                                  <Shield className="w-3 h-3 text-amber-400" />
                                  <span>{ui("إدارة المستخدمين")}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          {/* Change Password */}
                          <button
                            onClick={() => {
                              setPasswordTargetUser(u);
                              setTargetNewPassword("");
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#EEF3FA] hover:bg-slate-700 text-amber-300 border border-[#D7E7F7] hover:border-amber-500/50 flex items-center gap-1.5 transition cursor-pointer"
                            title={ui("تغيير كلمة المرور لهذا المستخدم مباشرة")}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>{ui("تعديل كلمة المرور")}</span>
                          </button>

                          {/* Edit Details & Permissions */}
                          <button
                            onClick={() => {
                              setEditTargetUser(u);
                              setEditDisplayName(u.displayName);
                              setEditRole(u.role);
                              setEditEmail(u.email || "");
                              setEditPhone(u.phone || "");
                              setEditCanAccessConsulate(
                                u.canAccessConsulate ?? true,
                              );
                              setEditCanAccessFlights(
                                u.canAccessFlights ?? true,
                              );
                              setEditCanAccessAccounting(
                                u.canAccessAccounting ?? false,
                              );
                              setEditCanAccessDebts(u.canAccessDebts ?? false);
                              setEditCanAccessReports(
                                u.canAccessReports ?? false,
                              );
                              setEditCanManageUsers(u.canManageUsers ?? false);
                            }}
                            className="p-1.5 rounded-xl text-[#5E7086] hover:text-[#0B2E57] bg-[#EEF3FA] hover:bg-slate-700 border border-[#D7E7F7] transition cursor-pointer"
                            title={ui("تعديل البيانات وتخصيص الصلاحيات")}
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Toggle Active Status */}
                          {!isRoot && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`p-1.5 rounded-xl border transition cursor-pointer ${
                                u.isActive
                                  ? "text-emerald-700 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
                                  : "text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
                              }`}
                              title={
                                u.isActive
                                  ? "تعطيل الحساب مؤقتاً"
                                  : "تفعيل الحساب"
                              }
                            >
                              {u.isActive ? (
                                <UserCheck className="w-4 h-4" />
                              ) : (
                                <UserX className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Delete User */}
                          {!isRoot && !isCurrent && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-xl text-red-400 hover:text-red-700 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition cursor-pointer"
                              title={ui("حذف المستخدم نهائياً")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Tab 2: Password Reset Requests */}
        {activeTab === "requests" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-[#5E7086]">
                <span className="font-bold text-amber-300 block mb-0.5">
                  {ui("لوحة إشعارات استعادة كلمات المرور المعلقة:")}
                </span>
                {ui(
                  "عندما يطلب أي موظف أو مستخدم استعادة كلمة مروره من شاشة الدخول، يظهر إشعاره هنا فوراً لتقوم بتوليد كلمة مرور جديدة له وإرسالها عبر واتساب بضغطة زر.",
                )}
              </div>
            </div>

            {passwordResetRequests.length === 0 ? (
              <div className="text-center py-16 text-[#8190A3] text-sm">
                <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto mb-2 opacity-60" />
                <span>
                  {ui(
                    "لا توجد طلبات استعادة كلمة مرور حالياً، كل الحسابات منتظمة!",
                  )}
                </span>
              </div>
            ) : (
              passwordResetRequests.map((req) => {
                const isPending = req.status === "pending";
                const targetUser = users.find(
                  (u) =>
                    u.username.toLowerCase() === req.username.toLowerCase(),
                );

                return (
                  <div
                    key={req.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isPending
                        ? "bg-red-950/20 border-red-500/40 shadow-sm"
                        : "bg-white/50 border-[#D7E7F7] opacity-80"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#0B2E57] font-mono">
                            @{req.username}
                          </span>
                          {targetUser && (
                            <span className="text-xs text-[#5E7086] font-bold">
                              ({targetUser.displayName})
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              isPending
                                ? "bg-red-500 text-[#0B2E57] animate-pulse"
                                : "bg-emerald-500/20 text-emerald-700 border border-emerald-500/40"
                            }`}
                          >
                            {isPending
                              ? ui("بانتظار إعادة التعيين")
                              : ui("تمت المعالجة")}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-[#8190A3] mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>
                              {new Date(req.requestedAt).toLocaleString(
                                "ar-SA",
                              )}
                            </span>
                          </span>
                          {req.contactInfo && (
                            <span className="flex items-center gap-1 text-amber-300">
                              <Phone className="w-3.5 h-3.5" />
                              <span dir="ltr">{req.contactInfo}</span>
                            </span>
                          )}
                          {req.notes && (
                            <span className="text-[#5E7086] italic">
                              «{req.notes}»
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Request Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {isPending && (
                          <button
                            onClick={() => {
                              setSelectedRequest(req);
                              setResolvePass(generateRandomPassword());
                            }}
                            className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>{ui("تعيين كلمة مرور جديدة")}</span>
                          </button>
                        )}

                        {targetUser?.phone && (
                          <a
                            href={`https://wa.me/${targetUser.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`مرحباً ${targetUser.displayName}، بخصوص طلب استعادة كلمة المرور في نظام ELFAZNI SERVICES CRM، يرجى التواصل لاعتماد الرمز الجديد.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[#0B2E57] transition"
                            title={ui("إرسال رسالة واتساب للمستخدم")}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        )}

                        <button
                          onClick={() => deletePasswordResetRequest(req.id)}
                          className="p-2 rounded-xl text-[#8190A3] hover:text-red-400 bg-[#EEF3FA] hover:bg-slate-700 transition"
                          title={ui("حذف الطلب من السجل")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Modal Footer Note */}
        <div className="p-4 bg-[#F8FAFC] border-t border-[#D7E7F7] text-xs text-[#8190A3] flex items-center justify-between">
          <span>
            {ui(
              "الحساب الجذري الأساسي (Root) يمتلك حق المراقبة والتحكم الكامل في كافة الأقسام",
            )}
          </span>
          <span className="font-mono text-amber-300 font-bold">
            {ui("ELFAZNI SERVICES Multi-User CRM")}
          </span>
        </div>
      </div>

      {/* Sub-modal: Add New User Form with Granular Permissions */}
      {isAddingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#F8FAFC]/85 backdrop-blur-md">
          <div className="bg-white border border-amber-500/40 rounded-3xl w-full max-w-xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#D7E7F7] mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-[#0B2E57]">
                  {ui("إضافة مستخدم جديد وتحديد الصلاحيات")}
                </h3>
              </div>
              <button
                onClick={() => setIsAddingUser(false)}
                className="text-[#8190A3] hover:text-[#0B2E57]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Shortcuts */}
            <div className="mb-4 p-3 bg-[#F8FAFC]/70 rounded-2xl border border-[#D7E7F7]">
              <span className="block text-[11px] font-bold text-amber-300 mb-2">
                {ui("⚡ تخصيص سريع للصلاحيات حسب الدور الوظيفي:")}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => applyPresetToAdd("editor")}
                  className="px-2 py-1.5 rounded-lg bg-[#0B2E57]/50 hover:bg-[#004AA5]/50 text-[#B9D5F6] border border-[#2A83D5]/50 font-bold text-center transition cursor-pointer"
                >
                  {ui("✏️ محرر (Editor)")}
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetToAdd("finance")}
                  className="px-2 py-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-200 border border-emerald-700/50 font-bold text-center transition cursor-pointer"
                >
                  {ui("💰 محاسب مالي")}
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetToAdd("admin")}
                  className="px-2 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-center transition cursor-pointer"
                >
                  {ui("👑 مدير (Admin)")}
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetToAdd("consulate")}
                  className="px-2 py-1.5 rounded-lg bg-[#0B2E57]/40 hover:bg-[#0B2E57]/60 text-[#B7CFEA] border border-[#004AA5]/50 font-bold text-center transition cursor-pointer"
                >
                  {ui("🏛️ مواعيد فقط")}
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetToAdd("flights")}
                  className="px-2 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-700/50 font-bold text-center transition cursor-pointer"
                >
                  {ui("✈️ طيران فقط")}
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#5E7086] mb-1">
                    {ui("اسم المستخدم (Username)")}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder={ui("مثال: agent.morocco")}
                    required
                    dir="ltr"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl text-[#0B2E57] text-xs font-mono text-left focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#5E7086] mb-1">
                    {ui("الاسم المعروض (Display Name)")}
                    <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    placeholder={ui("مثال: أمين — مكتب الرباط")}
                    required
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl text-[#0B2E57] text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#5E7086] mb-1">
                    {ui("الدور الأساسي (Role)")}
                    <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) =>
                      applyRoleDefaultsToAdd(e.target.value as UserRole)
                    }
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl text-[#0B2E57] text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    <option value="admin">{ui("مدير نظام (Admin)")}</option>
                    <option value="accountant">
                      {ui("محاسب مالي (Accountant)")}
                    </option>
                    <option value="editor">{ui("محرر عمليات (Editor)")}</option>
                    <option value="agent">{ui("موظف حجوزات (Agent)")}</option>
                    <option value="viewer">{ui("مشاهد فقط (Viewer)")}</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-[#5E7086]">
                    {ui("كلمة المرور الابتدائية")}
                    <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPassword(generateRandomPassword());
                      setShowNewPass(true);
                    }}
                    className="text-amber-400 hover:underline text-[11px] font-bold"
                  >
                    {ui("توليد كلمة مرور قوية تلقائياً")}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    dir="ltr"
                    className="w-full pl-10 pr-3 py-2 bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl text-[#0B2E57] text-xs font-mono text-left focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8190A3]"
                  >
                    {showNewPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5E7086] mb-1">
                    {ui("رقم الهاتف للتواصل")}
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+90 552..."
                    dir="ltr"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl text-[#0B2E57] text-xs text-left focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#5E7086] mb-1">
                    {ui("البريد الإلكتروني")}
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@elfazni.com"
                    dir="ltr"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl text-[#0B2E57] text-xs text-left focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Granular Module Permissions Checkboxes */}
              <div className="pt-2 border-t border-[#D7E7F7]">
                <span className="block font-bold text-[#0B2E57] mb-2 text-xs">
                  {ui("صلاحيات الوصول للأقسام والبيانات (Granular RBAC):")}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#F8FAFC] p-3 rounded-2xl border border-[#D7E7F7]">
                  <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCanAccessConsulate}
                      onChange={(e) =>
                        setNewCanAccessConsulate(e.target.checked)
                      }
                      className="w-4 h-4 text-amber-500 rounded bg-white border-[#D7E7F7]"
                    />
                    <div>
                      <span className="font-bold text-[#31516E] block">
                        {ui("🏛️ مواعيد القنصلية")}
                      </span>
                      <span className="text-[10px] text-[#8190A3]">
                        {ui("إضافة وتعديل وحالات المواعيد")}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCanAccessFlights}
                      onChange={(e) => setNewCanAccessFlights(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded bg-white border-[#D7E7F7]"
                    />
                    <div>
                      <span className="font-bold text-[#31516E] block">
                        {ui("✈️ حجوزات الطيران")}
                      </span>
                      <span className="text-[10px] text-[#8190A3]">
                        {ui("تسجيل التذاكر وأسعار التكلفة")}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCanAccessAccounting}
                      onChange={(e) =>
                        setNewCanAccessAccounting(e.target.checked)
                      }
                      className="w-4 h-4 text-amber-500 rounded bg-white border-[#D7E7F7]"
                    />
                    <div>
                      <span className="font-bold text-[#31516E] block">
                        {ui("💰 المالية والمحاسبة")}
                      </span>
                      <span className="text-[10px] text-[#8190A3]">
                        {ui("تسديد الدفعات والأرباح")}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCanAccessDebts}
                      onChange={(e) => setNewCanAccessDebts(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded bg-white border-[#D7E7F7]"
                    />
                    <div>
                      <span className="font-bold text-[#31516E] block">
                        {ui("📑 جدول الديون والمتبقي")}
                      </span>
                      <span className="text-[10px] text-[#8190A3]">
                        {ui("متابعة وتسوية ديون الزبائن")}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCanAccessReports}
                      onChange={(e) => setNewCanAccessReports(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded bg-white border-[#D7E7F7]"
                    />
                    <div>
                      <span className="font-bold text-[#31516E] block">
                        {ui("📊 التقارير والإحصائيات")}
                      </span>
                      <span className="text-[10px] text-[#8190A3]">
                        {ui("المجاميع والتقارير الشهرية")}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCanManageUsers}
                      onChange={(e) => setNewCanManageUsers(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded bg-white border-[#D7E7F7]"
                    />
                    <div>
                      <span className="font-bold text-amber-300 block">
                        {ui("👥 إدارة المستخدمين")}
                      </span>
                      <span className="text-[10px] text-[#8190A3]">
                        {ui("إضافة وتعديل حسابات الموظفين")}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#D7E7F7]">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-4 py-2 rounded-xl text-[#5E7086] hover:text-[#0B2E57] bg-[#EEF3FA] hover:bg-slate-700 font-bold transition cursor-pointer"
                >
                  {ui("إلغاء")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-black bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 transition shadow cursor-pointer"
                >
                  {ui("إنشاء المستخدم وحفظ الصلاحيات")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal: Edit User Details and Granular Permissions */}
      {editTargetUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#F8FAFC]/85 backdrop-blur-md">
          <div className="bg-white border border-[#D7E7F7] rounded-3xl w-full max-w-xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#D7E7F7] mb-4">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-[#0B2E57]">
                  {ui("تعديل صلاحيات المستخدم: (")}
                  {editTargetUser.displayName})
                </h3>
              </div>
              <button
                onClick={() => setEditTargetUser(null)}
                className="text-[#8190A3] hover:text-[#0B2E57]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Presets Shortcuts */}
            <div className="mb-4 p-3 bg-[#F8FAFC]/70 rounded-2xl border border-[#D7E7F7]">
              <span className="block text-[11px] font-bold text-amber-300 mb-2">
                {ui("⚡ تخصيص سريع للصلاحيات حسب الدور الوظيفي:")}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => applyPresetToEdit("editor")}
                  className="px-2 py-1.5 rounded-lg bg-[#0B2E57]/50 hover:bg-[#004AA5]/50 text-[#B9D5F6] border border-[#2A83D5]/50 font-bold text-center transition cursor-pointer"
                >
                  {ui("✏️ محرر (Editor)")}
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetToEdit("finance")}
                  className="px-2 py-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-200 border border-emerald-700/50 font-bold text-center transition cursor-pointer"
                >
                  {ui("💰 محاسب مالي")}
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetToEdit("admin")}
                  className="px-2 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-center transition cursor-pointer"
                >
                  {ui("👑 مدير (Admin)")}
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetToEdit("consulate")}
                  className="px-2 py-1.5 rounded-lg bg-[#0B2E57]/40 hover:bg-[#0B2E57]/60 text-[#B7CFEA] border border-[#004AA5]/50 font-bold text-center transition cursor-pointer"
                >
                  {ui("🏛️ مواعيد فقط")}
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetToEdit("flights")}
                  className="px-2 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-700/50 font-bold text-center transition cursor-pointer"
                >
                  {ui("✈️ طيران فقط")}
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5E7086] mb-1">
                    {ui("الاسم المعروض")}
                  </label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl text-[#0B2E57] text-xs focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#5E7086] mb-1">
                    {ui("المسمى / الدور (Role)")}
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) =>
                      applyRoleDefaultsToEdit(e.target.value as UserRole)
                    }
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl text-[#0B2E57] text-xs focus:border-amber-400 focus:outline-none cursor-pointer"
                  >
                    <option value="super_admin">{ui("مدير عام (Root)")}</option>
                    <option value="admin">{ui("مدير نظام (Admin)")}</option>
                    <option value="accountant">
                      {ui("محاسب مالي (Accountant)")}
                    </option>
                    <option value="editor">{ui("محرر عمليات (Editor)")}</option>
                    <option value="agent">
                      {ui("موظف مواعيد / طيران (Agent)")}
                    </option>
                    <option value="viewer">{ui("مشاهد فقط (Viewer)")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#5E7086] mb-1">
                    {ui("رقم الهاتف")}
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl text-[#0B2E57] text-xs text-left focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#5E7086] mb-1">
                    {ui("البريد الإلكتروني")}
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl text-[#0B2E57] text-xs text-left focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Granular Module Permissions Checkboxes */}
              <div className="pt-2 border-t border-[#D7E7F7]">
                <span className="block font-bold text-[#0B2E57] mb-2 text-xs">
                  {ui("صلاحيات الوصول للأقسام والبيانات (Granular RBAC):")}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#F8FAFC] p-3 rounded-2xl border border-[#D7E7F7]">
                  <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCanAccessConsulate}
                      onChange={(e) =>
                        setEditCanAccessConsulate(e.target.checked)
                      }
                      className="w-4 h-4 text-amber-500 rounded bg-white border-[#D7E7F7]"
                    />
                    <div>
                      <span className="font-bold text-[#31516E] block">
                        {ui("🏛️ مواعيد القنصلية")}
                      </span>
                      <span className="text-[10px] text-[#8190A3]">
                        {ui("إضافة وتعديل وحالات المواعيد")}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCanAccessFlights}
                      onChange={(e) =>
                        setEditCanAccessFlights(e.target.checked)
                      }
                      className="w-4 h-4 text-amber-500 rounded bg-white border-[#D7E7F7]"
                    />
                    <div>
                      <span className="font-bold text-[#31516E] block">
                        {ui("✈️ حجوزات الطيران")}
                      </span>
                      <span className="text-[10px] text-[#8190A3]">
                        {ui("تسجيل التذاكر وأسعار التكلفة")}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCanAccessAccounting}
                      onChange={(e) =>
                        setEditCanAccessAccounting(e.target.checked)
                      }
                      className="w-4 h-4 text-amber-500 rounded bg-white border-[#D7E7F7]"
                    />
                    <div>
                      <span className="font-bold text-[#31516E] block">
                        {ui("💰 المالية والمحاسبة")}
                      </span>
                      <span className="text-[10px] text-[#8190A3]">
                        {ui("تسديد الدفعات والأرباح")}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCanAccessDebts}
                      onChange={(e) => setEditCanAccessDebts(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded bg-white border-[#D7E7F7]"
                    />
                    <div>
                      <span className="font-bold text-[#31516E] block">
                        {ui("📑 جدول الديون والمتبقي")}
                      </span>
                      <span className="text-[10px] text-[#8190A3]">
                        {ui("متابعة وتسوية ديون الزبائن")}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCanAccessReports}
                      onChange={(e) =>
                        setEditCanAccessReports(e.target.checked)
                      }
                      className="w-4 h-4 text-amber-500 rounded bg-white border-[#D7E7F7]"
                    />
                    <div>
                      <span className="font-bold text-[#31516E] block">
                        {ui("📊 التقارير والإحصائيات")}
                      </span>
                      <span className="text-[10px] text-[#8190A3]">
                        {ui("المجاميع والتقارير الشهرية")}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-xl hover:bg-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCanManageUsers}
                      onChange={(e) => setEditCanManageUsers(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded bg-white border-[#D7E7F7]"
                    />
                    <div>
                      <span className="font-bold text-amber-300 block">
                        {ui("👥 إدارة المستخدمين")}
                      </span>
                      <span className="text-[10px] text-[#8190A3]">
                        {ui("إضافة وتعديل حسابات الموظفين")}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#D7E7F7]">
                <button
                  type="button"
                  onClick={() => setEditTargetUser(null)}
                  className="px-4 py-2 rounded-xl text-[#5E7086] hover:text-[#0B2E57] bg-[#EEF3FA] hover:bg-slate-700 font-bold transition cursor-pointer"
                >
                  {ui("إلغاء")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-black bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 transition shadow cursor-pointer"
                >
                  {ui("حفظ التعديلات والصلاحيات")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal: Quick Edit Password */}
      {passwordTargetUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#F8FAFC]/85 backdrop-blur-md">
          <div className="bg-white border border-amber-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#D7E7F7] mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-[#0B2E57]">
                  {ui("تغيير كلمة المرور لـ (")}
                  {passwordTargetUser.displayName})
                </h3>
              </div>
              <button
                onClick={() => setPasswordTargetUser(null)}
                className="text-[#8190A3] hover:text-[#0B2E57]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUserPassword} className="space-y-4">
              <p className="text-xs text-[#8190A3]">
                {ui("أدخل كلمة المرور الجديدة لحساب (@")}
                {passwordTargetUser.username}{" "}
                {ui("). سيتم تحديثها فوراً دون الحاجة لكلمة المرور القديمة.")}
              </p>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#5E7086]">
                    {ui("كلمة المرور الجديدة")}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetNewPassword(generateRandomPassword());
                      setShowTargetPass(true);
                    }}
                    className="text-amber-400 hover:underline text-[11px] font-bold"
                  >
                    {ui("توليد تلقائي")}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showTargetPass ? "text" : "password"}
                    value={targetNewPassword}
                    onChange={(e) => setTargetNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    dir="ltr"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl text-[#0B2E57] text-xs font-mono text-left focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTargetPass(!showTargetPass)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#8190A3]"
                  >
                    {showTargetPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordTargetUser(null)}
                  className="px-4 py-2 rounded-xl text-[#5E7086] hover:text-[#0B2E57] bg-[#EEF3FA] hover:bg-slate-700 text-xs font-bold transition"
                >
                  {ui("إلغاء")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-950 transition shadow"
                >
                  {ui("حفظ كلمة المرور الجديدة")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal: Resolve Password Reset Request */}
      {selectedRequest && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[#F8FAFC]/85 backdrop-blur-md">
          <div className="bg-white border border-emerald-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#D7E7F7] mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-black text-[#0B2E57]">
                  {ui("معالجة طلب استعادة كلمة المرور")}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-[#8190A3] hover:text-[#0B2E57]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#D7E7F7] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#8190A3]">{ui("اسم المستخدم:")}</span>
                  <span className="text-amber-300 font-mono font-bold">
                    @{selectedRequest.username}
                  </span>
                </div>
                {selectedRequest.contactInfo && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#8190A3]">
                      {ui("بيانات التواصل:")}
                    </span>
                    <span className="text-[#31516E]" dir="ltr">
                      {selectedRequest.contactInfo}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#5E7086] mb-1.5">
                  {ui("كلمة المرور الجديدة المقترحة للحساب:")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={resolvePass}
                    onChange={(e) => setResolvePass(e.target.value)}
                    dir="ltr"
                    className="flex-1 px-3 py-2.5 bg-[#F8FAFC] border border-amber-500/40 rounded-xl text-amber-300 font-mono font-bold text-sm text-left focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setResolvePass(generateRandomPassword())}
                    className="px-3 py-2.5 rounded-xl bg-[#EEF3FA] hover:bg-slate-700 text-[#31516E] font-bold"
                    title={ui("توليد كلمة مرور أخرى")}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D7E7F7]">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 rounded-xl text-[#5E7086] bg-[#EEF3FA] hover:bg-slate-700 font-bold"
                >
                  {ui("إلغاء")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const res = resolvePasswordResetRequest(
                      selectedRequest.id,
                      resolvePass,
                    );
                    if (res.success) {
                      showNotification(
                        "success",
                        `تم تعيين كلمة المرور الجديدة للمستخدم (${selectedRequest.username}) بنجاح!`,
                      );
                      setSelectedRequest(null);
                    } else {
                      showNotification("error", res.message);
                    }
                  }}
                  className="px-4 py-2 rounded-xl font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow"
                >
                  {ui("اعتماد كلمة المرور وإغلاق الطلب")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
