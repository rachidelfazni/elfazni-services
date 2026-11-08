import React from 'react';
import {
  Sliders,
  Type,
  Image as ImageIcon,
  Square,
  Sparkles,
  X,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import {
  InterfaceThemeConfig,
  ThemeAsset,
} from '../../../services/themeService';
import { ThemeColorPicker } from './ThemeColorPicker';
import { ThemeGradientEditor } from './ThemeGradientEditor';
import { ThemeTypographyColorsEditor } from './ThemeTypographyColorsEditor';
import { ThemeIllustrationEditor } from './ThemeIllustrationEditor';

interface ThemeElementInspectorProps {
  selectedElementKey: string | null;
  config: InterfaceThemeConfig;
  onChangeConfig: (updated: Partial<InterfaceThemeConfig>) => void;
  onOpenMediaPicker: (targetType?: 'illustration' | 'background' | 'logo') => void;
  onClose: () => void;
}

export const ThemeElementInspector: React.FC<ThemeElementInspectorProps> = ({
  selectedElementKey,
  config,
  onChangeConfig,
  onOpenMediaPicker,
  onClose,
}) => {
  if (!selectedElementKey) {
    return (
      <div className="w-80 bg-white border-r border-slate-200 p-5 flex flex-col items-center justify-center text-center text-slate-400 space-y-3 shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
          <Sliders className="w-6 h-6 text-slate-400" />
        </div>
        <h4 className="text-xs font-bold text-slate-700">مفتش خصائص العناصر</h4>
        <p className="text-[11px] leading-relaxed text-slate-400">
          انقر فوق أي عنصر داخل المعاينة الحية (الشعار، العنوان، الزر، المجسم، أو الخلفية) لفتح إعداداته وتعديلها فوراً هنا.
        </p>
      </div>
    );
  }

  const isGradient = selectedElementKey.includes('gradient');
  const isBackground = selectedElementKey.includes('background');
  const isHeading =
    selectedElementKey.includes('title') ||
    selectedElementKey.includes('kicker') ||
    selectedElementKey.includes('desc') ||
    selectedElementKey.includes('subtitle') ||
    selectedElementKey.includes('note') ||
    selectedElementKey.includes('content') ||
    selectedElementKey.includes('typography');

  const isLogo = selectedElementKey.includes('logo');
  const isIllustration = selectedElementKey.includes('illustration');
  const isButton = selectedElementKey.includes('button');
  const isInput = selectedElementKey.includes('input');
  const isCard = selectedElementKey.includes('card');
  const cardId = selectedElementKey.startsWith('portal_card_')
    ? selectedElementKey.replace('portal_card_', '')
    : null;
  const targetCard = cardId ? (config.portalCards || []).find((c) => c.id === cardId) : null;

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col justify-between overflow-y-auto shrink-0 shadow-lg z-10">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#004AA5]" />
          <div>
            <h4 className="text-xs font-black text-[#0B2E57]">خصائص العنصر المحدد</h4>
            <span className="text-[10px] font-mono text-slate-400">{selectedElementKey}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5 flex-1 overflow-y-auto">
        {/* GRADIENT OVERLAY PROPERTIES */}
        {isGradient && (
          <div className="space-y-4">
            <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#CC9048]" />
              <span>إعدادات التدرج اللوني (Gradient)</span>
            </h5>
            <ThemeGradientEditor
              gradient={config.gradient}
              onChange={(gradient) => onChangeConfig({ gradient })}
              language="ar"
            />
          </div>
        )}

        {/* BACKGROUND PROPERTIES */}
        {isBackground && (
          <div className="space-y-4">
            <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#004AA5]" />
              <span>إعدادات خلفية اللوحة (Background)</span>
            </h5>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-700 block">لون الخلفية الأساسي:</label>
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
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">صورة الخلفية:</label>
              <input
                type="text"
                value={config.backgroundImage || ''}
                onChange={(e) => onChangeConfig({ backgroundImage: e.target.value })}
                placeholder="/assets/brand/3d/01-master-service-hero-transparent.png"
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg text-slate-800"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => onOpenMediaPicker('background')}
                className="w-full py-1.5 rounded-lg bg-blue-50 text-[#004AA5] text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
              >
                اختيار من مكتبة الوسائط
              </button>
            </div>
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
          </div>
        )}

        {/* LOGO PROPERTIES */}
        {isLogo && (
          <div className="space-y-4">
            <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#CC9048]" />
              <span>إعدادات الشعار (Logo)</span>
            </h5>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 block">نسخة الشعار المعتمدة:</label>
              <select
                value={config.logoVariant || 'horizontal-on-white'}
                onChange={(e) => onChangeConfig({ logoVariant: e.target.value as any, illustrationLogoVariant: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#004AA5]/30 focus:border-[#004AA5]"
              >
                <option value="horizontal-on-white">أفقي شفاف على خلفية بيضاء</option>
                <option value="horizontal-on-blue">أفقي شفاف على خلفية كحلية/داكنة</option>
                <option value="horizontal-on-gold">أفقي شفاف على خلفية ذهبية</option>
                <option value="vertical-on-white">عمودي شفاف على خلفية بيضاء</option>
                <option value="vertical-on-blue">عمودي شفاف على خلفية كحلية</option>
                <option value="vertical-on-gold">عمودي شفاف على خلفية ذهبية</option>
                <option value="custom">رابط شعار مخصص</option>
              </select>
            </div>

            {config.logoVariant === 'custom' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">رابط الشعار المخصص:</label>
                <input
                  type="text"
                  value={config.customLogoUrl || ''}
                  onChange={(e) => onChangeConfig({ customLogoUrl: e.target.value })}
                  placeholder="https://... أو /uploads/..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => onOpenMediaPicker('logo')}
                  className="w-full py-1.5 rounded-lg bg-blue-50 text-[#004AA5] text-xs font-bold hover:bg-blue-100 transition cursor-pointer"
                >
                  اختيار من مكتبة الصور
                </button>
              </div>
            )}
          </div>
        )}

        {/* ILLUSTRATION & 3D PROPERTIES */}
        {isIllustration && (
          <div className="space-y-4">
            <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#CC9048]" />
              <span>محرر المجسم والصورة (0%–400%)</span>
            </h5>
            <ThemeIllustrationEditor
              config={config}
              onChangeConfig={onChangeConfig}
              onOpenMediaPicker={() => onOpenMediaPicker('illustration')}
            />
          </div>
        )}

        {/* HEADING & TEXT PROPERTIES */}
        {isHeading && (
          <div className="space-y-4">
            <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-[#CC9048]" />
              <span>محتوى النص (Multilingual Text)</span>
            </h5>

            {/* Arabic Text */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">النص باللغة العربية (AR):</label>
              <textarea
                rows={2}
                value={config.texts?.[selectedElementKey]?.ar || ''}
                onChange={(e) => {
                  const texts = { ...(config.texts || {}) };
                  texts[selectedElementKey] = { ...(texts[selectedElementKey] || {}), ar: e.target.value };
                  onChangeConfig({ texts });
                }}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#004AA5]/30 focus:border-[#004AA5]"
                dir="rtl"
              />
            </div>

            {/* English Text */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">النص بالإنجليزية (EN):</label>
              <textarea
                rows={2}
                value={config.texts?.[selectedElementKey]?.en || ''}
                onChange={(e) => {
                  const texts = { ...(config.texts || {}) };
                  texts[selectedElementKey] = { ...(texts[selectedElementKey] || {}), en: e.target.value };
                  onChangeConfig({ texts });
                }}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#004AA5]/30 focus:border-[#004AA5]"
                dir="ltr"
              />
            </div>

            {/* French Text */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">النص بالفرنسية (FR):</label>
              <textarea
                rows={2}
                value={config.texts?.[selectedElementKey]?.fr || ''}
                onChange={(e) => {
                  const texts = { ...(config.texts || {}) };
                  texts[selectedElementKey] = { ...(texts[selectedElementKey] || {}), fr: e.target.value };
                  onChangeConfig({ texts });
                }}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#004AA5]/30 focus:border-[#004AA5]"
                dir="ltr"
              />
            </div>

            <div className="pt-2 border-t border-slate-200">
              <ThemeTypographyColorsEditor config={config} onChange={onChangeConfig} language="ar" />
            </div>
          </div>
        )}

        {/* BUTTON PROPERTIES */}
        {isButton && (
          <div className="space-y-4">
            <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Square className="w-4 h-4 text-[#CC9048]" />
              <span>إعدادات مظهر الزر (Button)</span>
            </h5>

            <ThemeColorPicker
              label="لون خلفية الزر"
              value={config.primaryButtonBg || config.colors?.button || '#004AA5'}
              onChange={(hex) => onChangeConfig({ primaryButtonBg: hex })}
              officialValue="#004AA5"
            />

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-700">
                <span>استدارة الحواف (Radius):</span>
                <span>{config.primaryButtonRadius || '12px'}</span>
              </div>
              <input
                type="range"
                min="4"
                max="28"
                value={parseInt(config.primaryButtonRadius || '12', 10)}
                onChange={(e) => onChangeConfig({ primaryButtonRadius: `${e.target.value}px` })}
                className="w-full accent-[#004AA5] cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* INPUT PROPERTIES */}
        {isInput && (
          <div className="space-y-4">
            <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Square className="w-4 h-4 text-[#CC9048]" />
              <span>حقول الإدخال (Inputs)</span>
            </h5>

            <ThemeColorPicker
              label="لون خلفية الحقل"
              value={config.inputBg || '#F8FAFC'}
              onChange={(hex) => onChangeConfig({ inputBg: hex })}
              officialValue="#F8FAFC"
            />

            <ThemeColorPicker
              label="لون حدود الحقل"
              value={config.inputBorder || '#D7E7F7'}
              onChange={(hex) => onChangeConfig({ inputBorder: hex })}
              officialValue="#D7E7F7"
            />

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-700">
                <span>استدارة الحواف (Radius):</span>
                <span>{config.inputRadius || '12px'}</span>
              </div>
              <input
                type="range"
                min="4"
                max="24"
                value={parseInt(config.inputRadius || '12', 10)}
                onChange={(e) => onChangeConfig({ inputRadius: `${e.target.value}px` })}
                className="w-full accent-[#004AA5] cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* PORTAL CARD PROPERTIES */}
        {isCard && targetCard && (
          <div className="space-y-4">
            <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Square className="w-4 h-4 text-[#004AA5]" />
              <span>إعدادات بطاقة الدخول: {targetCard.title.ar}</span>
            </h5>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">عنوان البطاقة (عربي):</label>
              <input
                type="text"
                value={targetCard.title.ar || ''}
                onChange={(e) => {
                  const updatedCards = (config.portalCards || []).map((c) =>
                    c.id === targetCard.id ? { ...c, title: { ...c.title, ar: e.target.value } } : c
                  );
                  onChangeConfig({ portalCards: updatedCards });
                }}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                dir="rtl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">عنوان البطاقة (English):</label>
              <input
                type="text"
                value={targetCard.title.en || ''}
                onChange={(e) => {
                  const updatedCards = (config.portalCards || []).map((c) =>
                    c.id === targetCard.id ? { ...c, title: { ...c.title, en: e.target.value } } : c
                  );
                  onChangeConfig({ portalCards: updatedCards });
                }}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
                dir="ltr"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">الوصف:</label>
              <textarea
                rows={2}
                value={targetCard.description.ar || ''}
                onChange={(e) => {
                  const updatedCards = (config.portalCards || []).map((c) =>
                    c.id === targetCard.id ? { ...c, description: { ...c.description, ar: e.target.value } } : c
                  );
                  onChangeConfig({ portalCards: updatedCards });
                }}
                className="w-full p-2 text-xs border border-slate-200 rounded-lg"
                dir="rtl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">الرابط الموجه إليه:</label>
              <input
                type="text"
                value={targetCard.destination || ''}
                onChange={(e) => {
                  const updatedCards = (config.portalCards || []).map((c) =>
                    c.id === targetCard.id ? { ...c, destination: e.target.value } : c
                  );
                  onChangeConfig({ portalCards: updatedCards });
                }}
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                dir="ltr"
              />
            </div>

            <div className="space-y-2 pt-1 border-t border-slate-100">
              <label className="flex items-center gap-2 text-xs font-bold text-[#0B2E57] cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(targetCard.featured)}
                  onChange={(e) => {
                    const updatedCards = (config.portalCards || []).map((c) =>
                      c.id === targetCard.id ? { ...c, featured: e.target.checked } : c
                    );
                    onChangeConfig({ portalCards: updatedCards });
                  }}
                  className="rounded text-[#004AA5]"
                />
                <span>تمييز البطاقة باللون الكحلي الرسمي (Featured)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetCard.visible !== false}
                  onChange={(e) => {
                    const updatedCards = (config.portalCards || []).map((c) =>
                      c.id === targetCard.id ? { ...c, visible: e.target.checked } : c
                    );
                    onChangeConfig({ portalCards: updatedCards });
                  }}
                  className="rounded text-[#004AA5]"
                />
                <span>إظهار البطاقة في البوابة</span>
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">شارة البطاقة (Badge):</label>
              <input
                type="text"
                value={targetCard.badge?.ar || ''}
                placeholder="محمي / إداري / متاح..."
                onChange={(e) => {
                  const updatedCards = (config.portalCards || []).map((c) =>
                    c.id === targetCard.id ? { ...c, badge: { ...(c.badge || {}), ar: e.target.value } } : c
                  );
                  onChangeConfig({ portalCards: updatedCards });
                }}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <ThemeColorPicker
                label="لون خلفية البطاقة"
                value={targetCard.cardBg || '#FFFFFF'}
                onChange={(hex) => {
                  const updatedCards = (config.portalCards || []).map((c) =>
                    c.id === targetCard.id ? { ...c, cardBg: hex } : c
                  );
                  onChangeConfig({ portalCards: updatedCards });
                }}
                officialValue="#FFFFFF"
              />
              <ThemeColorPicker
                label="لون حدود البطاقة"
                value={targetCard.borderColor || '#D7E7F7'}
                onChange={(hex) => {
                  const updatedCards = (config.portalCards || []).map((c) =>
                    c.id === targetCard.id ? { ...c, borderColor: hex } : c
                  );
                  onChangeConfig({ portalCards: updatedCards });
                }}
                officialValue="#D7E7F7"
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
        <span className="text-[10px] text-slate-400">
          التغييرات تُحفظ في المسودة فوراً وتنعكس في المعاينة
        </span>
      </div>
    </div>
  );
};
