import { AdminUsers } from './AdminUsers';
import './admin-design.css';
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Image as ImageIcon,
  Briefcase,
  Mail,
  Settings,
  LogOut,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  Clock,
  Eye,
  Upload,
  Copy,
  Check,
  X,
  Menu,
  ShieldCheck,
  User,
  Sparkles,
  Phone,
  MessageSquare,
  AlertCircle,
  Save,
  Globe2,
  Power,
  RefreshCw,
  Bell,
  Palette,
} from 'lucide-react';
import {
  api,
  BlogPost,
  BlogCategory,
  MediaAsset,
  SiteService,
  SiteSettings,
  ContactMessage,
  AdminStats,
  ChatStatus,
} from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { AdminAnalytics } from './AdminAnalytics';
import { AdminLiveChat } from './AdminLiveChat';
import { AdminMailbox } from './AdminMailbox';
import { AdminSiteEditor } from './AdminSiteEditor';
import { AdminServicesEditor } from './AdminServicesEditor';
import { AdminProfileSettings } from './AdminProfileSettings';
import { AdminSeoManager } from './AdminSeoManager';
import { BlogPostAnalyticsWidget } from './BlogPostAnalyticsWidget';
import { AdminBlogCms, BlogCmsSubTab } from './blog/AdminBlogCms';
import { AdminThemeManager, ThemeSubTab } from './theme/AdminThemeManager';
import { realtime } from '../../services/realtime';
import { BrandLogo } from '../common/BrandLogo';

interface AdminLayoutProps {
  onLogout: () => void;
  onNavigate: (path: string) => void;
}

