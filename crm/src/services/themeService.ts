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

export const OFFICIAL_BRAND_COLORS: ThemeColors = {
  primary: '#004AA5',
  secondary: '#10345B',
  accent: '#CC9048',
  gold: '#CC9048',
  goldTextOnWhite: '#81521C',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#0B2E57',
  mutedText: '#64748B',
  border: '#D7E7F7',
  button: '#004AA5',
  buttonHover: '#0B70DD',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  navySupport: '#10345B',
};

export const OFFICIAL_TYPOGRAPHY: ThemeTypography = {
  fontFamily: "'Bahij', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  headingFontFamily: "'Bahij', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  baseFontSize: '16px',
  lineHeight: '1.6',
  letterSpacing: '0px',
  h1Size: '2.5rem',
  h2Size: '2rem',
  h3Size: '1.5rem',
  buttonFontSize: '15px',
  inputLabelSize: '14px',
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightBold: '700',
  fontWeightHeavy: '900',
};

export interface LayerConfig {
  id: 'logo' | 'content' | 'illustration' | 'gradient' | 'background';
  labelAr: string;
  labelEn: string;
  visible: boolean;
  locked?: boolean;
  zIndex: number;
  opacity?: number;
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
  angle?: number; // 0 - 360 deg
  stops: GradientStop[];
  opacity: number; // 0 - 1
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
  action: string;
  target: string;
  actorUsername: string;
  timestamp: string;
  details: string;
}

