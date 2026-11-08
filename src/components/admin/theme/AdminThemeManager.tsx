import React, { useState, useEffect } from 'react';
import {
  Palette,
  Save,
  Send,
  History,
  Sparkles,
  Layout,
  Globe,
  Layers,
  Lock,
  Users,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react';
import {
  InterfaceTarget,
  InterfaceThemeConfig,
  ThemeAllDataResponse,
  themeService,
} from '../../../services/themeService';
import { ThemeSettingsSidebar } from './ThemeSettingsSidebar';
import { ThemeLivePreview } from './ThemeLivePreview';
import { ThemeElementInspector } from './ThemeElementInspector';
import { ThemeOverviewView } from './ThemeOverviewView';
import { ThemeMediaLibrary } from './ThemeMediaLibrary';
import { ThemePresetsView } from './ThemePresetsView';
import { ThemeHistoryView } from './ThemeHistoryView';

export type ThemeSubTab =
  | 'overview'
  | 'website'
  | 'portal'
  | 'admin_login'
  | 'crm_login'
  | 'brand_global'
  | 'media_library'
  | 'presets'
  | 'history';

interface AdminThemeManagerProps {
  initialSubTab?: ThemeSubTab;
  onNavigatePublic?: (path: string) => void;
}

export const AdminThemeManager: React.FC<AdminThemeManagerProps> = ({
  initialSubTab = 'overview',
  onNavigatePublic,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<ThemeSubTab>(initialSubTab);
  const [themeData, setThemeData] = useState<ThemeAllDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Editor states
  const [selectedTarget, setSelectedTarget] = useState<InterfaceTarget>('admin_login');
  const [workingDraft, setWorkingDraft] = useState<InterfaceThemeConfig | null>(null);
  const [selectedElementKey, setSelectedElementKey] = useState<string | null>(null);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [direction, setDirection] = useState<'rtl' | 'ltr'>('rtl');

  // Media picker modal state
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'illustration' | 'background' | 'logo'>('illustration');

  // Save as Custom Preset modal inside Visual Editor
  const [savePresetModalOpen, setSavePresetModalOpen] = useState(false);
  const [customPresetNameAr, setCustomPresetNameAr] = useState('');
  const [customPresetDescAr, setCustomPresetDescAr] = useState('');
  const [savingCustomPreset, setSavingCustomPreset] = useState(false);

  // Publish confirmation modal
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');

  useEffect(() => {
    loadThemes();
  }, []);

  useEffect(() => {
    if (initialSubTab) {
      handleSubTabSelect(initialSubTab);
    }
  }, [initialSubTab]);

  const loadThemes = async (preserveTarget?: InterfaceTarget) => {
    setLoading(true);
    try {
      const data = await themeService.getAllThemeData();
      setThemeData(data);
      const targetToLoad =
        preserveTarget ||
        (['website', 'portal', 'admin_login', 'crm_login', 'brand_global'].includes(activeSubTab)
          ? mapSubTabToTarget(activeSubTab)
          : selectedTarget || 'admin_login');
      const draft = data.drafts[targetToLoad] || data.published[targetToLoad];
      setWorkingDraft(JSON.parse(JSON.stringify(draft)));
      setSelectedTarget(targetToLoad);
    } catch (err: any) {
      showFeedback(err.message || 'فشل تحميل بيانات المظهر والهوية', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const mapSubTabToTarget = (tab: ThemeSubTab): InterfaceTarget => {
    switch (tab) {
      case 'website':
        return 'website';
      case 'portal':
        return 'portal';
      case 'admin_login':
        return 'admin_login';
      case 'crm_login':
        return 'crm_login';
      case 'brand_global':
        return 'global';
      default:
        return selectedTarget || 'admin_login';
    }
  };

  const mapTargetToSubTab = (target: InterfaceTarget): ThemeSubTab => {
    if (target === 'global') return 'brand_global';
    return target;
  };

  const handleSubTabSelect = (tab: ThemeSubTab) => {
    setActiveSubTab(tab);
    if (['website', 'portal', 'admin_login', 'crm_login', 'brand_global'].includes(tab)) {
      const target = mapSubTabToTarget(tab);
      setSelectedTarget(target);
      if (themeData) {
        const draft = themeData.drafts[target] || themeData.published[target];
        setWorkingDraft(JSON.parse(JSON.stringify(draft)));
        setIsModified(false);
      }
    }
    setSelectedElementKey(null);
  };

  const handleTargetChangeFromDropdown = (newTarget: InterfaceTarget) => {
    setSelectedTarget(newTarget);
    if (themeData) {
      const draft = themeData.drafts[newTarget] || themeData.published[newTarget];
      setWorkingDraft(JSON.parse(JSON.stringify(draft)));
      setIsModified(false);
    }
    setSelectedElementKey(null);
  };

  const handleDraftUpdate = (updates: Partial<InterfaceThemeConfig>) => {
    setWorkingDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...updates,
        colors: { ...(prev.colors || {}), ...(updates.colors || {}) },
        typography: { ...(prev.typography || {}), ...(updates.typography || {}) },
        texts: { ...(prev.texts || {}), ...(updates.texts || {}) },
      };
    });
    setIsModified(true);
  };

  const handleSaveDraft = async () => {
    if (!workingDraft) return;
    setSaving(true);
    try {
      const updatedDraft = await themeService.saveDraft(selectedTarget, workingDraft);
      setWorkingDraft(JSON.parse(JSON.stringify(updatedDraft)));
      setIsModified(false);
      if (themeData) {
        setThemeData({
          ...themeData,
          drafts: {
            ...themeData.drafts,
            [selectedTarget]: updatedDraft,
          },
        });
      }
      showFeedback('تم حفظ المسودة بنجاح! التغييرات محفوظة وجاهزة للمعاينة والنشر.');
    } catch (err: any) {
      showFeedback(err.message || 'فشل حفظ المسودة', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!workingDraft) return;
    setPublishing(true);
    try {
      // First ensure draft is saved
      await themeService.saveDraft(selectedTarget, workingDraft);
      // Then publish
      const { published, version } = await themeService.publishTheme(selectedTarget, changeSummary);

      if (themeData) {
        setThemeData({
          ...themeData,
          published: {
            ...themeData.published,
            [selectedTarget]: published,
          },
          drafts: {
            ...themeData.drafts,
            [selectedTarget]: JSON.parse(JSON.stringify(published)),
          },
          versions: [version, ...themeData.versions],
        });
      }
      setWorkingDraft(JSON.parse(JSON.stringify(published)));
      setIsModified(false);
      setPublishModalOpen(false);
      setChangeSummary('');
      showFeedback(`تم نشر التعديلات بنجاح على واجهة (${published.nameAr || selectedTarget})!`);
    } catch (err: any) {
      showFeedback(err.message || 'فشل نشر التعديلات', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleResetToGlobal = async () => {
    if (!window.confirm('هل تريد إعادة تعيين كافة التخصيصات والعودة إلى وراثة الهوية البصرية الرسمية العامة؟')) return;
    try {
      const draft = await themeService.resetToGlobal(selectedTarget);
      setWorkingDraft(JSON.parse(JSON.stringify(draft)));
      setIsModified(true);
      if (themeData) {
        setThemeData({
          ...themeData,
          drafts: {
            ...themeData.drafts,
            [selectedTarget]: draft,
          },
        });
      }
      showFeedback('تمت استعادة إعدادات الهوية العامة بنجاح!');
    } catch (err: any) {
      showFeedback(err.message || 'فشل إعادة ضبط الهوية', 'error');
    }
  };

  const handleSaveCurrentAsPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workingDraft || !customPresetNameAr.trim()) return;
    setSavingCustomPreset(true);
    try {
      const created = await themeService.createPreset({
        nameAr: customPresetNameAr.trim(),
        name: customPresetNameAr.trim(),
        descriptionAr: customPresetDescAr.trim() || `قالب مخصص محفوظ من ${workingDraft.nameAr || selectedTarget}`,
        description: customPresetDescAr.trim() || 'Custom Saved Preset',
        sourceConfig: workingDraft,
      });
      if (themeData) {
        setThemeData({
          ...themeData,
          presets: [...themeData.presets, created],
        });
      }
      handleDraftUpdate({
        appliedPresetId: created.id,
        appliedPresetName: created.nameAr,
      });
      setSavePresetModalOpen(false);
      setCustomPresetNameAr('');
      setCustomPresetDescAr('');
      showFeedback(`تم حفظ التصميم الحالي كقالب جديد باسم "${created.nameAr}"!`);
    } catch (err: any) {
      showFeedback(err.message || 'فشل حفظ القالب الجديد', 'error');
    } finally {
      setSavingCustomPreset(false);
    }
  };

  const openMediaPickerFor = (targetType: 'illustration' | 'background' | 'logo' = 'illustration') => {
    setMediaPickerTarget(targetType);
    setMediaPickerOpen(true);
  };

  const isEditorView = ['website', 'portal', 'admin_login', 'crm_login', 'brand_global'].includes(activeSubTab);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#004AA5] border-t-transparent animate-spin" />
        <span className="text-xs font-bold">جاري تحميل نظام إدارة المظهر والهوية البصرية...</span>
      </div>
    );
  }

  const subMenus: Array<{ id: ThemeSubTab; label: string; icon: any }> = [
    { id: 'overview', label: 'نظرة عامة', icon: Layout },
    { id: 'website', label: 'مظهر الموقع الإلكتروني', icon: Globe },
    { id: 'portal', label: 'مظهر البوابة الرئيسية', icon: Layers },
    { id: 'admin_login', label: 'تسجيل دخول الإدارة', icon: Lock },
    { id: 'crm_login', label: 'تسجيل دخول CRM', icon: Users },
    { id: 'brand_global', label: 'الهوية البصرية العامة', icon: Palette },
    { id: 'media_library', label: 'مكتبة الصور والشعارات', icon: ImageIcon },
    { id: 'presets', label: 'القوالب الجاهزة', icon: Sparkles },
    { id: 'history', label: 'سجل التعديلات والنسخ', icon: History },
  ];

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-bold text-white transition-all ${
            feedback.type === 'success' ? 'bg-[#004AA5]' : 'bg-red-600'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-amber-300" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Top Submenu Navigation Bar (9 Submenus) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {subMenus.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSubTabSelect(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#004AA5] text-white shadow-sm shadow-[#004AA5]/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B2E57]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* VIEW 1: OVERVIEW */}
      {activeSubTab === 'overview' && themeData && (
        <ThemeOverviewView
          published={themeData.published}
          globalBrand={themeData.globalBrand}
          onSelectInterface={(tgt) => {
            if (tgt === 'global') handleSubTabSelect('brand_global');
            else handleSubTabSelect(tgt as ThemeSubTab);
          }}
        />
      )}

      {/* VIEW 2: MEDIA LIBRARY */}
      {activeSubTab === 'media_library' && themeData && (
        <ThemeMediaLibrary
          assets={themeData.assets}
          onAssetsChange={(assets) => {
            setThemeData({ ...themeData, assets });
          }}
        />
      )}

      {/* VIEW 3: PRESETS */}
      {activeSubTab === 'presets' && themeData && (
        <ThemePresetsView
          presets={themeData.presets}
          currentTarget={selectedTarget}
          currentConfig={workingDraft}
          onTargetChange={(tgt) => {
            setSelectedTarget(tgt);
            const draft = themeData.drafts[tgt] || themeData.published[tgt];
            if (draft) setWorkingDraft(JSON.parse(JSON.stringify(draft)));
          }}
          onApplyPreset={async (presetId, target, options) => {
            const effectiveTarget = target || selectedTarget;
            const res = await themeService.applyPreset(presetId, effectiveTarget, options);
            const refreshed = await themeService.getAllThemeData();
            setThemeData(refreshed);

            const targetToEdit = effectiveTarget === 'global' ? selectedTarget : effectiveTarget;
            const updatedDraft = refreshed.drafts[targetToEdit] || res.draft;
            setSelectedTarget(targetToEdit);
            setWorkingDraft(JSON.parse(JSON.stringify(updatedDraft)));
            setIsModified(true);

            showFeedback(
              `تم تطبيق قالب "${res.preset.nameAr}" بنجاح على (${
                effectiveTarget === 'global' ? 'الهوية العامة' : updatedDraft.nameAr || targetToEdit
              })! يمكنك الآن معاينته أو نشره.`
            );

            // Switch to Visual Editor so the admin immediately sees the applied preset in Live Preview
            setActiveSubTab(mapTargetToSubTab(targetToEdit));
          }}
          onRefresh={() => loadThemes(selectedTarget)}
          showFeedback={showFeedback}
        />
      )}

      {/* VIEW 4: HISTORY & ROLLBACK */}
      {activeSubTab === 'history' && themeData && (
        <ThemeHistoryView
          versions={themeData.versions}
          auditLogs={themeData.auditLogs}
          currentTarget={selectedTarget}
          onRestoreSuccess={() => loadThemes(selectedTarget)}
          showFeedback={showFeedback}
        />
      )}

      {/* VIEW 5: MODERN 3-AREA VISUAL THEME EDITOR */}
      {isEditorView && workingDraft && (
        <div className="flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-175px)] min-h-[620px]">
          {/* Action Header for Visual Editor */}
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#004AA5]" />
                <h3 className="text-sm font-black text-[#0B2E57]">
                  {workingDraft.nameAr || 'المحرر المرئي للمظهر'}
                </h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isModified
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {isModified ? 'معدّل — غير منشور (Modified Draft)' : 'مسودة محفوظة (Saved)'}
              </span>
              {workingDraft.appliedPresetName && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#004AA5] border border-blue-200">
                  القالب: {workingDraft.appliedPresetName}
                </span>
              )}
            </div>

            {/* Top Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSavePresetModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-[#81521C] border border-[#CC9048]/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="حفظ هذا التصميم المخصص كقالب جديد قابل لإعادة الاستخدام"
              >
                <Plus className="w-3.5 h-3.5 text-[#CC9048]" />
                <span>حفظ كقالب جديد</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'جاري الحفظ...' : 'حفظ مسودة'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPublishModalOpen(true)}
                disabled={publishing}
                className="px-4 py-2 rounded-xl bg-[#004AA5] hover:bg-[#003B84] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#004AA5]/20 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>نشر التعديلات للعامة</span>
              </button>
            </div>
          </div>

          {/* 3-Column Visual Editor Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* 1. LEFT SIDEBAR: Theme Settings */}
            <ThemeSettingsSidebar
              target={selectedTarget}
              onTargetChange={handleTargetChangeFromDropdown}
              config={workingDraft}
              globalBrand={themeData?.drafts.global || themeData?.published.global}
              onChangeConfig={handleDraftUpdate}
              onResetToGlobal={handleResetToGlobal}
              onOpenMediaPicker={(targetType) => openMediaPickerFor(targetType)}
              selectedElementKey={selectedElementKey}
              onSelectElement={(key) => setSelectedElementKey(key)}
            />

            {/* 2. CENTER: Live Interactive Preview */}
            <ThemeLivePreview
              target={selectedTarget}
              config={workingDraft}
              globalConfig={themeData?.published.global}
              device={device}
              setDevice={setDevice}
              direction={direction}
              setDirection={setDirection}
              selectedElementKey={selectedElementKey}
              onSelectElement={(key) => setSelectedElementKey(key)}
              onUpdateConfig={handleDraftUpdate}
            />

            {/* 3. RIGHT SIDEBAR: Element Properties Inspector */}
            <ThemeElementInspector
              selectedElementKey={selectedElementKey}
              config={workingDraft}
              onChangeConfig={handleDraftUpdate}
              onOpenMediaPicker={(targetType) => openMediaPickerFor(targetType)}
              onClose={() => setSelectedElementKey(null)}
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: MEDIA PICKER                                     */}
      {/* ======================================================== */}
      {mediaPickerOpen && themeData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setMediaPickerOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-white rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-black text-[#0B2E57]">
                {mediaPickerTarget === 'background'
                  ? 'اختر صورة الخلفية من مكتبة الوسائط'
                  : mediaPickerTarget === 'logo'
                  ? 'اختر الشعار المخصص من مكتبة الوسائط'
                  : 'اختر المجسم أو الصورة التوضيحية من مكتبة الوسائط'}
              </h4>
              <button
                type="button"
                onClick={() => setMediaPickerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ThemeMediaLibrary
              assets={themeData.assets}
              onAssetsChange={(assets) => setThemeData({ ...themeData, assets })}
              selectedAssetUrl={
                mediaPickerTarget === 'background'
                  ? workingDraft?.backgroundImage
                  : mediaPickerTarget === 'logo'
                  ? workingDraft?.customLogoUrl
                  : workingDraft?.illustrationUrl
              }
              onAssetSelect={(asset) => {
                if (mediaPickerTarget === 'logo' || selectedElementKey?.includes('logo')) {
                  handleDraftUpdate({ customLogoUrl: asset.url, logoVariant: 'custom' });
                } else if (mediaPickerTarget === 'background' || selectedElementKey?.includes('background')) {
                  handleDraftUpdate({ backgroundImage: asset.url });
                } else {
                  handleDraftUpdate({ illustrationUrl: asset.url });
                }
                setMediaPickerOpen(false);
                showFeedback(`تم اختيار الصورة [${asset.originalName}] بنجاح`);
              }}
              isPickerMode
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SAVE AS CUSTOM PRESET (حفظ كقالب جديد)            */}
      {/* ======================================================== */}
      {savePresetModalOpen && workingDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setSavePresetModalOpen(false)}
        >
          <form
            onSubmit={handleSaveCurrentAsPreset}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-right"
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#CC9048]" />
                <h4 className="text-sm font-black text-[#0B2E57]">حفظ التصميم الحالي كقالب جديد</h4>
              </div>
              <button
                type="button"
                onClick={() => setSavePresetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">اسم القالب الجديد:</label>
                <input
                  type="text"
                  required
                  value={customPresetNameAr}
                  onChange={(e) => setCustomPresetNameAr(e.target.value)}
                  placeholder="مثال: قالب دخول CRM الذهبي"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#004AA5]/30"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">وصف القالب (اختياري):</label>
                <textarea
                  rows={2}
                  value={customPresetDescAr}
                  onChange={(e) => setCustomPresetDescAr(e.target.value)}
                  placeholder="وصف مختصر للألوان والمجسم..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSavePresetModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={savingCustomPreset}
                className="px-5 py-2 rounded-xl bg-[#004AA5] hover:bg-[#003B84] text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {savingCustomPreset ? 'جاري الحفظ...' : 'حفظ القالب الجديد'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PUBLISH CONFIRMATION                             */}
      {/* ======================================================== */}
      {publishModalOpen && workingDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setPublishModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-[#004AA5]">
              <Send className="w-5 h-5 text-[#CC9048]" />
              <h4 className="text-base font-black text-[#0B2E57]">تأكيد نشر المظهر للعامة</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              سيتم نشر هذه المسودة على واجهة (
              <span className="font-bold text-[#004AA5]">{workingDraft.nameAr || selectedTarget}</span>)
              لتظهر فوراً للزوار والعملاء. سيتم حفظ لقطة احتياطية في الأرشيف للرجوع إليها في أي وقت.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">ملخص التعديلات (اختياري):</label>
              <input
                type="text"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="مثال: تعديل ألوان الأزرار والمجسم الديكوري..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#004AA5]/30 focus:border-[#004AA5]"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPublishModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="px-5 py-2 rounded-xl bg-[#004AA5] hover:bg-[#003B84] text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {publishing ? 'جاري النشر...' : 'تأكيد ونشر المظهر الآن ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
