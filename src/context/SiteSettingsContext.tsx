import { homepageSections, type HomepageSection } from '../data/siteVisibility';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, SiteSettings, SiteService, ChatStatus, PageSeoItem } from '../services/api';
import { realtime } from '../services/realtime';
import { SITE_CONTACT } from '../data/content';

const DEFAULT_SETTINGS: SiteSettings = {
  siteNameAr: 'الفزني للخدمات',
  siteNameEn: 'ELFAZNI SERVICES',
  taglineAr: 'خدمات سهلة وواضحة للجالية المغربية في تركيا',
  phone: SITE_CONTACT.phoneDisplay || '+90 537 788 53 33',
  whatsapp: SITE_CONTACT.phoneDisplay || '+90 537 788 53 33',
  whatsappRaw: SITE_CONTACT.whatsappRaw || '905377885333',
  email: 'rachidelfazni@gmail.com',
  addressAr: 'إسطنبول، تركيا',
  workingHoursAr: 'يومياً 08:00 - 23:00',
  instagram: SITE_CONTACT.instagram || 'https://www.instagram.com/elfazni.services',
  facebook: SITE_CONTACT.facebook || 'https://www.facebook.com/elfazni.services',
  founderName: 'رشيد الفزني (Rachid Elfazni)',
  founderTitleAr: 'المؤسس وإدارة الخدمات',
  founderBioAr:
    'أنا رشيد الفزني، مؤسس ELFAZNI SERVICES. أعمل على تسهيل الخدمات الإدارية وخدمات السفر للجالية المغربية في تركيا، من خلال تواصل مباشر وخطوات واضحة ومتابعة عملية عبر واتساب حتى اكتمال الطلب.',
  founderImage: '/assets/founder-rachid-elfazni-v2.webp',
};

