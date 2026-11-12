import React, { useState, useRef, useEffect } from 'react';
import {
  InterfaceThemeConfig,
  LayerConfig,
  DEFAULT_LAYERS,
  generateGradientCss,
} from '../../services/themeService';
import { BrandLogo, LogoBackground, LogoOrientation } from './BrandLogo';

export interface ThemeVisualPanelProps {
  config: InterfaceThemeConfig;
  language?: string;
  interactive?: boolean;
  selectedElementKey?: string | null;
  onSelectElement?: (key: string) => void;
  onUpdateConfig?: (updates: Partial<InterfaceThemeConfig>) => void;
  isCrm?: boolean;
  className?: string;
  minHeight?: string;
  style?: React.CSSProperties;
}

const LEGACY_URL_FIXES: Record<string, string> = {
  '/assets/brand/3d/01-flight-globe-transparent.png': '/assets/brand/3d/01-master-service-hero-transparent.png',
  '/assets/brand/3d/04-financial-accounting-transparent.png': '/assets/brand/3d/04-hotels-residency-transparent.png',
  '/assets/brand/3d/05-legal-contracts-transparent.png': '/assets/brand/3d/05-corporate-formation-transparent.png',
};

export const ThemeVisualPanel: React.FC<ThemeVisualPanelProps> = ({
  config,
  language = 'ar',
  interactive = false,
  selectedElementKey,
  onSelectElement,
  onUpdateConfig,
  isCrm = false,
  className = '',
  minHeight,
  style,
}) => {
  const isRtl = language === 'ar';
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{
    startClientX: number;
    startClientY: number;
    initialX: number;
    initialY: number;
    moved: boolean;
  } | null>(null);

  // Extract layer map
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

  // Side Panel Independent Configuration (Zone C)
  const sp = config.sidePanel;
  const isPortal = config.target === 'portal';

  // Side Panel Background:
  // Strictly independent! Never automatically inherit config.backgroundImage into sidePanel.
  const sideBgType = sp?.bgType || 'gradient';
  const effectiveSideBgColor = sp?.bgColor || config.backgroundColor || '#071629';
  const effectiveSideBgImage =
    sideBgType === 'image'
      ? (sp?.bgImage || undefined)
      : undefined;

  // Texts
  const defaultKicker = isPortal
    ? 'ELFAZNI SERVICES HUB'
    : isCrm
    ? 'إدارة العملاء · CRM'
    : 'إدارة الموقع';
  const defaultTitle = isPortal
    ? (language === 'ar' ? 'بوابة الفزني سيرفيسز' : 'ELFAZNI SERVICES HUB')
    : isCrm
    ? 'كل عميل، من أول تواصل.'
    : 'موقعك، من مكان واحد.';
  const defaultNote = isPortal
    ? ''
    : isCrm
    ? 'الحجوزات والمعاملات والمتابعات في مساحة واحدة.'
    : 'تابع المحادثات والرسائل، وحدّث محتوى موقعك.';

  const kickerText =
    (language === 'ar' ? sp?.kickerAr : sp?.kickerEn) ||
    config.texts?.photoKicker?.[language] ||
    config.texts?.panelKicker?.[language] ||
    defaultKicker;
  const titleText =
    (language === 'ar' ? sp?.headingAr : sp?.headingEn) ||
    config.texts?.photoTitle?.[language] ||
    config.texts?.panelTitle?.[language] ||
    config.texts?.heroTitle?.[language] ||
    defaultTitle;
  const noteText =
    (language === 'ar' ? sp?.descriptionAr : sp?.descriptionEn) ??
    config.texts?.photoNote?.[language] ??
    config.texts?.panelNote?.[language] ??
    defaultNote;

  const effectiveHeadingColor = sp?.headingColor || config.titleColor || '#FFFFFF';
  const effectiveDescriptionColor = sp?.descriptionColor || config.noteColor || '#E2E8F0';

  // Illustration URL with automatic fallback for legacy filenames
  const explicitEmpty = sp?.foregroundImage === '' || (config.illustrationUrl === '' && !sp?.foregroundImage);
  const rawIllustrationUrl =
    (sp?.foregroundImage !== undefined ? sp.foregroundImage : config.illustrationUrl) ||
    config.decorativeIllustration ||
    (!explicitEmpty
      ? (isCrm
          ? '/uploads/elfazni-crm-side.webp'
          : isPortal
          ? '/uploads/elfazni-hub-side.webp'
          : '/uploads/elfazni-hub-side.webp')
      : '');
  const illustrationUrl = LEGACY_URL_FIXES[rawIllustrationUrl] || rawIllustrationUrl;

  // Logo setup
  const rawVariant = sp?.logoVariant || config.illustrationLogoVariant || config.logoVariant || 'horizontal-on-blue';
  let logoBg: LogoBackground = 'blue';
  let logoOrient: LogoOrientation = 'horizontal';
  if (rawVariant.includes('white')) logoBg = 'white';
  else if (rawVariant.includes('gold')) logoBg = 'gold';
  else logoBg = 'blue';
  if (rawVariant.includes('vertical')) logoOrient = 'vertical';

  const isSelected = (key: string) => interactive && selectedElementKey === key;

  // Scale & Position calculations (0% - 400%)
  const rawScale =
    typeof sp?.illustrationScale === 'number'
      ? sp.illustrationScale
      : typeof config.illustrationScale === 'number'
      ? config.illustrationScale
      : 100;
  const clampedScale = Math.max(0, Math.min(400, rawScale));
  const customX = sp?.illustrationCustomX ?? config.illustrationCustomX ?? 0;
  const customY = sp?.illustrationCustomY ?? config.illustrationCustomY ?? 0;
  const rotation = sp?.illustrationRotation ?? config.illustrationRotation ?? 0;
  const fitMode = sp?.illustrationFit || config.illustrationFit || 'contain';
  const illustrationOpacity = (sp?.illustrationOpacity ?? config.illustrationOpacity ?? 100) / 100;

  // Horizontal & Vertical alignment
  const horizPos = sp?.illustrationAlignment || config.illustrationPosition || 'center';
  const vertPos =
    config.illustrationVerticalPosition ||
    (horizPos === 'top' ? 'top' : horizPos === 'bottom' ? 'bottom' : 'center');

  const justifyValue =
    horizPos === 'left'
      ? 'flex-start'
      : horizPos === 'right'
      ? 'flex-end'
      : 'center';

  const alignValue =
    vertPos === 'top'
      ? 'flex-start'
      : vertPos === 'bottom'
      ? 'flex-end'
      : 'center';

  // Non-destructive clip-path
  const clip = config.illustrationClip;
  const hasClip = clip && (clip.top > 0 || clip.right > 0 || clip.bottom > 0 || clip.left > 0);
  const clipPathCss = hasClip
    ? `inset(${clip.top || 0}% ${clip.right || 0}% ${clip.bottom || 0}% ${clip.left || 0}%)`
    : undefined;

  // Interactive Drag-and-Drop handlers for Illustration
  useEffect(() => {
    if (!interactive || !isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current) return;
      const dx = e.clientX - dragStateRef.current.startClientX;
      const dy = e.clientY - dragStateRef.current.startClientY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        dragStateRef.current.moved = true;
      }
      const nextX = Math.round(dragStateRef.current.initialX + dx);
      const nextY = Math.round(dragStateRef.current.initialY + dy);
      onUpdateConfig?.({
        illustrationCustomX: nextX,
        illustrationCustomY: nextY,
        ...(config.sidePanel
          ? {
              sidePanel: {
                ...config.sidePanel,
                illustrationCustomX: nextX,
                illustrationCustomY: nextY,
              },
            }
          : {}),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStateRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [interactive, isDragging, onUpdateConfig, config.sidePanel]);

  const handleIllustrationMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    onSelectElement?.('illustration');
    if (onUpdateConfig) {
      dragStateRef.current = {
        startClientX: e.clientX,
        startClientY: e.clientY,
        initialX: customX,
        initialY: customY,
        moved: false,
      };
      setIsDragging(true);
    }
  };

  return (
    <div
      className={`theme-visual-panel relative flex flex-col justify-between overflow-hidden p-8 sm:p-10 select-none ${className}`}
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        ...(minHeight ? { minHeight } : {}),
        backgroundColor: sideBgType === 'transparent' ? 'transparent' : effectiveSideBgColor,
        ...style,
      }}
    >
      {/* 1. LAYER 1: Side Panel Background Image / Background Color */}
      <div
        className={`theme-background absolute inset-0 transition-opacity ${
          isSelected('background') || isSelected('side_panel') ? 'ring-4 ring-inset ring-[#CC9048]' : ''
        }`}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: bgLayer.zIndex,
          display: bgLayer.visible && sideBgType !== 'transparent' ? 'block' : 'none',
          opacity: ((sp?.bgOpacity ?? config.backgroundOpacity ?? 100) / 100) * ((bgLayer.opacity ?? 100) / 100),
          backgroundColor: sideBgType === 'transparent' ? 'transparent' : effectiveSideBgColor,
          backgroundImage: effectiveSideBgImage ? `url("${effectiveSideBgImage}")` : undefined,
          backgroundSize: sp?.bgFit || config.backgroundSize || 'cover',
          backgroundPosition: `${sp?.bgPositionX || 'center'} ${sp?.bgPositionY || 'center'}`,
          backgroundRepeat: 'no-repeat',
          transform: `translate(${sp?.bgCustomX || 0}px, ${sp?.bgCustomY || 0}px) scale(${(sp?.bgScale ?? 100) / 100})`,
          transformOrigin: 'center center',
          filter: `blur(${sp?.bgBlur ?? config.backgroundBlur ?? 0}px) brightness(${sp?.bgBrightness ?? config.backgroundBrightness ?? 100}%)`,
          pointerEvents: interactive ? 'auto' : 'none',
          cursor: interactive ? 'pointer' : 'default',
        }}
        onClick={(e) => {
          if (interactive) {
            e.stopPropagation();
            onSelectElement?.('side_panel');
          }
        }}
      />

      {/* 2. LAYER 2: Side Panel Gradient Overlay */}
      <div
        className={`theme-gradient absolute inset-0 transition-opacity ${
          isSelected('gradient') ? 'ring-4 ring-inset ring-[#CC9048]' : ''
        }`}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: gradientLayer.zIndex,
          display:
            gradientLayer.visible &&
            (sideBgType === 'gradient' ||
              (sideBgType !== 'image' && config.gradient?.enabled !== false) ||
              Boolean(sp?.bgGradient?.enabled))
              ? 'block'
              : 'none',
          background: generateGradientCss(sp?.bgGradient || config.gradient),
          opacity: ((sp?.bgGradient?.opacity ?? config.gradient?.opacity ?? 0.85)) * ((gradientLayer.opacity ?? 100) / 100),
          pointerEvents: interactive ? 'auto' : 'none',
          cursor: interactive ? 'pointer' : 'default',
        }}
        onClick={(e) => {
          if (interactive) {
            e.stopPropagation();
            onSelectElement?.('gradient');
          }
        }}
      />

      {/* 3. LAYER 3: Foreground Illustration (Supports 0%-400% scale, independent X/Y, drag, fit modes, clip) */}
      <div
        className={`theme-illustration absolute flex ${
          fitMode === 'cover'
            ? 'inset-0 p-0'
            : 'left-4 right-4 sm:left-6 sm:right-6 top-16 bottom-32 sm:top-20 sm:bottom-36'
        }`}
        dir="ltr"
        style={{
          position: 'absolute',
          zIndex: illustrationLayer.zIndex,
          display: illustrationLayer.visible && Boolean(illustrationUrl) ? 'flex' : 'none',
          alignItems: alignValue,
          justifyContent: justifyValue,
          pointerEvents: 'none',
          overflow: fitMode === 'cover' ? 'hidden' : 'visible',
        }}
      >
        {clampedScale === 0 ? (
          interactive ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectElement?.('illustration');
              }}
              style={{ pointerEvents: 'auto' }}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-[#CC9048] text-amber-300 text-xs font-bold shadow-lg hover:bg-slate-800 transition-all"
            >
              حجم المجسم 0% (مخفي) — انقر هنا لتعديل الحجم
            </button>
          ) : null
        ) : (
          <div
            className={`relative flex items-center justify-center ${
              fitMode === 'cover'
                ? 'w-full h-full rounded-none overflow-hidden'
                : fitMode === 'original' || fitMode === 'custom'
                ? 'w-auto h-auto rounded-2xl'
                : 'w-full h-full max-h-[96%] max-w-[96%] rounded-2xl'
            } ${
              isSelected('illustration') ? 'ring-2 ring-[#CC9048] ring-offset-2 ring-offset-[#071629]/60' : ''
            }`}
            style={{
              pointerEvents: interactive ? 'auto' : 'none',
              cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default',
              transform: `translate(${customX}px, ${customY}px) scale(${clampedScale / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.12s ease-out',
            }}
            onMouseDown={handleIllustrationMouseDown}
            onClick={(e) => {
              if (interactive) {
                e.stopPropagation();
                onSelectElement?.('illustration');
              }
            }}
          >
            <img
              src={illustrationUrl}
              alt="Theme Illustration"
              draggable={false}
              className={`select-none ${
                fitMode === 'cover'
                  ? 'w-full h-full object-cover'
                  : fitMode === 'original'
                  ? 'w-auto h-auto max-w-none max-h-none'
                  : fitMode === 'custom'
                  ? 'object-contain max-w-none max-h-none'
                  : 'w-full h-full object-contain'
              }`}
              style={{
                opacity: illustrationOpacity * ((illustrationLayer.opacity ?? 100) / 100),
                filter: `${fitMode === 'cover' ? '' : 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.45))'} ${
                  config.imageEffects?.brightness ? `brightness(${config.imageEffects.brightness}%)` : ''
                } ${config.imageEffects?.contrast ? `contrast(${config.imageEffects.contrast}%)` : ''} ${
                  config.imageEffects?.blur ? `blur(${config.imageEffects.blur}px)` : ''
                }`.trim(),
                width: fitMode === 'custom' && config.illustrationWidth ? config.illustrationWidth : undefined,
                height: fitMode === 'custom' && config.illustrationHeight ? config.illustrationHeight : undefined,
                clipPath: clipPathCss,
              }}
            />

            {/* Live HUD Indicator when selected or dragging in interactive preview */}
            {interactive && (isSelected('illustration') || isDragging) && (
              <div
                dir="ltr"
                style={{
                  transform: `scale(${100 / Math.max(25, clampedScale)})`,
                  transformOrigin: 'bottom center',
                }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-950/90 text-white text-[10px] font-mono font-bold border border-[#CC9048]/60 shadow-lg pointer-events-none z-50"
              >
                {clampedScale}% | X:{customX}px Y:{customY}px
              </div>
            )}
          </div>
        )}
      </div>

      {/* Optional Safe-Area Overlay in Interactive Editor */}
      {interactive && config.showSafeArea && (
        <div className="absolute inset-0 pointer-events-none z-[45] flex flex-col justify-between p-6">
          <div className="border-2 border-dashed border-amber-400/75 bg-amber-500/10 rounded-xl p-3 flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded">
              منطقة أمان الشعار (Layer 5 Safe Zone)
            </span>
          </div>
          <div className="border-2 border-dashed border-sky-400/75 bg-sky-500/10 rounded-xl p-4 min-h-[120px] flex items-end justify-between">
            <span className="text-[10px] font-bold text-sky-300 bg-slate-950/80 px-2 py-0.5 rounded">
              منطقة أمان العناوين والنصوص (Layer 4 Safe Zone)
            </span>
          </div>
        </div>
      )}

      {/* Dark gradient scrim at the bottom to ensure crystal-clear text readability over photography */}
      {fitMode === 'cover' && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to top, rgba(7, 22, 41, 0.95) 0%, rgba(7, 22, 41, 0.70) 25%, rgba(7, 22, 41, 0.20) 45%, transparent 65%)',
          }}
        />
      )}

      {/* 4. LAYER 5: Logo (Top Area) */}
      <div
        className="theme-logo relative w-full flex items-center"
        style={{
          position: 'relative',
          zIndex: logoLayer.zIndex,
          display: (sp?.showLogo ?? (fitMode === 'cover' ? false : logoLayer.visible)) ? 'flex' : 'none',
          justifyContent:
            (sp?.logoPosition || config.logoPosition) === 'center'
              ? 'center'
              : (sp?.logoPosition || config.logoPosition) === 'end'
              ? 'flex-end'
              : 'flex-start',
          opacity: ((sp?.logoOpacity ?? config.logoOpacity ?? 100) / 100) * ((logoLayer.opacity ?? 100) / 100),
        }}
      >
        <div
          className={`inline-flex items-center rounded-xl transition-all p-1.5 ${
            isSelected('logo') ? 'ring-2 ring-[#CC9048] ring-offset-2 ring-offset-[#071629] bg-white/5' : ''
          }`}
          style={{
            transform: `scale(${(config.logoScale ?? 100) / 100})`,
            transformOrigin:
              (sp?.logoPosition || config.logoPosition) === 'center' ? 'center' : isRtl ? 'right center' : 'left center',
            cursor: interactive ? 'pointer' : 'default',
          }}
          onClick={(e) => {
            if (interactive) {
              e.stopPropagation();
              onSelectElement?.('logo');
            }
          }}
        >
          {config.customLogoUrl ? (
            <img
              src={config.customLogoUrl}
              alt="Custom Brand Logo"
              style={{
                width: (sp?.logoWidth || config.logoWidth) ? `${sp?.logoWidth || config.logoWidth}px` : 'auto',
                height: config.logoHeight ? `${config.logoHeight}px` : '48px',
                objectFit: 'contain',
              }}
            />
          ) : (
            <BrandLogo
              background={logoBg}
              orientation={logoOrient}
              size="lg"
              className="h-12 sm:h-14 w-auto opacity-95 drop-shadow-md"
              style={{
                width: (sp?.logoWidth || config.logoWidth) ? `${sp?.logoWidth || config.logoWidth}px` : undefined,
                height: config.logoHeight ? `${config.logoHeight}px` : undefined,
              }}
            />
          )}
        </div>
      </div>

      {/* 5. LAYER 4: Content / Headings & Text (Bottom Area) */}
      <div
        className={`theme-content relative w-full space-y-1.5 mt-auto pt-6 rounded-2xl p-2 transition-all ${
          isSelected('content') || isSelected('typography')
            ? 'ring-2 ring-[#CC9048] ring-offset-2 ring-offset-[#071629] bg-white/5'
            : ''
        }`}
        style={{
          position: 'relative',
          zIndex: 20,
          display: contentLayer.visible ? 'block' : 'none',
          textAlign: sp?.textAlign || config.textAlign || 'start',
          opacity: ((config.textOpacity ?? 100) / 100) * ((contentLayer.opacity ?? 100) / 100),
          cursor: interactive ? 'pointer' : 'default',
        }}
        onClick={(e) => {
          if (interactive) {
            e.stopPropagation();
            onSelectElement?.('content');
          }
        }}
      >
        {kickerText && (
          <p
            className="theme-kicker font-extrabold uppercase tracking-widest transition-colors"
            style={{
              color: sp?.headingColor || config.kickerColor || '#CC9048',
              fontSize: '0.78rem',
              letterSpacing: '0.12em',
              margin: '0 0 4px',
            }}
          >
            {kickerText}
          </p>
        )}
        <h2
          className="theme-title font-black transition-colors"
          style={{
            color: effectiveHeadingColor,
            fontSize: sp?.fontSize || config.titleFontSize || 'clamp(1.85rem, 3.4vw, 2.6rem)',
            fontFamily: sp?.fontFamily || config.typography?.headingFontFamily || config.typography?.fontFamily,
            fontWeight: sp?.fontWeight || '900',
            lineHeight: 1.25,
            letterSpacing: '0px',
            margin: '4px 0 6px',
          }}
        >
          {titleText}
        </h2>
        {noteText && noteText.trim() !== '' && (
          <p
            className="theme-note transition-colors"
            style={{
              color: effectiveDescriptionColor,
              fontSize: config.noteFontSize || '0.92rem',
              fontFamily: sp?.fontFamily || config.typography?.fontFamily,
              lineHeight: 1.6,
              margin: 0,
              maxWidth: '38ch',
            }}
          >
            {noteText}
          </p>
        )}
      </div>
    </div>
  );
};
