import { SectionTitle } from './SiteContent';
import React, { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Bookmark } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { guidesData, GuideArticle } from '../data/guides';

interface GuidesSectionProps {
  onSelectGuide: (guide: GuideArticle) => void;
}

export const GuidesSection: React.FC<GuidesSectionProps> = ({ onSelectGuide }) => {
  const { t, language, isRtl } = useLanguage();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [loadedGuides, setLoadedGuides] = useState<Record<string, boolean>>({});

  const markGuideLoaded = (id: string) => {
    setLoadedGuides((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  };

  const scroll = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = 350;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      id="guides"
      aria-labelledby="guides-heading"
      className="py-20 bg-[#FFFFFF] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Slider Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2 text-[#004AA5] text-xs sm:text-sm font-extrabold">
              <BookOpen className="w-4 h-4 text-[#CC9048]" />
              <span>{t('دليل ELFAZNI SERVICES')}</span>
            </div>
            <SectionTitle sectionId="guides"
              id="guides-heading"
              className="tracking-tight"
            >
              {language === 'tr' ? (
                <>
                  <span className="block font-black text-[#0B2E57]">İşlem ve Seyahat Rehberi</span>
                  <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">İşinize Yarayan Pratik Bilgiler</span>
                </>
              ) : language === 'en' ? (
                <>
                  <span className="block font-black text-[#0B2E57]">Practical Service Guides</span>
                  <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Essential Information Closer to You</span>
                </>
              ) : language === 'fr' ? (
                <>
                  <span className="block font-black text-[#0B2E57]">Guides Pratiques en Turquie</span>
                  <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Des informations utiles à votre portée</span>
                </>
              ) : (
                <>
                  <span className="block font-black text-[#0B2E57]">دليل المعاملات في تركيا</span>
                  <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">معلومات تهمك وخدمات أقرب إليك</span>
                </>
              )}
            </SectionTitle>
            <p className="text-base sm:text-lg lg:text-xl text-[#5E7086] font-medium">
              {t('مواضيع عملية تساعدك على فهم الخطوات والاستعداد لطلبك قبل التواصل معنا.')}
            </p>
          </div>

          {/* Prev/Next buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={() => scroll(isRtl ? 'right' : 'left')}
              className="w-11 h-11 rounded-2xl border border-[#D7E7F7] hover:border-[#004AA5] hover:bg-[#eaf4ff] text-[#0B2E57] hover:text-[#004AA5] flex items-center justify-center transition-all cursor-pointer"
              aria-label="السابق"
            >
              {isRtl ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => scroll(isRtl ? 'left' : 'right')}
              className="w-11 h-11 rounded-2xl border border-[#D7E7F7] hover:border-[#004AA5] hover:bg-[#eaf4ff] text-[#0B2E57] hover:text-[#004AA5] flex items-center justify-center transition-all cursor-pointer"
              aria-label="التالي"
            >
              {isRtl ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Full-Bleed Guides Scroll Row */}
        <div
          ref={sliderRef}
          className="flex gap-6 overflow-x-auto pb-6 pt-2 scroll-smooth no-scrollbar"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {guidesData.map((guide) => {
            const currentTitle =
              language === 'tr' ? guide.titleTr : language === 'en' ? guide.titleEn : t(guide.title);
            const currentDesc =
              language === 'tr' ? guide.descTr : language === 'en' ? guide.descEn : t(guide.desc);
            const currentTag =
              language === 'tr' ? guide.tagTr : language === 'en' ? guide.tagEn : t(guide.tag);
            const isLoaded = !!loadedGuides[guide.id];

            return (
              <div
                key={guide.id}
                onClick={() => onSelectGuide(guide)}
                style={{ scrollSnapAlign: 'start' }}
                className="group relative w-[300px] sm:w-[345px] h-[440px] shrink-0 rounded-3xl overflow-hidden p-6 flex flex-col justify-between cursor-pointer bg-gradient-to-br from-[#0E4B87] to-[#0B2E57] shadow-[0_14px_34px_rgba(1,26,59,0.14)] hover:-translate-y-1.5 transition-all duration-500"
              >
                {!isLoaded && (
                  <div
                    className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#0B2E57] via-[#0E4B87] to-[#0B2E57]"
                    aria-hidden="true"
                  />
                )}
                {/* Full-Bleed Image */}
                <img
                  src={guide.image}
                  alt={currentTitle}
                  onLoad={() => markGuideLoaded(guide.id)}
                  onError={() => markGuideLoaded(guide.id)}
                  className={`object-cover w-full h-full absolute inset-0 group-hover:scale-105 transition-all duration-500 ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  loading="lazy"
                />

                {/* Multi-Stop Dark Gradient Overlay */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/15"
                  aria-hidden="true"
                />

                {/* Top Floating Row: Glassmorphic Badge & Circular Bookmark Icon */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span className="bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                    {currentTag}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectGuide(guide);
                    }}
                    aria-label={currentTitle}
                    className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom Content & Full-Width High-Contrast Button */}
                <div className="relative z-10 mt-auto pt-10">
                  <div className="flex items-center justify-between gap-2.5 mb-2">
                    <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug line-clamp-2">
                      {currentTitle}
                    </h3>
                    <span className="bg-white/15 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0">
                      {t('دليل عملي')}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-200 line-clamp-2 leading-relaxed mb-5">
                    {currentDesc}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectGuide(guide);
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <span>{t('اقرأ الدليل')}</span>
                    {isRtl ? (
                      <ArrowLeft className="w-4 h-4 text-[#0B2E57]" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-[#0B2E57]" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
