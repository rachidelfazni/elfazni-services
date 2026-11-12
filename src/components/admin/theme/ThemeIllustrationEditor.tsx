import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  RotateCcw,
  Maximize2,
  Minimize2,
  Move,
  Crop,
  ShieldAlert,
  Eye,
  EyeOff,
  Sparkles,
  Upload,
  Trash2,
} from 'lucide-react';
import {
  InterfaceThemeConfig,
  DEFAULT_LAYERS,
  themeService,
} from '../../../services/themeService';

interface ThemeIllustrationEditorProps {
  config: InterfaceThemeConfig;
  onChangeConfig: (updates: Partial<InterfaceThemeConfig>) => void;
  onOpenMediaPicker: () => void;
}

// Root illustration fields that the renderer (ThemeVisualPanel) resolves from
// sidePanel FIRST. Every edit must be mirrored into sidePanel, otherwise a stale
// sidePanel value silently overrides the user's change.
const SIDE_PANEL_MIRROR: Record<string, string> = {
  illustrationScale: 'illustrationScale',
  illustrationCustomX: 'illustrationCustomX',
  illustrationCustomY: 'illustrationCustomY',
  illustrationRotation: 'illustrationRotation',
  illustrationOpacity: 'illustrationOpacity',
  illustrationFit: 'illustrationFit',
  illustrationPosition: 'illustrationAlignment',
};

