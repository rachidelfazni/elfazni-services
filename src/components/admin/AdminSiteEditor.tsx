import { AdminContentStudio } from './AdminContentStudio';
import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  Upload,
  Sparkles,
  Eye,
  CheckCircle2,
  Image as ImageIcon,
  Palette,
  Phone,
  Mail,
  Sliders,
  Type,
  Layout,
  UserCheck,
} from 'lucide-react';
import { api, SiteSettings } from '../../services/api';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export const AdminSiteEditor: React.FC = () => {
  const { refreshSettings } = useSiteSettings();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const logoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getSettings();
      if (res.settings) setSettings(res.settings);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await api.updateSettings(settings);
      await refreshSettings();
      setFeedback('تم حفظ وتحديث إعدادات واجهة الموقع بنجاح وبثها فوراً لجميع الزوار');
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setFeedback('حدث خطأ أثناء الحفظ، يرجى المحاولة مجدداً');
      setTimeout(() => setFeedback(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'founderImage'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setSettings({
        ...settings,
        [field]: loadEvent.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  if (loading || !settings) {
    return (
      <div className="p-8 text-center text-slate-500">
        جارٍ تحميل إعدادات الواجهة الشاملة...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <Layout className="w-5 h-5 text-amber-400" />
            <span>إدارة واجهة الموقع الشاملة (Full Site Visual Editor)</span>
          </h2>
          <p className="text-xs text-blue-200/80 mt-0.5">
            تعديل الشريط العلوي، شعار الموقع، نصوص الهيرو، قسم المؤسس رشيد الفزني، وألوان الفوتر
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg hover:shadow-amber-500/30 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات فوراً'}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      <AdminContentStudio />
      {/* Main Grid: Settings Form & Live Visual Mockup Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Brand & Header Identity */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Type className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  1. الهوية وشعار العلامة التجارية (ELFAZNI SERVICES)
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم العلامة التجارية بالإنجليزية
                </label>
                <input
                  type="text"
                  disabled
                  value="ELFAZNI SERVICES"
                  className="w-full px-3.5 py-2 text-xs font-bold bg-slate-100 border border-slate-300 rounded-xl text-blue-900 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  الاسم العربي المعتمد هو الفزني للخدمات أو الفزني سيرفيسز.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الشريط الإعلاني العلوي (Top Announcement Bar)
                </label>
                <input
                  type="text"
                  value={settings.taglineAr}
                  onChange={(e) => setSettings({ ...settings, taglineAr: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 2. Official Contact Information */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Phone className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  2. أرقام التواصل والبريد المعتمد
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم الواتساب الرسمي (WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    البريد الإلكتروني الرسمي (Official Email)
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500 font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  أوقات العمل وساعات الخدمة
                </label>
                <input
                  type="text"
                  value={settings.workingHoursAr}
                  onChange={(e) => setSettings({ ...settings, workingHoursAr: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 3. Founder Rachid ELFAZNI Profile Editor */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <UserCheck className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">
                  3. قسم المدير العام والمؤسس (رشيد الفزني - Rachid ELFAZNI)
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={settings.founderImage || '/assets/founder-rachid-elfazni-v2.webp'}
                  alt="رشيد الفزني"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-md shrink-0"
                />
                <div className="flex-1 space-y-1 text-center sm:text-right">
                  <div className="text-xs font-bold text-slate-800">
                    رفع صورة شخصية حديثة (Avatar) من جهازك
                  </div>
                  <p className="text-[11px] text-slate-500">
                    تدعم صور PNG أو WebP أو JPG مع معاينة مباشرة في جميع أقسام الموقع.
                  </p>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={(e) => handleFileUpload(e, 'founderImage')}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 shadow-sm transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>اختيار صورة من الجهاز</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الاسم والمسمى الوظيفي
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={settings.founderName}
                    onChange={(e) => setSettings({ ...settings, founderName: e.target.value })}
                    className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                  <input
                    type="text"
                    value={settings.founderTitleAr}
                    onChange={(e) => setSettings({ ...settings, founderTitleAr: e.target.value })}
                    className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  النبذة التعريفية ورسالة المدير
                </label>
                <textarea
                  rows={3}
                  value={settings.founderBioAr}
                  onChange={(e) => setSettings({ ...settings, founderBioAr: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white resize-none"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'جارٍ الحفظ...' : 'حفظ ونشر التعديلات في الموقع'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Visual Preview Mockup Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 sticky top-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>معاينة حية فورية (Live UI Preview)</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  className={`px-2.5 py-1 rounded ${
                    previewMode === 'desktop' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  كمبيوتر
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  className={`px-2.5 py-1 rounded ${
                    previewMode === 'mobile' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  جوال
                </button>
              </div>
            </div>

            {/* Simulated Frame */}
            <div
              className={`mx-auto bg-slate-900 rounded-2xl p-2 transition-all shadow-xl ${
                previewMode === 'mobile' ? 'w-64' : 'w-full'
              }`}
            >
              <div className="bg-white rounded-xl overflow-hidden text-xs">
                {/* Header Mock */}
                <div className="bg-slate-900 text-white p-2.5 flex items-center justify-between">
                  <div className="font-black text-amber-400 tracking-wider">ELFAZNI SERVICES</div>
                  <div className="text-[9px] text-slate-300">خدمات الجالية المغربية</div>
                </div>

                {/* Announcement Bar Mock */}
                <div className="bg-blue-800 text-white text-[10px] px-2 py-1 text-center truncate">
                  {settings.taglineAr || 'خدمات استشارية وتنظيمية متكاملة'}
                </div>

                {/* Hero Section Mock */}
                <div className="bg-gradient-to-b from-blue-900 to-indigo-950 text-white p-4 text-center">
                  <div className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full inline-block mb-1">
                    خدمات موثوقة في تركيا
                  </div>
                  <div className="font-bold text-xs mb-1">
                    خدمات الجالية المغربية في تركيا بكل سهولة
                  </div>
                  <div className="text-[9px] text-blue-200 mb-3">
                    مواعيد القنصلية، حجوزات الطيران، الترجمة المحلفة، والإقامات
                  </div>
                  <div className="inline-block bg-emerald-500 text-white text-[9px] font-bold px-3 py-1 rounded-full">
                    تواصل عبر واتساب: {settings.phone}
                  </div>
                </div>

                {/* Founder Section Mock */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2.5">
                  <img
                    src={settings.founderImage || '/assets/founder-rachid-elfazni-v2.webp'}
                    alt="رشيد"
                    className="w-10 h-10 rounded-full object-cover border border-amber-400"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{settings.founderName}</div>
                    <div className="text-[10px] text-slate-500 truncate">{settings.founderTitleAr}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 text-center text-[11px] text-slate-400">
              أي تغيير تقوم به ينعكس مباشرة على زوار الموقع بعد الضغط على زر الحفظ.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
