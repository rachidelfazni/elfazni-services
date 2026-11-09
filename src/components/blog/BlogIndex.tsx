import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, Clock, Eye, ArrowLeft, ArrowRight, Sparkles, BookOpen, ChevronRight, Tag, X } from 'lucide-react';
import { api, BlogPost, BlogCategory } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { SITE_CONTACT } from '../../data/content';
import { WhatsAppLogo } from '../WhatsAppLogo';

interface BlogIndexProps {
  onNavigate: (path: string) => void;
}

export const BlogIndex: React.FC<BlogIndexProps> = ({ onNavigate }) => {
  const { isRtl, language, t } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeLang, setActiveLang] = useState<'all' | 'ar' | 'en' | 'fr'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  /** Search query committed by submit/clear — drives refetching without reloading on every keystroke. */
  const [committedSearch, setCommittedSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadData();
  }, [activeCategory, activeLang, committedSearch]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [catsRes, postsRes] = await Promise.all([
        api.getCategories(),
        api.getPosts(
          activeCategory === 'all' ? undefined : activeCategory,
          committedSearch || undefined,
          undefined,
          activeLang === 'all' ? undefined : activeLang
        ),
      ]);
      setCategories(catsRes.categories || []);
      setPosts(postsRes.posts || []);
    } catch (err) {
      console.error('Failed to load blog posts:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeLang, committedSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCommittedSearch(searchQuery.trim());
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCommittedSearch('');
  };

  const resetFilters = () => {
    if (activeCategory !== 'all') setActiveCategory('all');
    if (activeLang !== 'all') setActiveLang('all');
    if (committedSearch !== '') clearSearch();
    // If state didn't change (already clean), force a reload directly.
    if (activeCategory === 'all' && activeLang === 'all' && committedSearch === '') loadData();
  };

  const featuredPost = posts.find((p) => p.featured) || posts[0];
  const regularPosts = featuredPost ? posts.filter((p) => p.id !== featuredPost.id) : posts;

  const getCategoryName = (slug: string) => {
    const cat = categories.find((c) => c.slug === slug);
    if (!cat) return slug;
    if (language === 'en' && cat.nameEn) return cat.nameEn;
    if (language === 'fr' && cat.nameFr) return cat.nameFr;
    return cat.name;
  };

  // Localized date formatting per interface language (Arabic uses long form).
  const locale = language === 'ar' ? 'ar-EG' : language === 'tr' ? 'tr-TR' : language === 'fr' ? 'fr-FR' : 'en-US';
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(locale === 'ar-EG' ? 'ar-EG' : locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-[#0B2E57]">
      {/* Hero Header */}
      <section className="relative pt-28 pb-16 bg-gradient-to-b from-[#0B2E57] via-[#004AA5] to-[#0B2E57] text-white overflow-hidden">
        {/* Soft atmospheric gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-blue-200 mb-6">
            <button
              onClick={() => onNavigate('/')}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            >
{t('الرئيسية')}
            </button>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180 text-blue-300" />
            <span className="text-white font-bold">{t('المدونة والمقالات')}</span>
          </nav>

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/20 text-[#E3C88F] text-xs sm:text-sm font-bold">
              <BookOpen className="w-4 h-4 text-[#E3C88F]" />
              <span>{t('دليل ومعلومات الجالية المغربية بتركيا')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              {t('مدونة')} <span className="text-[#E3C88F]">ELFAZNI SERVICES</span>
            </h1>

            <p className="text-base sm:text-lg text-blue-100 font-medium leading-relaxed">
              {t('مقالات إرشادية وتوجيهية شاملة حول المواعيد القنصلية، الأوراق المدنية، الإقامة في تركيا، وتفاصيل السفر والطيران الموثقة خطوة بخطوة.')}
            </p>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="mt-8 max-w-xl">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('ابحث عن موضوع، موعد قنصلي، إقامة، أو شهادة عزوبية...')}
                aria-label={t('بحث في المدونة')}
                className="w-full px-5 py-4 pe-24 rounded-2xl bg-white/95 text-slate-900 placeholder:text-slate-400 font-medium text-sm sm:text-base shadow-lg focus:outline-none focus:ring-2 focus:ring-[#E3C88F] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label={t('مسح البحث')}
                  className="absolute end-[4.25rem] p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                aria-label={t('بحث')}
                className="absolute end-2 p-2.5 rounded-xl bg-[#004AA5] text-white hover:bg-[#0B2E57] transition-colors cursor-pointer"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category & Language Pills Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-[#004AA5] text-white shadow-md shadow-[#004AA5]/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {t('جميع المواضيع')} ({posts.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeCategory === cat.slug
                    ? 'bg-[#004AA5] text-white shadow-md shadow-[#004AA5]/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{getCategoryName(cat.slug)}</span>
                {typeof cat.postCount === 'number' && (
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeCategory === cat.slug ? 'bg-white/20' : 'bg-slate-100'}`}>
                    {cat.postCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center rounded-xl bg-white p-1 border border-slate-200/90 shadow-2xs text-xs font-bold">
            {(
              [
                { id: 'all', label: t('كل اللغات') },
                { id: 'ar', label: 'العربية' },
                { id: 'en', label: 'EN' },
                { id: 'fr', label: 'FR' },
              ] as const
            ).map((lng) => (
              <button
                key={lng.id}
                type="button"
                onClick={() => setActiveLang(lng.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeLang === lng.id
                    ? 'bg-[#0B2E57] text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {lng.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse" aria-busy="true">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 bg-slate-200 rounded-2xl" />
            ))}
          </div>
        ) : loadError ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">{t('تعذر تحميل المقالات')}</h3>
            <p className="text-sm text-slate-500 mt-1">{t('حدث خطا أثناء الاتصال بالخدمة. حاول مرة أخرى.')}</p>
            <button
              onClick={() => loadData()}
              className="mt-4 px-4 py-2 bg-[#004AA5] text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              {t('إعادة المحاولة')}
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
            {committedSearch ? (
              <>
                <Search className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">{t('لا توجد نتائج للبحث عن')} «{committedSearch}»</h3>
                <p className="text-sm text-slate-500 mt-1">{t('تعذّر العثور على مقالات تطابق كلمة البحث. جرّب كلمات أخرى أو تصنيفاً مختلفاً، أو تصفّح كل المقالات.')}</p>
              </>
            ) : (
              <>
                <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">{t('لم يتم العثور على مقالات')}</h3>
                <p className="text-sm text-slate-500 mt-1">{t('جرب البحث بكلمات أخرى أو اختر تصنيفاً آخر.')}</p>
              </>
            )}
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-[#004AA5] text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              {t('عرض جميع المقالات')}
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Post Hero Card (Only when viewing all and has featured post) */}
            {featuredPost && activeCategory === 'all' && !committedSearch && (
              <div
                onClick={() => onNavigate(`/blog/${featuredPost.slug}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onNavigate(`/blog/${featuredPost.slug}`);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${featuredPost.title} — ${t('قراءة المقال')}`}
                className="group relative rounded-3xl bg-white border border-slate-200/90 shadow-md hover:shadow-2xl hover:border-[#004AA5]/40 transition-all duration-300 overflow-hidden cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#004AA5] grid grid-cols-1 lg:grid-cols-12 gap-0"
              >
                <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-full min-h-full overflow-hidden bg-slate-100">
                  <img
                    src={featuredPost.coverImage}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="eager"
                    onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                  />
                  <div className="absolute top-4 start-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#CC9048] text-white text-xs font-bold shadow-md">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('مقال مميز')}</span>
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mb-3">
                      <span className="px-2.5 py-1 rounded-md bg-[#004AA5]/10 text-[#004AA5] font-bold">
                        {getCategoryName(featuredPost.category)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {featuredPost.readTime}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-[#0B2E57] leading-snug group-hover:text-[#004AA5] transition-colors mb-3">
                      {featuredPost.title}
                    </h2>

                    <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#004AA5] text-white flex items-center justify-center text-xs font-bold">
                        RF
                      </div>
                      <span className="text-xs font-bold text-slate-700">{featuredPost.author}</span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#004AA5] group-hover:text-[#CC9048] transition-colors">
                      <span>{t('قراءة المقال')}</span>
                      {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Articles Grid */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-[#0B2E57]">
                  {activeCategory === 'all' && !committedSearch ? t('أحدث المقالات المنشورة') : t('نتائج المقالات')}
                </h3>
                <span className="text-xs text-slate-500 font-semibold shrink-0">{posts.length} {t('مقال')}</span>
              </div>
              {committedSearch && (
                <p className="-mt-4 mb-6 text-xs sm:text-sm text-slate-500 font-medium" aria-live="polite">
                  {t('نتائج البحث عن:')} <span className="font-bold text-[#004AA5]">«{committedSearch}»</span>
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 blog-modern-grid">
                {(activeCategory === 'all' && !committedSearch ? regularPosts : posts).map((post) => (
                  <article
                    key={post.id}
                    onClick={() => onNavigate(`/blog/${post.slug}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onNavigate(`/blog/${post.slug}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${post.title} — ${t('اقرأ المزيد')}`}
                    className="group rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-[#004AA5]/40 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#004AA5]"
                  >
                    <div>
                      {/* Thumbnail — fixed 16:9 with object-cover and reserved space (no CLS) */}
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                        />
                        <div className="absolute top-3 start-3">
                          <span className="px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs text-[#004AA5] text-xs font-bold shadow-xs">
                            {getCategoryName(post.category)}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 sm:p-6">
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-2.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(post.publishedAt || post.createdAt)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {post.readTime}
                          </span>
                        </div>

                        <h4 className="text-base sm:text-lg font-bold text-[#0B2E57] group-hover:text-[#004AA5] transition-colors leading-snug line-clamp-2 mb-2">
                          {post.title}
                        </h4>

                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-5 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{post.views || 0} {t('مشاهدة')}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#004AA5] group-hover:text-[#CC9048] transition-colors">
                        <span>{t('اقرأ المزيد')}</span>
                        {isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Direct Assistance Banner */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-[#0B2E57] via-[#004AA5] to-[#0B2E57] text-white p-6 sm:p-10 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-start max-w-xl">
            <span className="text-xs font-bold text-[#E3C88F] tracking-wider uppercase">{t('استشارة فورية')}</span>
            <h3 className="text-xl sm:text-2xl font-black">{t('هل لديك سؤال حول أوراقك أو مواعيدك في تركيا؟')}</h3>
            <p className="text-sm text-blue-100 font-medium leading-relaxed">
              {t('تواصل مباشرة مع رشيد الفزني وفريق ELFAZNI SERVICES عبر بوابة الموقع للحصول على إرشاد شخصي ودقيق لمعاملتك.')}
            </p>
          </div>

          <a
            href="/#contact-form"
            className="shrink-0 inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#CC9048] to-[#E3C88F] hover:from-[#B37B37] hover:to-[#CC9048] text-slate-950 text-sm sm:text-base font-black shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>{t('تواصل واستفسر الآن')}</span>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </a>
        </div>
      </div>
    </div>
  );
};