export type AdminTab =
  | 'overview'
  | 'chat'
  | 'mailbox'
  | 'site_editor'
  | 'theme'
  | 'seo'
  | 'services'
  | 'posts'
  | 'categories'
  | 'media'
  | 'settings'
  | 'users';

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout, onNavigate }) => {
  const { isRtl } = useLanguage();
  const [account, setAccount] = useState<import('../../services/api').User>();
  const isOwner = account?.role === 'superadmin';
  const canSupport = isOwner || account?.access === 'support';
  const [recoveryCount, setRecoveryCount] = useState(0);
  useEffect(() => {
    if (!isOwner) return;
    const refresh = () => api.request<{ requests: unknown[] }>('/admin/users')
      .then(({ requests }) => setRecoveryCount(requests.length)).catch(() => {});
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, [isOwner]);
  const [activeTab, setActiveTab] = useState<AdminTab>(() =>
    typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/theme')
      ? 'theme'
      : 'overview'
  );
  const [blogSubTab, setBlogSubTab] = useState<BlogCmsSubTab>('all_posts');
  const [themeSubTab, setThemeSubTab] = useState<ThemeSubTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status & Counts
  const [chatStatus, setChatStatus] = useState<ChatStatus>({
    adminOnline: true,
    lastActive: new Date().toISOString(),
  });
  const [unreadMailCount, setUnreadMailCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Data states
  const [postFilter, setPostFilter] = useState<'all' | BlogPost['status']>('all');
  const [updatingPost, setUpdatingPost] = useState<string>();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [services, setServices] = useState<SiteService[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals & form states
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
  const [postPreviewMode, setPostPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<BlogCategory> | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadAllData();
    api.getMe().then(({ user }) => {
      setAccount(user);
      if (user.role !== 'superadmin') setActiveTab(user.access === 'support' ? 'chat' : user.access === 'content' ? 'posts' : 'overview');
    }).catch(() => {});

    // Realtime notification listeners across the site
    const unsubMail = realtime.subscribe('mailbox:new', (payload: any) => {
      if (typeof payload.unreadCount === 'number') setUnreadMailCount(payload.unreadCount);
      showFeedback(`📬 رسالة واردة جديدة من ${payload.message?.name || 'عميل'}!`);
    });

    const unsubChat = realtime.subscribe('chat:message', (payload: any) => {
      if (payload.message?.sender === 'visitor') {
        api.getChatSessions().then(({ sessions }) => {
          setUnreadChatCount(sessions.reduce((total, session) => total + (session.unreadAdmin || 0), 0));
        }).catch(() => {});
        showFeedback(`💬 رسالة جديدة في المحادثة الفورية من ${payload.message?.senderName || 'الزائر'}!`);
      }
    });

    const unsubRead = realtime.subscribe('chat:read', (payload: any) => {
      if (payload?.reader === 'admin') {
        api.getChatSessions().then((res) => {
          const total = (res.sessions || []).reduce((acc, s) => acc + (s.unreadAdmin || 0), 0);
          setUnreadChatCount(total);
        }).catch(() => {});
      }
    });

    const unsubStatus = realtime.subscribe('chat:status', (status: ChatStatus) => {
      if (status) setChatStatus(status);
    });

    // Continuous 2.5s sync for unread chat & mailbox badges so mobile messages never miss notification
    const liveBadgeTimer = setInterval(() => {
      api.getChatSessions().then((res) => {
        if (res.sessions) {
          const total = res.sessions.reduce((acc, s) => acc + (s.unreadAdmin || 0), 0);
          setUnreadChatCount((prev) => {
            if (total > prev) {
              const latest = res.sessions[0];
              showFeedback(`💬 رسالة جديدة في المحادثة الفورية من ${latest?.visitorName || 'زائر الهاتف'}!`);
            }
            return total;
          });
        }
      }).catch(() => {});

      api.getMailbox('inbox').then((res) => {
        if (res.counts) {
          const inboxUnread = res.counts.inbox;
          setUnreadMailCount((prev) => {
            if (inboxUnread > prev) {
              const latestMsg = res.messages?.[0];
              showFeedback(`📬 رسالة واردة جديدة في البريد من ${latestMsg?.name || 'عميل'}!`);
            }
            return inboxUnread;
          });
        }
      }).catch(() => {});
    }, 2500);

    return () => {
      unsubMail();
      unsubChat();
      unsubRead();
      unsubStatus();
      clearInterval(liveBadgeTimer);
    };
  }, []);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [postsRes, catsRes, mediaRes, srvRes, setRes, mailRes, chatRes, chatSessRes] = await Promise.all([
        api.getAdminPosts().catch(() => ({ posts: [] })),
        api.getCategories().catch(() => ({ categories: [] })),
        api.getMedia().catch(() => ({ media: [] })),
        api.getAdminServices().catch(() => ({ services: [] })),
        api.getSettings().catch(() => ({ settings: null })),
        api.getMailbox('inbox').catch(() => ({ messages: [], counts: { inbox: 0 } })),
        api.getChatStatus().catch(() => ({ chatStatus: { adminOnline: true, lastActive: '' } })),
        api.getChatSessions().catch(() => ({ sessions: [] })),
      ]);

      setPosts(postsRes.posts || []);
      setCategories(catsRes.categories || []);
      setMedia(mediaRes.media || []);
      setServices(srvRes.services || []);
      if (setRes.settings) setSettings(setRes.settings);
      if (mailRes.counts) setUnreadMailCount(mailRes.counts.inbox);
      if (chatRes.chatStatus) setChatStatus(chatRes.chatStatus);
      if (chatSessRes.sessions) {
        const unreadTotal = chatSessRes.sessions.reduce((acc, s) => acc + (s.unreadAdmin || 0), 0);
        setUnreadChatCount(unreadTotal);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOnline = async () => {
    const newState = !chatStatus.adminOnline;
    try {
      const res = await api.updateChatStatus(newState);
      setChatStatus(res.chatStatus);
      showFeedback(newState ? 'أنت متصل الآن (Online)' : 'أنت غير متصل (Offline)');
    } catch (err) {
      showFeedback('فشل تحديث حالة الاتصال', 'error');
    }
  };

  // =====================================
  // POST ACTIONS
  // =====================================
  const handleOpenNewPost = () => {
    setEditingPost({
      title: '',
      slug: '',
      category: categories[0]?.slug || 'general',
      tags: [],
      coverImage: media[0]?.url || '/assets/slides/10-all-services.webp',
      excerpt: '',
      content: '',
      status: 'draft',
      readTime: '4 دقائق',
      featured: false,
    });
    setPostModalOpen(true);
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost({ ...post });
    setPostModalOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost?.title || !editingPost?.content) {
      showFeedback('يرجى كتابة عنوان المقال والمحتوى', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingPost.id) {
        await api.updatePost(editingPost.id, editingPost);
        showFeedback('تم تحديث المقال بنجاح');
      } else {
        await api.createPost(editingPost);
        showFeedback('تم إنشاء المقال ونشره بنجاح');
      }
      setPostModalOpen(false);
      setEditingPost(null);
      const res = await api.getAdminPosts();
      setPosts(res.posts || []);
    } catch (err: any) {
      showFeedback(err.message || 'حدث خطأ أثناء حفظ المقال', 'error');
    } finally {
      setSaving(false);
    }
  };

  const setPostStatus = async (post: BlogPost, status: BlogPost['status']) => {
    setUpdatingPost(post.id);
    try {
      const result = await api.updatePost(post.id, { status });
      setPosts((previous) => previous.map((item) => item.id === post.id ? result.post : item));
      showFeedback(status === 'published' ? 'تم نشر المقال.' : 'تم إخفاء المقال.');
    } catch {
      showFeedback('تعذّر تغيير حالة المقال.', 'error');
    } finally {
      setUpdatingPost(undefined);
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      await api.deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      showFeedback('تم حذف المقال');
    } catch (err: any) {
      showFeedback('فشل حذف المقال', 'error');
    }
  };

  // =====================================
  // CATEGORY ACTIONS
  // =====================================
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;

    setSaving(true);
    try {
      if (editingCategory.id) {
        await api.updateCategory(editingCategory.id, editingCategory);
        showFeedback('تم تحديث التصنيف');
      } else {
        await api.createCategory(editingCategory);
        showFeedback('تم إنشاء التصنيف');
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      const res = await api.getCategories();
      setCategories(res.categories || []);
    } catch (err: any) {
      showFeedback(err.message || 'فشل حفظ التصنيف', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showFeedback('تم حذف التصنيف');
    } catch (err: any) {
      showFeedback(err.message || 'فشل حذف التصنيف', 'error');
    }
  };

  // =====================================
  // MEDIA ACTIONS
  // =====================================
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.uploadMedia(file, file.name);
      setMedia((prev) => [res.asset, ...prev]);
      showFeedback('تم رفع الصورة بنجاح');
    } catch (err: any) {
      showFeedback(err.message || 'فشل رفع الملف', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (id: string) => {
    try {
      await api.deleteMedia(id);
      setMedia((prev) => prev.filter((m) => m.id !== id));
      showFeedback('تم حذف الصورة');
    } catch (err: any) {
      showFeedback('فشل حذف الصورة', 'error');
    }
  };

  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showFeedback('تم نسخ رابط الصورة');
  };

  const insertMarkdownSnippet = (snippet: string) => {
    if (!editingPost) return;
    const current = editingPost.content || '';
    setEditingPost({
      ...editingPost,
      content: `${current}\n\n${snippet}\n`,
    });
  };

  // Sidebar Navigation Items
  const navItems = [
    { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
    { id: 'theme', label: 'إدارة المظهر والهوية البصرية', icon: Palette },
    { id: 'chat', label: 'الدردشة الحية', icon: MessageSquare, count: unreadChatCount, badge: chatStatus.adminOnline ? 'مباشر' : undefined },
    { id: 'mailbox', label: 'طلبات الموقع والرسائل', icon: Mail, count: unreadMailCount },
    { id: 'site_editor', label: 'واجهة الموقع', icon: Globe2 },
    { id: 'seo', label: 'الظهور في البحث', icon: Search },
    { id: 'services', label: 'أقسام الموقع والخدمات', icon: Briefcase, count: services.length },
    { id: 'posts', label: 'المقالات والتدوين', icon: FileText, count: posts.length },
    { id: 'categories', label: 'المواضيع والتصنيفات', icon: FolderTree, count: categories.length },
    { id: 'media', label: 'مكتبة الوسائط والصور', icon: ImageIcon, count: media.length },
    { id: 'users', label: 'المستخدمون والصلاحيات', icon: User, count: recoveryCount },
    { id: 'settings', label: 'الحساب والإعدادات', icon: Settings },
  ].filter(({ id }) =>
    isOwner ||
    (id === 'theme' && (isOwner || (account as any)?.role === 'superadmin' || (account as any)?.permissions?.allowed?.includes('theme.view'))) ||
    (id === 'users' && (isOwner || (account as any)?.role === 'superadmin' || (account as any)?.permissions?.allowed?.includes('admin.users.manage'))) ||
    (account?.grants || (account?.access ? [account.access] : [])).some(access =>
      access === 'support' ? ['chat','mailbox'].includes(id)
      : access === 'content' ? ['site_editor','theme','seo','services','posts','categories','media'].includes(id)
      : access === 'analytics' && id === 'overview'
    )
  );

  const hasCrmAccess =
    isOwner ||
    (account as any)?.role === 'superadmin' ||
    (account as any)?.systemAccess === 'both' ||
    (account as any)?.systemAccess === 'crm' ||
    ['crm_manager', 'flight_agent', 'hotel_agent', 'residence_agent', 'accountant', 'support_agent'].includes((account as any)?.role || '');

  const crmMenuLink = hasCrmAccess && (
    <a href="/admin/login?next=crm" className="mt-3 flex items-center gap-3 rounded-xl border border-[#E3C88F] bg-[#FFF9ED] px-3.5 py-3 text-sm font-bold text-[#0B2E57] hover:bg-[#F9ECD2]">
      <Briefcase className="h-4 w-4" aria-hidden="true" />
      الدخول إلى نظام CRM
    </a>
  );
  const visibleTab = navItems.some((item) => item.id === activeTab) ? activeTab : null;

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#0B2E57] flex flex-col font-sans" dir="rtl">
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-bold text-white transition-all ${
            feedbackMsg.type === 'success' ? 'bg-[#CC9048]' : 'bg-red-600'
          }`}
        >
          {feedbackMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* AdminLTE 4 Top Navbar */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-[#0E4B87] via-[#0B2E57] to-[#0E4B87] text-white shadow-md border-b border-blue-900/50">
        <div className="px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between">
          {/* Brand & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-white/10 text-white hover:bg-white/20"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <BrandLogo
                background="blue"
                orientation="horizontal"
                size="lg"
                className="h-11 sm:h-13 md:h-14 w-auto max-w-[220px] object-contain transition-transform duration-200 hover:scale-105 drop-shadow-sm"
              />
              <span className="hidden sm:inline-block mr-1 text-[11px] px-2.5 py-1 rounded-full bg-[#CC9048] text-slate-950 font-black shadow-xs">
                لوحة الإدارة
              </span>
            </div>
          </div>

          {/* Quick Actions & Admin Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cross-App Switcher Buttons */}
            <div className="hidden lg:flex items-center gap-1.5 bg-black/20 p-1 rounded-xl border border-white/10 text-xs font-bold">
              <button
                type="button"
                onClick={() => onNavigate('/')}
                className="px-2.5 py-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                title="عرض الموقع العام"
              >
                <span>🌐</span>
                <span>الموقع العام</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/hub')}
                className="px-2.5 py-1 rounded-lg text-[#E3C88F] hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                title="بوابة HUB الموحدة"
              >
                <span>🏛️</span>
                <span>HUB</span>
              </button>

              {hasCrmAccess && (
                <a
                  href="/admin/login?next=crm"
                  className="px-2.5 py-1 rounded-lg text-white bg-[#004AA5] hover:bg-[#0B70DD] transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                  title="فتح نظام إدارة العملاء CRM"
                >
                  <Briefcase className="w-3.5 h-3.5 text-[#E3C88F]" />
                  <span>فتح CRM ↗</span>
                </a>
              )}
            </div>
            {/* Online/Offline Status Toggle */}
            <button
              hidden={!canSupport}
              onClick={handleToggleOnline}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                chatStatus.adminOnline
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
              title="تغيير حالة اتصال المدير في الشات"
            >
              <Power className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {chatStatus.adminOnline ? '🟢 متصل الآن للدردشة' : '🔴 أوفلاين'}
              </span>
            </button>

            {/* Live Preview Button */}
            <button
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
              title="معاينة حية للموقع"
            >
              <Eye className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">معاينة حية</span>
            </button>

            <button
              onClick={() => onNavigate('/blog')}
              className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
            >
              <span>المدونة</span>
            </button>

            {/* Live Chat Shortcut with Unread Badge */}
            <button
              hidden={!canSupport}
              onClick={() => setActiveTab('chat')}
              className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="الدردشة الحية المباشرة"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                  {unreadChatCount}
                </span>
              )}
            </button>

            {/* Notifications Icon (Unified Inbox & Mailbox) */}
            <button
              hidden={!canSupport}
              onClick={() => setActiveTab('mailbox')}
              className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="طلبات الموقع والرسائل"
            >
              <Bell className="w-4 h-4" />
              {unreadMailCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                  {unreadMailCount}
                </span>
              )}
            </button>

            <div className="h-6 w-px bg-white/20 mx-1 hidden sm:block" />

            {/* General Manager Identity */}
            <div
              onClick={isOwner ? () => setActiveTab('settings') : undefined}
              className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <img
                src={settings?.founderImage || '/assets/founder-rachid-elfazni-v2.webp'}
                alt="رشيد الفزني"
                className="w-8 h-8 rounded-full object-cover border border-amber-400"
              />
              <div className="hidden lg:block text-right">
                <div className="text-xs font-bold text-white">{account?.displayName}</div>
                <div className="text-[10px] text-amber-300">{isOwner ? 'المدير العام' : 'عضو الفريق'}</div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="تسجيل الخروج"
              className="p-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Body: Sidebar + Main Stage */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:flex w-72 bg-white border-l border-slate-200 flex-col justify-between py-5 shrink-0">
          <div className="px-3.5 space-y-1">
            <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              الفزني للخدمات · الإدارة
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <React.Fragment key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id as AdminTab);
                      if (item.id === 'posts') setBlogSubTab('all_posts');
                      if (item.id === 'categories') setBlogSubTab('categories_tags');
                      if (item.id === 'media') setBlogSubTab('media_library');
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-right ${
                      isActive
                        ? 'bg-[#004AA5] text-white shadow-md shadow-[#004AA5]/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-[#004AA5]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {typeof item.count === 'number' && item.count > 0 && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                    {item.badge && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold bg-emerald-500 text-white animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Expandable Blog Subroutes under Posts */}
                  {item.id === 'posts' &&
                    (activeTab === 'posts' || activeTab === 'categories' || activeTab === 'media') && (
                      <div className="ps-6 pe-2 py-1 space-y-1 border-s-2 border-[#004AA5]/20 ms-4">
                        {(
                          [
                            { sub: 'all_posts', label: 'جميع المقالات' },
                            { sub: 'new_post', label: '✍️ مقال جديد (محرر Word)' },
                            { sub: 'drafts', label: 'المسودات' },
                            { sub: 'scheduled', label: 'المجدولة' },
                            { sub: 'categories_tags', label: 'التصنيفات والوسوم' },
                            { sub: 'media_library', label: 'مكتبة الوسائط' },
                            { sub: 'templates', label: 'قوالب المقالات' },
                            { sub: 'blog_settings', label: 'إعدادات المدونة' },
                          ] as Array<{ sub: BlogCmsSubTab; label: string }>
                        ).map((subItem) => (
                          <button
                            key={subItem.sub}
                            type="button"
                            onClick={() => {
                              setActiveTab('posts');
                              setBlogSubTab(subItem.sub);
                            }}
                            className={`w-full text-right px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                              blogSubTab === subItem.sub && activeTab === 'posts'
                                ? 'bg-[#EAF4FF] text-[#004AA5]'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-[#0B2E57]'
                            }`}
                          >
                            {subItem.label}
                          </button>
                        ))}
                      </div>
                    )}

                  {/* Expandable Theme & Appearance Subroutes */}
                  {item.id === 'theme' && activeTab === 'theme' && (
                    <div className="ps-6 pe-2 py-1 space-y-1 border-s-2 border-[#004AA5]/20 ms-4">
                      {(
                        [
                          { sub: 'overview', label: '1.1 نظرة عامة' },
                          { sub: 'website', label: '1.2 مظهر الموقع الإلكتروني' },
                          { sub: 'portal', label: '1.3 مظهر البوابة الرئيسية (HUB / Workspace)' },
                          { sub: 'admin_login', label: '1.4 مظهر تسجيل دخول الإدارة' },
                          { sub: 'crm_login', label: '1.5 مظهر تسجيل دخول CRM' },
                          { sub: 'brand_global', label: '1.6 الهوية البصرية العامة' },
                          { sub: 'media_library', label: '1.7 مكتبة الصور والشعارات' },
                          { sub: 'presets', label: '1.8 القوالب الجاهزة' },
                          { sub: 'history', label: '1.9 سجل التعديلات والنسخ' },
                        ] as Array<{ sub: ThemeSubTab; label: string }>
                      ).map((subItem) => (
                        <button
                          key={subItem.sub}
                          type="button"
                          onClick={() => {
                            setActiveTab('theme');
                            setThemeSubTab(subItem.sub);
                          }}
                          className={`w-full text-right px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            themeSubTab === subItem.sub && activeTab === 'theme'
                              ? 'bg-[#EAF4FF] text-[#004AA5]'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-[#0B2E57]'
                          }`}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
            <a className="block rounded-xl border p-3 my-3" href="/workspace">مساحة العمل · جميع الأنظمة</a>{crmMenuLink}
          </div>

          <div className="px-4 pt-4 border-t border-slate-100">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">الحساب النشط</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500 font-mono">{account?.username}</p>
            </div>
          </div>
        </aside>

        {/* Sidebar (Mobile Drawer) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-72 bg-white h-full z-50 p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <span className="font-bold text-sm text-[#0B2E57]">قائمة الإدارة</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as AdminTab);
                          if (item.id === 'theme') setThemeSubTab('overview');
                          if (item.id === 'posts') setBlogSubTab('all_posts');
                          if (item.id === 'categories') setBlogSubTab('categories_tags');
                          if (item.id === 'media') setBlogSubTab('media_library');
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                          isActive
                            ? 'bg-[#004AA5] text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                        {typeof item.count === 'number' && item.count > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <a className="block rounded-xl border p-3 my-3" href="/workspace">مساحة العمل · جميع الأنظمة</a>{crmMenuLink}
                </div>
              </div>

              <button
                onClick={onLogout}
                className="w-full py-2.5 px-4 rounded-xl bg-red-50 text-red-600 font-bold text-xs flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Stage View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {visibleTab === 'overview' && (
            <>
              {isOwner && <section className="admin-workspace-intro" aria-labelledby="workspace-heading">
                <div className="admin-workspace-heading">
                  <div>
                    <p className="admin-entry-kicker">الفزني للخدمات</p>
                    <h1 id="workspace-heading" className="admin-workspace-title">مساحة العمل</h1>
                    <p className="text-sm text-[#52657E]">راجع الرسائل والطلبات وانتقل إلى نظام الحجوزات.</p>
                  </div>
                  <BrandLogo background="white" orientation="vertical" size={105} className="h-26 sm:h-28 w-auto drop-shadow-sm" />
                </div>
                <div className="admin-workspace-links">
                  <button type="button" onClick={() => setActiveTab('chat')} className="admin-workspace-link">
                    <MessageSquare aria-hidden="true" size={19} /><span>رسائل الدردشة غير المقروءة</span><strong>{unreadChatCount}</strong>
                  </button>
                  <button type="button" onClick={() => setActiveTab('mailbox')} className="admin-workspace-link">
                    <Mail aria-hidden="true" size={19} /><span>تذاكر البريد الجديدة</span><strong>{unreadMailCount}</strong>
                  </button>
                  {hasCrmAccess && (
                    <a href="/admin/login?next=crm" className="admin-workspace-link admin-workspace-crm">
                      <Briefcase aria-hidden="true" size={19} /><span>الدخول إلى نظام CRM</span><span aria-hidden="true">↗</span>
                    </a>
                  )}
                </div>
              </section>}
              <AdminAnalytics />
            </>
          )}

          {/* TAB 2: LIVE CHAT */}
          {visibleTab === 'chat' && <AdminLiveChat />}

          {/* TAB 3: MAILBOX */}
          {visibleTab === 'mailbox' && <AdminMailbox />}

          {/* TAB 4: SITE UI VISUAL EDITOR */}
          {visibleTab === 'site_editor' && <AdminSiteEditor />}

          {/* TAB 4B: SEO & META MANAGEMENT */}
          {visibleTab === 'seo' && <AdminSeoManager />}

          {/* TAB 5: SECTIONS & SERVICES CRUD */}
          {visibleTab === 'services' && <AdminServicesEditor />}

          {/* TAB 6, 7, 8: COMPLETE BLOG CMS & WORD-LIKE VISUAL EDITOR */}
          {(visibleTab === 'posts' || visibleTab === 'categories' || visibleTab === 'media') && (
            <AdminBlogCms
              initialSubTab={
                visibleTab === 'categories'
                  ? 'categories_tags'
                  : visibleTab === 'media'
                  ? 'media_library'
                  : blogSubTab
              }
              posts={posts}
              categories={categories}
              media={media}
              onPostsChange={setPosts}
              onCategoriesChange={setCategories}
              onMediaChange={setMedia}
              onNavigatePublic={onNavigate}
              showFeedback={showFeedback}
            />
          )}

          {/* TAB 8B: ADVANCED THEME, BRANDING & APPEARANCE SYSTEM */}
          {visibleTab === 'theme' && (
            <AdminThemeManager
              initialSubTab={themeSubTab}
              onNavigatePublic={onNavigate}
            />
          )}

          {/* TAB 9: SETTINGS & BACKUP */}
          {visibleTab === 'users' && <AdminUsers />}
          {visibleTab === 'settings' && <AdminProfileSettings />}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT BLOG POST WITH LIVE PREVIEW */}
      {/* ======================================================== */}
      {postModalOpen && editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base text-[#0B2E57]">
                {editingPost.id ? 'تعديل المقال' : 'كتابة مقال جديد'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPostPreviewMode(postPreviewMode === 'desktop' ? 'mobile' : 'desktop')}
                  className="px-3 py-1 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700"
                >
                  معاينة: {postPreviewMode === 'desktop' ? 'كمبيوتر' : 'جوال'}
                </button>
                <button
                  onClick={() => setPostModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 cursor-pointer text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSavePost} className="p-6 overflow-y-auto space-y-5 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان المقال <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingPost.title || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  placeholder="مثال: الدليل الشامل لمواعيد القنصلية المغربية..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-[#004AA5]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف</label>
                  <select
                    value={editingPost.category || categories[0]?.slug}
                    onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حالة النشر</label>
                  <select
                    value={editingPost.status || 'draft'}
                    onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold bg-white"
                  >
                    <option value="published">منشور للعامة (Published)</option>
                    <option value="draft">مسودة خاصة (Draft)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت القراءة المقدر</label>
                  <input
                    type="text"
                    value={editingPost.readTime || '4 دقائق'}
                    onChange={(e) => setEditingPost({ ...editingPost, readTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Cover Image Picker with Device Upload Option */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رابط الصورة البارزة (Cover Image)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingPost.coverImage || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, coverImage: e.target.value })}
                    placeholder="/assets/... أو رابط مباشر"
                    dir="ltr"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setMediaPickerOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer shrink-0"
                  >
                    اختيار من المكتبة
                  </button>
                </div>
                {editingPost.coverImage && (
                  <div className="mt-2 w-36 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={editingPost.coverImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الملخص التمهيدي (Excerpt)</label>
                <textarea
                  rows={2}
                  value={editingPost.excerpt || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                  placeholder="وصف مختصر يظهر في بطاقة المقال وفي نتائج محركات البحث..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium"
                />
              </div>

              {/* Content Editor with Formatting Helpers */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-700">
                    محتوى المقال الكامل <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => insertMarkdownSnippet('## عنوان رئيسي جديد')}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                    >
                      عنوان H2
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdownSnippet('### عنوان فرعي')}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                    >
                      عنوان H3
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdownSnippet('- نقطة أولى\n- نقطة ثانية')}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                    >
                      قائمة نقاط
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdownSnippet('> تنبيه أو ملاحظة استشارية هامة')}
                      className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                    >
                      صندوق تنبيه
                    </button>
                  </div>
                </div>
                <textarea
                  required
                  rows={10}
                  value={editingPost.content || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  placeholder="اكتب تفاصيل المقال هنا بتنسيق واضح، استخدم العناوين والنقاط..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 font-sans text-sm leading-relaxed"
                />
              </div>

              {/* Tags & Featured */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الكلمات الدلالية (Tags مفصولة بفواصل)
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(editingPost.tags) ? editingPost.tags.join(', ') : ''}
                    onChange={(e) =>
                      setEditingPost({
                        ...editingPost,
                        tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                      })
                    }
                    placeholder="مواعيد قنصلية, جواز السفر, إسطنبول"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="featuredPostCheck"
                    checked={Boolean(editingPost.featured)}
                    onChange={(e) => setEditingPost({ ...editingPost, featured: e.target.checked })}
                    className="w-4 h-4 text-[#004AA5] rounded"
                  />
                  <label htmlFor="featuredPostCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                    تمييز هذا المقال في صدارة المدونة (Featured Hero)
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setPostModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#004AA5] hover:bg-[#0B2E57] text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : editingPost.id ? 'حفظ التعديلات' : 'نشر المقال'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MEDIA PICKER */}
      {mediaPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl p-6 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-[#0B2E57]">اختر صورة من مكتبة الوسائط</h4>
              <button onClick={() => setMediaPickerOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-4 overflow-y-auto flex-1">
              {media.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => {
                    if (editingPost) {
                      setEditingPost({ ...editingPost, coverImage: asset.url });
                    }
                    setMediaPickerOpen(false);
                  }}
                  className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-[#004AA5] cursor-pointer bg-slate-100 relative group"
                >
                  <img src={asset.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                    اختيار
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>رفع صورة من جهازك</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
              <button
                type="button"
                onClick={() => setMediaPickerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CATEGORY EDIT */}
      {categoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-[#0B2E57]">
                {editingCategory.id ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}
              </h4>
              <button onClick={() => setCategoryModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم التصنيف بالعربية</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="مثال: الإقامات والتأشيرات"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الرابط اللاتيني (Slug)</label>
                <input
                  type="text"
                  value={editingCategory.slug || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  placeholder="residency"
                  dir="ltr"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف موجز</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#004AA5] text-white text-xs font-bold shadow-md"
                >
                  حفظ التصنيف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
