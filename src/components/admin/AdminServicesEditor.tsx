import { homepageSections, type HomepageSection } from '../../data/siteVisibility';
import React, { useState, useEffect, useRef } from 'react';
import {
  Briefcase,
  Plus,
  Edit3,
  Trash2,
  Upload,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  ArrowUpDown,
  Sparkles,
  Plane,
  FileText,
  ShieldCheck,
  Building,
  Users,
  Compass,
} from 'lucide-react';
import { api, SiteService } from '../../services/api';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export const AdminServicesEditor: React.FC = () => {
  const { refreshSettings, settings } = useSiteSettings();
  const [services, setServices] = useState<SiteService[]>([]);
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Partial<SiteService> | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminServices();
      setServices(res.services || []);
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingService({
      title: '',
      description: '',
      category: 'عام',
      icon: 'star',
      image: '/assets/slides/10-all-services.webp',
      active: true,
      sortOrder: services.length + 1,
      featured: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (service: SiteService) => {
    setEditingService({ ...service });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService?.title) return;

    setSaving(true);
    try {
      if (editingService.id) {
        await api.updateService(editingService.id, editingService);
        setFeedback('تم تحديث الخدمة بنجاح');
      } else {
        await api.createService(editingService);
        setFeedback('تم إضافة الخدمة الجديدة بنجاح');
      }
      setModalOpen(false);
      setEditingService(null);
      await loadServices();
      await refreshSettings();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to save service:', err);
      setFeedback('حدث خطأ أثناء حفظ الخدمة');
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteService(id);
      await loadServices();
      await refreshSettings();
      setFeedback('تم حذف الخدمة');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error('Failed to delete service:', err);
    }
  };

  const updateVisibility = async (operation: () => Promise<unknown>, visible: boolean) => {
    setSaving(true);
    setFeedback(null);
    try {
      await operation();
      await Promise.all([loadServices(), refreshSettings()]);
      setFeedback(visible ? 'تم الإظهار على الموقع.' : 'تم الإخفاء من الموقع.');
    } catch {
      setFeedback('تعذّر تغيير الظهور. حاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingService) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setEditingService({
        ...editingService,
        image: uploadEvent.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const listedServices = services.filter((service) => {
    const visible = service.active !== false;
    return (visibilityFilter === 'all' || visible === (visibilityFilter === 'visible'))
      && service.title.toLowerCase().includes(search.trim().toLowerCase());
  });

  if (loading) {
    return <div className="p-8 text-center text-slate-500">جارٍ تحميل الخدمات...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 p-5 rounded-2xl text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-400" />
            <span>ظهور الأقسام والخدمات</span>
          </h2>
          <p className="text-xs text-blue-200/80 mt-0.5">
            أظهر أو أخفِ أقسام الصفحة الرئيسية وخدماتها، وعدّل المحتوى من نفس المكان.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg hover:shadow-amber-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ إضافة خدمة جديدة</span>
        </button>
      </div>

      <section className="rounded-2xl border border-[#D7E7F7] bg-white p-4 sm:p-5">
        <h3 className="mb-3 font-bold text-[#0B2E57]">أقسام الصفحة الرئيسية</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {Object.entries(homepageSections).map(([id, title]) => {
            const visible = !settings.hiddenSections?.includes(id as HomepageSection);
            return <li key={id} className="flex items-center justify-between gap-2 rounded-xl border border-[#D7E7F7] p-3 text-sm">
              <span>{title}<span className="block text-xs text-slate-600">{visible ? 'ظاهر' : 'مخفي'}</span></span>
              <button type="button" disabled={saving}
                aria-label={`${visible ? 'إخفاء' : 'إظهار'} قسم ${title}`}
                onClick={() => void updateVisibility(() => api.request(`/admin/settings/sections/${id}`, {
                  method: 'PATCH', body: JSON.stringify({ visible: !visible }),
                }), !visible)}
                className="flex items-center gap-2 rounded-lg bg-[#EAF4FF] px-3 py-2 font-bold text-[#0B2E57] disabled:opacity-50">
                {visible ? <EyeOff size={16} /> : <Eye size={16} />}{visible ? 'إخفاء' : 'إظهار'}
              </button>
            </li>;
          })}
        </ul>
      </section>
      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm font-bold text-[#0B2E57]">البحث عن خدمة
          <input value={search} onChange={(event) => setSearch(event.target.value)}
            className="rounded-lg border border-[#D7E7F7] bg-white px-3 py-2" />
        </label>
        <label className="grid gap-1 text-sm font-bold text-[#0B2E57]">ظهور الخدمة
          <select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value as typeof visibilityFilter)}
            className="rounded-lg border border-[#D7E7F7] bg-white px-3 py-2">
            <option value="all">الكل</option>
            <option value="visible">ظاهرة</option>
            <option value="hidden">مخفية</option>
          </select>
        </label>
      </div>
      {!listedServices.length && <p className="text-sm text-slate-600">لا توجد خدمات تطابق الفلتر.</p>}
      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {listedServices.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-slate-200 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white text-[11px] font-bold backdrop-blur-sm">
                  {service.category}
                </span>
                {service.featured && (
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold shadow">
                    مميزة
                  </span>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">{service.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                  {service.description}
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-600 font-bold">{service.active === false ? 'مخفية' : 'ظاهرة'} · الترتيب: {service.sortOrder}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button" disabled={saving}
                  aria-label={`${service.active !== false ? 'إخفاء' : 'إظهار'} خدمة ${service.title}`}
                  onClick={() => void updateVisibility(() => api.updateService(service.id, { active: service.active === false }), service.active === false)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#EAF4FF] px-2 py-1.5 text-xs font-bold text-[#0B2E57] disabled:opacity-50"
                >
                  {service.active !== false ? <EyeOff size={15} /> : <Eye size={15} />}
                  {service.active !== false ? 'إخفاء' : 'إظهار'}
                </button>
                <button
                  type="button"
                  onClick={() => handleEdit(service)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="تعديل الخدمة"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(service.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="حذف الخدمة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Create Service Modal with Split-Screen Device Preview */}
      {modalOpen && editingService && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">
                {editingService.id ? 'تعديل الخدمة ورفع الصور' : 'إضافة خدمة جديدة إلى الموقع'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-blue-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Split-Screen Form + Preview */}
            <div className="flex-1 p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Form Column (7 Cols) */}
              <form onSubmit={handleSave} className="md:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الخدمة *</label>
                  <input
                    type="text"
                    required
                    value={editingService.title || ''}
                    onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                    placeholder="مثال: حجز مواعيد القنصلية المغربية"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">القسم / التصنيف</label>
                    <select
                      value={editingService.category || 'عام'}
                      onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    >
                      <option value="قنصلي">مواعيد قنصلية</option>
                      <option value="طيران">سفر وطيران</option>
                      <option value="سياحة">سياحة وفنادق</option>
                      <option value="إقامات">إقامات وتأشيرات</option>
                      <option value="قانوني">ترجمة محلفة ونوتير</option>
                      <option value="عام">عام واستشارات</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ترتيب الظهور</label>
                    <input
                      type="number"
                      value={editingService.sortOrder || 1}
                      onChange={(e) =>
                        setEditingService({ ...editingService, sortOrder: parseInt(e.target.value, 10) })
                      }
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الوصف التفصيلي للخدمة *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={editingService.description || ''}
                    onChange={(e) =>
                      setEditingService({ ...editingService, description: e.target.value })
                    }
                    placeholder="اكتب تفاصيل الخدمة والخطوات التي يستفيد منها العميل..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white resize-none"
                  />
                </div>

                {/* Real Device Image Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    صورة الخدمة (رفع من الجهاز مع معاينة حية)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>اختيار صورة من جهازك</span>
                    </button>
                    <span className="text-[11px] text-slate-400 truncate">
                      {editingService.image?.substring(0, 30)}...
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingService.featured}
                      onChange={(e) =>
                        setEditingService({ ...editingService, featured: e.target.checked })
                      }
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span>إظهار في القسم الرئيسي المميز</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition-all"
                  >
                    {saving ? 'جارٍ الحفظ...' : 'حفظ الخدمة'}
                  </button>
                </div>
              </form>

              {/* Live Preview Column (5 Cols) */}
              <div className="md:col-span-5 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      معاينة البطاقة على الموقع
                    </span>
                    <span className="text-[10px] text-slate-400">Desktop / Mobile</span>
                  </div>

                  <div className="bg-white rounded-2xl overflow-hidden shadow border border-slate-200">
                    <div className="relative h-40 bg-slate-200">
                      <img
                        src={editingService.image || '/assets/slides/10-all-services.webp'}
                        alt="معاينة"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-bold">
                        {editingService.category || 'عام'}
                      </span>
                    </div>

                    <div className="p-3">
                      <h4 className="font-bold text-slate-900 text-xs mb-1">
                        {editingService.title || 'عنوان الخدمة'}
                      </h4>
                      <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed mb-3">
                        {editingService.description || 'وصف تفصيلي يظهر للزوار...'}
                      </p>

                      <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl text-[10px] font-bold text-center border border-emerald-200">
                        🟢 طلب عبر واتساب (0552 267 7851)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-center mt-3">
                  تأكد من وضوح الصورة وتناسقها مع أبعاد بطاقات الموقع.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