export const ThemeIllustrationEditor: React.FC<ThemeIllustrationEditorProps> = ({
  config,
  onChangeConfig: onChangeConfigRaw,
  onOpenMediaPicker,
}) => {
  const sp = config.sidePanel;
  const onChangeConfig = (updates: Partial<InterfaceThemeConfig>) => {
    if (!sp) return onChangeConfigRaw(updates);
    const spPatch: Record<string, unknown> = {};
    for (const [rootKey, spKey] of Object.entries(SIDE_PANEL_MIRROR)) {
      if (rootKey in updates) spPatch[spKey] = (updates as any)[rootKey];
    }
    if (Object.keys(spPatch).length === 0) return onChangeConfigRaw(updates);
    onChangeConfigRaw({
      ...updates,
      sidePanel: { ...sp, ...(updates.sidePanel || {}), ...spPatch } as any,
    });
  };

  const currentScale =
    typeof sp?.illustrationScale === 'number'
      ? sp.illustrationScale
      : typeof config.illustrationScale === 'number'
      ? config.illustrationScale
      : 100;
  const customX = sp?.illustrationCustomX ?? config.illustrationCustomX ?? 0;
  const customY = sp?.illustrationCustomY ?? config.illustrationCustomY ?? 0;
  const fitMode = sp?.illustrationFit || config.illustrationFit || 'contain';
  const horizPos = (sp?.illustrationAlignment as any) || config.illustrationPosition || 'center';
  const vertPos = config.illustrationVerticalPosition || 'center';
  const clip = config.illustrationClip || { top: 0, right: 0, bottom: 0, left: 0 };

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentIllustration =
    config.sidePanel?.foregroundImage ||
    config.illustrationUrl ||
    '';

  const updateIllustration = (newUrl: string) => {
    onChangeConfig({
      illustrationUrl: newUrl,
      decorativeIllustration: newUrl,
      ...(config.sidePanel
        ? {
            sidePanel: {
              ...config.sidePanel,
              foregroundImage: newUrl,
            },
          }
        : {}),
    });
  };

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const asset = await themeService.uploadMedia(file, 'illustration');
      updateIllustration(asset.url);
    } catch (err: any) {
      alert(err.message || 'فشل رفع الصورة');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const activeLayers = config.layers && config.layers.length > 0 ? config.layers : DEFAULT_LAYERS;
  const logoLayer = activeLayers.find((l) => l.id === 'logo');
  const contentLayer = activeLayers.find((l) => l.id === 'content');
  const isPosterMode = logoLayer?.visible === false && contentLayer?.visible === false;

  const togglePosterMode = () => {
    const nextVisible = isPosterMode ? true : false;
    const updatedLayers = activeLayers.map((l) =>
      l.id === 'logo' || l.id === 'content' ? { ...l, visible: nextVisible } : l
    );
    onChangeConfig({ layers: updatedLayers });
  };

  const handleScaleInput = (valStr: string) => {
    const parsed = parseInt(valStr, 10);
    if (isNaN(parsed)) {
      onChangeConfig({ illustrationScale: 0 });
      return;
    }
    const clamped = Math.max(0, Math.min(400, parsed));
    onChangeConfig({ illustrationScale: clamped });
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* 1. Media Library Selector & URL Input */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenMediaPicker}
            className="py-2 px-3 rounded-xl bg-[#004AA5] hover:bg-[#003882] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ImageIcon className="w-4 h-4 text-[#CC9048]" />
            <span>مكتبة الصور</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'جاري الرفع...' : 'رفع صورة من جهازك'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.png,.jpg,.jpeg,.webp,.svg,.avif"
            onChange={handleDirectUpload}
            className="hidden"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-slate-600 block">
              مسار الصورة (يدعم أي صورة أو صورة فوتوغرافية أو PNG شفاف أو مجسم):
            </label>
            {currentIllustration && (
              <button
                type="button"
                onClick={() => updateIllustration('')}
                className="text-[10px] text-red-600 hover:text-red-700 font-bold flex items-center gap-0.5 cursor-pointer"
                title="إزالة الصورة"
              >
                <Trash2 className="w-3 h-3" />
                <span>إزالة الصورة</span>
              </button>
            )}
          </div>
          <input
            type="text"
            value={currentIllustration}
            onChange={(e) => updateIllustration(e.target.value)}
            placeholder="/assets/brand/hub-entry.jpg أو ضع مسار أي صورة"
            className="w-full px-2.5 py-1.5 text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            dir="ltr"
          />
        </div>

        {/* Quick Presets Pills */}
        <div className="space-y-1 pt-1">
          <span className="text-[10px] font-bold text-slate-500 block">نماذج وصور سريعة:</span>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            {[
              { name: 'صورة سفر ومطار (JPG)', url: '/assets/brand/hub-entry.jpg' },
              { name: 'فنادق وإقامة 3D', url: '/assets/brand/3d/04-hotels-residency-transparent.png' },
              { name: 'طائرة وخدمات 3D', url: '/assets/brand/3d/01-master-service-hero-transparent.png' },
              { name: 'وثائق ومواعيد 3D', url: '/assets/brand/3d/02-consular-documents-transparent.png' },
              { name: 'شعار الفزني الرسمي', url: '/assets/brand/logo-horizontal-on-blue.svg' },
            ].map((p) => (
              <button
                key={p.url}
                type="button"
                onClick={() => updateIllustration(p.url)}
                className={`px-2 py-1 rounded-lg border text-right truncate font-bold transition cursor-pointer ${
                  currentIllustration === p.url
                    ? 'bg-[#004AA5] text-white border-[#004AA5]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Display Modes & Quick Action Buttons (Reset 100%, Fit, Fill, Original) */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-[#0B2E57]">نمط العرض والتحجيم السريع:</span>
          <button
            type="button"
            onClick={() =>
              onChangeConfig({
                illustrationScale: 100,
                illustrationFit: 'contain',
                illustrationPosition: 'center',
                illustrationVerticalPosition: 'center',
                illustrationCustomX: 0,
                illustrationCustomY: 0,
                illustrationRotation: 0,
              })
            }
            className="text-[10px] font-bold text-[#004AA5] hover:underline flex items-center gap-1 cursor-pointer"
            title="إعادة الحجم لـ 100% والموضع للوسط"
          >
            <RotateCcw className="w-3 h-3" />
            <span>إعادة لـ 100%</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onChangeConfig({ illustrationFit: 'contain', illustrationScale: 100 })}
            className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
              fitMode === 'contain'
                ? 'bg-[#004AA5] text-white border-[#004AA5]'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Minimize2 className="w-3 h-3" />
            <span>احتواء (Fit / Contain)</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeConfig({ illustrationFit: 'cover', illustrationScale: 100 })}
            className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
              fitMode === 'cover'
                ? 'bg-[#004AA5] text-white border-[#004AA5]'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Maximize2 className="w-3 h-3" />
            <span>ملء اللوحة (Fill / Cover)</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeConfig({ illustrationFit: 'original', illustrationScale: 100 })}
            className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
              fitMode === 'original'
                ? 'bg-[#004AA5] text-white border-[#004AA5]'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-3 h-3" />
            <span>الحجم الأصلي (Original)</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeConfig({ illustrationFit: 'custom' })}
            className={`py-1.5 px-2 rounded-lg border text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer ${
              fitMode === 'custom'
                ? 'bg-[#004AA5] text-white border-[#004AA5]'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>أبعاد مخصصة (Custom)</span>
          </button>
        </div>

        {fitMode === 'custom' && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] font-bold text-slate-500 block">العرض (Width):</label>
              <input
                type="text"
                value={config.illustrationWidth || ''}
                onChange={(e) => onChangeConfig({ illustrationWidth: e.target.value })}
                placeholder="مثال: 320px أو 80%"
                className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-200 rounded-lg"
                dir="ltr"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 block">الارتفاع (Height):</label>
              <input
                type="text"
                value={config.illustrationHeight || ''}
                onChange={(e) => onChangeConfig({ illustrationHeight: e.target.value })}
                placeholder="مثال: 320px أو auto"
                className="w-full px-2 py-1 text-xs font-mono bg-white border border-slate-200 rounded-lg"
                dir="ltr"
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Scale Control (0% - 400%, step 1%, numeric input + quick pills) */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-black text-[#0B2E57]">حجم الصورة (0% – 400%):</label>
          <div className="flex items-center gap-1" dir="ltr">
            <input
              type="number"
              min={0}
              max={400}
              step={1}
              value={currentScale}
              onChange={(e) => handleScaleInput(e.target.value)}
              className="w-16 px-2 py-1 text-xs font-mono font-bold text-center bg-white border border-slate-300 rounded-lg text-[#004AA5] focus:ring-2 focus:ring-[#004AA5]/30"
              aria-label="Illustration Scale Percentage"
            />
            <span className="text-xs font-mono font-bold text-slate-600">%</span>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={400}
          step={1}
          value={currentScale}
          onChange={(e) => onChangeConfig({ illustrationScale: parseInt(e.target.value, 10) })}
          className="w-full accent-[#004AA5] cursor-pointer"
        />

        {/* Quick Scale Preset Pills */}
        <div className="flex flex-wrap gap-1 pt-0.5" dir="ltr">
          {[0, 25, 50, 75, 100, 150, 200, 250, 300, 400].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => onChangeConfig({ illustrationScale: pct })}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border transition cursor-pointer ${
                currentScale === pct
                  ? 'bg-[#004AA5] text-white border-[#004AA5]'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {/* 4. Independent Image Positioning (Horizontal, Vertical, X/Y Sliders & Inputs) */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#0B2E57] flex items-center gap-1.5">
            <Move className="w-3.5 h-3.5 text-[#004AA5]" />
            <span>الموضع والتحريك الحر (Position X/Y)</span>
          </span>
          {(customX !== 0 || customY !== 0) && (
            <button
              type="button"
              onClick={() =>
                onChangeConfig({
                  illustrationCustomX: 0,
                  illustrationCustomY: 0,
                  illustrationPosition: 'center',
                  illustrationVerticalPosition: 'center',
                })
              }
              className="text-[10px] font-bold text-amber-700 hover:underline cursor-pointer"
            >
              تصفير X/Y
            </button>
          )}
        </div>

        {/* Horizontal Position */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 block">المحاذاة الأفقية (Horizontal):</label>
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'left', label: 'يسار (Left)' },
              { id: 'center', label: 'وسط' },
              { id: 'right', label: 'يمين (Right)' },
              { id: 'custom', label: 'مخصص X' },
            ].map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() =>
                  onChangeConfig({
                    illustrationPosition: pos.id as any,
                    ...(pos.id !== 'custom' ? { illustrationCustomX: 0 } : {}),
                  })
                }
                className={`py-1.5 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                  horizPos === pos.id
                    ? 'bg-[#004AA5] text-white border-[#004AA5]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vertical Position */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 block">المحاذاة العمودية (Vertical):</label>
          <div className="grid grid-cols-4 gap-1">
            {[
              { id: 'top', label: 'أعلى (Top)' },
              { id: 'center', label: 'وسط' },
              { id: 'bottom', label: 'أسفل (Bottom)' },
              { id: 'custom', label: 'مخصص Y' },
            ].map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() =>
                  onChangeConfig({
                    illustrationVerticalPosition: pos.id as any,
                    ...(pos.id !== 'custom' ? { illustrationCustomY: 0 } : {}),
                  })
                }
                className={`py-1.5 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                  vertPos === pos.id
                    ? 'bg-[#004AA5] text-white border-[#004AA5]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom X Position Slider & Numeric Input */}
        <div className="space-y-1 pt-1 border-t border-slate-200/80">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-700">الإزاحة الأفقية (X Offset):</label>
            <div className="flex items-center gap-1" dir="ltr">
              <input
                type="number"
                min={-1000}
                max={1000}
                step={1}
                value={customX}
                onChange={(e) =>
                  onChangeConfig({
                    illustrationCustomX: parseInt(e.target.value || '0', 10),
                  })
                }
                className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-center bg-white border border-slate-300 rounded-md text-[#004AA5]"
              />
              <span className="text-[10px] font-mono text-slate-500">px</span>
            </div>
          </div>
          <input
            type="range"
            min={-500}
            max={500}
            step={1}
            value={Math.max(-500, Math.min(500, customX))}
            onChange={(e) =>
              onChangeConfig({
                illustrationCustomX: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-[#004AA5] cursor-pointer"
            dir="ltr"
          />
        </div>

        {/* Custom Y Position Slider & Numeric Input */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-700">الإزاحة العمودية (Y Offset):</label>
            <div className="flex items-center gap-1" dir="ltr">
              <input
                type="number"
                min={-1000}
                max={1000}
                step={1}
                value={customY}
                onChange={(e) =>
                  onChangeConfig({
                    illustrationCustomY: parseInt(e.target.value || '0', 10),
                  })
                }
                className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-center bg-white border border-slate-300 rounded-md text-[#004AA5]"
              />
              <span className="text-[10px] font-mono text-slate-500">px</span>
            </div>
          </div>
          <input
            type="range"
            min={-500}
            max={500}
            step={1}
            value={Math.max(-500, Math.min(500, customY))}
            onChange={(e) =>
              onChangeConfig({
                illustrationCustomY: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-[#004AA5] cursor-pointer"
            dir="ltr"
          />
        </div>

        <p className="text-[10px] text-slate-500 bg-blue-50/70 border border-blue-100 rounded-lg px-2.5 py-1.5 leading-relaxed">
          💡 <strong>تحريك تفاعلي:</strong> يمكنك سحب الصورة بالماوس مباشرة داخل شاشة المعاينة الحية لتحريكها لأي موضع.
        </p>
      </div>

      {/* 5. Prevent Image & Text Overlap (Safe Area Overlay + Poster Mode Toggle + Non-destructive Crop) */}
      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#0B2E57] flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#CC9048]" />
            <span>منع التداخل مع الشعار والنصوص</span>
          </span>
        </div>

        {/* Toggle Safe Area Guides */}
        <label className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
          <span className="text-[11px] font-bold text-slate-700">إظهار خطوط منطقة الأمان (Safe Area)</span>
          <input
            type="checkbox"
            checked={Boolean(config.showSafeArea)}
            onChange={(e) => onChangeConfig({ showSafeArea: e.target.checked })}
            className="rounded text-[#004AA5] w-4 h-4"
          />
        </label>

        {/* Quick Poster Mode (Hide overlay logo & text when uploaded image already has text/logo) */}
        <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-800">وضع البوستر الكامل (صورة تحتوي على نص/شعار):</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            إذا كانت الصورة المرفوعة تحتوي بالفعل على شعار وعناوين مدمجة، فعّل هذا الخيار لإخفاء الشعار والنصوص المتراكبة فوقها.
          </p>
          <button
            type="button"
            onClick={togglePosterMode}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              isPosterMode
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isPosterMode ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>إظهار الشعار والنصوص المتراكبة مجدداً</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>إخفاء الشعار والنصوص لمنع التداخل (Poster Mode)</span>
              </>
            )}
          </button>
        </div>

        {/* Non-Destructive Image Cropping */}
        <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
              <Crop className="w-3.5 h-3.5 text-[#004AA5]" />
              <span>قص غير مدمر للصورة (Crop Margins):</span>
            </span>
            {(clip.top > 0 || clip.bottom > 0 || clip.left > 0 || clip.right > 0) && (
              <button
                type="button"
                onClick={() =>
                  onChangeConfig({
                    illustrationClip: { top: 0, right: 0, bottom: 0, left: 0 },
                  })
                }
                className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
              >
                إلغاء القص
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <div className="flex justify-between font-bold text-slate-600">
                <span>قص من الأعلى:</span>
                <span className="font-mono">{clip.top}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={75}
                value={clip.top}
                onChange={(e) =>
                  onChangeConfig({
                    illustrationClip: { ...clip, top: parseInt(e.target.value, 10) },
                  })
                }
                className="w-full accent-[#004AA5]"
              />
            </div>
            <div>
              <div className="flex justify-between font-bold text-slate-600">
                <span>قص من الأسفل:</span>
                <span className="font-mono">{clip.bottom}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={75}
                value={clip.bottom}
                onChange={(e) =>
                  onChangeConfig({
                    illustrationClip: { ...clip, bottom: parseInt(e.target.value, 10) },
                  })
                }
                className="w-full accent-[#004AA5]"
              />
            </div>
            <div>
              <div className="flex justify-between font-bold text-slate-600">
                <span>قص من اليسار:</span>
                <span className="font-mono">{clip.left}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={75}
                value={clip.left}
                onChange={(e) =>
                  onChangeConfig({
                    illustrationClip: { ...clip, left: parseInt(e.target.value, 10) },
                  })
                }
                className="w-full accent-[#004AA5]"
              />
            </div>
            <div>
              <div className="flex justify-between font-bold text-slate-600">
                <span>قص من اليمين:</span>
                <span className="font-mono">{clip.right}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={75}
                value={clip.right}
                onChange={(e) =>
                  onChangeConfig({
                    illustrationClip: { ...clip, right: parseInt(e.target.value, 10) },
                  })
                }
                className="w-full accent-[#004AA5]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6. Opacity & Rotation */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>شفافية الصورة (Opacity):</span>
            <span className="font-mono text-[#004AA5]">{config.illustrationOpacity ?? 100}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={config.illustrationOpacity ?? 100}
            onChange={(e) => onChangeConfig({ illustrationOpacity: parseInt(e.target.value, 10) })}
            className="w-full accent-[#004AA5] cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>زاوية الدوران (Rotation):</span>
            <span className="font-mono text-[#004AA5]">{config.illustrationRotation || 0}°</span>
          </div>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={config.illustrationRotation || 0}
            onChange={(e) => onChangeConfig({ illustrationRotation: parseInt(e.target.value, 10) })}
            className="w-full accent-[#CC9048] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
