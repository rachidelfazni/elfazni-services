import React, { useState, useEffect } from 'react';
import {
  Globe,
  Users,
  Settings,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { Language } from '../../data/translations';
import { BrandLogo } from '../common/BrandLogo';
import { themeService, type InterfaceThemeConfig } from '../../services/themeService';
import { ThemeVisualPanel } from '../common/ThemeVisualPanel';
import { ResizeHandle } from '../workspace/ResizeHandle';
import { clampPanelSize } from '../workspace/layoutPreferences';
import './hub-entry.css';

/**
 * ELFAZNI SERVICES HUB — unified access portal.
 * Route: /hub
 *
 * Identity (approved Blue-Gold Kit, classic edition): deep-blue page with
 * concentric arcs, a white split card carrying the soft-blue panel with
 * the official 3D service objects, language switcher, official logo
 * and the three entries.
 *
 * Security: the HUB is a navigation front only. CRM (/admin/crm) and the
 * Admin panel (/admin) keep their own session-based authentication — the
 * server redirects unauthenticated visitors to /admin/login. No credentials,
 * tokens or customer data exist on this page.
 */

interface HubCopy {
  heroKicker: string;
  heroTitle: string;
  heroDescription: string;
  photoKicker: string;
  photoTitle: string;
  photoNote: string;
  cards: Array<{
    title: string;
    subtitle: string;
    description: string;
  }>;
  secureNote: string;
  returnToSite: string;
  languageLabel: string;
}

const COPY: Record<Language, HubCopy> = {
  ar: {
    heroKicker: 'مركز الوصول الموحّد',
    heroTitle: 'بوابة الفزني سيرفيسز',
    heroDescription:
      'الوصول السريع إلى الموقع الإلكتروني ونظام إدارة العملاء ولوحة التحكم من مكان واحد.',
    photoKicker: 'ELFAZNI SERVICES HUB',
    photoTitle: 'بوابة الفزني سيرفيسز',
    photoNote: 'خدمات السفر والمعاملات في تركيا',
    cards: [
      {
        title: 'الموقع الإلكتروني',
        subtitle: 'Website',
        description: 'استكشف خدمات السفر والمواعيد القنصلية والمدونة.',
      },
      {
        title: 'نظام إدارة العملاء',
        subtitle: 'Customer Relationship Management',
        description: 'تابع العملاء والمعاملات والفواتير والمهام اليومية.',
      },
      {
        title: 'لوحة التحكم',
        subtitle: 'Administration Dashboard',
        description: 'أدر محتوى الموقع والخدمات والمقالات والمستخدمين.',
      },
    ],
    secureNote: 'يخضع الدخول إلى الأنظمة لاشتراطات تسجيل الحسابات.',
    returnToSite: 'العودة إلى الموقع',
    languageLabel: 'اللغة',
  },
  en: {
    heroKicker: 'UNIFIED ACCESS PORTAL',
    heroTitle: 'ELFAZNI SERVICES HUB',
    heroDescription:
      'Quick access to the website, the CRM system and the admin dashboard from a single place.',
    photoKicker: 'ELFAZNI SERVICES HUB',
    photoTitle: 'ELFAZNI SERVICES HUB',
    photoNote: 'Travel and consular services in Türkiye',
    cards: [
      {
        title: 'Website',
        subtitle: 'Website',
        description: 'Explore travel, consular services and the blog.',
      },
      {
        title: 'Customer Relationship Management',
        subtitle: 'CRM',
        description: 'Follow clients, transactions and invoices.',
      },
      {
        title: 'Administration Dashboard',
        subtitle: 'Admin Panel',
        description: 'Manage site content, services and users.',
      },
    ],
    secureNote: 'System access requires signed-in accounts.',
    returnToSite: 'Return to Website',
    languageLabel: 'Language',
  },
  fr: {
    heroKicker: 'PORTAIL D’ACCÈS UNIFIÉ',
    heroTitle: 'ELFAZNI SERVICES HUB',
    heroDescription:
      'Accès rapide au site web, au CRM et au tableau de bord d’administration depuis un seul endroit.',
    photoKicker: 'ELFAZNI SERVICES HUB',
    photoTitle: 'ELFAZNI SERVICES HUB',
    photoNote: 'Voyage et services consulaires en Türkiye',
    cards: [
      {
        title: 'Site web',
        subtitle: 'Website',
        description: 'Découvrez voyages, services consulaires et blog.',
      },
      {
        title: 'Gestion de la clientèle',
        subtitle: 'CRM',
        description: 'Suivez clients, transactions et factures.',
      },
      {
        title: 'Tableau de bord',
        subtitle: 'Administration',
        description: 'Gérez contenu, services et utilisateurs.',
      },
    ],
    secureNote: 'L’accès aux systèmes requiert un compte connecté.',
    returnToSite: 'Retour au site',
    languageLabel: 'Langue',
  },
  tr: {
    heroKicker: 'BİRLEŞİK ERİŞİM PORTALI',
    heroTitle: 'ELFAZNI SERVICES HUB',
    heroDescription:
      'Web sitesine, CRM sistemine ve yönetim paneline tek bir yerden hızlı erişim.',
    photoKicker: 'ELFAZNI SERVICES HUB',
    photoTitle: 'ELFAZNI SERVICES HUB',
    photoNote: 'Türkiye’de seyahat ve konsolosluk hizmetleri',
    cards: [
      {
        title: 'Web Sitesi',
        subtitle: 'Website',
        description: 'Seyahat, konsolosluk hizmetleri ve blogu keşfedin.',
      },
      {
        title: 'Müşteri Yönetimi',
        subtitle: 'CRM',
        description: 'Müşterileri, işlemleri ve faturaları takip edin.',
      },
      {
        title: 'Yönetim Paneli',
        subtitle: 'Administration Dashboard',
        description: 'Site içeriğini, hizmetleri ve kullanıcıları yönetin.',
      },
    ],
    secureNote: 'Sistem erişimi hesap girişi gerektirir.',
    returnToSite: 'Siteye Dön',
    languageLabel: 'Dil',
  },
};

const LANG_TABS: Array<{ code: Language; label: string }> = [
  { code: 'ar', label: 'ع' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'tr', label: 'TR' },
];

/** Verified destinations from the existing project (server.ts). */
const DESTINATIONS = {
  website: '/',
  crm: '/crm',
  admin: '/portal',
} as const;

export const HubPage: React.FC = () => {
  const { language, setLanguage, isRtl } = useLanguage();
  const copy = COPY[language] || COPY.ar;
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const [theme, setTheme] = useState<InterfaceThemeConfig | null>(null);

  // Resizable Hub Visual Panel State
  const [hubVisualWidth, setHubVisualWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 510;
    try {
      const saved = localStorage.getItem('elfazni_hub_visual_width');
      const num = saved ? parseInt(saved, 10) : 510;
      return isNaN(num) ? 510 : clampPanelSize(num, 340, 680);
    } catch {
      return 510;
    }
  });

  const handleHubVisualResize = (delta: number) => {
    setHubVisualWidth((prev) => {
      const next = clampPanelSize(prev + delta, 340, 680);
      try {
        localStorage.setItem('elfazni_hub_visual_width', String(next));
      } catch {}
      return next;
    });
  };

  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 940 : true));

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 940);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleResetHubVisual = () => {
    setHubVisualWidth(510);
    try {
      localStorage.setItem('elfazni_hub_visual_width', '510');
    } catch {}
  };

  useEffect(() => {
    let active = true;
    themeService.getPublishedTheme('portal').then((t) => {
      if (!active || !t) return;
      setTheme(t);
      themeService.applyCssVariables(t.colors, t.typography);
    }).catch((err) => {
      console.error('Failed to load published portal theme', err);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title =
      language === 'ar'
        ? 'بوابة الفزني سيرفيسز | ELFAZNI SERVICES HUB'
        : 'ELFAZNI SERVICES HUB | بوابة الفزني سيرفيسز';
    return () => {
      document.title = previousTitle;
    };
  }, [language]);

  interface TileItem {
    id: string;
    href: string;
    Icon: React.ElementType;
    title: string;
    subtitle: string;
    description: string;
    featured: boolean;
  }

  const defaultTiles: TileItem[] = [
    { id: 'website', href: DESTINATIONS.website, Icon: Globe, ...copy.cards[0], featured: false },
    { id: 'crm', href: DESTINATIONS.crm, Icon: Users, ...copy.cards[1], featured: true },
    { id: 'admin', href: DESTINATIONS.admin, Icon: Settings, ...copy.cards[2], featured: false },
  ];

  const getLocText = (val: any, fallback: string): string => {
    if (!val) return fallback;
    if (typeof val === 'string') return val;
    return val[language] || val.ar || fallback;
  };

  const resolveDestination = (dest: string | undefined, cardId: string) => {
    if (!dest) {
      return cardId === 'crm' ? DESTINATIONS.crm : cardId === 'admin' ? DESTINATIONS.admin : DESTINATIONS.website;
    }
    if (dest.includes('/admin/login?next=crm') || dest === '/admin/crm' || dest === '/crm') {
      return DESTINATIONS.crm;
    }
    if (dest.includes('/admin/login') || dest === '/admin' || dest === '/portal') {
      return DESTINATIONS.admin;
    }
    return dest;
  };

  const portalCards = theme?.portalCards || [];
  const tiles: TileItem[] = portalCards.length > 0
    ? portalCards
        .filter((c) => c.visible !== false)
        .map((c) => {
          const fallback = defaultTiles.find((t) => t.id === c.id) || defaultTiles[0];
          return {
            id: c.id,
            href: resolveDestination(c.destination, c.id),
            Icon: c.id === 'crm' ? Users : c.id === 'admin' ? Settings : Globe,
            title: getLocText(c.title, fallback.title),
            subtitle: getLocText(c.subtitle, fallback.subtitle),
            description: getLocText(c.description, fallback.description),
            featured: Boolean(c.featured),
          };
        })
    : defaultTiles;

  const heroKicker = getLocText(theme?.texts?.heroKicker || theme?.texts?.portal_kicker, copy.heroKicker);
  const heroTitle = getLocText(theme?.texts?.heroTitle || theme?.texts?.portal_title, copy.heroTitle);
  const heroDescription = getLocText(theme?.texts?.heroDescription || theme?.texts?.portal_desc || theme?.texts?.heroSubtitle, copy.heroDescription);
  const secureNote = getLocText(theme?.texts?.secureNote || theme?.texts?.portal_secure_note, copy.secureNote);
  const returnToSite = getLocText(theme?.texts?.returnToSite || theme?.texts?.portal_return_site, copy.returnToSite);

  const ob = theme?.outerBackground;
  const mp = theme?.menuPanel;
  const sp = theme?.sidePanel;

  // Zone A: Main Page Background Resolution
  const outerBgType = ob?.type || (ob?.image ? 'image' : 'radial_gradient');
  const outerBgImage = ob?.image || (ob?.type === 'image' ? theme?.backgroundImage : '') || '';
  const outerBgColor = ob?.color || theme?.backgroundColor || '#012247';
  const outerOverlay = ob?.overlay;

  const getOuterMainBackgroundStyle = (): React.CSSProperties => {
    if (outerBgType === 'transparent') {
      return { backgroundColor: 'transparent' };
    }
    if (outerBgType === 'solid') {
      return { backgroundColor: outerBgColor };
    }
    if (outerBgType === 'linear_gradient') {
      const dir = outerOverlay?.direction || '135deg';
      const c1 = outerOverlay?.startColor || outerBgColor;
      const c2 = outerOverlay?.endColor || '#011B38';
      return { background: `linear-gradient(${dir}, ${c1}, ${c2})` };
    }
    if (outerBgType === 'radial_gradient') {
      const c1 = outerOverlay?.startColor || '#0B2E57';
      const c2 = outerOverlay?.endColor || outerBgColor || '#011B38';
      return { background: `radial-gradient(circle at center, ${c1} 0%, ${c2} 70%, #000E20 100%)` };
    }
    // outerBgType === 'image'
    return {
      backgroundColor: outerBgColor,
      position: 'relative',
    };
  };

  return (
    <main
      dir={isRtl ? 'rtl' : 'ltr'}
      className="hub-entry relative min-h-screen flex items-center justify-center p-4 sm:p-8 overflow-hidden select-none"
      style={getOuterMainBackgroundStyle()}
    >
      {/* Zone A: Layer 1 - Main Background Image */}
      {(outerBgType === 'image' || Boolean(outerBgImage)) && outerBgImage && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden z-0"
          style={{
            backgroundImage: `url(${outerBgImage})`,
            backgroundSize: ob?.fit === 'contain' ? 'contain' : ob?.fit === 'original' ? 'auto' : 'cover',
            backgroundPosition: `${ob?.positionX ?? 'center'} ${ob?.positionY ?? 'center'}`,
            backgroundRepeat: 'no-repeat',
            transform: `translate(${ob?.customX || 0}px, ${ob?.customY || 0}px) scale(${(ob?.scale ?? 100) / 100})`,
            transformOrigin: 'center center',
            opacity: (ob?.opacity ?? 100) / 100,
            filter: `brightness(${ob?.brightness ?? 100}%) contrast(${ob?.contrast ?? 100}%) saturate(${ob?.saturation ?? 100}%) blur(${ob?.blur || 0}px)`,
          }}
        />
      )}

      {/* Zone A: Layer 2 - Gradient Overlay */}
      {outerOverlay?.enabled && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              outerOverlay.type === 'radial'
                ? `radial-gradient(circle at center, ${outerOverlay.startColor} 0%, ${outerOverlay.middleColor ? `${outerOverlay.middleColor} 50%, ` : ''}${outerOverlay.endColor} 100%)`
                : `linear-gradient(${outerOverlay.direction || '135deg'}, ${outerOverlay.startColor} 0%, ${outerOverlay.middleColor ? `${outerOverlay.middleColor} 50%, ` : ''}${outerOverlay.endColor} 100%)`,
            opacity: (outerOverlay.opacity ?? 75) / 100,
          }}
        />
      )}

      {/* Zone A: Subtle Geometric Pattern (when not plain transparent) */}
      {outerBgType !== 'transparent' && (
        <div
          className="absolute inset-0 pointer-events-none opacity-25 z-0"
          style={{
            backgroundImage:
              'repeating-radial-gradient(circle at 4% 116%, transparent 0 64px, rgba(255, 255, 255, 0.06) 64px 65.5px, transparent 65.5px 132px)',
          }}
        />
      )}

      <a
        href="#hub-tiles"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:end-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-white focus:text-[#0B2E57] focus:font-bold focus:shadow-lg"
      >
        {language === 'ar' ? 'تخطَّ إلى بطاقات الدخول' : 'Skip to access cards'}
      </a>

      {/* Zone B: Layer 3 - Central HUB Card */}
      <div
        className="hub-entry-shell relative z-10 transition-all"
        style={{
          backgroundColor: mp?.bgColor || theme?.formBg || '#FFFFFF',
          backgroundImage: mp?.bgImage ? `url(${mp.bgImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: (mp?.opacity ?? 100) / 100,
          borderRadius: mp?.borderRadius || theme?.cardRadius || '30px',
          borderWidth: mp?.borderColor ? '1px' : undefined,
          borderStyle: mp?.borderColor ? 'solid' : undefined,
          borderColor: mp?.borderColor || undefined,
          boxShadow:
            mp?.shadowIntensity === 'none'
              ? 'none'
              : mp?.shadowIntensity === 'sm'
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              : mp?.shadowIntensity === 'md'
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              : mp?.shadowIntensity === 'lg'
              ? '0 20px 25px -5px rgba(0, 0, 0, 0.15)'
              : mp?.shadowIntensity === '2xl'
              ? '0 35px 60px -15px rgba(0, 0, 0, 0.4)'
              : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: 'min(100%, 1240px)',
          maxWidth: '1240px',
        }}
      >
        {/* Zone C: Photographic side panel with 5 independent visual layers */}
        <div
          className="hub-entry-photo-wrapper"
          style={{ width: isDesktop ? hubVisualWidth : '100%' }}
        >
          <ThemeVisualPanel
            config={
              theme ||
              ({
                target: 'portal',
                illustrationUrl: '/assets/brand/3d/01-master-service-hero-transparent.png',
                illustrationScale: 100,
                backgroundColor: '#012247',
              } as any)
            }
            language={language}
            minHeight={isDesktop ? "660px" : "280px"}
            className="hub-entry-photo h-full w-full"
          />
        </div>

        {/* Desktop Resizable Separator Handle */}
        <div className="hidden md:flex shrink-0 items-stretch">
          <ResizeHandle
            id="hub-portal-split"
            direction="horizontal"
            isRtl={isRtl}
            onResize={handleHubVisualResize}
            onReset={handleResetHubVisual}
            currentSize={hubVisualWidth}
            minSize={340}
            maxSize={680}
            ariaLabel="مقبض تغيير حجم الواجهة المرئية للبوابة — Hub portal visual panel separator"
          />
        </div>

        {/* Content column */}
        <section
          className="hub-entry-content"
          aria-labelledby="hub-title"
          style={{
            maxWidth: mp?.width || undefined,
            padding: mp?.padding || undefined,
          }}
        >
          {/* 4-language switcher (mockup pill) */}
          <div
            className="hub-entry-langs"
            role="group"
            aria-label={copy.languageLabel}
          >
            {LANG_TABS.map((tab) => {
              const active = language === tab.code;
              return (
                <button
                  key={tab.code}
                  type="button"
                  onClick={() => setLanguage(tab.code)}
                  aria-pressed={active}
                  title={tab.code.toUpperCase()}
                  className={`hub-entry-lang${active ? ' is-active' : ''}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <BrandLogo
            background={mp?.logoVariant?.includes('blue') ? 'blue' : mp?.logoVariant?.includes('gold') ? 'gold' : 'white'}
            orientation={mp?.logoVariant?.includes('vertical') ? 'vertical' : 'horizontal'}
            size={mp?.logoSize || "lg"}
            className="hub-entry-logo"
          />

          <span className="hub-entry-kicker" style={{ color: theme?.kickerColor || mp?.kickerColor || '#CC9048' }}>
            {heroKicker}
          </span>
          <h1
            id="hub-title"
            className="hub-entry-title"
            style={{ color: theme?.titleColor || mp?.headingColor || theme?.formTextColor || '#0B2E57' }}
          >
            {heroTitle}
          </h1>
          <p
            className="hub-entry-desc"
            style={{ color: theme?.noteColor || mp?.descriptionColor || theme?.formMutedColor || '#5E7086' }}
          >
            {heroDescription}
          </p>

          {/* Entry tiles */}
          <div id="hub-tiles" className="hub-entry-tiles">
            {tiles.map(({ id, href, Icon, title, subtitle, description, featured }: TileItem) => {
              const cardConfig = portalCards.find((c) => c.id === id);
              const cardBg = cardConfig?.cardBg || mp?.buttonBg;
              const cardBorder = cardConfig?.borderColor || mp?.buttonBorderColor;
              return (
                <a
                  key={id}
                  href={cardConfig?.destination || href}
                  className={`hub-entry-tile${featured ? ' is-featured' : ''}`}
                  style={{
                    backgroundColor: featured ? undefined : cardBg,
                    borderColor: featured ? undefined : cardBorder,
                  }}
                >
                  <span className={`hub-entry-tile-icon${featured ? ' is-featured' : ''}`} aria-hidden="true">
                    <Icon size={20} strokeWidth={2.1} />
                  </span>
                  <span className="hub-entry-tile-body">
                    <strong style={{ color: featured ? '#FFFFFF' : (mp?.buttonTextColor || theme?.formTextColor || '#0B2E57') }}>
                      {title}
                    </strong>
                    <small style={{ color: featured ? '#D7E7F7' : (theme?.formMutedColor || '#5E7086') }}>
                      {description}
                    </small>
                  </span>
                  <ArrowIcon className="hub-entry-tile-arrow" size={18} aria-hidden="true" />
                  <span className="sr-only">{subtitle}</span>
                </a>
              );
            })}
          </div>

          <div className="hub-entry-foot">
            <p className="hub-entry-note" style={{ color: theme?.formMutedColor || '#5E7086' }}>
              {secureNote}
            </p>
            <a
              href={DESTINATIONS.website}
              className="hub-entry-back"
              style={{ color: theme?.primaryButtonBg || '#004AA5' }}
            >
              {returnToSite}
              <ArrowIcon size={15} aria-hidden="true" />
            </a>
          </div>
        </section>
      </div>

      <p className="hub-entry-copyright" dir="ltr">
        © {new Date().getFullYear()} ELFAZNI SERVICES · All rights reserved
      </p>
    </main>
  );
};

export default HubPage;
