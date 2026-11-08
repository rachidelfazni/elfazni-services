/**
 * ELFAZNI SERVICES - API Client
 */

export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  grants?: ('content' | 'support' | 'analytics')[];
  readOnly?: boolean;
  sessionVersion?: number;
  displayName: string;
  role: string;
  access?: 'content' | 'support' | 'analytics';
  email: string;
}

export type BlogLanguage = 'ar' | 'en' | 'fr';
export type BlogStatus = 'published' | 'draft' | 'in_review' | 'scheduled' | 'archived' | 'trash';

export interface BlogCategory {
  id: string;
  slug: string;
  name: string;
  nameEn?: string;
  nameFr?: string;
  description: string;
  descriptionEn?: string;
  descriptionFr?: string;
  color: string;
  postCount?: number;
}

export interface BlogTag {
  id: string;
  slug: string;
  name: string;
  nameEn?: string;
  nameFr?: string;
  postCount?: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  editorDocumentJson?: string;
  schemaVersion?: number;
  language?: BlogLanguage;
  translationGroupId?: string;
  category: string;
  tags: string[];
  coverImage: string;
  coverImageAlt?: string;
  status: BlogStatus;
  author: string;
  readTime: string;
  views: number;
  engagedReads?: number;
  sharesCount?: number;
  consultClicks?: number;
  featured?: boolean;
  /** Optional downloadable resource (e.g. branded PDF guide) shown as a banner. */
  pdfUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  scheduledAt?: string;
  timezone?: string;
  revision?: number;
  relatedPostIds?: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface BlogRevision {
  id: string;
  postId: string;
  revision: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  editorDocumentJson?: string;
  status: BlogStatus;
  author: string;
  createdAt: string;
  summary?: string;
}

export interface BlogTemplate {
  id: string;
  name: string;
  nameEn?: string;
  nameFr?: string;
  description: string;
  category: string;
  language: BlogLanguage;
  titleTemplate: string;
  excerptTemplate: string;
  contentHtml: string;
  tags: string[];
}

export interface BlogSettings {
  defaultLanguage: BlogLanguage;
  postsPerPage: number;
  defaultAuthor: string;
  defaultCoverImage: string;
  enableCommentsNote: boolean;
  enableReadingTime: boolean;
  enableTableOfContents: boolean;
  enableShareButtons: boolean;
  enableWhatsappCta: boolean;
  blogTitleAr: string;
  blogTitleEn: string;
  blogTitleFr: string;
  blogSubtitleAr: string;
  blogSubtitleEn: string;
  blogSubtitleFr: string;
  timezone: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  altText: string;
  caption?: string;
  width?: number;
  height?: number;
  usedInPosts?: Array<{ id: string; title: string; slug: string }>;
  createdAt: string;
}

export interface SiteService {
  id: string;
  key: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  image: string;
  active: boolean;
  sortOrder: number;
  featured: boolean;
}

export interface SiteSettings {
  sectionTitles?: Record<string, Partial<Record<'ar' | 'en' | 'fr' | 'tr', string>>>;
  sectionOrder?: string[];
  faqItems?: Array<{ q: string; a: string; qEn: string; aEn: string; qFr: string; aFr: string; qTr: string; aTr: string }>;
  heroTitle?: Partial<Record<'ar' | 'en' | 'fr' | 'tr', string>>;
  heroDescription?: Partial<Record<'ar' | 'en' | 'fr' | 'tr', string>>;

