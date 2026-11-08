import React from 'react';
import {
  GradientConfig,
  GradientStop,
  DEFAULT_GRADIENT,
  generateGradientCss,
} from '../../../services/themeService';
import { Sparkles, Sliders, Eye, EyeOff, RotateCw, Palette, Code } from 'lucide-react';

export interface ThemeGradientEditorProps {
  gradient?: GradientConfig;
  onChange: (gradient: GradientConfig) => void;
  language?: 'ar' | 'en' | 'fr';
}

const GRADIENT_PRESETS: { nameAr: string; nameEn: string; gradient: GradientConfig }[] = [
  {
    nameAr: 'كحلي الفزني الملكي',
    nameEn: 'Official Navy Fade',
    gradient: {
      enabled: true,
      type: 'linear',
      direction: 'to top',
      angle: 0,
      opacity: 0.88,
      stops: [
        { position: 0, color: '#012247', opacity: 0.95 },
        { position: 50, color: '#004AA5', opacity: 0.7 },
        { position: 100, color: '#071629', opacity: 0.25 },
      ],
    },
  },
  {
    nameAr: 'تدرج ذهبي ناعم',
    nameEn: 'Warm Gold Accent',
    gradient: {
      enabled: true,
      type: 'linear',
      direction: 'to top',
      angle: 0,
      opacity: 0.82,
      stops: [
        { position: 0, color: '#0B2E57', opacity: 0.95 },
        { position: 40, color: '#CC9048', opacity: 0.5 },
        { position: 100, color: '#071629', opacity: 0.15 },
      ],
    },
  },
  {
    nameAr: 'إشعاع دائري مركز',
    nameEn: 'Radial Center Glow',
    gradient: {
      enabled: true,
      type: 'radial',
      direction: 'to top',
      angle: 0,
      opacity: 0.9,
      stops: [
        { position: 0, color: '#004AA5', opacity: 0.8 },
        { position: 60, color: '#0B2E57', opacity: 0.9 },
        { position: 100, color: '#071629', opacity: 0.98 },
      ],
    },
  },
  {
    nameAr: 'تعتيم ليلي عميق',
    nameEn: 'Deep Midnight Solid',
    gradient: {
      enabled: true,
      type: 'solid',
      direction: 'to top',
      angle: 0,
      opacity: 0.75,
      stops: [{ position: 0, color: '#071629', opacity: 1 }],
    },
  },
];

