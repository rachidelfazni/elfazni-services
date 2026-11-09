import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export type StaffAccess = 'content' | 'support' | 'analytics';

export type CanonicalRole =
  | 'superadmin'
  | 'crm_manager'
  | 'flight_agent'
  | 'hotel_agent'
  | 'residence_agent'
  | 'accountant'
  | 'support_agent'
  | 'editor'
  | 'auditor'
  | string;

export type UserDepartment =
  | 'flights'
  | 'hotels'
  | 'consular'
  | 'accounting'
  | 'support'
  | 'content'
  | 'general';

export type SystemAccessScope = 'crm' | 'admin' | 'both';

export interface UserPermissionsOverride {
  allowed: string[];
  denied: string[];
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: CanonicalRole;
  department?: UserDepartment;
  systemAccess?: SystemAccessScope;
  permissions?: UserPermissionsOverride;
  access?: StaffAccess;
  disabled?: boolean;
  avatarUrl?: string;
  phone?: string;
  grants?: ('content' | 'support' | 'analytics')[];
  readOnly?: boolean;
  sessionVersion?: number;
  displayName: string;
  email: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  nameAr: string;
  nameFr?: string;
  description: string;
  systemAccess: SystemAccessScope;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorUsername: string;
  action: string;
  targetType: 'user' | 'role' | 'permission' | 'system' | 'request';
  targetId?: string;
  details?: string;
  timestamp: string;
}

export interface PermissionDefinition {
  key: string;
  system: 'crm' | 'admin' | 'shared';
  module: string;
  action: string;
  labelAr: string;
  labelEn: string;
  description?: string;
}

