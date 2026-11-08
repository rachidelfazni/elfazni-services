import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  Copy,
  Check,
  Upload,
  FolderTree,
  Tag as TagIcon,
  Image as ImageIcon,
  Sparkles,
  Settings,
  Calendar,
  Clock,
  Globe,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Archive,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';
import {
  api,
  BlogPost,
  BlogCategory,
  BlogTag,
  BlogTemplate,
  BlogSettings,
  MediaAsset,
  BlogLanguage,
  BlogStatus,
} from '../../../services/api';
import { BlogPostAnalyticsWidget } from '../BlogPostAnalyticsWidget';
import { WordLikeBlogEditor } from './WordLikeBlogEditor';
import { BLOG_UI_STRINGS } from './blogContentUtils';

export type BlogCmsSubTab =
  | 'all_posts'
  | 'new_post'
  | 'drafts'
  | 'scheduled'
  | 'categories_tags'
  | 'media_library'
  | 'templates'
  | 'blog_settings';

interface AdminBlogCmsProps {
  initialSubTab?: BlogCmsSubTab;
  posts: BlogPost[];
  categories: BlogCategory[];
  media: MediaAsset[];
  onPostsChange: (posts: BlogPost[]) => void;
  onCategoriesChange: (categories: BlogCategory[]) => void;
  onMediaChange: (media: MediaAsset[]) => void;
  onNavigatePublic: (path: string) => void;
  showFeedback: (text: string, type?: 'success' | 'error') => void;
}

