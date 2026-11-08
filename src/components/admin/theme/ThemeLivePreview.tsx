import React from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  Globe,
  Users,
  Settings,
  Lock,
  User,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import {
  InterfaceTarget,
  InterfaceThemeConfig,
} from '../../../services/themeService';
import { BrandLogo } from '../../common/BrandLogo';
import { ThemeVisualPanel } from '../../common/ThemeVisualPanel';

interface ThemeLivePreviewProps {
  target: InterfaceTarget;
  config: InterfaceThemeConfig;
  globalConfig?: InterfaceThemeConfig;
  device: 'desktop' | 'tablet' | 'mobile';
  setDevice: (d: 'desktop' | 'tablet' | 'mobile') => void;
  direction: 'rtl' | 'ltr';
  setDirection: (d: 'rtl' | 'ltr') => void;
  selectedElementKey: string | null;
  onSelectElement: (key: string) => void;
  onUpdateConfig?: (updates: Partial<InterfaceThemeConfig>) => void;
}

function isDarkColor(hex?: string): boolean {
  if (!hex || !hex.startsWith('#')) return false;
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.45;
}

export const ThemeLivePreview: React.FC<ThemeLivePreviewProps> = ({
  target,
  config,
  globalConfig,
  device,
  setDevice,
  direction,
  setDirection,
  selectedElementKey,
  onSelectElement,
  onUpdateConfig,
}) => {
  // Merge colors with global fallback
  const colors = {
    primary: config.colors?.primary || globalConfig?.colors?.primary || '#004AA5',
    secondary: config.colors?.secondary || globalConfig?.colors?.secondary || '#0B2E57',
    gold: config.colors?.gold || globalConfig?.colors?.gold || '#CC9048',
    surface: config.colors?.surface || globalConfig?.colors?.surface || '#FFFFFF',
    background: config.colors?.background || globalConfig?.colors?.background || '#F7F9FC',
    text: config.colors?.text || globalConfig?.colors?.text || '#102D4D',
    mutedText: config.colors?.mutedText || globalConfig?.colors?.mutedText || '#5E7086',
    border: config.colors?.border || globalConfig?.colors?.border || '#DCE6F2',
    button: config.colors?.button || globalConfig?.colors?.button || '#004AA5',
    navySupport: config.colors?.navySupport || globalConfig?.colors?.navySupport || '#10345B',
  };

  const isRtl = direction === 'rtl';
  const langKey = isRtl ? 'ar' : 'en';

  const getText = (key: string, fallbackAr: string, fallbackEn: string) => {
    return config.texts?.[key]?.[langKey] || (isRtl ? fallbackAr : fallbackEn);
  };

  // Helper for clickable inspectable wrapper
  const inspectWrapper = (key: string, children: React.ReactNode, extraClass = '') => {
    const isSelected = selectedElementKey === key;
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelectElement(key);
        }}
        className={`relative transition-all cursor-pointer rounded-xl group/inspect ${
          isSelected
            ? 'ring-2 ring-[#CC9048] ring-offset-2 ring-dashed bg-[#CC9048]/5'
            : 'hover:ring-1 hover:ring-[#004AA5]/40 hover:ring-dashed'
        } ${extraClass}`}
        title={`اضغط لتعديل خصائص (${key})`}
      >
        {children}
        <span className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#CC9048] text-white opacity-0 group-hover/inspect:opacity-100 transition-opacity pointer-events-none z-20 shadow-xs">
          تعديل {key}
        </span>
      </div>
    );
  };

  const deviceWidthClass =
    device === 'mobile'
      ? 'max-w-[375px]'
      : device === 'tablet'
      ? 'max-w-[768px]'
      : 'w-full max-w-full';

  const effectiveFormBg = config.formBg || colors.surface || '#FFFFFF';
  const effectiveFormText = config.formTextColor || colors.text || '#0B2E57';
  const effectiveFormMuted = config.formMutedColor || colors.mutedText || '#64748B';
  const effectiveInputBg = config.inputBg || (isDarkColor(effectiveFormBg) ? '#1E293B' : '#F8FAFC');
  const effectiveInputBorder = config.inputBorder || colors.border || '#D7E7F7';
  const effectiveInputText = config.inputTextColor || effectiveFormText;
  const effectiveBtnBg = config.primaryButtonBg || colors.button || colors.primary;
  const effectiveBtnText = config.primaryButtonTextColor || '#FFFFFF';
  const formIsDark = isDarkColor(effectiveFormBg);

  return (
    <div className="flex-1 flex flex-col bg-slate-100/90 rounded-3xl border border-slate-200 overflow-hidden shadow-inner">
      {/* Top Controls Bar */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-3 text-xs shrink-0">
        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              device === 'desktop' ? 'bg-white text-[#004AA5] shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="حاسوب مكتبي (Desktop)"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              device === 'tablet' ? 'bg-white text-[#004AA5] shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="جهاز لوحي (Tablet 768px)"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              device === 'mobile' ? 'bg-white text-[#004AA5] shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="هاتف محمول (Mobile 375px)"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Direction Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setDirection('rtl')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              isRtl ? 'bg-white text-[#004AA5] shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            العربية (RTL)
          </button>
          <button
            type="button"
            onClick={() => setDirection('ltr')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              !isRtl ? 'bg-white text-[#004AA5] shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            English / Français (LTR)
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden md:block">
          معاينة حية فورية (اسحب الصورة للتحريك)
        </div>
      </div>

      {/* Preview Canvas Container */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        <div
          className={`transition-all duration-300 bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-300/80 ${deviceWidthClass}`}
          dir={direction}
        >
          {/* ======================================================== */}
          {/* 1. ADMIN LOGIN & CRM LOGIN PREVIEW                      */}
          {/* ======================================================== */}
          {(target === 'admin_login' || target === 'crm_login') && (
            <div
              className={`min-h-[520px] flex ${
                config.layoutType === 'centered'
                  ? 'items-center justify-center p-6'
                  : config.layoutType === 'split-left'
                  ? 'flex-col md:flex-row-reverse'
                  : 'flex-col md:flex-row'
              }`}
              style={{
                backgroundColor: config.layoutType === 'centered' ? colors.secondary : undefined,
                backgroundImage:
                  config.layoutType === 'full-bg' && config.backgroundImage
                    ? `url(${config.backgroundImage})`
                    : undefined,
                fontFamily: config.typography?.fontFamily,
              }}
            >
              {/* Illustration Area with Shared ThemeVisualPanel */}
              {config.layoutType !== 'centered' && (
                <div className="w-full md:w-1/2 relative min-h-[460px] flex">
                  <ThemeVisualPanel
                    config={config}
                    language={direction === 'rtl' ? 'ar' : 'en'}
                    interactive={true}
                    selectedElementKey={selectedElementKey}
                    onSelectElement={onSelectElement}
                    onUpdateConfig={onUpdateConfig}
                    isCrm={target === 'crm_login'}
                    className="w-full h-full"
                  />
                </div>
              )}

              {/* Login Form Area */}
              <section
                className={`w-full ${
                  config.layoutType === 'centered' ? 'max-w-md' : 'md:w-1/2'
                } p-8 flex flex-col justify-center transition-colors`}
                style={{
                  backgroundColor: effectiveFormBg,
                  color: effectiveFormText,
                  borderRadius: config.layoutType === 'centered' ? '24px' : undefined,
                }}
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2">
                    {inspectWrapper(
                      'logo',
                      <BrandLogo
                        background={formIsDark ? 'blue' : 'white'}
                        orientation="horizontal"
                        size="md"
                        className="h-10 w-auto"
                      />
                    )}
                    <span
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: effectiveInputBg,
                        borderColor: effectiveInputBorder,
                        color: effectiveFormText,
                      }}
                    >
                      {isRtl ? 'عربي' : 'EN'}
                    </span>
                  </div>

                  <div>
                    {inspectWrapper(
                      'form_kicker',
                      <p
                        className="text-xs font-bold"
                        style={{ color: config.kickerColor || colors.gold || '#CC9048' }}
                      >
                        {getText('formKicker', 'بوابة الدخول الآمنة', 'Secure Login Portal')}
                      </p>
                    )}
                    {inspectWrapper(
                      'login_title',
                      <h1
                        className="text-xl font-black mt-0.5"
                        style={{ color: effectiveFormText }}
                      >
                        {getText('loginTitle', 'تسجيل الدخول', 'Sign in')}
                      </h1>
                    )}
                    {inspectWrapper(
                      'login_desc',
                      <p
                        className="text-xs mt-1"
                        style={{ color: effectiveFormMuted }}
                      >
                        {getText('loginDesc', 'أدخل بيانات حسابك للوصول إلى النظام.', 'Enter your account credentials.')}
                      </p>
                    )}
                  </div>

                  {/* Simulated Form Fields */}
                  <div className="space-y-3">
                    {inspectWrapper(
                      'username_input',
                      <div className="space-y-1">
                        <label
                          className="text-xs font-bold block"
                          style={{ color: effectiveFormText }}
                        >
                          {isRtl ? 'اسم المستخدم' : 'Username'}
                        </label>
                        <div
                          className="w-full px-3 py-2.5 rounded-xl border flex items-center gap-2 text-xs"
                          style={{
                            backgroundColor: effectiveInputBg,
                            borderColor: effectiveInputBorder,
                            color: effectiveInputText,
                            borderRadius: config.inputRadius || '12px',
                          }}
                        >
                          <User className="w-4 h-4 text-[#CC9048]" />
                          <span className="opacity-75">username@elfazni.com</span>
                        </div>
                      </div>
                    )}

                    {inspectWrapper(
                      'password_input',
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <label
                            className="font-bold"
                            style={{ color: effectiveFormText }}
                          >
                            {isRtl ? 'كلمة المرور' : 'Password'}
                          </label>
                          <span
                            className="text-[11px] font-semibold cursor-pointer"
                            style={{ color: colors.primary }}
                          >
                            {isRtl ? 'نسيت كلمة المرور؟' : 'Forgot?'}
                          </span>
                        </div>
                        <div
                          className="w-full px-3 py-2.5 rounded-xl border flex items-center justify-between text-xs"
                          style={{
                            backgroundColor: effectiveInputBg,
                            borderColor: effectiveInputBorder,
                            color: effectiveInputText,
                            borderRadius: config.inputRadius || '12px',
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-[#CC9048]" />
                            <span className="opacity-75">••••••••••••</span>
                          </div>
                          <Eye className="w-4 h-4 opacity-60" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Primary Submit Button */}
                  {inspectWrapper(
                    'submit_button',
                    <button
                      type="button"
                      className="w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      style={{
                        backgroundColor: effectiveBtnBg,
                        color: effectiveBtnText,
                        borderRadius: config.primaryButtonRadius || '12px',
                      }}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{getText('submitButton', 'دخول إلى النظام', 'Sign In to System')}</span>
                    </button>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. UNIFIED PORTAL (HUB & Workspace) PREVIEW             */}
          {/* ======================================================== */}
          {target === 'portal' && (
            <div
              className="min-h-[640px] p-4 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden"
              style={{
                backgroundColor: config.backgroundColor || '#012247',
                backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined,
                backgroundSize: config.backgroundSize || 'cover',
                backgroundPosition: config.backgroundPosition || 'center',
              }}
            >
              {/* Concentric Arcs Background Pattern */}
              <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  backgroundImage:
                    'repeating-radial-gradient(circle at 4% 116%, transparent 0 64px, rgba(255, 255, 255, 0.08) 64px 65.5px, transparent 65.5px 132px)',
                }}
              />

              {/* Shell Card */}
              <div
                className={`w-full max-w-4xl shadow-2xl overflow-hidden grid relative z-10 transition-all ${
                  device === 'mobile'
                    ? 'grid-cols-1'
                    : config.layoutType === 'split-left'
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1 md:grid-cols-2'
                }`}
                style={{
                  backgroundColor: effectiveFormBg,
                  borderRadius: config.cardRadius || '28px',
                }}
              >
                {/* 3D Visual Panel Column */}
                <div
                  className={`overflow-hidden relative ${
                    config.layoutType === 'split-left' ? 'order-1 md:order-2' : 'order-1 md:order-1'
                  }`}
                >
                  <ThemeVisualPanel
                    config={config}
                    language={direction === 'rtl' ? 'ar' : 'en'}
                    interactive={true}
                    selectedElementKey={selectedElementKey}
                    onSelectElement={onSelectElement}
                    onUpdateConfig={onUpdateConfig}
                    isCrm={false}
                    minHeight={device === 'mobile' ? '240px' : '560px'}
                    className="h-full w-full"
                  />
                </div>

                {/* Content Column */}
                <div
                  className={`p-6 sm:p-8 flex flex-col justify-between text-center items-center ${
                    config.layoutType === 'split-left' ? 'order-2 md:order-1' : 'order-2 md:order-2'
                  }`}
                  style={{ color: effectiveFormText }}
                >
                  {/* Language Switcher Tabs */}
                  <div className="w-full flex justify-end">
                    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold">
                      {['TR', 'FR', 'EN', 'ع'].map((l) => (
                        <span
                          key={l}
                          className={`px-2 py-0.5 rounded-full ${
                            l === (isRtl ? 'ع' : 'EN')
                              ? 'bg-[#004AA5] text-white shadow-xs'
                              : 'text-slate-600'
                          }`}
                        >
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Brand Logo */}
                  {inspectWrapper(
                    'portal_logo',
                    <div className="my-2 cursor-pointer">
                      <BrandLogo
                        background="white"
                        orientation="horizontal"
                        size="lg"
                        className="h-10 sm:h-12 w-auto"
                      />
                    </div>
                  )}

                  {/* Header Texts */}
                  <div className="space-y-1 max-w-md">
                    {inspectWrapper(
                      'portal_kicker',
                      <p
                        className="text-xs font-bold tracking-wider uppercase cursor-pointer"
                        style={{ color: config.kickerColor || colors.gold || '#CC9048' }}
                      >
                        {getText('heroKicker', 'مركز الوصول الموحّد', 'UNIFIED ACCESS PORTAL')}
                      </p>
                    )}
                    {inspectWrapper(
                      'portal_title',
                      <h1
                        className="text-2xl sm:text-3xl font-black cursor-pointer"
                        style={{ color: effectiveFormText }}
                      >
                        {getText('heroTitle', 'بوابة الفزني سيرفيسز', 'ELFAZNI SERVICES HUB')}
                      </h1>
                    )}
                    {inspectWrapper(
                      'portal_desc',
                      <p
                        className="text-xs leading-relaxed cursor-pointer"
                        style={{ color: effectiveFormMuted }}
                      >
                        {getText(
                          'heroDescription',
                          'الوصول السريع إلى الموقع الإلكتروني ونظام إدارة العملاء ولوحة التحكم من مكان واحد.',
                          'Quick access to the website, the CRM system and the admin dashboard from a single place.'
                        )}
                      </p>
                    )}
                  </div>

                  {/* 3 Portal Cards / Tiles */}
                  <div className="w-full space-y-2.5 my-4">
                    {(config.portalCards || []).map((card) => {
                      if (card.visible === false) return null;
                      const Icon =
                        card.icon === 'Globe'
                          ? Globe
                          : card.icon === 'Users'
                          ? Users
                          : Settings;
                      const isFeatured = Boolean(card.featured);

                      return inspectWrapper(
                        `portal_card_${card.id}`,
                        <div
                          key={card.id}
                          className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 shadow-xs cursor-pointer ${
                            isFeatured
                              ? 'bg-gradient-to-r from-[#004AA5] to-[#2A83D5] text-white border-[#004AA5]'
                              : 'hover:border-[#CC9048] hover:shadow-sm'
                          }`}
                          style={{
                            backgroundColor: isFeatured ? undefined : (card.cardBg || effectiveInputBg || '#F8FAFC'),
                            borderColor: isFeatured ? undefined : (card.borderColor || effectiveInputBorder || '#D7E7F7'),
                            color: isFeatured ? '#FFFFFF' : effectiveFormText,
                          }}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isFeatured
                                ? 'bg-white text-[#004AA5]'
                                : 'bg-gradient-to-br from-[#E3C88F] to-[#CC9048] text-[#0B2E57]'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-black truncate">
                                {card.title[langKey] || card.title.ar}
                              </span>
                              {card.badge && (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    isFeatured
                                      ? 'bg-white/20 text-white'
                                      : 'bg-blue-50 text-[#004AA5] border border-blue-200'
                                  }`}
                                >
                                  {card.badge[langKey] || card.badge.ar}
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-[11px] truncate mt-0.5 ${
                                isFeatured ? 'text-blue-100' : 'text-slate-500'
                              }`}
                            >
                              {card.description[langKey] || card.description.ar}
                            </p>
                          </div>

                          <div className={`shrink-0 ${isFeatured ? 'text-[#E3C88F]' : 'text-[#004AA5]'}`}>
                            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer Notes & Return Button */}
                  <div className="w-full pt-3 border-t border-slate-100 space-y-1.5 text-center">
                    {inspectWrapper(
                      'portal_secure_note',
                      <p className="text-[11px] cursor-pointer" style={{ color: effectiveFormMuted }}>
                        {getText(
                          'secureNote',
                          'يخضع الدخول إلى الأنظمة لاشتراطات تسجيل الحسابات.',
                          'Access requires registered credentials.'
                        )}
                      </p>
                    )}
                    {inspectWrapper(
                      'portal_return_site',
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#004AA5] cursor-pointer hover:underline">
                        <span>{getText('returnToSite', 'العودة إلى الموقع', 'Return to Website')}</span>
                        {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Copyright Text */}
              <p className="text-center text-slate-400 text-[11px] pt-4 font-mono z-10" dir="ltr">
                © {new Date().getFullYear()} ELFAZNI SERVICES - All rights reserved
              </p>
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. MAIN WEBSITE PREVIEW                                 */}
          {/* ======================================================== */}
          {target === 'website' && (
            <div className="min-h-[560px] bg-slate-50 text-slate-900 flex flex-col">
              {/* Header */}
              <header className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
                {inspectWrapper(
                  'website_logo',
                  <BrandLogo
                    background="white"
                    orientation="horizontal"
                    size="md"
                    className="h-10 w-auto"
                  />
                )}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#004AA5] hidden sm:inline">
                    {isRtl ? 'المواعيد القنصلية · الطيران · الإقامات' : 'Consular · Flights · Visas'}
                  </span>
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-xl text-white font-bold text-xs shadow-xs"
                    style={{ backgroundColor: colors.button }}
                  >
                    {getText('primaryButton', 'ابدأ طلبك الآن', 'Start Request')}
                  </button>
                </div>
              </header>

              {/* Hero Banner */}
              <div
                className="p-8 sm:p-12 text-white relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.primary} 100%)`,
                }}
              >
                <div className="max-w-xl space-y-4 relative z-10">
                  {inspectWrapper(
                    'website_kicker',
                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-[#CC9048] border border-[#CC9048]/30 text-xs font-extrabold">
                      {getText('heroKicker', 'المكتب المعتمد في تركيا', 'Certified Agency in Türkiye')}
                    </span>
                  )}
                  {inspectWrapper(
                    'website_title',
                    <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                      {getText(
                        'heroTitle',
                        'الفزني للخدمات العامة والقنصلية والسياحية للمغاربة والعرب',
                        'ELFAZNI SERVICES — Travel & Consular Services'
                      )}
                    </h1>
                  )}
                  {inspectWrapper(
                    'website_subtitle',
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {getText(
                        'heroSubtitle',
                        'حجوزات طيران وفنادق، مواعيد قنصلية، إقامات وتأشيرات، وترجمة محلفة بأعلى جودة.',
                        'Flight & hotel bookings, consular appointments, visas, sworn translations.'
                      )}
                    </p>
                  )}
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl font-bold text-xs text-[#0B2E57] bg-[#CC9048] hover:bg-amber-400 shadow-md transition-transform"
                    >
                      {getText('primaryButton', 'ابدأ طلبك الآن', 'Start Request')}
                    </button>
                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-white/10 hover:bg-white/20 border border-white/20"
                    >
                      {getText('secondaryButton', 'استكشف الخدمات', 'Explore Services')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Continuous Golden Services Marquee Banner */}
              <div className="px-6 py-3 bg-[#0B2E57] border-y border-white/10 flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-2">
                  <span>حجوزات الطيران</span>
                  <span className="text-[#CC9048]">✦</span>
                  <span>المواعيد القنصلية</span>
                  <span className="text-[#CC9048]">✦</span>
                  <span>الإقامات والتأشيرات</span>
                  <span className="text-[#CC9048]">✦</span>
                  <span>الترجمة المحلفة</span>
                </span>
                <span className="text-[#CC9048] font-black">ELFAZNI SERVICES</span>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. GLOBAL BRAND IDENTITY PREVIEW                        */}
          {/* ======================================================== */}
          {target === 'global' && (
            <div className="p-8 bg-slate-50 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-[#0B2E57]">الهوية البصرية العامة الموحدة</h2>
                <p className="text-xs text-slate-500">
                  لوحة الألوان الأساسية والشعارات المعتمدة التي ترثها كافة الواجهات تلقائيًا.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'الأزرق الملكي (Primary)', hex: colors.primary },
                  { label: 'الذهب الرسمي (Official Gold)', hex: colors.gold },
                  { label: 'الكحلي العميق (Secondary)', hex: colors.secondary },
                  { label: 'ذهب النصوص الفاتحة (Accessible)', hex: (colors as any).goldTextOnWhite || '#81521C' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2"
                  >
                    <div
                      className="h-14 rounded-xl border border-slate-300/80 shadow-xs"
                      style={{ backgroundColor: item.hex }}
                    />
                    <div className="text-xs font-bold text-slate-800">{item.label}</div>
                    <div className="text-[11px] font-mono text-slate-400" dir="ltr">
                      {item.hex}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-[#0B2E57] rounded-3xl text-white flex items-center justify-around">
                <BrandLogo background="blue" orientation="horizontal" size="lg" className="h-12 w-auto" />
                <BrandLogo background="gold" orientation="horizontal" size="lg" className="h-12 w-auto" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