function updateHeadMetaTag(selector: string, attrName: 'name' | 'property', attrValue: string, content: string) {
  if (typeof document === 'undefined' || !content) return;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function applySeoToDocumentHead(seo: PageSeoItem) {
  if (typeof document === 'undefined' || !seo) return;

  if (seo.metaTitle) {
    document.title = seo.metaTitle;
  }

  updateHeadMetaTag('meta[name="description"]', 'name', 'description', seo.metaDescription);
  updateHeadMetaTag('meta[name="keywords"]', 'name', 'keywords', seo.metaKeywords);
  updateHeadMetaTag('meta[name="robots"]', 'name', 'robots', seo.robots || 'index, follow');

  // OpenGraph tags
  const ogTitle = seo.ogTitle || seo.metaTitle;
  const ogDesc = seo.ogDescription || seo.metaDescription;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const absoluteOgImage =
    seo.ogImage && seo.ogImage.startsWith('/') ? `${origin}${seo.ogImage}` : seo.ogImage;

  updateHeadMetaTag('meta[property="og:title"]', 'property', 'og:title', ogTitle);
  updateHeadMetaTag('meta[property="og:description"]', 'property', 'og:description', ogDesc);
  if (absoluteOgImage) {
    updateHeadMetaTag('meta[property="og:image"]', 'property', 'og:image', absoluteOgImage);
    updateHeadMetaTag('meta[property="og:image:secure_url"]', 'property', 'og:image:secure_url', absoluteOgImage);
  }

  // Twitter Card tags
  updateHeadMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', ogTitle);
  updateHeadMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', ogDesc);
  if (absoluteOgImage) {
    updateHeadMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', absoluteOgImage);
  }

  // Canonical link
  if (seo.canonicalUrl) {
    let canonicalEl = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', seo.canonicalUrl);
  }
}

interface SiteSettingsContextType {
  settings: SiteSettings;
  services: SiteService[];
  isServiceVisible: (key: string) => boolean;
  isSectionVisible: (id: HomepageSection) => boolean;
  isPublicAnchorVisible: (href: string) => boolean;
  seoPages: PageSeoItem[];
  refreshSettings: () => Promise<void>;
  // Shared Live Chat state for Desktop Vertical Stack & Mobile Quick Dock
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  unreadChatCount: number;
  setUnreadChatCount: React.Dispatch<React.SetStateAction<number>>;
  adminOnline: boolean;
  setAdminOnline: React.Dispatch<React.SetStateAction<boolean>>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  services: [],
  isServiceVisible: () => true,
  isSectionVisible: () => true,
  isPublicAnchorVisible: () => true,
  seoPages: [],
  refreshSettings: async () => {},
  isChatOpen: false,
  setIsChatOpen: () => {},
  openChat: () => {},
  closeChat: () => {},
  toggleChat: () => {},
  unreadChatCount: 0,
  setUnreadChatCount: () => {},
  adminOnline: true,
  setAdminOnline: () => {},
});

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [settingsReady, setSettingsReady] = useState(false);
  const [services, setServices] = useState<SiteService[]>([]);
  const [seoPages, setSeoPages] = useState<PageSeoItem[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [adminOnline, setAdminOnline] = useState(true);

  const refreshSettings = async () => {
    try {
      const [settingsRes, servicesRes, statusRes, seoRes] = await Promise.all([
        api.getSettings().catch(() => ({ settings: null })),
        api.getServices().catch(() => ({ services: null })),
        api.getChatStatus().catch(() => ({ chatStatus: null })),
        api.getSeoPages().catch(() => ({ seoPages: [] })),
      ]);

      if (settingsRes.settings) {
        setSettingsReady(true);
        setSettings((prev) => ({
          ...prev,
          ...settingsRes.settings,
          whatsappRaw: (settingsRes.settings.whatsappRaw || settingsRes.settings.whatsapp || prev.whatsappRaw).replace(/[^0-9]/g, ''),
        }));
      }
      if (Array.isArray(servicesRes.services)) {
        setServices(servicesRes.services);
      }
      if (statusRes.chatStatus) {
        setAdminOnline(statusRes.chatStatus.adminOnline);
      }
      if (seoRes.seoPages && seoRes.seoPages.length > 0) {
        setSeoPages(seoRes.seoPages);
      }
    } catch {
      // fallback to defaults
    }
  };

  useEffect(() => {
    void refreshSettings();
    const onFocus = () => void refreshSettings();
    window.addEventListener('focus', onFocus);

    const unsubSettings = realtime.subscribe('settings:updated', (payload: any) => {
      if (payload?.settings) {
        setSettingsReady(true);
        setSettings((prev) => ({
          ...prev,
          ...payload.settings,
          whatsappRaw: (payload.settings.whatsappRaw || payload.settings.whatsapp || prev.whatsappRaw).replace(/[^0-9]/g, ''),
        }));
      }
    });

    const unsubServices = realtime.subscribe('services:updated', (payload: any) => {
      if (payload?.services) {
        setServices(payload.services);
      }
    });

    const unsubStatus = realtime.subscribe('chat:status', (status: ChatStatus) => {
      if (status && typeof status.adminOnline === 'boolean') {
        setAdminOnline(status.adminOnline);
      }
    });

    const unsubSeo = realtime.subscribe('seo:updated', (payload: any) => {
      if (payload?.seoPages) {
        setSeoPages(payload.seoPages);
      }
    });

    return () => {
      window.removeEventListener('focus', onFocus);
      unsubSettings();
      unsubServices();
      unsubStatus();
      unsubSeo();
    };
  }, []);

  // On a direct homepage link, the section may arrive after the settings and lazy content.
  useEffect(() => {
    if (!settingsReady || location.pathname !== '/' || !location.hash) return;
    const anchor = location.hash.slice(1);
    const scrollToSection = () => {
      const section = document.getElementById(anchor);
      if (!section) return false;
      section.scrollIntoView();
      return true;
    };
    if (scrollToSection()) return;
    const observer = new MutationObserver(() => {
      if (scrollToSection()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => observer.disconnect(), 3000);
    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [settingsReady]);

  // Automatically sync active page's SEO & Meta tags into document.head without editing index.html
  useEffect(() => {
    if (typeof window === 'undefined' || seoPages.length === 0) return;

    const syncCurrentRouteSeo = () => {
      const pathname = window.location.pathname || '/';
      const hash = window.location.hash || '';
      const fullRoute = hash ? `${pathname}${hash}` : pathname;

      // Match exact route+hash, or pathname, or fallback to '/'
      const matched =
        seoPages.find((p) => p.pagePath === fullRoute) ||
        seoPages.find((p) => p.pagePath === pathname) ||
        (pathname === '/' ? seoPages.find((p) => p.pagePath === '/') : undefined);

      if (matched) {
        applySeoToDocumentHead(matched);
      }
    };

    syncCurrentRouteSeo();
    window.addEventListener('popstate', syncCurrentRouteSeo);
    window.addEventListener('hashchange', syncCurrentRouteSeo);

    return () => {
      window.removeEventListener('popstate', syncCurrentRouteSeo);
      window.removeEventListener('hashchange', syncCurrentRouteSeo);
    };
  }, [seoPages]);

  const openChat = () => {
    setIsChatOpen(true);
    setUnreadChatCount(0);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const toggleChat = () => {
    setIsChatOpen((prev) => {
      const next = !prev;
      if (next) setUnreadChatCount(0);
      return next;
    });
  };

  const isServiceVisible = (key: string) => services.some((service) => service.key === key && service.active !== false);
  const isSectionVisible = (id: HomepageSection) => settingsReady && !settings.hiddenSections?.includes(id);
  const isPublicAnchorVisible = (href: string) => {
    if (!href.startsWith('#')) return true;
    const anchor = href.slice(1);
    if (anchor === 'airport-transfer') return isSectionVisible('airlines') && isServiceVisible('airport');
    if (anchor === 'airlines') return isSectionVisible('airlines') && isServiceVisible('flights');
    if (anchor === 'consular-checklist') return isSectionVisible(anchor) && isServiceVisible('consular');
    if (anchor === 'services') return isSectionVisible(anchor) && services.length > 0;
    return !Object.hasOwn(homepageSections, anchor) || isSectionVisible(anchor as HomepageSection);
  };

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        services,
        isServiceVisible,
        isSectionVisible,
        isPublicAnchorVisible,
        seoPages,
        refreshSettings,
        isChatOpen,
        setIsChatOpen,
        openChat,
        closeChat,
        toggleChat,
        unreadChatCount,
        setUnreadChatCount,
        adminOnline,
        setAdminOnline,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SiteSettingsContext);


export function VisibleSection({ id, children }: { id: HomepageSection; children: React.ReactNode }) {
  const { isSectionVisible, isServiceVisible } = useSiteSettings();
  if (!isSectionVisible(id)) return null;
  if (id === 'consular-checklist' && !isServiceVisible('consular')) return null;
  if (id === 'airlines' && !['flights', 'hotels', 'airport'].some(isServiceVisible)) return null;
  return <>{children}</>;
}

export function VisibleService({ serviceKey, children }: { serviceKey: string; children: React.ReactNode }) {
  return useSiteSettings().isServiceVisible(serviceKey) ? <>{children}</> : null;
}
