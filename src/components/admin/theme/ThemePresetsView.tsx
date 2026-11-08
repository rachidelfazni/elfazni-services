import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Copy,
  Plus,
  BookmarkCheck,
  Eye,
  Sliders,
  Trash2,
  Edit3,
  Lock,
  X,
  Globe,
  Monitor,
} from 'lucide-react';
import {
  ThemePreset,
  InterfaceTarget,
  InterfaceThemeConfig,
  generateGradientCss,
  themeService,
} from '../../../services/themeService';
import { BrandLogo } from '../../common/BrandLogo';

interface ThemePresetsViewProps {
  presets: ThemePreset[];
  currentTarget: InterfaceTarget;
  currentConfig?: InterfaceThemeConfig | null;
  onTargetChange?: (target: InterfaceTarget) => void;
  onApplyPreset: (
    presetId: string,
    target?: InterfaceTarget,
    options?: { forceOverwriteLocal?: boolean; autoPublish?: boolean; openEditor?: boolean }
  ) => Promise<void>;
  onRefresh: () => void;
  showFeedback: (msg: string, type?: 'success' | 'error') => void;
}

export const ThemePresetsView: React.FC<ThemePresetsViewProps> = ({
  presets,
  currentTarget,
  currentConfig,
  onTargetChange,
  onApplyPreset,
  onRefresh,
  showFeedback,
}) => {
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [targetScope, setTargetScope] = useState<'current' | 'global'>(
    currentTarget === 'global' ? 'global' : 'current'
  );
  const [selectedInterface, setSelectedInterface] = useState<InterfaceTarget>(
    currentTarget === 'global' ? 'crm_login' : currentTarget
  );
  const [forceOverwriteLocal, setForceOverwriteLocal] = useState(false);

  // Preview Modal State
  const [previewPreset, setPreviewPreset] = useState<ThemePreset | null>(null);

  // Create / Save Custom Preset Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newPresetNameAr, setNewPresetNameAr] = useState('');
  const [newPresetNameEn, setNewPresetNameEn] = useState('');
  const [newPresetDescAr, setNewPresetDescAr] = useState('');
  const [savingCustom, setSavingCustom] = useState(false);

  // Rename Modal State
  const [editingPreset, setEditingPreset] = useState<ThemePreset | null>(null);
  const [editNameAr, setEditNameAr] = useState('');
  const [editDescAr, setEditDescAr] = useState('');

  const interfaceLabels: Record<InterfaceTarget, string> = {
    crm_login: 'تسجيل دخول CRM',
    admin_login: 'تسجيل دخول الإدارة',
    portal: 'البوابة الموحدة (HUB)',
    website: 'الموقع الإلكتروني العام',
    global: 'الهوية البصرية العامة',
  };

  const handleInterfaceSelect = (tgt: InterfaceTarget) => {
    setSelectedInterface(tgt);
    onTargetChange?.(tgt);
  };

  const handleApply = async (preset: ThemePreset, openEditor = false) => {
    const effectiveTarget = targetScope === 'global' ? 'global' : selectedInterface;
    if (targetScope === 'global' && forceOverwriteLocal) {
      const ok = window.confirm(
        `هل تريد تعميم قالب "${preset.nameAr}" على جميع الواجهات وإلغاء التخصيصات المحلية المستقلة؟`
      );
      if (!ok) return;
    }

    setApplyingId(preset.id);
    try {
      await onApplyPreset(preset.id, effectiveTarget, {
        forceOverwriteLocal,
        autoPublish: false,
        openEditor,
      });
    } catch (err: any) {
      showFeedback(err.message || 'فشل تطبيق القالب', 'error');
    } finally {
      setApplyingId(null);
    }
  };

  const handleCreateCustomPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetNameAr.trim()) return;
    setSavingCustom(true);
    try {
      await themeService.createPreset({
        nameAr: newPresetNameAr.trim(),
        name: newPresetNameEn.trim() || newPresetNameAr.trim(),
        descriptionAr: newPresetDescAr.trim() || `قالب مخصص محفوظ من واجهة ${interfaceLabels[selectedInterface]}`,
        description: newPresetDescAr.trim() || 'Custom Saved Theme Preset',
        sourceConfig: currentConfig || undefined,
      });
      showFeedback(`تم حفظ القالب الجديد "${newPresetNameAr}" بنجاح!`);
      setCreateModalOpen(false);
      setNewPresetNameAr('');
      setNewPresetNameEn('');
      setNewPresetDescAr('');
      onRefresh();
    } catch (err: any) {
      showFeedback(err.message || 'فشل حفظ القالب الجديد', 'error');
    } finally {
      setSavingCustom(false);
    }
  };

  const handleDuplicate = async (preset: ThemePreset) => {
    try {
      await themeService.duplicatePreset(preset.id, `${preset.nameAr} (نسخة مخصصة)`);
      showFeedback(`تم تكرار القالب "${preset.nameAr}" بنجاح!`);
      onRefresh();
    } catch (err: any) {
      showFeedback(err.message || 'فشل تكرار القالب', 'error');
    }
  };

  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPreset || !editNameAr.trim()) return;
    try {
      await themeService.updatePreset(editingPreset.id, {
        nameAr: editNameAr.trim(),
        descriptionAr: editDescAr.trim(),
      });
      showFeedback('تم تحديث اسم ووصف القالب بنجاح!');
      setEditingPreset(null);
      onRefresh();
    } catch (err: any) {
      showFeedback(err.message || 'فشل تحديث القالب', 'error');
    }
  };

  const handleDelete = async (preset: ThemePreset) => {
    if (preset.isSystem) {
      showFeedback('لا يمكن حذف القوالب الرسمية المعتمدة.', 'error');
      return;
    }
    if (!window.confirm(`هل أنت متأكد من حذف القالب المخصص "${preset.nameAr}"؟`)) return;
    try {
      await themeService.deletePreset(preset.id);
      showFeedback(`تم حذف القالب "${preset.nameAr}" بنجاح.`);
      onRefresh();
    } catch (err: any) {
      showFeedback(err.message || 'فشل حذف القالب', 'error');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-6" dir="rtl">
      {/* Top Header & Scope Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#0B2E57] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#CC9048]" />
            <span>القوالب الجاهزة والمخصصة (Theme Presets)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            اختر قالباً جاهزاً لتطبيقه فوراً أو تخصيصه بالكامل في المحرر المرئي، أو احفظ تصميمك الحالي كقالب جديد.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          {/* Save Current Design as Custom Preset Button */}
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#81521C] border border-[#CC9048]/40 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4 text-[#CC9048]" />
            <span>حفظ كقالب جديد</span>
          </button>

          {/* Scope Toggle: Current Interface vs Global */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
            <button
              type="button"
              onClick={() => setTargetScope('current')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                targetScope === 'current' ? 'bg-[#004AA5] text-white shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>تطبيق على الواجهة الحالية فقط</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetScope('global')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                targetScope === 'global' ? 'bg-[#004AA5] text-white shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>تطبيق على الهوية العامة</span>
            </button>
          </div>

          {/* Target Interface Selector when scope === 'current' */}
          {targetScope === 'current' ? (
            <select
              value={selectedInterface}
              onChange={(e) => handleInterfaceSelect(e.target.value as InterfaceTarget)}
              className="px-3 py-2 text-xs font-bold bg-blue-50/80 border border-blue-200 rounded-xl text-[#004AA5] cursor-pointer focus:ring-2 focus:ring-[#004AA5]/30"
              aria-label="Target Interface for Preset"
            >
              <option value="crm_login">واجهة: تسجيل دخول CRM</option>
              <option value="admin_login">واجهة: تسجيل دخول الإدارة</option>
              <option value="portal">واجهة: البوابة الموحدة (HUB)</option>
              <option value="website">واجهة: الموقع الإلكتروني</option>
            </select>
          ) : (
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800 cursor-pointer">
              <input
                type="checkbox"
                checked={forceOverwriteLocal}
                onChange={(e) => setForceOverwriteLocal(e.target.checked)}
                className="rounded text-[#004AA5]"
              />
              <span>تعميم على الواجهات المخصصة محلياً</span>
            </label>
          )}
        </div>
      </div>

      {/* Presets Grid with Visual Mini-Login Thumbnails */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {presets.map((preset) => {
          const isCurrentlyApplied = currentConfig?.appliedPresetId === preset.id;
          const panelBg = preset.backgroundColor || preset.globalColors?.secondary || '#071629';
          const panelGradient = generateGradientCss(preset.gradient);
          const formBg = preset.formBg || preset.globalColors?.surface || '#FFFFFF';
          const formText = preset.formTextColor || preset.globalColors?.text || '#0B2E57';
          const inputBg = preset.inputBg || '#F8FAFC';
          const inputBorder = preset.inputBorder || preset.globalColors?.border || '#D7E7F7';
          const btnBg = preset.primaryButtonBg || preset.globalColors?.button || '#004AA5';
          const btnText = preset.primaryButtonTextColor || '#FFFFFF';
          const kickerColor = preset.kickerColor || preset.globalColors?.gold || '#CC9048';
          const titleColor = preset.titleColor || '#FFFFFF';
          const noteColor = preset.noteColor || '#CBD5E1';
          const illustUrl =
            preset.illustrationUrl || '/assets/brand/3d/02-consular-documents-transparent.png';

          return (
            <div
              key={preset.id}
              data-preset-id={preset.id}
              className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden ${
                isCurrentlyApplied
                  ? 'border-[#004AA5] ring-2 ring-[#004AA5]/25 shadow-lg bg-blue-50/20'
                  : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md bg-white'
              }`}
            >
              {/* MINI VISUAL PREVIEW THUMBNAIL (Simulating Split Login Screen) */}
              <div
                className="h-44 w-full grid grid-cols-12 overflow-hidden border-b border-slate-200 relative group cursor-pointer"
                onClick={() => setPreviewPreset(preset)}
              >
                {/* Right Side (in RTL): Form Card Preview (5 cols) */}
                <div
                  className="col-span-5 p-3.5 flex flex-col justify-between"
                  style={{ backgroundColor: formBg, color: formText }}
                >
                  <div className="space-y-1">
                    <div
                      className="w-12 h-2 rounded-full opacity-80"
                      style={{ backgroundColor: preset.globalColors?.primary || '#004AA5' }}
                    />
                    <div
                      className="text-[11px] font-black truncate"
                      style={{ color: formText }}
                    >
                      تسجيل الدخول
                    </div>
                  </div>

                  <div className="space-y-1.5 my-auto py-1">
                    <div
                      className="h-5 w-full rounded-md border px-1.5 flex items-center"
                      style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                    >
                      <span className="w-10 h-1.5 rounded bg-slate-400/40" />
                    </div>
                    <div
                      className="h-5 w-full rounded-md border px-1.5 flex items-center"
                      style={{ backgroundColor: inputBg, borderColor: inputBorder }}
                    >
                      <span className="w-8 h-1.5 rounded bg-slate-400/40" />
                    </div>
                  </div>

                  <div
                    className="h-6 w-full rounded-md flex items-center justify-center text-[9px] font-extrabold shadow-2xs"
                    style={{ backgroundColor: btnBg, color: btnText }}
                  >
                    دخول للنظام
                  </div>
                </div>

                {/* Left Side (in RTL): Visual Panel Preview (7 cols) */}
                <div
                  className="col-span-7 relative p-3.5 flex flex-col justify-between overflow-hidden"
                  style={{ backgroundColor: panelBg }}
                >
                  {/* Gradient Layer */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: panelGradient,
                      opacity: preset.gradient?.opacity ?? 0.88,
                    }}
                  />

                  {/* Illustration Layer */}
                  <div className="absolute inset-0 flex items-center justify-center p-2 pointer-events-none">
                    <img
                      src={illustUrl}
                      alt={preset.nameAr}
                      className="max-h-24 max-w-[75%] object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Top Mini Logo */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span
                      className="text-[8px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded bg-black/25 backdrop-blur-2xs"
                      style={{ color: kickerColor }}
                    >
                      ELFAZNI
                    </span>
                    {isCurrentlyApplied && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold shadow">
                        مطبق حالياً ✓
                      </span>
                    )}
                  </div>

                  {/* Bottom Mini Headings */}
                  <div className="relative z-10 space-y-0.5">
                    <div
                      className="text-[8px] font-extrabold uppercase tracking-wider truncate"
                      style={{ color: kickerColor }}
                    >
                      ELFAZNI SERVICES
                    </div>
                    <div
                      className="text-xs font-black leading-tight truncate"
                      style={{ color: titleColor }}
                    >
                      {preset.nameAr}
                    </div>
                    <div
                      className="text-[9px] truncate opacity-90"
                      style={{ color: noteColor }}
                    >
                      معاينة الهوية البصرية
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body: Info & Swatches */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h4 className="text-sm font-black text-[#0B2E57] truncate">{preset.nameAr}</h4>
                    {preset.isSystem ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#004AA5] border border-blue-200 flex items-center gap-1 shrink-0">
                        <Lock className="w-2.5 h-2.5" />
                        <span>رسمي معتمد</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          قالب مخصص
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPreset(preset);
                            setEditNameAr(preset.nameAr);
                            setEditDescAr(preset.descriptionAr || '');
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-[#004AA5] hover:bg-slate-100 cursor-pointer"
                          title="إعادة تسمية القالب"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(preset)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="حذف القالب المخصص"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 min-h-[34px]">
                    {preset.descriptionAr || preset.description}
                  </p>
                </div>

                {/* Color Swatches */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    {preset.previewColors.map((hex, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-lg border border-slate-300 shadow-2xs"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDuplicate(preset)}
                    className="text-[11px] font-bold text-slate-500 hover:text-[#004AA5] flex items-center gap-1 cursor-pointer"
                    title="تكرار هذا القالب كقالب مخصص قابل للتعديل"
                  >
                    <Copy className="w-3 h-3" />
                    <span>تكرار</span>
                  </button>
                </div>

                {/* Primary Action Buttons: Preview (معاينة) | Apply (تطبيق) | Customize (تخصيص) */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewPreset(preset)}
                    className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApply(preset, false)}
                    disabled={applyingId === preset.id}
                    className="py-2 px-2 rounded-xl bg-[#004AA5] hover:bg-[#003B84] text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <BookmarkCheck className="w-3.5 h-3.5" />
                    <span>{applyingId === preset.id ? 'جاري...' : 'تطبيق'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApply(preset, true)}
                    disabled={applyingId === preset.id}
                    className="py-2 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#81521C] border border-[#CC9048]/40 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#CC9048]" />
                    <span>تخصيص</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* FULL PRESET PREVIEW MODAL                                           */}
      {/* =================================================================== */}
      {previewPreset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setPreviewPreset(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-[#0B2E57] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#CC9048]" />
                  <span>معاينة القالب: {previewPreset.nameAr}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{previewPreset.descriptionAr}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPreset(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Full Login Screen Preview */}
            <div className="p-6 bg-slate-100">
              <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
                {/* Form Side */}
                <div
                  className="md:col-span-6 p-8 flex flex-col justify-center space-y-5"
                  style={{
                    backgroundColor: previewPreset.formBg || previewPreset.globalColors?.surface || '#FFFFFF',
                    color: previewPreset.formTextColor || previewPreset.globalColors?.text || '#0B2E57',
                  }}
                >
                  <div className="space-y-1.5">
                    <span
                      className="text-xs font-extrabold uppercase tracking-wider"
                      style={{ color: previewPreset.kickerColor || '#CC9048' }}
                    >
                      ELFAZNI SERVICES
                    </span>
                    <h3 className="text-2xl font-black">تسجيل الدخول للنظام</h3>
                    <p
                      className="text-xs"
                      style={{ color: previewPreset.formMutedColor || '#64748B' }}
                    >
                      أدخل بيانات الحساب المعتمدة للمتابعة إلى لوحة التحكم.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold block">اسم المستخدم أو البريد</label>
                      <div
                        className="w-full px-4 py-2.5 rounded-xl border text-xs font-mono"
                        style={{
                          backgroundColor: previewPreset.inputBg || '#F8FAFC',
                          borderColor: previewPreset.inputBorder || '#D7E7F7',
                          color: previewPreset.inputTextColor || '#0B2E57',
                        }}
                      >
                        admin@elfazni.com
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold block">كلمة المرور</label>
                      <div
                        className="w-full px-4 py-2.5 rounded-xl border text-xs font-mono"
                        style={{
                          backgroundColor: previewPreset.inputBg || '#F8FAFC',
                          borderColor: previewPreset.inputBorder || '#D7E7F7',
                          color: previewPreset.inputTextColor || '#0B2E57',
                        }}
                      >
                        ••••••••••••
                      </div>
                    </div>
                    <button
                      type="button"
                      className="w-full py-3 rounded-xl text-xs font-black shadow-md transition"
                      style={{
                        backgroundColor: previewPreset.primaryButtonBg || previewPreset.globalColors?.button || '#004AA5',
                        color: previewPreset.primaryButtonTextColor || '#FFFFFF',
                      }}
                    >
                      دخول إلى المنصة
                    </button>
                  </div>
                </div>

                {/* Visual Panel Side */}
                <div
                  className="md:col-span-6 relative p-8 flex flex-col justify-between overflow-hidden"
                  style={{
                    backgroundColor: previewPreset.backgroundColor || '#071629',
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: generateGradientCss(previewPreset.gradient),
                      opacity: previewPreset.gradient?.opacity ?? 0.9,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none">
                    <img
                      src={
                        previewPreset.illustrationUrl ||
                        '/assets/brand/3d/02-consular-documents-transparent.png'
                      }
                      alt={previewPreset.nameAr}
                      className="max-h-52 object-contain drop-shadow-2xl"
                    />
                  </div>
                  <div className="relative z-10">
                    <BrandLogo
                      background={
                        previewPreset.illustrationLogoVariant?.includes('white') ? 'white' : 'blue'
                      }
                      orientation="horizontal"
                      size="md"
                      className="h-11 w-auto"
                    />
                  </div>
                  <div className="relative z-10 space-y-1.5">
                    <p
                      className="text-xs font-extrabold uppercase tracking-widest"
                      style={{ color: previewPreset.kickerColor || '#CC9048' }}
                    >
                      ELFAZNI SERVICES
                    </p>
                    <h4
                      className="text-2xl font-black"
                      style={{ color: previewPreset.titleColor || '#FFFFFF' }}
                    >
                      الفزني للخدمات
                    </h4>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: previewPreset.noteColor || '#E2E8F0' }}
                    >
                      {previewPreset.descriptionAr}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-bold">
                الواجهة المستهدفة:{' '}
                <strong className="text-[#004AA5]">
                  {targetScope === 'global' ? 'الهوية العامة' : interfaceLabels[selectedInterface]}
                </strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const p = previewPreset;
                    setPreviewPreset(null);
                    handleApply(p, false);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#004AA5] hover:bg-[#003B84] text-white text-xs font-bold cursor-pointer"
                >
                  تطبيق هذا القالب الآن
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p = previewPreset;
                    setPreviewPreset(null);
                    handleApply(p, true);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#81521C] border border-[#CC9048]/40 text-xs font-bold cursor-pointer"
                >
                  تطبيق وتخصيص في المحرر
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* CREATE CUSTOM PRESET MODAL (حفظ كقالب جديد)                         */}
      {/* =================================================================== */}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setCreateModalOpen(false)}
        >
          <form
            onSubmit={handleCreateCustomPreset}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-black text-[#0B2E57] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#CC9048]" />
                <span>حفظ المظهر الحالي كقالب جديد</span>
              </h4>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  اسم القالب بالعربية (مطلوب):
                </label>
                <input
                  type="text"
                  required
                  value={newPresetNameAr}
                  onChange={(e) => setNewPresetNameAr(e.target.value)}
                  placeholder="مثال: قالب الفزني الذهبي الخاص"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#004AA5]/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  اسم القالب بالإنجليزية (اختياري):
                </label>
                <input
                  type="text"
                  value={newPresetNameEn}
                  onChange={(e) => setNewPresetNameEn(e.target.value)}
                  placeholder="Elfazni Custom Gold"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">وصف مختصر للقالب:</label>
                <textarea
                  rows={2}
                  value={newPresetDescAr}
                  onChange={(e) => setNewPresetDescAr(e.target.value)}
                  placeholder="يحتوي على إعدادات الألوان والتدرج والمجسم المخصصة..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={savingCustom}
                className="px-5 py-2 rounded-xl bg-[#004AA5] hover:bg-[#003B84] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {savingCustom ? 'جاري الحفظ...' : 'حفظ القالب الجديد'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* RENAME CUSTOM PRESET MODAL                                          */}
      {/* =================================================================== */}
      {editingPreset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setEditingPreset(null)}
        >
          <form
            onSubmit={handleSaveRename}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-black text-[#0B2E57]">تعديل اسم ووصف القالب المخصص</h4>
              <button
                type="button"
                onClick={() => setEditingPreset(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">اسم القالب:</label>
                <input
                  type="text"
                  required
                  value={editNameAr}
                  onChange={(e) => setEditNameAr(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">وصف القالب:</label>
                <textarea
                  rows={2}
                  value={editDescAr}
                  onChange={(e) => setEditDescAr(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPreset(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#004AA5] hover:bg-[#003B84] text-white text-xs font-bold cursor-pointer"
              >
                حفظ التغييرات
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
