import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Lock,
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Key,
  Database,
  Save,
  Sparkles,
  Phone,
  Mail,
} from 'lucide-react';
import { api, SiteSettings } from '../../services/api';

export const AdminProfileSettings: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);

  const backupInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getSettings().then((res) => {
      if (res.settings) setSettings(res.settings);
    }).catch(() => {});
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordFeedback({ text: 'يرجى ملء جميع الحقول المطلوبة', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ text: 'كلمة المرور الجديدة غير متطابقة', type: 'error' });
      return;
    }
    if (newPassword.length < 10) {
      setPasswordFeedback({ text: 'كلمة المرور يجب أن تكون 10 أحرف على الأقل', type: 'error' });
      return;
    }

    setSavingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      api.logout();
      window.location.assign('/admin/login');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordFeedback({ text: err.message || 'كلمة المرور الحالية غير صحيحة', type: 'error' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleExportBackup = () => {
    window.location.href = api.getBackupExportUrl();
    setBackupFeedback('تم بدء تنزيل النسخة الاحتياطية بصيغة JSON');
    setTimeout(() => setBackupFeedback(null), 4000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      try {
        const json = JSON.parse(loadEvent.target?.result as string);
        const res = await api.importBackup(json);
        if (res.success) {
          alert('تم استعادة النسخة الاحتياطية بنجاح! سيتم تحديث الصفحة.');
          window.location.reload();
        }
      } catch (err) {
        alert('ملف النسخة الاحتياطية غير صالح');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md">
        <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
          <User className="w-5 h-5 text-amber-400" />
          <span>الملف الشخصي والإعدادات والنسخ الاحتياطي (Profile & Backup)</span>
        </h2>
        <p className="text-xs text-blue-200/80 mt-0.5">
          إدارة هوية المدير العام رشيد الفزني، أمان الحساب، وتصدير/استيراد قاعدة البيانات كاملة
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile Card & Credentials */}
        <div className="lg:col-span-6 space-y-6">
          {/* Identity Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                بيانات الدخول وهوية المدير العام
              </h3>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <img
                src={settings?.founderImage || '/assets/founder-rachid-elfazni-v2.webp'}
                alt="رشيد الفزني"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 text-sm">رشيد الفزني (Rachid ELFAZNI)</div>
                <div className="text-xs text-blue-700 font-semibold">المدير العام والمؤسس</div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  اسم المستخدم: <strong className="text-slate-800">elfazni.admin</strong>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600 bg-blue-50/60 p-3.5 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <span>البريد الإلكتروني المعتمد:</span>
                <span className="font-mono font-bold text-blue-900" dir="ltr">
                  rachidelfazni@gmail.com
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>رقم الواتساب الرسمي:</span>
                <span className="font-mono font-bold text-blue-900" dir="ltr">
                  0552 267 7851
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>اسم العلامة التجارية:</span>
                <span className="font-bold text-blue-900">ELFAZNI SERVICES</span>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Key className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                تغيير كلمة المرور الخاصة بحساب المدير
              </h3>
            </div>

            {passwordFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  passwordFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {passwordFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>{passwordFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور الحالية *
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الحالية"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور الجديدة *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="كلمة المرور الجديدة (10 أحرف كحد أدنى)"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تأكيد كلمة المرور الجديدة *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور الجديدة"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{savingPassword ? 'جارٍ التحديث...' : 'تحديث كلمة المرور'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Full JSON Database Backup & Restore */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Database className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                النسخ الاحتياطي الشامل (JSON Backup & Restore)
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              يمكنك تصدير قاعدة بيانات الموقع بالكامل في ملف JSON يشمل المقالات، الخدمات، الرسائل، إعدادات الواجهة، والوسائط، أو استعادتها في أي وقت بضغطة واحدة.
            </p>

            {backupFeedback && (
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>{backupFeedback}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              {/* Export Backup Card */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-xs mb-0.5">
                    تصدير نسخة احتياطية كاملة (Export JSON)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    حفظ نسخة احتياطية من كافة مقالات وخدمات ورسائل الموقع
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>تصدير JSON</span>
                </button>
              </div>

              {/* Import Backup Card */}
              <div className="p-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 text-xs mb-0.5">
                    استعادة نسخة سابقة (Restore JSON)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    رفع ملف JSON سابق لاسترجاع البيانات بالكامل
                  </div>
                </div>

                <input
                  type="file"
                  ref={backupInputRef}
                  onChange={handleImportBackup}
                  accept=".json,application/json"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => backupInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shadow-md transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>استيراد JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
