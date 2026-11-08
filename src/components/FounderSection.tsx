import { SectionTitle } from './SiteContent';
import React from 'react';
import { Award, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { WhatsAppLogo } from './WhatsAppLogo';

export const FounderSection: React.FC = () => {
  const { t, language } = useLanguage();
  const { settings } = useSiteSettings();
  const founderShortAr = settings.founderName?.split('(')[0]?.trim() || 'رشيد الفزني';

  const whatsappUrl = `https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(
    `مرحباً ${founderShortAr}، أود الاستفسار عن خدمات ELFAZNI SERVICES.`
  )}`;

  const highlights = [
    t('تواصل سريع واستجابة مباشرة'),
    t('خبرة دقيقة بالمعاملات القنصلية والتركية'),
    t('توجيه للمسار الأسهل والأقل تكلفة'),
    t('سرية تامة وأمان في معالجة الوثائق'),
  ];

  return (
    <section
      id="about"
      aria-labelledby="founder-heading"
      className="py-20 sm:py-28 bg-[#eaf4ff] relative overflow-hidden border-y border-[#D7E7F7]"
    >
      {/* Subtle Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#004AA5]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#CC9048]/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-[#FFFFFF] rounded-[2.5rem] p-6 sm:p-10 md:p-14 shadow-[0_20px_60px_rgba(6,78,168,0.07)] border border-[#D7E7F7]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Portrait Column */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-[360px] mx-auto">
                {/* Gold & Navy Accent Frame Behind Image */}
                <div className="absolute -inset-3 bg-gradient-to-tr from-[#0B2E57] via-[#004AA5] to-[#CC9048] rounded-[2.2rem] opacity-15 blur-md" />

                <div className="relative rounded-[2rem] overflow-hidden border-2 border-[#CC9048]/40 shadow-2xl bg-[#eaf4ff] aspect-[4/5]">
                  <img
                    src={settings.founderImage || '/assets/founder-rachid-elfazni-v2.webp'}
                    alt={t(founderShortAr)}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-top transform hover:scale-103 transition-transform duration-700"
                    loading="lazy"
                  />

                  {/* Bottom Glass Overlay Badge */}
                  <div className="absolute bottom-3 inset-x-3 bg-gradient-to-br from-[#0E4B87] to-[#0B2E57]/90 backdrop-blur-md border border-white/15 rounded-2xl p-3.5 text-white shadow-lg">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-black text-base sm:text-lg text-white leading-tight">
                          {t(founderShortAr)}
                        </p>
                        <p className="text-[#E3C88F] text-xs sm:text-sm font-bold mt-0.5">
                          {t(settings.founderTitleAr || 'مؤسس ELFAZNI SERVICES')}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-[#CC9048]/20 border border-[#CC9048]/40 flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 text-[#E3C88F]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-7 text-start">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#eaf4ff] border border-[#D7E7F7] text-[#004AA5] font-extrabold text-xs sm:text-sm mb-4">
                <Sparkles className="w-4 h-4 text-[#CC9048]" />
                <span>{t('تعرّف على المؤسس')} · {t('خدمة موثوقة ومباشرة')}</span>
              </div>

              <SectionTitle sectionId="about"
                id="founder-heading"
                className="tracking-tight mb-5"
              >
                {language === 'tr' ? (
                  <>
                    <span className="block font-black text-[#0B2E57]">Rachid Elfazni</span>
                    <span className="block font-extralight font-bahij-bold text-[#CC9048] text-[33.6px] mt-1">
                      Kurucu ve Hizmet Yönetimi
                    </span>
                  </>
                ) : language === 'en' ? (
                  <>
                    <span className="block font-black text-[#0B2E57]">Rachid Elfazni</span>
                    <span className="block font-extralight font-bahij-bold text-[#CC9048] text-[33.6px] mt-1">
                      Founder & Service Management
                    </span>
                  </>
                ) : language === 'fr' ? (
                  <>
                    <span className="block font-black text-[#0B2E57]">Rachid Elfazni</span>
                    <span className="block font-extralight font-bahij-bold text-[#CC9048] text-[33.6px] mt-1">
                      Fondateur et Gestion des Services
                    </span>
                  </>
                ) : (
                  <>
                    <span className="block font-black text-[#0B2E57]">{founderShortAr}</span>
                    <span className="block font-extralight font-bahij-bold text-[#CC9048] text-[33.6px] mt-1">
                      {settings.founderTitleAr || 'المؤسس وإدارة الخدمات'}
                    </span>
                  </>
                )}
              </SectionTitle>

              <p className="text-[#5E7086] text-base sm:text-lg leading-relaxed mb-6 font-medium">
                {language === 'ar' && settings.founderBioAr
                  ? settings.founderBioAr
                  : t(
                      'أنا رشيد الفزني، مؤسس ELFAZNI SERVICES. أعمل على تسهيل الخدمات الإدارية وخدمات السفر للجالية المغربية في تركيا، من خلال تواصل مباشر وخطوات واضحة ومتابعة عملية عبر واتساب حتى اكتمال الطلب.'
                    )}
              </p>

              {/* Key Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
                {highlights.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FBFBFD] border border-[#D7E7F7] hover:border-[#CC9048]/50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#0B2E57] text-[#E3C88F] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-sm sm:text-base font-bold text-[#0B2E57] leading-snug">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Trust Quote & Direct Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-5 border-t border-[#D7E7F7]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-[#5E7086] font-bold">{t('ضمان الخدمة')}</p>
                    <p className="text-sm font-black text-[#0B2E57]">{t('متابعة خطوة بخطوة')}</p>
                  </div>
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 bg-[#004AA5] hover:bg-[#0B2E57] text-white font-black px-7 py-4 rounded-2xl shadow-lg shadow-[#004AA5]/20 hover:shadow-xl transition-all transform hover:-translate-y-0.5 text-sm sm:text-base cursor-pointer"
                >
                  <WhatsAppLogo className="w-5 h-5" />
                  <span>{t('تواصل مباشرة مع رشيد الفزني')}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
