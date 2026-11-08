import React, { createContext, useContext, useEffect, useState } from 'react';
import { Language, translations } from '../data/translations';
import { extraTranslations } from '../data/extraTranslations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'ar',
  setLanguage: () => {},
  t: (key: string) => key,
  isRtl: true,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('elfazni-language') as Language;
      if (saved && (saved === 'ar' || saved === 'tr' || saved === 'en' || saved === 'fr')) {
        return saved;
      }
    }
    return 'ar';
  });

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('elfazni-language', newLang);
    }
  };

  const isRtl = language === 'ar';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';

      const titles: Record<Language, string> = {
        ar: 'ELFAZNI SERVICES | خدمات الجالية المغربية في تركيا',
        tr: 'ELFAZNI SERVICES | Türkiye’de Fas Topluluğu ve Konsolosluk Hizmetleri',
        en: 'ELFAZNI SERVICES | Moroccan Community & Consular Services in Türkiye',
        fr: 'ELFAZNI SERVICES | Services Communautaires et Consulaires Marocains en Turquie',
      };
      const descriptions: Record<Language, string> = {
        ar: 'خدمات ELFAZNI SERVICES للجالية المغربية في تركيا: المساعدة في المواعيد القنصلية بإسطنبول وأنقرة، حجوزات الطيران والفنادق، الترجمة المحلفة، والإقامات عبر واتساب.',
        tr: 'Türkiye’deki Fas topluluğu için ELFAZNI SERVICES: İstanbul ve Ankara Fas Konsolosluğu randevuları, uçak ve otel rezervasyonları, yeminli tercüme ve ikamet işlemleri.',
        en: 'ELFAZNI SERVICES for Moroccans in Türkiye: Moroccan consular appointments in Istanbul & Ankara, flight and hotel bookings, sworn translation, and residence permits via WhatsApp.',
        fr: 'ELFAZNI SERVICES pour les Marocains en Turquie : rendez-vous consulaires à Istanbul et Ankara, réservations de vols et hôtels, traduction assermentée et séjour via WhatsApp.',
      };

      const title = titles[language] || titles.ar;
      const desc = descriptions[language] || descriptions.ar;

      document.title = title;

      const descMeta = document.querySelector('meta[name="description"]');
      if (descMeta) descMeta.setAttribute('content', desc);

      const ogTitleMeta = document.querySelector('meta[property="og:title"]');
      if (ogTitleMeta) ogTitleMeta.setAttribute('content', title);

      const ogDescMeta = document.querySelector('meta[property="og:description"]');
      if (ogDescMeta) ogDescMeta.setAttribute('content', desc);

      const twTitleMeta = document.querySelector('meta[name="twitter:title"]');
      if (twTitleMeta) twTitleMeta.setAttribute('content', title);

      const twDescMeta = document.querySelector('meta[name="twitter:description"]');
      if (twDescMeta) twDescMeta.setAttribute('content', desc);
    }
  }, [language, isRtl]);

  const t = (key: string): string => {
    if (language === 'ar') {
      return key;
    }
    const extraDict = extraTranslations[language];
    if (extraDict && extraDict[key]) {
      return extraDict[key];
    }
    const dict = translations[language];
    if (dict && dict[key]) {
      return dict[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
