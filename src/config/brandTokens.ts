/**
 * ELFAZNI SERVICES — Official Brand Design Tokens
 * Source of Truth: ELFAZNI_SERVICES_BRAND_COLORS.md
 * Colors extracted directly from the original authentic logo:
 * - Primary Blue: #004AA5
 * - Official Gold: #CC9048
 */

export const BRAND_COLORS = {
  // 1. Official Core Logo Colors
  primaryBlue: '#004AA5',
  officialGold: '#CC9048',
  white: '#FFFFFF',
  transparent: 'transparent',

  // 2. Supporting UI Tokens (as specified in ELFAZNI_SERVICES_BRAND_COLORS.md)
  navySupport: '#10345B',
  navyDeep: '#0B2E57',
  goldTextOnWhite: '#81521C', // Small accessible text token on white (contrast ratio >= 6.8:1)
  surfacePage: '#F7F9FC',
  surfaceCard: '#FFFFFF',
  textPrimary: '#102D4D',
  borderSubtle: '#DCE6F2',

  // 3. Supporting Tonal Accents
  blueBright: '#2A83D5',
  blueMist: '#EAF4FF',
  goldLight: '#F3DFC1',
  goldMuted: '#E5B97E',
} as const;

export const CSS_BRAND_VARIABLES = {
  '--brand-blue': BRAND_COLORS.primaryBlue,
  '--brand-gold': BRAND_COLORS.officialGold,
  '--brand-white': BRAND_COLORS.white,
  '--brand-navy-support': BRAND_COLORS.navySupport,
  '--brand-gold-text-on-light': BRAND_COLORS.goldTextOnWhite,
  '--surface-page': BRAND_COLORS.surfacePage,
  '--surface-card': BRAND_COLORS.surfaceCard,
  '--text-primary': BRAND_COLORS.textPrimary,
  '--border-subtle': BRAND_COLORS.borderSubtle,
} as const;
