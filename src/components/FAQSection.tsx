import { SectionTitle } from './SiteContent';
import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { FAQ_LIST, SITE_CONTACT } from '../data/content';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { WhatsAppLogo } from './WhatsAppLogo';

export const FAQSection: React.FC = () => {
  const { settings } = useSiteSettings();
  const { t, language, isRtl } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const whatsappFaqUrl = `https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(
    'مرحباً، لدي استفسار أود طرحه بخصوص خدماتكم.'
  )}`;

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="py-20 bg-[#FFFFFF] relative"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <div className="flex items-center justify-center gap-2 text-[#004AA5] text-xs sm:text-sm font-extrabold">
            <HelpCircle className="w-4 h-4 text-[#CC9048]" />
            <span>{t('قبل أن تبدأ')}</span>
          </div>
          <SectionTitle sectionId="faq"
            id="faq-heading"
            className="tracking-tight"
          >
            {language === 'tr' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Sık Sorulan Sorular</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Konsolosluk ve Seyahat Hizmetleri</span>
              </>
            ) : language === 'en' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Frequently Asked Questions</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Consular & Travel Services in Türkiye</span>
              </>
            ) : language === 'fr' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Questions Fréquentes</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Rendez-vous consulaires et voyages</span>
              </>
            ) : (
              <>
                <span className="block font-black text-[#0B2E57]">الأسئلة الشائعة</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">حول المواعيد القنصلية وخدمات السفر</span>
              </>
            )}
          </SectionTitle>
          <p className="text-base sm:text-lg lg:text-xl text-[#5E7086] font-medium">
            {t('إذا لم تجد جوابك هنا، أرسل لنا رسالتك وسنرد عليك بخصوص الخدمة المطلوبة.')}
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {(settings.faqItems ?? FAQ_LIST).map((item, idx) => {
            const isOpen = openIndex === idx;
            const currentQ =
              language === 'tr'
                ? item.qTr
                : language === 'en'
                  ? item.qEn
                  : language === 'fr'
                    ? item.qFr
                    : item.q;
            const currentA =
              language === 'tr'
                ? item.aTr
                : language === 'en'
                  ? item.aEn
                  : language === 'fr'
                    ? item.aFr
                    : item.a;

            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#D7E7F7] overflow-hidden transition-all bg-[#FFFFFF] shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-5 sm:p-6 text-start flex items-center justify-between gap-4 hover:bg-[#eaf4ff]/60 transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="text-lg sm:text-xl font-bold text-[#0B2E57]">
                    {currentQ}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-full bg-[#eaf4ff] flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-[#004AA5] text-white' : 'text-[#5E7086]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 pt-2 text-base sm:text-lg text-[#5E7086] border-t border-[#D7E7F7] animate-fade-in font-normal">
                    {currentA}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Ask on WhatsApp link */}
        <div className="mt-12 text-center">
          <a
            href={whatsappFaqUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm sm:text-base font-extrabold text-[#004AA5] hover:text-[#2A83D5] transition-colors group cursor-pointer"
          >
            <WhatsAppLogo className="w-5 h-5" />
            <span>{t('اسألنا عبر واتساب')}</span>
            {isRtl ? (
              <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            ) : (
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            )}
          </a>
        </div>
      </div>
    </section>
  );
};