export interface ThemeAllDataResponse {
  success: boolean;
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

function getAuthToken(): string | null {
  return (
    localStorage.getItem('elfazni_auth_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('elfazni_token') ||
    sessionStorage.getItem('token')
  );
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const themeService = {
  /**
   * Fetches published active theme for an interface (public, never cached stale).
   */
  async getPublishedTheme(target: InterfaceTarget): Promise<InterfaceThemeConfig | null> {
    try {
      const res = await fetch(`/api/theme/published/${target}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.theme || null;
    } catch {
      return null;
    }
  },

  /**
   * Applies CSS variables onto document root element.
   */
  applyCssVariables(colors?: Partial<ThemeColors>, typography?: Partial<ThemeTypography>) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    if (colors) {
      if (colors.primary) root.style.setProperty('--brand-blue', colors.primary);
      if (colors.gold) root.style.setProperty('--brand-gold', colors.gold);
      if (colors.goldTextOnWhite) root.style.setProperty('--brand-gold-text-on-light', colors.goldTextOnWhite);
      if (colors.surface) root.style.setProperty('--surface-card', colors.surface);
      if (colors.background) root.style.setProperty('--surface-page', colors.background);
      if (colors.text) root.style.setProperty('--text-primary', colors.text);
      if (colors.border) root.style.setProperty('--border-subtle', colors.border);
      if (colors.navySupport) root.style.setProperty('--brand-navy-support', colors.navySupport);
    }

    if (typography) {
      if (typography.fontFamily) root.style.setProperty('--font-family-base', typography.fontFamily);
    }
  },

  /**
   * Fetches complete admin state: all drafts, published configs, presets, versions, media, audit logs.
   */
  async getAllThemeData(): Promise<ThemeAllDataResponse> {
    const res = await fetch(`/api/theme/all?t=${Date.now()}`, {
      cache: 'no-store',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'فشل تحميل بيانات إدارة المظهر' }));
      throw new Error(err.message || 'فشل تحميل بيانات إدارة المظهر');
    }
    return res.json();
  },

  /**
   * Saves draft theme without publishing.
   */
  async saveDraft(target: InterfaceTarget, updates: Partial<InterfaceThemeConfig>): Promise<InterfaceThemeConfig> {
    const res = await fetch(`/api/theme/draft/${target}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'فشل حفظ المسودة' }));
      throw new Error(err.message || 'فشل حفظ المسودة');
    }
    const data = await res.json();
    return data.draft;
  },

  /**
   * Publishes draft theme to public visitors.
   */
  async publishTheme(target: InterfaceTarget, changeSummary?: string): Promise<{ published: InterfaceThemeConfig; version: ThemeVersion }> {
    const res = await fetch(`/api/theme/publish/${target}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ changeSummary }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'فشل نشر المظهر' }));
      throw new Error(err.message || 'فشل نشر المظهر');
    }
    const data = await res.json();
    return { published: data.published, version: data.version };
  },

  /**
   * Restores a previously published version snapshot.
   */
  async restoreVersion(target: InterfaceTarget, versionId: string): Promise<InterfaceThemeConfig> {
    const res = await fetch(`/api/theme/restore/${target}/${versionId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'فشل استعادة النسخة السابقة' }));
      throw new Error(err.message || 'فشل استعادة النسخة السابقة');
    }
    const data = await res.json();
    return data.theme;
  },

  /**
   * Resets interface configuration to inherit from global brand settings.
   */
  async resetToGlobal(target: InterfaceTarget): Promise<InterfaceThemeConfig> {
    const res = await fetch(`/api/theme/reset/${target}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'فشل إعادة ضبط الهوية' }));
      throw new Error(err.message || 'فشل إعادة ضبط الهوية');
    }
    const data = await res.json();
    return data.draft;
  },

  /**
   * Applies a preset to a target interface or globally.
   */
  async applyPreset(
    presetId: string,
    target?: InterfaceTarget,
    options?: { forceOverwriteLocal?: boolean; autoPublish?: boolean }
  ): Promise<{ preset: ThemePreset; draft: InterfaceThemeConfig; effectiveTheme: InterfaceThemeConfig }> {
    const res = await fetch(`/api/theme/presets/apply/${presetId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ target, ...options }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'فشل تطبيق القالب' }));
      throw new Error(err.message || 'فشل تطبيق القالب');
    }
    return res.json();
  },

  /**
   * Creates a new custom preset (including full sourceConfig if saving current interface).
   */
  async createPreset(preset: Partial<ThemePreset> & { sourceConfig?: Partial<InterfaceThemeConfig> }): Promise<ThemePreset> {
    const res = await fetch('/api/theme/presets/create', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(preset),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'فشل حفظ القالب الجديد' }));
      throw new Error(err.message || 'فشل حفظ القالب الجديد');
    }
    const data = await res.json();
    return data.preset;
  },

  /**
   * Duplicates an existing preset into a new editable custom preset.
   */
  async duplicatePreset(presetId: string, nameAr?: string): Promise<ThemePreset> {
    const res = await fetch(`/api/theme/presets/duplicate/${presetId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ nameAr }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'فشل تكرار القالب' }));
      throw new Error(err.message || 'فشل تكرار القالب');
    }
    const data = await res.json();
    return data.preset;
  },

  /**
   * Updates/renames a custom preset.
   */
  async updatePreset(presetId: string, updates: Partial<ThemePreset>): Promise<ThemePreset> {
    const res = await fetch(`/api/theme/presets/${presetId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'فشل تحديث القالب' }));
      throw new Error(err.message || 'فشل تحديث القالب');
    }
    const data = await res.json();
    return data.preset;
  },

  /**
   * Deletes a custom preset.
   */
  async deletePreset(presetId: string): Promise<void> {
    const res = await fetch(`/api/theme/presets/${presetId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'فشل حذف القالب' }));
      throw new Error(err.message || 'فشل حذف القالب');
    }
  },

  /**
   * Uploads an image or SVG securely to Media Library.
   */
  async uploadMedia(file: File, category: ThemeAsset['category'] = 'illustration'): Promise<ThemeAsset> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const token = getAuthToken();
    const res = await fetch('/api/theme/media/upload', {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'فشل رفع الملف' }));
      throw new Error(err.message || 'فشل رفع الملف');
    }
    const data = await res.json();
    return data.asset;
  },

  /**
   * Deletes an asset from the Media Library.
   */
  async deleteMedia(id: string): Promise<void> {
    const res = await fetch(`/api/theme/media/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'فشل حذف الملف' }));
      throw new Error(err.message || 'فشل حذف الملف');
    }
  },
};
