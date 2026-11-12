import React, { useState, useRef } from 'react';
import {
  Palette,
  ImageIcon,
  Layers,
  Sparkles,
  Type,
  Sliders,
  SlidersHorizontal,
  Sun,
  Eye,
  RotateCw,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Check,
  Layout,
  Move,
  Image as ImageLucide,
  ShieldCheck,
  Maximize2,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  InterfaceThemeConfig,
  OuterBackgroundConfig,
  MenuPanelConfig,
  SidePanelConfig,
  OuterBackgroundOverlay,
  themeService,
} from '../../../services/themeService';
import { ThemeGradientEditor } from './ThemeGradientEditor';
import { ThemeLayerManager } from './ThemeLayerManager';
import { ThemeTypographyColorsEditor } from './ThemeTypographyColorsEditor';

interface ThemePortalZonesEditorProps {
  config: InterfaceThemeConfig;
  onChangeConfig: (updates: Partial<InterfaceThemeConfig>) => void;
  onOpenMediaPicker: (targetType?: 'illustration' | 'background' | 'side_panel_bg' | 'logo') => void;
  selectedElementKey?: string | null;
  onSelectElement?: (key: string) => void;
}

export const ThemePortalZonesEditor: React.FC<ThemePortalZonesEditorProps> = ({
  config,
  onChangeConfig,
  onOpenMediaPicker,
  selectedElementKey,
  onSelectElement,
}) => {
  const [activeGroup, setActiveGroup] = useState<string>('zone_a');

  const toggleGroup = (key: string) => {
    setActiveGroup(activeGroup === key ? '' : key);
  };

  // Safe Zone A: Outer Background
  const ob: OuterBackgroundConfig = config.outerBackground || {
    type: config.backgroundImage ? 'image' : 'radial_gradient',
    color: config.backgroundColor || '#012247',
    image: config.backgroundImage || '',
    scale: 100,
    fit: 'cover',
    positionX: 'center',
    positionY: 'center',
    customX: 0,
    customY: 0,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    opacity: 100,
    overlay: {
      enabled: false,
      type: 'radial',
      startColor: '#0B2E57',
      middleColor: '#011B38',
      endColor: '#000E20',
      direction: '135deg',
      opacity: 80,
    },
  };

  // Safe Zone B: Menu Panel
  const mp: MenuPanelConfig = config.menuPanel || {
    bgColor: config.formBg || '#FFFFFF',
    bgImage: '',
    opacity: 100,
    borderColor: '#E2E8F0',
    borderRadius: config.cardRadius || '30px',
    shadowIntensity: 'xl',
    headingColor: config.formTextColor || '#0B2E57',
    descriptionColor: config.formMutedColor || '#5E7086',
    kickerColor: config.kickerColor || '#CC9048',
    logoSize: 'lg',
    logoVariant: config.logoVariant || 'horizontal-on-white',
    buttonBg: '#F8FAFC',
    buttonBorderColor: '#D7E7F7',
    buttonTextColor: '#0B2E57',
  };

  // Safe Zone C: Side Panel
  const sp: SidePanelConfig = config.sidePanel || {
    bgType: 'gradient',
    bgColor: config.backgroundColor || '#071629',
    bgImage: '',
    foregroundImage: config.illustrationUrl || '/assets/brand/3d/01-master-service-hero-transparent.png',
    illustrationScale: config.illustrationScale ?? 100,
    illustrationCustomX: config.illustrationCustomX ?? 0,
    illustrationCustomY: config.illustrationCustomY ?? 0,
    illustrationRotation: config.illustrationRotation ?? 0,
    illustrationOpacity: config.illustrationOpacity ?? 100,
    illustrationFit: config.illustrationFit || 'contain',
    illustrationAlignment: config.illustrationPosition || 'center',
    logoVariant: config.illustrationLogoVariant || 'horizontal-on-blue',
    logoWidth: config.logoWidth || 160,
    logoPosition: config.logoPosition || 'start',
    logoOpacity: config.logoOpacity ?? 100,
    headingAr: config.texts?.heroTitle?.ar || 'بوابة الفزني سيرفيسز',
    headingEn: config.texts?.heroTitle?.en || 'ELFAZNI SERVICES HUB',
    descriptionAr: config.texts?.heroDescription?.ar || 'خدمات السفر والمعاملات في تركيا',
    descriptionEn: config.texts?.heroDescription?.en || 'Travel and consular services in Türkiye',
    headingColor: config.titleColor || '#FFFFFF',
    descriptionColor: config.noteColor || '#E2E8F0',
    fontFamily: config.typography?.headingFontFamily,
    fontSize: config.titleFontSize || 'clamp(1.75rem, 3.2vw, 2.5rem)',
    fontWeight: '900',
    textAlign: config.textAlign || 'start',
  };

  const [uploadingA, setUploadingA] = useState(false);
  const [uploadingC1, setUploadingC1] = useState(false);
  const [uploadingC2, setUploadingC2] = useState(false);
  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputC1Ref = useRef<HTMLInputElement>(null);
  const fileInputC2Ref = useRef<HTMLInputElement>(null);

  const handleUploadOuterBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingA(true);
    try {
      const asset = await themeService.uploadMedia(file, 'background');
      updateOuterBg({ image: asset.url, type: 'image' });
    } catch (err: any) {
      alert(err.message || 'فشل رفع الصورة');
    } finally {
      setUploadingA(false);
      if (fileInputARef.current) fileInputARef.current.value = '';
    }
  };

  const handleUploadSideBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingC1(true);
    try {
      const asset = await themeService.uploadMedia(file, 'background');
      updateSidePanel({ bgImage: asset.url, bgType: 'image' });
    } catch (err: any) {
      alert(err.message || 'فشل رفع الصورة');
    } finally {
      setUploadingC1(false);
      if (fileInputC1Ref.current) fileInputC1Ref.current.value = '';
    }
  };

  const handleUploadSideForeground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingC2(true);
    try {
      const asset = await themeService.uploadMedia(file, 'illustration');
      updateSidePanel({ foregroundImage: asset.url });
    } catch (err: any) {
      alert(err.message || 'فشل رفع الصورة');
    } finally {
      setUploadingC2(false);
      if (fileInputC2Ref.current) fileInputC2Ref.current.value = '';
    }
  };

  const updateOuterBg = (patch: Partial<OuterBackgroundConfig>) => {
    const nextType = patch.type || (patch.image ? 'image' : ob.type);
    const updated: OuterBackgroundConfig = { ...ob, ...patch, type: nextType };
    onChangeConfig({
      outerBackground: updated,
      // Keep root backgroundColor synced for high-level fallbacks
      backgroundColor: updated.color || config.backgroundColor,
      // CRITICAL: If outer background is explicitly updated, make sure it does NOT pollute sidePanel!
      backgroundImage: updated.type === 'image' ? updated.image : (updated.image || config.backgroundImage || ''),
    });
  };

  const updateOuterOverlay = (patch: Partial<OuterBackgroundOverlay>) => {
    const updatedOverlay: OuterBackgroundOverlay = {
      ...(ob.overlay || {
        enabled: true,
        type: 'radial',
        startColor: '#0B2E57',
        middleColor: '#011B38',
        endColor: '#000E20',
        direction: '135deg',
        opacity: 80,
      }),
      ...patch,
    };
    updateOuterBg({ overlay: updatedOverlay });
  };

  const updateMenuPanel = (patch: Partial<MenuPanelConfig>) => {
    const updated: MenuPanelConfig = { ...mp, ...patch };
    onChangeConfig({
      menuPanel: updated,
      formBg: updated.bgColor || config.formBg,
      formTextColor: updated.headingColor || config.formTextColor,
      formMutedColor: updated.descriptionColor || config.formMutedColor,
      cardRadius: updated.borderRadius || config.cardRadius,
    });
  };

  const updateSidePanel = (patch: Partial<SidePanelConfig>) => {
    const nextBgType = patch.bgType || (patch.bgImage ? 'image' : sp.bgType);
    const updated: SidePanelConfig = { ...sp, ...patch, bgType: nextBgType };
    onChangeConfig({
      sidePanel: updated,
      // Keep root illustrationUrl synced with foreground floating illustration/photo
      illustrationUrl: updated.foregroundImage !== undefined ? updated.foregroundImage : config.illustrationUrl,
      illustrationScale: updated.illustrationScale,
      illustrationCustomX: updated.illustrationCustomX,
      illustrationCustomY: updated.illustrationCustomY,
      illustrationRotation: updated.illustrationRotation,
      illustrationOpacity: updated.illustrationOpacity,
      illustrationFit: updated.illustrationFit,
      titleColor: updated.headingColor || config.titleColor,
      noteColor: updated.descriptionColor || config.noteColor,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-right select-none">
      {/* ======================================================== */}
      {/* GROUP 1: ZONE A — MAIN PAGE BACKGROUND                   */}
      {/* ======================================================== */}
      <div className="p-4 space-y-3">
        <button
          type="button"
          onClick={() => {
            toggleGroup('zone_a');
            onSelectElement?.('outer_background');
          }}
          className={`w-full flex items-center justify-between text-xs font-black transition cursor-pointer p-2 rounded-xl ${
            activeGroup === 'zone_a' || selectedElementKey === 'outer_background'
              ? 'bg-blue-50/70 text-[#004AA5]'
              : 'text-[#0B2E57] hover:text-[#004AA5]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-[#004AA5] text-white flex items-center justify-center text-[10px] font-black">
              1
            </span>
            <div className="text-right">
              <span className="block font-black">الخلفية الرئيسية — Main Background</span>
              <span className="text-[10px] text-slate-500 font-medium block">
                تخصيص خلفية شاشة المتصفح بالكامل (خلف البطاقة)
              </span>
            </div>
          </div>
          {activeGroup === 'zone_a' ? (
            <ChevronUp className="w-4 h-4 text-[#004AA5]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {activeGroup === 'zone_a' && (
          <div className="space-y-4 pt-1 pr-2">
            {/* Background Type Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">نوع الخلفية الرئيسية:</label>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {[
                  { id: 'radial_gradient', label: 'تدرج دائري (Radial)' },
                  { id: 'linear_gradient', label: 'تدرج خطي (Linear)' },
                  { id: 'solid', label: 'لون خالص (Solid)' },
                  { id: 'image', label: 'صورة خلفية (Image)' },
                  { id: 'transparent', label: 'بدون / شفاف (Transparent)' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => updateOuterBg({ type: t.id as any })}
                    className={`px-2.5 py-1.5 rounded-lg border text-center font-bold transition cursor-pointer ${
                      ob.type === t.id
                        ? 'bg-[#004AA5] text-white border-[#004AA5] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Color (Hex & Visual Picker) */}
            {ob.type !== 'transparent' && (
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <label className="text-[11px] font-bold text-slate-700 block">لون الخلفية الأساسي:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={ob.color || '#012247'}
                    onChange={(e) => updateOuterBg({ color: e.target.value })}
                    className="w-9 h-9 rounded-lg border border-slate-300 p-0.5 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={ob.color || '#012247'}
                    onChange={(e) => updateOuterBg({ color: e.target.value })}
                    className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg text-slate-800 bg-white"
                  />
                </div>
              </div>
            )}

            {/* If Type is Image: Detailed Image Controls */}
            {ob.type === 'image' && (
              <div className="space-y-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#004AA5]">صورة الخلفية الرئيسية:</span>
                  {ob.image && (
                    <button
                      type="button"
                      onClick={() => updateOuterBg({ image: '', type: 'radial_gradient' })}
                      className="text-[10px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      إزالة الصورة
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={ob.image || ''}
                    onChange={(e) => updateOuterBg({ image: e.target.value })}
                    placeholder="/assets/brand/hub-entry.jpg"
                    className="flex-1 min-w-[180px] px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg text-slate-800 bg-white"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onSelectElement?.('outer_background');
                      onOpenMediaPicker('background');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#004AA5] text-white text-xs font-bold hover:bg-[#003B84] transition cursor-pointer shrink-0"
                  >
                    مكتبة الصور
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputARef.current?.click()}
                    disabled={uploadingA}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer shrink-0 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingA ? 'جاري الرفع...' : 'رفع من جهازك'}</span>
                  </button>
                  <input
                    ref={fileInputARef}
                    type="file"
                    accept="image/*,.png,.jpg,.jpeg,.webp,.svg,.avif"
                    onChange={handleUploadOuterBg}
                    className="hidden"
                  />
                </div>

                {/* Scale (0% - 400%) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-700">
                    <span>مقياس الحجم (Scale):</span>
                    <span className="font-mono text-[#004AA5]">{ob.scale ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="400"
                    step="5"
                    value={ob.scale ?? 100}
                    onChange={(e) => updateOuterBg({ scale: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#004AA5]"
                  />
                </div>

                {/* Fit Mode */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">طريقة الاحتواء (Fit):</label>
                    <select
                      value={ob.fit || 'cover'}
                      onChange={(e) => updateOuterBg({ fit: e.target.value as any })}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                    >
                      <option value="cover">ملء كامل (Cover)</option>
                      <option value="contain">احتواء (Contain)</option>
                      <option value="original">الحجم الأصلي (Original)</option>
                      <option value="custom">مخصص (Custom)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">الشفافية (Opacity):</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={ob.opacity ?? 100}
                      onChange={(e) => updateOuterBg({ opacity: parseInt(e.target.value, 10) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#004AA5] mt-2"
                    />
                  </div>
                </div>

                {/* Custom X / Y offsets */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-600 block">إزاحة أفقية X (px):</span>
                    <input
                      type="number"
                      value={ob.customX ?? 0}
                      onChange={(e) => updateOuterBg({ customX: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-600 block">إزاحة رأسية Y (px):</span>
                    <input
                      type="number"
                      value={ob.customY ?? 0}
                      onChange={(e) => updateOuterBg({ customY: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono bg-white"
                    />
                  </div>
                </div>

                {/* Filters: Brightness & Blur */}
                <div className="space-y-2 pt-1 border-t border-blue-200/60">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                    <span>السطوع (Brightness):</span>
                    <span className="font-mono">{ob.brightness ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={ob.brightness ?? 100}
                    onChange={(e) => updateOuterBg({ brightness: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#004AA5]"
                  />

                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                    <span>التغبيش (Blur):</span>
                    <span className="font-mono">{ob.blur ?? 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={ob.blur ?? 0}
                    onChange={(e) => updateOuterBg({ blur: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#004AA5]"
                  />
                </div>

                {/* Gradient Overlay over Background Image */}
                <div className="space-y-2 pt-2 border-t border-blue-200">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#0B2E57] flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(ob.overlay?.enabled)}
                        onChange={(e) => updateOuterOverlay({ enabled: e.target.checked })}
                        className="rounded text-[#004AA5] focus:ring-[#004AA5]"
                      />
                      تفعيل طبقة تدرج لوني فوق صورة الخلفية (Overlay)
                    </label>
                  </div>

                  {ob.overlay?.enabled && (
                    <div className="space-y-2 bg-white p-2.5 rounded-xl border border-blue-200">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block">لون البداية:</label>
                          <input
                            type="color"
                            value={ob.overlay.startColor || '#0B2E57'}
                            onChange={(e) => updateOuterOverlay({ startColor: e.target.value })}
                            className="w-full h-7 rounded border border-slate-300 p-0.5 cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block">لون النهاية:</label>
                          <input
                            type="color"
                            value={ob.overlay.endColor || '#000E20'}
                            onChange={(e) => updateOuterOverlay({ endColor: e.target.value })}
                            className="w-full h-7 rounded border border-slate-300 p-0.5 cursor-pointer"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-600">
                          <span>شفافية طبقة التدرج:</span>
                          <span className="font-mono">{ob.overlay.opacity ?? 75}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={ob.overlay.opacity ?? 75}
                          onChange={(e) => updateOuterOverlay({ opacity: parseInt(e.target.value, 10) })}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#004AA5]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* GROUP 2: ZONE B — CENTRAL HUB MENU CARD                  */}
      {/* ======================================================== */}
      <div className="p-4 space-y-3">
        <button
          type="button"
          onClick={() => {
            toggleGroup('zone_b');
            onSelectElement?.('menu_panel');
          }}
          className={`w-full flex items-center justify-between text-xs font-black transition cursor-pointer p-2 rounded-xl ${
            activeGroup === 'zone_b' || selectedElementKey === 'menu_panel'
              ? 'bg-amber-50/70 text-[#CC9048]'
              : 'text-[#0B2E57] hover:text-[#CC9048]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-[#CC9048] text-white flex items-center justify-center text-[10px] font-black">
              2
            </span>
            <div className="text-right">
              <span className="block font-black">لوحة القوائم — HUB Menu Panel</span>
              <span className="text-[10px] text-slate-500 font-medium block">
                تخصيص البطاقة البيضاء المركزية وأزرار الوصول
              </span>
            </div>
          </div>
          {activeGroup === 'zone_b' ? (
            <ChevronUp className="w-4 h-4 text-[#CC9048]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {activeGroup === 'zone_b' && (
          <div className="space-y-3 pt-1 pr-2">
            {/* Card Background Color */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">لون خلفية البطاقة:</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={mp.bgColor || '#FFFFFF'}
                  onChange={(e) => updateMenuPanel({ bgColor: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-slate-300 p-0.5 cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={mp.bgColor || '#FFFFFF'}
                  onChange={(e) => updateMenuPanel({ bgColor: e.target.value })}
                  className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg text-slate-800 bg-white"
                />
              </div>
            </div>

            {/* Card Width & Proportion Control */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>عرض وحجم البطاقة (Card Width):</span>
                <span className="font-mono text-amber-700 text-xs">
                  {mp.width || (config.layoutType === 'centered' ? '520px' : '1040px')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { id: '1040px', label: 'عريض فاخر (1040px)', desc: 'مثالي للواجهات المنقسمة' },
                  { id: '1140px', label: 'فائق الاتساع (1140px)', desc: 'مساحة عريضة جداً' },
                  { id: '920px', label: 'متوسط متوازن (920px)', desc: 'مدمج ومتناسق' },
                  { id: '520px', label: 'مركزي فردي (520px)', desc: 'بدون لوحة جانبية' },
                ].map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => updateMenuPanel({ width: w.id })}
                    className={`px-2 py-1.5 rounded-lg border text-right transition cursor-pointer ${
                      (mp.width || (config.layoutType === 'centered' ? '520px' : '1040px')) === w.id
                        ? 'bg-[#004AA5] text-white border-[#004AA5] font-bold shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <div className="text-[11px]">{w.label}</div>
                    <div
                      className={`text-[9px] truncate ${
                        (mp.width || (config.layoutType === 'centered' ? '520px' : '1040px')) === w.id
                          ? 'text-blue-100'
                          : 'text-slate-400'
                      }`}
                    >
                      {w.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Border Radius & Shadow Intensity */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 block">استدارة الحواف:</label>
                <select
                  value={mp.borderRadius || '30px'}
                  onChange={(e) => updateMenuPanel({ borderRadius: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                >
                  <option value="16px">حواف بسيطة (16px)</option>
                  <option value="24px">حواف متوسطة (24px)</option>
                  <option value="30px">الافتراضي الفاخر (30px)</option>
                  <option value="40px">فائقة الاستدارة (40px)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 block">شدة الظل (Shadow):</label>
                <select
                  value={mp.shadowIntensity || 'xl'}
                  onChange={(e) => updateMenuPanel({ shadowIntensity: e.target.value as any })}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                >
                  <option value="none">بدون ظل (None)</option>
                  <option value="sm">ظل خفيف (Small)</option>
                  <option value="md">ظل متوسط (Medium)</option>
                  <option value="lg">ظل بارز (Large)</option>
                  <option value="xl">ظل فاخر (XL)</option>
                  <option value="2xl">ظل سينمائي (2XL)</option>
                </select>
              </div>
            </div>

            {/* Text Colors inside Menu Card */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 block">ألوان العناوين والنصوص:</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">لون العنوان الرئيسي:</label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="color"
                      value={mp.headingColor || '#0B2E57'}
                      onChange={(e) => updateMenuPanel({ headingColor: e.target.value })}
                      className="w-7 h-7 rounded border border-slate-300 p-0.5 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={mp.headingColor || '#0B2E57'}
                      onChange={(e) => updateMenuPanel({ headingColor: e.target.value })}
                      className="flex-1 px-2 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">لون النص الوصفي:</label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="color"
                      value={mp.descriptionColor || '#5E7086'}
                      onChange={(e) => updateMenuPanel({ descriptionColor: e.target.value })}
                      className="w-7 h-7 rounded border border-slate-300 p-0.5 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={mp.descriptionColor || '#5E7086'}
                      onChange={(e) => updateMenuPanel({ descriptionColor: e.target.value })}
                      className="flex-1 px-2 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Logo Variant in Menu Card */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-700 block">شعار البطاقة المركزية:</label>
              <select
                value={mp.logoVariant || 'horizontal-on-white'}
                onChange={(e) => updateMenuPanel({ logoVariant: e.target.value as any })}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
              >
                <option value="horizontal-on-white">شعار أفقي على خلفية بيضاء (رسمي)</option>
                <option value="horizontal-on-blue">شعار أفقي على خلفية زرقاء</option>
                <option value="horizontal-on-gold">شعار أفقي على خلفية ذهبية</option>
                <option value="vertical-on-white">شعار رأسي على خلفية بيضاء</option>
              </select>
            </div>

            {/* Input & Button Styling (for login forms or interactive cards) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 block">حقول الإدخال والأزرار (Inputs & Buttons):</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">خلفية حقل الإدخال:</label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="color"
                      value={config.inputBg || '#F8FAFC'}
                      onChange={(e) => onChangeConfig({ inputBg: e.target.value })}
                      className="w-7 h-7 rounded border border-slate-300 p-0.5 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={config.inputBg || '#F8FAFC'}
                      onChange={(e) => onChangeConfig({ inputBg: e.target.value })}
                      className="flex-1 px-2 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">إطار حقل الإدخال:</label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="color"
                      value={config.inputBorder || '#D7E7F7'}
                      onChange={(e) => onChangeConfig({ inputBorder: e.target.value })}
                      className="w-7 h-7 rounded border border-slate-300 p-0.5 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={config.inputBorder || '#D7E7F7'}
                      onChange={(e) => onChangeConfig({ inputBorder: e.target.value })}
                      className="flex-1 px-2 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">لون نص الإدخال:</label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="color"
                      value={config.inputTextColor || '#0B2E57'}
                      onChange={(e) => onChangeConfig({ inputTextColor: e.target.value })}
                      className="w-7 h-7 rounded border border-slate-300 p-0.5 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={config.inputTextColor || '#0B2E57'}
                      onChange={(e) => onChangeConfig({ inputTextColor: e.target.value })}
                      className="flex-1 px-2 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">استدارة حقول الإدخال:</label>
                  <select
                    value={config.inputRadius || '12px'}
                    onChange={(e) => onChangeConfig({ inputRadius: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold mt-1"
                  >
                    <option value="6px">بسيطة (6px)</option>
                    <option value="12px">افتراضية (12px)</option>
                    <option value="16px">دائرية فاخرة (16px)</option>
                    <option value="24px">بيضوية كاملة (24px)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">لون زر الإجراء الرئيسي:</label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="color"
                      value={config.primaryButtonBg || mp.buttonBg || '#004AA5'}
                      onChange={(e) => {
                        onChangeConfig({ primaryButtonBg: e.target.value });
                        updateMenuPanel({ buttonBg: e.target.value });
                      }}
                      className="w-7 h-7 rounded border border-slate-300 p-0.5 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={config.primaryButtonBg || mp.buttonBg || '#004AA5'}
                      onChange={(e) => {
                        onChangeConfig({ primaryButtonBg: e.target.value });
                        updateMenuPanel({ buttonBg: e.target.value });
                      }}
                      className="flex-1 px-2 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">لون نص الزر:</label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="color"
                      value={config.primaryButtonTextColor || mp.buttonTextColor || '#FFFFFF'}
                      onChange={(e) => {
                        onChangeConfig({ primaryButtonTextColor: e.target.value });
                        updateMenuPanel({ buttonTextColor: e.target.value });
                      }}
                      className="w-7 h-7 rounded border border-slate-300 p-0.5 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={config.primaryButtonTextColor || mp.buttonTextColor || '#FFFFFF'}
                      onChange={(e) => {
                        onChangeConfig({ primaryButtonTextColor: e.target.value });
                        updateMenuPanel({ buttonTextColor: e.target.value });
                      }}
                      className="flex-1 px-2 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* GROUP 3: ZONE C — SIDE ILLUSTRATION PANEL                */}
      {/* ======================================================== */}
      <div className="p-4 space-y-3">
        <button
          type="button"
          onClick={() => {
            toggleGroup('zone_c');
            onSelectElement?.('side_panel');
          }}
          className={`w-full flex items-center justify-between text-xs font-black transition cursor-pointer p-2 rounded-xl ${
            activeGroup === 'zone_c' || selectedElementKey === 'side_panel' || selectedElementKey === 'illustration'
              ? 'bg-emerald-50/70 text-emerald-800'
              : 'text-[#0B2E57] hover:text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
              3
            </span>
            <div className="text-right">
              <span className="block font-black">اللوحة الجانبية — Side Illustration Panel</span>
              <span className="text-[10px] text-slate-500 font-medium block">
                مستقلة تماماً: الخلفية، المجسم الشفاف 3D، والشعار
              </span>
            </div>
          </div>
          {activeGroup === 'zone_c' ? (
            <ChevronUp className="w-4 h-4 text-emerald-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {activeGroup === 'zone_c' && (
          <div className="space-y-4 pt-1 pr-2">
            {/* 3.1 Side Panel Background */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-800 block">
                أ. خلفية اللوحة الجانبية (Panel Background):
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                {[
                  { id: 'gradient', label: 'تدرج ملكي (Gradient)' },
                  { id: 'solid', label: 'لون خالص (Solid)' },
                  { id: 'image', label: 'صورة خلفية خاصة' },
                  { id: 'transparent', label: 'شفافة (Transparent)' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => updateSidePanel({ bgType: t.id as any })}
                    className={`px-2.5 py-1.5 rounded-lg border text-center font-bold transition cursor-pointer ${
                      sp.bgType === t.id
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {sp.bgType !== 'transparent' && (
                <div className="space-y-1 pt-1">
                  <label className="text-[10px] font-bold text-slate-600 block">لون خلفية اللوحة الجانبية:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={sp.bgColor || '#071629'}
                      onChange={(e) => updateSidePanel({ bgColor: e.target.value })}
                      className="w-8 h-8 rounded border border-slate-300 p-0.5 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={sp.bgColor || '#071629'}
                      onChange={(e) => updateSidePanel({ bgColor: e.target.value })}
                      className="flex-1 px-3 py-1 text-xs font-mono border border-slate-200 rounded-lg text-slate-800 bg-white"
                    />
                  </div>
                </div>
              )}

              {sp.bgType === 'image' && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold text-slate-600 block">
                    صورة خلفية خاصة باللوحة الجانبية:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={sp.bgImage || ''}
                      onChange={(e) => updateSidePanel({ bgImage: e.target.value })}
                      placeholder="/assets/brand/hub-entry.jpg"
                      className="flex-1 min-w-[170px] px-3 py-1 text-xs font-mono border border-slate-300 rounded-lg text-slate-800 bg-white"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        onSelectElement?.('side_panel');
                        onOpenMediaPicker('side_panel_bg');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 cursor-pointer"
                    >
                      مكتبة الصور
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputC1Ref.current?.click()}
                      disabled={uploadingC1}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{uploadingC1 ? 'جاري...' : 'رفع خلفية'}</span>
                    </button>
                    <input
                      ref={fileInputC1Ref}
                      type="file"
                      accept="image/*,.png,.jpg,.jpeg,.webp,.svg,.avif"
                      onChange={handleUploadSideBg}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3.2 Foreground Floating Illustration / Custom Image */}
            <div className="space-y-3 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900 block">
                    ب. الصورة التعبيرية أو المجسم أو الصورة المخصصة (Foreground):
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium block">
                    يدعم أي صورة عادية، صورة فوتوغرافية، مجسم 3D، PNG شفاف، JPG، WebP، أو SVG
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {sp.foregroundImage && (
                    <button
                      type="button"
                      onClick={() => updateSidePanel({ foregroundImage: '' })}
                      className="text-[10px] text-red-600 hover:text-red-700 font-bold flex items-center gap-0.5 cursor-pointer"
                      title="إزالة الصورة"
                    >
                      <Trash2 className="w-3 h-3" />
                      إزالة
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      updateSidePanel({
                        illustrationScale: 100,
                        illustrationCustomX: 0,
                        illustrationCustomY: 0,
                        illustrationRotation: 0,
                        illustrationFit: 'contain',
                      })
                    }
                    className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                    title="استعادة الموضع والحجم الافتراضي"
                  >
                    <RotateCcw className="w-3 h-3" />
                    إعادة ضبط
                  </button>
                </div>
              </div>

              {/* Foreground Image Selector & Instant Uploader */}
              <div className="space-y-1">
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={sp.foregroundImage || ''}
                    onChange={(e) => updateSidePanel({ foregroundImage: e.target.value })}
                    placeholder="/assets/brand/hub-entry.jpg أو ضع مسار أي صورة"
                    className="flex-1 min-w-[170px] px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg text-slate-800 bg-white"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onSelectElement?.('illustration');
                      onOpenMediaPicker('illustration');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 cursor-pointer shrink-0"
                  >
                    مكتبة الصور
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputC2Ref.current?.click()}
                    disabled={uploadingC2}
                    className="px-3 py-1.5 rounded-lg bg-[#004AA5] text-white text-xs font-bold hover:bg-[#003B84] cursor-pointer shrink-0 flex items-center gap-1 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingC2 ? 'جاري الرفع...' : 'رفع صورة من جهازك'}</span>
                  </button>
                  <input
                    ref={fileInputC2Ref}
                    type="file"
                    accept="image/*,.png,.jpg,.jpeg,.webp,.svg,.avif"
                    onChange={handleUploadSideForeground}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Quick Presets (Photos, Official Graphics & 3D Models) */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-600 block">نماذج وصور سريعة:</span>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  {[
                    {
                      name: 'صورة سفر ومطار كاملة (JPG)',
                      url: '/assets/brand/hub-entry.jpg',
                    },
                    {
                      name: 'طائرة وخدمات شاملة 3D',
                      url: '/assets/brand/3d/01-master-service-hero-transparent.png',
                    },
                    {
                      name: 'وثائق ومواعيد قنصلية 3D',
                      url: '/assets/brand/3d/02-consular-documents-transparent.png',
                    },
                    {
                      name: 'فنادق وإقامة في تركيا 3D',
                      url: '/assets/brand/3d/04-hotels-residency-transparent.png',
                    },
                    {
                      name: 'ترجمة ونوتير معتمد 3D',
                      url: '/assets/brand/3d/03-translation-transparent.png',
                    },
                    {
                      name: 'شعار الفزني الرسمي على أزرق',
                      url: '/assets/brand/logo-horizontal-on-blue.svg',
                    },
                  ].map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => updateSidePanel({ foregroundImage: p.url })}
                      className={`px-2 py-1 rounded-lg border text-right truncate font-bold transition cursor-pointer ${
                        sp.foregroundImage === p.url
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Fit Mode (contain, cover, original, custom) */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-700 block">نمط ملاءمة الصورة (Fit Mode):</span>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {[
                    { id: 'contain', label: 'احتواء (Contain / Fit)', desc: 'يحتوي كامل الصورة دون قص' },
                    { id: 'cover', label: 'تعبئة كاملة (Cover / Fill)', desc: 'يملأ كامل اللوحة الجانبية' },
                    { id: 'original', label: 'الحجم الأصلي (Original)', desc: 'أبعاد الصورة الطبيعية' },
                    { id: 'custom', label: 'مخصص (Custom)', desc: 'تحديد دقيق للأبعاد' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => updateSidePanel({ illustrationFit: mode.id as any })}
                      className={`px-2 py-1.5 rounded-lg border text-right transition cursor-pointer ${
                        (sp.illustrationFit || config.illustrationFit || 'contain') === mode.id
                          ? 'bg-emerald-700 text-white border-emerald-700 font-bold shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="text-[11px]">{mode.label}</div>
                      <div
                        className={`text-[9px] truncate ${
                          (sp.illustrationFit || config.illustrationFit || 'contain') === mode.id
                            ? 'text-emerald-100'
                            : 'text-slate-400'
                        }`}
                      >
                        {mode.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale Slider (0% - 400%) + Numeric Input + Presets */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span>حجم الصورة / المجسم (Scale):</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="400"
                      step="1"
                      value={sp.illustrationScale ?? config.illustrationScale ?? 100}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(400, parseInt(e.target.value, 10) || 0));
                        updateSidePanel({ illustrationScale: val });
                      }}
                      className="w-16 px-1.5 py-0.5 text-center text-xs font-mono font-bold border border-slate-300 rounded-md bg-white text-emerald-800"
                    />
                    <span className="text-xs font-mono text-emerald-800">%</span>
                    <button
                      type="button"
                      onClick={() => updateSidePanel({ illustrationScale: 100 })}
                      className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 font-bold"
                      title="إعادة التعيين إلى 100%"
                    >
                      100%
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="400"
                  step="1"
                  value={sp.illustrationScale ?? config.illustrationScale ?? 100}
                  onChange={(e) => updateSidePanel({ illustrationScale: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
                />
                {/* Scale preset pills */}
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {[25, 50, 75, 100, 150, 200, 300, 400].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => updateSidePanel({ illustrationScale: preset })}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition cursor-pointer ${
                        (sp.illustrationScale ?? config.illustrationScale ?? 100) === preset
                          ? 'bg-emerald-700 text-white font-bold'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom X & Y offsets */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-600 block">إزاحة X (أفقي px):</span>
                  <input
                    type="number"
                    value={sp.illustrationCustomX ?? 0}
                    onChange={(e) => updateSidePanel({ illustrationCustomX: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono bg-white mt-1"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-600 block">إزاحة Y (رأسي px):</span>
                  <input
                    type="number"
                    value={sp.illustrationCustomY ?? 0}
                    onChange={(e) => updateSidePanel({ illustrationCustomY: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono bg-white mt-1"
                  />
                </div>
              </div>

              {/* Rotation & Opacity */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-600">
                    <span>التدوير:</span>
                    <span className="font-mono">{sp.illustrationRotation ?? 0}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={sp.illustrationRotation ?? 0}
                    onChange={(e) => updateSidePanel({ illustrationRotation: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700 mt-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-600">
                    <span>الشفافية:</span>
                    <span className="font-mono">{sp.illustrationOpacity ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sp.illustrationOpacity ?? 100}
                    onChange={(e) => updateSidePanel({ illustrationOpacity: parseInt(e.target.value, 10) })}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-700 mt-2"
                  />
                </div>
              </div>
            </div>

            {/* 3.3 Logo in Side Panel */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-800 block">ج. شعار اللوحة الجانبية:</span>
              <select
                value={sp.logoVariant || 'horizontal-on-blue'}
                onChange={(e) => updateSidePanel({ logoVariant: e.target.value })}
                className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
              >
                <option value="horizontal-on-blue">شعار أفقي على أزرق (الافتراضي الرسمي)</option>
                <option value="horizontal-on-white">شعار أفقي على أبيض</option>
                <option value="horizontal-on-gold">شعار أفقي على ذهبي</option>
                <option value="vertical-on-blue">شعار رأسي على أزرق</option>
              </select>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-600 block">عرض الشعار (px):</span>
                  <input
                    type="number"
                    min="60"
                    max="360"
                    value={sp.logoWidth ?? 160}
                    onChange={(e) => updateSidePanel({ logoWidth: parseInt(e.target.value, 10) || 160 })}
                    className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg font-mono bg-white mt-1"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-600 block">الموضع:</span>
                  <select
                    value={sp.logoPosition || 'start'}
                    onChange={(e) => updateSidePanel({ logoPosition: e.target.value as any })}
                    className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded-lg font-bold mt-1"
                  >
                    <option value="start">البداية (يمين)</option>
                    <option value="center">الوسط</option>
                    <option value="end">النهاية (يسار)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3.4 Text & Headings in Side Panel */}
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-800 block">د. نصوص وعناوين اللوحة الجانبية:</span>
              <div className="space-y-1.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">العنوان بالعربية:</label>
                  <input
                    type="text"
                    value={sp.headingAr || ''}
                    onChange={(e) => updateSidePanel({ headingAr: e.target.value })}
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block">الوصف بالعربية:</label>
                  <input
                    type="text"
                    value={sp.descriptionAr || ''}
                    onChange={(e) => updateSidePanel({ descriptionAr: e.target.value })}
                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">لون العنوان:</label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="color"
                        value={sp.headingColor || '#FFFFFF'}
                        onChange={(e) => updateSidePanel({ headingColor: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-300 p-0.5 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={sp.headingColor || '#FFFFFF'}
                        onChange={(e) => updateSidePanel({ headingColor: e.target.value })}
                        className="flex-1 px-2 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">لون الوصف:</label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="color"
                        value={sp.descriptionColor || '#E2E8F0'}
                        onChange={(e) => updateSidePanel({ descriptionColor: e.target.value })}
                        className="w-7 h-7 rounded border border-slate-300 p-0.5 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        value={sp.descriptionColor || '#E2E8F0'}
                        onChange={(e) => updateSidePanel({ descriptionColor: e.target.value })}
                        className="flex-1 px-2 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* GROUP 4: GRADIENTS & OVERLAYS                            */}
      {/* ======================================================== */}
      <div className="p-4 space-y-3">
        <button
          type="button"
          onClick={() => toggleGroup('group_gradient')}
          className={`w-full flex items-center justify-between text-xs font-black transition cursor-pointer p-2 rounded-xl ${
            activeGroup === 'group_gradient'
              ? 'bg-blue-50/70 text-[#004AA5]'
              : 'text-[#0B2E57] hover:text-[#004AA5]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-[#004AA5] text-white flex items-center justify-center text-[10px] font-black">
              4
            </span>
            <span>التدرجات اللونية — Gradients & Overlays</span>
          </div>
          {activeGroup === 'group_gradient' ? (
            <ChevronUp className="w-4 h-4 text-[#004AA5]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {activeGroup === 'group_gradient' && (
          <div className="pt-2">
            <ThemeGradientEditor
              gradient={sp.bgGradient || config.gradient}
              onChange={(gradient) => {
                updateSidePanel({ bgGradient: gradient });
                onChangeConfig({ gradient });
              }}
              language="ar"
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* GROUP 5: TYPOGRAPHY & LOGOS                              */}
      {/* ======================================================== */}
      <div className="p-4 space-y-3">
        <button
          type="button"
          onClick={() => toggleGroup('group_typography')}
          className={`w-full flex items-center justify-between text-xs font-black transition cursor-pointer p-2 rounded-xl ${
            activeGroup === 'group_typography'
              ? 'bg-blue-50/70 text-[#004AA5]'
              : 'text-[#0B2E57] hover:text-[#004AA5]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-[#004AA5] text-white flex items-center justify-center text-[10px] font-black">
              5
            </span>
            <span>النصوص والشعارات — Typography & Logos</span>
          </div>
          {activeGroup === 'group_typography' ? (
            <ChevronUp className="w-4 h-4 text-[#004AA5]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {activeGroup === 'group_typography' && (
          <div className="pt-2">
            <ThemeTypographyColorsEditor
              config={config}
              onChange={(patch) => onChangeConfig(patch)}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* GROUP 6: LAYERS                                          */}
      {/* ======================================================== */}
      <div className="p-4 space-y-3">
        <button
          type="button"
          onClick={() => toggleGroup('group_layers')}
          className={`w-full flex items-center justify-between text-xs font-black transition cursor-pointer p-2 rounded-xl ${
            activeGroup === 'group_layers'
              ? 'bg-blue-50/70 text-[#004AA5]'
              : 'text-[#0B2E57] hover:text-[#004AA5]'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg bg-[#004AA5] text-white flex items-center justify-center text-[10px] font-black">
              6
            </span>
            <span>الطبقات البصرية — Layer Management</span>
          </div>
          {activeGroup === 'group_layers' ? (
            <ChevronUp className="w-4 h-4 text-[#004AA5]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {activeGroup === 'group_layers' && (
          <div className="pt-2">
            <ThemeLayerManager
              layers={config.layers}
              onChange={(layers) => onChangeConfig({ layers })}
              selectedLayerId={selectedElementKey}
              onSelectLayer={(id) => onSelectElement?.(id)}
              language="ar"
            />
          </div>
        )}
      </div>
    </div>
  );
};