export const AdminBlogCms: React.FC<AdminBlogCmsProps> = ({
  initialSubTab = 'all_posts',
  posts,
  categories,
  media,
  onPostsChange,
  onCategoriesChange,
  onMediaChange,
  onNavigatePublic,
  showFeedback,
}) => {
  const [subTab, setSubTab] = useState<BlogCmsSubTab>(initialSubTab);
  const [uiLang, setUiLang] = useState<BlogLanguage>('ar');
  const strings = BLOG_UI_STRINGS[uiLang];

  // Sync when parent sidebar changes initialSubTab
  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  // Extra Blog CMS entities
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [templates, setTemplates] = useState<BlogTemplate[]>([]);
  const [blogSettings, setBlogSettings] = useState<BlogSettings | null>(null);

  // Active post being edited in WordLikeBlogEditor
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);

  // Filters & sorting for Posts table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | BlogStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | BlogLanguage>('all');
  const [sortField, setSortField] = useState<'updatedAt' | 'publishedAt' | 'title' | 'views'>(
    'updatedAt'
  );
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Categories & Tags modal/forms
  const [editingCategory, setEditingCategory] = useState<Partial<BlogCategory> | null>(null);
  const [editingTag, setEditingTag] = useState<Partial<BlogTag> | null>(null);

  // Media library state
  const [mediaSearch, setMediaSearch] = useState<string>('');
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [selectedMediaItem, setSelectedMediaItem] = useState<MediaAsset | null>(null);
  const [copiedMediaId, setCopiedMediaId] = useState<string | null>(null);

  // Templates state
  const [editingTemplate, setEditingTemplate] = useState<Partial<BlogTemplate> | null>(null);

  // Load Tags, Templates, BlogSettings
  const loadExtraCmsData = async () => {
    try {
      const [tagsRes, tplRes, setRes, mediaRes, postsRes, catsRes] = await Promise.all([
        api.getTags().catch(() => ({ tags: [] })),
        api.getTemplates().catch(() => ({ templates: [] })),
        api.getBlogSettings().catch(() => ({ blogSettings: null })),
        api.getMedia().catch(() => ({ media: [] })),
        api.getAdminPosts().catch(() => ({ posts: [] })),
        api.getCategories().catch(() => ({ categories: [] })),
      ]);
      setTags(tagsRes.tags || []);
      setTemplates(tplRes.templates || []);
      if (setRes.blogSettings) setBlogSettings(setRes.blogSettings);
      if (mediaRes.media?.length) onMediaChange(mediaRes.media);
      if (postsRes.posts?.length) onPostsChange(postsRes.posts);
      if (catsRes.categories?.length) onCategoriesChange(catsRes.categories);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    void loadExtraCmsData();
  }, []);

  // Open new post in Word-like editor
  const handleStartNewPost = (preset?: Partial<BlogPost>) => {
    setEditingPost({
      title: '',
      slug: '',
      excerpt: '',
      content: '<p><br></p>',
      language: blogSettings?.defaultLanguage || 'ar',
      category: categories[0]?.slug || 'consular',
      tags: [],
      coverImage: blogSettings?.defaultCoverImage || '/assets/slides/10-all-services.webp',
      status: 'draft',
      author: blogSettings?.defaultAuthor || 'رشيد الفزني',
      readTime: '4 دقائق',
      featured: false,
      ...preset,
    });
    setSubTab('new_post');
  };

  const handleEditExistingPost = (p: BlogPost) => {
    setEditingPost({ ...p });
    setSubTab('new_post');
  };

  // Filtered and sorted posts list
  const filteredPosts = useMemo(() => {
    let list = [...posts];

    if (subTab === 'drafts') {
      list = list.filter((p) => p.status === 'draft' || p.status === 'in_review');
    } else if (subTab === 'scheduled') {
      list = list.filter((p) => p.status === 'scheduled');
    } else if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    } else {
      // By default hide trash unless explicitly filtering trash
      list = list.filter((p) => p.status !== 'trash');
    }

    if (categoryFilter !== 'all') {
      list = list.filter((p) => p.category === categoryFilter);
    }
    if (languageFilter !== 'all') {
      list = list.filter((p) => (p.language || 'ar') === languageFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.excerpt || '').toLowerCase().includes(q) ||
          (p.author || '').toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortField === 'views') {
        cmp = (a.views || 0) - (b.views || 0);
      } else if (sortField === 'publishedAt') {
        cmp =
          new Date(a.publishedAt || a.createdAt).getTime() -
          new Date(b.publishedAt || b.createdAt).getTime();
      } else {
        cmp =
          new Date(a.updatedAt || a.createdAt).getTime() -
          new Date(b.updatedAt || b.createdAt).getTime();
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [posts, subTab, statusFilter, categoryFilter, languageFilter, searchQuery, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const paginatedPosts = filteredPosts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Bulk action handler
  const handleBulkAction = async (
    action: 'publish' | 'draft' | 'archive' | 'trash' | 'delete'
  ) => {
    if (selectedPostIds.length === 0) return;
    if (
      action === 'delete' &&
      !window.confirm(`هل أنت متأكد من الحذف النهائي لـ ${selectedPostIds.length} مقال؟`)
    ) {
      return;
    }
    try {
      await api.bulkUpdatePosts(selectedPostIds, action);
      const refreshed = await api.getAdminPosts();
      onPostsChange(refreshed.posts || []);
      setSelectedPostIds([]);
      showFeedback('تم تنفيذ الإجراء الجماعي بنجاح');
    } catch (err: any) {
      showFeedback(err.message || 'فشل تنفيذ الإجراء الجماعي', 'error');
    }
  };

  // Sub-navigation items
  const subNavItems: Array<{
    id: BlogCmsSubTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
  }> = [
    {
      id: 'all_posts',
      label: strings.allPosts,
      icon: FileText,
      count: posts.filter((p) => p.status !== 'trash').length,
    },
    { id: 'new_post', label: strings.newPost, icon: Plus },
    {
      id: 'drafts',
      label: strings.drafts,
      icon: Edit3,
      count: posts.filter((p) => p.status === 'draft' || p.status === 'in_review').length,
    },
    {
      id: 'scheduled',
      label: strings.scheduled,
      icon: Calendar,
      count: posts.filter((p) => p.status === 'scheduled').length,
    },
    {
      id: 'categories_tags',
      label: strings.categoriesAndTags,
      icon: FolderTree,
      count: categories.length,
    },
    { id: 'media_library', label: strings.mediaLibrary, icon: ImageIcon, count: media.length },
    { id: 'templates', label: strings.templates, icon: Sparkles, count: templates.length },
    { id: 'blog_settings', label: strings.blogSettings, icon: Settings },
  ];

  // If user is in `new_post` tab, render the Word-like Editor full stage
  if (subTab === 'new_post') {
    const activePost = editingPost || {
      title: '',
      slug: '',
      excerpt: '',
      content: '<p><br></p>',
      language: blogSettings?.defaultLanguage || 'ar',
      category: categories[0]?.slug || 'consular',
      tags: [],
      coverImage: blogSettings?.defaultCoverImage || '/assets/slides/10-all-services.webp',
      status: 'draft' as BlogStatus,
      author: blogSettings?.defaultAuthor || 'رشيد الفزني',
      readTime: '4 دقائق',
    };

    return (
      <div className="space-y-4">
        <WordLikeBlogEditor
          initialPost={activePost}
          categories={categories}
          tags={tags}
          media={media}
          templates={templates}
          allPosts={posts}
          uiLang={uiLang}
          onChangeUiLang={setUiLang}
          onBack={() => {
            setEditingPost(null);
            setSubTab('all_posts');
          }}
          onSaved={(savedPost, isNew) => {
            setEditingPost(savedPost);
            if (isNew) {
              onPostsChange([savedPost, ...posts.filter((p) => p.id !== savedPost.id)]);
            } else {
              onPostsChange(posts.map((p) => (p.id === savedPost.id ? savedPost : p)));
            }
          }}
          onMediaUploaded={(asset) => {
            onMediaChange([asset, ...media.filter((m) => m.id !== asset.id)]);
          }}
          onOpenPostById={async (id) => {
            try {
              const res = await api.getAdminPost(id);
              setEditingPost(res.post);
            } catch {
              const found = posts.find((p) => p.id === id);
              if (found) setEditingPost(found);
            }
          }}
          onNavigatePublic={onNavigatePublic}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Sub-Navigation Bar for Blog CMS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {subNavItems.map((item) => {
            const Icon = item.icon;
            const active = subTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'new_post') {
                    handleStartNewPost();
                  } else {
                    setSubTab(item.id);
                    setCurrentPage(1);
                  }
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#004AA5] text-white shadow-sm shadow-[#004AA5]/25'
                    : item.id === 'new_post'
                    ? 'bg-[#FFF9ED] text-[#CC9048] border border-[#E3C88F] hover:bg-[#F9ECD2]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#0B2E57]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {typeof item.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* UI Language Pill */}
        <div className="inline-flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-[11px] font-bold">
          {(['ar', 'en', 'fr'] as BlogLanguage[]).map((lng) => (
            <button
              key={lng}
              type="button"
              onClick={() => setUiLang(lng)}
              className={`px-2.5 py-1 rounded-lg uppercase cursor-pointer ${
                uiLang === lng ? 'bg-[#0B2E57] text-white' : 'text-slate-600'
              }`}
            >
              {lng}
            </button>
          ))}
        </div>
      </div>

      {/* =================================================================== */}
      {/* VIEW 1: ALL POSTS / DRAFTS / SCHEDULED                              */}
      {/* =================================================================== */}
      {(subTab === 'all_posts' || subTab === 'drafts' || subTab === 'scheduled') && (
        <div className="space-y-6">
          {subTab === 'all_posts' && (
            <BlogPostAnalyticsWidget onNavigatePost={(slug) => onNavigatePublic(`/blog/${slug}`)} />
          )}

          {/* Header & Primary New Post Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#0B2E57]">
                {subTab === 'drafts'
                  ? strings.drafts
                  : subTab === 'scheduled'
                  ? strings.scheduled
                  : strings.allPosts}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                محرر مرئي شبيه بـ Microsoft Word مع رفع الصور المباشر في موضع المؤشر ودعم اللغات الثلاث
                (AR / EN / FR).
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleStartNewPost()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#004AA5] hover:bg-[#0B2E57] text-white font-black text-xs sm:text-sm shadow-md shadow-[#004AA5]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{strings.newPost}</span>
            </button>
          </div>

          {/* Search, Filters & Bulk Actions Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="ابحث بالعنوان، الرابط، الكاتب، أو الوسوم..."
                  className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#004AA5]"
                />
              </div>

              {/* Status Filter */}
              {subTab === 'all_posts' && (
                <select
                  aria-label="تصفية حسب الحالة"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-[#0B2E57]"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="published">منشور (Published)</option>
                  <option value="draft">مسودة (Draft)</option>
                  <option value="in_review">قيد المراجعة (In Review)</option>
                  <option value="scheduled">مجدول (Scheduled)</option>
                  <option value="archived">مؤرشف (Archived)</option>
                  <option value="trash">سلة المحذوفات (Trash)</option>
                </select>
              )}

              {/* Category Filter */}
              <select
                aria-label="تصفية حسب التصنيف"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-[#0B2E57]"
              >
                <option value="all">جميع التصنيفات</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Language Filter */}
              <select
                aria-label="تصفية حسب اللغة"
                value={languageFilter}
                onChange={(e) => {
                  setLanguageFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-[#0B2E57]"
              >
                <option value="all">جميع اللغات (AR / EN / FR)</option>
                <option value="ar">العربية (AR)</option>
                <option value="en">English (EN)</option>
                <option value="fr">Français (FR)</option>
              </select>
            </div>

            {/* Bulk Actions Strip */}
            {selectedPostIds.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#004AA5]">
                  تم تحديد {selectedPostIds.length} مقال
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => void handleBulkAction('publish')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                  >
                    نشر المحدد
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBulkAction('draft')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold cursor-pointer"
                  >
                    تحويل لمسودة
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBulkAction('archive')}
                    className="px-3 py-1.5 rounded-xl bg-slate-600 text-white text-xs font-bold cursor-pointer"
                  >
                    أرشفة
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleBulkAction('delete')}
                    className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
                  >
                    حذف نهائي
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Posts Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase font-bold">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={
                          paginatedPosts.length > 0 &&
                          paginatedPosts.every((p) => selectedPostIds.includes(p.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPostIds(paginatedPosts.map((p) => p.id));
                          } else {
                            setSelectedPostIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSortField('title');
                          setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                        }}
                        className="inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>المقال</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-4 text-right">اللغة</th>
                    <th className="p-4 text-right">التصنيف</th>
                    <th className="p-4 text-right">الحالة</th>
                    <th className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSortField('views');
                          setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                        }}
                        className="inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>المشاهدات</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSortField('updatedAt');
                          setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                        }}
                        className="inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>آخر تحديث / جدولة</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="p-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {paginatedPosts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-slate-400">
                        لا توجد مقالات مطابقة للفلتر الحالي.
                      </td>
                    </tr>
                  ) : (
                    paginatedPosts.map((post) => {
                      const catObj = categories.find((c) => c.slug === post.category);
                      return (
                        <tr key={post.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedPostIds.includes(post.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPostIds((prev) => [...prev, post.id]);
                                } else {
                                  setSelectedPostIds((prev) => prev.filter((id) => id !== post.id));
                                }
                              }}
                            />
                          </td>
                          <td className="p-4">
                            <div
                              onClick={() => handleEditExistingPost(post)}
                              className="flex items-center gap-3 cursor-pointer group"
                            >
                              <img
                                src={post.coverImage}
                                alt=""
                                className="w-14 h-11 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                              />
                              <div className="min-w-0">
                                <h4 className="font-bold text-[#0B2E57] group-hover:text-[#004AA5] line-clamp-1">
                                  {post.title}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                  <span className="font-mono truncate max-w-[180px]">
                                    /{post.slug}
                                  </span>
                                  <span>•</span>
                                  <span>{post.author}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[#0B2E57] font-black text-[11px] uppercase">
                              {post.language || 'ar'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-lg bg-[#EAF4FF] text-[#004AA5] font-bold text-xs">
                              {catObj ? catObj.name : post.category}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                post.status === 'published'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : post.status === 'scheduled'
                                  ? 'bg-purple-100 text-purple-800'
                                  : post.status === 'archived'
                                  ? 'bg-slate-200 text-slate-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {strings.statusNames[post.status || 'draft']}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600 font-bold">{post.views || 0}</td>
                          <td className="p-4 text-xs text-slate-500">
                            {post.status === 'scheduled' && post.scheduledAt ? (
                              <span className="text-purple-700 font-bold">
                                ⏰ {new Date(post.scheduledAt).toLocaleString('ar-EG')}
                              </span>
                            ) : (
                              new Date(post.updatedAt || post.createdAt).toLocaleDateString('ar-EG')
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditExistingPost(post)}
                                className="px-2.5 py-1.5 rounded-xl bg-[#004AA5] hover:bg-[#0B2E57] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                                title="تحرير في المحرر المرئي"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>تحرير</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onNavigatePublic(
                                    `/blog/${post.slug}${
                                      post.status !== 'published' ? '?preview=1' : ''
                                    }`
                                  )
                                }
                                title="معاينة المقال"
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#004AA5] cursor-pointer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const res = await api.duplicatePost(post.id);
                                    onPostsChange([res.post, ...posts]);
                                    showFeedback('تم تكرار المقال كمسودة');
                                  } catch {
                                    showFeedback('فشل تكرار المقال', 'error');
                                  }
                                }}
                                title="تكرار المقال"
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#CC9048] cursor-pointer"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!window.confirm(`هل تريد حذف المقال "${post.title}"؟`)) return;
                                  try {
                                    await api.deletePost(post.id);
                                    onPostsChange(posts.filter((p) => p.id !== post.id));
                                    showFeedback('تم حذف المقال');
                                  } catch {
                                    showFeedback('فشل حذف المقال', 'error');
                                  }
                                }}
                                title="حذف المقال"
                                className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
                <span>
                  صفحة {currentPage} من {totalPages} ({filteredPosts.length} مقال)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    السابق
                  </button>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* VIEW 2: CATEGORIES & TAGS                                           */}
      {/* =================================================================== */}
      {subTab === 'categories_tags' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Categories Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#0B2E57]">التصنيفات (Categories)</h3>
              <button
                type="button"
                onClick={() =>
                  setEditingCategory({
                    name: '',
                    nameEn: '',
                    nameFr: '',
                    slug: '',
                    description: '',
                    color: '#004AA5',
                  })
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#004AA5] text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>تصنيف جديد</span>
              </button>
            </div>

            {editingCategory && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!editingCategory.name) return;
                  try {
                    if (editingCategory.id) {
                      await api.updateCategory(editingCategory.id, editingCategory);
                    } else {
                      await api.createCategory(editingCategory);
                    }
                    const res = await api.getCategories();
                    onCategoriesChange(res.categories || []);
                    setEditingCategory(null);
                    showFeedback('تم حفظ التصنيف بنجاح');
                  } catch (err: any) {
                    showFeedback(err.message || 'فشل حفظ التصنيف', 'error');
                  }
                }}
                className="p-5 rounded-2xl bg-white border-2 border-[#004AA5] shadow-md space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={editingCategory.name || ''}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, name: e.target.value })
                    }
                    placeholder="الاسم بالعربية *"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={editingCategory.nameEn || ''}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, nameEn: e.target.value })
                    }
                    placeholder="English Name"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={editingCategory.nameFr || ''}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, nameFr: e.target.value })
                    }
                    placeholder="Nom Français"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    dir="ltr"
                    value={editingCategory.slug || ''}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, slug: e.target.value })
                    }
                    placeholder="slug-name"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                  <input
                    type="color"
                    value={editingCategory.color || '#004AA5'}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, color: e.target.value })
                    }
                    className="h-9 w-full rounded-xl border border-slate-200 p-1"
                  />
                </div>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, description: e.target.value })
                  }
                  placeholder="وصف التصنيف..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCategory(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#004AA5] text-white text-xs font-bold"
                  >
                    حفظ التصنيف
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color || '#004AA5' }}
                      />
                      <span className="font-bold text-sm text-[#0B2E57]">{cat.name}</span>
                      {cat.nameEn && (
                        <span className="text-xs text-slate-400">({cat.nameEn})</span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px]">
                        {cat.slug}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{cat.description}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingCategory(cat)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await api.deleteCategory(cat.id);
                          onCategoriesChange(categories.filter((c) => c.id !== cat.id));
                          showFeedback('تم حذف التصنيف');
                        } catch (err: any) {
                          showFeedback(err.message || 'لا يمكن حذف التصنيف', 'error');
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#0B2E57]">الوسوم (Tags / Labels)</h3>
              <button
                type="button"
                onClick={() => setEditingTag({ name: '', nameEn: '', nameFr: '', slug: '' })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#CC9048] text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>وسم جديد</span>
              </button>
            </div>

            {editingTag && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!editingTag.name) return;
                  try {
                    if (editingTag.id) {
                      await api.updateTag(editingTag.id, editingTag);
                    } else {
                      await api.createTag(editingTag);
                    }
                    const res = await api.getTags();
                    setTags(res.tags || []);
                    setEditingTag(null);
                    showFeedback('تم حفظ الوسم بنجاح');
                  } catch (err: any) {
                    showFeedback(err.message || 'فشل حفظ الوسم', 'error');
                  }
                }}
                className="p-4 rounded-2xl bg-white border-2 border-[#CC9048] space-y-3"
              >
                <input
                  type="text"
                  required
                  value={editingTag.name || ''}
                  onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                  placeholder="اسم الوسم بالعربية *"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    dir="ltr"
                    value={editingTag.nameEn || ''}
                    onChange={(e) => setEditingTag({ ...editingTag, nameEn: e.target.value })}
                    placeholder="English Tag"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={editingTag.nameFr || ''}
                    onChange={(e) => setEditingTag({ ...editingTag, nameFr: e.target.value })}
                    placeholder="Tag Français"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTag(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#CC9048] text-white text-xs font-bold"
                  >
                    حفظ الوسم
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد وسوم مسجلة حالياً.</p>
              ) : (
                tags.map((tg) => (
                  <div
                    key={tg.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0B2E57]"
                  >
                    <span>#{tg.name}</span>
                    {typeof tg.postCount === 'number' && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#EAF4FF] text-[#004AA5] text-[10px]">
                        {tg.postCount}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingTag(tg)}
                      className="text-slate-400 hover:text-[#004AA5]"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await api.deleteTag(tg.id);
                        setTags(tags.filter((x) => x.id !== tg.id));
                        showFeedback('تم حذف الوسم');
                      }}
                      className="text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* VIEW 3: PERSISTENT MEDIA LIBRARY                                    */}
      {/* =================================================================== */}
      {subTab === 'media_library' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-[#0B2E57]">{strings.mediaLibrary}</h3>
              <p className="text-xs text-slate-500 mt-1">
                ارفع الصور وملفات الـ PDF، عدّل النص البديل (Alt Text)، وتحقّق من المقالات المستخدمة فيها.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                placeholder="بحث في الوسائط..."
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
              />
              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#004AA5] hover:bg-[#0B2E57] text-white text-xs font-bold cursor-pointer shadow-sm">
                <Upload className="w-4 h-4" />
                <span>{uploadPct !== null ? `جاري الرفع ${uploadPct}%` : 'رفع ملف جديد'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    setUploadPct(10);
                    try {
                      const res = await api.uploadMediaWithProgress(
                        file,
                        file.name.replace(/\.[^/.]+$/, ''),
                        '',
                        (p) => setUploadPct(p)
                      );
                      onMediaChange([res.asset, ...media]);
                      showFeedback('تم رفع الملف بنجاح');
                    } catch (err: any) {
                      showFeedback(err.message || 'فشل رفع الملف', 'error');
                    } finally {
                      setUploadPct(null);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {media
                .filter(
                  (m) =>
                    !mediaSearch.trim() ||
                    m.originalName.toLowerCase().includes(mediaSearch.toLowerCase()) ||
                    (m.altText || '').toLowerCase().includes(mediaSearch.toLowerCase())
                )
                .map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedMediaItem(asset)}
                    className={`group bg-white rounded-2xl border-2 overflow-hidden shadow-xs cursor-pointer transition-all flex flex-col justify-between ${
                      selectedMediaItem?.id === asset.id
                        ? 'border-[#004AA5] ring-2 ring-[#004AA5]/20'
                        : 'border-slate-200 hover:border-[#004AA5]/50'
                    }`}
                  >
                    <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {asset.mimeType === 'application/pdf' || asset.url.endsWith('.pdf') ? (
                        <div className="text-center p-4">
                          <FileText className="w-10 h-10 text-[#004AA5] mx-auto mb-1" />
                          <span className="text-[10px] font-bold text-slate-600">PDF Document</span>
                        </div>
                      ) : (
                        <img
                          src={asset.url}
                          alt={asset.altText}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                      {asset.usedInPosts && asset.usedInPosts.length > 0 && (
                        <span className="absolute top-2 start-2 px-2 py-0.5 rounded-full bg-[#0B2E57]/85 text-white text-[10px] font-bold">
                          مستخدم في {asset.usedInPosts.length}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {asset.altText || asset.originalName}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>{Math.max(1, Math.round((asset.size || 0) / 1024))} KB</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(asset.url);
                            setCopiedMediaId(asset.id);
                            setTimeout(() => setCopiedMediaId(null), 2000);
                            showFeedback('تم نسخ الرابط');
                          }}
                          className="text-[#004AA5] font-bold"
                        >
                          {copiedMediaId === asset.id ? 'تم النسخ ✓' : 'نسخ الرابط'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Selected Media Details Inspector */}
            <div className="lg:col-span-4">
              {selectedMediaItem ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 sticky top-24">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-black text-sm text-[#0B2E57]">تفاصيل الملف المحدد</h4>
                    <button
                      type="button"
                      onClick={() => setSelectedMediaItem(null)}
                      className="text-xs text-slate-400"
                    >
                      إغلاق
                    </button>
                  </div>

                  {!selectedMediaItem.url.endsWith('.pdf') && (
                    <img
                      src={selectedMediaItem.url}
                      alt={selectedMediaItem.altText}
                      className="w-full aspect-video object-cover rounded-2xl border border-slate-200 bg-slate-50"
                    />
                  )}

                  <div className="text-xs space-y-1 text-slate-600">
                    <div>
                      <strong>الاسم الأصلي:</strong> {selectedMediaItem.originalName}
                    </div>
                    <div dir="ltr" className="font-mono text-[11px] text-[#004AA5] break-all">
                      {selectedMediaItem.url}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      النص البديل (Alt Text)
                    </label>
                    <input
                      type="text"
                      value={selectedMediaItem.altText || ''}
                      onChange={(e) =>
                        setSelectedMediaItem({ ...selectedMediaItem, altText: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      التعليق التوضيحي (Caption)
                    </label>
                    <input
                      type="text"
                      value={selectedMediaItem.caption || ''}
                      onChange={(e) =>
                        setSelectedMediaItem({ ...selectedMediaItem, caption: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>

                  {selectedMediaItem.usedInPosts && selectedMediaItem.usedInPosts.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                      <div className="font-bold text-amber-900">
                        مستخدم حالياً في المقالات التالية:
                      </div>
                      {selectedMediaItem.usedInPosts.map((u) => (
                        <div key={u.id} className="text-amber-800 truncate">
                          • {u.title}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await api.updateMedia(selectedMediaItem.id, {
                            altText: selectedMediaItem.altText,
                            caption: selectedMediaItem.caption,
                          });
                          onMediaChange(
                            media.map((m) => (m.id === res.asset.id ? res.asset : m))
                          );
                          showFeedback('تم تحديث بيانات الوسائط');
                        } catch {
                          showFeedback('فشل تحديث بيانات الوسائط', 'error');
                        }
                      }}
                      className="flex-1 py-2 rounded-xl bg-[#004AA5] text-white text-xs font-bold cursor-pointer"
                    >
                      حفظ التعديلات
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await api.deleteMedia(selectedMediaItem.id, false);
                          onMediaChange(media.filter((m) => m.id !== selectedMediaItem.id));
                          setSelectedMediaItem(null);
                          showFeedback('تم حذف الملف');
                        } catch (err: any) {
                          if (
                            err.status === 409 &&
                            window.confirm(
                              `${err.message}\nهل تريد الحذف الإجباري رغم استخدامه في المقال؟`
                            )
                          ) {
                            await api.deleteMedia(selectedMediaItem.id, true);
                            onMediaChange(media.filter((m) => m.id !== selectedMediaItem.id));
                            setSelectedMediaItem(null);
                            showFeedback('تم حذف الملف');
                          } else {
                            showFeedback(err.message || 'فشل الحذف', 'error');
                          }
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold cursor-pointer"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-400">
                  اختر أي صورة أو ملف من الشبكة لعرض تفاصيله وتعديل النص البديل (Alt Text) أو معرفة
                  المقالات المرتبطة به.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* VIEW 4: ARTICLE TEMPLATES                                           */}
      {/* =================================================================== */}
      {subTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-[#0B2E57]">{strings.templates}</h3>
              <p className="text-xs text-slate-500 mt-1">
                قوالب تحريرية جاهزة للمقالات القنصلية، قوائم الوثائق، وأدلة الإقامة والسفر.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setEditingTemplate({
                  name: '',
                  description: '',
                  category: 'consular',
                  language: 'ar',
                  titleTemplate: '',
                  excerptTemplate: '',
                  contentHtml: '<h2>القسم الأول</h2><p>اكتب محتوى القالب هنا...</p>',
                  tags: [],
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#004AA5] text-white text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء قالب جديد</span>
            </button>
          </div>

          {editingTemplate && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editingTemplate.name) return;
                try {
                  if (editingTemplate.id) {
                    await api.updateTemplate(editingTemplate.id, editingTemplate);
                  } else {
                    await api.createTemplate(editingTemplate);
                  }
                  const res = await api.getTemplates();
                  setTemplates(res.templates || []);
                  setEditingTemplate(null);
                  showFeedback('تم حفظ القالب بنجاح');
                } catch (err: any) {
                  showFeedback(err.message || 'فشل حفظ القالب', 'error');
                }
              }}
              className="p-6 rounded-3xl bg-white border-2 border-[#004AA5] space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={editingTemplate.name || ''}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, name: e.target.value })
                  }
                  placeholder="اسم القالب *"
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                />
                <select
                  value={editingTemplate.language || 'ar'}
                  onChange={(e) =>
                    setEditingTemplate({
                      ...editingTemplate,
                      language: e.target.value as BlogLanguage,
                    })
                  }
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="ar">العربية (RTL)</option>
                  <option value="en">English (LTR)</option>
                  <option value="fr">Français (LTR)</option>
                </select>
                <input
                  type="text"
                  value={editingTemplate.titleTemplate || ''}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, titleTemplate: e.target.value })
                  }
                  placeholder="عنوان افتراضي للمقال..."
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <textarea
                rows={5}
                value={editingTemplate.contentHtml || ''}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, contentHtml: e.target.value })
                }
                placeholder="محتوى القالب بصيغة HTML..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#004AA5] text-white text-xs font-bold"
                >
                  حفظ القالب
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-[#EAF4FF] text-[#004AA5] text-xs font-bold uppercase">
                      {tpl.language} · {tpl.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingTemplate(tpl)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await api.deleteTemplate(tpl.id);
                          setTemplates(templates.filter((t) => t.id !== tpl.id));
                          showFeedback('تم حذف القالب');
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-base font-black text-[#0B2E57] mt-3">{tpl.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{tpl.description}</p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleStartNewPost({
                      title: tpl.titleTemplate,
                      excerpt: tpl.excerptTemplate,
                      content: tpl.contentHtml,
                      category: tpl.category,
                      language: tpl.language,
                      tags: tpl.tags || [],
                    })
                  }
                  className="w-full py-2.5 rounded-xl bg-[#004AA5] hover:bg-[#0B2E57] text-white text-xs font-bold cursor-pointer"
                >
                  بدء مقال جديد بهذا القالب
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* VIEW 5: BLOG SETTINGS                                               */}
      {/* =================================================================== */}
      {subTab === 'blog_settings' && blogSettings && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await api.updateBlogSettings(blogSettings);
              setBlogSettings(res.blogSettings);
              showFeedback('تم حفظ إعدادات المدونة بنجاح');
            } catch (err: any) {
              showFeedback(err.message || 'فشل حفظ الإعدادات', 'error');
            }
          }}
          className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 max-w-4xl"
        >
          <h3 className="text-xl font-black text-[#0B2E57]">{strings.blogSettings}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اللغة الافتراضية للمقالات الجديدة
              </label>
              <select
                value={blogSettings.defaultLanguage}
                onChange={(e) =>
                  setBlogSettings({
                    ...blogSettings,
                    defaultLanguage: e.target.value as BlogLanguage,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="ar">العربية (RTL)</option>
                <option value="en">English (LTR)</option>
                <option value="fr">Français (LTR)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم الكاتب الافتراضي
              </label>
              <input
                type="text"
                value={blogSettings.defaultAuthor}
                onChange={(e) =>
                  setBlogSettings({ ...blogSettings, defaultAuthor: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المنطقة الزمنية للجدولة
              </label>
              <input
                type="text"
                dir="ltr"
                value={blogSettings.timezone}
                onChange={(e) => setBlogSettings({ ...blogSettings, timezone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان المدونة (عربي)
              </label>
              <input
                type="text"
                value={blogSettings.blogTitleAr}
                onChange={(e) =>
                  setBlogSettings({ ...blogSettings, blogTitleAr: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Blog Title (English)
              </label>
              <input
                type="text"
                dir="ltr"
                value={blogSettings.blogTitleEn}
                onChange={(e) =>
                  setBlogSettings({ ...blogSettings, blogTitleEn: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Titre du Blogue (Français)
              </label>
              <input
                type="text"
                dir="ltr"
                value={blogSettings.blogTitleFr}
                onChange={(e) =>
                  setBlogSettings({ ...blogSettings, blogTitleFr: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-[#0B2E57] cursor-pointer">
              <input
                type="checkbox"
                checked={blogSettings.enableTableOfContents}
                onChange={(e) =>
                  setBlogSettings({ ...blogSettings, enableTableOfContents: e.target.checked })
                }
              />
              <span>إظهار جدول محتويات المقال تلقائياً (Table of Contents)</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-[#0B2E57] cursor-pointer">
              <input
                type="checkbox"
                checked={blogSettings.enableWhatsappCta}
                onChange={(e) =>
                  setBlogSettings({ ...blogSettings, enableWhatsappCta: e.target.checked })
                }
              />
              <span>إظهار بطاقة الاستشارة عبر واتساب أسفل المقالات</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#004AA5] hover:bg-[#0B2E57] text-white text-xs sm:text-sm font-black shadow-md cursor-pointer"
            >
              حفظ إعدادات المدونة
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
