import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const THEMES_FILE = path.join(DATA_DIR, 'themes.json');

export type InterfaceTarget = 'global' | 'website' | 'portal' | 'admin_login' | 'crm_login';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  gold: string;
  goldTextOnWhite: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  button: string;
  buttonHover: string;
  success: string;
  warning: string;
  error: string;
  navySupport: string;
  [key: string]: string;
}

export interface ThemeTypography {
  fontFamily: string;
  headingFontFamily: string;
  baseFontSize: string;
  lineHeight: string;
  letterSpacing: string;
  h1Size: string;
  h2Size: string;
  h3Size: string;
  buttonFontSize: string;
  inputLabelSize: string;
  fontWeightNormal: string;
  fontWeightMedium: string;
  fontWeightBold: string;
  fontWeightHeavy: string;
}

export interface PortalCard {
  id: string;
  title: Record<string, string>;
  subtitle: Record<string, string>;
  description: Record<string, string>;
  icon: string;
  destination: string;
  visible: boolean;
  featured?: boolean;
  order: number;
  cardBg?: string;
  borderColor?: string;
  badge?: Record<string, string>;
}

export interface GradientStop {
  position: number; // 0 - 100
  color: string;
  opacity?: number; // 0 - 1
}

export interface GradientConfig {
  enabled: boolean;
  type: 'linear' | 'radial' | 'solid';
  direction: 'to top' | 'to bottom' | 'to left' | 'to right' | 'custom';
  angle: number; // 0 - 360
  opacity: number; // 0 - 1
  stops: GradientStop[];
}

export interface LayerConfig {
  id: 'logo' | 'content' | 'illustration' | 'gradient' | 'background';
  labelAr: string;
  labelEn: string;
  visible: boolean;
  locked?: boolean;
  zIndex: number;
  opacity?: number;
}

export const DEFAULT_LAYERS: LayerConfig[] = [
  { id: 'logo', labelAr: 'الشعار (Logo)', labelEn: 'Logo', visible: true, locked: false, zIndex: 5, opacity: 100 },
  { id: 'content', labelAr: 'العنوان والنصوص (Headings & Text)', labelEn: 'Headings & Text', visible: true, locked: false, zIndex: 4, opacity: 100 },
  { id: 'illustration', labelAr: 'المجسم 3D التوضيحي (Illustration)', labelEn: 'Foreground Illustration', visible: true, locked: false, zIndex: 3, opacity: 100 },
  { id: 'gradient', labelAr: 'التدرج اللوني (Gradient Overlay)', labelEn: 'Gradient Overlay', visible: true, locked: false, zIndex: 2, opacity: 85 },
  { id: 'background', labelAr: 'صورة / لون الخلفية (Background)', labelEn: 'Background Image / Color', visible: true, locked: false, zIndex: 1, opacity: 100 },
];

export const DEFAULT_GRADIENT: GradientConfig = {
  enabled: true,
  type: 'linear',
  direction: 'to top',
  angle: 0,
  opacity: 0.85,
  stops: [
    { position: 0, color: '#012247', opacity: 0.95 },
    { position: 45, color: '#004AA5', opacity: 0.65 },
    { position: 100, color: '#071629', opacity: 0.2 },
  ],
};

