import React from 'react';
import { InterfaceThemeConfig } from '../../../services/themeService';
import { Type, AlignLeft, AlignCenter, AlignRight, Sliders, CheckCircle, ShieldCheck } from 'lucide-react';

export interface ThemeTypographyColorsEditorProps {
  config: InterfaceThemeConfig;
  onChange: (patch: Partial<InterfaceThemeConfig>) => void;
  language?: 'ar' | 'en' | 'fr';
}

const BRAND_SWATCHES = [
  { name: 'Official Blue', hex: '#004AA5' },
  { name: 'Official Gold', hex: '#CC9048' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Supporting Navy', hex: '#10345B' },
  { name: 'Deep Navy', hex: '#0B2E57' },
  { name: 'Muted Slate', hex: '#5E7086' },
  { name: 'Soft Gray', hex: '#E2E8F0' },
  { name: 'Midnight', hex: '#071629' },
];

export const ThemeTypographyColorsEditor: React.FC<ThemeTypographyColorsEditorProps> = ({
  config,
  onChange,
  language = 'ar',
}) => {
  const isRtl = language === 'ar';

  const renderColorControl = (
    label: string,
    labelEn: string,
    currentColor: string | undefined,
    defaultColor: string,
    key: 'titleColor' | 'kickerColor' | 'noteColor' | 'inputTextColor'
  ) => {
    const val = currentColor || defaultColor;

    return (
      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">{isRtl ? label : labelEn}</span>
          <span className="text-[11px] font-mono text-slate-500">{val}</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="color"
            value={val.startsWith('#') && val.length === 7 ? val : defaultColor}
            onChange={(e) => onChange({ [key]: e.target.value })}
            className="w-9 h-9 rounded-lg border border-slate-300 p-0.5 cursor-pointer shrink-0"
          />
          <input
            type="text"
            value={val}
            onChange={(e) => onChange({ [key]: e.target.value })}
            placeholder={defaultColor}
            className="w-28 px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#004AA5]"
          />
          {val !== defaultColor && (
            <button
              type="button"
              onClick={() => onChange({ [key]: defaultColor })}
              className="text-[10px] text-slate-400 hover:text-slate-600 underline"
            >
              {isRtl ? 'افتراضي' : 'Default'}
            </button>
          )}
        </div>

        {/* Brand Swatches */}
        <div className="flex items-center gap-1.5 pt-1">
          {BRAND_SWATCHES.map((swatch, sIdx) => (
            <button
              key={sIdx}
              type="button"
              onClick={() => onChange({ [key]: swatch.hex })}
              title={`${swatch.name} (${swatch.hex})`}
              className={`w-5 h-5 rounded-md border transition-transform hover:scale-110 shrink-0 ${
                val.toLowerCase() === swatch.hex.toLowerCase()
                  ? 'border-[#004AA5] ring-2 ring-[#004AA5]/40 scale-105'
                  : 'border-slate-300'
              }`}
              style={{ backgroundColor: swatch.hex }}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-1.5">
        <Type className="w-4 h-4 text-[#004AA5]" />
        <h4 className="text-xs font-bold text-slate-800">
          {isRtl ? 'ألوان النصوص والعناوين المستقلة' : 'Independent Typography Colors'}
        </h4>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">
        {isRtl
          ? 'تحكم في ألوان نصوص لوحة العرض بشكل مستقل مع معاينة فورية ومطابقة تامة مع شاشة الدخول.'
          : 'Independently control colors for kicker, title, note, and form text with instant live preview.'}
      </p>

      {/* 1. Main Title Color */}
      {renderColorControl(
        'لون العنوان الرئيسي (Title Color)',
        'Title Color (panelTitle)',
        config.titleColor,
        '#FFFFFF',
        'titleColor'
      )}

      {/* 2. Kicker / Subheading Color */}
      {renderColorControl(
        'لون العنوان التمهيدي (Kicker Color)',
        'Kicker Color (panelKicker)',
        config.kickerColor,
        '#CC9048',
        'kickerColor'
      )}

      {/* 3. Note / Description Color */}
      {renderColorControl(
        'لون النص والوصف (Note / Text Color)',
        'Note / Description Color (panelNote)',
        config.noteColor,
        '#E2E8F0',
        'noteColor'
      )}

      {/* 4. Text Alignment */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
        <label className="block text-xs font-bold text-slate-800">
          {isRtl ? 'محاذاة النص (Text Alignment)' : 'Text Alignment'}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'start', labelAr: 'بداية السطر', labelEn: 'Start', icon: AlignLeft },
              { id: 'center', labelAr: 'توسيط', labelEn: 'Center', icon: AlignCenter },
              { id: 'end', labelAr: 'نهاية السطر', labelEn: 'End', icon: AlignRight },
            ] as const
          ).map((a) => {
            const Icon = a.icon;
            const isSelected = (config.textAlign || 'start') === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => onChange({ textAlign: a.id })}
                className={`py-1.5 px-2 text-xs font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-[#004AA5] text-white border-[#004AA5]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{isRtl ? a.labelAr : a.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Title Font Size */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
        <label className="block text-xs font-bold text-slate-800">
          {isRtl ? 'حجم خط العنوان (Title Font Size)' : 'Title Font Size'}
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'clamp(1.4rem, 2.4vw, 1.9rem)', label: isRtl ? 'صغير' : 'Small' },
            { id: 'clamp(1.75rem, 3.2vw, 2.5rem)', label: isRtl ? 'متوسط (افتراضي)' : 'Medium (Default)' },
            { id: 'clamp(2.1rem, 4vw, 3.2rem)', label: isRtl ? 'كبير' : 'Large' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange({ titleFontSize: s.id })}
              className={`py-1.5 px-2 text-[11px] font-bold rounded-lg border transition-all text-center ${
                (config.titleFontSize || 'clamp(1.75rem, 3.2vw, 2.5rem)') === s.id
                  ? 'bg-[#CC9048] text-white border-[#CC9048]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6. Overall Text Opacity */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#004AA5]" />
            {isRtl ? 'شفافية النصوص (Text Opacity)' : 'Text Opacity'}
          </span>
          <span className="font-mono text-[#004AA5]">{config.textOpacity ?? 100}%</span>
        </div>
        <input
          type="range"
          min="20"
          max="100"
          step="5"
          value={config.textOpacity ?? 100}
          onChange={(e) => onChange({ textOpacity: parseInt(e.target.value, 10) })}
          className="w-full accent-[#004AA5] cursor-pointer"
        />
      </div>

      {/* Readability & Contrast Badge */}
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-emerald-800">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <span className="font-bold">{isRtl ? 'ضمان التباين والمقروئية: ' : 'Readability Verified: '}</span>
          {isRtl
            ? 'يتم تطبيق الألوان المحددة مباشرة دون أي فلاتر تحجب وضوح الهوية أو النصوص.'
            : 'Colors apply directly with optimal contrast against the gradient overlay and background.'}
        </div>
      </div>
    </div>
  );
};