export const PERMISSIONS_REGISTRY: PermissionDefinition[] = [
  // CRM - Dashboard
  { key: 'crm.dashboard.view', system: 'crm', module: 'dashboard', action: 'view', labelAr: 'عرض لوحة معلومات CRM', labelEn: 'View CRM Dashboard' },

  // CRM - Flights
  { key: 'crm.flights.view', system: 'crm', module: 'flights', action: 'view', labelAr: 'عرض حجوزات الطيران', labelEn: 'View Flight Bookings' },
  { key: 'crm.flights.create', system: 'crm', module: 'flights', action: 'create', labelAr: 'إنشاء حجز طيران جديد', labelEn: 'Create Flight Booking' },
  { key: 'crm.flights.edit', system: 'crm', module: 'flights', action: 'edit', labelAr: 'تعديل حجوزات الطيران', labelEn: 'Edit Flight Bookings' },
  { key: 'crm.flights.delete', system: 'crm', module: 'flights', action: 'delete', labelAr: 'حذف حجز طيران', labelEn: 'Delete Flight Booking' },
  { key: 'crm.flights.export', system: 'crm', module: 'flights', action: 'export', labelAr: 'تصدير بيانات الطيران', labelEn: 'Export Flights Data' },

  // CRM - Hotels
  { key: 'crm.hotels.view', system: 'crm', module: 'hotels', action: 'view', labelAr: 'عرض حجوزات الفنادق', labelEn: 'View Hotel Bookings' },
  { key: 'crm.hotels.create', system: 'crm', module: 'hotels', action: 'create', labelAr: 'إنشاء حجز فندقي جديد', labelEn: 'Create Hotel Booking' },
  { key: 'crm.hotels.edit', system: 'crm', module: 'hotels', action: 'edit', labelAr: 'تعديل حجوزات الفنادق', labelEn: 'Edit Hotel Bookings' },
  { key: 'crm.hotels.delete', system: 'crm', module: 'hotels', action: 'delete', labelAr: 'حذف حجز فندق', labelEn: 'Delete Hotel Booking' },
  { key: 'crm.hotels.export', system: 'crm', module: 'hotels', action: 'export', labelAr: 'تصدير بيانات الفنادق', labelEn: 'Export Hotels Data' },

  // CRM - Consular & Residence
  { key: 'crm.consular.view', system: 'crm', module: 'consular', action: 'view', labelAr: 'عرض المعاملات والمواعيد القنصلية', labelEn: 'View Consular Cases' },
  { key: 'crm.consular.create', system: 'crm', module: 'consular', action: 'create', labelAr: 'إضافة موعد قنصلي أو ملف إقامة', labelEn: 'Create Consular Case' },
  { key: 'crm.consular.edit', system: 'crm', module: 'consular', action: 'edit', labelAr: 'تعديل المعاملات القنصلية', labelEn: 'Edit Consular Cases' },
  { key: 'crm.consular.delete', system: 'crm', module: 'consular', action: 'delete', labelAr: 'حذف معاملة قنصلية', labelEn: 'Delete Consular Case' },
  { key: 'crm.consular.export', system: 'crm', module: 'consular', action: 'export', labelAr: 'تصدير المعاملات القنصلية', labelEn: 'Export Consular Cases' },

  // CRM - Customers
  { key: 'crm.customers.view', system: 'crm', module: 'customers', action: 'view', labelAr: 'عرض سجلات العملاء', labelEn: 'View Customers' },
  { key: 'crm.customers.create', system: 'crm', module: 'customers', action: 'create', labelAr: 'إضافة عميل جديد', labelEn: 'Create Customer' },
  { key: 'crm.customers.edit', system: 'crm', module: 'customers', action: 'edit', labelAr: 'تعديل بيانات العملاء', labelEn: 'Edit Customer' },
  { key: 'crm.customers.delete', system: 'crm', module: 'customers', action: 'delete', labelAr: 'حذف عميل', labelEn: 'Delete Customer' },
  { key: 'crm.customers.export', system: 'crm', module: 'customers', action: 'export', labelAr: 'تصدير دليل العملاء', labelEn: 'Export Customers' },

  // CRM - Accounting, Debts & Reports
  { key: 'crm.accounting.view', system: 'crm', module: 'accounting', action: 'view', labelAr: 'عرض الفواتير والمعاملات المالية', labelEn: 'View Invoices & Accounting' },
  { key: 'crm.accounting.create', system: 'crm', module: 'accounting', action: 'create', labelAr: 'إصدار فاتورة أو سند قبض', labelEn: 'Create Invoices/Receipts' },
  { key: 'crm.accounting.edit', system: 'crm', module: 'accounting', action: 'edit', labelAr: 'تعديل الفواتير والسندات', labelEn: 'Edit Invoices' },
  { key: 'crm.accounting.delete', system: 'crm', module: 'accounting', action: 'delete', labelAr: 'حذف فواتير', labelEn: 'Delete Invoices' },
  { key: 'crm.debts.view', system: 'crm', module: 'debts', action: 'view', labelAr: 'عرض دفتر الديون والمستحقات', labelEn: 'View Debts Ledger' },
  { key: 'crm.debts.manage', system: 'crm', module: 'debts', action: 'manage', labelAr: 'تسجيل دفعات الديون وإدارتها', labelEn: 'Manage Debts' },
  { key: 'crm.reports.view', system: 'crm', module: 'reports', action: 'view', labelAr: 'عرض التقارير المالية والإحصائيات', labelEn: 'View Financial Reports' },
  { key: 'crm.reports.export', system: 'crm', module: 'reports', action: 'export', labelAr: 'تصدير التقارير المالية', labelEn: 'Export Reports' },

  // CRM - Productivity & Tools
  { key: 'crm.calendar.manage', system: 'crm', module: 'calendar', action: 'manage', labelAr: 'استخدام وإدارة التقويم والمواعيد', labelEn: 'Manage Calendar' },
  { key: 'crm.notes.manage', system: 'crm', module: 'notes', action: 'manage', labelAr: 'استخدام وإدارة المفكرة الذكية', labelEn: 'Manage Notes' },
  { key: 'crm.tasks.manage', system: 'crm', module: 'tasks', action: 'manage', labelAr: 'استخدام وإدارة المهام ولوحة كانبان', labelEn: 'Manage Tasks' },

  // CRM - System & Administration
  { key: 'crm.users.manage', system: 'crm', module: 'users', action: 'manage', labelAr: 'إدارة مستخدمي وأدوار CRM', labelEn: 'Manage CRM Users' },
  { key: 'crm.settings.manage', system: 'crm', module: 'settings', action: 'manage', labelAr: 'إدارة إعدادات CRM والنسخ الاحتياطي', labelEn: 'Manage CRM Settings' },

  // Admin Panel - Dashboard
  { key: 'admin.dashboard.view', system: 'admin', module: 'dashboard', action: 'view', labelAr: 'عرض لوحة تحكم الموقع', labelEn: 'View Website Admin Dashboard' },

  // Admin Panel - Content & Blog
  { key: 'admin.blog.view', system: 'admin', module: 'blog', action: 'view', labelAr: 'عرض مقالات المدونة', labelEn: 'View Blog Posts' },
  { key: 'admin.blog.edit', system: 'admin', module: 'blog', action: 'edit', labelAr: 'تحرير وإنشاء مسودات المقالات', labelEn: 'Edit/Draft Blog Posts' },
  { key: 'admin.blog.publish', system: 'admin', module: 'blog', action: 'publish', labelAr: 'نشر وجدولة المقالات للعامة', labelEn: 'Publish Blog Posts' },
  { key: 'admin.blog.delete', system: 'admin', module: 'blog', action: 'delete', labelAr: 'حذف المقالات', labelEn: 'Delete Blog Posts' },
  { key: 'admin.categories.manage', system: 'admin', module: 'categories', action: 'manage', labelAr: 'إدارة التصنيفات والوسوم', labelEn: 'Manage Categories & Tags' },
  { key: 'admin.media.manage', system: 'admin', module: 'media', action: 'manage', labelAr: 'إدارة مكتبة الوسائط ورفع الملفات', labelEn: 'Manage Media Library' },
  { key: 'admin.seo.manage', system: 'admin', module: 'seo', action: 'manage', labelAr: 'إدارة إعدادات SEO وصفحات البحث', labelEn: 'Manage SEO Settings' },

  // Admin Panel - Requests, Inquiries & Chat
  { key: 'admin.requests.view', system: 'admin', module: 'requests', action: 'view', labelAr: 'عرض طلبات الموقع والرسائل الواردة', labelEn: 'View Incoming Requests' },
  { key: 'admin.requests.manage', system: 'admin', module: 'requests', action: 'manage', labelAr: 'معالجة الطلبات، الرد، وإسناد المهام', labelEn: 'Manage Requests' },
  { key: 'admin.chat.manage', system: 'admin', module: 'chat', action: 'manage', labelAr: 'الرد على المحادثات الحية', labelEn: 'Manage Live Chat' },

  // Admin Panel - Users & System Settings
  { key: 'admin.users.manage', system: 'admin', module: 'users', action: 'manage', labelAr: 'إدارة مستخدمي وصلاحيات لوحة الإدارة', labelEn: 'Manage Admin Users' },
  { key: 'admin.settings.manage', system: 'admin', module: 'settings', action: 'manage', labelAr: 'إدارة الإعدادات العامة للموقع', labelEn: 'Manage Website Settings' },

  // Admin Panel - Theme, Branding & Appearance (Theme Manager)
  { key: 'theme.view', system: 'admin', module: 'theme', action: 'view', labelAr: 'عرض إعدادات المظهر والهوية', labelEn: 'View Theme & Branding' },
  { key: 'theme.edit', system: 'admin', module: 'theme', action: 'edit', labelAr: 'تعديل مسودات المظهر والواجهات', labelEn: 'Edit Theme Drafts' },
  { key: 'theme.preview', system: 'admin', module: 'theme', action: 'preview', labelAr: 'معاينة التعديلات الحية', labelEn: 'Live Preview Themes' },
  { key: 'theme.publish', system: 'admin', module: 'theme', action: 'publish', labelAr: 'نشر الهوية والمظهر للعامة', labelEn: 'Publish Themes' },
  { key: 'theme.restore', system: 'admin', module: 'theme', action: 'restore', labelAr: 'استعادة النسخ السابقة للمظهر', labelEn: 'Restore Previous Themes' },
  { key: 'theme.assets.manage', system: 'admin', module: 'theme', action: 'assets', labelAr: 'إدارة الصور وشعارات الهوية', labelEn: 'Manage Theme Assets' },
  { key: 'theme.global.manage', system: 'admin', module: 'theme', action: 'global', labelAr: 'إدارة الهوية البصرية العامة', labelEn: 'Manage Global Brand Identity' },
];

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: 'superadmin',
    name: 'Super Admin',
    nameAr: 'المدير العام (Super Admin)',
    nameFr: 'Super Administrateur',
    description: 'صلاحيات كاملة وغير مقيدة على كافة أقسام وإعدادات ومستخدمي النظامين.',
    systemAccess: 'both',
    permissions: PERMISSIONS_REGISTRY.map((p) => p.key),
    isSystemRole: true,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'crm_manager',
    name: 'CRM Manager',
    nameAr: 'مدير عمليات الـ CRM',
    nameFr: 'Gestionnaire CRM',
    description: 'إشراف عام على العمليات والحجوزات والعملاء والمواعيد مع استبعاد الإعدادات الأمنية الحساسة.',
    systemAccess: 'crm',
    permissions: [
      'crm.dashboard.view',
      'crm.flights.view', 'crm.flights.create', 'crm.flights.edit', 'crm.flights.export',
      'crm.hotels.view', 'crm.hotels.create', 'crm.hotels.edit', 'crm.hotels.export',
      'crm.consular.view', 'crm.consular.create', 'crm.consular.edit', 'crm.consular.export',
      'crm.customers.view', 'crm.customers.create', 'crm.customers.edit', 'crm.customers.export',
      'crm.accounting.view', 'crm.accounting.create', 'crm.accounting.edit',
      'crm.debts.view', 'crm.debts.manage',
      'crm.reports.view', 'crm.reports.export',
      'crm.calendar.manage', 'crm.notes.manage', 'crm.tasks.manage',
      'admin.requests.view', 'admin.requests.manage', 'admin.chat.manage',
    ],
    isSystemRole: true,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'flight_agent',
    name: 'Flight Agent',
    nameAr: 'مسؤول حجوزات الطيران',
    nameFr: 'Agent de billetterie aérienne',
    description: 'إدارة وتعديل حجوزات الطيران الخاصة بالعملاء فقط، دون إمكانية الوصول للمحاسبة أو إدارة الموقع.',
    systemAccess: 'crm',
    permissions: [
      'crm.dashboard.view',
      'crm.flights.view', 'crm.flights.create', 'crm.flights.edit', 'crm.flights.export',
      'crm.customers.view', 'crm.customers.create', 'crm.customers.edit',
      'crm.calendar.manage', 'crm.notes.manage', 'crm.tasks.manage',
      'admin.requests.view',
    ],
    isSystemRole: true,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'hotel_agent',
    name: 'Hotel Agent',
    nameAr: 'مسؤول حجوزات الفنادق',
    nameFr: 'Agent hôtelier',
    description: 'إدارة ومتابعة حجوزات الفنادق وسجلات النزلاء فقط.',
    systemAccess: 'crm',
    permissions: [
      'crm.dashboard.view',
      'crm.hotels.view', 'crm.hotels.create', 'crm.hotels.edit', 'crm.hotels.export',
      'crm.customers.view', 'crm.customers.create', 'crm.customers.edit',
      'crm.calendar.manage', 'crm.notes.manage', 'crm.tasks.manage',
      'admin.requests.view',
    ],
    isSystemRole: true,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'residence_agent',
    name: 'Consular & Residence Agent',
    nameAr: 'مسؤول المعاملات القنصلية والإقامات',
    nameFr: 'Agent consulaire et séjour',
    description: 'إدارة وتجهيز مواعيد القنصلية، الأوراق المدنية، وملفات تجديد الإقامة للمغاربة في تركيا.',
    systemAccess: 'crm',
    permissions: [
      'crm.dashboard.view',
      'crm.consular.view', 'crm.consular.create', 'crm.consular.edit', 'crm.consular.export',
      'crm.customers.view', 'crm.customers.create', 'crm.customers.edit',
      'crm.calendar.manage', 'crm.notes.manage', 'crm.tasks.manage',
      'admin.requests.view',
    ],
    isSystemRole: true,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'accountant',
    name: 'Accountant',
    nameAr: 'المحاسب المالي',
    nameFr: 'Comptable',
    description: 'إدارة الفواتير، المقبوضات، متابعة الديون والتقارير المالية دون الاطلاع على الملفات القنصلية الحساسة.',
    systemAccess: 'crm',
    permissions: [
      'crm.dashboard.view',
      'crm.accounting.view', 'crm.accounting.create', 'crm.accounting.edit',
      'crm.debts.view', 'crm.debts.manage',
      'crm.reports.view', 'crm.reports.export',
      'crm.customers.view',
      'crm.notes.manage', 'crm.tasks.manage',
    ],
    isSystemRole: true,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'support_agent',
    name: 'Support Agent',
    nameAr: 'خدمة العملاء والرسائل',
    nameFr: 'Agent de support',
    description: 'استقبال طلبات الموقع، الرد على الدردشة الحية والرسائل، ومتابعة الاستفسارات.',
    systemAccess: 'both',
    permissions: [
      'crm.dashboard.view',
      'crm.customers.view', 'crm.customers.create',
      'crm.calendar.manage', 'crm.notes.manage', 'crm.tasks.manage',
      'admin.requests.view', 'admin.requests.manage',
      'admin.chat.manage',
    ],
    isSystemRole: true,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'editor',
    name: 'Website Editor',
    nameAr: 'محرر ومراجع المحتوى',
    nameFr: 'Rédacteur Web',
    description: 'إنشاء وتعديل مسودات مقالات المدونة والوسائط في لوحة تحكم الموقع.',
    systemAccess: 'admin',
    permissions: [
      'admin.dashboard.view',
      'admin.blog.view', 'admin.blog.edit',
      'admin.categories.manage',
      'admin.media.manage',
      'admin.seo.manage',
    ],
    isSystemRole: true,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'auditor',
    name: 'Read-only Auditor',
    nameAr: 'مدقق السجلات والتقارير (عرض فقط)',
    nameFr: 'Auditeur (Lecture seule)',
    description: 'صلاحية قراءة وتقارير فقط لفحص الأنشطة والعمليات دون إمكانية التعديل أو الحذف.',
    systemAccess: 'both',
    permissions: [
      'crm.dashboard.view',
      'crm.flights.view', 'crm.hotels.view', 'crm.consular.view',
      'crm.customers.view', 'crm.accounting.view', 'crm.debts.view',
      'crm.reports.view', 'crm.reports.export',
      'admin.dashboard.view', 'admin.blog.view', 'admin.requests.view',
    ],
    isSystemRole: true,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
];

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
  description?: string;
  postCount?: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  contentJson?: any;
  schemaVersion?: number;
  language?: BlogLanguage;
  translationGroupId?: string;
  category: string;
  tags: string[];
  coverImage: string;
  coverAlt?: string;
  coverMediaId?: string;
  status: BlogStatus;
  author: string;
  authorId?: string;
  readTime: string;
  views: number;
  engagedReads?: number;
  sharesCount?: number;
  consultClicks?: number;
  featured?: boolean;
  pdfUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  scheduledAt?: string;
  timezone?: string;
  relatedPostIds?: string[];
  revision?: number;
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
  contentJson?: any;
  status: BlogStatus;
  language?: BlogLanguage;
  author: string;
  authorId?: string;
  summary?: string;
  createdAt: string;
}

export interface BlogTemplate {
  id: string;
  name: string;
  nameEn: string;
  nameFr: string;
  description: string;
  category: string;
  language: BlogLanguage;
  titleTemplate: string;
  excerptTemplate: string;
  contentHtml: string;
  tags: string[];
  updatedAt: string;
}

export interface BlogSettings {
  defaultLanguage: BlogLanguage;
  postsPerPage: number;
  defaultAuthorName: string;
  defaultTimezone: string;
  enableRelatedPosts: boolean;
  enableWhatsAppCta: boolean;
  defaultCtaTextAr: string;
  defaultCtaTextEn: string;
  defaultCtaTextFr: string;
  blogHeroTitleAr: string;
  blogHeroTitleEn: string;
  blogHeroTitleFr: string;
  blogHeroSubtitleAr: string;
  blogHeroSubtitleEn: string;
  blogHeroSubtitleFr: string;
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
  uploader?: string;
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

