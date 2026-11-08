import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FazniLogo } from '../common/FazniLogo';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeVisualPanel } from '../common/ThemeVisualPanel';
import { BRAND_CONFIG } from '../../config/brandConfig';
import { themeService, InterfaceThemeConfig } from '../../services/themeService';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Phone,
  AlertCircle,
  HelpCircle,
  X,
  Send,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Search,
} from 'lucide-react';

export const LoginPortal: React.FC = () => {
  const { ui, language, setLanguage, isRTL } = useUITranslation();
  const { login, submitPasswordResetRequest, lookupAccountForRecovery } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<InterfaceThemeConfig | null>(null);

  useEffect(() => {
    themeService.getPublishedTheme('crm_login').then((t) => {
      if (t) {
        setTheme(t);
        themeService.applyCssVariables(t.colors);
      }
    }).catch(() => {});
  }, []);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotContact, setForgotContact] = useState('');
  const [forgotNote, setForgotNote] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);

  // Secure live query against administrative state (without exposing credentials)
  const accountLookup = useMemo(() => {
    if (!forgotUsername.trim() || forgotUsername.trim().length < 3) return null;
    return lookupAccountForRecovery(forgotUsername);
  }, [forgotUsername, lookupAccountForRecovery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(async () => {
      const result = await login(username, password, rememberMe);
      if (!result.success) {
        setError(result.message || 'فشل تسجيل الدخول، تحقق من صحة اسم المستخدم وكلمة المرور');
        setIsLoading(false);
      }
    }, 350);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotUsername.trim()) {
      setForgotError('يرجى كتابة اسم المستخدم المسجل في النظام');
      return;
    }

    setIsSubmittingForgot(true);

    setTimeout(() => {
      const res = submitPasswordResetRequest(forgotUsername, forgotContact, forgotNote);
      setIsSubmittingForgot(false);
      if (res.success) {
        setForgotSuccess(res.message);
      } else {
        setForgotError(res.message);
      }
    }, 400);
  };

  const handleResetForgotForm = () => {
    setIsForgotModalOpen(false);
    setForgotSuccess(null);
    setForgotError(null);
    setForgotUsername('');
    setForgotContact('');
    setForgotNote('');
  };

  return (
    <div
      className="ws-login min-h-screen relative flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden font-sans select-none"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        background: theme?.illustrationBgGradient || 'radial-gradient(ellipse at top right, #004AA5 0%, #0B2E57 55%, #071629 100%)',
      }}
    >
      <label className="ws-login-language"><span className="sr-only">{ui("Language")}</span><select value={language} onChange={e=>setLanguage(e.target.value as 'ar'|'en'|'fr')}><option value="ar">العربية</option><option value="en">English</option><option value="fr">Français</option></select></label>
      {theme?.layoutType !== 'centered' && (
        <ThemeVisualPanel
          config={theme || ({} as any)}
          language={language}
          isCrm={true}
          className="ws-login-art"
        />
      )}
      {/* Main Authentication Container */}
      <div className="ws-login-form relative w-full max-w-md z-10" style={{ maxWidth: theme?.formWidth || undefined }}>
        {/* Top Floating Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-[#CC9048]/40 text-[#CC9048] text-xs font-bold shadow-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <ShieldCheck className="w-4 h-4 text-[#CC9048]" />
            <span>{ui("بوابة التحكم والإدارة المركزية المعتمدة")}</span>
          </div>
        </div>

        {/* The Luxury Glassmorphism Card */}
        <div
          className="bg-white border border-[#D7E7F7] rounded-3xl p-6 sm:p-8 shadow-2xl ring-1 ring-[#CC9048]/20 relative overflow-hidden"
          style={{
            backgroundColor: theme?.formBg || theme?.colors?.surface || undefined,
            color: theme?.formTextColor || theme?.colors?.text || undefined,
          }}
        >
          {/* Subtle Top Gold Highlight Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#CC9048] via-amber-300 to-[#CC9048] shadow-sm" />

          {/* Logo & Brand Header */}
          <div className="text-center mb-7 pt-2">
            <div className="flex justify-center mb-4">
              <BrandLogo background="white" orientation="horizontal" size="lg" className="ws-login-logo" />
            </div>

            <h1
              className="text-xl sm:text-2xl font-black text-[#0B2E57] tracking-wide"
              style={{ color: theme?.formTextColor || theme?.colors?.text || undefined }}
            >
              {theme?.texts?.loginTitle?.[language] || ui("تسجيل دخول النظام")}
            </h1>
            <p
              className="text-xs sm:text-sm text-[#5E7086] mt-1 font-medium"
              style={{ color: theme?.formMutedColor || theme?.colors?.mutedText || undefined }}
            >
              {theme?.texts?.loginDesc?.[language] || ui("نظام التسيير الإداري والمالي لمؤسسة الفزني للخدمات")}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/40 text-red-600 text-xs sm:text-sm flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold leading-relaxed">{ui(error)}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label
                htmlFor="login-username"
                className="block text-xs font-bold text-[#31516e] mb-1.5"
                style={{ color: theme?.formTextColor || theme?.colors?.text || undefined }}
              >
                {ui("اسم المستخدم (Username)")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5 text-[#CC9048]/90" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={ui("أدخل اسم المستخدم المسجل...")}
                  required
                  dir="ltr"
                  autoFocus
                  id="login-username" autoComplete="username"
                  className="w-full pl-4 pr-11 py-3 bg-[#F8FAFC] border border-[#D7E7F7] focus:border-[#CC9048] text-[#0B2E57] placeholder-slate-500 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#CC9048]/30 transition-all text-left"
                  style={{
                    backgroundColor: theme?.inputBg || undefined,
                    borderColor: theme?.inputBorder || undefined,
                    color: theme?.inputTextColor || undefined,
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="text-xs font-bold text-[#31516e]"
                  style={{ color: theme?.formTextColor || theme?.colors?.text || undefined }}
                >
                  {ui("كلمة المرور (Password)")}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotUsername(username);
                    setIsForgotModalOpen(true);
                  }}
                  className="text-[#004AA5] hover:text-[#0B2E57] text-xs font-bold hover:underline transition cursor-pointer"
                >{ui("نسيت كلمة المرور؟")}</button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5 text-[#CC9048]/90" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  dir="ltr"
                  id="login-password" autoComplete="current-password"
                  className="w-full pl-11 pr-11 py-3 bg-[#F8FAFC] border border-[#D7E7F7] focus:border-[#CC9048] text-[#0B2E57] placeholder-slate-500 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#CC9048]/30 transition-all text-left tracking-wider"
                  style={{
                    backgroundColor: theme?.inputBg || undefined,
                    borderColor: theme?.inputBorder || undefined,
                    color: theme?.inputTextColor || undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-[#0B2E57] transition cursor-pointer"
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-[#5E7086] hover:text-[#0B2E57] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-[#D7E7F7] text-[#CC9048] focus:ring-[#CC9048] focus:ring-offset-slate-900 cursor-pointer"
                />
                <span>{ui("تذكر هذا الجهاز (حفظ الجلسة)")}</span>
              </label>

              <span className="text-[11px] text-slate-400">{ui("استعلام آمن RBAC")}</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 px-4 rounded-xl font-black text-sm text-white bg-[#004AA5] hover:brightness-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#CC9048] transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: theme?.primaryButtonBg || theme?.colors?.button || undefined,
                color: theme?.primaryButtonTextColor || '#FFFFFF',
              }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>{ui("جاري التحقق من الدور والصلاحيات...")}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>{ui("دخول النظام الإداري")}</span>
                </>
              )}
            </button>
          </form>

          {/* Cross-App Navigation Matrix */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-[#5E7086]">
            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 hover:text-[#004AA5] transition-colors cursor-pointer"
            >
              <span>🏢</span>
              <span>{ui("الانتقال إلى لوحة إدارة الموقع")}</span>
            </a>

            <a
              href="/"
              className="inline-flex items-center gap-1.5 hover:text-[#004AA5] transition-colors cursor-pointer"
            >
              <span>🌐</span>
              <span>{ui("العودة إلى الموقع العام")}</span>
            </a>
          </div>

          {/* Quick Support & WhatsApp Direct Link */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center flex items-center justify-center gap-4 text-xs text-slate-400">
            <a
              href={`https://wa.me/905522677851?text=${encodeURIComponent('السلام عليكم إدارة الفزني للخدمات، أود الاستفسار حول الدخول إلى لوحة التحكم.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#CC9048] flex items-center gap-1.5 transition text-emerald-400 hover:underline"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{ui("مساعدة ودعم فني واتساب")}</span>
            </a>
            <span className="text-slate-600">•</span>
            <a
              href={`tel:${BRAND_CONFIG.phone}`}
              className="hover:text-[#CC9048] flex items-center gap-1.5 transition"
            >
              <Phone className="w-3.5 h-3.5 text-[#CC9048]" />
              <span dir="ltr">{BRAND_CONFIG.phone}</span>
            </a>
          </div>
        </div>

        {/* Security Trust Marks */}
        <div className="mt-5 text-center text-slate-400 text-xs space-y-1">
          <p className="flex items-center justify-center gap-2 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{ui("ELFAZNI SERVICES · Business workspace")}</span>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal with Secure Administrative State Query */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F8FAFC] backdrop-blur-md animate-fadeIn" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="bg-slate-900 border border-[#D7E7F7] w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#CC9048] to-yellow-400" />

            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#CC9048]/20 text-[#CC9048] flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0B2E57] text-base">{ui("طلب إعادة تعيين كلمة المرور")}</h3>
                  <p className="text-xs text-slate-400">{ui("استعلام آمن من الحالة الإدارية للنظام")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetForgotForm}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-[#0B2E57] flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-sm flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 leading-relaxed">
                    <p className="font-bold text-emerald-300">{ui("تم تسجيل طلب الاستعادة بنجاح!")}</p>
                    <p className="text-xs text-[#5E7086]">{ui(forgotSuccess)}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-[#5E7086] space-y-2">
                  <div className="font-bold text-[#CC9048] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{ui("لإعادة التعيين الفورية، تواصل مع الإدارة:")}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{ui("يمكنك إرسال إشعار مباشر عبر واتساب إلى مدير النظام للمصادقة على الرمز الجديد لحسابك (")}{forgotUsername}).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <a
                    href={`https://wa.me/905522677851?text=${encodeURIComponent(`السلام عليكم إدارة الفزني، قمت بإرسال طلب إعادة تعيين كلمة المرور لحسابي (${forgotUsername}) في نظام CRM.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-[#0B2E57] font-bold text-xs flex items-center justify-center gap-1.5 transition shadow"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{ui("واتساب الإدارة")}</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleResetForgotForm}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#0B2E57] font-bold text-xs transition cursor-pointer"
                  >{ui("العودة لصفحة الدخول")}</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <p className="text-xs text-[#5E7086] leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-[#D7E7F7]/60">{ui("أدخل اسم المستخدم أو البريد المسجل للتحقق الآمن من حالة الحساب في النظام، وإرسال طلب إعادة تعيين كلمة المرور إلى مدير النظام.")}</p>

                {forgotError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{ui(forgotError)}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#5E7086] mb-1.5">{ui("اسم المستخدم أو البريد المسجل")}<span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    <input
                      type="text"
                      value={forgotUsername}
                      onChange={(e) => setForgotUsername(e.target.value)}
                      placeholder={ui("أدخل اسم المستخدم للتحقق...")}
                      required
                      dir="ltr"
                      className="w-full pr-10 pl-3.5 py-2.5 bg-slate-950 border border-[#D7E7F7] focus:border-[#CC9048] text-[#0B2E57] text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-[#CC9048] font-semibold text-left"
                    />
                  </div>

                  {/* Live Secure Account State Feedback */}
                  {accountLookup && (
                    <div className="mt-2">
                      {accountLookup.exists ? (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-emerald-300 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{ui("حساب موثق:")}{accountLookup.displayName}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-[#CC9048] text-[10px] font-bold">
                            {accountLookup.roleLabel}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{ui("لم يتم العثور على حساب مطابق بعد، تأكد من كتابة اسم المستخدم الصحيح")}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5E7086] mb-1.5">{ui("رقم الهاتف أو وسيلة التواصل (اختياري)")}</label>
                  <input
                    type="text"
                    value={forgotContact}
                    onChange={(e) => setForgotContact(e.target.value)}
                    placeholder={ui("+90 552 ... أو بريدك الإلكتروني")}
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-[#D7E7F7] focus:border-[#CC9048] text-[#0B2E57] text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-[#CC9048] text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5E7086] mb-1.5">{ui("ملاحظة للإدارة (اختياري)")}</label>
                  <textarea
                    rows={2}
                    value={forgotNote}
                    onChange={(e) => setForgotNote(e.target.value)}
                    placeholder={ui("سبب الاستعادة أو توضيح إضافي...")}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-[#D7E7F7] focus:border-[#CC9048] text-[#0B2E57] text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-[#CC9048]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingForgot}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-[#CC9048] hover:bg-amber-300 text-slate-950 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isSubmittingForgot ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{ui("إرسال طلب إعادة التعيين")}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetForgotForm}
                    className="py-3 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-[#5E7086] transition cursor-pointer"
                  >{ui("إلغاء")}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
