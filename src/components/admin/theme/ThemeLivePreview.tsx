import React, { useState, useRef, useEffect } from 'react';
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
  DEFAULT_LAYERS,
  generateGradientCss,
  LayerConfig,
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

  const activeLayers = config.layers && config.layers.length > 0 ? config.layers : DEFAULT_LAYERS;
  const layerMap = activeLayers.reduce((acc, l) => {
    acc[l.id] = l;
    return acc;
  }, {} as Record<string, LayerConfig>);

  const bgLayer = layerMap['background'] || { id: 'background', visible: true, zIndex: 1, opacity: 100 };
  const gradientLayer = layerMap['gradient'] || { id: 'gradient', visible: true, zIndex: 2, opacity: 85 };
  const illustrationLayer = layerMap['illustration'] || { id: 'illustration', visible: true, zIndex: 3, opacity: 100 };
  const contentLayer = layerMap['content'] || { id: 'content', visible: true, zIndex: 4, opacity: 100 };
  const logoLayer = layerMap['logo'] || { id: 'logo', visible: true, zIndex: 5, opacity: 100 };

  const rawIllustrationUrl =
    config.illustrationUrl ||
    config.decorativeIllustration ||
    '/assets/brand/3d/01-master-service-hero-transparent.png';

  const rawScale = typeof config.illustrationScale === 'number' ? config.illustrationScale : 100;
  const clampedScale = Math.max(0, Math.min(400, rawScale));
  const customX = config.illustrationCustomX || 0;
  const customY = config.illustrationCustomY || 0;
  const rotation = config.illustrationRotation || 0;

  const getText = (key: string, fallbackAr: string, fallbackEn: string) => {
    const candidateKeys = [
      key,
      `portal_${key}`,
      `website_${key}`,
      key === 'heroTitle' ? 'portal_title' : '',
      key === 'heroTitle' ? 'website_title' : '',
      key === 'heroKicker' ? 'portal_kicker' : '',
      key === 'heroKicker' ? 'website_kicker' : '',
      key === 'heroDescription' ? 'portal_desc' : '',
      key === 'heroSubtitle' ? 'website_subtitle' : '',
      key === 'formKicker' ? 'form_kicker' : '',
      key === 'loginTitle' ? 'login_title' : '',
      key === 'loginDesc' ? 'login_desc' : '',
      key === 'primaryButton' ? 'website_primary_action' : '',
      key === 'secondaryButton' ? 'website_secondary_action' : '',
      key === 'secureNote' ? 'portal_secure_note' : '',
      key === 'returnToSite' ? 'portal_return_site' : '',
    ].filter(Boolean);

    for (const k of candidateKeys) {
      if (config.texts?.[k]?.[langKey]) return config.texts[k][langKey];
      if (config.texts?.[k]?.ar && isRtl) return config.texts[k].ar;
      if (config.texts?.[k]?.en && !isRtl) return config.texts[k].en;
    }
    return isRtl ? fallbackAr : fallbackEn;
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

  const [zoomMode, setZoomMode] = useState<'fit' | '100'>('fit');
  const containerRef = useRef<HTMLDivElement>(null);
  const [fitRatio, setFitRatio] = useState<number>(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateRatio = () => {
      const availableW = el.clientWidth - 32;
      if (device === 'desktop') {
        const targetW = 1060;
        if (availableW < targetW) {
          setFitRatio(Math.max(0.4, Number((availableW / targetW).toFixed(3))));
        } else {
          setFitRatio(1);
        }
      } else if (device === 'tablet') {
        const targetW = 768;
        if (availableW < targetW) {
          setFitRatio(Math.max(0.5, Number((availableW / targetW).toFixed(3))));
        } else {
          setFitRatio(1);
        }
      } else {
        setFitRatio(1);
      }
    };
    updateRatio();
    const ro = new ResizeObserver(updateRatio);
    ro.observe(el);
    return () => ro.disconnect();
  }, [device]);

  const effectiveZoom = zoomMode === 'fit' ? fitRatio : 1;

  const deviceWidthClass =
    device === 'mobile'
      ? 'w-[375px] min-w-[375px]'
      : device === 'tablet'
      ? 'w-[768px] min-w-[768px]'
      : 'w-[1060px] min-w-[1060px]';

  const effectiveFormBg = config.menuPanel?.bgColor || config.formBg || colors.surface || '#FFFFFF';
  const formIsDark = isDarkColor(effectiveFormBg);
  const effectiveFormText = config.menuPanel?.headingColor || (formIsDark ? '#F8FAFC' : '#0B2E57');
  const effectiveFormMuted = config.menuPanel?.descriptionColor || (formIsDark ? '#94A3B8' : '#5E7086');
  const effectiveInputBg = config.inputBg || (formIsDark ? '#1E293B' : '#F8FAFC');
  const effectiveInputBorder = config.inputBorder || colors.border || '#D7E7F7';
  const effectiveInputText = config.inputTextColor || effectiveFormText;
  const effectiveBtnBg = config.primaryButtonBg || colors.button || colors.primary;
  const effectiveBtnText = config.primaryButtonTextColor || '#FFFFFF';

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

        {/* Zoom Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setZoomMode('fit')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              zoomMode === 'fit' ? 'bg-white text-[#004AA5] shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="ملاءمة الشاشة بالكامل داخل مساحة العرض"
          >
            ملاءمة ({Math.round(fitRatio * 100)}%)
          </button>
          <button
            type="button"
            onClick={() => setZoomMode('100')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              zoomMode === '100' ? 'bg-white text-[#004AA5] shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="الحجم الأصلي 1:1"
          >
            100%
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden md:block">
          معاينة حية فورية (اسحب الصورة للتحريك)
        </div>
      </div>

      {/* Preview Canvas Container */}
      <div ref={containerRef} className="flex-1 overflow-auto p-4 flex items-start justify-center">
        <div
          className={`transition-all duration-200 bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-300/80 shrink-0 ${deviceWidthClass}`}
          style={{
            transform: effectiveZoom < 0.99 ? `scale(${effectiveZoom})` : undefined,
            transformOrigin: 'top center',
          }}
          dir={direction}
        >
          {/* ======================================================== */}
          {/* 1. ADMIN LOGIN & CRM LOGIN PREVIEW                      */}
          {/* ======================================================== */}
          {(target === 'admin_login' || target === 'crm_login') && (() => {
            const ob = config.outerBackground;
            const mp = config.menuPanel;

            const outerBgType = ob?.type || (ob?.image ? 'image' : 'radial_gradient');
            const outerBgImage = ob?.image || (ob?.type === 'image' ? config.backgroundImage : '') || '';
            const outerBgColor = ob?.color || config.backgroundColor || (target === 'crm_login' ? '#071629' : '#012247');
            const outerOverlay = ob?.overlay;

            const getOuterLiveBgStyle = (): React.CSSProperties => {
              if (outerBgType === 'transparent') return { backgroundColor: 'transparent' };
              if (outerBgType === 'solid') return { backgroundColor: outerBgColor };
              if (outerBgType === 'linear_gradient') {
                const dir = outerOverlay?.direction || '135deg';
                const c1 = outerOverlay?.startColor || outerBgColor;
                const c2 = outerOverlay?.endColor || '#011B38';
                return { background: `linear-gradient(${dir}, ${c1}, ${c2})` };
              }
              if (outerBgType === 'radial_gradient') {
                const c1 = outerOverlay?.startColor || (target === 'crm_login' ? '#004AA5' : '#0B2E57');
                const c2 = outerOverlay?.endColor || outerBgColor || '#011B38';
                return { background: `radial-gradient(circle at center, ${c1} 0%, ${c2} 70%, #000E20 100%)` };
              }
              return { backgroundColor: outerBgColor };
            };

            return (
              <div
                className={`min-h-[640px] p-4 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                  selectedElementKey === 'outer_background' ? 'ring-4 ring-inset ring-[#CC9048]' : ''
                }`}
                style={{
                  ...getOuterLiveBgStyle(),
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('outer_background');
                }}
                title="الخلفية الرئيسية (Zone A) — اضغط لتعديل خصائص الخلفية"
              >
                {/* Zone A: Background Image Layer */}
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

                {/* Zone A: Gradient Overlay Layer */}
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

                {/* Concentric Arcs Background Pattern */}
                {outerBgType !== 'transparent' && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-30 z-0"
                    style={{
                      backgroundImage:
                        'repeating-radial-gradient(circle at 4% 116%, transparent 0 64px, rgba(255, 255, 255, 0.08) 64px 65.5px, transparent 65.5px 132px)',
                    }}
                  />
                )}

                {/* Zone B: Shell Card */}
                <div
                  className={`w-full shadow-2xl overflow-hidden grid relative z-10 transition-all ${
                    device === 'mobile'
                      ? 'grid-cols-1 max-w-[390px]'
                      : config.layoutType === 'centered'
                      ? 'grid-cols-1 max-w-lg'
                      : config.layoutType === 'split-left'
                      ? 'grid-cols-1 md:grid-cols-2 max-w-5xl'
                      : 'grid-cols-1 md:grid-cols-2 max-w-5xl'
                  } ${selectedElementKey === 'menu_panel' ? 'ring-4 ring-[#004AA5]' : ''}`}
                  style={{
                    backgroundColor: mp?.bgColor || effectiveFormBg,
                    backgroundImage: mp?.bgImage ? `url(${mp.bgImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: (mp?.opacity ?? 100) / 100,
                    borderRadius: mp?.borderRadius || config.cardRadius || '32px',
                    borderColor: mp?.borderColor || undefined,
                    borderWidth: mp?.borderColor ? '1px' : undefined,
                    borderStyle: mp?.borderColor ? 'solid' : undefined,
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
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    width: '100%',
                    maxWidth:
                      device === 'mobile'
                        ? '390px'
                        : config.layoutType === 'centered'
                        ? (mp?.width && parseInt(mp.width, 10) <= 600 ? mp.width : '520px')
                        : (mp?.width && parseInt(mp.width, 10) >= 800 ? mp.width : '1040px'),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement('menu_panel');
                  }}
                >
                  {/* Illustration Area with Shared ThemeVisualPanel */}
                  {config.layoutType !== 'centered' && (
                    <div className="w-full relative min-h-[560px] flex overflow-hidden">
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
                      config.layoutType === 'centered' ? 'max-w-md mx-auto' : ''
                    } p-8 sm:p-12 flex flex-col justify-center transition-colors`}
                    style={{
                      backgroundColor: mp?.bgColor || effectiveFormBg,
                      color: effectiveFormText,
                    }}
                  >
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-2">
                    {inspectWrapper(
                      'logo',
                      <div
                        style={{
                          transform: `scale(${(config.logoScale ?? 100) / 100})`,
                          transformOrigin: isRtl ? 'right center' : 'left center',
                        }}
                      >
                        <BrandLogo
                          background={formIsDark ? 'blue' : 'white'}
                          orientation="horizontal"
                          size="md"
                          className="h-10 w-auto"
                        />
                      </div>
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
                        style={{
                          color: mp?.kickerColor || config.kickerColor || colors.gold || '#CC9048',
                          fontFamily: config.typography?.fontFamily,
                        }}
                      >
                        {getText('formKicker', 'بوابة الدخول الآمنة', 'Secure Login Portal')}
                      </p>
                    )}
                    {inspectWrapper(
                      'login_title',
                      <h1
                        className="font-black mt-0.5 transition-all"
                        style={{
                          color: mp?.headingColor || effectiveFormText,
                          fontFamily: config.typography?.headingFontFamily || config.typography?.fontFamily,
                          fontSize: config.titleFontSize || config.typography?.h1Size || '1.35rem',
                          lineHeight: config.typography?.lineHeight || '1.25',
                          letterSpacing: config.typography?.letterSpacing || '0px',
                        }}
                      >
                        {getText('loginTitle', 'تسجيل الدخول', 'Sign in')}
                      </h1>
                    )}
                    {inspectWrapper(
                      'login_desc',
                      <p
                        className="text-xs mt-1 transition-all"
                        style={{
                          color: mp?.descriptionColor || effectiveFormMuted,
                          fontSize: config.noteFontSize || config.typography?.baseFontSize || '0.825rem',
                          fontFamily: config.typography?.fontFamily,
                        }}
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
          </div>
        );
      })()}

          {/* ======================================================== */}
          {/* 2. UNIFIED PORTAL (HUB & Workspace) PREVIEW (3 ZONES)   */}
          {/* ======================================================== */}
          {target === 'portal' && (() => {
            const ob = config.outerBackground;
            const mp = config.menuPanel;
            const sp = config.sidePanel;

            const outerBgType = ob?.type || (ob?.image ? 'image' : 'radial_gradient');
            const outerBgImage = ob?.image || (ob?.type === 'image' ? config.backgroundImage : '') || '';
            const outerBgColor = ob?.color || config.backgroundColor || '#012247';
            const outerOverlay = ob?.overlay;

            const getOuterLiveBgStyle = (): React.CSSProperties => {
              if (outerBgType === 'transparent') return { backgroundColor: 'transparent' };
              if (outerBgType === 'solid') return { backgroundColor: outerBgColor };
              if (outerBgType === 'linear_gradient') {
                const dir = outerOverlay?.direction || '135deg';
                const c1 = outerOverlay?.startColor || outerBgColor;
                const c2 = outerOverlay?.endColor || '#011B38';
                return { background: `linear-gradient(${dir}, ${c1}, ${c2})` };
              }
              if (outerBgType === 'radial_gradient') {
                const c1 = outerOverlay?.startColor || '#0B2E57';
                const c2 = outerOverlay?.endColor || outerBgColor || '#011B38';
                return { background: `radial-gradient(circle at center, ${c1} 0%, ${c2} 70%, #000E20 100%)` };
              }
              return { backgroundColor: outerBgColor };
            };

            return (
              <div
                className={`min-h-[640px] p-4 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden transition-all ${
                  selectedElementKey === 'outer_background' ? 'ring-4 ring-inset ring-[#CC9048]' : ''
                }`}
                style={{
                  ...getOuterLiveBgStyle(),
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('outer_background');
                }}
                title="الخلفية الرئيسية (Zone A) — اضغط لتعديل خصائص الخلفية"
              >
                {/* Zone A: Background Image Layer */}
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

                {/* Zone A: Gradient Overlay Layer */}
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

                {/* Concentric Arcs Background Pattern */}
                {outerBgType !== 'transparent' && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-30 z-0"
                    style={{
                      backgroundImage:
                        'repeating-radial-gradient(circle at 4% 116%, transparent 0 64px, rgba(255, 255, 255, 0.08) 64px 65.5px, transparent 65.5px 132px)',
                    }}
                  />
                )}

                {/* Zone B: Shell Card */}
                <div
                  className={`w-full shadow-2xl overflow-hidden grid relative z-10 transition-all ${
                    device === 'mobile'
                      ? 'grid-cols-1 max-w-[390px]'
                      : config.layoutType === 'centered'
                      ? 'grid-cols-1 max-w-lg'
                      : config.layoutType === 'split-left'
                      ? 'grid-cols-1 md:grid-cols-2 max-w-5xl'
                      : 'grid-cols-1 md:grid-cols-2 max-w-5xl'
                  } ${selectedElementKey === 'menu_panel' ? 'ring-4 ring-[#004AA5]' : ''}`}
                  style={{
                    backgroundColor: mp?.bgColor || effectiveFormBg,
                    backgroundImage: mp?.bgImage ? `url(${mp.bgImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: (mp?.opacity ?? 100) / 100,
                    borderRadius: mp?.borderRadius || config.cardRadius || '32px',
                    borderColor: mp?.borderColor || undefined,
                    borderWidth: mp?.borderColor ? '1px' : undefined,
                    borderStyle: mp?.borderColor ? 'solid' : undefined,
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
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    width: '100%',
                    maxWidth:
                      device === 'mobile'
                        ? '390px'
                        : config.layoutType === 'centered'
                        ? (mp?.width && parseInt(mp.width, 10) <= 600 ? mp.width : '520px')
                        : (mp?.width && parseInt(mp.width, 10) >= 800 ? mp.width : '1040px'),
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement('menu_panel');
                  }}
                >
                  {/* Zone C: 3D Visual Panel Column */}
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
                    <div
                      className="my-2 cursor-pointer"
                      style={{
                        transform: `scale(${(config.logoScale ?? 100) / 100})`,
                        transformOrigin: 'center center',
                      }}
                    >
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
                        style={{
                          color: config.menuPanel?.kickerColor || config.kickerColor || colors.gold || '#CC9048',
                          fontFamily: config.typography?.fontFamily,
                        }}
                      >
                        {getText('heroKicker', 'مركز الوصول الموحّد', 'UNIFIED ACCESS PORTAL')}
                      </p>
                    )}
                    {inspectWrapper(
                      'portal_title',
                      <h1
                        className="font-black cursor-pointer transition-all"
                        style={{
                          color: config.menuPanel?.headingColor || config.titleColor || effectiveFormText,
                          fontFamily: config.typography?.headingFontFamily || config.typography?.fontFamily,
                          fontSize: config.titleFontSize || config.typography?.h1Size || '1.75rem',
                          lineHeight: config.typography?.lineHeight || '1.25',
                          letterSpacing: config.typography?.letterSpacing || '0px',
                        }}
                      >
                        {getText('heroTitle', 'بوابة الفزني سيرفيسز', 'ELFAZNI SERVICES HUB')}
                      </h1>
                    )}
                    {inspectWrapper(
                      'portal_desc',
                      <p
                        className="leading-relaxed cursor-pointer transition-all"
                        style={{
                          color: config.menuPanel?.descColor || config.noteColor || effectiveFormMuted,
                          fontSize: config.noteFontSize || config.typography?.baseFontSize || '0.825rem',
                          fontFamily: config.typography?.fontFamily,
                          lineHeight: config.typography?.lineHeight || '1.6',
                        }}
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
            );
          })()}

          {/* ======================================================== */}
          {/* 3. MAIN WEBSITE PREVIEW                                 */}
          {/* ======================================================== */}
          {/* ======================================================== */}
          {/* 3. MAIN WEBSITE PREVIEW                                 */}
          {/* ======================================================== */}
          {target === 'website' && (
            <div
              className="min-h-[560px] bg-slate-50 text-slate-900 flex flex-col transition-all"
              style={{
                fontFamily: config.typography?.fontFamily || "'Bahij TheSansArabic', sans-serif",
              }}
            >
              {/* Header */}
              <header
                className="px-6 py-4 border-b flex items-center justify-between transition-colors"
                style={{
                  backgroundColor: colors.surface || '#FFFFFF',
                  borderColor: colors.border || '#DCE6F2',
                }}
              >
                {inspectWrapper(
                  'website_logo',
                  <div
                    style={{
                      transform: `scale(${(config.logoScale ?? 100) / 100})`,
                      transformOrigin: isRtl ? 'right center' : 'left center',
                    }}
                  >
                    <BrandLogo
                      background={config.illustrationLogoVariant?.includes('blue') || config.logoVariant?.includes('blue') ? 'blue' : config.illustrationLogoVariant?.includes('gold') || config.logoVariant?.includes('gold') ? 'gold' : 'white'}
                      orientation={config.illustrationLogoVariant?.includes('vertical') || config.logoVariant?.includes('vertical') ? 'vertical' : 'horizontal'}
                      size="md"
                      className="h-10 w-auto"
                    />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-bold hidden sm:inline transition-colors"
                    style={{
                      color: colors.primary,
                      fontFamily: config.typography?.fontFamily,
                    }}
                  >
                    {isRtl ? 'المواعيد القنصلية · الطيران · الإقامات' : 'Consular · Flights · Visas'}
                  </span>
                  {inspectWrapper(
                    'website_header_btn',
                    <button
                      type="button"
                      className="px-3.5 py-1.5 font-bold text-xs shadow-xs transition-all cursor-pointer"
                      style={{
                        backgroundColor: config.primaryButtonBg || colors.button,
                        color: config.primaryButtonTextColor || '#FFFFFF',
                        borderRadius: config.primaryButtonRadius || '12px',
                        fontSize: config.typography?.buttonFontSize || '13px',
                      }}
                    >
                      {getText('primaryButton', 'ابدأ طلبك الآن', 'Start Request')}
                    </button>
                  )}
                </div>
              </header>

              {/* Hero Banner with Layering, Background, Gradient, Illustration and Content */}
              <div
                className="p-8 sm:p-12 text-white relative overflow-hidden min-h-[380px] flex items-center"
                style={{
                  position: 'relative',
                  backgroundColor: config.backgroundColor || colors.secondary || '#0B2E57',
                }}
              >
                {/* 1. LAYER: Background Image & Color */}
                <div
                  className="absolute inset-0 pointer-events-none transition-all"
                  style={{
                    zIndex: bgLayer.zIndex,
                    display: bgLayer.visible ? 'block' : 'none',
                    opacity: ((config.backgroundOpacity ?? 100) / 100) * ((bgLayer.opacity ?? 100) / 100),
                    backgroundColor: config.backgroundColor || colors.secondary || '#0B2E57',
                    backgroundImage: config.backgroundImage ? `url("${config.backgroundImage}")` : undefined,
                    backgroundSize: config.backgroundSize || 'cover',
                    backgroundPosition: config.backgroundPosition || 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: `blur(${config.backgroundBlur || 0}px) brightness(${config.backgroundBrightness ?? 100}%)`,
                  }}
                />

                {/* 2. LAYER: Gradient Overlay */}
                <div
                  className="absolute inset-0 pointer-events-none transition-all"
                  style={{
                    zIndex: gradientLayer.zIndex,
                    display: gradientLayer.visible && (config.gradient?.enabled !== false) ? 'block' : 'none',
                    background: generateGradientCss(config.gradient || {
                      enabled: true,
                      type: 'linear',
                      direction: 'custom',
                      angle: 135,
                      opacity: 0.85,
                      stops: [
                        { position: 0, color: colors.secondary, opacity: 0.95 },
                        { position: 100, color: colors.primary, opacity: 0.75 },
                      ],
                    }),
                    opacity: (config.gradient?.opacity ?? 0.85) * ((gradientLayer.opacity ?? 100) / 100),
                  }}
                />

                {/* 3. LAYER: Foreground 3D Illustration */}
                <div
                  className="absolute inset-0 pointer-events-none flex items-center justify-end p-6"
                  style={{
                    zIndex: illustrationLayer.zIndex,
                    display: illustrationLayer.visible && clampedScale > 0 ? 'flex' : 'none',
                    opacity: ((config.illustrationOpacity ?? 100) / 100) * ((illustrationLayer.opacity ?? 100) / 100),
                  }}
                >
                  {inspectWrapper(
                    'website_illustration',
                    <div
                      style={{
                        transform: `translate(${customX}px, ${customY}px) scale(${clampedScale / 100}) rotate(${rotation}deg)`,
                        transformOrigin: 'center center',
                        pointerEvents: 'auto',
                      }}
                    >
                      <img
                        src={rawIllustrationUrl}
                        alt="Website Hero Illustration"
                        className="max-h-[320px] w-auto object-contain drop-shadow-2xl"
                      />
                    </div>
                  )}
                </div>

                {/* 4. LAYER: Content & Headings */}
                <div
                  className="max-w-xl space-y-4 relative"
                  style={{
                    zIndex: contentLayer.zIndex,
                    display: contentLayer.visible ? 'block' : 'none',
                    opacity: (contentLayer.opacity ?? 100) / 100,
                  }}
                >
                  {inspectWrapper(
                    'website_kicker',
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-extrabold border transition-all"
                      style={{
                        color: config.kickerColor || colors.gold || '#CC9048',
                        borderColor: `${config.kickerColor || colors.gold || '#CC9048'}40`,
                        backgroundColor: `${config.kickerColor || colors.gold || '#CC9048'}15`,
                        fontFamily: config.typography?.fontFamily,
                      }}
                    >
                      {getText('heroKicker', 'المكتب المعتمد في تركيا', 'Certified Agency in Türkiye')}
                    </span>
                  )}
                  {inspectWrapper(
                    'website_title',
                    <h1
                      className="font-black leading-tight transition-all"
                      style={{
                        color: config.titleColor || '#FFFFFF',
                        fontSize: config.titleFontSize || config.typography?.h1Size || '2rem',
                        fontWeight: config.typography?.fontWeightHeavy || '900',
                        fontFamily: config.typography?.headingFontFamily || config.typography?.fontFamily,
                        lineHeight: config.typography?.lineHeight || '1.25',
                        letterSpacing: config.typography?.letterSpacing || '0px',
                      }}
                    >
                      {getText(
                        'heroTitle',
                        'الفزني للخدمات العامة والقنصلية والسياحية للمغاربة والعرب',
                        'ELFAZNI SERVICES — Travel & Consular Services'
                      )}
                    </h1>
                  )}
                  {inspectWrapper(
                    'website_subtitle',
                    <p
                      className="leading-relaxed transition-all"
                      style={{
                        color: config.noteColor || '#E2E8F0',
                        fontSize: config.noteFontSize || config.typography?.baseFontSize || '0.95rem',
                        fontFamily: config.typography?.fontFamily,
                        lineHeight: config.typography?.lineHeight || '1.6',
                        letterSpacing: config.typography?.letterSpacing || '0px',
                      }}
                    >
                      {getText(
                        'heroSubtitle',
                        'حجوزات طيران وفنادق، مواعيد قنصلية، إقامات وتأشيرات، وترجمة محلفة بأعلى جودة.',
                        'Flight & hotel bookings, consular appointments, visas, sworn translations.'
                      )}
                    </p>
                  )}
                  <div className="pt-2 flex items-center gap-3">
                    {inspectWrapper(
                      'website_primary_action',
                      <button
                        type="button"
                        className="px-5 py-2.5 font-bold shadow-md transition-transform cursor-pointer"
                        style={{
                          backgroundColor: config.primaryButtonBg || colors.gold || '#CC9048',
                          color: config.primaryButtonTextColor || colors.secondary || '#0B2E57',
                          borderRadius: config.primaryButtonRadius || '12px',
                          fontSize: config.typography?.buttonFontSize || '14px',
                          fontFamily: config.typography?.fontFamily,
                        }}
                      >
                        {getText('primaryButton', 'ابدأ طلبك الآن', 'Start Request')}
                      </button>
                    )}
                    {inspectWrapper(
                      'website_secondary_action',
                      <button
                        type="button"
                        className="px-5 py-2.5 font-bold border transition-colors cursor-pointer"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderColor: colors.border || 'rgba(255, 255, 255, 0.25)',
                          color: '#FFFFFF',
                          borderRadius: config.primaryButtonRadius || '12px',
                          fontSize: config.typography?.buttonFontSize || '14px',
                          fontFamily: config.typography?.fontFamily,
                        }}
                      >
                        {getText('secondaryButton', 'استكشف الخدمات', 'Explore Services')}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Continuous Golden Services Marquee Banner */}
              <div
                className="px-6 py-3 border-y flex items-center justify-between text-xs font-bold transition-colors"
                style={{
                  backgroundColor: colors.navySupport || colors.secondary || '#0B2E57',
                  borderColor: colors.border || 'rgba(255,255,255,0.1)',
                  color: '#FFFFFF',
                  fontFamily: config.typography?.fontFamily,
                }}
              >
                <span className="flex items-center gap-2">
                  <span>حجوزات الطيران</span>
                  <span style={{ color: colors.gold || '#CC9048' }}>✦</span>
                  <span>المواعيد القنصلية</span>
                  <span style={{ color: colors.gold || '#CC9048' }}>✦</span>
                  <span>الإقامات والتأشيرات</span>
                  <span style={{ color: colors.gold || '#CC9048' }}>✦</span>
                  <span>الترجمة المحلفة</span>
                </span>
                <span style={{ color: colors.gold || '#CC9048' }} className="font-black">
                  ELFAZNI SERVICES
                </span>
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