  hiddenSections?: import('../src/data/siteVisibility').HomepageSection[];
  siteNameAr: string;
  siteNameEn: string;
  taglineAr: string;
  heroBadgeAr?: string;
  heroTitleAr?: string;
  heroSubtitleAr?: string;
  phone: string;
  whatsapp: string;
  whatsappRaw: string;
  email: string;
  addressAr: string;
  workingHoursAr: string;
  instagram: string;
  facebook: string;
  tiktok: string;
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
  | 'INCOMPLETE_CONSENTED'
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
  draftId?: string;
  isConsentedDraft?: boolean;
  crmContactId?: string;
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

export interface SiteSection {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  sortOrder: number;
  active: boolean;
  serviceKeys: string[];
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
  durationSec?: number;
  timestamp?: string;
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
  activeSessions?: Record<string, number>;
  uniqueVisitorIds?: string[];
}

export interface DatabaseSchema {
  users: User[];
  roles?: RoleDefinition[];
  auditLogs?: AuditLogItem[];
  passwordRequests?: Array<{ userId: string; requestedAt: string }>;
  categories: BlogCategory[];
  tags?: BlogTag[];
  posts: BlogPost[];
  postRevisions?: BlogRevision[];
  blogTemplates?: BlogTemplate[];
  blogSettings?: BlogSettings;
  media: MediaAsset[];
  services: SiteService[];
  sections?: SiteSection[];
  settings: SiteSettings;
  seoPages?: PageSeoItem[];
  messages: ContactMessage[];
  chatStatus?: ChatStatus;
  chatSessions?: ChatSession[];
  chatMessages?: ChatMessage[];
  analytics?: AnalyticsState;
}

export function getDefaultBlogSettings(): BlogSettings {
  return {
    defaultLanguage: 'ar',
    postsPerPage: 9,
    defaultAuthorName: 'رشيد الفزني (Rachid Elfazni)',
    defaultTimezone: 'Europe/Istanbul',
    enableRelatedPosts: true,
    enableWhatsAppCta: true,
    defaultCtaTextAr: 'تواصل مع فريق الفزني للخدمات عبر واتساب',
    defaultCtaTextEn: 'Contact ELFAZNI SERVICES via WhatsApp',
    defaultCtaTextFr: 'Contacter ELFAZNI SERVICES sur WhatsApp',
    blogHeroTitleAr: 'مدونة ELFAZNI SERVICES',
    blogHeroTitleEn: 'ELFAZNI SERVICES Blog',
    blogHeroTitleFr: 'Blogue ELFAZNI SERVICES',
    blogHeroSubtitleAr:
      'مقالات إرشادية وتوجيهية شاملة حول المواعيد القنصلية، الأوراق المدنية، الإقامة في تركيا، وتفاصيل السفر والطيران الموثقة خطوة بخطوة.',
    blogHeroSubtitleEn:
      'Comprehensive step-by-step guides on Moroccan consular appointments, civil documents, residence permits in Türkiye, and VIP travel services.',
    blogHeroSubtitleFr:
      'Guides complets étape par étape sur les rendez-vous consulaires marocains, documents d’état civil, titres de séjour en Turquie et voyages VIP.',
  };
}

export function getDefaultBlogTemplates(): BlogTemplate[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'tpl_consular_guide',
      name: 'دليل معاملة قنصلية شامل',
      nameEn: 'Consular Service Step-by-Step Guide',
      nameFr: 'Guide complet de démarche consulaire',
      description: 'هيكل جاهز لشرح الأوراق المطلوبة والشروط وخطوات حجز الموعد بالقنصلية المغربية.',
      category: 'consular',
      language: 'ar',
      titleTemplate: 'الدليل الشامل لـ [اسم المعاملة القنصلية] في تركيا 2026: الوثائق والخطوات',
      excerptTemplate: 'تعرف بالتفصيل على كافة الوثائق الرسمية المطلوبة، شروط التصديق بالأبوستيل، وكيفية حجز الموعد دون تأخير مع فريق الفزني للخدمات.',
      contentHtml: `<h2>مقدمة حول المعاملة وأهميتها</h2><p>يحتاج المواطنون المغاربة المقيمون في تركيا إلى تجهيز ملف متكامل قبل التوجه إلى القنصلية العامة للمملكة المغربية بإسطنبول أو السفارة بأنقرة لضمان قبول الطلب من الزيارة الأولى.</p><div data-block-type="callout" data-variant="info" class="elf-editor-callout elf-callout-info"><strong>💡 نصيحة استشارية من الفزني للخدمات:</strong> تأكد من صلاحية جميع الوثائق الأصلية وختم الأبوستيل قبل موعدك بأسبوع على الأقل.</div><h2>أولاً: قائمة الوثائق الرسمية المطلوبة</h2><ul><li><strong>جواز السفر المغربي:</strong> أصل الجواز مع نسخة واضحة من الصفحة الأولى.</li><li><strong>بطاقة التعريف الوطنية (CNIE):</strong> سارية المفعول مع نسخة منها.</li><li><strong>وثيقة الإقامة في تركيا (İkamet):</strong> أو ختم الدخول الساري.</li><li><strong>إثبات السكن (Yerleşim Belgesi):</strong> مستخرج حديثاً من بوابة E-Devlet.</li></ul><h2>ثانياً: جدول مقارنة الإجراءات والمدد الزمنية</h2><table><thead><tr><th>الخطوة</th><th>الجهة المختصة</th><th>المدة التقديرية</th></tr></thead><tbody><tr><td>مراجعة وتدقيق الوثائق</td><td>فريق ELFAZNI SERVICES</td><td>نفس اليوم</td></tr><tr><td>الترجمة المحلفة والنوتير</td><td>مكتب الترجمة المعتمد</td><td>24 ساعة</td></tr><tr><td>تقديم الملف في القنصلية</td><td>القنصلية العامة للمملكة المغربية</td><td>حسب الموعد المحجوز</td></tr></tbody></table><h2>ثالثاً: كيف نساعدك في الفزني للخدمات؟</h2><p>نرافقك خطوة بخطوة في تدقيق الأوراق، حجز الموعد الرسمي، وتجهيز الترجمة المحلفة المعتمدة.</p><div data-block-type="cta" data-url="https://wa.me/905522677851" class="elf-editor-cta"><a href="https://wa.me/905522677851" target="_blank" rel="noopener noreferrer" class="elf-cta-btn">تواصل معنا لحجز موعدك وتدقيق ملفك الآن</a></div>`,
      tags: ['القنصلية المغربية', 'الوثائق المطلوبة', 'مواعيد إسطنبول'],
      updatedAt: now,
    },
    {
      id: 'tpl_travel_tips',
      name: 'نصائح السفر والطيران واستقبال المطار VIP',
      nameEn: 'Travel, Flights & VIP Airport Transfer Tips',
      nameFr: 'Conseils de voyage, vols et transfert aéroport VIP',
      description: 'قالب مخصص لمقالات حجز الطيران، الفنادق، وخدمات الاستقبال في مطار إسطنبول وصبيحة.',
      category: 'travel',
      language: 'ar',
      titleTemplate: 'أفضل نصائح السفر بين المغرب وتركيا وتنسيق استقبال المطار VIP',
      excerptTemplate: 'دليل عملي لاختيار أفضل رحلات الطيران، أوقات الحجز المناسبة، وتأمين سيارة استقبال عائلية VIP من مطار إسطنبول.',
      contentHtml: `<h2>التخطيط المسبق لرحلتك بين المغرب وتركيا</h2><p>سواء كنت مسافراً للسياحة، العلاج، أو زيارة العائلة، فإن الترتيب المبكر لتذاكر الطيران والاستقبال في المطار يوفر عليك الكثير من الوقت والتكلفة.</p><h3>أهم النصائح عند حجز تذكرة الطيران</h3><ol><li>الحجز المبكر قبل موعد السفر بـ 3 إلى 4 أسابيع للحصول على أفضل تعريفة.</li><li>التأكد من وزن الأمتعة المسموح به (23 كغ أو قطعتين حسب الدرجة).</li><li>مراجعة مطار الوصول في إسطنبول (مطار إسطنبول الجديد IST أو صبيحة كوكجن SAW).</li></ol><div data-block-type="callout" data-variant="tip" class="elf-editor-callout elf-callout-tip"><strong>✈️ خدمة VIP من ELFAZNI SERVICES:</strong> نوفر سيارات مرسيدس فيتو حديثة مع سائقين محترفين لاستقبالكم بالاسم فور الخروج من بوابة المطار.</div><div data-block-type="cta" data-url="https://wa.me/905522677851" class="elf-editor-cta"><a href="https://wa.me/905522677851" target="_blank" rel="noopener noreferrer" class="elf-cta-btn">احجز تذكرتك أو سيارة الاستقبال VIP عبر واتساب</a></div>`,
      tags: ['حجز طيران', 'استقبال مطار VIP', 'إسطنبول'],
      updatedAt: now,
    },
    {
      id: 'tpl_news_announcement',
      name: 'إعلان ومستجدات للجالية المغربية',
      nameEn: 'Community News & Official Update',
      nameFr: 'Actualités et annonce pour la communauté',
      description: 'قالب رسمي لنشر المستجدات القنصلية أو تحديثات قوانين الإقامة والهجرة في تركيا.',
      category: 'general',
      language: 'ar',
      titleTemplate: 'مستجدات هامة للجالية المغربية في تركيا بخصوص [موضوع الإعلان]',
      excerptTemplate: 'تفاصيل القرارات والتحديثات الجديدة وكيفية الاستفادة منها أو استيفاء الشروط المطلوبة في الوقت المحدد.',
      contentHtml: `<h2>تفاصيل التحديث الجديد</h2><p>نحيط أفراد الجالية المغربية المقيمين والزائرين في تركيا علماً بأهم المستجدات المتعلقة بالإجراءات الإدارية والقنصلية الحالية.</p><blockquote>يرجى الاعتماد دائماً على الوثائق الرسمية المحدثة ومراجعة ملفكم قبل الموعد لتفادي أي تأخير.</blockquote><h3>ما الذي يتوجب عليك فعله؟</h3><ul><li>مراجعة تاريخ صلاحية جواز السفر والإقامة الحالية.</li><li>تجهيز المستندات المصدقة وترجمتها لدى مترجم محلف معتمد.</li></ul><div data-block-type="cta" data-url="https://wa.me/905522677851" class="elf-editor-cta"><a href="https://wa.me/905522677851" target="_blank" rel="noopener noreferrer" class="elf-cta-btn">استفسر مجاناً من مستشاري الفزني للخدمات</a></div>`,
      tags: ['إرشادات الجالية', 'مستجدات تركيا', 'الفزني للخدمات'],
      updatedAt: now,
    },
    {
      id: 'tpl_faq_residency',
      name: 'الأسئلة الشائعة حول الإقامة والأوراق المدنية',
      nameEn: 'Residency & Civil Documents FAQ',
      nameFr: 'FAQ sur le séjour et les documents d’état civil',
      description: 'قالب سؤال وجواب منظم للرد على أكثر استفسارات العملاء تكراراً.',
      category: 'residency',
      language: 'ar',
      titleTemplate: 'إجابات شاملة على أكثر الأسئلة شيوعاً حول الإقامة في تركيا للمغاربة',
      excerptTemplate: 'إجابات دقيقة ومباشرة حول تجديد الإقامة السياحية والعائلية، عقد الإيجار الموثق، التأمين الصحي، وشهادة الكفاءة للزواج.',
      contentHtml: `<h2>أسئلة وأجوبة موثقة من خبرتنا الميدانية</h2><p>جمعنا لكم أهم الأسئلة التي تردنا يومياً من الجالية المغربية في إسطنبول وجميع الولايات التركية مع الإجابات القانونية والعملية الدقيقة.</p><h3>س 1: متى يحق لي تقديم طلب تجديد الإقامة في تركيا؟</h3><p>يُفتح باب التقديم الإلكتروني لتجديد الإقامة قبل <strong>60 يوماً</strong> من تاريخ انتهاء بطاقة الإقامة الحالية، ويُنصح بعدم الانتظار للأيام الأخيرة.</p><h3>س 2: هل يشترط تصديق الأبوستيل على الوثائق القادمة من المغرب؟</h3><p>نعم، كافة وثائق الحالة المدنية والسجل العدلي الصادرة من المغرب والمراد استخدامها أمام السلطات التركية يجب أن تحمل ختم <strong>Apostille</strong>.</p><div data-block-type="callout" data-variant="warning" class="elf-editor-callout elf-callout-warning"><strong>⚠️ تنبيه هام:</strong> تأكد من أن الحي السكني غير مدرج ضمن الأحياء المغلقة لتسجيل الأجانب (Kapalı Mahalleler) قبل توقيع عقد الإيجار.</div>`,
      tags: ['الإقامة السياحية', 'أسئلة شائعة', 'الأبوستيل'],
      updatedAt: now,
    },
  ];
}

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

