import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.resolve(__dirname, '../data/themes.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const now = new Date().toISOString();

// 1. Assets Registration
const newAssets = [
  {
    id: 'asset_side_hub',
    filename: 'elfazni-hub-side.webp',
    originalName: 'ELFAZNI — Istanbul HUB Illustration',
    mimeType: 'image/webp',
    size: 562146,
    url: '/assets/brand/elfazni-hub-side.webp',
    category: 'illustration',
    width: 1344,
    height: 1800,
    uploadedAt: now,
    uploadedBy: 'system',
  },
  {
    id: 'asset_side_admin',
    filename: 'elfazni-admin-side.webp',
    originalName: 'ELFAZNI — Admin Architecture Illustration',
    mimeType: 'image/webp',
    size: 493936,
    url: '/assets/brand/elfazni-admin-side.webp',
    category: 'illustration',
    width: 1344,
    height: 1800,
    uploadedAt: now,
    uploadedBy: 'system',
  },
  {
    id: 'asset_side_crm',
    filename: 'elfazni-crm-side.webp',
    originalName: 'ELFAZNI — Executive CRM Interior',
    mimeType: 'image/webp',
    size: 319576,
    url: '/assets/brand/elfazni-crm-side.webp',
    category: 'illustration',
    width: 1344,
    height: 1800,
    uploadedAt: now,
    uploadedBy: 'system',
  },
];

if (!Array.isArray(data.assets)) data.assets = [];
for (const na of newAssets) {
  const idx = data.assets.findIndex((a) => a.id === na.id || a.url === na.url);
  if (idx >= 0) {
    data.assets[idx] = na;
  } else {
    data.assets.unshift(na);
  }
}

// 2. Shared Layers
const standardLayers = [
  { id: 'logo', labelAr: 'الشعار (Logo)', labelEn: 'Logo', visible: false, locked: false, zIndex: 5, opacity: 100 },
  { id: 'content', labelAr: 'العنوان والنصوص (Headings & Text)', labelEn: 'Headings & Text', visible: true, locked: false, zIndex: 4, opacity: 100 },
  { id: 'gradient', labelAr: 'التدرج اللوني (Gradient Overlay)', labelEn: 'Gradient Overlay', visible: true, locked: false, zIndex: 3, opacity: 90 },
  { id: 'illustration', labelAr: 'المجسم 3D التوضيحي (Illustration)', labelEn: 'Foreground Illustration', visible: true, locked: false, zIndex: 2, opacity: 100 },
  { id: 'background', labelAr: 'صورة / لون الخلفية (Background)', labelEn: 'Background Image / Color', visible: true, locked: false, zIndex: 1, opacity: 100 },
];

const standardGradient = {
  enabled: true,
  type: 'linear',
  direction: 'to top',
  angle: 0,
  opacity: 0.9,
  stops: [
    { position: 0, color: '#071629', opacity: 0.95 },
    { position: 35, color: '#071629', opacity: 0.75 },
    { position: 60, color: '#071629', opacity: 0.2 },
    { position: 100, color: '#071629', opacity: 0 },
  ],
};

// 3. TARGET: portal (HUB)
const portalConfig = {
  target: 'portal',
  name: 'Unified HUB Portal',
  nameAr: 'البوابة الموحدة (HUB)',
  inheritBrandColors: false,
  inheritTypography: false,
  layoutType: 'split-right',
  logoVariant: 'horizontal-on-white',
  colors: {
    primary: '#004AA5',
    secondary: '#0B2E57',
    accent: '#2A83D5',
    gold: '#CC9048',
    background: '#012247',
    surface: '#FFFFFF',
    text: '#0B2E57',
    mutedText: '#5E7086',
    button: '#004AA5',
  },
  typography: {
    fontFamily: '"Bahij_TheSansArabic", "Bahij", sans-serif',
    headingFontFamily: '"Bahij_TheSansArabic", "Bahij", sans-serif',
  },
  layers: standardLayers,
  gradient: standardGradient,
  backgroundColor: '#012247',
  illustrationUrl: '/assets/brand/elfazni-hub-side.webp',
  decorativeIllustration: '/assets/brand/elfazni-hub-side.webp',
  illustrationScale: 100,
  illustrationOpacity: 100,
  illustrationFit: 'cover',
  kickerColor: '#94A3B8',
  titleColor: '#FFFFFF',
  noteColor: '#E2E8F0',
  formBg: '#FFFFFF',
  formTextColor: '#0B2E57',
  formMutedColor: '#5E7086',
  inputBg: '#F8FAFC',
  inputBorder: '#D7E7F7',
  inputRadius: '12px',
  primaryButtonBg: '#004AA5',
  primaryButtonTextColor: '#FFFFFF',
  primaryButtonRadius: '14px',
  cardRadius: '30px',
  appliedPresetId: 'elfazni-istanbul-hub',
  appliedPresetName: 'الفزني — بوابة اسطنبول (HUB)',
  texts: {
    panelKicker: { ar: 'ELFAZNI SERVICES HUB', en: 'ELFAZNI SERVICES HUB', fr: 'ELFAZNI SERVICES HUB', tr: 'ELFAZNI SERVICES HUB' },
    panelTitle: { ar: 'بوابة الفزني سيرفيسز', en: 'ELFAZNI SERVICES HUB', fr: 'PORTAIL ELFAZNI SERVICES', tr: 'ELFAZNI SERVICES HUB' },
    panelNote: { ar: '', en: '', fr: '', tr: '' },
    heroKicker: { ar: 'مركز الوصول الموحّد', en: 'UNIFIED ACCESS PORTAL', fr: 'PORTAIL D’ACCÈS UNIFIÉ', tr: 'BİRLEŞİK ERİŞİM PORTALI' },
    heroTitle: { ar: 'بوابة الفزني سيرفيسز', en: 'ELFAZNI SERVICES HUB', fr: 'PORTAIL ELFAZNI SERVICES', tr: 'ELFAZNI SERVICES HUB' },
    heroDescription: {
      ar: 'الوصول السريع إلى الموقع الإلكتروني ونظام إدارة العملاء ولوحة التحكم في مكان واحد.',
      en: 'Quick access to the website, the CRM system and the admin dashboard from a single place.',
      fr: 'Accès rapide au site web, au CRM et au tableau de bord d’administration depuis un seul endroit.',
      tr: 'Web sitesine, CRM sistemine ve yönetim paneline tek bir yerden hızlı erişim.',
    },
    secureNote: {
      ar: 'يخضع الدخول إلى الأنظمة لصلاحيات حسابك.',
      en: 'System access is subject to your account permissions.',
      fr: 'L’accès aux systèmes est soumis aux permissions de votre compte.',
      tr: 'Sistem erişimi hesap izinlerinize tabidir.',
    },
    returnToSite: { ar: 'العودة إلى الموقع', en: 'Return to Website', fr: 'Retour au site', tr: 'Siteye Dön' },
  },
  portalCards: [
    {
      id: 'website',
      title: { ar: 'الموقع الإلكتروني', en: 'Website', fr: 'Site web', tr: 'Web Sitesi' },
      subtitle: { ar: 'Website', en: 'Website', fr: 'Site web', tr: 'Web Sitesi' },
      description: {
        ar: 'استكشف خدمات السفر والمواعيد القنصلية والمدونة.',
        en: 'Explore travel, consular services and the blog.',
        fr: 'Découvrez voyages, services consulaires et blog.',
        tr: 'Seyahat, konsolosluk hizmetleri ve blogu keşfedin.',
      },
      icon: 'globe',
      destination: '/',
      visible: true,
      featured: false,
      order: 1,
    },
    {
      id: 'crm',
      title: { ar: 'نظام إدارة العملاء', en: 'CRM System', fr: 'Système CRM', tr: 'Müşteri Yönetimi' },
      subtitle: { ar: 'CRM', en: 'CRM', fr: 'CRM', tr: 'CRM' },
      description: {
        ar: 'تابع العملاء والمعاملات والمواعيد والفواتير.',
        en: 'Follow clients, transactions and invoices.',
        fr: 'Suivez clients, transactions et factures.',
        tr: 'Müşterileri, işlemleri ve faturaları takip edin.',
      },
      icon: 'users',
      destination: '/portal/login?next=crm',
      visible: true,
      featured: true,
      order: 2,
    },
    {
      id: 'admin',
      title: { ar: 'لوحة التحكم', en: 'Admin Panel', fr: 'Tableau de bord', tr: 'Yönetim Paneli' },
      subtitle: { ar: 'Admin Panel', en: 'Admin Panel', fr: 'Administration', tr: 'Yönetim Paneli' },
      description: {
        ar: 'أدر محتوى الموقع والخدمات والمقالات والمستخدمين.',
        en: 'Manage site content, services and users.',
        fr: 'Gérez contenu, services et utilisateurs.',
        tr: 'Site içeriğini, hizmetleri ve kullanıcıları yönetin.',
      },
      icon: 'settings',
      destination: '/portal',
      visible: true,
      featured: false,
      order: 3,
    },
  ],
  outerBackground: {
    type: 'radial_gradient',
    color: '#012247',
    fit: 'cover',
    scale: 100,
    overlay: {
      enabled: true,
      type: 'radial',
      startColor: '#004AA5',
      middleColor: '#0B2E57',
      endColor: '#000E20',
      opacity: 75,
    },
  },
  menuPanel: {
    bgColor: '#FFFFFF',
    opacity: 100,
    borderColor: '#E2E8F0',
    borderRadius: '30px',
    shadowIntensity: '2xl',
    headingColor: '#0B2E57',
    descriptionColor: '#5E7086',
    kickerColor: '#CC9048',
    buttonBg: '#FFFFFF',
    buttonTextColor: '#0B2E57',
    buttonBorderColor: '#E2E8F0',
    logoSize: 'lg',
    logoVariant: 'horizontal-on-white',
    width: '520px',
  },
  sidePanel: {
    bgType: 'solid',
    bgColor: '#071629',
    foregroundImage: '/assets/brand/elfazni-hub-side.webp',
    illustrationFit: 'cover',
    illustrationScale: 100,
    illustrationOpacity: 100,
    kickerAr: 'ELFAZNI SERVICES HUB',
    headingAr: 'بوابة الفزني سيرفيسز',
    descriptionAr: '',
    headingColor: '#FFFFFF',
    descriptionColor: '#E2E8F0',
  },
  updatedAt: now,
  updatedBy: 'elfazni.admin',
  version: 2,
};

// 4. TARGET: admin_login
const adminLoginConfig = {
  target: 'admin_login',
  name: 'Admin Login',
  nameAr: 'تسجيل دخول الإدارة',
  inheritBrandColors: false,
  inheritTypography: false,
  layoutType: 'split-right',
  logoVariant: 'horizontal-on-white',
  colors: {
    primary: '#004AA5',
    secondary: '#0B2E57',
    accent: '#2A83D5',
    gold: '#CC9048',
    background: '#012247',
    surface: '#FFFFFF',
    text: '#0B2E57',
    mutedText: '#5E7086',
    button: '#004AA5',
  },
  typography: {
    fontFamily: '"Bahij_TheSansArabic", "Bahij", sans-serif',
    headingFontFamily: '"Bahij_TheSansArabic", "Bahij", sans-serif',
  },
  layers: standardLayers,
  gradient: standardGradient,
  backgroundColor: '#012247',
  illustrationUrl: '/assets/brand/elfazni-admin-side.webp',
  decorativeIllustration: '/assets/brand/elfazni-admin-side.webp',
  illustrationScale: 100,
  illustrationOpacity: 100,
  illustrationFit: 'cover',
  kickerColor: '#CBD5E1',
  titleColor: '#FFFFFF',
  noteColor: '#E2E8F0',
  formBg: '#FFFFFF',
  formTextColor: '#0B2E57',
  formMutedColor: '#5E7086',
  inputBg: '#F8FAFC',
  inputBorder: '#D7E7F7',
  inputRadius: '12px',
  primaryButtonBg: '#004AA5',
  primaryButtonTextColor: '#FFFFFF',
  primaryButtonRadius: '14px',
  cardRadius: '30px',
  appliedPresetId: 'elfazni-premium-admin',
  appliedPresetName: 'الفزني — لوحة الإدارة الفاخرة',
  texts: {
    panelKicker: { ar: 'إدارة الموقع', en: 'Site administration', fr: 'Administration du site', tr: 'Site yönetimi' },
    panelTitle: { ar: 'موقعك، من مكان واحد.', en: 'Your site, from one place.', fr: 'Votre site, en un seul endroit.', tr: 'Siteniz, tek bir yerden.' },
    panelNote: {
      ar: 'تابع المحادثات والرسائل، وحدّث محتوى موقعك.',
      en: 'Monitor conversations and messages, and update your site content.',
      fr: 'Suivez les conversations et messages, et mettez à jour votre contenu.',
      tr: 'Konuşmaları ve mesajları takip edin, site içeriğinizi güncelleyin.',
    },
    formKicker: { ar: 'لوحة إدارة الموقع', en: 'Site administration', fr: 'Administration du site', tr: 'Site yönetimi' },
    loginTitle: { ar: 'تسجيل الدخول للإدارة', en: 'Sign in', fr: 'Connexion', tr: 'Giriş' },
    loginDesc: {
      ar: 'أدخل بيانات حساب الإدارة للمتابعة.',
      en: 'Enter your account credentials to access the system.',
      fr: 'Saisissez vos identifiants pour accéder au système.',
      tr: 'Sisteme erişmek için hesap bilgilerinizi girin.'
    },
    submitButton: { ar: 'دخول إلى لوحة التحكم', en: 'Sign in to dashboard', fr: 'Connexion au tableau', tr: 'Yönetim paneline giriş' },
  },
  outerBackground: {
    type: 'radial_gradient',
    color: '#012247',
    fit: 'cover',
    scale: 100,
    overlay: {
      enabled: true,
      type: 'radial',
      startColor: '#0B2E57',
      middleColor: '#012247',
      endColor: '#000E20',
      opacity: 80,
    },
  },
  menuPanel: {
    bgColor: '#FFFFFF',
    opacity: 100,
    borderColor: '#E2E8F0',
    borderRadius: '30px',
    shadowIntensity: '2xl',
    headingColor: '#0B2E57',
    descriptionColor: '#5E7086',
    kickerColor: '#CC9048',
    buttonBg: '#004AA5',
    buttonTextColor: '#FFFFFF',
    buttonBorderColor: '#004AA5',
    logoSize: 'lg',
    logoVariant: 'horizontal-on-white',
    width: '480px',
  },
  sidePanel: {
    bgType: 'solid',
    bgColor: '#071629',
    foregroundImage: '/assets/brand/elfazni-admin-side.webp',
    illustrationFit: 'cover',
    illustrationScale: 100,
    illustrationOpacity: 100,
    kickerAr: 'إدارة الموقع',
    headingAr: 'موقعك، من مكان واحد.',
    descriptionAr: 'تابع المحادثات والرسائل، وحدّث محتوى موقعك.',
    headingColor: '#FFFFFF',
    descriptionColor: '#E2E8F0',
  },
  updatedAt: now,
  updatedBy: 'elfazni.admin',
  version: 2,
};

// 5. TARGET: crm_login
const crmLoginConfig = {
  target: 'crm_login',
  name: 'CRM Login',
  nameAr: 'تسجيل دخول CRM',
  inheritBrandColors: false,
  inheritTypography: false,
  layoutType: 'split-right',
  logoVariant: 'horizontal-on-white',
  colors: {
    primary: '#004AA5',
    secondary: '#0B2E57',
    accent: '#2A83D5',
    gold: '#CC9048',
    background: '#071629',
    surface: '#FFFFFF',
    text: '#0B2E57',
    mutedText: '#5E7086',
    button: '#004AA5',
  },
  typography: {
    fontFamily: '"Bahij_TheSansArabic", "Bahij", sans-serif',
    headingFontFamily: '"Bahij_TheSansArabic", "Bahij", sans-serif',
  },
  layers: standardLayers,
  gradient: standardGradient,
  backgroundColor: '#071629',
  illustrationUrl: '/assets/brand/elfazni-crm-side.webp',
  decorativeIllustration: '/assets/brand/elfazni-crm-side.webp',
  illustrationScale: 100,
  illustrationOpacity: 100,
  illustrationFit: 'cover',
  kickerColor: '#CBD5E1',
  titleColor: '#FFFFFF',
  noteColor: '#E2E8F0',
  formBg: '#FFFFFF',
  formTextColor: '#0B2E57',
  formMutedColor: '#5E7086',
  inputBg: '#F8FAFC',
  inputBorder: '#D7E7F7',
  inputRadius: '12px',
  primaryButtonBg: '#004AA5',
  primaryButtonTextColor: '#FFFFFF',
  primaryButtonRadius: '14px',
  cardRadius: '30px',
  appliedPresetId: 'elfazni-executive-crm',
  appliedPresetName: 'الفزني — نظام CRM التنفيذي',
  texts: {
    panelKicker: { ar: 'إدارة العملاء • CRM', en: 'Customer Management • CRM', fr: 'Gestion client • CRM', tr: 'Müşteri Yönetimi • CRM' },
    panelTitle: { ar: 'كل عميل، من أول تواصل.', en: 'Every client, from first contact.', fr: 'Chaque client, dès le premier contact.', tr: 'Her müşteri, ilk iletişimden itibaren.' },
    panelNote: {
      ar: 'الحجوزات والمعاملات والمتابعات في مساحة واحدة.',
      en: 'Bookings, transactions and follow-ups in one space.',
      fr: 'Réservations, transactions et suivis dans un seul espace.',
      tr: 'Rezervasyonlar, işlemler ve takipler tek bir alanda.',
    },
    formKicker: { ar: 'نظام CRM', en: 'CRM system', fr: 'Système CRM', tr: 'CRM sistemi' },
    loginTitle: { ar: 'تسجيل الدخول إلى CRM', en: 'CRM Sign In', fr: 'Connexion CRM', tr: 'CRM Girişi' },
    loginDesc: {
      ar: 'أدخل بيانات حساب الإدارة للمتابعة.',
      en: 'Enter your admin credentials to access the system.',
      fr: 'Saisissez vos identifiants pour accéder au système.',
      tr: 'Sisteme erişmek için hesap bilgilerinizi girin.'
    },
    submitButton: { ar: 'الدخول إلى CRM', en: 'Sign in to CRM', fr: 'Connexion au CRM', tr: 'CRM\'e giriş' },
  },
  outerBackground: {
    type: 'radial_gradient',
    color: '#071629',
    fit: 'cover',
    scale: 100,
    overlay: {
      enabled: true,
      type: 'radial',
      startColor: '#004AA5',
      middleColor: '#071629',
      endColor: '#000E20',
      opacity: 85,
    },
  },
  menuPanel: {
    bgColor: '#FFFFFF',
    opacity: 100,
    borderColor: '#E2E8F0',
    borderRadius: '30px',
    shadowIntensity: '2xl',
    headingColor: '#0B2E57',
    descriptionColor: '#5E7086',
    kickerColor: '#CC9048',
    buttonBg: '#004AA5',
    buttonTextColor: '#FFFFFF',
    buttonBorderColor: '#004AA5',
    logoSize: 'lg',
    logoVariant: 'horizontal-on-white',
    width: '480px',
  },
  sidePanel: {
    bgType: 'solid',
    bgColor: '#071629',
    foregroundImage: '/assets/brand/elfazni-crm-side.webp',
    illustrationFit: 'cover',
    illustrationScale: 100,
    illustrationOpacity: 100,
    kickerAr: 'إدارة العملاء • CRM',
    headingAr: 'كل عميل، من أول تواصل.',
    descriptionAr: 'الحجوزات والمعاملات والمتابعات في مساحة واحدة.',
    headingColor: '#FFFFFF',
    descriptionColor: '#E2E8F0',
  },
  updatedAt: now,
  updatedBy: 'elfazni.admin',
  version: 2,
};

// Apply to published and drafts
if (!data.published) data.published = {};
if (!data.drafts) data.drafts = {};

data.published.portal = portalConfig;
data.drafts.portal = portalConfig;

data.published.admin_login = adminLoginConfig;
data.drafts.admin_login = adminLoginConfig;

data.published.crm_login = crmLoginConfig;
data.drafts.crm_login = crmLoginConfig;

// 6. Add/Update the 3 Presets in data.presets
const customPresets = [
  {
    id: 'elfazni-istanbul-hub',
    name: 'ELFAZNI — Istanbul HUB',
    nameAr: 'الفزني — بوابة اسطنبول (HUB)',
    description: 'Architectural Ottoman-Moroccan royal blue arch framing the Bosphorus, clean white hub portal with 3 navigation tiles.',
    descriptionAr: 'قوس أزرق ملكي مغربي-عثماني يطل على البوسفور، بوابة بيضاء أنيقة مع 3 بطاقات للوصول السريع.',
    previewColors: ['#004AA5', '#CC9048', '#071629', '#FFFFFF'],
    globalColors: {
      primary: '#004AA5',
      secondary: '#0B2E57',
      accent: '#2A83D5',
      gold: '#CC9048',
      background: '#012247',
      surface: '#FFFFFF',
      text: '#0B2E57',
      mutedText: '#5E7086',
    },
    typography: {
      fontFamily: '"Bahij_TheSansArabic", "Bahij", sans-serif',
      headingFontFamily: '"Bahij_TheSansArabic", "Bahij", sans-serif',
    },
    illustrationUrl: '/assets/brand/elfazni-hub-side.webp',
    illustrationFit: 'cover',
    illustrationScale: 100,
    gradient: standardGradient,
    layers: standardLayers,
    logoVariant: 'horizontal-on-white',
    kickerColor: '#94A3B8',
    titleColor: '#FFFFFF',
    noteColor: '#E2E8F0',
    formBg: '#FFFFFF',
    formTextColor: '#0B2E57',
    formMutedColor: '#5E7086',
    primaryButtonBg: '#004AA5',
    primaryButtonTextColor: '#FFFFFF',
    outerBackground: portalConfig.outerBackground,
    menuPanel: portalConfig.menuPanel,
    sidePanel: portalConfig.sidePanel,
    isSystem: true,
    createdAt: now,
  },
  {
    id: 'elfazni-premium-admin',
    name: 'ELFAZNI — Premium Admin',
    nameAr: 'الفزني — لوحة الإدارة الفاخرة',
    description: 'Administrative sandstone archway overlooking Istanbul, clean login card with official identity.',
    descriptionAr: 'قوس حجري إداري يطل على مضيق البوسفور، بطاقة دخول بيضاء رسمية مع الهوية الملكية والذهبية.',
    previewColors: ['#004AA5', '#CC9048', '#071629', '#FFFFFF'],
    globalColors: {
      primary: '#004AA5',
      secondary: '#0B2E57',
      accent: '#2A83D5',
      gold: '#CC9048',
      background: '#012247',
      surface: '#FFFFFF',
      text: '#0B2E57',
      mutedText: '#5E7086',
    },
    typography: {
      fontFamily: '"Bahij_TheSansArabic", "Bahij", sans-serif',
      headingFontFamily: '"Bahij_TheSansArabic", "Bahij", sans-serif',
    },
    illustrationUrl: '/assets/brand/elfazni-admin-side.webp',
    illustrationFit: 'cover',
    illustrationScale: 100,
    gradient: standardGradient,
    layers: standardLayers,
    logoVariant: 'horizontal-on-white',
    kickerColor: '#CBD5E1',
    titleColor: '#FFFFFF',
    noteColor: '#E2E8F0',
    formBg: '#FFFFFF',
    formTextColor: '#0B2E57',
    formMutedColor: '#5E7086',
    primaryButtonBg: '#004AA5',
    primaryButtonTextColor: '#FFFFFF',
    outerBackground: adminLoginConfig.outerBackground,
    menuPanel: adminLoginConfig.menuPanel,
    sidePanel: adminLoginConfig.sidePanel,
    isSystem: true,
    createdAt: now,
  },
  {
    id: 'elfazni-executive-crm',
    name: 'ELFAZNI — Executive CRM',
    nameAr: 'الفزني — نظام CRM التنفيذي',
    description: 'Modern luxury executive office overlooking Bosphorus bridge, elegant client management login.',
    descriptionAr: 'مكتب تنفيذي فخم يطل على جسر البوسفور ومسجد أورتاكوي، واجهة إدارة علاقات العملاء الراقية.',
    previewColors: ['#004AA5', '#CC9048', '#071629', '#FFFFFF'],
    globalColors: {
      primary: '#004AA5',
      secondary: '#0B2E57',
      accent: '#2A83D5',
      gold: '#CC9048',
      background: '#071629',
      surface: '#FFFFFF',
      text: '#0B2E57',
      mutedText: '#5E7086',
    },
    typography: {
      fontFamily: '"Bahij_TheSansArabic", "Bahij", sans-serif',
      headingFontFamily: '"Bahij_TheSansArabic", "Bahij", sans-serif',
    },
    illustrationUrl: '/assets/brand/elfazni-crm-side.webp',
    illustrationFit: 'cover',
    illustrationScale: 100,
    gradient: standardGradient,
    layers: standardLayers,
    logoVariant: 'horizontal-on-white',
    kickerColor: '#CBD5E1',
    titleColor: '#FFFFFF',
    noteColor: '#E2E8F0',
    formBg: '#FFFFFF',
    formTextColor: '#0B2E57',
    formMutedColor: '#5E7086',
    primaryButtonBg: '#004AA5',
    primaryButtonTextColor: '#FFFFFF',
    outerBackground: crmLoginConfig.outerBackground,
    menuPanel: crmLoginConfig.menuPanel,
    sidePanel: crmLoginConfig.sidePanel,
    isSystem: true,
    createdAt: now,
  },
];

if (!Array.isArray(data.presets)) data.presets = [];
for (const p of customPresets) {
  const pIdx = data.presets.findIndex((x) => x.id === p.id);
  if (pIdx >= 0) {
    data.presets[pIdx] = p;
  } else {
    data.presets.unshift(p);
  }
}

// 7. Audit log
if (!Array.isArray(data.auditLogs)) data.auditLogs = [];
data.auditLogs.unshift({
  id: `log_${Date.now()}`,
  action: 'PUBLISH',
  target: 'portal,admin_login,crm_login',
  actorUsername: 'elfazni.admin',
  timestamp: now,
  details: 'نشر الهوية البصرية الجديدة لـ HUB وAdmin Login وCRM Login وحفظ القوالب الثلاثة بنجاح',
});

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated themes.json with portal, admin_login, and crm_login configurations and presets!');

