import { useUITranslation } from "../../i18n/useUITranslation";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { ROLE_DEFINITIONS, UserRole } from "../../types";
import {
  User,
  Lock,
  Mail,
  Phone,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  Eye,
  EyeOff,
  Calendar,
  Save,
  Upload,
  Image as ImageIcon,
  Camera,
  FolderOpen,
  Check,
  Loader2,
  Trash2,
} from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUserManagement?: () => void;
}

interface FolderAvatarItem {
  name: string;
  path: string;
  label?: string;
  mtime?: number;
  isCustom?: boolean;
}

const DEFAULT_APP_FOLDER_AVATARS: FolderAvatarItem[] = [
  {
    name: "founder-rachid-elfazni-v2.webp",
    path: "/admin/crm/assets/founder-rachid-elfazni-v2.webp",
    label: "رشيد الفزني (الرسمية)",
    isCustom: false,
  },
  {
    name: "logo-vertical.svg",
    path: "/admin/crm/assets/logo-vertical.svg",
    label: "شعار ELFAZNI العمودي",
    isCustom: false,
  },
  {
    name: "logo-horizontal.svg",
    path: "/admin/crm/assets/logo-horizontal.svg",
    label: "شعار ELFAZNI الأفقي",
    isCustom: false,
  },
  {
    name: "airplane-blue-gold-v2.webp",
    path: "/admin/crm/assets/airplane-blue-gold-v2.webp",
    label: "أيقونة الطيران",
    isCustom: false,
  },
  {
    name: "phone-services-transparent.webp",
    path: "/admin/crm/assets/phone-services-transparent.webp",
    label: "خدمات الفزني",
    isCustom: false,
  },
  {
    name: "elfazni-social-cover-v5.png",
    path: "/admin/crm/assets/elfazni-social-cover-v5.png",
    label: "غلاف المؤسسة",
    isCustom: false,
  },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenUserManagement,
}) => {
  const { ui, isRTL, language } = useUITranslation();
  const { user, canManageSystemUsers, updateMyProfile, changeMyPassword } =
    useAuth();

  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");

  // Profile Form State
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(
    user?.avatarUrl || "/admin/crm/assets/founder-rachid-elfazni-v2.webp",
  );

  // App Folder Avatars & Upload State
  const [folderAvatars, setFolderAvatars] = useState<FolderAvatarItem[]>(
    DEFAULT_APP_FOLDER_AVATARS,
  );
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Status message state
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const loadFolderAvatars = useCallback(async () => {
    try {
      const resp = await fetch(`/api/avatars?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!resp.ok) return;
      const data = await resp.json();
      if (data?.ok && Array.isArray(data.files)) {
        const defaultLabels = new Map<string, string>(
          DEFAULT_APP_FOLDER_AVATARS.map((item) => [
            item.path,
            item.label || item.name,
          ]),
        );
        const mergedMap = new Map<string, FolderAvatarItem>();

        // Place custom uploaded images first so newly uploaded files are immediately visible
        data.files.forEach(
          (f: {
            name: string;
            path: string;
            mtime?: number;
            isCustom?: boolean;
          }) => {
            if (f.isCustom) {
              mergedMap.set(f.path, {
                name: f.name,
                path: f.path,
                label: defaultLabels.get(f.path) || f.name,
                mtime: f.mtime,
                isCustom: true,
              });
            }
          },
        );

        // Then default app folder avatars
        DEFAULT_APP_FOLDER_AVATARS.forEach((item) => {
          if (!mergedMap.has(item.path)) {
            mergedMap.set(item.path, item);
          }
        });

        // Then any remaining system files in /assets
        data.files.forEach(
          (f: {
            name: string;
            path: string;
            mtime?: number;
            isCustom?: boolean;
          }) => {
            if (!mergedMap.has(f.path)) {
              mergedMap.set(f.path, {
                name: f.name,
                path: f.path,
                label: defaultLabels.get(f.path) || f.name,
                mtime: f.mtime,
                isCustom: Boolean(f.isCustom),
              });
            }
          },
        );

        setFolderAvatars(Array.from(mergedMap.values()));
      }
    } catch {
      // Keep default folder avatars if endpoint is unavailable
    }
  }, []);

  useEffect(() => {
    if (isOpen && user) {
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAvatarUrl(user.avatarUrl || "/admin/crm/assets/founder-rachid-elfazni-v2.webp");
      loadFolderAvatars();
    }
  }, [isOpen, user, loadFolderAvatars]);

  if (!isOpen || !user) return null;

  const getDisplaySrc = (pathOrUrl: string) => {
    if (!pathOrUrl) return "/admin/crm/assets/founder-rachid-elfazni-v2.webp";
    if (previewMap[pathOrUrl]) return previewMap[pathOrUrl];
    return pathOrUrl;
  };

  const handleSelectPresetAvatar = (selectedPath: string) => {
    setAvatarUrl(selectedPath);
    updateMyProfile({
      displayName,
      email,
      phone,
      avatarUrl: selectedPath,
    });
    setFeedback({
      type: "success",
      message: `تم اختيار وتعيين الصورة الرمزية (${selectedPath}) بنجاح!`,
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDeleteCustomAvatar = async (
    e: React.MouseEvent,
    item: FolderAvatarItem,
  ) => {
    e.stopPropagation();
    try {
      const resp = await fetch("/api/upload-avatar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: item.name }),
      });
      if (resp.ok) {
        if (avatarUrl === item.path) {
          const fallback = "/admin/crm/assets/founder-rachid-elfazni-v2.webp";
          setAvatarUrl(fallback);
          updateMyProfile({
            displayName,
            email,
            phone,
            avatarUrl: fallback,
          });
        }
        await loadFolderAvatars();
        setFeedback({
          type: "success",
          message: `تم حذف الصورة (${item.name}) من مجلد التطبيق.`,
        });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      // Ignore delete error
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFeedback({
        type: "error",
        message: "يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, SVG)",
      });
      return;
    }

    setIsUploadingAvatar(true);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result || "");
      try {
        // Upload directly to /public/assets/ in the app folder
        const resp = await fetch("/api/upload-avatar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            dataUrl,
          }),
        });

        const result = await resp.json();
        if (resp.ok && result?.ok && result.path) {
          const savedPath: string = result.path;
          setPreviewMap((prev) => ({ ...prev, [savedPath]: dataUrl }));
          setAvatarUrl(savedPath);
          updateMyProfile({
            displayName,
            email,
            phone,
            avatarUrl: savedPath,
          });
          await loadFolderAvatars();
          setFeedback({
            type: "success",
            message: `تم رفع وحفظ الصورة في مجلد التطبيق بنجاح: ${savedPath}`,
          });
        } else {
          // Fallback to dataUrl if server write is unavailable
          setAvatarUrl(dataUrl);
          updateMyProfile({
            displayName,
            email,
            phone,
            avatarUrl: dataUrl,
          });
          setFeedback({
            type: "success",
            message: "تم تحديث الصورة الرمزية وحفظها في الملف الشخصي بنجاح!",
          });
        }
      } catch {
        setAvatarUrl(dataUrl);
        updateMyProfile({
          displayName,
          email,
          phone,
          avatarUrl: dataUrl,
        });
        setFeedback({
          type: "success",
          message: "تم تحديث الصورة الرمزية وحفظها في الملف الشخصي بنجاح!",
        });
      } finally {
        setIsUploadingAvatar(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setTimeout(() => setFeedback(null), 4500);
      }
    };

    reader.onerror = () => {
      setIsUploadingAvatar(false);
      setFeedback({ type: "error", message: "تعذر قراءة ملف الصورة المحدد" });
    };

    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const res = updateMyProfile({
      displayName,
      email,
      phone,
      avatarUrl,
    });

    if (res.success) {
      setFeedback({
        type: "success",
        message: "تم حفظ وتحديث بيانات الملف الشخصي بنجاح!",
      });
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({
        type: "error",
        message: res.message || "حدث خطأ أثناء التحديث",
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword !== confirmPassword) {
      setFeedback({
        type: "error",
        message: "كلمة المرور الجديدة غير متطابقة مع التأكيد!",
      });
      return;
    }

    if (newPassword.length < 4) {
      setFeedback({
        type: "error",
        message: "كلمة المرور يجب أن لا تقل عن 4 خانات",
      });
      return;
    }

    const res = await changeMyPassword(currentPassword, newPassword);
    if (res.success) {
      setFeedback({
        type: "success",
        message: "تم تغيير كلمة المرور بنجاح! احتفظ ببياناتك الجديدة.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback({
        type: "error",
        message: res.message || "فشل تغيير كلمة المرور",
      });
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const def = ROLE_DEFINITIONS[role];
    if (!def) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-700 text-[#5E7086]">
          {ui("مستخدم نظام")}
        </span>
      );
    }
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-black ${def.badgeColor}`}
      >
        {ui(def.label)}
      </span>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-crm-dialog="UserProfileModal"
      className="crm-dialog fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B2E57]/60 backdrop-blur-md animate-fade-in select-none"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Hidden File Input for Uploading Avatar into /public/assets/ */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="bg-white border border-[#D7E7F7]/80 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="relative crm-dialog-header bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 border-b border-[#D7E7F7] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={ui("اضغط لرفع صورة شخصية جديدة في مجلد التطبيق (/assets)")}
              className="relative group cursor-pointer focus:outline-none"
            >
              <img
                src={getDisplaySrc(
                  avatarUrl ||
                    user.avatarUrl ||
                    "/admin/crm/assets/founder-rachid-elfazni-v2.webp",
                )}
                alt={user.displayName}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-amber-400 shadow-lg group-hover:opacity-80 transition"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "/admin/crm/assets/founder-rachid-elfazni-v2.webp";
                }}
              />
              <span className="absolute inset-0 rounded-full bg-[#F8FAFC]/55 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-amber-300">
                <Camera className="w-5 h-5" />
              </span>
              <span className="absolute bottom-0 left-0 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-[#0B2E57]">
                  {user.displayName}
                </h2>
                {getRoleBadge(user.role)}
              </div>
              <p className="text-xs text-amber-300 font-mono mt-0.5 font-bold">
                @{user.username}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8190A3] hover:text-[#0B2E57] hover:bg-[#EEF3FA] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-[#D7E7F7] bg-[#F8FAFC]/50 px-6 pt-2 gap-4">
          <button
            onClick={() => {
              setActiveTab("profile");
              setFeedback(null);
            }}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === "profile"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-[#8190A3] hover:text-[#31516E]"
            }`}
          >
            <User className="w-4 h-4" />
            <span>{ui("بيانات ملف المستخدم")}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("password");
              setFeedback(null);
            }}
            className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === "password"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-[#8190A3] hover:text-[#31516E]"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{ui("تعديل كلمة المرور")}</span>
          </button>

          {canManageSystemUsers && onOpenUserManagement && (
            <button
              onClick={() => {
                onClose();
                onOpenUserManagement();
              }}
              className="mr-auto pb-3 text-xs text-[#4083D0] hover:text-[#82B1E4] font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>{ui("إدارة كافة المستخدمين")}</span>
            </button>
          )}
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

        {/* Tab 1: Profile Information */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#5E7086] mb-1.5">
                    {ui("اسم المستخدم (غير قابل للتعديل للحساب الأساسي)")}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                    <input
                      type="text"
                      value={user.username}
                      disabled
                      dir="ltr"
                      className="w-full pr-10 pl-3 py-2.5 bg-[#F8FAFC]/60 border border-[#D7E7F7] rounded-xl text-[#8190A3] text-xs font-mono font-bold cursor-not-allowed text-left"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5E7086] mb-1.5">
                    {ui("الاسم الكامل الظاهر في المعاملات")}
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D7E7F7] focus:border-amber-400 rounded-xl text-[#0B2E57] text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#5E7086] mb-1.5">
                    {ui("البريد الإلكتروني الرسمي")}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      dir="ltr"
                      placeholder="user@elfazni.com"
                      className="w-full pr-10 pl-3 py-2.5 bg-[#F8FAFC] border border-[#D7E7F7] focus:border-amber-400 rounded-xl text-[#0B2E57] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400 text-left"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5E7086] mb-1.5">
                    {ui("رقم الهاتف / الواتساب")}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      dir="ltr"
                      placeholder="+90 552 267 78 51"
                      className="w-full pr-10 pl-3 py-2.5 bg-[#F8FAFC] border border-[#D7E7F7] focus:border-amber-400 rounded-xl text-[#0B2E57] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400 text-left"
                    />
                  </div>
                </div>
              </div>

              {/* =============================================================
                  USER PROFILE IMAGE: CHOICE GALLERY + UPLOAD TO /public/assets/
                 ============================================================= */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC]/90 border border-[#D7E7F7] space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-black text-[#0B2E57] flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      <span>
                        {ui(
                          "الصورة الرمزية للملف الشخصي (اختيار أو رفع في مجلد التطبيق)",
                        )}
                      </span>
                    </label>
                    <p className="text-[11px] text-[#8190A3] mt-0.5">
                      {ui(
                        "اختر صورة جاهزة أو ارفع صورة جديدة ليتم حفظها مباشرة داخل مجلد",
                      )}{" "}
                      <code className="text-amber-300 font-mono" dir="ltr">
                        /admin/crm/assets/
                      </code>
                    </p>
                  </div>

                  {/* Upload Image to /public/assets Button */}
                  <button
                    type="button"
                    disabled={isUploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 flex items-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-60"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{ui("جاري الحفظ في المجلد...")}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>{ui("رفع صورة إلى مجلد التطبيق")}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Choice Grid of Images in /public/assets */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-[#8190A3] mb-2">
                    <span className="flex items-center gap-1 font-bold text-[#5E7086]">
                      <FolderOpen className="w-3.5 h-3.5 text-[#8FBAEE]" />
                      <span>{ui("اختر من صور مجلد التطبيق (/assets):")}</span>
                    </span>
                    <span
                      className="font-mono text-[10px] text-slate-500"
                      dir="ltr"
                    >
                      {folderAvatars.length} images available
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {folderAvatars.map((img) => {
                      const isSelected = avatarUrl === img.path;
                      const displayUrl = getDisplaySrc(
                        img.mtime
                          ? `${img.path}?v=${Math.floor(img.mtime)}`
                          : img.path,
                      );
                      return (
                        <div
                          key={img.path}
                          onClick={() => handleSelectPresetAvatar(img.path)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSelectPresetAvatar(img.path);
                            }
                          }}
                          className={`group relative rounded-2xl p-2 border transition flex flex-col items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? "bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/30"
                              : "bg-white/90 border-[#D7E7F7] hover:border-[#B7CFEA]"
                          }`}
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#F8FAFC] border border-[#D7E7F7] flex items-center justify-center">
                            <img
                              src={displayUrl}
                              alt={ui(img.label || img.name)}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const fallback = previewMap[img.path];
                                if (
                                  fallback &&
                                  e.currentTarget.src !== fallback
                                ) {
                                  e.currentTarget.src = fallback;
                                }
                              }}
                            />
                          </div>
                          <span
                            className="text-[10px] font-bold text-[#5E7086] truncate w-full text-center"
                            title={ui(img.label || img.name)}
                            dir="ltr"
                          >
                            {ui(img.label || img.name)}
                          </span>
                          {isSelected && (
                            <span className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                          {img.isCustom && (
                            <button
                              type="button"
                              title={ui("حذف هذه الصورة من مجلد التطبيق")}
                              onClick={(e) => handleDeleteCustomAvatar(e, img)}
                              className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500/90 hover:bg-red-500 text-[#0B2E57] opacity-0 group-hover:opacity-100 transition flex items-center justify-center shadow cursor-pointer"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Direct Avatar Path / URL Input */}
                <div>
                  <label className="block text-[11px] font-bold text-[#8190A3] mb-1">
                    {ui(
                      "رابط الصورة الرمزية الحالي (Avatar URL / App Folder Path)",
                    )}
                  </label>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    dir="ltr"
                    placeholder="/admin/crm/assets/founder-rachid-elfazni-v2.webp"
                    className="w-full px-3.5 py-2 bg-white border border-[#D7E7F7] focus:border-amber-400 rounded-xl text-amber-300 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-400 text-left"
                  />
                </div>
              </div>

              {/* Account Metadata Card */}
              <div className="p-3 bg-[#F8FAFC]/70 border border-[#D7E7F7] rounded-2xl flex items-center justify-between text-xs text-[#8190A3]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#8FBAEE]" />
                  <span>{ui("تاريخ آخر تسجيل دخول:")}</span>
                </span>
                <span className="font-mono text-[#31516E]">
                  {user.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleString(
                        isRTL ? "ar-MA" : language === "fr" ? "fr-FR" : "en-GB",
                      )
                    : ui("الآن")}
                </span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{ui("حفظ التعديلات على الملف")}</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Change Password */}
          {activeTab === "password" && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-200 leading-relaxed">
                <span className="font-bold">{ui("تنبيه أمني:")}</span>
                {ui(
                  "لتغيير كلمة المرور، يرجى إدخال كلمة المرور الحالية أولاً للتحقق من هويتك.",
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5E7086] mb-1.5">
                  {ui("كلمة المرور الحالية (Current Password)")}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    dir="ltr"
                    placeholder={ui("أدخل كلمة المرور الحالية")}
                    className="w-full pr-10 pl-10 py-2.5 bg-[#F8FAFC] border border-[#D7E7F7] focus:border-amber-400 rounded-xl text-[#0B2E57] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-400 text-left"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute left-3 top-3 text-[#8190A3] hover:text-[#0B2E57]"
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#5E7086] mb-1.5">
                    {ui("كلمة المرور الجديدة (New Password)")}
                  </label>
                  <input
                    type={showPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    dir="ltr"
                    placeholder={ui("كلمة مرور جديدة")}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D7E7F7] focus:border-amber-400 rounded-xl text-[#0B2E57] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-400 text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5E7086] mb-1.5">
                    {ui("تأكيد كلمة المرور الجديدة")}
                  </label>
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    dir="ltr"
                    placeholder={ui("أعد إدخال الجديدة")}
                    className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#D7E7F7] focus:border-amber-400 rounded-xl text-[#0B2E57] text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-400 text-left"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black rounded-xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{ui("تأكيد وتحديث كلمة المرور")}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