let memoryDb: DatabaseSchema | null = null;

export function readDb(): DatabaseSchema {
  if (memoryDb) {
    return memoryDb;
  }
  ensureDirectories();
  if (!fs.existsSync(DB_FILE)) {
    const initial = seedDefaultDatabase();
    memoryDb = initial;
    writeDb(initial);
    return initial;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content) as DatabaseSchema;
    let modified = false;

    const rootAdmin = parsed.users.find((user) => user.username === 'elfazni.admin');
    if (!rootAdmin && process.env.ADMIN_PASSWORD) {
      parsed.users.unshift(createAdminUser(process.env.ADMIN_PASSWORD));
      modified = true;
    } else if (rootAdmin && process.env.ADMIN_PASSWORD && !bcrypt.compareSync(process.env.ADMIN_PASSWORD, rootAdmin.passwordHash)) {
      rootAdmin.passwordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
      modified = true;
    }

    // Initialize Chat Status
    if (!parsed.chatStatus) {
      parsed.chatStatus = {
        adminOnline: true,
        lastActive: new Date().toISOString(),
        updatedBy: 'رشيد الفزني',
      };
      modified = true;
    }

    if (!parsed.chatSessions) {
      parsed.chatSessions = [
        {
          id: 'chat_session_1',
          visitorId: 'vis_morocco_984',
          visitorName: 'أحمد بنشقرون',
          visitorPhone: '+212661234567',
          visitorCountry: 'المغرب 🇲🇦',
          currentPage: 'حجز المواعيد القنصلية',
          unreadAdmin: 1,
          unreadVisitor: 0,
          createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
          lastMessageAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
          status: 'active',
        },
      ];
      modified = true;
    }

    if (!parsed.chatMessages) {
      parsed.chatMessages = [
        {
          id: 'msg_chat_1',
          sessionId: 'chat_session_1',
          sender: 'visitor',
          senderName: 'أحمد بنشقرون',
          text: 'السلام عليكم أخي رشيد، استفسار بخصوص تجديد جواز السفر بالقنصلية بإسطنبول، هل ضروري وصل الإقامة؟',
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        },
        {
          id: 'msg_chat_2',
          sessionId: 'chat_session_1',
          sender: 'admin',
          senderName: 'رشيد الفزني (ELFAZNI SERVICES)',
          text: 'وعليكم السلام ورحمة الله وبركاته أخي أحمد. نعم مرحباً بك، يلزم وجود وثيقة الإقامة أو تأشيرة الدخول الرسمية سارية المفعول، ونحن نساعدك في فحص الملف وحجز الموعد.',
          createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        },
      ];
      modified = true;
    }

    // Migrate messages to full Mailbox structure
    if (!parsed.messages) {
      parsed.messages = [];
    }
    parsed.messages.forEach((msg, idx) => {
      if (!msg.ticketNumber) {
        msg.ticketNumber = `ELF-2026-${1000 + idx}`;
        modified = true;
      }
      if (!msg.folder) {
        msg.folder = msg.status === 'archived' ? 'trash' : 'inbox';
        modified = true;
      }
      if (typeof msg.starred !== 'boolean') {
        msg.starred = idx === 0;
        modified = true;
      }
      if (!msg.attachments) {
        msg.attachments = [];
        modified = true;
      }
      if (!msg.replies) {
        msg.replies = [];
        modified = true;
      }
      if (!msg.subject) {
        msg.subject = msg.serviceRequested ? `طلب خدمة: ${msg.serviceRequested}` : 'استفسار عام من الموقع';
        modified = true;
      }
    });

    // Fix post 2 or post 3 broken images if any & backfill BlogPost defaults
    if (parsed.posts && parsed.posts.length > 0) {
      parsed.posts.forEach((p) => {
        if (p.id === 'post_2' && (!p.coverImage || p.coverImage.includes('04-marriage-cert'))) {
          p.coverImage = '/assets/slides/07-marriage.webp';
          modified = true;
        }
        if (p.id === 'post_3' && (!p.coverImage || !p.coverImage.startsWith('/assets/'))) {
          p.coverImage = '/assets/aistudio/residency-v4_2edf876b.webp';
          modified = true;
        }
        if (!p.language) {
          p.language = 'ar';
          modified = true;
        }
        if (!p.translationGroupId) {
          p.translationGroupId = `tg_${p.id}`;
          modified = true;
        }
        if (typeof p.revision !== 'number') {
          p.revision = 1;
          modified = true;
        }
        if (!p.schemaVersion) {
          p.schemaVersion = 1;
          modified = true;
        }
      });
    }

    // Backfill localized category names if missing
    if (parsed.categories && parsed.categories.length > 0) {
      const catTranslations: Record<string, { en: string; fr: string; descEn: string; descFr: string }> = {
        consular: {
          en: 'Consular Appointments',
          fr: 'Rendez-vous Consulaires',
          descEn: 'Passport renewal, CNIE ID card, and power of attorney guides at the Moroccan Consulate in Istanbul & Ankara',
          descFr: 'Guides pour le renouvellement de passeport, CNIE et procurations au Consulat du Maroc à Istanbul et Ankara',
        },
        residency: {
          en: 'Residency & Visas',
          fr: 'Titres de Séjour et Visas',
          descEn: 'Tourist, family, and student residence permit procedures in Türkiye for Moroccans',
          descFr: 'Procédures de titre de séjour touristique, familial et étudiant en Turquie pour les Marocains',
        },
        marriage: {
          en: 'Marriage & Civil Documents',
          fr: 'Mariage et État Civil',
          descEn: 'Marriage eligibility certificates, Apostille authentication, and sworn translation',
          descFr: 'Certificats de capacité de mariage, apostille et traduction assermentée',
        },
        travel: {
          en: 'Flights & VIP Travel',
          fr: 'Vols et Voyages VIP',
          descEn: 'Best flight deals between Türkiye and Morocco plus VIP airport transfers',
          descFr: 'Meilleurs vols entre la Turquie et le Maroc et transferts aéroport VIP',
        },
        general: {
          en: 'Community Guides',
          fr: 'Guides de la Communauté',
          descEn: 'General tips and official updates for Moroccan residents and visitors in Türkiye',
          descFr: 'Conseils généraux et actualités pour les résidents et visiteurs marocains en Turquie',
        },
      };
      parsed.categories.forEach((c) => {
        const tr = catTranslations[c.slug];
        if (tr && (!c.nameEn || !c.nameFr)) {
          c.nameEn = c.nameEn || tr.en;
          c.nameFr = c.nameFr || tr.fr;
          c.descriptionEn = c.descriptionEn || tr.descEn;
          c.descriptionFr = c.descriptionFr || tr.descFr;
          modified = true;
        }
      });
    }

    if (!parsed.tags) {
      const tagSet = new Set<string>();
      (parsed.posts || []).forEach((p) => (p.tags || []).forEach((t) => tagSet.add(t)));
      parsed.tags = Array.from(tagSet).map((name, idx) => ({
        id: `tag_${idx + 1}`,
        slug: name.toLowerCase().trim().replace(/[^a-zA-Z0-9\u0600-\u06FF-]/g, '-').replace(/-+/g, '-'),
        name,
      }));
      modified = true;
    }

    if (!parsed.postRevisions) {
      parsed.postRevisions = [];
      modified = true;
    }

    if (!parsed.blogTemplates || parsed.blogTemplates.length === 0) {
      parsed.blogTemplates = getDefaultBlogTemplates();
      modified = true;
    }

    if (!parsed.blogSettings) {
      parsed.blogSettings = getDefaultBlogSettings();
      modified = true;
    }

    // Initialize or Reset Analytics to genuine real tracking (all zeros)
    if (!parsed.analytics || parsed.analytics.totalVisits >= 5000 || !parsed.analytics.uniqueVisitorIds) {
      parsed.analytics = {
        totalVisits: 0,
        uniqueVisitors: 0,
        activeVisitors: 0,
        topCountries: [],
        recentVisits: [],
        trafficHistory: [
          { label: 'السبت', visits: 0, chats: 0, messages: 0 },
          { label: 'الأحد', visits: 0, chats: 0, messages: 0 },
          { label: 'الإثنين', visits: 0, chats: 0, messages: 0 },
          { label: 'الثلاثاء', visits: 0, chats: 0, messages: 0 },
          { label: 'الأربعاء', visits: 0, chats: 0, messages: 0 },
          { label: 'الخميس', visits: 0, chats: 0, messages: 0 },
          { label: 'الجمعة', visits: 0, chats: 0, messages: 0 },
        ],
        deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
        todoList: parsed.analytics?.todoList?.length ? parsed.analytics.todoList : [
          { id: 'todo_1', text: 'مراجعة موعد القنصلية وتأكيد ملف الوكالة', done: false, priority: 'high', dueDate: 'اليوم' },
          { id: 'todo_2', text: 'تأكيد حجز سيارة الاستقبال VIP لمطار إسطنبول', done: false, priority: 'high', dueDate: 'غداً 14:00' },
          { id: 'todo_3', text: 'تسليم ترجمة شهادة الكفاءة للزواج مصدقة من النوتير', done: false, priority: 'medium', dueDate: 'الخميس' },
          { id: 'todo_4', text: 'نشر مقال توضيحي جديد عن مواعيد تجديد جوازات السفر', done: false, priority: 'low', dueDate: 'هذا الأسبوع' },
        ],
        activeSessions: {},
        uniqueVisitorIds: [],
      };

      // Reset all post views to 0 for real visitor monitoring
      if (parsed.posts) {
        parsed.posts.forEach((p) => {
          p.views = 0;
          p.engagedReads = 0;
          p.sharesCount = 0;
          p.consultClicks = 0;
        });
      }
      modified = true;
    }

    if (!parsed.seoPages || parsed.seoPages.length === 0) {
      parsed.seoPages = getDefaultSeoPages();
      modified = true;
    }

    if (parsed.analytics) {
      if (!parsed.analytics.visitTimestamps) {
        parsed.analytics.visitTimestamps = [];
        // Backfill timestamps for existing recorded visits if any
        const count = parsed.analytics.totalVisits || 0;
        for (let i = 0; i < count; i++) {
          parsed.analytics.visitTimestamps.push(new Date().toISOString());
        }
        modified = true;
      }
      parsed.analytics.trafficPeriods = computeTrafficPeriods(parsed);
    }

    // Initialize & sync Roles
    if (!parsed.roles || parsed.roles.length === 0) {
      parsed.roles = DEFAULT_ROLES;
      modified = true;
    } else {
      for (const defRole of DEFAULT_ROLES) {
        const existing = parsed.roles.find((r) => r.id === defRole.id);
        if (!existing) {
          parsed.roles.push(defRole);
          modified = true;
        } else if (defRole.id === 'superadmin') {
          // Always ensure superadmin has all registry permissions
          const allPerms = PERMISSIONS_REGISTRY.map((p) => p.key);
          const missing = allPerms.filter((k) => !existing.permissions.includes(k));
          if (missing.length > 0) {
            existing.permissions = Array.from(new Set([...existing.permissions, ...allPerms]));
            modified = true;
          }
        }
      }
    }

    // Initialize Audit Logs
    if (!parsed.auditLogs) {
      parsed.auditLogs = [];
      modified = true;
    }

    // Hydrate existing users with role & RBAC defaults
    parsed.users.forEach((u) => {
      if (!u.department) {
        u.department = 'general';
        modified = true;
      }
      if (!u.systemAccess) {
        u.systemAccess = u.role === 'superadmin' ? 'both' : 'admin';
        modified = true;
      }
      if (!u.permissions) {
        u.permissions = { allowed: [], denied: [] };
        modified = true;
      }
      if (typeof u.disabled !== 'boolean') {
        u.disabled = false;
        modified = true;
      }
    });

    memoryDb = parsed;
    if (modified) {
      writeDb(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error reading db.json, recreating initial seed:', err);
    const initial = seedDefaultDatabase();
    memoryDb = initial;
    writeDb(initial);
    return initial;
  }
}

export function getDefaultSeoPages(): PageSeoItem[] {
  const now = new Date().toISOString();
  const baseUrl = process.env.BASE_URL || 'https://elfazni.com';
  return [
    {
      id: 'seo_home',
      pagePath: '/',
      pageNameAr: 'الصفحة الرئيسية (Home)',
      metaTitle: 'ELFAZNI SERVICES | خدمات الجالية المغربية في تركيا',
      metaDescription:
        'خدمات ELFAZNI SERVICES للجالية المغربية في تركيا: المساعدة في المواعيد القنصلية بإسطنبول وأنقرة، حجوزات الطيران والفنادق، الترجمة المحلفة، والإقامات عبر واتساب.',
      metaKeywords:
        'خدمات الجالية المغربية في تركيا, مواعيد القنصلية المغربية بإسطنبول, مواعيد قنصلية المغرب أنقرة, حجز طيران تركيا المغرب, ترجمة محلفة عربي تركي, تجديد الإقامة تركيا, ELFAZNI SERVICES, Rachid Elfazni',
      ogTitle: 'ELFAZNI SERVICES | خدمات الجالية المغربية في تركيا',
      ogDescription:
        'خدمات ELFAZNI SERVICES للجالية المغربية في تركيا: المساعدة في المواعيد القنصلية بإسطنبول وأنقرة، حجوزات الطيران والفنادق، الترجمة المحلفة، والإقامات عبر واتساب.',
      ogImage: '/assets/slides/10-all-services.webp',
      canonicalUrl: `${baseUrl}/`,
      robots: 'index, follow',
      updatedAt: now,
    },
    {
      id: 'seo_blog',
      pagePath: '/blog',
      pageNameAr: 'المدونة والمقالات الإرشادية (Blog)',
      metaTitle: 'مدونة ELFAZNI SERVICES | دليل الجالية المغربية في تركيا',
      metaDescription:
        'مقالات وشروحات قانونية وقنصلية مفصلة للجالية المغربية في تركيا: تجديد الجواز والبطاقة الوطنية، شهادة العزوبية والزواج، وتجديد الإقامة السياحية والعائلية.',
      metaKeywords:
        'مدونة الجالية المغربية في تركيا, شروط تجديد الإقامة في تركيا للمغاربة, وثائق القنصلية المغربية إسطنبول, شهادة العزوبية في تركيا, ELFAZNI SERVICES Blog',
      ogTitle: 'مدونة ELFAZNI SERVICES | دليل الجالية المغربية في تركيا',
      ogDescription:
        'دليلك الشامل للمعاملات القنصلية والإقامات وحجوزات السفر للمغاربة في تركيا بإشراف رشيد الفزني.',
      ogImage: '/assets/aistudio/consular-v4_c4b5767c.webp',
      canonicalUrl: `${baseUrl}/blog`,
      robots: 'index, follow',
      updatedAt: now,
    },
    {
      id: 'seo_services',
      pagePath: '/#services',
      pageNameAr: 'قسم الخدمات القنصلية والسفر (#services)',
      metaTitle: 'خدماتنا | المواعيد القنصلية وحجوزات الطيران والإقامات - ELFAZNI SERVICES',
      metaDescription:
        'استكشف خدمات ELFAZNI SERVICES: حجز مواعيد القنصلية المغربية، تذاكر الطيران والفنادق، استقبال المطار VIP، والترجمة المحلفة وتصديق النوتير في إسطنبول.',
      metaKeywords:
        'حجز مواعيد القنصلية المغربية, حجز طيران الخطوط الملكية المغربية, استقبال مطار إسطنبول VIP, ترجمة محلفة نوتير إسطنبول',
      ogTitle: 'خدمات ELFAZNI SERVICES للجالية المغربية في تركيا',
      ogDescription:
        'مواعيد قنصلية، طيران وفنادق، استقبال مطار VIP، وترجمة محلفة ونوتير ومتابعة الإقامات في تركيا.',
      ogImage: '/assets/aistudio/flights-v4_bc11797f.webp',
      canonicalUrl: `${baseUrl}/#services`,
      robots: 'index, follow',
      updatedAt: now,
    },
    {
      id: 'seo_contact',
      pagePath: '/#contact-form',
      pageNameAr: 'بوابة المراسلة والتواصل المباشر (#contact-form)',
      metaTitle: 'تواصل معنا | بوابة المراسلة وواتساب ELFAZNI SERVICES',
      metaDescription:
        'تواصل مباشرة مع إدارة ELFAZNI SERVICES ورشيد الفزني عبر بوابة التذاكر الداخلية أو الواتساب الفوري لإنجاز معاملاتك في تركيا بسرعة وموثوقية.',
      metaKeywords:
        'رقم واتساب رشيد الفزني, التواصل مع ELFAZNI SERVICES, استشارة قنصلية تركيا, مكتب خدمات المغاربة في إسطنبول',
      ogTitle: 'تواصل مع إدارة ELFAZNI SERVICES - رشيد الفزني',
      ogDescription:
        'مراسلة داخلية مع رقم تذكرة أو واتساب فوري لمتابعة كافة معاملاتك القنصلية والسياحية في تركيا.',
      ogImage: '/assets/founder-rachid-elfazni-v2.webp',
      canonicalUrl: `${baseUrl}/#contact-form`,
      robots: 'index, follow',
      updatedAt: now,
    },
  ];
}

export function computeTrafficPeriods(db: DatabaseSchema): TrafficPeriods {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDateStr = now.toISOString().slice(0, 10);

  const visitDates: Date[] = (db.analytics?.visitTimestamps || [])
    .map((ts) => new Date(ts))
    .filter((d) => !isNaN(d.getTime()));

  // If totalVisits > 0 but visitDates is empty, attribute current totalVisits to now
  if (visitDates.length === 0 && (db.analytics?.totalVisits || 0) > 0) {
    for (let i = 0; i < (db.analytics?.totalVisits || 0); i++) {
      visitDates.push(now);
    }
  }

  const chatDates: Date[] = (db.chatSessions || [])
    .map((s) => new Date(s.lastMessageAt || s.createdAt))
    .filter((d) => !isNaN(d.getTime()));

  const messageDates: Date[] = (db.messages || [])
    .map((m) => new Date(m.createdAt))
    .filter((d) => !isNaN(d.getTime()));

  // 1. DAILY (8 three-hour buckets for today: 00:00 .. 21:00)
  const hourLabels = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
  const daily: TrafficDataPoint[] = hourLabels.map((label, bucketIdx) => {
    const startHour = bucketIdx * 3;
    const endHour = startHour + 3;
    const visits = visitDates.filter(
      (d) => d.toISOString().slice(0, 10) === currentDateStr && d.getHours() >= startHour && d.getHours() < endHour
    ).length;
    const chats = chatDates.filter(
      (d) => d.toISOString().slice(0, 10) === currentDateStr && d.getHours() >= startHour && d.getHours() < endHour
    ).length;
    const messages = messageDates.filter(
      (d) => d.toISOString().slice(0, 10) === currentDateStr && d.getHours() >= startHour && d.getHours() < endHour
    ).length;
    return { label, visits, chats, messages };
  });

  // 2. WEEKLY (7 days of week: السبت .. الجمعة)
  const weekOrder: { label: string; dayIndex: number }[] = [
    { label: 'السبت', dayIndex: 6 },
    { label: 'الأحد', dayIndex: 0 },
    { label: 'الإثنين', dayIndex: 1 },
    { label: 'الثلاثاء', dayIndex: 2 },
    { label: 'الأربعاء', dayIndex: 3 },
    { label: 'الخميس', dayIndex: 4 },
    { label: 'الجمعة', dayIndex: 5 },
  ];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekly: TrafficDataPoint[] = weekOrder.map(({ label, dayIndex }) => {
    const visits = visitDates.filter((d) => d >= sevenDaysAgo && d.getDay() === dayIndex).length;
    const chats = chatDates.filter((d) => d >= sevenDaysAgo && d.getDay() === dayIndex).length;
    const messages = messageDates.filter((d) => d >= sevenDaysAgo && d.getDay() === dayIndex).length;
    return { label, visits, chats, messages };
  });

  // 3. MONTHLY (5 weeks/periods of the current month)
  const monthBuckets = [
    { label: 'الأسبوع 1 (1-7)', min: 1, max: 7 },
    { label: 'الأسبوع 2 (8-14)', min: 8, max: 14 },
    { label: 'الأسبوع 3 (15-21)', min: 15, max: 21 },
    { label: 'الأسبوع 4 (22-28)', min: 22, max: 28 },
    { label: 'نهاية الشهر (29-31)', min: 29, max: 31 },
  ];
  const monthly: TrafficDataPoint[] = monthBuckets.map(({ label, min, max }) => {
    const visits = visitDates.filter(
      (d) => d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() >= min && d.getDate() <= max
    ).length;
    const chats = chatDates.filter(
      (d) => d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() >= min && d.getDate() <= max
    ).length;
    const messages = messageDates.filter(
      (d) => d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() >= min && d.getDate() <= max
    ).length;
    return { label, visits, chats, messages };
  });

  // 4. YEARLY (12 months of the current year)
  const monthNamesAr = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];
  const yearly: TrafficDataPoint[] = monthNamesAr.map((label, mIdx) => {
    const visits = visitDates.filter((d) => d.getFullYear() === currentYear && d.getMonth() === mIdx).length;
    const chats = chatDates.filter((d) => d.getFullYear() === currentYear && d.getMonth() === mIdx).length;
    const messages = messageDates.filter((d) => d.getFullYear() === currentYear && d.getMonth() === mIdx).length;
    return { label, visits, chats, messages };
  });

  return { daily, weekly, monthly, yearly };
}

