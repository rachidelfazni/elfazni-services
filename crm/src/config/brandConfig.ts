/**
 * ELFAZNI SERVICES — Canonical Brand Configuration
 * Derived from the Brand Reference & Live Site:
 * https://elfazni.com
 */

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

export const BRAND_CONFIG = {
  // Brand Names (spelled strictly with 'ز' — never 'الفزني')
  name: env.VITE_BRAND_NAME || 'ELFAZNI SERVICES',
  nameArabic: 'الفزني سيرفيسز',
  nameArabicAlt: 'الفزني للخدمات',
  tagline: env.VITE_BRAND_TAGLINE || 'الفزني للخدمات والتسيير الإداري والقنصلي',
  founder: 'رشيد الفزني (Rachid Elfazni)',
  founderShort: 'رشيد الفزني',
  
  // Official URLs
  websiteUrl: env.VITE_WEBSITE_URL || 'https://elfazni.com',
  proWebsiteUrl: env.VITE_PRO_WEBSITE_URL || 'https://elfazni.com',
  onlineWebsiteUrl: env.VITE_ONLINE_WEBSITE_URL || 'https://elfazni.com',
  
  // Contacts
  phone: env.VITE_OFFICIAL_PHONE || '+905522677851',
  email: env.VITE_OFFICIAL_EMAIL || 'rachidelfazni@gmail.com',
  headquarters:
    (env.VITE_HEADQUARTERS || 'إسطنبول')
      .replace(/\s*[•–-]\s*أنقرة/g, '')
      .replace(/\s*[•–-]\s*الدار البيضاء/g, '')
      .trim() || 'إسطنبول',

  // Official Bank Accounts for Payment & Settlement
  bankAccounts: {
    accountHolder: 'RACHID EL FAZNI',
    ibanTRY: 'TR490020500009720667500001',
    ibanUSD: 'TR490020500009720667500101',
  },
  
  // Verified Assets
  assets: {
    logoHorizontal: '/admin/crm/assets/logo-horizontal.svg',
    logoVertical: '/admin/crm/assets/logo-vertical.svg',
    officialStamp: '/admin/crm/assets/aistudio/ELFAZNI_STEMP_80d69497.svg',
    phoneServices: '/admin/crm/assets/phone-services-transparent.webp',
    founderPortrait: '/admin/crm/assets/founder-rachid-elfazni-v2.webp',
  },

  // Canonical Palette Tokens from ELFAZNI Brand Reference (#004AA5 & #CC9048)
  colors: {
    navyDeep: '#0B2E57',      // Deepest navy for title text, dark surfaces
    navySupport: '#10345B',   // Supporting dark background
    blueSignal: '#004AA5',    // Official primary blue for actions, links, active states
    cyanOpen: '#2A83D5',      // Highlights, informational charts, aero accents
    goldWarm: '#CC9048',      // Official brand gold emblem and accents
    goldText: '#81521C',      // Accessible small gold text on light surfaces
    mist: '#EAF4FF',          // Soft cards, highlighted rows
    ivory: '#F7F9FC',         // Main workspace background
    surface: '#FFFFFF',       // Clean card surface
    borderSubtle: '#DCE6F2',  // Card and table borders
    textPrimary: '#102D4D',   // Primary text
    textMuted: '#5E7086',     // Secondary/muted text
    radiusControl: '10px',
    radiusCard: '16px',

    // Supporting aliases for legacy components
    blue: '#004AA5',
    blueDeep: '#10345B',
    blueBright: '#2A83D5',
    blueSoft: '#EAF4FF',
    gold: '#CC9048',
    goldLight: '#F3DFC1',
    ink: '#102D4D',
    muted: '#5E7086',
    line: '#DCE6F2',
    primaryNavy: '#0B2E57',
    secondaryNavy: '#004AA5',
    accentGold: '#CC9048',
    accentGoldLight: '#F3DFC1',
    aeroCyan: '#2A83D5',
    rubyRed: '#DC2626',
    emeraldSuccess: '#059669',
  },

  theme: {
    fontFamily: "'Bahij TheSansArabic', 'Bahij', 'Cairo', 'Tajawal', sans-serif",
    fontFamilyArabic: "'Bahij TheSansArabic', 'Bahij', 'Cairo', 'Tajawal', sans-serif",
    fontFamilyLatin: "'Poppins', sans-serif",
    style: 'elfazni-brand-family',
  },

  adminAuth: {
    username: env.VITE_ADMIN_USER || 'elfazni.admin',
    password: '',
  },
};
