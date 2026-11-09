import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Globe2,
  Share2,
  Image as ImageIcon,
  Save,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileText,
  ExternalLink,
  Tag,
  X,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { api, PageSeoItem, MediaAsset, BlogPost } from '../../services/api';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export const AdminSeoManager: React.FC = () => {
  const { refreshSettings } = useSiteSettings();
  const [seoPages, setSeoPages] = useState<PageSeoItem[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageSeoItem | null>(null);
  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPagePath, setNewPagePath] = useState('');
  const [newPageNameAr, setNewPageNameAr] = useState('');
  const [newKeywordInput, setNewKeywordInput] = useState('');
  const [previewTab, setPreviewTab] = useState<'google' | 'social'>('google');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [seoRes, mediaRes, postsRes] = await Promise.all([
        api.getSeoPages().catch(() => ({ seoPages: [] })),
        api.getMedia().catch(() => ({ media: [] })),
        api.getAdminPosts().catch(() => ({ posts: [] })),
      ]);

      const pages = seoRes.seoPages || [];
      setSeoPages(pages);
      if (pages.length > 0 && !selectedPage) {
        setSelectedPage(pages[0]);
      }
      setMediaList(mediaRes.media || []);
      setBlogPosts(postsRes.posts || []);
    } catch (err) {
      console.error('Failed to load SEO pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) return;

    setSaving(true);
    try {
      const res = await api.updateSeoPage(selectedPage.id, selectedPage);
      if (res.seoPages) {
        setSeoPages(res.seoPages);
      }
      if (res.seoPage) {
        setSelectedPage(res.seoPage);
      }
      await refreshSettings();
      showToast('تم حفظ وتحديث إعدادات السيو والميتا وصورة المشاركة بنجاح دون المساس بالكود!');
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء حفظ إعدادات السيو', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPagePath.trim() || !newPageNameAr.trim()) return;

    const cleanPath = newPagePath.trim().startsWith('/') ? newPagePath.trim() : `/${newPagePath.trim()}`;
    setSaving(true);
    try {
      const res = await api.createSeoPage({
        pagePath: cleanPath,
        pageNameAr: newPageNameAr.trim(),
        metaTitle: `${newPageNameAr.trim()} | ELFAZNI SERVICES`,
        metaDescription: 'خدمات ELFAZNI SERVICES للجالية المغربية في تركيا: مواعيد قنصلية، طيران، إقامات، وترجمة محلفة.',
        metaKeywords: 'ELFAZNI SERVICES, خدمات الجالية المغربية في تركيا, رشيد الفزني',
        ogTitle: `${newPageNameAr.trim()} | ELFAZNI SERVICES`,
        ogDescription: 'خدمات ELFAZNI SERVICES للجالية المغربية في تركيا بإشراف رشيد الفزني.',
        ogImage: '/assets/slides/10-all-services.webp',
        canonicalUrl: `https://elfazni.com${cleanPath}`,
        robots: 'index, follow',
      });
      if (res.seoPages) setSeoPages(res.seoPages);
      if (res.seoPage) setSelectedPage(res.seoPage);
      setShowNewPageModal(false);
      setNewPagePath('');
      setNewPageNameAr('');
      await refreshSettings();
      showToast('تمت إضافة الصفحة الجديدة لإدارة السيو بنجاح');
    } catch (err: any) {
      showToast(err.message || 'تعذر إنشاء صفحة السيو', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickAddBlogPostSeo = async (post: BlogPost) => {
    const targetPath = `/blog/${post.slug}`;
    const existing = seoPages.find((p) => p.pagePath === targetPath);
    if (existing) {
      setSelectedPage(existing);
      return;
    }

    try {
      const res = await api.createSeoPage({
        pagePath: targetPath,
        pageNameAr: `مقال: ${post.title}`,
        metaTitle: post.seoTitle || `${post.title} | ELFAZNI SERVICES`,
        metaDescription: post.seoDescription || post.excerpt,
        metaKeywords: (post.tags || []).join(', ') || 'ELFAZNI SERVICES, مدونة الجالية المغربية في تركيا',
        ogTitle: post.seoTitle || post.title,
        ogDescription: post.seoDescription || post.excerpt,
        ogImage: post.coverImage || '/assets/slides/10-all-services.webp',
        canonicalUrl: `https://elfazni.com${targetPath}`,
        robots: 'index, follow',
      });
      if (res.seoPages) setSeoPages(res.seoPages);
      if (res.seoPage) setSelectedPage(res.seoPage);
      await refreshSettings();
      showToast(`تم ربط إعدادات السيو للمقال "${post.title}"`);
    } catch (err: any) {
      showToast('فشل ربط المقال بإعدادات السيو', 'error');
    }
  };

  const handleDeletePage = async (id: string) => {
    if (['seo_home', 'seo_blog', 'seo_services', 'seo_contact'].includes(id)) {
      showToast('لا يمكن حذف الصفحات الأساسية للموقع، يمكنك تعديل بياناتها فقط', 'error');
      return;
    }
    try {
      const res = await api.deleteSeoPage(id);
      if (res.seoPages) {
        setSeoPages(res.seoPages);
        setSelectedPage(res.seoPages[0] || null);
      }
      await refreshSettings();
      showToast('تم حذف إعدادات السيو للصفحة المحددة');
    } catch (err) {
      showToast('فشل حذف الصفحة', 'error');
    }
  };

  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPage) return;

    setUploadingImage(true);
    try {
      const res = await api.uploadMedia(file, selectedPage.metaTitle);
      if (res.asset?.url) {
        setSelectedPage({ ...selectedPage, ogImage: res.asset.url });
        setMediaList((prev) => [res.asset, ...prev]);
        showToast('تم رفع صورة OpenGraph بنجاح، اضغط "حفظ التعديلات" لتطبيقها');
      }
    } catch (err: any) {
      // Fallback to DataURL if upload fails
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedPage({ ...selectedPage, ogImage: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingImage(false);
    }
  };

  const keywordsArray = selectedPage?.metaKeywords
    ? selectedPage.metaKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  const handleAddKeywordChip = () => {
    if (!newKeywordInput.trim() || !selectedPage) return;
    const updated = Array.from(new Set([...keywordsArray, newKeywordInput.trim()])).join(', ');
    setSelectedPage({ ...selectedPage, metaKeywords: updated });
    setNewKeywordInput('');
  };

  const handleRemoveKeywordChip = (kw: string) => {
    if (!selectedPage) return;
    const updated = keywordsArray.filter((k) => k !== kw).join(', ');
    setSelectedPage({ ...selectedPage, metaKeywords: updated });
  };

  // Compute SEO Health Score (0 - 100)
  const calculateSeoScore = (page: PageSeoItem | null): { score: number; tips: string[] } => {
    if (!page) return { score: 0, tips: [] };
    let score = 0;
    const tips: string[] = [];

    const titleLen = (page.metaTitle || '').length;
    if (titleLen >= 30 && titleLen <= 65) {
      score += 25;
    } else if (titleLen > 0) {
      score += 15;
      tips.push('يفضل أن يكون طول عنوان الصفحة (Meta Title) بين 30 و 65 حرفاً.');
    } else {
      tips.push('يرجى إضافة عنوان للصفحة (Meta Title).');
    }

    const descLen = (page.metaDescription || '').length;
    if (descLen >= 100 && descLen <= 170) {
      score += 25;
    } else if (descLen > 0) {
      score += 15;
      tips.push('يفضل أن يكون طول الوصف (Meta Description) بين 100 و 160 حرفاً لظهور مثالي في جوجل.');
    } else {
      tips.push('يرجى كتابة وصف الميتا (Meta Description).');
    }

    if (keywordsArray.length >= 4) {
      score += 25;
    } else if (keywordsArray.length > 0) {
      score += 12;
      tips.push('أضف 4 كلمات مفتاحية أو أكثر لزيادة فرص الظهور في البحث.');
    } else {
      tips.push('أضف كلمات مفتاحية (Keywords) مرتبطة بالصفحة.');
    }

    if (page.ogImage && page.ogTitle && page.ogDescription) {
      score += 25;
    } else {
      score += 10;
      tips.push('تأكد من تحديد صورة وعنوان ووصف OpenGraph لبطاقات واتساب وفيسبوك.');
    }

    return { score, tips };
  };

  const { score: seoScore, tips: seoTips } = calculateSeoScore(selectedPage);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center min-h-[360px]">
        <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin ml-3" />
        <span>جارٍ تحميل وحدة إدارة السيو والميتا (SEO & Meta Management)...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#0E4B87] via-[#0B2E57] to-[#004AA5] p-5 rounded-2xl text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-400" />
            <span>إدارة السيو والميتا وصور المشاركة (SEO & Meta Management)</span>
          </h2>
          <p className="text-xs text-blue-100/85 mt-1">
            تحكم في عناوين الصفحات، وصف الميتا (meta-description)، الكلمات المفتاحية، وصور المشاركة الاجتماعية (OpenGraph) لكل صفحة دون تعديل ملف index.html
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowNewPageModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all border border-white/20"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مسار صفحة</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !selectedPage}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جارٍ الحفظ...' : 'حفظ وتطبيق فوراً'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-bold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 12-Col Layout: Pages Sidebar (4 cols) + Editor & Live Preview (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left/Right Sidebar: Pages Selector & Blog Posts Quick Bind */}
        <div className="lg:col-span-4 space-y-5">
          {/* Managed Pages Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-blue-600" />
                <span>صفحات الموقع المفعّلة ({seoPages.length})</span>
              </h3>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {seoPages.map((page) => {
                const isSelected = selectedPage?.id === page.id;
                const isCore = ['seo_home', 'seo_blog', 'seo_services', 'seo_contact'].includes(page.id);
                return (
                  <div
                    key={page.id}
                    onClick={() => setSelectedPage(page)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-600 shadow-xs'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/80'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">{page.pageNameAr}</div>
                      <div className="text-[11px] font-mono text-blue-700 mt-0.5 truncate" dir="ltr">
                        {page.pagePath}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-1">{page.metaTitle}</div>
                    </div>

                    {!isCore && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(page.id);
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg"
                        title="حذف الصفحة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Blog Post SEO Selector */}
          {blogPosts.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>تخصيص سيو مقالات المدونة</span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                اضغط على أي مقال لتخصيص عنوانه ووصفه وصورة OpenGraph الخاصة به:
              </p>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {blogPosts.map((post) => {
                  const targetPath = `/blog/${post.slug}`;
                  const isConfigured = seoPages.some((p) => p.pagePath === targetPath);
                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => handleQuickAddBlogPostSeo(post)}
                      className="w-full text-right p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 transition-colors flex items-center justify-between gap-2"
                    >
                      <span className="text-xs font-semibold text-slate-800 truncate">{post.title}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                          isConfigured
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isConfigured ? 'تعديل السيو' : '+ تفعيل'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEO Health Score Card */}
          {selectedPage && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  مؤشر جودة السيو للصفحة (SEO Score)
                </span>
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-full tabular-nums ${
                    seoScore >= 80
                      ? 'bg-emerald-100 text-emerald-800'
                      : seoScore >= 50
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {seoScore}%
                </span>
              </div>

              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    seoScore >= 80 ? 'bg-emerald-500' : seoScore >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${seoScore}%` }}
                />
              </div>

              {seoTips.length > 0 ? (
                <ul className="space-y-1 text-[11px] text-slate-600 list-disc pr-4">
                  {seoTips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-emerald-700 font-semibold">
                  ممتاز! جميع عناصر السيو والميتا وبطاقة المشاركة مكتملة ومثالية لهذه الصفحة.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right/Main Area: Editor Form + Live Google SERP & Social Card Previews */}
        {selectedPage && (
          <div className="lg:col-span-8 space-y-6">
            {/* Live Preview Box (Google Search & WhatsApp/Facebook OpenGraph Card) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    معاينة حية ومباشرة (Google Search & Social OpenGraph Preview)
                  </h3>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPreviewTab('google')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      previewTab === 'google' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    🔍 نتيجة بحث Google
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab('social')}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      previewTab === 'social' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    📱 بطاقة واتساب وفيسبوك (OpenGraph)
                  </button>
                </div>
              </div>

              {previewTab === 'google' ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5 text-right">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-blue-800">
                      E
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-xs">ELFAZNI SERVICES</div>
                      <div className="text-[11px] text-emerald-700 font-mono truncate max-w-md" dir="ltr">
                        {selectedPage.canonicalUrl || `https://elfazni-services.com${selectedPage.pagePath}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-[#1a0dab] hover:underline cursor-pointer leading-snug pt-1">
                    {selectedPage.metaTitle || 'عنوان الصفحة في نتائج بحث جوجل'}
                  </div>
                  <p className="text-xs sm:text-sm text-[#4d5156] leading-relaxed line-clamp-2">
                    {selectedPage.metaDescription || 'وصف الميتا (Meta Description) الذي يظهر أسفل الرابط في محرك البحث جوجل...'}
                  </p>
                </div>
              ) : (
                <div className="max-w-md mx-auto rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                  <div className="h-48 bg-slate-100 relative overflow-hidden">
                    <img
                      src={selectedPage.ogImage || '/assets/slides/10-all-services.webp'}
                      alt={selectedPage.ogTitle || selectedPage.metaTitle}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-slate-900/75 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                      معاينة OpenGraph (1200×630)
                    </span>
                  </div>
                  <div className="p-3.5 bg-[#F0F2F5] border-t border-slate-200 space-y-1">
                    <div className="text-[10px] font-mono uppercase text-slate-500" dir="ltr">
                      ELFAZNI-SERVICES.COM
                    </div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                      {selectedPage.ogTitle || selectedPage.metaTitle}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {selectedPage.ogDescription || selectedPage.metaDescription}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* SEO & Meta Fields Form */}
            <form onSubmit={handleSave} className="space-y-6">
              {/* 1. Search Engine Meta Tags */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-800 text-sm">
                      1. بيانات محركات البحث الأساسية (Meta Title, Description & Keywords)
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg" dir="ltr">
                    {selectedPage.pagePath}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اسم الصفحة التعريفي (في اللوحة)
                    </label>
                    <input
                      type="text"
                      value={selectedPage.pageNameAr}
                      onChange={(e) => setSelectedPage({ ...selectedPage, pageNameAr: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      حالة الفهرسة في جوجل (Robots Meta)
                    </label>
                    <select
                      value={selectedPage.robots || 'index, follow'}
                      onChange={(e) => setSelectedPage({ ...selectedPage, robots: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      dir="ltr"
                    >
                      <option value="index, follow">index, follow (مسموح بالظهور والأرشفة)</option>
                      <option value="noindex, follow">noindex, follow (إخفاء الصفحة من البحث)</option>
                      <option value="noindex, nofollow">noindex, nofollow (عدم الأرشفة الكامل)</option>
                    </select>
                  </div>
                </div>

                {/* Meta Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      عنوان الصفحة في المتصفح وجوجل (Page Title / Meta Title) *
                    </label>
                    <span
                      className={`text-[11px] font-bold tabular-nums ${
                        selectedPage.metaTitle.length > 65 ? 'text-amber-600' : 'text-slate-400'
                      }`}
                    >
                      {selectedPage.metaTitle.length} / 60 حرف
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={selectedPage.metaTitle}
                    onChange={(e) => setSelectedPage({ ...selectedPage, metaTitle: e.target.value })}
                    placeholder="مثال: ELFAZNI SERVICES | خدمات الجالية المغربية في تركيا"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                  />
                </div>

                {/* Meta Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      وصف الصفحة في محركات البحث (Meta Description) *
                    </label>
                    <span
                      className={`text-[11px] font-bold tabular-nums ${
                        selectedPage.metaDescription.length > 165 ? 'text-amber-600' : 'text-slate-400'
                      }`}
                    >
                      {selectedPage.metaDescription.length} / 160 حرف
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={selectedPage.metaDescription}
                    onChange={(e) => setSelectedPage({ ...selectedPage, metaDescription: e.target.value })}
                    placeholder="اكتب وصفاً جذاباً ومختصراً يظهر تحت اسم الموقع في نتائج بحث جوجل..."
                    className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                  />
                </div>

                {/* Meta Keywords */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الكلمات المفتاحية والدلالية (Meta Keywords)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newKeywordInput}
                      onChange={(e) => setNewKeywordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddKeywordChip();
                        }
                      }}
                      placeholder="اكتب كلمة مفتاحية واضغط إضافة أو Enter..."
                      className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddKeywordChip}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shrink-0"
                    >
                      + إضافة كلمة
                    </button>
                  </div>

                  {/* Keywords Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {keywordsArray.map((kw, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold"
                      >
                        <Tag className="w-3 h-3 text-blue-500" />
                        <span>{kw}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeywordChip(kw)}
                          className="text-blue-400 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={selectedPage.metaKeywords}
                    onChange={(e) => setSelectedPage({ ...selectedPage, metaKeywords: e.target.value })}
                    placeholder="كلمات مفتاحية مفصولة بفاصلة (,)"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600"
                  />
                </div>

                {/* Canonical URL */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الرابط الأساسي المعتمد (Canonical URL)
                  </label>
                  <input
                    type="text"
                    value={selectedPage.canonicalUrl}
                    onChange={(e) => setSelectedPage({ ...selectedPage, canonicalUrl: e.target.value })}
                    dir="ltr"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* 2. OpenGraph & Social Sharing Image Card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-slate-800 text-sm">
                      2. إعدادات المشاركة الاجتماعية وصورة OpenGraph (واتساب، فيسبوك، تويتر)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPage({
                        ...selectedPage,
                        ogTitle: selectedPage.metaTitle,
                        ogDescription: selectedPage.metaDescription,
                      })
                    }
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    نسخ العنوان والوصف من إعدادات البحث
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      عنوان بطاقة المشاركة (og:title)
                    </label>
                    <input
                      type="text"
                      value={selectedPage.ogTitle}
                      onChange={(e) => setSelectedPage({ ...selectedPage, ogTitle: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رابط صورة المشاركة (og:image URL)
                    </label>
                    <input
                      type="text"
                      value={selectedPage.ogImage}
                      onChange={(e) => setSelectedPage({ ...selectedPage, ogImage: e.target.value })}
                      dir="ltr"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    وصف بطاقة المشاركة (og:description)
                  </label>
                  <textarea
                    rows={2}
                    value={selectedPage.ogDescription}
                    onChange={(e) => setSelectedPage({ ...selectedPage, ogDescription: e.target.value })}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* OpenGraph Image Uploader & Media Library Selector */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                  <img
                    src={selectedPage.ogImage || '/assets/slides/10-all-services.webp'}
                    alt="OpenGraph Preview"
                    className="w-36 h-24 rounded-xl object-cover border border-slate-300 shadow-xs shrink-0 bg-white"
                  />
                  <div className="flex-1 space-y-2 text-center sm:text-right">
                    <div className="text-xs font-bold text-slate-800">
                      تغيير صورة الظهور عند مشاركة الرابط (OpenGraph Image)
                    </div>
                    <p className="text-[11px] text-slate-500">
                      اختر صورة من جهازك مباشرة أو من مكتبة وسائط الموقع لتظهر عند إرسال رابط هذه الصفحة في واتساب أو فيسبوك.
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleOgImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingImage ? 'جارٍ الرفع...' : 'رفع صورة من جهازك'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowMediaModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-colors"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                        <span>اختيار من مكتبة الوسائط</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#004AA5] to-[#0B2E57] hover:from-[#053d82] hover:to-[#0B2E57] text-white font-black text-xs sm:text-sm shadow-lg transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'جارٍ الحفظ...' : 'حفظ وتحديث بيانات السيو لهذه الصفحة'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Media Library Picker Modal */}
      {showMediaModal && selectedPage && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">اختيار صورة OpenGraph من مكتبة الوسائط</h3>
              <button
                type="button"
                onClick={() => setShowMediaModal(false)}
                className="p-1 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {mediaList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedPage({ ...selectedPage, ogImage: item.url });
                    setShowMediaModal(false);
                  }}
                  className="group cursor-pointer rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-600 transition-all bg-slate-50"
                >
                  <img src={item.url} alt={item.altText} className="w-full h-28 object-cover" />
                  <div className="p-2 text-[11px] font-semibold text-slate-700 truncate">
                    {item.originalName || item.altText}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Custom Page SEO Modal */}
      {showNewPageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 bg-gradient-to-r from-[#0E4B87] to-[#004AA5] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">إضافة مسار صفحة جديدة لإدارة السيو</h3>
              <button
                type="button"
                onClick={() => setShowNewPageModal(false)}
                className="p-1 text-blue-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePage} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الصفحة بالعربية *
                </label>
                <input
                  type="text"
                  required
                  value={newPageNameAr}
                  onChange={(e) => setNewPageNameAr(e.target.value)}
                  placeholder="مثال: صفحة الأسئلة الشائعة أو قسم المؤسس"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مسار الرابط (Page Path) *
                </label>
                <input
                  type="text"
                  required
                  value={newPagePath}
                  onChange={(e) => setNewPagePath(e.target.value)}
                  placeholder="/#faq أو /blog/my-article"
                  dir="ltr"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPageModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  إضافة الصفحة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