let cloudSyncCallback: ((data: DatabaseSchema) => void) | null = null;
export function registerCloudSyncCallback(cb: (data: DatabaseSchema) => void) {
  cloudSyncCallback = cb;
}

export function writeDb(data: DatabaseSchema, skipCloudSync = false): void {
  memoryDb = data;
  ensureDirectories();
  const tempFile = `${DB_FILE}.${process.pid}.${Date.now()}_${Math.random().toString(36).slice(2, 8)}.tmp`;
  try {
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    } catch (writeErr) {
      console.error('Failed to persist db.json:', writeErr);
    }
  }
  if (!skipCloudSync && cloudSyncCallback) {
    try {
      cloudSyncCallback(data);
    } catch {
      // ignore
    }
  }
}

function createAdminUser(password: string): User {
  return {
    id: 'user_admin_1',
    username: 'elfazni.admin',
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'superadmin',
    displayName: 'رشيد الفزني (Rachid Elfazni)',
    email: process.env.SMTP_ADMIN_TO || 'rachidelfazni@gmail.com',
    createdAt: new Date().toISOString(),
  };
}

function seedDefaultDatabase(): DatabaseSchema {
  const password = process.env.ADMIN_PASSWORD;
  const initialUsers = password ? [createAdminUser(password)] : [];

  const initialCategories: BlogCategory[] = [
    {
      id: 'cat_consular',
      slug: 'consular',
      name: 'المواعيد القنصلية',
      description: 'دليل حجز وتجديد جواز السفر، البطاقة الوطنية، والوكالات بالقنصلية المغربية بإسطنبول وأنقرة',
      color: '#064EA8',
    },
    {
      id: 'cat_residency',
      slug: 'residency',
      name: 'الإقامات والتأشيرات',
      description: 'إجراءات وشروط الإقامة السياحية والعائلية والطلابية في تركيا للمغاربة',
      color: '#059669',
    },
    {
      id: 'cat_marriage',
      slug: 'marriage',
      name: 'الزواج والأوراق المدنية',
      description: 'شهادة العزوبية وأهلية الزواج وتصديقات الأبوستيل والترجمة المحلفة',
      color: '#B6812E',
    },
    {
      id: 'cat_travel',
      slug: 'travel',
      name: 'السفر والطيران',
      description: 'أفضل أسعار الطيران بين تركيا والمغرب وتوصيل واستقبال المطارات VIP',
      color: '#7C3AED',
    },
    {
      id: 'cat_general',
      slug: 'general',
      name: 'إرشادات الجالية',
      description: 'معلومات ونصائح عامة تهم المواطنين المغاربة المقيمين والزائرين لتركيا',
      color: '#0D2340',
    },
  ];

  const initialPosts: BlogPost[] = [
    {
      id: 'post_1',
      title: 'الدليل الشامل لمواعيد القنصلية المغربية بإسطنبول 2026: الوثائق، الشروط، وطريقة الحجز',
      slug: 'guide-moroccan-consulate-istanbul-appointments-2026',
      excerpt:
        'دليلك العملي المحدث خطوة بخطوة لحجز موعد في القنصلية العامة للمملكة المغربية بإسطنبول، وتجهيز ملفات جواز السفر، البطاقة الوطنية، وعقود الوكالات دون تأخير.',
      content: `## مقدمة عن المعاملات القنصلية في تركيا

تُعد مراجعة القنصلية العامة للمملكة المغربية في إسطنبول أو سفارة المملكة بأنقرة خطوة أساسية لكل مواطن مغربي يقيم أو يعمل أو يدرس في تركيا لتجديد أوراقه الثبوتية أو إتمام معاملاته العدلية والمدنية.

في هذا المقال نضع بين أيديكم دليلاً استشارياً شاملاً يوضح كافة المتطلبات وطريقة ترتيب الموعد لتفادي أي نقص في الوثائق.

---

### أولاً: تجديد جواز السفر البيومتري المغربي

لتقديم طلب تجديد أو استخراج جواز سفر جديد، يلزم تحضير المستندات التالية:

1. **بطاقة التعريف الوطنية الإلكترونية (CNIE)** سارية المفعول (أو وصل التجديد).
2. **جواز السفر القديم** ونسخة من الصفحات الأولى وصفحة آخر تأشيرة أو ختم دخول إلى تركيا.
3. **وثيقة الإقامة التركية (İkamet)** أو تأشيرة الدخول الرسمية سارية المفعول.
4. **صور فوتوغرافية حديثة** بخلفية بيضاء قياس (35 × 45 مم) مطابقة للمواصفات البيومترية.
5. **شهادة السكنى التركية (Yerleşim Belgesi)** مستخرجة حديثاً من بوابة E-Devlet.
6. دفع الرسوم القنصلية القانونية في شباك القنصلية.

> **ملاحظة هامة:** في حال ضياع جواز السفر، يجب استخراج محضر رسمي من الشرطة التركية (Karakol) يثبت واقعة الضياع وترجمته قبل الحضور للموعد.

---

### ثانياً: استخراج وتجديد بطاقة التعريف الوطنية (CNIE)

تتطلب البطاقة الوطنية تجهيز:
- نسخة من رسم الولادة (عقد الازدياد) مستخرج حديثاً من المغرب أو عبر منصة الحالة المدنية.
- جواز السفر ساري المفعول أو وثيقة الإقامة.
- صورتان فوتوغرافيتان حديثتان بقياس بيومتري مخصص للبطاقة الوطنية.
- البطاقة القديمة في حال الرغبة في التجديد.

---

### ثالثاً: الوكالات الخاصة (Procuration)

توفر القنصلية المغربية إمكانية توقيع وتصديق **الوكالات الخاصة** (مثل توكيل شخص بالمغرب لإدارة حساب بنكي، بيع سيارة، أو تسليم وثائق إدارية).

* **شروط الوكالة:**
  - حضور الموكل شخصياً ومعه أصل بطاقته الوطنية وجواز سفره.
  - صياغة نص الوكالة بدقة ووضوح مع إدراج الاسم الكامل ورقم بطاقة الوكيل في المغرب.
  - الوكالات العقارية العامة تقتضي عادة الرجوع للمحاكم العدلية أو النوتير وفق ضوابط القانون المغربي.

---

### رابعاً: كيف يساعدك فريق ELFAZNI SERVICES؟

نحن في **ELFAZNI SERVICES** مكتب استشارات وتنسيق مستقل:
- نساعدك في مراجعة وتدقيق كامل الأوراق قبل التوجه للموعد.
- نقوم بحجز الموعد وتعبئة الاستمارات الرسمية بدقة وسرعة.
- توفير خدمات الترجمة المحلفة التركية-العربية المعتمدة عند الحاجة.
- المرافقة بالإرشادات حتى تكون تجربتك سهلة وسلسة ومريحة.

لأي استفسار أو لطلب المساعدة في حجز موعدك، تواصل معنا فوراً عبر زر واتساب في الموقع!`,
      category: 'consular',
      tags: ['القنصلية المغربية', 'مواعيد إسطنبول', 'جواز السفر', 'البطاقة الوطنية', 'وكالة خاصة'],
      coverImage: '/assets/aistudio/consular-v4_c4b5767c.webp',
      status: 'published',
      author: 'رشيد الفزني (Rachid Elfazni)',
      readTime: '5 دقائق',
      views: 0,
      featured: true,
      seoTitle: 'الدليل الشامل لمواعيد القنصلية المغربية بإسطنبول 2026',
      seoDescription: 'كل ما تحتاجه لحجز موعد القنصلية المغربية بإسطنبول: الأوراق المطلوبة لتجديد جواز السفر والبطاقة الوطنية والوكالات واستخراج الأوراق.',
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z',
      publishedAt: '2026-11-01T10:00:00.000Z',
    },
    {
      id: 'post_2',
      title: 'خطوات استخراج شهادة أهلية الزواج في تركيا للطرف المغربي: الأوراق والتصديقات',
      slug: 'moroccan-marriage-eligibility-certificate-turkey',
      excerpt:
        'دليل تفصيلي يوضح كيفية إعداد ملف شهادة العزوبية والكفاءة للزواج المختلط في تركيا، تصديقات الأبوستيل، والترجمة المحلفة المعتمدة للبلديات التركية.',
      content: `## الزواج المدني في تركيا للمواطنين المغاربة

يخضع عقد الزواج في تركيا لنظام البلديات التركية (Evlendirme Dairesi). لكي يتمكن المواطن المغربي (رجلاً أو امرأة) من عقد قرانه رسمياً، تشترط السلطات التركية تقديم **شهادة أهلية للزواج (Evlenme Ehliyet Belgesi)** تثبت أنه غير متزوج ويحق له الارتباط.

نستعرض هنا تفاصيل الملف المطلوب وكيفية تفادي رفض أوراق الزواج في البلدية.

---

### 1. الوثائق المطلوبة من المغرب (للطرف المغربي)

يجب إحضار هذه الوثائق من المغرب مصدقة بخاتم **الأبوستيل (Apostille)**:
1. **شهادة العزوبية أو الخطوبة (Certificat de Célibat):** تثبت الحالة الاجتماعية للشخص، موقعة من السلطة المحلية ومصدقة بالأبوستيل.
2. **النسخة الكاملة من رسم الولادة (Copie Intégrale):** من قسم الحالة المدنية مكان الولادة ومصدقة بالأبوستيل.
3. **شهادة السجل العدلي (Fiche Anthropométrique / Casier Judiciaire):** حديثة ومصدقة بالأبوستيل.
4. في حال الطلاق أو الترمل: حكم الطلاق النهائي أو شهادة الوفاة مع الأبوستيل.

---

### 2. إجراءات القنصلية المغربية في إسطنبول

بعد الوصول إلى تركيا، يتوجه الطرف المغربي للقنصلية بعد حجز موعد مصطحباً:
- الوثائق المغربية المصدقة أعلاه.
- أصل جواز السفر وبطاقة التعريف الوطنية.
- وثائق الطرف التركي (الهوية Kimlik، القيد العائلي Nüfus Kayıt Örneği، شهادة السكن Yerleşim Belgesi).
- بعد تدقيق الملف، تسلم القنصلية للطرف المغربي **شهادة الكفاءة للزواج**.

---

### 3. التصديق والترجمة المحلفة

- تُترجم شهادة الكفاءة للزواج وجواز السفر إلى اللغة التركية عبر **مترجم محلف (Yeminli Tercüman)**.
- يتم تصديقها لدى كاتب العدل التركي (Noter) ووالي إسطنبول (Kaymakamlık).
- إجراء الفحص الطبي الخاص بالزواج (Sağlık Raporu) في المركز الصحي الحكومي التركي (Sağlık Ocağı).

---

### استشارة ومرافقة ELFAZNI SERVICES

نوفر لعملائنا مراجعة دقيقة لملفات الزواج قبل السفر إلى تركيا، وتأمين الترجمة المحلفة وتصديقات النوتير، ومرافقتهم حتى إتمام عقد القران في البلدية بكل طمأنينة.`,
      category: 'marriage',
      tags: ['شهادة أهلية الزواج', 'زواج في تركيا', 'أبوستيل', 'البلدية التركية', 'ترجمة محلفة'],
      coverImage: '/assets/slides/04-marriage-cert.webp',
      status: 'published',
      author: 'رشيد الفزني (Rachid Elfazni)',
      readTime: '6 دقائق',
      views: 0,
      featured: true,
      seoTitle: 'شهادة أهلية الزواج في تركيا للمغاربة 2026: الدليل الكامل',
      seoDescription: 'شرح مبسط لكافة الأوراق المطلوبة لاستخراج شهادة أهلية الزواج والترجمة والتصديقات لإتمام الزواج بالبلديات التركية.',
      createdAt: '2026-11-02T12:00:00.000Z',
      updatedAt: '2026-11-02T12:00:00.000Z',
      publishedAt: '2026-11-02T12:00:00.000Z',
    },
    {
      id: 'post_3',
      title: 'تجديد الإقامة السياحية والعائلية في تركيا 2026: المستجدات والنصائح المهمة',
      slug: 'turkey-residence-permit-renewal-tips-2026',
      excerpt:
        'أهم تحديثات دائرة الهجرة التركية (Göç İdaresi) بخصوص تجديد الإقامات السياحية والعائلية، عقد الإيجار الموثق، التأمين الصحي، وتفادي رفض الملف.',
      content: `## مستجدات الإقامة في تركيا لعام 2026

تخضع قوانين الإقامة في تركيا لتحديثات دورية تهدف إلى تنظيم وجود الأجانب. بالنسبة للجالية المغربية المقيمة في إسطنبول والمدن التركية الأخرى، يُعد الالتزام الدقيق بمتطلبات دائرة الهجرة هو السبيل الوحيد لقبول تجديد الإقامة بسلاسة.

---

### أهم الشروط لتجديد الإقامة السياحية:

1. **جواز سفر ساري المفعول:** يجب أن يغطي جواز السفر مدة الإقامة المطلوبة زائد 60 يوماً على الأقل.
2. **عقد إيجار موثق (Noter):** موثق بحضور صاحب العقار التركي ويشترط ألا تكون المنطقة محظورة من تقييد الأجانب (Kapalı Mahalleler).
3. **وثيقة قيد النفوس (Yerleşim Belgesi):** تثبت السكن الفعلي في العنوان المسجل بنظام UYAP.
4. **التأمين الصحي الخاص (Sigorta):** يغطي فترة الإقامة كاملة ومطابق لمعايير الهجرة.
5. **كشف حساب بنكي أو إثبات دخل:** يوضح حركة مالية منتظمة وقدرة على الإنفاق طوال فترة الإقامة.
6. **دفع الرسوم الضريبية وبدل الكرت (Harç ve Kart Ücreti).**

---

### نصائح لتجنب الرفض أو إلغاء الإقامة:

- لا تتأخر عن تقديم طلب التجديد عبر الإنترنت خلال فترة الـ 60 يوماً التي تسبق انتهاء إقامتك الحالية.
- تأكد أن عنوانك مسجل بشكل صحيح لدى إدارة النفوس.
- احتفظ دائماً برقم تتبع الملف (Başvuru Formu) ووصل تسليم الأوراق إلى PTT أو الهجرة.

فريقنا يقدم لك الاستشارة وتدقيق عقود الإيجار والتأمين الصحي قبل تسليم الملف، لضمان استيفاء جميع المتطلبات الرسمية.`,
      category: 'residency',
      tags: ['الإقامة السياحية', 'دائرة الهجرة', 'التأمين الصحي', 'عقد الإيجار', 'إسطنبول'],
      coverImage: '/assets/aistudio/residency-v4_2edf876b.webp',
      status: 'published',
      author: 'رشيد الفزني (Rachid Elfazni)',
      readTime: '4 دقائق',
      views: 0,
      featured: false,
      seoTitle: 'تجديد الإقامة في تركيا للمغاربة 2026: الشروط والمستجدات',
      seoDescription: 'دليل عملي لتجديد الإقامة السياحية والعائلية في تركيا: الشروط المطلوبة والتأمين وعقد الإيجار وكيفية تجنب الرفض.',
      createdAt: '2026-11-03T09:00:00.000Z',
      updatedAt: '2026-11-03T09:00:00.000Z',
      publishedAt: '2026-11-03T09:00:00.000Z',
    },
    {
      id: 'post_4',
      title: 'نصائح حجز تذاكر الطيران بين تركيا والمغرب وتنسيق استقبال المطار VIP',
      slug: 'travel-tips-flights-vip-airport-transfer-istanbul',
      excerpt:
        'مقارنة شاملة بين رحلات الخطوط الملكية المغربية والخطوط التركية، أفضل مواسم الحجز، وكيف تضمن خدمة توصيل مطار VIP آمنة ومريحة.',
      content: `## السفر بين إسطنبول والدار البيضاء / مراكش / طنجة

يشهد خط الطيران بين تركيا والمغرب حركة نشطة طوال العام سواء للسياحة أو الزيارات العائلية أو التجارة.

---

### 1. اختيار شركة الطيران المناسبة:

- **الخطوط الملكية المغربية (Royal Air Maroc):** رحلات مباشرة ومريحة بين مطار إسطنبول (IST) ومطار محمد الخامس بالدار البيضاء، وتتيح وزناً ممتازاً للأمتعة (حقيبتان بوزن 23 كجم عادة في الدرجة الاقتصادية).
- **الخطوط الجوية التركية (Turkish Airlines):** رحلات مباشرة إلى الدار البيضاء ومراكش مع خدمات متميزة على متن الطائرة.
- **شركات الطيران المنخفضة التكلفة (Pegasus / Air Arabia):** خيارات اقتصادية لرحلات مع محطات ترانزيت أو رحلات مباشرة بأسعار منافسة مع قيود على الوزن.

---

### 2. نصائح للحصول على أفضل سعر:

1. احجز تذكرتك قبل موعد السفر بـ 3 إلى 6 أسابيع على الأقل خصوصاً في مواسم الذروة (الصيف، عطلة رأس السنة، وعيد الفطر وعيد الأضحى).
2. اختر أيام منتصف الأسبوع (الثلاثاء والأربعاء) لتفادي ارتفاع الأسعار في عطلة نهاية الأسبوع.
3. راجع سياسة الأمتعة وإمكانية التعديل أو الإلغاء قبل تأكيد الدفع.

---

### 3. خدمة توصيل واستقبال المطار VIP في إسطنبول

مطار إسطنبول الجديد (IST) ومطار صبيحة كوكجن (SAW) يبعدان مسافات طويلة نسبياً عن وسط المدينة (الفاتح، تقسيم، باشاك شهير).

لتجنب استغلال سيارات الأجرة أو صعوبة نقل الحقائب الكثيرة مع العائلة:
- نوفر سيارات سياحية حديثة VIP من طراز مرسيدس فيتو (Mercedes Vito) مع سائق خاص يتحدث العربية أو التركية.
- استقبال بالاسم داخل المطار ومتابعة مباشرة لموعد هبوط الطائرة.
- أسعار ثابتة وشفافة دون أي زيادات خفية.

تواصل معنا لحجز تذكرتك وخدمة التوصيل بأفضل الأسعار.`,
      category: 'travel',
      tags: ['حجز طيران', 'الخطوط الملكية المغربية', 'مطار إسطنبول', 'استقبال VIP', 'توصيل مطار'],
      coverImage: '/assets/aistudio/flights-v4_bc11797f.webp',
      status: 'published',
      author: 'رشيد الفزني (Rachid Elfazni)',
      readTime: '4 دقائق',
      views: 0,
      featured: false,
      seoTitle: 'حجز طيران بين تركيا والمغرب واستقبال المطار VIP',
      seoDescription: 'أفضل النصائح لحجز رحلات الطيران بين المغرب وتركيا وتنسيق سيارة استقبال VIP في مطار إسطنبول وصبيحة.',
      createdAt: '2026-11-03T15:00:00.000Z',
      updatedAt: '2026-11-03T15:00:00.000Z',
      publishedAt: '2026-11-03T15:00:00.000Z',
    },
  ];

  const initialServices: SiteService[] = [
    {
      id: 'srv_1',
      key: 'consular',
      title: 'مواعيد القنصلية المغربية',
      description: 'حجز ومتابعة مواعيد القنصلية المغربية بإسطنبول وأنقرة، تجديد جواز السفر والبطاقة الوطنية والوكالات العدلية.',
      category: 'قنصلي',
      icon: 'landmark',
      image: '/assets/aistudio/consular-v4_c4b5767c.webp',
      active: true,
      sortOrder: 1,
      featured: true,
    },
    {
      id: 'srv_2',
      key: 'flights',
      title: 'حجوزات تذاكر الطيران',
      description: 'تأمين تذاكر طيران دولية وداخلية بأفضل الأسعار المتاحة مع الخطوط المغربية والتركية والعالمية.',
      category: 'سفر',
      icon: 'plane',
      image: '/assets/aistudio/flights-v4_bc11797f.webp',
      active: true,
      sortOrder: 2,
      featured: true,
    },
    {
      id: 'srv_3',
      key: 'hotels',
      title: 'حجوزات الفنادق والشقق',
      description: 'تأكيد حجوزات فندقية وشقق عائلية موثقة في أفضل مناطق إسطنبول وبورصة وأنطاليا وبأسعار تفضيلية.',
      category: 'سياحة',
      icon: 'hotel',
      image: '/assets/aistudio/hotels-v4_b0c2f2ff.webp',
      active: true,
      sortOrder: 3,
      featured: true,
    },
    {
      id: 'srv_4',
      key: 'airport',
      title: 'توصيل واستقبال مطار VIP',
      description: 'استقبال في مطار إسطنبول ومطار صبيحة بسيارات مرسيدس VIP فسيحة ومكيفة مع سائقين محترفين.',
      category: 'نقل',
      icon: 'car',
      image: '/assets/aistudio/airport-v4_4a382d43.webp',
      active: true,
      sortOrder: 4,
      featured: true,
    },
    {
      id: 'srv_5',
      key: 'translation',
      title: 'ترجمة محلفة ونوتير',
      description: 'ترجمة محلفة للوثائق الرسمية، شهادات الزواج، السجلات العدلية، وعقود البيع والتوكيلات وتصديقها لدى النوتير والوالي.',
      category: 'قانوني',
      icon: 'file-text',
      image: '/assets/aistudio/translation-v4_7279cd12.webp',
      active: true,
      sortOrder: 5,
      featured: true,
    },
    {
      id: 'srv_6',
      key: 'residency',
      title: 'معاملات وتجديد الإقامة',
      description: 'تجهيز ملفات الإقامة السياحية والعائلية والطلابية، حجز مواعيد إدارة الهجرة، والتأمين الصحي المعتمد.',
      category: 'إقامات',
      icon: 'shield-check',
      image: '/assets/aistudio/residency-v4_2edf876b.webp',
      active: true,
      sortOrder: 6,
      featured: true,
    },
    {
      id: 'srv_7',
      key: 'community',
      title: 'إرشاد واستشارات الجالية',
      description: 'دعم واستشارات مجتمعية للجالية المغربية في تركيا للمساعدة في الاندماج ومعالجة التحديات اليومية.',
      category: 'عام',
      icon: 'users',
      image: '/assets/aistudio/community-v4_6ad781a8.webp',
      active: true,
      sortOrder: 7,
      featured: true,
    },
  ];

  const initialMedia: MediaAsset[] = [
    {
      id: 'med_1',
      filename: 'consular-v4_c4b5767c.webp',
      originalName: 'المواعيد القنصلية المغربية',
      url: '/assets/aistudio/consular-v4_c4b5767c.webp',
      mimeType: 'image/webp',
      size: 145000,
      altText: 'المواعيد القنصلية المغربية بإسطنبول',
      createdAt: '2026-11-01T00:00:00.000Z',
    },
    {
      id: 'med_2',
      filename: 'flights-v4_bc11797f.webp',
      originalName: 'حجوزات تذاكر الطيران',
      url: '/assets/aistudio/flights-v4_bc11797f.webp',
      mimeType: 'image/webp',
      size: 168000,
      altText: 'طائرة حجز طيران تركيا المغرب',
      createdAt: '2026-11-01T00:00:00.000Z',
    },
    {
      id: 'med_3',
      filename: 'residency-v4_2edf876b.webp',
      originalName: 'معاملات وتجديد الإقامة',
      url: '/assets/aistudio/residency-v4_2edf876b.webp',
      mimeType: 'image/webp',
      size: 154000,
      altText: 'بطاقة الإقامة التركية للأجانب والمغاربة',
      createdAt: '2026-11-01T00:00:00.000Z',
    },
    {
      id: 'med_4',
      filename: 'translation-v4_7279cd12.webp',
      originalName: 'الترجمة المحلفة والنوتير',
      url: '/assets/aistudio/translation-v4_7279cd12.webp',
      mimeType: 'image/webp',
      size: 139000,
      altText: 'وثائق وترجمة محلفة نوتير تركي',
      createdAt: '2026-11-01T00:00:00.000Z',
    },
    {
      id: 'med_5',
      filename: 'founder-rachid-elfazni-v2.webp',
      originalName: 'صورة المؤسس رشيد الفزني',
      url: '/assets/founder-rachid-elfazni-v2.webp',
      mimeType: 'image/webp',
      size: 92000,
      altText: 'رشيد الفزني مؤسس ELFAZNI SERVICES',
      createdAt: '2026-11-01T00:00:00.000Z',
    },
  ];

  const initialSettings: SiteSettings = {
    siteNameAr: 'الفزني سيرفيسز',
    siteNameEn: 'ELFAZNI SERVICES',
    taglineAr: 'خدمات استشارية وتنظيمية متكاملة للجالية المغربية في تركيا',
    phone: '+90 552 267 78 51',
    whatsapp: '+90 552 267 78 51',
    whatsappRaw: '905522677851',
    email: 'contact@elfazniservices.com',
    addressAr: 'إسطنبول، الجمهورية التركية (خدمات عن بعد لجميع الولايات)',
    workingHoursAr: 'يومياً من 08:00 صباحاً حتى 11:00 مساءً بتوقيت إسطنبول',
    instagram: 'https://instagram.com/alfazni.services',
    facebook: 'https://facebook.com/alfazni.services',
    tiktok: 'https://tiktok.com/@alfazni.services',
    founderName: 'رشيد الفزني (Rachid Elfazni)',
    founderTitleAr: 'مؤسس ومدير عام ELFAZNI SERVICES',
    founderBioAr: 'خبرة طويلة في توجيه وإرشاد المواطنين المغاربة في تركيا وتسهيل كافة المعاملات القنصلية، الأوراق المدنية، وحجوزات السفر بأعلى معايير المصداقية والالتزام.',
    founderImage: '/assets/founder-rachid-elfazni-v2.webp',
  };

  const initialMessages: ContactMessage[] = [
    {
      id: 'msg_1',
      ticketNumber: 'ELF-2026-1001',
      name: 'كريم التازي',
      phone: '+905301234567',
      email: 'karim.tazi@example.com',
      serviceRequested: 'مواعيد قنصلية (شهادة عزوبية، جواز، توكيل)',
      subject: 'طلب خدمة: مواعيد قنصلية',
      message: 'السلام عليكم، أحتاج مساعدة في تجهيز ملف شهادة أهلية الزواج وحجز موعد بالقنصلية المغربية بإسطنبول.',
      folder: 'inbox',
      status: 'new',
      starred: true,
      country: 'المغرب 🇲🇦',
      attachments: [],
      replies: [],
      source: 'نموذج التواصل',
      createdAt: '2026-11-03T18:40:00.000Z',
    },
  ];

  return {
    users: initialUsers,
    categories: initialCategories,
    posts: initialPosts,
    media: initialMedia,
    services: initialServices,
    settings: initialSettings,
    seoPages: getDefaultSeoPages(),
    messages: initialMessages,
  };
}
