import React, { useState, useEffect } from 'react';
import '../admin/blog/blog-editor.css';
import {
  Calendar,
  Clock,
  Eye,
  ChevronRight,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Sparkles,
  FileDown,
  Globe,
  List,
} from 'lucide-react';
import { api, BlogPost, BlogLanguage } from '../../services/api';
import { tracker } from '../../services/tracker';
import { useLanguage } from '../../context/LanguageContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { WhatsAppLogo } from '../WhatsAppLogo';
import {
  ensureHtmlContent,
  sanitizeEditorHtmlClient,
  injectHeadingIdsAndExtractToc,
} from '../admin/blog/blogContentUtils';

interface BlogPostViewProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export const BlogPostView: React.FC<BlogPostViewProps> = ({ slug, onNavigate }) => {
  const { isRtl, t } = useLanguage();
  const { settings, seoPages } = useSiteSettings();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [translations, setTranslations] = useState<
    Array<{ id: string; slug: string; title: string; language: BlogLanguage }>
  >([]);
  const [isPreview, setIsPreview] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadPost();

    // Track engaged read if visitor spends more than 15 seconds reading
    const engagementTimer = setTimeout(() => {
      tracker.trackPostEngagement(slug, 'engaged_read');
    }, 15000);

    return () => clearTimeout(engagementTimer);
  }, [slug]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const cleanSlug = slug.split('?')[0];
      const wantsPreview =
        window.location.search.includes('preview=1') || slug.includes('preview=1');
      const res = await api.getPostBySlug(cleanSlug, wantsPreview);
      setPost(res.post);
      setRelated(res.related || []);
      setTranslations(res.translations || []);
      setIsPreview(Boolean(res.isPreview));

      // Update page title & meta dynamically if no explicit SEO Manager override exists
      if (res.post) {
        const customSeo = seoPages.find((p) => p.pagePath === `/blog/${cleanSlug}`);
        if (!customSeo) {
          document.title = `${res.post.seoTitle || res.post.title} | ELFAZNI SERVICES`;
          const descEl = document.head.querySelector('meta[name="description"]');
          if (descEl) descEl.setAttribute('content', res.post.seoDescription || res.post.excerpt);
          const ogTitleEl = document.head.querySelector('meta[property="og:title"]');
          if (ogTitleEl) ogTitleEl.setAttribute('content', res.post.seoTitle || res.post.title);
          const ogDescEl = document.head.querySelector('meta[property="og:description"]');
          if (ogDescEl)
            ogDescEl.setAttribute('content', res.post.seoDescription || res.post.excerpt);
          if (res.post.coverImage) {
            const origin = window.location.origin;
            const imgUrl = res.post.coverImage.startsWith('/')
              ? `${origin}${res.post.coverImage}`
              : res.post.coverImage;
            const ogImgEl = document.head.querySelector('meta[property="og:image"]');
            if (ogImgEl) ogImgEl.setAttribute('content', imgUrl);
          }
        }
        tracker.trackPage(`/blog/${cleanSlug}`, `قراءة مقال: ${res.post.title}`);
      }
    } catch (err) {
      console.error('Failed to load post:', err);
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      tracker.trackPostEngagement(slug, 'share');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const formatDate = (dateStr: string, postLang: BlogLanguage = 'ar') => {
    try {
      const date = new Date(dateStr);
      const locale = postLang === 'en' ? 'en-US' : postLang === 'fr' ? 'fr-FR' : 'ar-EG';
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFD] pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 animate-pulse space-y-6">
          <div className="h-6 w-48 bg-slate-200 rounded" />
          <div className="h-12 w-3/4 bg-slate-200 rounded" />
          <div className="h-80 w-full bg-slate-200 rounded-3xl" />
          <div className="h-32 w-full bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F8FAFD] pt-32 pb-20">
        <div className="max-w-xl mx-auto px-4 text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-slate-800">{t('المقال غير متوفر')}</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">{t('قد تم حذف هذا المقال أو تغيير رابطه.')}</p>
          <button
            onClick={() => onNavigate('/blog')}
            className="px-6 py-2.5 bg-[#004AA5] text-white rounded-xl text-sm font-bold hover:bg-[#0B2E57] transition-colors cursor-pointer"
          >
            العودة إلى المدونة
          </button>
        </div>
      </div>
    );
  }

  const postLang: BlogLanguage = post.language || 'ar';
  const isPostRtl = postLang === 'ar';
  const rawHtml = ensureHtmlContent(post.content || '');
  const sanitizedHtml = sanitizeEditorHtmlClient(rawHtml);
  const { htmlWithIds, toc } = injectHeadingIdsAndExtractToc(sanitizedHtml);

  const shareText = encodeURIComponent(`${post.title} - عبر مدونة ELFAZNI SERVICES`);
  const shareUrl = encodeURIComponent(window.location.href);

  // JSON-LD BlogPosting schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    image: post.coverImage,
    inLanguage: postLang,
    author: {
      '@type': 'Person',
      name: post.author || 'رشيد الفزني',
    },
    publisher: {
      '@type': 'Organization',
      name: 'ELFAZNI SERVICES — الفزني للخدمات',
    },
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.createdAt,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] text-[#0B2E57]" dir={isPostRtl ? 'rtl' : 'ltr'}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Admin Draft / Scheduled Preview Banner */}
      {(isPreview || post.status !== 'published') && (
        <div className="fixed top-20 inset-x-0 z-40 bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs sm:text-sm font-black shadow-md">
          👁 وضع معاينة المسودة الخاصة بالمدير — حالة المقال الحالية: ({post.status}) — غير مرئي للزوار
          العاديين حتى يتم نشره.
        </div>
      )}

      {/* Article Header & Breadcrumbs */}
      <section className="pt-28 pb-10 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-6 flex-wrap">
            <button
              onClick={() => onNavigate('/')}
              className="hover:text-[#004AA5] transition-colors cursor-pointer"
            >
              {t('الرئيسية')}
            </button>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180 text-slate-400" />
            <button
              onClick={() => onNavigate('/blog')}
              className="hover:text-[#004AA5] transition-colors cursor-pointer"
            >
              {t('المدونة')}
            </button>
            <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180 text-slate-400" />
            <span className="text-[#004AA5] font-bold truncate max-w-xs">{post.title}</span>
          </nav>

          {/* Badge & Meta */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500">
              <span className="px-3 py-1 rounded-md bg-[#004AA5]/10 text-[#004AA5] font-bold">
                {post.category}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-[#0B2E57] font-black text-xs uppercase">
                {postLang}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(post.publishedAt || post.createdAt, postLang)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {post.readTime}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                {post.views} {t('مشاهدة')}
              </span>
            </div>

            {/* Linked Translations Switcher */}
            {translations.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#004AA5]" />
                {translations.map((tr) => (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => onNavigate(`/blog/${tr.slug}`)}
                    className="px-2.5 py-1 rounded-lg bg-[#EAF4FF] hover:bg-[#004AA5] text-[#004AA5] hover:text-white text-xs font-bold uppercase transition-colors cursor-pointer"
                    title={tr.title}
                  >
                    {tr.language === 'ar'
                      ? 'العربية'
                      : tr.language === 'en'
                      ? 'English'
                      : 'Français'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0B2E57] leading-tight mb-6">
            {post.title}
          </h1>

          {/* Author Badge */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#004AA5] to-[#0B2E57] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                RF
              </div>
              <div>
                <p className="text-sm font-bold text-[#0B2E57]">{post.author}</p>
                <p className="text-xs text-slate-500 font-medium">
                  {t('مؤسس ومستشار ELFAZNI SERVICES')}
                </p>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => tracker.trackPostEngagement(slug, 'share')}
                aria-label={t('مشاركة عبر واتساب')}
                className="p-2 rounded-xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
              >
                <WhatsAppLogo className="w-4 h-4 fill-current" />
              </a>
              <button
                onClick={handleCopyLink}
                title={t('نسخ الرابط')}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">{copied ? t('تم النسخ') : t('نسخ الرابط')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Article Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Cover Image */}
        {post.coverImage && (
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-lg mb-10 bg-slate-100">
            <img
              src={post.coverImage}
              alt={post.coverImageAlt || post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Lead Excerpt */}
        {post.excerpt && (
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs mb-8 text-base sm:text-lg text-slate-700 font-medium leading-relaxed border-s-4 border-[#004AA5]">
            {post.excerpt}
          </div>
        )}

        {/* Automatic Table of Contents (When 2+ H2/H3 Headings exist) */}
        {toc.length >= 2 && (
          <nav
            aria-label="جدول محتويات المقال"
            className="mb-8 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs"
          >
            <div className="flex items-center gap-2 font-black text-sm text-[#0B2E57] mb-3">
              <List className="w-4 h-4 text-[#004AA5]" />
              <span>
                {postLang === 'en'
                  ? 'Table of Contents'
                  : postLang === 'fr'
                  ? 'Sommaire'
                  : 'محتويات المقال'}
              </span>
            </div>
            <ul className="space-y-1.5 text-xs sm:text-sm">
              {toc.map((item) => (
                <li key={item.id} className={item.level === 3 ? 'ps-5' : ''}>
                  <a
                    href={`#${item.id}`}
                    className="text-slate-600 hover:text-[#004AA5] font-semibold transition-colors"
                  >
                    • {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Branded PDF download banner (shown when the post ships a guide file) */}
        {post.pdfUrl && (
          <a
            href={post.pdfUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="group mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-l from-[#0B2E57] via-[#004AA5] to-[#0B2E57] text-white p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-[#004AA5]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#CC9048]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <FileDown className="w-6 h-6 sm:w-7 sm:h-7 text-[#E3C88F]" />
              </div>
              <div>
                <p className="text-sm sm:text-base font-black">
                  {t('📄 حمّل النسخة الرسمية — دليل PDF كامل (عربي / تركي)')}
                </p>
                <p className="text-xs sm:text-sm text-blue-100 font-semibold mt-1">
                  {t(
                    'دليل الأوراق القنصلية في القنصلية المغربية بتركيا — Fas Konsolosluğu Evrak Rehberi'
                  )}
                </p>
              </div>
            </div>
            <span className="shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#E3C88F] text-[#0B2E57] text-sm font-black group-hover:bg-white transition-colors">
              <FileDown className="w-4 h-4" />
              <span>{t('تحميل PDF')}</span>
            </span>
          </a>
        )}

        {/* Rendered Rich Content */}
        <article
          dir={isPostRtl ? 'rtl' : 'ltr'}
          className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xs elfazni-rich-content max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlWithIds }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500">{t('الكلمات الدلالية:')}</span>
            {post.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* WhatsApp Direct Help CTA */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-[#0B2E57] via-[#004AA5] to-[#0B2E57] text-white p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-start">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E3C88F]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('مرافقة ومساعدة شخصية')}</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black">
              {t('تحتاج مساعدة في تطبيق ما ورد في هذا المقال؟')}
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
              {t(
                'تواصل مباشرة مع رشيد الفزني لمراجعة وتدقيق أوراقك وترتيب موعدك القنصلي أو معاملتك في تركيا.'
              )}
            </p>
          </div>

          <a
            href={`https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(
              `مرحباً رشيد الفزني، قرأت مقال "${post.title}" وأرغب في استشارة ومساعدة بخصوص معاملتي.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => tracker.trackPostEngagement(slug, 'consult_click')}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold shadow-md shadow-[#25D366]/20 transition-all hover:scale-105 active:scale-95"
          >
            <WhatsAppLogo className="w-4 h-4 fill-current" />
            <span>{t('طلب مساعدة عبر واتساب')}</span>
          </a>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-14 pt-10 border-t border-slate-200">
            <h3 className="text-xl sm:text-2xl font-bold text-[#0B2E57] mb-6">
              {t('مقالات ذات صلة')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onNavigate(`/blog/${rel.slug}`)}
                  className="group rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-[#004AA5]/40 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={rel.coverImage}
                      alt={rel.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-bold text-[#0B2E57] group-hover:text-[#004AA5] transition-colors line-clamp-2 mb-2">
                      {rel.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{rel.excerpt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back to Blog */}
        <div className="mt-12 text-center">
          <button
            onClick={() => onNavigate('/blog')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-[#004AA5] font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{t('العودة إلى جميع المقالات')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
