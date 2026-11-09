import React, { useState, useEffect } from 'react';
import { Lock, User, ArrowLeft, ArrowRight, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import './admin-design.css';
import { useLanguage } from '../../context/LanguageContext';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeVisualPanel } from '../common/ThemeVisualPanel';
import { themeService, InterfaceThemeConfig } from '../../services/themeService';
import type { Language } from '../../data/translations';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onNavigate: (path: string) => void;
  isCrm?: boolean;
}

interface AdminLoginCopy {
  panelKicker: (crm: boolean) => string;
  panelTitle: (crm: boolean) => string;
  panelNote: (crm: boolean) => string;
  formKicker: (crm: boolean) => string;
  loginTitle: string;
  recoveryTitle: string;
  loginDesc: string;
  recoveryDesc: string;
  usernameLabel: string;
  passwordLabel: string;
  showPassword: string;
  hidePassword: string;
  submitLogin: (crm: boolean) => string;
  submitRecovery: string;
  loading: string;
  forgot: string;
  backToLogin: string;
  backDestination: (crm: boolean) => string;
  securityNote: string;
  errorFallback: string;
  recoverySent: string;
}

const COPY: Record<Language, AdminLoginCopy> = {
  ar: {
    panelKicker: (crm) => (crm ? 'ELFAZNI SERVICES · CRM' : 'ELFAZNI SERVICES · ADMIN'),
    panelTitle: (crm) => (crm ? 'الفزني CRM' : 'الفزني سيرفيسز'),
    panelNote: (crm) =>
      crm ? 'نظام إدارة العملاء والمعاملات والحجوزات.' : 'مدونة، خدمات، ولوحة إدارة محتوى الموقع.',
    formKicker: (crm) => (crm ? 'نظام CRM ' : 'لوحة إدارة الموقع'),
    loginTitle: 'تسجيل الدخول',
    recoveryTitle: 'استعادة كلمة المرور',
    loginDesc: 'أدخل بيانات حسابك للوصول إلى النظام.',
    recoveryDesc: 'أرسل طلبًا إلى مالك النظام للتحقق من هويتك.',
    usernameLabel: 'اسم المستخدم',
    passwordLabel: 'كلمة المرور',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور',
    submitLogin: (crm) => (crm ? 'الدخول إلى CRM' : 'دخول إلى لوحة التحكم'),
    submitRecovery: 'إرسال طلب الاستعادة',
    loading: 'جاري التحقق والدخول...',
    forgot: 'نسيت كلمة المرور؟',
    backToLogin: 'العودة إلى تسجيل الدخول',
    backDestination: (crm) => (crm ? 'العودة إلى لوحة إدارة الموقع' : 'العودة إلى الموقع العام'),
    securityNote: 'جميع الأنظمة محمية بتسجيل دخول مستقل حسب صلاحيات الحساب.',
    errorFallback: 'فشل تسجيل الدخول، يرجى التأكد من صحة البيانات.',
    recoverySent: 'إذا كان الحساب مسجلاً، سيظهر طلب الاستعادة لدى مالك النظام.',
  },
  en: {
    panelKicker: (crm) => (crm ? 'ELFAZNI SERVICES · CRM' : 'ELFAZNI SERVICES · ADMIN'),
    panelTitle: (crm) => (crm ? 'ELFAZNI CRM' : 'ELFAZNI SERVICES'),
    panelNote: (crm) =>
      crm ? 'Customer, transaction and booking management system.' : 'Blog, services and site content management.',
    formKicker: (crm) => (crm ? 'CRM system' : 'Site administration'),
    loginTitle: 'Sign in',
    recoveryTitle: 'Password recovery',
    loginDesc: 'Enter your account credentials to access the system.',
    recoveryDesc: 'Send a request to the system owner to verify your identity.',
    usernameLabel: 'Username',
    passwordLabel: 'Password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    submitLogin: (crm) => (crm ? 'Sign in to CRM' : 'Sign in to dashboard'),
    submitRecovery: 'Send recovery request',
    loading: 'Verifying and signing in...',
    forgot: 'Forgot password?',
    backToLogin: 'Back to sign in',
    backDestination: (crm) => (crm ? 'Back to site administration' : 'Back to public site'),
    securityNote: 'All systems are protected by independent account-based sign-in according to permissions.',
    errorFallback: 'Sign-in failed, please check your credentials.',
    recoverySent: 'If the account is registered, the recovery request will appear to the system owner.',
  },
  fr: {
    panelKicker: (crm) => (crm ? 'ELFAZNI SERVICES · CRM' : 'ELFAZNI SERVICES · ADMIN'),
    panelTitle: (crm) => (crm ? 'ELFAZNI CRM' : 'ELFAZNI SERVICES'),
    panelNote: (crm) =>
      crm ? 'Système de gestion des clients, transactions et réservations.' : 'Blog, services et gestion du contenu du site.',
    formKicker: (crm) => (crm ? 'Système CRM' : 'Administration du site'),
    loginTitle: 'Connexion',
    recoveryTitle: 'Récupération du mot de passe',
    loginDesc: 'Saisissez vos identifiants pour accéder au système.',
    recoveryDesc: 'Envoyez une demande au propriétaire du système pour vérifier votre identité.',
    usernameLabel: "Nom d'utilisateur",
    passwordLabel: 'Mot de passe',
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
    submitLogin: (crm) => (crm ? 'Se connecter au CRM' : 'Se connecter au tableau de bord'),
    submitRecovery: 'Envoyer la demande de récupération',
    loading: 'Vérification et connexion...',
    forgot: 'Mot de passe oublié ?',
    backToLogin: 'Retour à la connexion',
    backDestination: (crm) => (crm ? "Retour à l'administration du site" : 'Retour au site public'),
    securityNote: 'Tous les systèmes sont protégés par une connexion indépendante selon les permissions du compte.',
    errorFallback: 'Échec de la connexion, veuillez vérifier vos identifiants.',
    recoverySent: "Si le compte est enregistré, la demande de récupération apparaîtra au propriétaire du système.",
  },
  tr: {
    panelKicker: (crm) => (crm ? 'ELFAZNI SERVICES · CRM' : 'ELFAZNI SERVICES · ADMIN'),
    panelTitle: (crm) => (crm ? 'ELFAZNI CRM' : 'ELFAZNI SERVICES'),
    panelNote: (crm) =>
      crm ? 'Müşteri, işlem ve rezervasyon yönetim sistemi.' : 'Blog, hizmetler ve site içerik yönetimi.',
    formKicker: (crm) => (crm ? 'CRM sistemi' : 'Site yönetimi'),
    loginTitle: 'Giriş',
    recoveryTitle: 'Şifre kurtarma',
    loginDesc: 'Sisteme erişmek için hesap bilgilerinizi girin.',
    recoveryDesc: 'Kimliğinizi doğrulamak için sistem sahibine bir talep gönderin.',
    usernameLabel: 'Kullanıcı adı',
    passwordLabel: 'Şifre',
    showPassword: 'Şifreyi göster',
    hidePassword: 'Şifreyi gizle',
    submitLogin: (crm) => (crm ? 'CRM\'e giriş' : 'Yönetim paneline giriş'),
    submitRecovery: 'Kurtarma talebini gönder',
    loading: 'Doğrulanıyor ve giriş yapılıyor...',
    forgot: 'Şifremi unuttum',
    backToLogin: 'Girişe dön',
    backDestination: (crm) => (crm ? 'Site yönetimine dön' : 'Genel siteye dön'),
    securityNote: 'Tüm sistemler, hesap izinlerine göre bağımsız oturum açma ile korunur.',
    errorFallback: 'Giriş başarısız, lütfen bilgilerinizi kontrol edin.',
    recoverySent: 'Hesap kayıtlıysa, kurtarma talebi sistem sahibine iletilecektir.',
  },
};

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onNavigate, isCrm: isCrmProp }) => {
  const isCrmLogin =
    isCrmProp ??
    (new URLSearchParams(window.location.search).get('next') === 'crm' ||
     window.location.pathname === '/crm' ||
     window.location.pathname.startsWith('/crm/'));
  const { isRtl, language, setLanguage } = useLanguage();
  const copy = COPY[language] || COPY.ar;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [recoveryNote, setRecoveryNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<InterfaceThemeConfig | null>(null);

  useEffect(() => {
    themeService.getPublishedTheme(isCrmLogin ? 'crm_login' : 'admin_login').then((t) => {
      if (t) {
        setTheme(t);
        themeService.applyCssVariables(t.colors, t.typography);
      }
    }).catch(() => {});
  }, [isCrmLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (recovery) {
        await api.request('/auth/recovery', { method: 'POST', body: JSON.stringify({ username: username.trim() }) });
        setRecoveryNote(copy.recoverySent);
        return;
      }
      await api.login(username.trim(), password, isCrmLogin ? 'crm' : undefined);
      if (isCrmLogin) {
        window.location.replace('/admin/crm/');
        return;
      }
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || copy.errorFallback);
    } finally {
      setLoading(false);
    }
  };

  const layoutClass =
    theme?.layoutType === 'centered'
      ? 'admin-entry admin-entry--centered'
      : theme?.layoutType === 'split-left'
      ? 'admin-entry admin-entry--split-left'
      : 'admin-entry';

  const illustrationUrl =
    theme?.illustrationUrl ||
    (isCrmLogin
      ? '/assets/brand/3d/04-hotels-residency-transparent.png'
      : '/assets/brand/3d/02-consular-documents-transparent.png');

  const effectiveFormBg = theme?.formBg || theme?.colors?.surface || '#FFFFFF';
  const effectiveFormText = theme?.formTextColor || theme?.colors?.text || '#0B2E57';
  const effectiveFormMuted = theme?.formMutedColor || theme?.colors?.mutedText || '#5E7086';
  const isFormDark = (() => {
    if (!effectiveFormBg || !effectiveFormBg.startsWith('#')) return false;
    const clean = effectiveFormBg.replace('#', '');
    if (clean.length !== 6) return false;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
  })();

  const ob = theme?.outerBackground;
  const mp = theme?.menuPanel;

  // Zone A: Main Page Background Resolution
  const outerBgType = ob?.type || (ob?.image ? 'image' : 'radial_gradient');
  const outerBgImage = ob?.image || (ob?.type === 'image' ? theme?.backgroundImage : '') || '';
  const outerBgColor = ob?.color || theme?.backgroundColor || (isCrmLogin ? '#071629' : '#012247');
  const outerOverlay = ob?.overlay;

  const getOuterMainBackgroundStyle = (): React.CSSProperties => {
    if (outerBgType === 'transparent') {
      return { backgroundColor: 'transparent' };
    }
    if (outerBgType === 'solid') {
      return { backgroundColor: outerBgColor };
    }
    if (outerBgType === 'linear_gradient') {
      const dir = outerOverlay?.direction || '135deg';
      const c1 = outerOverlay?.startColor || outerBgColor;
      const c2 = outerOverlay?.endColor || '#011B38';
      return { background: `linear-gradient(${dir}, ${c1}, ${c2})` };
    }
    if (outerBgType === 'radial_gradient') {
      const c1 = outerOverlay?.startColor || (isCrmLogin ? '#004AA5' : '#0B2E57');
      const c2 = outerOverlay?.endColor || outerBgColor || '#011B38';
      return { background: `radial-gradient(circle at center, ${c1} 0%, ${c2} 70%, #000E20 100%)` };
    }
    return {
      backgroundColor: outerBgColor,
      position: 'relative',
    };
  };

  return (
    <main
      className={`${layoutClass} relative overflow-hidden`}
      dir={isRtl ? 'rtl' : 'ltr'}
      style={getOuterMainBackgroundStyle()}
    >
      {/* Zone A: Layer 1 - Main Background Image */}
      {(outerBgType === 'image' || Boolean(outerBgImage)) && outerBgImage && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden z-0"
          style={{
            backgroundImage: `url(${outerBgImage})`,
            backgroundSize: ob?.fit === 'contain' ? 'contain' : ob?.fit === 'original' ? 'auto' : 'cover',
            backgroundPosition: `${ob?.positionX ?? 'center'} ${ob?.positionY ?? 'center'}`,
            backgroundRepeat: 'no-repeat',
            transform: `translate(${ob?.customX || 0}px, ${ob?.customY || 0}px) scale(${(ob?.scale ?? 100) / 100})`,
            transformOrigin: 'center center',
            opacity: (ob?.opacity ?? 100) / 100,
            filter: `brightness(${ob?.brightness ?? 100}%) contrast(${ob?.contrast ?? 100}%) saturate(${ob?.saturation ?? 100}%) blur(${ob?.blur || 0}px)`,
          }}
        />
      )}

      {/* Zone A: Layer 2 - Gradient Overlay */}
      {outerOverlay?.enabled && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              outerOverlay.type === 'radial'
                ? `radial-gradient(circle at center, ${outerOverlay.startColor} 0%, ${outerOverlay.middleColor ? `${outerOverlay.middleColor} 50%, ` : ''}${outerOverlay.endColor} 100%)`
                : `linear-gradient(${outerOverlay.direction || '135deg'}, ${outerOverlay.startColor} 0%, ${outerOverlay.middleColor ? `${outerOverlay.middleColor} 50%, ` : ''}${outerOverlay.endColor} 100%)`,
            opacity: (outerOverlay.opacity ?? 75) / 100,
          }}
        />
      )}

      {/* Zone A: Subtle Geometric Pattern (when not plain transparent) */}
      {outerBgType !== 'transparent' && (
        <div
          className="absolute inset-0 pointer-events-none opacity-25 z-0"
          style={{
            backgroundImage:
              'repeating-radial-gradient(circle at 4% 116%, transparent 0 64px, rgba(255, 255, 255, 0.06) 64px 65.5px, transparent 65.5px 132px)',
          }}
        />
      )}

      {/* Zone B: Shell Card */}
      <div
        className="admin-entry-shell relative z-10 transition-all"
        style={{
          backgroundColor: mp?.bgColor || effectiveFormBg,
          backgroundImage: mp?.bgImage ? `url(${mp.bgImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: (mp?.opacity ?? 100) / 100,
          borderRadius: mp?.borderRadius || theme?.cardRadius || '30px',
          borderWidth: mp?.borderColor ? '1px' : undefined,
          borderStyle: mp?.borderColor ? 'solid' : undefined,
          borderColor: mp?.borderColor || undefined,
          boxShadow:
            mp?.shadowIntensity === 'none'
              ? 'none'
              : mp?.shadowIntensity === 'sm'
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              : mp?.shadowIntensity === 'md'
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              : mp?.shadowIntensity === 'lg'
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.15)'
              : mp?.shadowIntensity === '2xl'
              ? '0 35px 60px -15px rgba(0, 0, 0, 0.4)'
              : '0 40px 110px -30px rgba(0, 15, 35, 0.65)',
          width: theme?.layoutType === 'centered' ? 'min(100%, 520px)' : 'min(100%, 1080px)',
          maxWidth: theme?.layoutType === 'centered' ? (mp?.width || '520px') : '1080px',
        }}
      >
        {theme?.layoutType !== 'centered' && (
          <ThemeVisualPanel
            config={theme || ({} as any)}
            language={language}
            isCrm={isCrmLogin}
            className="admin-entry-brand"
          />
        )}

        <section
          className="admin-entry-form"
          aria-labelledby="admin-login-title"
          style={{
            backgroundColor: effectiveFormBg,
            color: effectiveFormText,
          }}
        >
          <div className="flex items-center justify-between w-full mb-5">
            <BrandLogo
              background={isFormDark ? 'blue' : 'white'}
              orientation="horizontal"
              size="lg"
              className="admin-entry-logo"
            />
            <div className="flex items-center bg-[#EAF4FF] p-0.5 rounded-full border border-[#D7E7F7] text-[11px] font-bold">
              {(['ar', 'en', 'fr'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                    language === l ? 'bg-[#004AA5] text-white shadow-xs font-black' : 'text-[#5E7086] hover:text-[#0B2E57]'
                  }`}
                >
                  {l === 'ar' ? 'ع' : l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-entry-heading">
            <p
              className="admin-entry-kicker"
              style={{ color: theme?.kickerColor || theme?.colors?.gold || '#CC9048' }}
            >
              {theme?.texts?.formKicker?.[language] || copy.formKicker(isCrmLogin)}
            </p>
            <h1 id="admin-login-title" style={{ color: effectiveFormText }}>
              {recovery ? copy.recoveryTitle : (theme?.texts?.loginTitle?.[language] || copy.loginTitle)}
            </h1>
            <p style={{ color: effectiveFormMuted }}>
              {recovery ? copy.recoveryDesc : (theme?.texts?.loginDesc?.[language] || copy.loginDesc)}
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {recoveryNote && <p role="status" className="mb-4 rounded-lg bg-[#F5F8FA] p-3 text-sm">{recoveryNote}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-username" className="admin-entry-label" style={{ color: effectiveFormText }}>
                {copy.usernameLabel}
              </label>
              <div className="relative">
                <input
                  id="admin-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  dir="ltr"
                  className="admin-entry-field"
                  style={{
                    backgroundColor: theme?.inputBg || undefined,
                    borderColor: theme?.inputBorder || undefined,
                    borderRadius: theme?.inputRadius || undefined,
                    color: theme?.inputTextColor || undefined,
                  }}
                />
                <User className="admin-entry-field-icon" aria-hidden="true" />
              </div>
            </div>

            {!recovery && (
              <div>
                <label htmlFor="admin-password" className="admin-entry-label" style={{ color: effectiveFormText }}>
                  {copy.passwordLabel}
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    dir="ltr"
                    className="admin-entry-field"
                    style={{
                      backgroundColor: theme?.inputBg || undefined,
                      borderColor: theme?.inputBorder || undefined,
                      borderRadius: theme?.inputRadius || undefined,
                      color: theme?.inputTextColor || undefined,
                    }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="admin-entry-toggle" aria-label={showPassword ? copy.hidePassword : copy.showPassword}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="admin-entry-submit"
              style={{
                backgroundColor: theme?.primaryButtonBg || theme?.colors?.button || undefined,
                color: theme?.primaryButtonTextColor || '#FFFFFF',
                borderRadius: theme?.primaryButtonRadius || undefined,
              }}
            >
              {loading ? (
                <span>{copy.loading}</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{recovery ? copy.submitRecovery : (theme?.texts?.submitButton?.[language] || copy.submitLogin(isCrmLogin))}</span>
                </>
              )}
            </button>
          </form>

          <button type="button" className="mt-4 text-sm font-bold text-[#004AA5] underline" onClick={() => { setRecovery(!recovery); setError(null); setRecoveryNote(''); setPassword(''); }}>
            {recovery ? copy.backToLogin : copy.forgot}
          </button>
          <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-[#5E7086]">
            {isCrmLogin ? (
              <a
                href="/portal/login"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/portal/login');
                }}
                className="inline-flex items-center gap-1.5 hover:text-[#004AA5] transition-colors cursor-pointer"
              >
                <span>🏢</span>
                <span>{language === 'ar' ? 'الانتقال إلى بوابة الإدارة والتحكم' : language === 'fr' ? "Aller à la gestion du portail" : 'Switch to Management Portal'}</span>
              </a>
            ) : (
              <a
                href="/portal/login?next=crm"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/portal/login?next=crm');
                }}
                className="inline-flex items-center gap-1.5 hover:text-[#CC9048] transition-colors cursor-pointer"
              >
                <span>💼</span>
                <span>{language === 'ar' ? 'الانتقال إلى نظام CRM' : language === 'fr' ? 'Aller au système CRM' : 'Switch to CRM System'}</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1.5 hover:text-[#004AA5] transition-colors cursor-pointer"
            >
              {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              <span>{language === 'ar' ? 'العودة إلى الموقع العام' : language === 'fr' ? 'Retour au site public' : 'Back to public website'}</span>
            </button>
          </div>
          <p className="mt-6 flex items-center gap-2 text-[11px] font-bold text-[#5E7086]">
            <ShieldCheck className="w-4 h-4 text-[#CC9048]" aria-hidden="true" />
            <span>{copy.securityNote}</span>
          </p>
        </section>
      </div>
    </main>
  );
};
