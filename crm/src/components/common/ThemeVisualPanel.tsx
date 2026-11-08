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

  // Texts
  const isPortal = config.target === 'portal';
  const defaultKicker = isPortal
    ? 'ELFAZNI SERVICES HUB'
    : isCrm
    ? 'ELFAZNI SERVICES · CRM'
    : 'ELFAZNI SERVICES · ADMIN';
  const defaultTitle = isPortal
    ? (language === 'ar' ? 'بوابة الفزني سيرفيسز' : 'ELFAZNI SERVICES HUB')
    : isCrm
    ? 'الفزني CRM'
    : 'الفزني سيرفيسز';
  const defaultNote = isPortal
    ? (language === 'ar' ? 'خدمات السفر والمعاملات في تركيا' : 'Travel and consular services in Türkiye')
    : isCrm
    ? 'نظام إدارة العملاء والمعاملات والحجوزات والمالية.'
    : 'مدونة، خدمات، ولوحة إدارة محتوى الموقع.';

  const kickerText =
    config.texts?.photoKicker?.[language] ||
    config.texts?.panelKicker?.[language] ||
    defaultKicker;
  const titleText =
    config.texts?.photoTitle?.[language] ||
    config.texts?.panelTitle?.[language] ||
    config.texts?.heroTitle?.[language] ||
    defaultTitle;
  const noteText =
    config.texts?.photoNote?.[language] ||
    config.texts?.panelNote?.[language] ||
    defaultNote;

  // Illustration URL with automatic fallback for legacy filenames
  const rawIllustrationUrl =
    config.illustrationUrl ||
    config.decorativeIllustration ||
    (isCrm
      ? '/assets/brand/3d/04-hotels-residency-transparent.png'
      : '/assets/brand/3d/02-consular-documents-transparent.png');
  const illustrationUrl = LEGACY_URL_FIXES[rawIllustrationUrl] || rawIllustrationUrl;

  // Logo setup
  const rawVariant = config.illustrationLogoVariant || config.logoVariant || 'horizontal-on-blue';
  let logoBg: LogoBackground = 'blue';
  let logoOrient: LogoOrientation = 'horizontal';
  if (rawVariant.includes('white')) logoBg = 'white';
  else if (rawVariant.includes('gold')) logoBg = 'gold';
  else logoBg = 'blue';
  if (rawVariant.includes('vertical')) logoOrient = 'vertical';

  const isSelected = (key: string) => interactive && selectedElementKey === key;

  // Scale & Position calculations (0% - 400%)
  const rawScale = typeof config.illustrationScale === 'number' ? config.illustrationScale : 100;
  const clampedScale = Math.max(0, Math.min(400, rawScale));
  const customX = config.illustrationCustomX || 0;
  const customY = config.illustrationCustomY || 0;
  const rotation = config.illustrationRotation || 0;
  const fitMode = config.illustrationFit || 'contain';

  // Horizontal & Vertical alignment
  const horizPos = config.illustrationPosition || 'center';
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
  }, [interactive, isDragging, onUpdateConfig]);

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
        backgroundColor: config.backgroundColor || '#071629',
        ...style,
      }}
    >
      {/* 1. LAYER 1: Background Image / Background Color */}
      <div
        className={`theme-background absolute inset-0 transition-opacity ${
          isSelected('background') ? 'ring-4 ring-inset ring-[#CC9048]' : ''
        }`}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: bgLayer.zIndex,
          display: bgLayer.visible ? 'block' : 'none',
          opacity: ((config.backgroundOpacity ?? 100) / 100) * ((bgLayer.opacity ?? 100) / 100),
          backgroundColor: config.backgroundColor || '#071629',
          backgroundImage: config.backgroundImage ? `url("${config.backgroundImage}")` : undefined,
          backgroundSize: config.backgroundSize || 'cover',
          backgroundPosition: config.backgroundPosition || 'center',
          backgroundRepeat: 'no-repeat',
          filter: `blur(${config.backgroundBlur || 0}px) brightness(${config.backgroundBrightness ?? 100}%)`,
          pointerEvents: interactive ? 'auto' : 'none',
          cursor: interactive ? 'pointer' : 'default',
        }}
        onClick={(e) => {
          if (interactive) {
            e.stopPropagation();
            onSelectElement?.('background');
          }
        }}
      />

      {/* 2. LAYER 2: Gradient Overlay */}
      <div
        className={`theme-gradient absolute inset-0 transition-opacity ${
          isSelected('gradient') ? 'ring-4 ring-inset ring-[#CC9048]' : ''
        }`}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: gradientLayer.zIndex,
          display: gradientLayer.visible && (config.gradient?.enabled !== false) ? 'block' : 'none',
          background: generateGradientCss(config.gradient),
          opacity: (config.gradient?.opacity ?? 0.85) * ((gradientLayer.opacity ?? 100) / 100),
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
        className={`theme-illustration absolute inset-0 flex ${fitMode === 'cover' ? 'p-0' : 'p-6'}`}
        dir="ltr"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: illustrationLayer.zIndex,
          display: illustrationLayer.visible ? 'flex' : 'none',
          alignItems: alignValue,
          justifyContent: justifyValue,
          pointerEvents: 'none',
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
            className={`relative flex items-center justify-center rounded-2xl ${
              fitMode === 'cover'
                ? 'w-full h-full'
                : fitMode === 'original' || fitMode === 'custom'
                ? 'w-auto h-auto'
                : 'max-h-[65%] max-w-[88%]'
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
                  : 'w-auto h-auto max-h-36 sm:max-h-56 md:max-h-64 object-contain'
              }`}
              style={{
                opacity: ((config.illustrationOpacity ?? 100) / 100) * ((illustrationLayer.opacity ?? 100) / 100),
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

      {/* 4. LAYER 5: Logo (Top Area) */}
      <div
        className="theme-logo relative w-full flex items-center"
        style={{
          position: 'relative',
          zIndex: logoLayer.zIndex,
          display: logoLayer.visible ? 'flex' : 'none',
          justifyContent:
            config.logoPosition === 'center'
              ? 'center'
              : config.logoPosition === 'end'
              ? 'flex-end'
              : 'flex-start',
          opacity: ((config.logoOpacity ?? 100) / 100) * ((logoLayer.opacity ?? 100) / 100),
        }}
      >
        <div
          className={`inline-flex items-center rounded-xl transition-all p-1.5 ${
            isSelected('logo') ? 'ring-2 ring-[#CC9048] ring-offset-2 ring-offset-[#071629] bg-white/5' : ''
          }`}
          style={{
            transform: `scale(${(config.logoScale ?? 100) / 100})`,
            transformOrigin:
              config.logoPosition === 'center' ? 'center' : isRtl ? 'right center' : 'left center',
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
                width: config.logoWidth ? `${config.logoWidth}px` : 'auto',
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
                width: config.logoWidth ? `${config.logoWidth}px` : undefined,
                height: config.logoHeight ? `${config.logoHeight}px` : undefined,
              }}
            />
          )}
        </div>
      </div>

      {/* 5. LAYER 4: Content / Headings & Text (Bottom Area) */}
      <div
        className={`theme-content relative w-full space-y-2 mt-auto pt-6 rounded-2xl p-2 transition-all ${
          isSelected('content') || isSelected('typography')
            ? 'ring-2 ring-[#CC9048] ring-offset-2 ring-offset-[#071629] bg-white/5'
            : ''
        }`}
        style={{
          position: 'relative',
          zIndex: contentLayer.zIndex,
          display: contentLayer.visible ? 'block' : 'none',
          textAlign: config.textAlign || 'start',
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
        <p
          className="theme-kicker font-extrabold uppercase tracking-widest transition-colors"
          style={{
            color: config.kickerColor || '#CC9048',
            fontSize: '0.75rem',
            letterSpacing: '0.18em',
            margin: '0 0 4px',
          }}
        >
          {kickerText}
        </p>
        <h2
          className="theme-title font-black transition-colors"
          style={{
            color: config.titleColor || '#FFFFFF',
            fontSize: config.titleFontSize || 'clamp(1.75rem, 3.2vw, 2.5rem)',
            lineHeight: 1.25,
            margin: '4px 0 8px',
          }}
        >
          {titleText}
        </h2>
        <p
          className="theme-note transition-colors"
          style={{
            color: config.noteColor || '#E2E8F0',
            fontSize: config.noteFontSize || '0.92rem',
            lineHeight: 1.65,
            margin: 0,
            maxWidth: '38ch',
          }}
        >
          {noteText}
        </p>
      </div>
    </div>
  );
};