export const ThemeGradientEditor: React.FC<ThemeGradientEditorProps> = ({
  gradient = DEFAULT_GRADIENT,
  onChange,
  language = 'ar',
}) => {
  const isRtl = language === 'ar';

  const update = (patch: Partial<GradientConfig>) => {
    onChange({
      ...gradient,
      ...patch,
    });
  };

  const updateStop = (idx: number, patch: Partial<GradientStop>) => {
    const currentStops = [...(gradient.stops || DEFAULT_GRADIENT.stops)];
    if (!currentStops[idx]) {
      currentStops[idx] = { position: idx === 0 ? 0 : idx === 1 ? 50 : 100, color: '#004AA5', opacity: 1 };
    }
    currentStops[idx] = { ...currentStops[idx], ...patch };
    update({ stops: currentStops });
  };

  const addStop = () => {
    const currentStops = [...(gradient.stops || DEFAULT_GRADIENT.stops)];
    if (currentStops.length >= 5) return;
    currentStops.push({ position: 75, color: '#CC9048', opacity: 0.6 });
    currentStops.sort((a, b) => a.position - b.position);
    update({ stops: currentStops });
  };

  const removeStop = (idx: number) => {
    const currentStops = [...(gradient.stops || DEFAULT_GRADIENT.stops)];
    if (currentStops.length <= 2) return;
    currentStops.splice(idx, 1);
    update({ stops: currentStops });
  };

  const currentStops = gradient.stops && gradient.stops.length > 0 ? gradient.stops : DEFAULT_GRADIENT.stops;
  const generatedCss = generateGradientCss(gradient);

  return (
    <div className="space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Enable / Disable Switch */}
      <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#004AA5]/10 text-[#004AA5] flex items-center justify-center">
            {gradient.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              {isRtl ? 'تفعيل طبقة التدرج اللوني' : 'Enable Gradient Overlay'}
            </h4>
            <p className="text-[11px] text-slate-500">
              {isRtl ? 'إظهار تدرج لوني فوق الخلفية وتحت النصوص' : 'Show gradient between background and content'}
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={gradient.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#004AA5]"></div>
        </label>
      </div>

      {gradient.enabled && (
        <>
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#CC9048]" />
              <span>{isRtl ? 'قوالب تدرج جاهزة' : 'Gradient Presets'}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {GRADIENT_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange(p.gradient)}
                  className="p-2 border border-slate-200 hover:border-[#CC9048] rounded-xl text-start transition-all bg-white hover:bg-slate-50 flex items-center gap-2"
                >
                  <div
                    className="w-7 h-7 rounded-lg border border-slate-300 shadow-sm shrink-0"
                    style={{ background: generateGradientCss(p.gradient) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-800 truncate">
                      {isRtl ? p.nameAr : p.nameEn}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">{p.gradient.type}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Gradient Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {isRtl ? 'نوع التدرج اللوني (Gradient Type)' : 'Gradient Type'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'linear', labelAr: 'خطي (Linear)', labelEn: 'Linear' },
                  { id: 'radial', labelAr: 'دائري (Radial)', labelEn: 'Radial' },
                  { id: 'solid', labelAr: 'لون مصمت (Solid)', labelEn: 'Solid' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update({ type: t.id })}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center ${
                    gradient.type === t.id
                      ? 'bg-[#004AA5] text-white border-[#004AA5] shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isRtl ? t.labelAr : t.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Gradient Direction (Linear only) */}
          {gradient.type === 'linear' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                {isRtl ? 'اتجاه التدرج (Direction)' : 'Direction'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'to top', labelAr: 'من الأسفل للأعلى (To Top)', labelEn: 'To Top' },
                    { id: 'to bottom', labelAr: 'من الأعلى للأسفل (To Bottom)', labelEn: 'To Bottom' },
                    { id: 'to left', labelAr: 'من اليمين لليسار (To Left)', labelEn: 'To Left' },
                    { id: 'to right', labelAr: 'من اليسار لليمين (To Right)', labelEn: 'To Right' },
                    { id: 'custom', labelAr: 'زاوية مخصصة (Custom Angle)', labelEn: 'Custom Angle' },
                  ] as const
                ).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => update({ direction: d.id })}
                    className={`py-1.5 px-2.5 text-[11px] font-bold rounded-lg border transition-all text-start ${
                      gradient.direction === d.id
                        ? 'bg-[#CC9048] text-white border-[#CC9048]'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isRtl ? d.labelAr : d.labelEn}
                  </button>
                ))}
              </div>

              {gradient.direction === 'custom' && (
                <div className="pt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1">
                      <RotateCw className="w-3.5 h-3.5 text-[#004AA5]" />
                      {isRtl ? 'زاوية الدوران' : 'Custom Angle'}
                    </span>
                    <span className="font-mono text-[#004AA5]">{gradient.angle || 0}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={gradient.angle || 0}
                    onChange={(e) => update({ angle: parseInt(e.target.value, 10) })}
                    className="w-full accent-[#004AA5] cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}

          {/* Overall Intensity / Opacity */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#004AA5]" />
                {isRtl ? 'شدة التدرج الكلية (Intensity / Opacity)' : 'Overall Intensity'}
              </span>
              <span className="font-mono text-[#004AA5]">
                {Math.round((gradient.opacity ?? 0.85) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={gradient.opacity ?? 0.85}
              onChange={(e) => update({ opacity: parseFloat(e.target.value) })}
              className="w-full accent-[#004AA5] cursor-pointer"
            />
          </div>

          {/* Color Stops Manager */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#CC9048]" />
                <span>{isRtl ? 'محطات الألوان (Color Stops)' : 'Color Stops'}</span>
              </label>
              {currentStops.length < 5 && gradient.type !== 'solid' && (
                <button
                  type="button"
                  onClick={addStop}
                  className="text-[11px] font-bold text-[#004AA5] hover:underline"
                >
                  + {isRtl ? 'إضافة لون' : 'Add Stop'}
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {currentStops.map((stop, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">
                      {idx === 0
                        ? isRtl
                          ? 'لون البداية'
                          : 'Starting Color'
                        : idx === currentStops.length - 1
                        ? isRtl
                          ? 'لون النهاية'
                          : 'Ending Color'
                        : isRtl
                        ? `لون وسيط ${idx}`
                        : `Middle Stop ${idx}`}
                    </span>
                    {currentStops.length > 2 && idx > 0 && idx < currentStops.length - 1 && (
                      <button
                        type="button"
                        onClick={() => removeStop(idx)}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        {isRtl ? 'حذف' : 'Remove'}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={stop.color || '#004AA5'}
                      onChange={(e) => updateStop(idx, { color: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-300 p-0.5 cursor-pointer shrink-0"
                    />
                    <input
                      type="text"
                      value={stop.color || ''}
                      onChange={(e) => updateStop(idx, { color: e.target.value })}
                      placeholder="#004AA5"
                      className="w-24 px-2 py-1.5 text-xs font-mono border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#004AA5]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-0.5">
                        <span>{isRtl ? 'الموضع' : 'Pos'}</span>
                        <span>{stop.position}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stop.position}
                        onChange={(e) => updateStop(idx, { position: parseInt(e.target.value, 10) })}
                        className="w-full accent-[#CC9048] cursor-pointer h-1.5"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generated CSS Live Display */}
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-[#CC9048]">
                <Code className="w-3.5 h-3.5" />
                {isRtl ? 'كود CSS المُولّد مباشرة' : 'Live Generated CSS'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">live render</span>
            </div>
            <pre className="text-[11px] font-mono text-emerald-400 bg-slate-950/70 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap break-all select-all">
              background: {generatedCss};
            </pre>
          </div>
        </>
      )}
    </div>
  );
};
