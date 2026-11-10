import React, { useState, useEffect } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { WhatsAppLogo } from './WhatsAppLogo';
import { BrandLogo } from './common/BrandLogo';

interface HeaderProps {
  onNavigate?: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { language, setLanguage, t } = useLanguage();
  const { settings, isPublicAnchorVisible } = useSiteSettings();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Active section observer
  useEffect(() => {
    const sections = ['services', 'consular-checklist', 'airlines', 'airport-transfer', 'about', 'contact-form'];
    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    });

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Handle escape key and body scroll lock for mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: '/', id: 'home', label: t('الرئيسية'), isRoute: true },
    { href: '#services', id: 'services', label: t('الخدمات') },
    { href: '#consular-checklist', id: 'consular-checklist', label: t('مواعيد القنصلية') },
    { href: '#airlines', id: 'airlines', label: t('حجوزات الطيران') },
    { href: '#airport-transfer', id: 'airport-transfer', label: t('التوصيل للمطار') },
    { href: '/blog', id: 'blog', label: t('المدونة') || 'المدونة', isRoute: true },
    { href: '#about', id: 'about', label: t('من نحن') },
    { href: '#contact-form', id: 'contact-form', label: t('تواصل معنا') },
  ];

  // Services dropdown items vs. top-level navigation items (Arabic order:
  // الرئيسية | الخدمات | المدونة | من نحن | تواصل معنا — §4 of the master brief).
  const SERVICE_DROPDOWN_IDS = ['services', 'consular-checklist', 'airlines', 'airport-transfer'];
  const dropdownLinks = navLinks.filter(
    (link) => SERVICE_DROPDOWN_IDS.includes(link.id) && isPublicAnchorVisible(link.href)
  );
  const topLevelLinks = navLinks.filter((link) => !SERVICE_DROPDOWN_IDS.includes(link.id));
  const hasActivePath = typeof location !== 'undefined' && (location.pathname === '/' || location.pathname === '');

  const hrefFor = (href: string) => href.startsWith('#') && location.pathname !== '/' ? '/' + href : href;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, link: { href: string; isRoute?: boolean }) => {
    setMobileMenuOpen(false);
    e.currentTarget.closest('details')?.removeAttribute('open');
    if (link.isRoute && onNavigate) {
      e.preventDefault();
      onNavigate(link.href);
    }
  };

  return (
    <header
      id="top"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#FFFFFF]/90 backdrop-blur-xl border-b border-[#D7E7F7] shadow-[0_4px_24px_rgba(6,78,168,0.04)] py-3'
          : 'bg-[#FFFFFF]/80 backdrop-blur-lg border-b border-[#D7E7F7]/70 py-3.5 sm:py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Mark */}
          <a
            href="/"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('/');
              }
            }}
            className="flex items-center group transition-transform shrink-0 cursor-pointer"
            aria-label="ELFAZNI SERVICES"
          >
            <BrandLogo
              background="white"
              orientation="horizontal"
              size="lg"
              className="h-11 sm:h-14 xl:h-16 w-auto transition-transform group-hover:opacity-90"
            />
          </a>

          <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-bold text-[#52657e]" aria-label={t('القائمة الرئيسية')}>
            {/* الرئيسية / Home — always visible */}
            {topLevelLinks
              .filter((link) => link.id === 'home' || isPublicAnchorVisible(link.href))
              .map((link) => (
                link.id === 'home' ? (
                  <a key={link.id} href={hrefFor(link.href)} onClick={(event) => handleLinkClick(event, link)}
                    aria-current={hasActivePath ? 'page' : undefined}
                    className={`whitespace-nowrap py-2 transition-colors ${hasActivePath ? 'text-[#0B2E57]' : 'hover:text-[#004AA5]'}`}>
                    {link.label}
                  </a>
                ) : null
              ))}
            {dropdownLinks.length > 0 && <details className="group relative" onKeyDown={(event) => {
              if (event.key !== 'Escape') return;
              event.currentTarget.removeAttribute('open');
              event.currentTarget.querySelector('summary')?.focus();
            }}>
              <summary className={`flex cursor-pointer list-none items-center gap-1 whitespace-nowrap py-2 [&::-webkit-details-marker]:hidden ${hasActivePath ? 'text-[#0B2E57]' : 'text-[#0B2E57]'}`}>
                {t('الخدمات')} <ChevronDown className="h-4 w-4 group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="absolute start-0 top-full z-50 mt-2 grid min-w-52 gap-1 rounded-xl border border-[#D7E7F7] bg-white p-2 shadow-lg">
                {dropdownLinks.map((link) => (
                  <a key={link.id} href={hrefFor(link.href)} onClick={(event) => handleLinkClick(event, link)}
                    className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-[#EAF4FF] focus-visible:bg-[#EAF4FF]">
                    {link.label}
                  </a>
                ))}
              </div>
            </details>}
            {topLevelLinks
              .filter((link) => link.id !== 'home' && isPublicAnchorVisible(link.href))
              .map((link) => (
                <a key={link.id} href={hrefFor(link.href)} onClick={(event) => handleLinkClick(event, link)}
                  className="whitespace-nowrap py-2 hover:text-[#004AA5]">
                  {link.label}
                </a>
              ))}
          </nav>

          {/* 4-Language Switcher & Primary Action */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* Segmented language control */}
            <div
              className="flex items-center bg-[#eaf4ff] p-0.5 rounded-full border border-[#D7E7F7] text-xs font-bold"
              role="group"
              aria-label="Language selector"
            >
              {(['ar', 'tr', 'en', 'fr'] as const).map((lang) => {
                const visibleLabel = lang === 'ar' ? 'ع' : lang.toUpperCase();
                const langLabels: Record<string, string> = {
                  ar: 'ع - تغيير اللغة إلى العربية',
                  tr: 'TR - Dili Türkçe olarak değiştir',
                  en: 'EN - Switch language to English',
                  fr: 'FR - Changer la langue en français',
                };
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    aria-label={langLabels[lang]}
                    aria-pressed={language === lang}
                    className={`px-2.5 py-1 rounded-full transition-all duration-200 cursor-pointer ${
                      language === lang
                        ? 'bg-[#FFFFFF] text-[#0B2E57] shadow-xs font-black'
                        : 'text-[#5E7086] hover:text-[#0B2E57]'
                    }`}
                    title={lang.toUpperCase()}
                  >
                    {visibleLabel}
                  </button>
                );
              })}
            </div>

            {/* Primary Action Button */}
            <a
              href={hrefFor('#contact-form')}
              className="hidden sm:inline-flex items-center gap-2 px-4.5 py-2.5 rounded-full bg-[#004AA5] hover:bg-[#2A83D5] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm active:scale-[0.98] transition-all duration-200 cursor-pointer whitespace-nowrap"
            >
              <span>{t('تواصل معنا')}</span>
            </a>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full text-slate-700 hover:text-[#004AA5] hover:bg-black/[0.04] focus:outline-none transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? t('إغلاق القائمة') : t('فتح القائمة')}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Accessible Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-x-0 top-[57px] bg-[#fbfbfd]/95 backdrop-blur-2xl border-b border-black/[0.08] shadow-2xl px-6 py-6 space-y-4 max-h-[calc(100vh-57px)] overflow-y-auto z-40 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <nav className="flex flex-col divide-y divide-black/[0.04]">
            {navLinks.filter((link) => isPublicAnchorVisible(link.href)).map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.href}
                  href={hrefFor(link.href)}
                  onClick={(e) => handleLinkClick(e, link)}
                  className={`py-3.5 text-base font-bold transition-colors cursor-pointer ${
                    isActive ? 'text-[#0B2E57]' : 'text-slate-800 hover:text-[#004AA5]'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="pt-2 flex flex-col gap-3">
            <a
              href={hrefFor('#contact-form')}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3.5 px-4 rounded-full bg-[#0B2E57] hover:bg-[#004AA5] text-white font-bold text-center flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>{t('تواصل معنا')}</span>
            </a>
            <div className="text-center text-xs text-slate-500 font-medium">
              {settings.phone} · {settings.addressAr}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
