import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { WhatsAppLogo } from './WhatsAppLogo';

export const FloatingWhatsApp: React.FC = () => {
  const { t, isRtl } = useLanguage();
  const { settings } = useSiteSettings();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const whatsappUrl = `https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(
    `مرحباً ${settings.siteNameEn || 'ELFAZNI SERVICES'}`
  )}`;

  return (
    <div
      className={`fixed bottom-6 ${
        isRtl ? 'left-6' : 'right-6'
      } z-40 hidden lg:flex items-center gap-3 group transition-all duration-500 ease-out transform ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-6 pointer-events-none'
      }`}
    >
      {/* Floating WhatsApp Button (Bottom of Vertical Stack) */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل عبر واتساب"
        className="relative w-14 h-14 rounded-full bg-white hover:scale-105 active:scale-95 flex items-center justify-center shadow-xl shadow-emerald-900/25 ring-2 ring-emerald-500/30 transition-all duration-200 cursor-pointer p-1"
      >
        <WhatsAppLogo className="w-full h-full" />
      </a>

      {/* Clean Label Pill on Hover */}
      <span className="px-3.5 py-2 rounded-xl bg-slate-900/95 text-white text-xs font-bold shadow-lg backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        {t('تواصل عبر واتساب')}
      </span>
    </div>
  );
};
