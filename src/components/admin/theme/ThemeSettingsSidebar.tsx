import React, { useState } from 'react';
import {
  Palette,
  Type,
  ImageIcon,
  Layout,
  AlignLeft,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Sliders,
  Check,
  Globe,
  SlidersHorizontal,
  Sun,
  Eye,
  RotateCw,
} from 'lucide-react';
import {
  InterfaceTarget,
  InterfaceThemeConfig,
  ThemeColors,
  ThemeTypography,
  OFFICIAL_BRAND_COLORS,
  OFFICIAL_TYPOGRAPHY,
} from '../../../services/themeService';
import { ThemeColorPicker } from './ThemeColorPicker';
import { ThemeLayerManager } from './ThemeLayerManager';
import { ThemeGradientEditor } from './ThemeGradientEditor';
import { ThemeTypographyColorsEditor } from './ThemeTypographyColorsEditor';
import { ThemeIllustrationEditor } from './ThemeIllustrationEditor';

interface ThemeSettingsSidebarProps {
  target: InterfaceTarget;
  onTargetChange: (t: InterfaceTarget) => void;
  config: InterfaceThemeConfig;
  globalBrand?: InterfaceThemeConfig;
  onChangeConfig: (updates: Partial<InterfaceThemeConfig>) => void;
  onResetToGlobal: () => void;
  onOpenMediaPicker: (targetType?: 'illustration' | 'background' | 'logo') => void;
  selectedElementKey?: string | null;
  onSelectElement?: (key: string) => void;
  sidebarWidth?: number;
  onResetWidth?: () => void;
}