  hiddenSections?: import('../data/siteVisibility').HomepageSection[];
  siteNameAr: string;
  siteNameEn: string;
  taglineAr: string;
  phone: string;
  whatsapp: string;
  whatsappRaw: string;
  email: string;
  addressAr: string;
  workingHoursAr: string;
  instagram: string;
  facebook: string;
  founderName: string;
  founderTitleAr: string;
  founderBioAr: string;
  founderImage: string;
}

export interface MailboxReply {
  id: string;
  sender: 'admin' | 'visitor';
  authorName: string;
  message: string;
  sentAt: string;
  channel: 'site' | 'email' | 'whatsapp';
}

export interface MailboxAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export type ServiceTag = 'FLIGHT' | 'HOTEL' | 'TRANSFER' | 'CONSULAR' | 'GENERAL' | 'OFFLINE_CHAT';

export type FollowUpStatus =
  | 'NEW'
  | 'FOLLOW_UP_REQUIRED'
  | 'IN_PROGRESS'
  | 'WAITING_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED';

export type RequestSource =
  | 'website_form'
  | 'live_chat'
  | 'offline_chat'
  | 'whatsapp_handoff'
  | 'email';

export interface InternalNote {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

export interface ActivityTimelineItem {
  id: string;
  action: string;
  actor: string;
  details?: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  ticketNumber: string;
  reference?: string;
  name: string;
  phone: string;
  whatsappPhone?: string;
  email?: string;
  serviceRequested?: string;
  serviceTag?: ServiceTag;
  followUpStatus?: FollowUpStatus;
  needsFollowUp?: boolean;
  requestSource?: RequestSource;
  assignedTo?: string;
  subject?: string;
  message: string;
  payloadJson?: Record<string, any>;
  chatSessionId?: string;
  internalNotes?: InternalNote[];
  activityTimeline?: ActivityTimelineItem[];
  emailDeliveryStatus?: 'queued' | 'sent' | 'not_configured' | 'failed';
  folder: 'inbox' | 'starred' | 'sent' | 'in_progress' | 'resolved' | 'trash';
  status: 'new' | 'read' | 'in_progress' | 'resolved' | 'archived';
  starred: boolean;
  country?: string;
  attachments?: MailboxAttachment[];
  replies?: MailboxReply[];
  source: string;
  createdAt: string;
  updatedAt?: string;
}

export type ServiceRequest = ContactMessage;

export interface ChatStatus {
  adminOnline: boolean;
  lastActive: string;
  updatedBy?: string;
}

export interface ChatSession {
  id: string;
  visitorId: string;
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  visitorCountry?: string;
  currentPage?: string;
  unreadAdmin: number;
  unreadVisitor: number;
  createdAt: string;
  lastMessageAt: string;
  status: 'active' | 'closed';
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  sender: 'admin' | 'visitor';
  senderName: string;
  text: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface AnalyticsCountry {
  code: string;
  name: string;
  flag: string;
  city: string;
  visits: number;
  percentage: number;
}

export interface VisitorLogEntry {
  id: string;
  country: string;
  flag: string;
  city: string;
  device: string;
  browser: string;
  page: string;
  time: string;
  action: string;
}

export interface TrafficDataPoint {
  label: string;
  visits: number;
  chats: number;
  messages: number;
}

export interface TrafficPeriods {
  daily: TrafficDataPoint[];
  weekly: TrafficDataPoint[];
  monthly: TrafficDataPoint[];
  yearly: TrafficDataPoint[];
}

export interface PageSeoItem {
  id: string;
  pagePath: string;
  pageNameAr: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  canonicalUrl: string;
  robots: string;
  updatedAt: string;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  /** "task" = مهمة، "reminder" = تذكير */
  kind?: 'task' | 'reminder';
  /** وقت التذكير HH:mm (اختياري) */
  time?: string;
}

export interface AnalyticsState {
  totalVisits: number;
  uniqueVisitors: number;
  activeVisitors: number;
  topCountries: AnalyticsCountry[];
  recentVisits: VisitorLogEntry[];
  trafficHistory: TrafficDataPoint[];
  trafficPeriods?: TrafficPeriods;
  visitTimestamps?: string[];
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  todoList: TodoItem[];
}

export interface BlogPostMetric {
  id: string;
  title: string;
  slug: string;
  category: string;
  coverImage: string;
  status: BlogStatus;
  readTime: string;
  publishedAt: string;
  views: number;
  engagementRate: number;
  avgDuration: string;
  consultRequests: number;
  shares: number;
}

export interface BlogAnalyticsSummary {
  totalPosts: number;
  totalViews: number;
  avgViewsPerPost: number;
  avgEngagementRate: number;
  topPost: BlogPostMetric | null;
}

export interface AdminStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalCategories: number;
  totalMedia: number;
  totalMessages: number;
  newMessages: number;
}

const TOKEN_KEY = 'elfazni_auth_token';

export const api = {
  // Token management
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setToken(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },

  removeToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const isGet = !options.method || options.method.toUpperCase() === 'GET';
    const sep = endpoint.includes('?') ? '&' : '?';
    const finalUrl = isGet ? `/api${endpoint}${sep}_t=${Date.now()}` : `/api${endpoint}`;

    const res = await fetch(finalUrl, {
      ...options,
      cache: 'no-store',
      headers,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const err: any = new Error(data?.error || 'حدث خطأ أثناء الاتصال بالخادم');
      err.status = res.status;
      err.data = data;
      throw err;
    }

    if (data === null) throw new Error('رد الخادم غير صالح. تأكد من تشغيل خادم الموقع.');
    return data as T;
  },

  // Auth
  async login(username: string, password: string, purpose?: 'crm'): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, purpose }),
    });
    this.setToken(data.token);
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  },

  logout() {
    this.removeToken();
    void this.request('/auth/logout', { method: 'POST' }).catch(() => {});
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Posts
  async getPosts(category?: string, search?: string, limit?: number, language?: string, tag?: string): Promise<{ posts: BlogPost[] }> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('search', search);
    if (limit) params.append('limit', String(limit));
    if (language && language !== 'all') params.append('language', language);
    if (tag) params.append('tag', tag);
    return this.request<{ posts: BlogPost[] }>(`/posts?${params.toString()}`);
  },

  async getPostBySlug(
    slug: string,
    preview?: boolean
  ): Promise<{
    post: BlogPost;
    related: BlogPost[];
    translations?: Array<{ id: string; slug: string; title: string; language: BlogLanguage }>;
    isPreview?: boolean;
  }> {
    const q = preview ? '?preview=1' : '';
    return this.request(`/posts/${encodeURIComponent(slug)}${q}`);
  },

  async getAdminPosts(): Promise<{ posts: BlogPost[] }> {
    return this.request<{ posts: BlogPost[] }>('/admin/posts');
  },

  async getAdminPost(id: string): Promise<{
    post: BlogPost;
    revisions: BlogRevision[];
    translations: Array<{ id: string; slug: string; title: string; language: BlogLanguage; status: BlogStatus }>;
  }> {
    return this.request(`/admin/posts/${encodeURIComponent(id)}`);
  },

  async createPost(postData: Partial<BlogPost>): Promise<{ success: boolean; post: BlogPost }> {
    return this.request<{ success: boolean; post: BlogPost }>('/admin/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  },

  async updatePost(
    id: string,
    postData: Partial<BlogPost> & { expectedRevision?: number; revisionSummary?: string }
  ): Promise<{ success: boolean; post: BlogPost }> {
    return this.request<{ success: boolean; post: BlogPost }>(`/admin/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  },

  async duplicatePost(
    id: string,
    options?: { language?: BlogLanguage; asTranslation?: boolean }
  ): Promise<{ success: boolean; post: BlogPost }> {
    return this.request<{ success: boolean; post: BlogPost }>(`/admin/posts/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  },

  async getPostRevisions(id: string): Promise<{ revisions: BlogRevision[] }> {
    return this.request<{ revisions: BlogRevision[] }>(`/admin/posts/${id}/revisions`);
  },

  async restorePostRevision(postId: string, revisionId: string): Promise<{ success: boolean; post: BlogPost }> {
    return this.request<{ success: boolean; post: BlogPost }>(`/admin/posts/${postId}/revisions/${revisionId}/restore`, {
      method: 'POST',
    });
  },

  async bulkUpdatePosts(
    ids: string[],
    action: 'publish' | 'draft' | 'archive' | 'trash' | 'delete'
  ): Promise<{ success: boolean; updatedCount: number }> {
    return this.request<{ success: boolean; updatedCount: number }>('/admin/posts/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids, action }),
    });
  },

  async deletePost(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/posts/${id}`, {
      method: 'DELETE',
    });
  },

  // Categories
  async getCategories(): Promise<{ categories: BlogCategory[] }> {
    return this.request<{ categories: BlogCategory[] }>('/categories');
  },

  async createCategory(catData: Partial<BlogCategory>): Promise<{ success: boolean; category: BlogCategory }> {
    return this.request<{ success: boolean; category: BlogCategory }>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(catData),
    });
  },

  async updateCategory(id: string, catData: Partial<BlogCategory>): Promise<{ success: boolean; category: BlogCategory }> {
    return this.request<{ success: boolean; category: BlogCategory }>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(catData),
    });
  },

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Tags
  async getTags(): Promise<{ tags: BlogTag[] }> {
    return this.request<{ tags: BlogTag[] }>('/tags');
  },

  async createTag(tagData: Partial<BlogTag>): Promise<{ success: boolean; tag: BlogTag }> {
    return this.request<{ success: boolean; tag: BlogTag }>('/admin/tags', {
      method: 'POST',
      body: JSON.stringify(tagData),
    });
  },

  async updateTag(id: string, tagData: Partial<BlogTag>): Promise<{ success: boolean; tag: BlogTag }> {
    return this.request<{ success: boolean; tag: BlogTag }>(`/admin/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tagData),
    });
  },

  async deleteTag(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/tags/${id}`, {
      method: 'DELETE',
    });
  },

  // Article Templates
  async getTemplates(): Promise<{ templates: BlogTemplate[] }> {
    return this.request<{ templates: BlogTemplate[] }>('/admin/templates');
  },

  async createTemplate(tplData: Partial<BlogTemplate>): Promise<{ success: boolean; template: BlogTemplate }> {
    return this.request<{ success: boolean; template: BlogTemplate }>('/admin/templates', {
      method: 'POST',
      body: JSON.stringify(tplData),
    });
  },

  async updateTemplate(id: string, tplData: Partial<BlogTemplate>): Promise<{ success: boolean; template: BlogTemplate }> {
    return this.request<{ success: boolean; template: BlogTemplate }>(`/admin/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tplData),
    });
  },

  async deleteTemplate(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/templates/${id}`, {
      method: 'DELETE',
    });
  },

  // Blog Settings
  async getBlogSettings(): Promise<{ blogSettings: BlogSettings }> {
    return this.request<{ blogSettings: BlogSettings }>('/blog-settings');
  },

  async updateBlogSettings(data: Partial<BlogSettings>): Promise<{ success: boolean; blogSettings: BlogSettings }> {
    return this.request<{ success: boolean; blogSettings: BlogSettings }>('/admin/blog-settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Media
  async getMedia(): Promise<{ media: MediaAsset[] }> {
    return this.request<{ media: MediaAsset[] }>('/admin/media');
  },

  async uploadMedia(file: File, altText?: string, caption?: string): Promise<{ success: boolean; asset: MediaAsset }> {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) formData.append('altText', altText);
    if (caption) formData.append('caption', caption);
    return this.request<{ success: boolean; asset: MediaAsset }>('/admin/media/upload', {
      method: 'POST',
      body: formData,
    });
  },

  uploadMediaWithProgress(
    file: File,
    altText?: string,
    caption?: string,
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; asset: MediaAsset }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);
      if (altText) formData.append('altText', altText);
      if (caption) formData.append('caption', caption);

      xhr.open('POST', '/api/admin/media/upload', true);
      const token = this.getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            onProgress(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
          }
        };
      }

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText || '{}');
          if (xhr.status >= 200 && xhr.status < 300 && data?.asset) {
            onProgress?.(100);
            resolve(data);
          } else {
            reject(new Error(data?.error || 'فشل رفع الملف'));
          }
        } catch {
          reject(new Error('استجابة غير صالحة من الخادم أثناء رفع الملف'));
        }
      };

      xhr.onerror = () => reject(new Error('تعذر الاتصال بالخادم أثناء رفع الملف'));
      xhr.send(formData);
    });
  },

  async updateMedia(
    id: string,
    updates: { altText?: string; caption?: string }
  ): Promise<{ success: boolean; asset: MediaAsset }> {
    return this.request<{ success: boolean; asset: MediaAsset }>(`/admin/media/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async deleteMedia(id: string, force: boolean = false): Promise<{ success: boolean; message: string }> {
    const q = force ? '?force=true' : '';
    return this.request<{ success: boolean; message: string }>(`/admin/media/${id}${q}`, {
      method: 'DELETE',
    });
  },

  // Services

  // Services
  async getServices(): Promise<{ services: SiteService[] }> {
    return this.request<{ services: SiteService[] }>('/services');
  },

  async getAdminServices(): Promise<{ services: SiteService[] }> {
    return this.request('/admin/services');
  },

  async createService(serviceData: Partial<SiteService>): Promise<{ success: boolean; service: SiteService }> {
    return this.request<{ success: boolean; service: SiteService }>('/admin/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  },

  async updateService(id: string, serviceData: Partial<SiteService>): Promise<{ success: boolean; service: SiteService }> {
    return this.request<{ success: boolean; service: SiteService }>(`/admin/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  },

  async deleteService(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/services/${id}`, {
      method: 'DELETE',
    });
  },

  // Settings
  async getSettings(): Promise<{ settings: SiteSettings }> {
    return this.request<{ settings: SiteSettings }>('/settings');
  },

  async updateSettings(settingsData: Partial<SiteSettings>): Promise<{ success: boolean; settings: SiteSettings }> {
    return this.request<{ success: boolean; settings: SiteSettings }>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  },

  // AdminLTE 4 Mailbox
  async submitMailboxMessage(data: {
    name: string;
    phone: string;
    email?: string;
    serviceRequested?: string;
    subject?: string;
    message: string;
    country?: string;
    flag?: string;
    city?: string;
    device?: string;
    browser?: string;
    visitorId?: string;
    screenW?: number;
    maxTouchPoints?: number;
    attachments?: Array<{ name: string; url: string; size?: number; type?: string }>;
    source?: string;
    notifyByEmail?: boolean;
  }): Promise<{ success: boolean; ticketNumber: string; message: string; emailStatus?: 'accepted' | 'not_configured' | 'failed' }> {
    return this.request<{ success: boolean; ticketNumber: string; message: string; emailStatus?: 'accepted' | 'not_configured' | 'failed' }>('/mailbox', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async submitServiceRequest(data: {
    name: string;
    phone: string;
    whatsappPhone?: string;
    email?: string;
    serviceTag: ServiceTag;
    serviceRequested?: string;
    subject?: string;
    message?: string;
    payloadJson?: Record<string, any>;
    source?: string;
    country?: string;
  }): Promise<{
    success: boolean;
    reference: string;
    ticketNumber: string;
    emailDeliveryStatus?: string;
    message: string;
    request: ContactMessage;
  }> {
    return this.request<{
      success: boolean;
      reference: string;
      ticketNumber: string;
      emailDeliveryStatus?: string;
      message: string;
      request: ContactMessage;
    }>('/public/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async submitOfflineMessage(data: {
    name: string;
    phone?: string;
    whatsappPhone?: string;
    email?: string;
    serviceCategory: string;
    message: string;
    visitorId: string;
    country?: string;
  }): Promise<{
    success: boolean;
    reference: string;
    ticketNumber: string;
    sessionId: string;
    emailDeliveryStatus?: string;
    message: string;
  }> {
    return this.request<{
      success: boolean;
      reference: string;
      ticketNumber: string;
      sessionId: string;
      emailDeliveryStatus?: string;
      message: string;
    }>('/public/offline-messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getMailbox(
    folder: string = 'inbox',
    search?: string,
    serviceTagOrFilters?:
      | string
      | {
          serviceTag?: string;
          followUpStatus?: string;
          source?: string;
          assignedTo?: string;
        },
    followUpStatus?: string,
    source?: string,
    assignedTo?: string
  ): Promise<{
    messages: ContactMessage[];
    counts: {
      inbox: number;
      starred: number;
      sent: number;
      in_progress: number;
      resolved: number;
      trash: number;
      total: number;
      newCount: number;
      followUpCount: number;
      byService: Record<string, number>;
      byStatus: Record<string, number>;
    };
  }> {
    const params = new URLSearchParams({ folder });
    if (search) params.append('search', search);

    if (serviceTagOrFilters && typeof serviceTagOrFilters === 'object') {
      if (serviceTagOrFilters.serviceTag && serviceTagOrFilters.serviceTag !== 'ALL') {
        params.append('serviceTag', serviceTagOrFilters.serviceTag);
      }
      if (serviceTagOrFilters.followUpStatus && serviceTagOrFilters.followUpStatus !== 'ALL') {
        params.append('followUpStatus', serviceTagOrFilters.followUpStatus);
      }
      if (serviceTagOrFilters.source && serviceTagOrFilters.source !== 'ALL') {
        params.append('source', serviceTagOrFilters.source);
      }
      if (serviceTagOrFilters.assignedTo && serviceTagOrFilters.assignedTo !== 'ALL') {
        params.append('assignedTo', serviceTagOrFilters.assignedTo);
      }
    } else {
      if (serviceTagOrFilters && serviceTagOrFilters !== 'ALL') {
        params.append('serviceTag', serviceTagOrFilters);
      }
      if (followUpStatus && followUpStatus !== 'ALL') {
        params.append('followUpStatus', followUpStatus);
      }
      if (source && source !== 'ALL') {
        params.append('source', source);
      }
      if (assignedTo && assignedTo !== 'ALL') {
        params.append('assignedTo', assignedTo);
      }
    }
    return this.request(`/admin/mailbox?${params.toString()}`);
  },

  async updateMailboxItem(
    id: string,
    updates: {
      starred?: boolean;
      folder?: string;
      status?: string;
      followUpStatus?: FollowUpStatus;
      needsFollowUp?: boolean;
      assignedTo?: string;
      note?: string;
    }
  ): Promise<{ success: boolean; message: ContactMessage }> {
    return this.request<{ success: boolean; message: ContactMessage }>(`/admin/mailbox/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async replyMailboxMessage(id: string, message: string, channel: 'site' | 'email' | 'whatsapp' = 'site'): Promise<{ success: boolean; message: ContactMessage; reply: MailboxReply }> {
    return this.request<{ success: boolean; message: ContactMessage; reply: MailboxReply }>(`/admin/mailbox/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message, channel }),
    });
  },

  async deleteMailboxMessage(id: string, permanent: boolean = false): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/mailbox/${id}?permanent=${permanent}`, {
      method: 'DELETE',
    });
  },

  // Legacy Inbox compatibility
  async submitContactForm(data: {
    name: string;
    phone: string;
    email?: string;
    serviceRequested?: string;
    message: string;
    source?: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/inbox', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getInbox(): Promise<{ messages: ContactMessage[] }> {
    return this.request<{ messages: ContactMessage[] }>('/admin/inbox');
  },

  async updateInboxStatus(id: string, status: string): Promise<{ success: boolean; message: ContactMessage }> {
    return this.request<{ success: boolean; message: ContactMessage }>(`/admin/inbox/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deleteInboxMessage(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/inbox/${id}`, {
      method: 'DELETE',
    });
  },

  // Real-time Live Chat
  async getChatStatus(): Promise<{ chatStatus: ChatStatus }> {
    return this.request<{ chatStatus: ChatStatus }>('/chat/status');
  },

  async updateChatStatus(adminOnline: boolean): Promise<{ success: boolean; chatStatus: ChatStatus }> {
    return this.request<{ success: boolean; chatStatus: ChatStatus }>('/admin/chat/status', {
      method: 'POST',
      body: JSON.stringify({ adminOnline }),
    });
  },

  async getChatSessions(visitorId?: string): Promise<{ sessions: ChatSession[] }> {
    const q = visitorId ? `?visitorId=${encodeURIComponent(visitorId)}` : '';
    return this.request<{ sessions: ChatSession[] }>(`/chat/sessions${q}`);
  },

  async createChatSession(
    data: Partial<ChatSession> & {
      device?: string;
      browser?: string;
      country?: string;
      flag?: string;
      city?: string;
      screenW?: number;
      maxTouchPoints?: number;
    }
  ): Promise<{ session: ChatSession }> {
    return this.request<{ session: ChatSession }>('/chat/sessions', {
      method: 'POST',
      keepalive: true,
      body: JSON.stringify(data),
    });
  },

  async getChatMessages(sessionId: string, visitorId?: string): Promise<{ messages: ChatMessage[] }> {
    return this.request<{ messages: ChatMessage[] }>(`/chat/messages/${sessionId}`, { headers: visitorId ? { 'X-Visitor-Id': visitorId } : {} });
  },

  async sendChatMessage(data: {
    sessionId?: string;
    sender: 'admin' | 'visitor';
    senderName?: string;
    text: string;
    attachmentUrl?: string;
    visitorId?: string;
    visitorPhone?: string;
    visitorCountry?: string;
    currentPage?: string;
    device?: string;
    browser?: string;
    country?: string;
    flag?: string;
    city?: string;
    screenW?: number;
    maxTouchPoints?: number;
  }): Promise<{ success: boolean; message: ChatMessage; session?: ChatSession }> {
    return this.request<{ success: boolean; message: ChatMessage; session?: ChatSession }>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async sendTypingIndicator(sessionId: string, sender: 'admin' | 'visitor', visitorId?: string): Promise<{ ok: boolean }> {
    return this.request<{ ok: boolean }>('/chat/typing', {
      method: 'POST',
      body: JSON.stringify({ sessionId, sender, visitorId }),
    });
  },

  async markChatRead(sessionId: string, reader: 'admin' | 'visitor', visitorId?: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/chat/messages/${sessionId}/read`, {
      method: 'POST',
      body: JSON.stringify({ reader, visitorId }),
    });
  },

  async deleteChatSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/admin/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },

  // AdminLTE 4 Analytics & To-Dos
  async getAnalytics(): Promise<{
    analytics: AnalyticsState;
    kpis: {
      totalVisits: number;
      totalLeads: number;
      uniqueVisitors: number;
      activeVisitors: number;
      unreadMessages: number;
    };
  }> {
    return this.request('/analytics');
  },

  async getBlogPostAnalytics(): Promise<{
    posts: BlogPostMetric[];
    summary: BlogAnalyticsSummary;
  }> {
    return this.request<{
      posts: BlogPostMetric[];
      summary: BlogAnalyticsSummary;
    }>('/admin/analytics/blog-posts');
  },

  async trackVisit(data: {
    visitorId?: string;
    country?: string;
    flag?: string;
    city?: string;
    device?: string;
    browser?: string;
    page?: string;
    action?: string;
    screenW?: number;
    maxTouchPoints?: number;
  }): Promise<{ success: boolean; totalVisits?: number }> {
    return this.request('/analytics/visit', {
      method: 'POST',
      keepalive: true,
      body: JSON.stringify(data),
    });
  },

  async sendHeartbeat(
    dataOrVisitorId:
      | string
      | {
          visitorId: string;
          country?: string;
          flag?: string;
          city?: string;
          device?: string;
          browser?: string;
          page?: string;
    durationSec?: number;
          screenW?: number;
          maxTouchPoints?: number;
        }
  ): Promise<{ activeVisitors: number }> {
    const payload =
      typeof dataOrVisitorId === 'string' ? { visitorId: dataOrVisitorId } : dataOrVisitorId;
    return this.request('/analytics/heartbeat', {
      method: 'POST',
      keepalive: true,
      body: JSON.stringify(payload),
    });
  },

  async trackPostAction(slug: string, type: 'engaged_read' | 'share' | 'consult_click'): Promise<{ success: boolean }> {
    return this.request('/analytics/post-action', {
      method: 'POST',
      body: JSON.stringify({ slug, type }),
    });
  },

  async resetAnalytics(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/admin/analytics/reset', {
      method: 'POST',
    });
  },

  async updateTodo(id: string, updates: Partial<TodoItem>): Promise<{ success: boolean; todoList: TodoItem[] }> {
    return this.request<{ success: boolean; todoList: TodoItem[] }>(`/admin/analytics/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async createTodo(data: { text: string; priority?: 'high' | 'medium' | 'low'; dueDate?: string; kind?: 'task' | 'reminder'; time?: string }): Promise<{ success: boolean; todoList: TodoItem[] }> {
    return this.request<{ success: boolean; todoList: TodoItem[] }>('/admin/analytics/todos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteTodo(id: string): Promise<{ success: boolean; todoList: TodoItem[] }> {
    return this.request<{ success: boolean; todoList: TodoItem[] }>(`/admin/analytics/todos/${id}`, {
      method: 'DELETE',
    });
  },

  // Backup Export & Import
  getBackupExportUrl(): string {
    return '/api/admin/backup/export';
  },

  async importBackup(data: any): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/admin/backup/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Dashboard Stats
  async getStats(): Promise<{
    stats: AdminStats;
    recentPosts: BlogPost[];
    recentMessages: ContactMessage[];
  }> {
    return this.request<{
      stats: AdminStats;
      recentPosts: BlogPost[];
      recentMessages: ContactMessage[];
    }>('/admin/stats');
  },

  // SEO & Meta Management
  async getSeoPages(): Promise<{ seoPages: PageSeoItem[] }> {
    return this.request<{ seoPages: PageSeoItem[] }>('/seo');
  },

  async updateSeoPage(
    id: string,
    data: Partial<PageSeoItem>
  ): Promise<{ success: boolean; seoPage: PageSeoItem; seoPages: PageSeoItem[] }> {
    return this.request<{ success: boolean; seoPage: PageSeoItem; seoPages: PageSeoItem[] }>(`/admin/seo/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async createSeoPage(
    data: Partial<PageSeoItem>
  ): Promise<{ success: boolean; seoPage: PageSeoItem; seoPages: PageSeoItem[] }> {
    return this.request<{ success: boolean; seoPage: PageSeoItem; seoPages: PageSeoItem[] }>('/admin/seo', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteSeoPage(id: string): Promise<{ success: boolean; seoPages: PageSeoItem[] }> {
    return this.request<{ success: boolean; seoPages: PageSeoItem[] }>(`/admin/seo/${id}`, {
      method: 'DELETE',
    });
  },
};
