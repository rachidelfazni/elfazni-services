import React, { useState, useEffect } from 'react';
import {
  FileText,
  Eye,
  TrendingUp,
  Award,
  Clock,
  Share2,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Sparkles,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { api, BlogPostMetric, BlogAnalyticsSummary } from '../../services/api';

interface BlogPostAnalyticsWidgetProps {
  onNavigatePost?: (slug: string) => void;
}

export const BlogPostAnalyticsWidget: React.FC<BlogPostAnalyticsWidgetProps> = ({ onNavigatePost }) => {
  const [posts, setPosts] = useState<BlogPostMetric[]>([]);
  const [summary, setSummary] = useState<BlogAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'views' | 'engagement' | 'newest' | 'duration'>('views');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.getBlogPostAnalytics();
      if (res && res.posts) {
        setPosts(res.posts);
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to load blog post analytics:', err);
      // Fallback: fetch admin posts and calculate locally
      try {
        const adminPostsRes = await api.getAdminPosts();
        const rawPosts = adminPostsRes.posts || [];
        const fallbackMetrics: BlogPostMetric[] = rawPosts.map((p) => {
          const views = Number(p.views) || 0;
          const readMin = parseInt(String(p.readTime)) || 4;
          const consultRequests = Number(p.consultClicks) || 0;
          const shares = Number(p.sharesCount) || 0;
          const engagedReads = Number(p.engagedReads) || 0;
          const totalInteractions = engagedReads + consultRequests + shares;
          const engagementRate = views > 0 ? parseFloat(Math.min(100, (totalInteractions / views) * 100).toFixed(1)) : 0;
          const avgDuration = views > 0 ? (engagedReads > 0 ? `${readMin} دقائق` : `${Math.max(1, Math.round(readMin * 0.6))} دقائق`) : '0 دقيقة';

          return {
            id: p.id,
            title: p.title,
            slug: p.slug,
            category: p.category,
            coverImage: p.coverImage || '/assets/slides/10-all-services.webp',
            status: p.status,
            readTime: p.readTime || '4 دقائق',
            publishedAt: p.publishedAt || p.createdAt,
            views,
            engagementRate,
            avgDuration,
            consultRequests,
            shares,
          };
        });

        const totalViews = fallbackMetrics.reduce((s, p) => s + p.views, 0);
        const avgEngagementRate = fallbackMetrics.length > 0
          ? parseFloat((fallbackMetrics.reduce((s, p) => s + p.engagementRate, 0) / fallbackMetrics.length).toFixed(1))
          : 0;
        const avgViewsPerPost = fallbackMetrics.length > 0 ? Math.round(totalViews / fallbackMetrics.length) : 0;
        const topPost = [...fallbackMetrics].sort((a, b) => b.views - a.views)[0] || null;

        setPosts(fallbackMetrics);
        setSummary({
          totalPosts: fallbackMetrics.length,
          totalViews,
          avgViewsPerPost,
          avgEngagementRate,
          topPost,
        });
      } catch (innerErr) {
        console.error('Local fallback also failed:', innerErr);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/blog/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2500);
    });
  };

  const handleOpenPost = (slug: string) => {
    if (onNavigatePost) {
      onNavigatePost(slug);
    } else {
      window.open(`/blog/${slug}`, '_blank');
    }
  };

  // Filter & Sort
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'views') return b.views - a.views;
    if (sortBy === 'engagement') return b.engagementRate - a.engagementRate;
    if (sortBy === 'duration') return b.avgDuration.localeCompare(a.avgDuration);
    // newest
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  // Category labels helper
  const categoryLabels: Record<string, { label: string; color: string }> = {
    consular: { label: 'المواعيد القنصلية', color: 'bg-[#EAF4FF] text-[#004AA5] border-[#B9D5F6]' },
    residency: { label: 'الإقامات والتأشيرات', color: 'bg-[#EAF4FF] text-[#0B2E57] border-[#B9D5F6]' },
    marriage: { label: 'الزواج والأوراق المدنية', color: 'bg-[#F7F5EF] text-[#CC9048] border-[#E3C88F]' },
    travel: { label: 'السفر والطيران', color: 'bg-[#EAF4FF] text-[#2A83D5] border-[#B9D5F6]' },
    general: { label: 'إرشادات الجالية', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  };

  const maxViews = Math.max(...posts.map((p) => p.views), 1);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center justify-center min-h-[220px]">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>جارٍ تحميل إحصائيات زوار المقالات ومعدلات التفاعل...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-6">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              إحصائيات زوار وتفاعل مقالات المدونة (Blog Visitor & Engagement Analytics)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            متابعة فورية لحجم مشاهدات كل مقال، معدل التفاعل الفعلي، والتحويلات المباشرة إلى استشارات واتساب
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-50"
          title="تحديث البيانات لحظياً"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>تحديث فوري</span>
        </button>
      </div>

      {/* Aggregate KPI Mini Cards — unified brand surfaces */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Total Blog Views */}
        <div className="p-4 rounded-xl bg-white border border-[#D7E7F7]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5E7086]">إجمالي قراءات المدونة</span>
            <div className="p-2 bg-[#EAF4FF] rounded-lg text-[#004AA5]">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#0B2E57] tabular-nums">
            {(summary?.totalViews || 0).toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#5E7086]">
            <TrendingUp className="w-3 h-3 text-[#CC9048]" />
            <span>عبر {summary?.totalPosts || posts.length} مقالات منشورة</span>
          </div>
        </div>

        {/* KPI 2: Average Engagement Rate */}
        <div className="p-4 rounded-xl bg-white border border-[#D7E7F7]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5E7086]">متوسط معدل التفاعل</span>
            <div className="p-2 bg-[#EAF4FF] rounded-lg text-[#004AA5]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#0B2E57] tabular-nums">
            {summary?.avgEngagementRate || 0}%
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#CC9048]">
            <span className="w-2 h-2 rounded-full bg-[#CC9048] animate-pulse" />
            <span>
              {summary?.avgEngagementRate && summary.avgEngagementRate > 0 ? 'تفاعل قراء حقيقي' : 'جاهز للرصد (0%)'}
            </span>
          </div>
        </div>

        {/* KPI 3: Average Views Per Post */}
        <div className="p-4 rounded-xl bg-white border border-[#D7E7F7]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#5E7086]">متوسط المشاهدات للمقال</span>
            <div className="p-2 bg-[#EAF4FF] rounded-lg text-[#004AA5]">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-[#0B2E57] tabular-nums">
            {summary?.avgViewsPerPost || 0}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-[#5E7086]">
            قراءة حقيقية لكل موضوع
          </div>
        </div>

        {/* KPI 4: Top Performing Post */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-[#0B2E57] to-[#004AA5] border border-[#0B2E57] text-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#B9D5F6]">المقال الأكثر قراءة</span>
            <div className="p-2 bg-white/10 rounded-lg text-[#E3C88F]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div
            className="mt-2 text-sm font-bold text-white truncate"
            title={summary?.topPost && summary.topPost.views > 0 ? summary.topPost.title : 'بانتظار قراء المقالات'}
          >
            {summary?.topPost && summary.topPost.views > 0 ? summary.topPost.title : 'بانتظار قراء المقالات'}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-[#B9D5F6]">
            <span>{summary?.topPost?.views || 0} قراءة</span>
            <span className="font-bold text-[#E3C88F]">معدل: {summary?.topPost?.engagementRate || 0}%</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في عناوين المقالات والتصنيفات..."
            className="w-full pl-3 pr-9 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            التصنيف:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">جميع التصنيفات ({posts.length})</option>
            <option value="consular">المواعيد القنصلية</option>
            <option value="residency">الإقامات والتأشيرات</option>
            <option value="marriage">الزواج والأوراق المدنية</option>
            <option value="travel">السفر والطيران</option>
            <option value="general">إرشادات الجالية</option>
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" />
            الترتيب:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="views">الأعلى مشاهدة (Most Views)</option>
            <option value="engagement">الأعلى تفاعلاً (Highest Engagement)</option>
            <option value="newest">الأحدث نشراً (Newest)</option>
            <option value="duration">مدة القراءة</option>
          </select>
        </div>
      </div>

      {/* Posts Table (Desktop) / Cards (Mobile) */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-bold">
              <th className="py-3 px-3.5">المقال والتصنيف</th>
              <th className="py-3 px-3.5">إجمالي المشاهدات</th>
              <th className="py-3 px-3.5">معدل التفاعل (Engagement)</th>
              <th className="py-3 px-3.5">متوسط وقت القراءة</th>
              <th className="py-3 px-3.5">تحويلات واتساب والمشاركات</th>
              <th className="py-3 px-3.5 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedPosts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  لا توجد مقالات مطابقة للبحث أو الفلتر المحدد.
                </td>
              </tr>
            ) : (
              sortedPosts.map((post, idx) => {
                const catMeta = categoryLabels[post.category] || {
                  label: post.category,
                  color: 'bg-slate-100 text-slate-700 border-slate-200',
                };
                const viewPercentage = Math.round((post.views / maxViews) * 100);

                // Badge color based on engagement
                const isHighEngagement = post.engagementRate >= 8;
                const isMediumEngagement = post.engagementRate >= 5 && post.engagementRate < 8;

                return (
                  <tr key={post.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Title + Thumbnail + Category */}
                    <td className="py-3.5 px-3.5 max-w-sm">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/slides/10-all-services.webp';
                            }}
                          />
                          {idx === 0 && sortBy === 'views' && (
                            <div className="absolute top-0 right-0 bg-amber-500 text-white p-0.5 rounded-bl">
                              <Award className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <button
                            onClick={() => handleOpenPost(post.slug)}
                            className="text-left font-bold text-slate-900 hover:text-blue-700 text-xs line-clamp-2 transition-colors block text-right"
                            title={post.title}
                          >
                            {post.title}
                          </button>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${catMeta.color}`}
                            >
                              {catMeta.label}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date(post.publishedAt).toLocaleDateString('ar-EG', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Total Views + Bar */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-black text-slate-900 text-sm">
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>{post.views.toLocaleString()}</span>
                          <span className="text-[10px] font-normal text-slate-400">قراءة</span>
                        </div>
                        <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${post.views > 0 ? Math.max(viewPercentage, 8) : 0}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Engagement Rate */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-black text-xs border ${
                              post.views === 0
                                ? 'bg-slate-100 text-slate-500 border-slate-200'
                                : isHighEngagement
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : isMediumEngagement
                                ? 'bg-blue-50 text-blue-700 border-blue-300'
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                            }`}
                          >
                            {post.engagementRate}%
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {post.views === 0 ? 'بانتظار الزوار' : isHighEngagement ? '🔥 مرتفع' : isMediumEngagement ? '👍 جيد' : 'عادي'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {post.views === 0 ? '0 تفاعل حالياً' : 'تفاعل بالقراءة والنقر'}
                        </div>
                      </div>
                    </td>

                    {/* Avg Duration */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-slate-800 font-semibold text-xs">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{post.avgDuration}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">معدل البقاء في المقال</span>
                      </div>
                    </td>

                    {/* Consultations and Shares */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200"
                          title="استشارات وطلبات واتساب ناتجة عن المقال"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>{post.consultRequests} استشارة</span>
                        </span>
                        <span
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]"
                          title="مرات مشاركة الرابط"
                        >
                          <Share2 className="w-3 h-3 text-slate-500" />
                          <span>{post.shares} مشاركة</span>
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenPost(post.slug)}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          title="معاينة المقال في الموقع"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopyLink(post.slug)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                          title="نسخ رابط المقال"
                        >
                          {copiedSlug === post.slug ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
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

      {/* Performance Summary Footer */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>
            يتم تحديث عداد المشاهدات تلقائياً عند زيارة القراء لمقالات المدونة عبر محركات البحث أو الروابط المباشرة.
          </span>
        </div>
        <span className="font-bold text-slate-800">
          إجمالي المقالات: {sortedPosts.length} من أصل {posts.length}
        </span>
      </div>
    </div>
  );
};