export function hexToRgba(hex: string, alpha = 1): string {
  if (!hex) return `rgba(0, 74, 165, ${alpha})`;
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(0, 74, 165, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

export function generateGradientCss(g?: GradientConfig): string {
  if (!g || !g.enabled) return 'transparent';
  if (g.type === 'solid') {
    const s = g.stops?.[0] || { color: '#012247', opacity: 1 };
    return hexToRgba(s.color, (s.opacity ?? 1) * (g.opacity ?? 1));
  }
  const stops = (g.stops && g.stops.length > 0)
    ? g.stops
    : [
        { position: 0, color: '#012247', opacity: 0.95 },
        { position: 100, color: '#071629', opacity: 0.2 },
      ];
  const stopsStr = stops
    .map((s) => `${hexToRgba(s.color, (s.opacity ?? 1) * (g.opacity ?? 1))} ${s.position}%`)
    .join(', ');
  if (g.type === 'radial') {
    return `radial-gradient(circle at center, ${stopsStr})`;
  }
  const dir = g.direction === 'custom' ? `${g.angle || 0}deg` : g.direction || 'to top';
  return `linear-gradient(${dir}, ${stopsStr})`;
}

export interface InterfaceThemeConfig {
  target: InterfaceTarget;
  name: string;
  nameAr: string;
  inheritBrandColors: boolean;
  inheritTypography: boolean;
  layoutType?: 'split-right' | 'split-left' | 'centered' | 'full-bg';
  logoVariant: 'horizontal-on-white' | 'horizontal-on-blue' | 'horizontal-on-gold' | 'vertical-on-white' | 'vertical-on-blue' | 'vertical-on-gold' | 'custom';
  customLogoUrl?: string;
  colors: Partial<ThemeColors>;
  typography: Partial<ThemeTypography>;

  // Layer Management & Stacking Context
  layers?: LayerConfig[];

  // Advanced Gradient Overlay
  gradient?: GradientConfig;

  // Background Customization
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundPosition?: string;
  backgroundOpacity?: number; // 0 - 100
  backgroundBlur?: number; // 0 - 20px
  backgroundBrightness?: number; // 50 - 150%
  backgroundOverlay?: string;

  // Foreground Illustration Customization (Transparent PNG / JPG / WebP / SVG / AVIF)
  illustrationUrl?: string;
  decorativeIllustration?: string;
  illustrationLogoVariant?: string;
  illustrationPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'custom';
  illustrationVerticalPosition?: 'top' | 'center' | 'bottom' | 'custom';
  illustrationCustomX?: number;
  illustrationCustomY?: number;
  illustrationScale?: number; // 0 - 400%
  illustrationOpacity?: number;
  illustrationRotation?: number; // deg
  illustrationWidth?: string;
  illustrationHeight?: string;
  illustrationFit?: 'contain' | 'cover' | 'original' | 'custom';
  illustrationClip?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showSafeArea?: boolean;
  illustrationBgGradient?: string;

  // Independent Typography Colors & Settings
  kickerColor?: string;
  titleColor?: string;
  noteColor?: string;
  titleFontSize?: string;
  noteFontSize?: string;
  textAlign?: 'start' | 'center' | 'end';
  textOpacity?: number; // 0 - 100

  // Logo Customization
  logoScale?: number; // 0 - 300%
  logoWidth?: number;
  logoHeight?: number;
  logoOpacity?: number; // 0 - 100%
  logoPosition?: 'start' | 'center' | 'end';

  imageEffects?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
  };
  formWidth?: string;
  formBg?: string;
  formTextColor?: string;
  formMutedColor?: string;
  inputBg?: string;
  inputBorder?: string;
  inputRadius?: string;
  inputTextColor?: string;
  primaryButtonBg?: string;
  primaryButtonTextColor?: string;
  primaryButtonRadius?: string;
  appliedPresetId?: string;
  appliedPresetName?: string;
  cardRadius?: string;
  headingShadow?: boolean;
  texts: Record<string, Record<string, string>>;
  portalCards?: PortalCard[];
  customCss?: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
}

export interface ThemePreset {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  previewColors: string[];
  globalColors: ThemeColors;
  typography: ThemeTypography;
  backgroundColor?: string;
  backgroundImage?: string;
  gradient?: GradientConfig;
  illustrationUrl?: string;
  illustrationScale?: number;
  illustrationPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'custom';
  illustrationVerticalPosition?: 'top' | 'center' | 'bottom' | 'custom';
  illustrationFit?: 'contain' | 'cover' | 'original' | 'custom';
  logoVariant?: InterfaceThemeConfig['logoVariant'];
  illustrationLogoVariant?: string;
  kickerColor?: string;
  titleColor?: string;
  noteColor?: string;
  formBg?: string;
  formTextColor?: string;
  formMutedColor?: string;
  inputBg?: string;
  inputBorder?: string;
  inputTextColor?: string;
  primaryButtonBg?: string;
  primaryButtonTextColor?: string;
  isSystem: boolean;
  createdAt: string;
}

export interface ThemeVersion {
  id: string;
  target: InterfaceTarget;
  versionNumber: number;
  snapshot: InterfaceThemeConfig;
  publishedAt: string;
  publishedBy: string;
  changeSummary: string;
}

export interface ThemeAsset {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  category: 'logo' | 'illustration' | 'background' | 'photo';
  width?: number;
  height?: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ThemeAuditLog {
  id: string;
  action: 'DRAFT_SAVE' | 'PUBLISH' | 'RESTORE' | 'RESET_GLOBAL' | 'PRESET_APPLY' | 'ASSET_UPLOAD' | 'ASSET_DELETE';
  target: InterfaceTarget | 'asset' | 'preset';
  actorUsername: string;
  timestamp: string;
  details: string;
}

export interface ThemesDatabase {
  globalBrand: {
    brandNameEn: string;
    brandNameAr: string;
    colors: ThemeColors;
    typography: ThemeTypography;
    defaultLogoVariant: string;
    updatedAt: string;
    updatedBy: string;
  };
  drafts: Record<InterfaceTarget, InterfaceThemeConfig>;
  published: Record<InterfaceTarget, InterfaceThemeConfig>;
  presets: ThemePreset[];
  versions: ThemeVersion[];
  assets: ThemeAsset[];
  auditLogs: ThemeAuditLog[];
}

export const OFFICIAL_BRAND_COLORS: ThemeColors = {
  primary: '#004AA5',
  secondary: '#0B2E57',
  accent: '#0066E6',
  gold: '#CC9048',
  goldTextOnWhite: '#81521C',
  background: '#FFFFFF',
  surface: '#F7F9FC',
  text: '#102D4D',
  mutedText: '#5E7086',
  border: '#DCE6F2',
  button: '#004AA5',
  buttonHover: '#003B84',
  success: '#16A34A',
  warning: '#D97706',
  error: '#DC2626',
  navySupport: '#10345B',
};

export const OFFICIAL_TYPOGRAPHY: ThemeTypography = {
  fontFamily: "'Bahij TheSansArabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  headingFontFamily: "'Bahij TheSansArabic', sans-serif",
  baseFontSize: '16px',
  lineHeight: '1.6',
  letterSpacing: '0px',
  h1Size: '2.25rem',
  h2Size: '1.75rem',
  h3Size: '1.25rem',
  buttonFontSize: '0.875rem',
  inputLabelSize: '0.75rem',
  fontWeightNormal: '400',
  fontWeightMedium: '600',
  fontWeightBold: '700',
  fontWeightHeavy: '800',
};

function createInitialDatabase(): ThemesDatabase {
  const now = new Date().toISOString();

  const websiteConfig: InterfaceThemeConfig = {
    target: 'website',
    name: 'Main Website',
    nameAr: 'مظهر الموقع الإلكتروني',
    inheritBrandColors: true,
    inheritTypography: true,
    logoVariant: 'horizontal-on-white',
    colors: {},
    typography: {},
    texts: {
      heroKicker: {
        ar: 'المكتب المعتمد في تركيا',
        en: 'Certified Agency in Türkiye',
        fr: 'Agence certifiée en Türkiye',
      },
      heroTitle: {
        ar: 'الفزني للخدمات العامة والقنصلية والسياحية للمغاربة والعرب',
        en: 'ELFAZNI SERVICES — Travel, Consular & General Services',
        fr: 'ELFAZNI SERVICES — Voyages, services consulaires et généraux',
      },
      heroSubtitle: {
        ar: 'حجوزات طيران وفنادق، مواعيد قنصلية، إقامات وتأشيرات، وترجمة محلفة بأعلى جودة واحترافية.',
        en: 'Flight & hotel bookings, consular appointments, residence & visas, sworn translations with excellence.',
        fr: 'Réservations de vols et hôtels, rendez-vous consulaires, titres de séjour et visas.',
      },
      primaryButton: {
        ar: 'ابدأ طلبك الآن',
        en: 'Start Your Request',
        fr: 'Commencer votre demande',
      },
      secondaryButton: {
        ar: 'استكشف الخدمات',
        en: 'Explore Services',
        fr: 'Explorer les services',
      },
    },
    updatedAt: now,
    updatedBy: 'system',
    version: 1,
  };

  const portalConfig: InterfaceThemeConfig = {
    target: 'portal',
    name: 'Unified Access Portal (HUB & Workspace)',
    nameAr: 'مظهر البوابة الرئيسية (HUB / Workspace)',
    inheritBrandColors: true,
    inheritTypography: true,
    layoutType: 'split-right',
    logoVariant: 'horizontal-on-white',
    illustrationLogoVariant: 'horizontal-on-blue',
    colors: {},
    typography: {},
    illustrationUrl: '/assets/brand/3d/07-hero-flight-appointment-transparent.png',
    decorativeIllustration: '/assets/brand/3d/07-hero-flight-appointment-transparent.png',
    illustrationPosition: 'center',
    illustrationVerticalPosition: 'center',
    illustrationScale: 100,
    illustrationOpacity: 100,
    illustrationFit: 'contain',
    illustrationBgGradient: 'radial-gradient(ellipse at top right, #004AA5 0%, #0B2E57 55%, #071629 100%)',
    backgroundColor: '#071629',
    backgroundImage: '/assets/brand/3d/01-master-service-hero-transparent.png',
    backgroundOpacity: 35,
    backgroundBlur: 0,
    backgroundBrightness: 100,
    gradient: DEFAULT_GRADIENT,
    layers: DEFAULT_LAYERS,
    kickerColor: '#CC9048',
    titleColor: '#FFFFFF',
    noteColor: '#E2E8F0',
    headingShadow: true,
    formWidth: '480px',
    formBg: '#FFFFFF',
    formTextColor: '#0B2E57',
    formMutedColor: '#5E7086',
    inputBg: '#F8FAFC',
    inputBorder: '#D7E7F7',
    inputTextColor: '#0B2E57',
    inputRadius: '16px',
    primaryButtonBg: '#004AA5',
    primaryButtonTextColor: '#FFFFFF',
    primaryButtonRadius: '16px',
    texts: {
      heroKicker: {
        ar: 'مركز الوصول الموحّد',
        en: 'UNIFIED ACCESS PORTAL',
        fr: 'PORTAIL D’ACCÈS UNIFIÉ',
      },
      heroTitle: {
        ar: 'بوابة الفزني سيرفيسز',
        en: 'ELFAZNI SERVICES HUB',
        fr: 'ELFAZNI SERVICES HUB',
      },
      heroDescription: {
        ar: 'الوصول السريع إلى الموقع الإلكتروني ونظام إدارة العملاء ولوحة التحكم من مكان واحد.',
        en: 'Quick access to the website, the CRM system and the admin dashboard from a single place.',
        fr: 'Accès rapide au site web, au CRM et au tableau de bord d’administration depuis un seul endroit.',
      },
      photoKicker: {
        ar: 'ELFAZNI SERVICES HUB',
        en: 'ELFAZNI SERVICES HUB',
        fr: 'ELFAZNI SERVICES HUB',
      },
      photoTitle: {
        ar: 'بوابة الفزني سيرفيسز',
        en: 'ELFAZNI SERVICES HUB',
        fr: 'ELFAZNI SERVICES HUB',
      },
      photoNote: {
        ar: 'خدمات السفر والمعاملات في تركيا',
        en: 'Travel and consular services in Türkiye',
        fr: 'Voyage et services consulaires en Türkiye',
      },
      secureNote: {
        ar: 'يخضع الدخول إلى الأنظمة لاشتراطات تسجيل الحسابات.',
        en: 'System access requires signed-in accounts.',
        fr: 'Accès au système protégé par compte sécurisé.',
      },
      returnToSite: {
        ar: 'العودة إلى الموقع',
        en: 'Return to Website',
        fr: 'Retour au site web',
      },
    },
    portalCards: [
      {
        id: 'website',
        title: { ar: 'الموقع الإلكتروني', en: 'Website', fr: 'Site web' },
        subtitle: { ar: 'Public Website', en: 'Website', fr: 'Site web' },
        description: { ar: 'استكشف خدمات السفر والمواعيد القنصلية والمدونة.', en: 'Explore travel, consular services and the blog.', fr: 'Découvrez voyages, services consulaires et blog.' },
        icon: 'Globe',
        destination: '/',
        visible: true,
        order: 1,
        cardBg: '#F8FAFC',
        borderColor: '#D7E7F7',
        badge: { ar: 'متاح للعامة', en: 'Public', fr: 'Public' },
      },
      {
        id: 'crm',
        title: { ar: 'نظام إدارة العملاء', en: 'CRM System', fr: 'Gestion CRM' },
        subtitle: { ar: 'CRM', en: 'CRM', fr: 'CRM' },
        description: { ar: 'تابع العملاء والمعاملات والفواتير والمهام اليومية.', en: 'Follow clients, transactions, invoices and daily tasks.', fr: 'Suivez clients, transactions, factures et tâches.' },
        icon: 'Users',
        destination: '/admin/crm',
        visible: true,
        featured: true,
        order: 2,
        cardBg: '#FFFFFF',
        borderColor: '#DCE6F2',
        badge: { ar: 'محمي برمز مرور', en: 'Protected', fr: 'Protégé' },
      },
      {
        id: 'admin',
        title: { ar: 'لوحة التحكم', en: 'Admin Panel', fr: 'Administration' },
        subtitle: { ar: 'Admin Panel', en: 'Admin Panel', fr: 'Administration' },
        description: { ar: 'أدر محتوى الموقع والخدمات والمقالات والمستخدمين والهوية.', en: 'Manage site content, services, blog and users.', fr: 'Gérez contenu, services, blog et utilisateurs.' },
        icon: 'Settings',
        destination: '/admin',
        visible: true,
        order: 3,
        cardBg: '#F8FAFC',
        borderColor: '#D7E7F7',
        badge: { ar: 'إداري خاص', en: 'Admin Only', fr: 'Admin' },
      },
    ],
    updatedAt: now,
    updatedBy: 'system',
    version: 1,
  };

  const adminLoginConfig: InterfaceThemeConfig = {
    target: 'admin_login',
    name: 'Admin Login',
    nameAr: 'مظهر تسجيل دخول الإدارة',
    inheritBrandColors: true,
    inheritTypography: true,
    layoutType: 'split-right',
    logoVariant: 'horizontal-on-white',
    illustrationLogoVariant: 'horizontal-on-blue',
    illustrationUrl: '/assets/brand/3d/02-consular-documents-transparent.png',
    illustrationPosition: 'center',
    illustrationVerticalPosition: 'center',
    illustrationScale: 100,
    illustrationOpacity: 100,
    illustrationFit: 'contain',
    illustrationBgGradient: 'radial-gradient(circle at center, #0B2E57 0%, #071629 100%)',
    colors: {},
    typography: {},
    formWidth: '480px',
    formBg: '#FFFFFF',
    formTextColor: '#0B2E57',
    formMutedColor: '#5E7086',
    inputBg: '#F8FAFC',
    inputBorder: '#D7E7F7',
    inputRadius: '12px',
    inputTextColor: '#0B2E57',
    primaryButtonBg: '#004AA5',
    primaryButtonTextColor: '#FFFFFF',
    primaryButtonRadius: '12px',
    texts: {
      panelKicker: {
        ar: 'ELFAZNI SERVICES · ADMIN',
        en: 'ELFAZNI SERVICES · ADMIN',
        fr: 'ELFAZNI SERVICES · ADMIN',
      },
      panelTitle: {
        ar: 'الفزني سيرفيسز',
        en: 'ELFAZNI SERVICES',
        fr: 'ELFAZNI SERVICES',
      },
      panelNote: {
        ar: 'مدونة، خدمات، ولوحة إدارة محتوى الموقع.',
        en: 'Blog, services and site content management.',
        fr: 'Blog, services et gestion du contenu du site.',
      },
      formKicker: {
        ar: 'لوحة إدارة الموقع',
        en: 'Site administration',
        fr: 'Administration du site',
      },
      loginTitle: {
        ar: 'تسجيل الدخول',
        en: 'Sign in',
        fr: 'Connexion',
      },
      loginDesc: {
        ar: 'أدخل بيانات حسابك للوصول إلى النظام.',
        en: 'Enter your account credentials to access the system.',
        fr: 'Saisissez vos identifiants pour accéder au système.',
      },
      submitButton: {
        ar: 'دخول إلى لوحة التحكم',
        en: 'Sign in to dashboard',
        fr: 'Connexion au tableau',
      },
    },
    updatedAt: now,
    updatedBy: 'system',
    version: 1,
  };

  const crmLoginConfig: InterfaceThemeConfig = {
    target: 'crm_login',
    name: 'CRM Login',
    nameAr: 'مظهر تسجيل دخول CRM',
    inheritBrandColors: true,
    inheritTypography: true,
    layoutType: 'split-right',
    logoVariant: 'horizontal-on-white',
    illustrationLogoVariant: 'horizontal-on-blue',
    illustrationUrl: '/assets/brand/3d/04-hotels-residency-transparent.png',
    illustrationPosition: 'center',
    illustrationVerticalPosition: 'center',
    illustrationScale: 100,
    illustrationOpacity: 100,
    illustrationFit: 'contain',
    illustrationBgGradient: 'radial-gradient(ellipse at top right, #004AA5 0%, #0B2E57 55%, #071629 100%)',
    colors: {},
    typography: {},
    formWidth: '480px',
    formBg: '#FFFFFF',
    formTextColor: '#0B2E57',
    formMutedColor: '#5E7086',
    inputBg: '#F8FAFC',
    inputBorder: '#D7E7F7',
    inputRadius: '12px',
    inputTextColor: '#0B2E57',
    primaryButtonBg: '#004AA5',
    primaryButtonTextColor: '#FFFFFF',
    primaryButtonRadius: '12px',
    texts: {
      panelKicker: {
        ar: 'ELFAZNI SERVICES · CRM',
        en: 'ELFAZNI SERVICES · CRM',
        fr: 'ELFAZNI SERVICES · CRM',
      },
      panelTitle: {
        ar: 'الفزني CRM',
        en: 'ELFAZNI CRM',
        fr: 'ELFAZNI CRM',
      },
      panelNote: {
        ar: 'نظام إدارة العملاء والمعاملات والحجوزات والمالية.',
        en: 'Customer, transaction, booking and accounting system.',
        fr: 'Système de gestion des clients, réservations et comptabilité.',
      },
      formKicker: {
        ar: 'نظام CRM',
        en: 'CRM system',
        fr: 'Système CRM',
      },
      loginTitle: {
        ar: 'نظام إدارة العملاء',
        en: 'CRM Sign In',
        fr: 'Connexion CRM',
      },
      loginDesc: {
        ar: 'إدارة العملاء والحجوزات والمعاملات من مكان واحد.',
        en: 'Manage clients, bookings and transactions from one place.',
        fr: 'Gérez clients, réservations et transactions depuis un seul endroit.',
      },
      submitButton: {
        ar: 'الدخول إلى CRM',
        en: 'Sign in to CRM',
        fr: 'Connexion au CRM',
      },
    },
    updatedAt: now,
    updatedBy: 'system',
    version: 1,
  };

  const globalConfig: InterfaceThemeConfig = {
    target: 'global',
    name: 'Global Brand Identity',
    nameAr: 'الهوية البصرية العامة',
    inheritBrandColors: true,
    inheritTypography: true,
    logoVariant: 'horizontal-on-white',
    colors: OFFICIAL_BRAND_COLORS,
    typography: OFFICIAL_TYPOGRAPHY,
    texts: {},
    updatedAt: now,
    updatedBy: 'system',
    version: 1,
  };

  const presets = getDefaultSystemPresets(now);
  const assets = getDefaultSystemAssets(now);

  return {
    globalBrand: {
      brandNameEn: 'ELFAZNI SERVICES',
      brandNameAr: 'الفزني للخدمات',
      colors: OFFICIAL_BRAND_COLORS,
      typography: OFFICIAL_TYPOGRAPHY,
      defaultLogoVariant: 'horizontal-on-white',
      updatedAt: now,
      updatedBy: 'system',
    },
    drafts: {
      global: { ...globalConfig },
      website: { ...websiteConfig },
      portal: { ...portalConfig },
      admin_login: { ...adminLoginConfig },
      crm_login: { ...crmLoginConfig },
    },
    published: {
      global: { ...globalConfig },
      website: { ...websiteConfig },
      portal: { ...portalConfig },
      admin_login: { ...adminLoginConfig },
      crm_login: { ...crmLoginConfig },
    },
    presets,
    versions: [
      {
        id: 'ver_init_website',
        target: 'website',
        versionNumber: 1,
        snapshot: { ...websiteConfig },
        publishedAt: now,
        publishedBy: 'system',
        changeSummary: 'النسخة الأولية الرسمية لمظهر الموقع الإلكتروني',
      },
      {
        id: 'ver_init_portal',
        target: 'portal',
        versionNumber: 1,
        snapshot: { ...portalConfig },
        publishedAt: now,
        publishedBy: 'system',
        changeSummary: 'النسخة الأولية الرسمية لمظهر البوابة الرئيسية (HUB)',
      },
      {
        id: 'ver_init_admin_login',
        target: 'admin_login',
        versionNumber: 1,
        snapshot: { ...adminLoginConfig },
        publishedAt: now,
        publishedBy: 'system',
        changeSummary: 'النسخة الأولية الرسمية لمظهر تسجيل دخول الإدارة',
      },
      {
        id: 'ver_init_crm_login',
        target: 'crm_login',
        versionNumber: 1,
        snapshot: { ...crmLoginConfig },
        publishedAt: now,
        publishedBy: 'system',
        changeSummary: 'النسخة الأولية الرسمية لمظهر تسجيل دخول CRM',
      },
      {
        id: 'ver_init_global',
        target: 'global',
        versionNumber: 1,
        snapshot: { ...globalConfig },
        publishedAt: now,
        publishedBy: 'system',
        changeSummary: 'النسخة الأولية للهوية البصرية العامة',
      },
    ],
    assets,
    auditLogs: [
      {
        id: 'log_init',
        action: 'PUBLISH',
        target: 'global',
        actorUsername: 'system',
        timestamp: now,
        details: 'تهيئة نظام إدارة المظهر والهوية البصرية المتقدم بنجاح',
      },
    ],
  };
}

export function getDefaultSystemPresets(now = new Date().toISOString()): ThemePreset[] {
  return [
    {
      id: 'official-elfazni',
      name: 'Official ELFAZNI',
      nameAr: 'هوية الفزني الرسمية',
      description: 'White form cards, official royal blue (#004AA5) and gold (#CC9048), classic corporate elegance.',
      descriptionAr: 'الخلفيات البيضاء النظيفة، الأزرق الملكي الرسمي #004AA5 والذهب المعتمد #CC9048.',
      previewColors: ['#004AA5', '#CC9048', '#FFFFFF', '#0B2E57'],
      globalColors: { ...OFFICIAL_BRAND_COLORS },
      typography: { ...OFFICIAL_TYPOGRAPHY },
      backgroundColor: '#071629',
      gradient: {
        enabled: true,
        type: 'linear',
        direction: 'to top',
        angle: 0,
        opacity: 0.88,
        stops: [
          { position: 0, color: '#012247', opacity: 0.96 },
          { position: 50, color: '#004AA5', opacity: 0.72 },
          { position: 100, color: '#071629', opacity: 0.25 },
        ],
      },
      logoVariant: 'horizontal-on-white',
      illustrationLogoVariant: 'horizontal-on-blue',
      kickerColor: '#CC9048',
      titleColor: '#FFFFFF',
      noteColor: '#E2E8F0',
      formBg: '#FFFFFF',
      formTextColor: '#0B2E57',
      formMutedColor: '#5E7086',
      inputBg: '#F8FAFC',
      inputBorder: '#D7E7F7',
      inputTextColor: '#0B2E57',
      primaryButtonBg: '#004AA5',
      primaryButtonTextColor: '#FFFFFF',
      isSystem: true,
      createdAt: now,
    },
    {
      id: 'premium-navy',
      name: 'Premium Royal Navy',
      nameAr: 'الكحلي الملكي الفاخر',
      description: 'Deep royal navy panel with warm gold glow, crisp light-blue tinted form, and royal navy buttons.',
      descriptionAr: 'لوحة كحلية ملكية عميقة مع إشراقة ذهبية ونموذج دخول فاخر بلمسات ذهبية رسمية.',
      previewColors: ['#0B2E57', '#CC9048', '#10345B', '#F0F6FF'],
      globalColors: {
        ...OFFICIAL_BRAND_COLORS,
        primary: '#0B2E57',
        secondary: '#071629',
        background: '#0B2E57',
        surface: '#F4F8FD',
        border: '#C5D9F2',
        button: '#0B2E57',
        buttonHover: '#004AA5',
      },
      typography: { ...OFFICIAL_TYPOGRAPHY },
      backgroundColor: '#051020',
      gradient: {
        enabled: true,
        type: 'radial',
        direction: 'to top',
        angle: 135,
        opacity: 0.92,
        stops: [
          { position: 0, color: '#10345B', opacity: 0.95 },
          { position: 60, color: '#0B2E57', opacity: 0.9 },
          { position: 100, color: '#040D1A', opacity: 0.98 },
        ],
      },
      logoVariant: 'horizontal-on-white',
      illustrationLogoVariant: 'horizontal-on-blue',
      kickerColor: '#CC9048',
      titleColor: '#FFFFFF',
      noteColor: '#CBD5E1',
      formBg: '#F4F8FD',
      formTextColor: '#0B2E57',
      formMutedColor: '#475569',
      inputBg: '#FFFFFF',
      inputBorder: '#BBD2EE',
      inputTextColor: '#0B2E57',
      primaryButtonBg: '#0B2E57',
      primaryButtonTextColor: '#FFFFFF',
      isSystem: true,
      createdAt: now,
    },
    {
      id: 'modern-minimal',
      name: 'Modern Minimal Light',
      nameAr: 'العصري البسيط (Minimal)',
      description: 'Ultra-clean bright sky-blue & alabaster visual panel with dark navy typography and minimal borders.',
      descriptionAr: 'واجهة فاتحة فائقة البساطة والنقاء مع لوحة سماوية مشرقة ونصوص كحلية عالية التباين.',
      previewColors: ['#0055CC', '#E0F2FE', '#FFFFFF', '#0F172A'],
      globalColors: {
        ...OFFICIAL_BRAND_COLORS,
        primary: '#0055CC',
        gold: '#CC9048',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        text: '#0F172A',
        mutedText: '#475569',
        border: '#E2E8F0',
        button: '#0055CC',
      },
      typography: { ...OFFICIAL_TYPOGRAPHY },
      backgroundColor: '#EBF4FF',
      gradient: {
        enabled: true,
        type: 'linear',
        direction: 'to bottom',
        angle: 180,
        opacity: 0.95,
        stops: [
          { position: 0, color: '#DBEAFE', opacity: 0.95 },
          { position: 55, color: '#EFF6FF', opacity: 0.9 },
          { position: 100, color: '#FFFFFF', opacity: 0.98 },
        ],
      },
      logoVariant: 'horizontal-on-white',
      illustrationLogoVariant: 'horizontal-on-white',
      kickerColor: '#004AA5',
      titleColor: '#0B2E57',
      noteColor: '#334155',
      formBg: '#FFFFFF',
      formTextColor: '#0F172A',
      formMutedColor: '#64748B',
      inputBg: '#F8FAFC',
      inputBorder: '#CBD5E1',
      inputTextColor: '#0F172A',
      primaryButtonBg: '#0055CC',
      primaryButtonTextColor: '#FFFFFF',
      isSystem: true,
      createdAt: now,
    },
    {
      id: 'elegant-gold',
      name: 'Elegant Warm Gold',
      nameAr: 'الذهب الدافئ الفاخر',
      description: 'Warm official gold (#CC9048) gradient panel, ivory cream form surface, and luxury gold action buttons.',
      descriptionAr: 'تدرج ذهبي ملكي دافئ مع بطاقة دخول عاجية فاخرة وأزرار ذهبية رسمية.',
      previewColors: ['#CC9048', '#81521C', '#FFFDF9', '#0B2E57'],
      globalColors: {
        ...OFFICIAL_BRAND_COLORS,
        primary: '#CC9048',
        secondary: '#0B2E57',
        button: '#CC9048',
        buttonHover: '#B57A33',
        border: '#EAD7BD',
        surface: '#FFFDF9',
      },
      typography: { ...OFFICIAL_TYPOGRAPHY },
      backgroundColor: '#2A1B0A',
      gradient: {
        enabled: true,
        type: 'linear',
        direction: 'to top',
        angle: 0,
        opacity: 0.92,
        stops: [
          { position: 0, color: '#1F1306', opacity: 0.96 },
          { position: 50, color: '#81521C', opacity: 0.85 },
          { position: 100, color: '#CC9048', opacity: 0.78 },
        ],
      },
      logoVariant: 'horizontal-on-white',
      illustrationLogoVariant: 'horizontal-on-blue',
      kickerColor: '#FDE68A',
      titleColor: '#FFFFFF',
      noteColor: '#FEF3C7',
      formBg: '#FFFDF9',
      formTextColor: '#0B2E57',
      formMutedColor: '#785C38',
      inputBg: '#FDF8F0',
      inputBorder: '#E6CFAF',
      inputTextColor: '#0B2E57',
      primaryButtonBg: '#CC9048',
      primaryButtonTextColor: '#FFFFFF',
      isSystem: true,
      createdAt: now,
    },
    {
      id: 'dark-modern',
      name: 'Executive Dark Mode',
      nameAr: 'النمط الداكن العصري',
      description: 'Obsidian dark slate (#0F172A) form and panel with luminous gold accents and high-contrast typography.',
      descriptionAr: 'مظهر ليلي داكن متكامل (#0F172A) للنموذج واللوحة البصرية مع إبراز الشعار والذهب الرسمي.',
      previewColors: ['#0F172A', '#1E293B', '#CC9048', '#38BDF8'],
      globalColors: {
        ...OFFICIAL_BRAND_COLORS,
        background: '#0F172A',
        surface: '#1E293B',
        text: '#F8FAFC',
        mutedText: '#94A3B8',
        border: '#334155',
        button: '#CC9048',
        buttonHover: '#B57A33',
      },
      typography: { ...OFFICIAL_TYPOGRAPHY },
      backgroundColor: '#020617',
      gradient: {
        enabled: true,
        type: 'linear',
        direction: 'to top',
        angle: 0,
        opacity: 0.94,
        stops: [
          { position: 0, color: '#020617', opacity: 0.98 },
          { position: 55, color: '#0F172A', opacity: 0.9 },
          { position: 100, color: '#1E293B', opacity: 0.75 },
        ],
      },
      logoVariant: 'horizontal-on-blue',
      illustrationLogoVariant: 'horizontal-on-blue',
      kickerColor: '#CC9048',
      titleColor: '#F8FAFC',
      noteColor: '#94A3B8',
      formBg: '#0F172A',
      formTextColor: '#F8FAFC',
      formMutedColor: '#94A3B8',
      inputBg: '#1E293B',
      inputBorder: '#334155',
      inputTextColor: '#F8FAFC',
      primaryButtonBg: '#CC9048',
      primaryButtonTextColor: '#0F172A',
      isSystem: true,
      createdAt: now,
    },
  ];
}

export function getDefaultSystemAssets(now = new Date().toISOString()): ThemeAsset[] {
  return [
    {
      id: 'asset_3d_01',
      filename: '01-master-service-hero-transparent.png',
      originalName: '01-master-service-hero-transparent.png',
      mimeType: 'image/png',
      size: 1940000,
      url: '/assets/brand/3d/01-master-service-hero-transparent.png',
      category: 'illustration',
      width: 1024,
      height: 1024,
      uploadedAt: now,
      uploadedBy: 'system',
    },
    {
      id: 'asset_3d_02',
      filename: '02-consular-documents-transparent.png',
      originalName: '02-consular-documents-transparent.png',
      mimeType: 'image/png',
      size: 1820000,
      url: '/assets/brand/3d/02-consular-documents-transparent.png',
      category: 'illustration',
      width: 1024,
      height: 1024,
      uploadedAt: now,
      uploadedBy: 'system',
    },
    {
      id: 'asset_3d_03',
      filename: '03-translation-transparent.png',
      originalName: '03-translation-transparent.png',
      mimeType: 'image/png',
      size: 1640000,
      url: '/assets/brand/3d/03-translation-transparent.png',
      category: 'illustration',
      width: 1024,
      height: 1024,
      uploadedAt: now,
      uploadedBy: 'system',
    },
    {
      id: 'asset_3d_04',
      filename: '04-hotels-residency-transparent.png',
      originalName: '04-hotels-residency-transparent.png',
      mimeType: 'image/png',
      size: 1610000,
      url: '/assets/brand/3d/04-hotels-residency-transparent.png',
      category: 'illustration',
      width: 1024,
      height: 1024,
      uploadedAt: now,
      uploadedBy: 'system',
    },
    {
      id: 'asset_3d_05',
      filename: '05-brand-applications-transparent.png',
      originalName: '05-brand-applications-transparent.png',
      mimeType: 'image/png',
      size: 1850000,
      url: '/assets/brand/3d/05-brand-applications-transparent.png',
      category: 'illustration',
      width: 1024,
      height: 1024,
      uploadedAt: now,
      uploadedBy: 'system',
    },
    {
      id: 'asset_3d_06',
      filename: '06-brand-wave-transparent.png',
      originalName: '06-brand-wave-transparent.png',
      mimeType: 'image/png',
      size: 537000,
      url: '/assets/brand/3d/06-brand-wave-transparent.png',
      category: 'background',
      width: 1024,
      height: 1024,
      uploadedAt: now,
      uploadedBy: 'system',
    },
    {
      id: 'asset_3d_07',
      filename: '07-hero-flight-appointment-transparent.png',
      originalName: '07-hero-flight-appointment-transparent.png',
      mimeType: 'image/png',
      size: 1910000,
      url: '/assets/brand/3d/07-hero-flight-appointment-transparent.png',
      category: 'illustration',
      width: 1024,
      height: 1024,
      uploadedAt: now,
      uploadedBy: 'system',
    },
    {
      id: 'asset_3d_08',
      filename: '08-appointment-documents-transparent.png',
      originalName: '08-appointment-documents-transparent.png',
      mimeType: 'image/png',
      size: 1620000,
      url: '/assets/brand/3d/08-appointment-documents-transparent.png',
      category: 'illustration',
      width: 1024,
      height: 1024,
      uploadedAt: now,
      uploadedBy: 'system',
    },
    {
      id: 'asset_3d_09',
      filename: '09-hotels-stays-transparent.png',
      originalName: '09-hotels-stays-transparent.png',
      mimeType: 'image/png',
      size: 1540000,
      url: '/assets/brand/3d/09-hotels-stays-transparent.png',
      category: 'illustration',
      width: 1024,
      height: 1024,
      uploadedAt: now,
      uploadedBy: 'system',
    },
    {
      id: 'asset_3d_10',
      filename: '10-applications-wide.png',
      originalName: '10-applications-wide.png',
      mimeType: 'image/png',
      size: 1410000,
      url: '/assets/brand/3d/10-applications-wide.png',
      category: 'background',
      width: 1440,
      height: 900,
      uploadedAt: now,
      uploadedBy: 'system',
    },
    {
      id: 'asset_3d_11',
      filename: '11-brand-ribbon-transparent.png',
      originalName: '11-brand-ribbon-transparent.png',
      mimeType: 'image/png',
      size: 383000,
      url: '/assets/brand/3d/11-brand-ribbon-transparent.png',
      category: 'background',
      width: 1024,
      height: 1024,
      uploadedAt: now,
      uploadedBy: 'system',
    },
    {
      id: 'asset_3d_12',
      filename: '12-translation-documents-transparent.png',
      originalName: '12-translation-documents-transparent.png',
      mimeType: 'image/png',
      size: 1420000,
      url: '/assets/brand/3d/12-translation-documents-transparent.png',
      category: 'illustration',
      width: 1024,
      height: 1024,
      uploadedAt: now,
      uploadedBy: 'system',
    },
    {
      id: 'asset_logo_horiz_white',
      filename: 'elfazni-horizontal-on-white.svg',
      originalName: 'elfazni-horizontal-on-white.svg',
      mimeType: 'image/svg+xml',
      size: 85000,
      url: '/assets/logos/elfazni-horizontal-on-white.svg',
      category: 'logo',
      uploadedAt: now,
      uploadedBy: 'system',
    },
    {
      id: 'asset_logo_horiz_blue',
      filename: 'elfazni-horizontal-on-blue.svg',
      originalName: 'elfazni-horizontal-on-blue.svg',
      mimeType: 'image/svg+xml',
      size: 85000,
      url: '/assets/logos/elfazni-horizontal-on-blue.svg',
      category: 'logo',
      uploadedAt: now,
      uploadedBy: 'system',
    },
    {
      id: 'asset_logo_horiz_gold',
      filename: 'elfazni-horizontal-on-gold.svg',
      originalName: 'elfazni-horizontal-on-gold.svg',
      mimeType: 'image/svg+xml',
      size: 85000,
      url: '/assets/logos/elfazni-horizontal-on-gold.svg',
      category: 'logo',
      uploadedAt: now,
      uploadedBy: 'system',
    },
    {
      id: 'asset_logo_vert_white',
      filename: 'elfazni-vertical-on-white.svg',
      originalName: 'elfazni-vertical-on-white.svg',
      mimeType: 'image/svg+xml',
      size: 85000,
      url: '/assets/logos/elfazni-vertical-on-white.svg',
      category: 'logo',
      uploadedAt: now,
      uploadedBy: 'system',
    },
    {
      id: 'asset_logo_vert_blue',
      filename: 'elfazni-vertical-on-blue.svg',
      originalName: 'elfazni-vertical-on-blue.svg',
      mimeType: 'image/svg+xml',
      size: 85000,
      url: '/assets/logos/elfazni-vertical-on-blue.svg',
      category: 'logo',
      uploadedAt: now,
      uploadedBy: 'system',
    },
  ];
}

const LEGACY_ASSET_MAP: Record<string, string> = {
  '/assets/brand/3d/01-flight-globe-transparent.png': '/assets/brand/3d/01-master-service-hero-transparent.png',
  '/assets/brand/3d/03-hotel-suitcase-transparent.png': '/assets/brand/3d/03-translation-transparent.png',
  '/assets/brand/3d/04-financial-accounting-transparent.png': '/assets/brand/3d/04-hotels-residency-transparent.png',
  '/assets/brand/3d/05-vip-transfer-transparent.png': '/assets/brand/3d/05-brand-applications-transparent.png',
};

export function normalizeAssetUrl(url?: string): string | undefined {
  if (!url) return url;
  return LEGACY_ASSET_MAP[url] || url;
}

function normalizeDatabase(db: ThemesDatabase): ThemesDatabase {
  let dirty = false;
  const sysPresets = getDefaultSystemPresets();

  // Upgrade system presets so they always have complete visual fields
  for (const sp of sysPresets) {
    const idx = db.presets.findIndex((p) => p.id === sp.id);
    if (idx === -1) {
      db.presets.push(sp);
      dirty = true;
    } else if (!db.presets[idx].gradient || !db.presets[idx].formBg) {
      db.presets[idx] = { ...sp, ...db.presets[idx], gradient: sp.gradient, backgroundColor: sp.backgroundColor, kickerColor: sp.kickerColor, titleColor: sp.titleColor, noteColor: sp.noteColor, formBg: sp.formBg, formTextColor: sp.formTextColor, formMutedColor: sp.formMutedColor, inputBg: sp.inputBg, inputBorder: sp.inputBorder, inputTextColor: sp.inputTextColor, primaryButtonBg: sp.primaryButtonBg, primaryButtonTextColor: sp.primaryButtonTextColor, logoVariant: sp.logoVariant, illustrationLogoVariant: sp.illustrationLogoVariant };
      dirty = true;
    }
  }

  // Ensure all existing real 3D assets are registered and broken ones removed
  const sysAssets = getDefaultSystemAssets();
  const brokenUrls = new Set(Object.keys(LEGACY_ASSET_MAP));
  const filteredAssets = (db.assets || []).filter((a) => !brokenUrls.has(a.url));
  if (filteredAssets.length !== (db.assets || []).length) {
    db.assets = filteredAssets;
    dirty = true;
  }
  for (const sa of sysAssets) {
    if (!db.assets.some((a) => a.url === sa.url)) {
      db.assets.push(sa);
      dirty = true;
    }
  }

  // Fix broken illustration/background URLs in drafts and published configs
  for (const dict of [db.drafts, db.published]) {
    if (!dict) continue;
    for (const key of Object.keys(dict) as InterfaceTarget[]) {
      const cfg = dict[key];
      if (!cfg) continue;
      if (cfg.illustrationUrl && LEGACY_ASSET_MAP[cfg.illustrationUrl]) {
        cfg.illustrationUrl = LEGACY_ASSET_MAP[cfg.illustrationUrl];
        dirty = true;
      }
      if (cfg.decorativeIllustration && LEGACY_ASSET_MAP[cfg.decorativeIllustration]) {
        cfg.decorativeIllustration = LEGACY_ASSET_MAP[cfg.decorativeIllustration];
        dirty = true;
      }
      if (cfg.backgroundImage && LEGACY_ASSET_MAP[cfg.backgroundImage]) {
        cfg.backgroundImage = LEGACY_ASSET_MAP[cfg.backgroundImage];
        dirty = true;
      }
    }
  }

  if (dirty) {
    writeThemes(db);
  }
  return db;
}

export function readThemes(): ThemesDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(THEMES_FILE)) {
      const initial = createInitialDatabase();
      fs.writeFileSync(THEMES_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(THEMES_FILE, 'utf8');
    const parsed = JSON.parse(raw) as ThemesDatabase;
    return normalizeDatabase(parsed);
  } catch (err) {
    console.error('Failed reading themes.json:', err);
    return createInitialDatabase();
  }
}

export function writeThemes(db: ThemesDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${THEMES_FILE}.${process.pid}.${Date.now()}_${Math.random().toString(36).slice(2, 8)}.tmp`;
    try {
      fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf8');
      fs.renameSync(tempFile, THEMES_FILE);
    } catch {
      fs.writeFileSync(THEMES_FILE, JSON.stringify(db, null, 2), 'utf8');
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    }
  } catch (err) {
    console.error('Failed writing themes.json:', err);
  }
}

/**
 * Resolves effective colors for an interface taking global inheritance and overrides into account.
 */
export function resolveEffectiveTheme(target: InterfaceTarget, useDraft = false): InterfaceThemeConfig {
  const db = readThemes();
  const sourceDict = useDraft ? db.drafts : db.published;
  const config = sourceDict[target] || db.published[target] || db.published.global;
  const globalBrand = useDraft ? (db.drafts.global || db.published.global) : db.published.global;

  if (target === 'global') {
    return {
      ...config,
      colors: { ...OFFICIAL_BRAND_COLORS, ...(config.colors || {}) },
      typography: { ...OFFICIAL_TYPOGRAPHY, ...(config.typography || {}) },
    };
  }

  const effectiveColors: ThemeColors = {
    ...OFFICIAL_BRAND_COLORS,
    ...((globalBrand?.colors || {}) as any),
  };

  if (!config.inheritBrandColors && config.colors) {
    Object.assign(effectiveColors, config.colors);
  } else if (config.colors) {
    // Inherit from global, but keep explicit local overrides
    Object.entries(config.colors).forEach(([k, v]) => {
      if (v) (effectiveColors as any)[k] = v;
    });
  }

  const effectiveTypography: ThemeTypography = {
    ...OFFICIAL_TYPOGRAPHY,
    ...(globalBrand?.typography || {}),
  };

  if (!config.inheritTypography && config.typography) {
    Object.assign(effectiveTypography, config.typography);
  } else if (config.typography) {
    Object.entries(config.typography).forEach(([k, v]) => {
      if (v) (effectiveTypography as any)[k] = v;
    });
  }

  const resolvedLayers = config.layers && config.layers.length > 0 ? config.layers : DEFAULT_LAYERS;
  const resolvedGradient = config.gradient ? config.gradient : (globalBrand?.gradient || DEFAULT_GRADIENT);

  const defaultIllus =
    target === 'crm_login'
      ? '/assets/brand/3d/04-hotels-residency-transparent.png'
      : target === 'portal'
      ? '/assets/brand/3d/07-hero-flight-appointment-transparent.png'
      : '/assets/brand/3d/02-consular-documents-transparent.png';

  const isVisualTarget = target === 'admin_login' || target === 'crm_login' || target === 'portal';

  return {
    ...config,
    colors: effectiveColors,
    typography: effectiveTypography,
    layers: resolvedLayers,
    gradient: resolvedGradient,
    illustrationUrl: normalizeAssetUrl(config.illustrationUrl) || (isVisualTarget ? defaultIllus : undefined),
    decorativeIllustration: normalizeAssetUrl(config.decorativeIllustration) || (target === 'portal' ? defaultIllus : undefined),
    kickerColor: config.kickerColor || globalBrand?.kickerColor || (isVisualTarget ? '#CC9048' : undefined),
    titleColor: config.titleColor || globalBrand?.titleColor || (isVisualTarget ? '#FFFFFF' : undefined),
    noteColor: config.noteColor || globalBrand?.noteColor || (isVisualTarget ? '#E2E8F0' : undefined),
    backgroundColor: config.backgroundColor || globalBrand?.backgroundColor || (isVisualTarget ? '#071629' : undefined),
    backgroundImage: config.backgroundImage !== undefined ? normalizeAssetUrl(config.backgroundImage) : (isVisualTarget ? '/assets/brand/3d/01-master-service-hero-transparent.png' : undefined),
    formBg: config.formBg || globalBrand?.formBg || effectiveColors.surface || '#FFFFFF',
    formTextColor: config.formTextColor || globalBrand?.formTextColor || effectiveColors.text || '#0B2E57',
    formMutedColor: config.formMutedColor || globalBrand?.formMutedColor || effectiveColors.mutedText || '#5E7086',
    inputBg: config.inputBg || globalBrand?.inputBg || '#F8FAFC',
    inputBorder: config.inputBorder || globalBrand?.inputBorder || effectiveColors.border || '#D7E7F7',
    inputTextColor: config.inputTextColor || globalBrand?.inputTextColor || effectiveColors.text || '#0B2E57',
    primaryButtonBg: config.primaryButtonBg || globalBrand?.primaryButtonBg || effectiveColors.button || '#004AA5',
    primaryButtonTextColor: config.primaryButtonTextColor || globalBrand?.primaryButtonTextColor || '#FFFFFF',
  };
}