export const ThemeSettingsSidebar: React.FC<ThemeSettingsSidebarProps> = ({
  target,
  onTargetChange,
  config,
  globalBrand,
  onChangeConfig,
  onResetToGlobal,
  onOpenMediaPicker,
  selectedElementKey,
  onSelectElement,
  sidebarWidth = 340,
  onResetWidth,
}) => {
  const [activeAccordion, setActiveAccordion] = useState<string>('illustration');

  const interfaces: Array<{ id: InterfaceTarget; label: string }> = [
    { id: 'website', label: 'الموقع الإلكتروني' },
    { id: 'portal', label: 'البوابة الموحدة (HUB / Workspace)' },
    { id: 'admin_login', label: 'تسجيل دخول الإدارة' },
    { id: 'crm_login', label: 'تسجيل دخول CRM' },
    { id: 'global', label: 'الهوية البصرية العامة' },
  ];

  const toggleAccordion = (key: string) => {
    setActiveAccordion(activeAccordion === key ? '' : key);
  };

  const updateColor = (key: keyof ThemeColors, hex: string) => {
    const colors = { ...(config.colors || {}), [key]: hex };
    onChangeConfig({
      colors,
      inheritBrandColors: target === 'global' ? true : false,
    });
  };

  const updateTypography = (key: keyof ThemeTypography, val: string) => {
    const typography = { ...(config.typography || {}), [key]: val };
    onChangeConfig({
      typography,
      inheritTypography: target === 'global' ? true : false,
    });
  };

  const isVisualInterface = target === 'admin_login' || target === 'crm_login' || target === 'portal';

  return (
    <aside
      style={{ width: sidebarWidth }}
      className="bg-white border-l border-slate-200 flex flex-col justify-between overflow-y-auto shrink-0 shadow-sm z-10 text-right transition-[width] duration-75 select-none"
    >
      {/* Top Interface Selector */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black text-[#0B2E57] uppercase tracking-wider block">
            اختر الواجهة المراد تعديلها:
          </label>
          {onResetWidth && (
            <button
              type="button"
              onClick={onResetWidth}
              title="استعادة العرض الافتراضي (340px)"
              className="p-1 rounded-lg text-slate-400 hover:text-[#004AA5] hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select
          value={target}
          onChange={(e) => onTargetChange(e.target.value as InterfaceTarget)}
          className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl text-[#0B2E57] shadow-xs focus:ring-2 focus:ring-[#004AA5]/30 focus:border-[#004AA5] cursor-pointer"
        >
          {interfaces.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>

        {target !== 'global' && (
          <div className="space-y-1.5 pt-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">حالة الوراثة والتخصيص:</span>
              {config.inheritBrandColors ? (
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  موروث من الهوية العامة ✓
                </span>
              ) : (
                <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  مخصص محلياً لهذه الواجهة
                </span>
              )}
            </div>
            {config.appliedPresetName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">القالب المطبق:</span>
                <span className="text-[#004AA5] font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  {config.appliedPresetName}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accordions of Settings */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {/* ======================================================== */}
        {/* 1. VISUAL LAYERS MANAGER (Login interfaces)             */}
        {/* ======================================================== */}
        {isVisualInterface && (
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleAccordion('layers')}
              className="w-full flex items-center justify-between text-xs font-black text-[#0B2E57] hover:text-[#004AA5] transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#004AA5]" />
                <span>الطبقات البصرية والتراكب (Layers)</span>
              </div>
              {activeAccordion === 'layers' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {activeAccordion === 'layers' && (
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
        )}

        {/* ======================================================== */}
        {/* 2. GRADIENT OVERLAY EDITOR (Login interfaces)           */}
        {/* ======================================================== */}
        {isVisualInterface && (
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleAccordion('gradient')}
              className="w-full flex items-center justify-between text-xs font-black text-[#0B2E57] hover:text-[#004AA5] transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#CC9048]" />
                <span>إعدادات التدرج اللوني (Gradient Overlay)</span>
              </div>
              {activeAccordion === 'gradient' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {activeAccordion === 'gradient' && (
              <div className="pt-2">
                <ThemeGradientEditor
                  gradient={config.gradient}
                  onChange={(gradient) => onChangeConfig({ gradient })}
                  language="ar"
                />
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. INDEPENDENT TYPOGRAPHY COLORS                        */}
        {/* ======================================================== */}
        {isVisualInterface && (
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleAccordion('typography_colors')}
              className="w-full flex items-center justify-between text-xs font-black text-[#0B2E57] hover:text-[#004AA5] transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-[#004AA5]" />
                <span>ألوان النصوص والعناوين (Typography Colors)</span>
              </div>
              {activeAccordion === 'typography_colors' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {activeAccordion === 'typography_colors' && (
              <div className="pt-2">
                <ThemeTypographyColorsEditor
                  config={config}
                  onChange={onChangeConfig}
                  language="ar"
                />
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. BACKGROUND IMAGE & COLOR (Login interfaces)          */}
        {/* ======================================================== */}
        {isVisualInterface && (
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleAccordion('background')}
              className="w-full flex items-center justify-between text-xs font-black text-[#0B2E57] hover:text-[#004AA5] transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#CC9048]" />
                <span>صورة ولون الخلفية (Background)</span>
              </div>
              {activeAccordion === 'background' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {activeAccordion === 'background' && (
              <div className="space-y-3 pt-2">
                {/* Background Color */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">لون الخلفية الأساسي:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.backgroundColor || '#071629'}
                      onChange={(e) => onChangeConfig({ backgroundColor: e.target.value })}
                      className="w-9 h-9 rounded-lg border border-slate-300 p-0.5 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.backgroundColor || '#071629'}
                      onChange={(e) => onChangeConfig({ backgroundColor: e.target.value })}
                      className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg text-slate-800"
                    />
                  </div>
                </div>

                {/* Background Image URL */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">مسار صورة الخلفية:</label>
                  <input
                    type="text"
                    value={config.backgroundImage || ''}
                    onChange={(e) => onChangeConfig({ backgroundImage: e.target.value })}
                    placeholder="/assets/brand/3d/01-master-service-hero-transparent.png"
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg text-slate-800"
                    dir="ltr"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectElement?.('background');
                        onOpenMediaPicker('background');
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-blue-50 text-[#004AA5] text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
                    >
                      مكتبة الوسائط
                    </button>
                    {config.backgroundImage && (
                      <button
                        type="button"
                        onClick={() => onChangeConfig({ backgroundImage: '' })}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition cursor-pointer"
                      >
                        إزالة
                      </button>
                    )}
                  </div>
                </div>

                {/* Background Size & Position */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 block">حجم صورة الخلفية:</label>
                    <select
                      value={config.backgroundSize || 'cover'}
                      onChange={(e) => onChangeConfig({ backgroundSize: e.target.value as any })}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                    >
                      <option value="cover">ملء كامل (Cover)</option>
                      <option value="contain">احتواء (Contain)</option>
                      <option value="auto">حجم تلقائي (Auto)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 block">موضع الخلفية:</label>
                    <select
                      value={config.backgroundPosition || 'center'}
                      onChange={(e) => onChangeConfig({ backgroundPosition: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
                    >
                      <option value="center">الوسط (Center)</option>
                      <option value="top">الأعلى (Top)</option>
                      <option value="bottom">الأسفل (Bottom)</option>
                      <option value="left">اليسار (Left)</option>
                      <option value="right">اليمين (Right)</option>
                    </select>
                  </div>
                </div>

                {/* Background Opacity */}
                <div className="space-y-1 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>شفافية صورة الخلفية:</span>
                    <span className="font-mono text-[#004AA5]">{config.backgroundOpacity ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.backgroundOpacity ?? 100}
                    onChange={(e) => onChangeConfig({ backgroundOpacity: parseInt(e.target.value, 10) })}
                    className="w-full accent-[#004AA5] cursor-pointer"
                  />
                </div>

                {/* Background Blur */}
                <div className="space-y-1 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>ضبابية الخلفية (Blur):</span>
                    <span className="font-mono text-[#004AA5]">{config.backgroundBlur || 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={config.backgroundBlur || 0}
                    onChange={(e) => onChangeConfig({ backgroundBlur: parseInt(e.target.value, 10) })}
                    className="w-full accent-[#004AA5] cursor-pointer"
                  />
                </div>

                {/* Background Brightness */}
                <div className="space-y-1 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>سطوع الخلفية (Brightness):</span>
                    <span className="font-mono text-[#004AA5]">{config.backgroundBrightness ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="150"
                    value={config.backgroundBrightness ?? 100}
                    onChange={(e) => onChangeConfig({ backgroundBrightness: parseInt(e.target.value, 10) })}
                    className="w-full accent-[#004AA5] cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. FOREGROUND 3D ILLUSTRATION & IMAGE EDITOR             */}
        {/* ======================================================== */}
        {isVisualInterface && (
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleAccordion('illustration')}
              className="w-full flex items-center justify-between text-xs font-black text-[#0B2E57] hover:text-[#004AA5] transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#004AA5]" />
                <span>المجسم 3D والصورة التوضيحية (0%–400%)</span>
              </div>
              {activeAccordion === 'illustration' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {activeAccordion === 'illustration' && (
              <div className="pt-2">
                <ThemeIllustrationEditor
                  config={config}
                  onChangeConfig={onChangeConfig}
                  onOpenMediaPicker={() => {
                    onSelectElement?.('illustration');
                    onOpenMediaPicker('illustration');
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. LOGO SETTINGS                                        */}
        {/* ======================================================== */}
        {isVisualInterface && (
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleAccordion('logo')}
              className="w-full flex items-center justify-between text-xs font-black text-[#0B2E57] hover:text-[#004AA5] transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#CC9048]" />
                <span>إعدادات وتخصيص الشعار (Logo)</span>
              </div>
              {activeAccordion === 'logo' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {activeAccordion === 'logo' && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 block">نسخة الشعار:</label>
                  <select
                    value={config.illustrationLogoVariant || config.logoVariant || 'horizontal-on-blue'}
                    onChange={(e) =>
                      onChangeConfig({
                        illustrationLogoVariant: e.target.value,
                        logoVariant: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="horizontal-on-blue">أفقي شفاف على خلفية كحلية/داكنة (رسمي)</option>
                    <option value="horizontal-on-white">أفقي شفاف على خلفية بيضاء</option>
                    <option value="horizontal-on-gold">أفقي شفاف على خلفية ذهبية</option>
                    <option value="vertical-on-blue">عمودي شفاف على خلفية كحلية</option>
                    <option value="vertical-on-white">عمودي شفاف على خلفية بيضاء</option>
                    <option value="custom">شعار مخصص من رابط</option>
                  </select>
                </div>

                {/* Scale */}
                <div className="space-y-1 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>حجم وتكبير الشعار (Scale):</span>
                    <span className="font-mono text-[#004AA5]">{config.logoScale ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    step="5"
                    value={config.logoScale ?? 100}
                    onChange={(e) => onChangeConfig({ logoScale: parseInt(e.target.value, 10) })}
                    className="w-full accent-[#004AA5] cursor-pointer"
                  />
                </div>

                {/* Opacity */}
                <div className="space-y-1 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>شفافية الشعار (Opacity):</span>
                    <span className="font-mono text-[#004AA5]">{config.logoOpacity ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={config.logoOpacity ?? 100}
                    onChange={(e) => onChangeConfig({ logoOpacity: parseInt(e.target.value, 10) })}
                    className="w-full accent-[#004AA5] cursor-pointer"
                  />
                </div>

                {/* Position */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">موضع الشعار:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'start', label: 'البداية' },
                      { id: 'center', label: 'الوسط' },
                      { id: 'end', label: 'النهاية' },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => onChangeConfig({ logoPosition: pos.id as any })}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          (config.logoPosition || 'start') === pos.id
                            ? 'bg-[#004AA5] text-white border-[#004AA5]'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 7. BRAND COLORS ACCORDION                                */}
        {/* ======================================================== */}
        <div className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => toggleAccordion('colors')}
            className="w-full flex items-center justify-between text-xs font-black text-[#0B2E57] hover:text-[#004AA5] transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#004AA5]" />
              <span>الألوان وتوكنات الهوية (Brand Colors)</span>
            </div>
            {activeAccordion === 'colors' ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {activeAccordion === 'colors' && (
            <div className="space-y-3 pt-2">
              <ThemeColorPicker
                label="الأزرق الملكي (Primary Blue)"
                value={config.colors?.primary || OFFICIAL_BRAND_COLORS.primary}
                onChange={(hex) => updateColor('primary', hex)}
                officialValue={OFFICIAL_BRAND_COLORS.primary}
              />
              <ThemeColorPicker
                label="الذهب الرسمي (Official Gold)"
                value={config.colors?.gold || OFFICIAL_BRAND_COLORS.gold}
                onChange={(hex) => updateColor('gold', hex)}
                officialValue={OFFICIAL_BRAND_COLORS.gold}
              />
              <ThemeColorPicker
                label="ذهب النصوص الصغيرة المقروءة (Accessible)"
                value={config.colors?.goldTextOnWhite || OFFICIAL_BRAND_COLORS.goldTextOnWhite}
                onChange={(hex) => updateColor('goldTextOnWhite', hex)}
                officialValue={OFFICIAL_BRAND_COLORS.goldTextOnWhite}
              />
              <ThemeColorPicker
                label="الكحلي العميق (Secondary Navy)"
                value={config.colors?.secondary || OFFICIAL_BRAND_COLORS.secondary}
                onChange={(hex) => updateColor('secondary', hex)}
                officialValue={OFFICIAL_BRAND_COLORS.secondary}
              />
              <ThemeColorPicker
                label="لون الخلفية (Background)"
                value={config.colors?.background || OFFICIAL_BRAND_COLORS.background}
                onChange={(hex) => updateColor('background', hex)}
                officialValue={OFFICIAL_BRAND_COLORS.background}
              />
              <ThemeColorPicker
                label="لون سطح البطاقات (Surface Card)"
                value={config.colors?.surface || OFFICIAL_BRAND_COLORS.surface}
                onChange={(hex) => updateColor('surface', hex)}
                officialValue={OFFICIAL_BRAND_COLORS.surface}
              />
              <ThemeColorPicker
                label="لون النص الرئيسي (Text Primary)"
                value={config.colors?.text || OFFICIAL_BRAND_COLORS.text}
                onChange={(hex) => updateColor('text', hex)}
                officialValue={OFFICIAL_BRAND_COLORS.text}
              />
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 8. TYPOGRAPHY ACCORDION                                  */}
        {/* ======================================================== */}
        <div className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => toggleAccordion('typography')}
            className="w-full flex items-center justify-between text-xs font-black text-[#0B2E57] hover:text-[#004AA5] transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-[#CC9048]" />
              <span>الخطوط والطباعة العامة (Typography)</span>
            </div>
            {activeAccordion === 'typography' ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {activeAccordion === 'typography' && (
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">عائلة الخط الأساسي:</label>
                <select
                  value={config.typography?.fontFamily || OFFICIAL_TYPOGRAPHY.fontFamily}
                  onChange={(e) => updateTypography('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="'Bahij TheSansArabic', sans-serif">Bahij TheSansArabic (الخط الرسمي المعتمد)</option>
                  <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
                  <option value="'Cairo', sans-serif">Cairo</option>
                  <option value="'Tajawal', sans-serif">Tajawal</option>
                  <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">System Sans-Serif</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">حجم الخط الأساسي:</label>
                <select
                  value={config.typography?.baseFontSize || '16px'}
                  onChange={(e) => updateTypography('baseFontSize', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="14px">14px (مدمج Compact)</option>
                  <option value="15px">15px (متوازن)</option>
                  <option value="16px">16px (قياسي Standard)</option>
                  <option value="17px">17px (كبير مريح)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">ارتفاع السطر (Line Height):</label>
                <select
                  value={config.typography?.lineHeight || '1.6'}
                  onChange={(e) => updateTypography('lineHeight', e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="1.4">1.4 (ضيق)</option>
                  <option value="1.6">1.6 (مثالي ومقروء)</option>
                  <option value="1.8">1.8 (مريح وواسع)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 9. LAYOUT & FORM STRUCTURE (Login interfaces)           */}
        {/* ======================================================== */}
        {isVisualInterface && (
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleAccordion('layout')}
              className="w-full flex items-center justify-between text-xs font-black text-[#0B2E57] hover:text-[#004AA5] transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-[#004AA5]" />
                <span>تخطيط صفحة الدخول (Layout)</span>
              </div>
              {activeAccordion === 'layout' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {activeAccordion === 'layout' && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 block">نمط التخطيط:</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { id: 'split-right', label: 'منقسم (النموذج يمين)' },
                      { id: 'split-left', label: 'منقسم (النموذج يسار)' },
                      { id: 'centered', label: 'بطاقة في الوسط' },
                      { id: 'full-bg', label: 'خلفية كاملة ممتدة' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => onChangeConfig({ layoutType: mode.id as any })}
                        className={`p-2 rounded-xl border text-xs font-bold text-center transition cursor-pointer ${
                          config.layoutType === mode.id
                            ? 'bg-[#004AA5] text-white border-[#004AA5] shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 block">عرض النموذج:</label>
                  <select
                    value={config.formWidth || '480px'}
                    onChange={(e) => onChangeConfig({ formWidth: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="420px">420px (مضغوط Compact)</option>
                    <option value="480px">480px (قياسي مريح)</option>
                    <option value="540px">540px (واسع)</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <ThemeColorPicker
                    label="لون خلفية بطاقة الدخول (Form Card Bg)"
                    value={config.formBg || config.colors?.surface || '#FFFFFF'}
                    onChange={(hex) => onChangeConfig({ formBg: hex })}
                    officialValue="#FFFFFF"
                  />
                  <ThemeColorPicker
                    label="لون نصوص النموذج (Form Text)"
                    value={config.formTextColor || config.colors?.text || '#0B2E57'}
                    onChange={(hex) => onChangeConfig({ formTextColor: hex })}
                    officialValue="#0B2E57"
                  />
                  <ThemeColorPicker
                    label="لون خلفية الحقول (Input Bg)"
                    value={config.inputBg || '#F8FAFC'}
                    onChange={(hex) => onChangeConfig({ inputBg: hex })}
                    officialValue="#F8FAFC"
                  />
                  <ThemeColorPicker
                    label="لون حدود الحقول (Input Border)"
                    value={config.inputBorder || '#D7E7F7'}
                    onChange={(hex) => onChangeConfig({ inputBorder: hex })}
                    officialValue="#D7E7F7"
                  />
                  <ThemeColorPicker
                    label="لون زر تسجيل الدخول (Button Bg)"
                    value={config.primaryButtonBg || config.colors?.button || '#004AA5'}
                    onChange={(hex) => onChangeConfig({ primaryButtonBg: hex })}
                    officialValue="#004AA5"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 10. PORTAL CARDS (If target === 'portal')                */}
        {/* ======================================================== */}
        {target === 'portal' && config.portalCards && (
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleAccordion('cards')}
              className="w-full flex items-center justify-between text-xs font-black text-[#0B2E57] hover:text-[#004AA5] transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#004AA5]" />
                <span>بطاقات بوابات الدخول (Portal Cards)</span>
              </div>
              {activeAccordion === 'cards' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {activeAccordion === 'cards' && (
              <div className="space-y-3 pt-2">
                {config.portalCards.map((card, idx) => (
                  <div
                    key={card.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#0B2E57]">
                        {idx + 1}. {card.title.ar}
                      </span>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={card.visible !== false}
                          onChange={(e) => {
                            const updatedCards = config.portalCards!.map((c) =>
                              c.id === card.id ? { ...c, visible: e.target.checked } : c
                            );
                            onChangeConfig({ portalCards: updatedCards });
                          }}
                          className="rounded text-[#004AA5]"
                        />
                        <span className="text-[11px] font-bold text-slate-600">
                          {card.visible !== false ? 'ظاهر' : 'مخفي'}
                        </span>
                      </label>
                    </div>

                    {/* Card Title (AR) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">عنوان البطاقة (عربي):</label>
                      <input
                        type="text"
                        value={card.title.ar || ''}
                        onChange={(e) => {
                          const updatedCards = config.portalCards!.map((c) =>
                            c.id === card.id ? { ...c, title: { ...c.title, ar: e.target.value } } : c
                          );
                          onChangeConfig({ portalCards: updatedCards });
                        }}
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                        dir="rtl"
                      />
                    </div>

                    {/* Card Title (EN) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">عنوان البطاقة (English):</label>
                      <input
                        type="text"
                        value={card.title.en || ''}
                        onChange={(e) => {
                          const updatedCards = config.portalCards!.map((c) =>
                            c.id === card.id ? { ...c, title: { ...c.title, en: e.target.value } } : c
                          );
                          onChangeConfig({ portalCards: updatedCards });
                        }}
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                        dir="ltr"
                      />
                    </div>

                    {/* Card Description */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">الوصف:</label>
                      <input
                        type="text"
                        value={card.description.ar || ''}
                        onChange={(e) => {
                          const updatedCards = config.portalCards!.map((c) =>
                            c.id === card.id ? { ...c, description: { ...c.description, ar: e.target.value } } : c
                          );
                          onChangeConfig({ portalCards: updatedCards });
                        }}
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                        dir="rtl"
                      />
                    </div>

                    {/* Destination URL */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 block">الرابط الموجه إليه:</label>
                      <input
                        type="text"
                        value={card.destination || ''}
                        onChange={(e) => {
                          const updatedCards = config.portalCards!.map((c) =>
                            c.id === card.id ? { ...c, destination: e.target.value } : c
                          );
                          onChangeConfig({ portalCards: updatedCards });
                        }}
                        className="w-full px-2.5 py-1 text-xs font-mono border border-slate-200 rounded-lg bg-white"
                        dir="ltr"
                      />
                    </div>

                    {/* Featured toggle & Badge */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-[#0B2E57] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(card.featured)}
                          onChange={(e) => {
                            const updatedCards = config.portalCards!.map((c) =>
                              c.id === card.id ? { ...c, featured: e.target.checked } : c
                            );
                            onChangeConfig({ portalCards: updatedCards });
                          }}
                          className="rounded text-[#004AA5]"
                        />
                        <span>تمييز البطاقة (كحلي)</span>
                      </label>

                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-600 block">شارة البطاقة:</label>
                        <input
                          type="text"
                          value={card.badge?.ar || ''}
                          placeholder="محمي / متاح..."
                          onChange={(e) => {
                            const updatedCards = config.portalCards!.map((c) =>
                              c.id === card.id ? { ...c, badge: { ...(c.badge || {}), ar: e.target.value } } : c
                            );
                            onChangeConfig({ portalCards: updatedCards });
                          }}
                          className="w-full px-2 py-0.5 text-[11px] border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* 11. TEXT CONTENT & COPY (Portal & Login)                 */}
        {/* ======================================================== */}
        {target === 'portal' && (
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={() => toggleAccordion('texts')}
              className="w-full flex items-center justify-between text-xs font-black text-[#0B2E57] hover:text-[#004AA5] transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-[#CC9048]" />
                <span>نصوص ومحتوى البوابة (Texts & Copy)</span>
              </div>
              {activeAccordion === 'texts' ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {activeAccordion === 'texts' && (
              <div className="space-y-3 pt-2">
                {/* heroTitle */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">العنوان الرئيسي (heroTitle):</label>
                  <input
                    type="text"
                    value={config.texts?.heroTitle?.ar || ''}
                    placeholder="بوابة الفزني سيرفيسز"
                    onChange={(e) => {
                      const texts = { ...(config.texts || {}) };
                      texts.heroTitle = { ...(texts.heroTitle || {}), ar: e.target.value };
                      onChangeConfig({ texts });
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    dir="rtl"
                  />
                </div>

                {/* heroKicker */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">النص التمهيدي (heroKicker):</label>
                  <input
                    type="text"
                    value={config.texts?.heroKicker?.ar || ''}
                    placeholder="مركز الوصول الموحّد"
                    onChange={(e) => {
                      const texts = { ...(config.texts || {}) };
                      texts.heroKicker = { ...(texts.heroKicker || {}), ar: e.target.value };
                      onChangeConfig({ texts });
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    dir="rtl"
                  />
                </div>

                {/* heroDescription */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">الوصف التوضيحي (heroDescription):</label>
                  <textarea
                    rows={2}
                    value={config.texts?.heroDescription?.ar || ''}
                    placeholder="الوصول السريع إلى الموقع الإلكتروني ونظام إدارة العملاء..."
                    onChange={(e) => {
                      const texts = { ...(config.texts || {}) };
                      texts.heroDescription = { ...(texts.heroDescription || {}), ar: e.target.value };
                      onChangeConfig({ texts });
                    }}
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg"
                    dir="rtl"
                  />
                </div>

                {/* photoNote */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">ملاحظة لوحة الصورة (photoNote):</label>
                  <input
                    type="text"
                    value={config.texts?.photoNote?.ar || ''}
                    placeholder="خدمات السفر والمعاملات في تركيا"
                    onChange={(e) => {
                      const texts = { ...(config.texts || {}) };
                      texts.photoNote = { ...(texts.photoNote || {}), ar: e.target.value };
                      onChangeConfig({ texts });
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    dir="rtl"
                  />
                </div>

                {/* secureNote */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">ملاحظة الأمان (secureNote):</label>
                  <input
                    type="text"
                    value={config.texts?.secureNote?.ar || ''}
                    placeholder="يخضع الدخول إلى الأنظمة لاشتراطات تسجيل الحسابات."
                    onChange={(e) => {
                      const texts = { ...(config.texts || {}) };
                      texts.secureNote = { ...(texts.secureNote || {}), ar: e.target.value };
                      onChangeConfig({ texts });
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    dir="rtl"
                  />
                </div>

                {/* returnToSite */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">زر العودة (returnToSite):</label>
                  <input
                    type="text"
                    value={config.texts?.returnToSite?.ar || ''}
                    placeholder="العودة إلى الموقع"
                    onChange={(e) => {
                      const texts = { ...(config.texts || {}) };
                      texts.returnToSite = { ...(texts.returnToSite || {}), ar: e.target.value };
                      onChangeConfig({ texts });
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                    dir="rtl"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Global Reset Button */}
      {target !== 'global' && (
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onResetToGlobal}
            className="w-full py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            title="إلغاء التخصيصات وإعادة استخدام إعدادات الهوية البصرية العامة"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة استخدام إعدادات الهوية العامة</span>
          </button>
        </div>
      )}
    </aside>
  );
};
