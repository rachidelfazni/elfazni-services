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
    selectedElementKey.includes('typography') ||
    selectedElementKey.includes('return_site') ||
    selectedElementKey.includes('action');

  const isLogo = selectedElementKey.includes('logo');
  const isIllustration = selectedElementKey.includes('illustration');
  const isButton =
    selectedElementKey.includes('button') ||
    selectedElementKey.includes('action') ||
    selectedElementKey.includes('submit');
  const isInput = selectedElementKey.includes('input');
  const isCard = selectedElementKey.includes('card');
  const cardId = selectedElementKey.startsWith('portal_card_')
    ? selectedElementKey.replace('portal_card_', '')
    : null;
  const targetCard = cardId ? (config.portalCards || []).find((c) => c.id === cardId) : null;

  const TEXT_KEY_ALIASES: Record<string, string[]> = {
    portal_title: ['heroTitle', 'portal_title'],
    portal_kicker: ['heroKicker', 'portal_kicker'],
    portal_desc: ['heroDescription', 'heroSubtitle', 'portal_desc'],
    portal_secure_note: ['secureNote', 'portal_secure_note'],
    portal_return_site: ['returnToSite', 'portal_return_site'],
    form_kicker: ['formKicker', 'form_kicker'],
    login_title: ['loginTitle', 'login_title'],
    login_desc: ['loginDesc', 'login_desc'],
    website_kicker: ['heroKicker', 'website_kicker'],
    website_title: ['heroTitle', 'website_title'],
    website_subtitle: ['heroSubtitle', 'heroDescription', 'website_subtitle'],
    website_primary_action: ['primaryButton', 'website_primary_action'],
    website_secondary_action: ['secondaryButton', 'website_secondary_action'],
    content: ['photoTitle', 'panelTitle', 'heroTitle', 'content'],
  };

  const DEFAULT_TEXT_VALUES: Record<string, { ar: string; en: string; fr: string }> = {
    portal_title: {
      ar: 'بوابة الفزني سيرفيسز',
      en: 'ELFAZNI SERVICES HUB',
      fr: 'PORTAIL ELFAZNI SERVICES',
    },
    portal_kicker: {
      ar: 'مركز الوصول الموحّد',
      en: 'UNIFIED ACCESS PORTAL',
      fr: 'CENTRE D’ACCÈS UNIFIÉ',
    },
    portal_desc: {
      ar: 'الوصول السريع إلى الموقع الإلكتروني ونظام إدارة العملاء ولوحة التحكم من مكان واحد.',
      en: 'Quick access to the website, the CRM system and the admin dashboard from a single place.',
      fr: 'Accès rapide au site web, au CRM et au tableau de bord.',
    },
    portal_secure_note: {
      ar: 'يخضع الدخول إلى الأنظمة لاشتراطات تسجيل الحسابات.',
      en: 'Access requires registered credentials.',
      fr: 'L’accès nécessite des identifiants enregistrés.',
    },
    portal_return_site: {
      ar: 'العودة إلى الموقع العام',
      en: 'Back to public website',
      fr: 'Retour au site public',
    },
    form_kicker: {
      ar: 'بوابة الدخول الآمنة',
      en: 'Secure Login Portal',
      fr: 'Portail de connexion sécurisé',
    },
    login_title: {
      ar: 'تسجيل الدخول',
      en: 'Sign in',
      fr: 'Connexion',
    },
    login_desc: {
      ar: 'أدخل بيانات حسابك للوصول إلى النظام.',
      en: 'Enter your account credentials.',
      fr: 'Entrez vos identifiants de compte.',
    },
    website_kicker: {
      ar: 'المكتب المعتمد في تركيا',
      en: 'Certified Agency in Türkiye',
      fr: 'Agence certifiée en Turquie',
    },
    website_title: {
      ar: 'الفزني للخدمات العامة والقنصلية والسياحية للمغاربة والعرب',
      en: 'ELFAZNI SERVICES — Travel & Consular Services',
      fr: 'ELFAZNI SERVICES — Services Consulaires et Voyages',
    },
    website_subtitle: {
      ar: 'حجوزات طيران وفنادق، مواعيد قنصلية، إقامات وتأشيرات، وترجمة محلفة بأعلى جودة.',
      en: 'Flight & hotel bookings, consular appointments, visas, sworn translations.',
      fr: 'Réservations de vols, rendez-vous consulaires, visas et traductions assermentées.',
    },
    website_primary_action: {
      ar: 'ابدأ طلبك الآن',
      en: 'Start Request',
      fr: 'Commencer votre demande',
    },
    website_secondary_action: {
      ar: 'استكشف الخدمات',
      en: 'Explore Services',
      fr: 'Explorer les services',
    },
    content: {
      ar: 'بوابة الفزني سيرفيسز',
      en: 'ELFAZNI SERVICES HUB',
      fr: 'PORTAIL ELFAZNI SERVICES',
    },
  };

  const getDisplayText = (lang: 'ar' | 'en' | 'fr') => {
    if (config.texts?.[selectedElementKey]?.[lang]) {
      return config.texts[selectedElementKey][lang];
    }
    const aliases = TEXT_KEY_ALIASES[selectedElementKey] || [];
    for (const a of aliases) {
      if (config.texts?.[a]?.[lang]) return config.texts[a][lang];
    }
    if (selectedElementKey === 'content' || selectedElementKey.includes('side')) {
      if (lang === 'ar' && config.sidePanel?.headingAr) return config.sidePanel.headingAr;
      if (lang === 'en' && config.sidePanel?.headingEn) return config.sidePanel.headingEn;
    }
    return DEFAULT_TEXT_VALUES[selectedElementKey]?.[lang] || '';
  };

  const updateText = (lang: 'ar' | 'en' | 'fr', val: string) => {
    const texts = { ...(config.texts || {}) };
    texts[selectedElementKey] = { ...(texts[selectedElementKey] || {}), [lang]: val };
    const aliases = TEXT_KEY_ALIASES[selectedElementKey] || [];
    for (const a of aliases) {
      texts[a] = { ...(texts[a] || {}), [lang]: val };
    }

    const patch: Partial<InterfaceThemeConfig> = { texts };

    if (selectedElementKey === 'content' || selectedElementKey.includes('side')) {
      const sp = { ...(config.sidePanel || {}) };
      if (lang === 'ar') sp.headingAr = val;
      if (lang === 'en') sp.headingEn = val;
      patch.sidePanel = sp;
    }

    if (config.target === 'portal') {
      const mp = { ...(config.menuPanel || {}) };
      if (selectedElementKey === 'portal_title') {
        if (lang === 'ar') mp.headingAr = val;
        if (lang === 'en') mp.headingEn = val;
        patch.menuPanel = mp;
      }
    }

    onChangeConfig(patch);
  };

  const handleTypographyColorChange = (colorPatch: Partial<InterfaceThemeConfig>) => {
    if (config.target === 'portal') {
      const mp = { ...(config.menuPanel || {}) };
      const sp = { ...(config.sidePanel || {}) };
      if (colorPatch.titleColor) {
        mp.headingColor = colorPatch.titleColor;
        if (selectedElementKey === 'content') sp.headingColor = colorPatch.titleColor;
      }
      if (colorPatch.kickerColor) {
        mp.kickerColor = colorPatch.kickerColor;
      }
      if (colorPatch.noteColor) {
        mp.descColor = colorPatch.noteColor;
        if (selectedElementKey === 'content') sp.descriptionColor = colorPatch.noteColor;
      }
      onChangeConfig({ ...colorPatch, menuPanel: mp, sidePanel: sp });
    } else {
      onChangeConfig(colorPatch);
    }
  };

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
                value={config.target === 'portal' ? (config.outerBackground?.image || config.backgroundImage || '') : (config.backgroundImage || '')}
                onChange={(e) => {
                  const val = e.target.value;
                  if (config.target === 'portal' || selectedElementKey === 'outer_background') {
                    onChangeConfig({
                      backgroundImage: val,
                      outerBackground: {
                        ...(config.outerBackground || {}),
                        image: val,
                        type: 'image',
                      },
                    });
                  } else {
                    onChangeConfig({ backgroundImage: val });
                  }
                }}
                placeholder="/assets/brand/hub-entry.jpg"
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
                value={getDisplayText('ar')}
                onChange={(e) => updateText('ar', e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#004AA5]/30 focus:border-[#004AA5]"
                dir="rtl"
              />
            </div>

            {/* English Text */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">النص بالإنجليزية (EN):</label>
              <textarea
                rows={2}
                value={getDisplayText('en')}
                onChange={(e) => updateText('en', e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#004AA5]/30 focus:border-[#004AA5]"
                dir="ltr"
              />
            </div>

            {/* French Text */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">النص بالفرنسية (FR):</label>
              <textarea
                rows={2}
                value={getDisplayText('fr')}
                onChange={(e) => updateText('fr', e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#004AA5]/30 focus:border-[#004AA5]"
                dir="ltr"
              />
            </div>

            <div className="pt-2 border-t border-slate-200">
              <ThemeTypographyColorsEditor config={config} onChange={handleTypographyColorChange} language="ar" />
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
