import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FazniLogo } from '../common/FazniLogo';
import { BRAND_CONFIG } from '../../config/brandConfig';
import { Lock, KeyRound, LogOut, ShieldAlert, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const LockScreenModal: React.FC = () => {
  const { ui, isRTL } = useUITranslation();
  const { user, isLocked, unlockScreen, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLocked) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await unlockScreen(password);
    if (!res.success) {
      setError(res.message || 'كلمة المرور غير صحيحة');
    } else {
      setPassword('');
    }
  };



  return (
    <div role="dialog" aria-modal="true" data-crm-dialog="LockScreenModal"
      className="crm-dialog fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B2E57]/70 backdrop-blur-xl animate-fade-in select-none"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="w-full max-w-md bg-white border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
        {/* Top gold bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 crm-dialog-header bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />

        {/* Lock Icon and Portrait */}
        <div className="relative mx-auto w-24 h-24 mb-4">
          <img
            src="/admin/crm/assets/founder-rachid-elfazni-v2.webp"
            alt={BRAND_CONFIG.founder}
            className="w-24 h-24 rounded-full object-cover border-2 border-amber-400/80 shadow-lg"
          />
          <div className="absolute -bottom-1 -left-1 p-2 bg-amber-500 text-slate-950 rounded-full shadow-md">
            <Lock className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
        </div>

        {/* Admin Info */}
        <h2 className="text-xl font-black text-[#0B2E57]">{user?.displayName || BRAND_CONFIG.founder}</h2>
        <p className="text-xs text-amber-300 font-mono mt-0.5 font-bold">
          {user?.username || 'elfazni.admin'} {ui("(الإدارة العامة)")}</p>
        <p className="text-xs text-[#8190A3] mt-2 mb-6">{ui("شاشة النظام مقفلة للحفاظ على سرية السجلات والزبائن. أدخل كلمة المرور لإلغاء القفل:")}</p>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{ui(error)}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={ui("أدخل كلمة المرور")}
              required
              autoFocus
              dir="ltr"
              className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#D7E7F7] focus:border-amber-400 rounded-xl text-[#0B2E57] text-sm text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#8190A3] hover:text-[#0B2E57]"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl font-black text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-slate-950" />
            <span>{ui("إلغاء القفل والمتابعة")}</span>
          </button>
        </form>

        {/* Secondary options */}
        <div className="mt-6 pt-4 border-t border-[#D7E7F7] flex items-center justify-between text-xs text-[#8190A3]">


          <button
            onClick={logout}
            className="text-red-400 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{ui("تسجيل الخروج بالكامل")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
