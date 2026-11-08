import { SectionTitle } from './SiteContent';
import { useSiteSettings } from '../context/SiteSettingsContext';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Play, Pause, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { CAMPAIGN_SLIDES, CampaignSlideItem } from '../data/slides';
import { SITE_CONTACT } from '../data/content';
import { WhatsAppLogo } from './WhatsAppLogo';

export const CampaignSlider: React.FC = () => {
  const { isServiceVisible } = useSiteSettings();
  const slides = CAMPAIGN_SLIDES.filter(({ id }) => {
    if (id === 'all_services') return ['consular','flights','airport','translation','hotels','residency','community'].every(isServiceVisible);
    if (id === 'residence') return isServiceVisible('residency');
    if (['marriage','agency','newborn'].includes(id)) return isServiceVisible('consular');
    return isServiceVisible(id);
  });
  const { t, language, isRtl } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadedSlides, setLoadedSlides] = useState<Record<string, boolean>>({});

  const markSlideLoaded = (id: string) => {
    setLoadedSlides((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  };

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalSlides = slides.length;
  const slideDuration = 4000; // 4 seconds per slide
  const progressStepMs = 40; // update progress every 40ms

  const goToSlide = (index: number) => {
    setCurrentIndex((index + totalSlides) % totalSlides);
    setProgress(0);
  };

  const handleNext = () => {
    goToSlide(currentIndex + 1);
  };

  const handlePrev = () => {
    goToSlide(currentIndex - 1);
  };

  // Progress timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isPlaying && !isHovered && totalSlides > 1) {
      interval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + (progressStepMs / slideDuration) * 100;
          if (next >= 100) {
            setCurrentIndex((curr) => (curr + 1) % totalSlides);
            return 0;
          }
          return next;
        });
      }, progressStepMs);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, isHovered, totalSlides]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) {
      touchStartX.current = null;
      touchEndX.current = null;
      return;
    }
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (isRtl) {
        if (diff > 0) handlePrev();
        else handleNext();
      } else {
        if (diff > 0) handleNext();
        else handlePrev();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const activeSlide: CampaignSlideItem = slides[currentIndex] || slides[0];

  const getLocalizedService = (slide: CampaignSlideItem) => {
    if (language === 'tr') return slide.serviceTr;
    if (language === 'en') return slide.serviceEn;
    if (language === 'fr') return slide.serviceFr;
    return slide.service;
  };

  const getLocalizedTitle = (slide: CampaignSlideItem) => {
    if (language === 'tr') return slide.titleTr;
    if (language === 'en') return slide.titleEn;
    if (language === 'fr') return slide.titleFr;
    return slide.title;
  };

  const handleSlideClick = (slide: CampaignSlideItem) => {
    const waUrl = `https://wa.me/${SITE_CONTACT.whatsappRaw}?text=${encodeURIComponent(
      slide.whatsappQuery
    )}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  if (!activeSlide) return null;

  return (
    <section
      id="service-slides"
      aria-labelledby="service-slides-heading"
      className="py-16 sm:py-24 bg-[#FFFFFF] relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
          <SectionTitle sectionId="service-slides" id="service-slides-heading" className="tracking-tight">
            <span className="block font-black text-[#0B2E57]">{t('من خدمات الفزني')}</span>
            <span className="block font-bahij-bold text-[#CC9048]">{t('السفر والمعاملات في تركيا')}</span>
          </SectionTitle>
          <p className="mt-3 text-base text-[#52657e] sm:text-lg">
            {t('تصفّح الخدمات واختر ما تحتاجه للتواصل مع فريقنا.')}
          </p>
        </div>

        {/* Carousel Frame */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#D7E7F7] bg-[#FFFFFF] group select-none">
          {/* Active slide progress bar */}
          <div className="h-1.5 w-full bg-[#eaf4ff] z-30 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#CC9048] via-[#E3C88F] to-[#2A83D5] transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Slides Container - Natural uncropped aspect ratio with Skeleton Shimmer */}
          <div className="relative grid grid-cols-1 w-full bg-white overflow-hidden min-h-[240px] sm:min-h-[380px]">
            {!loadedSlides[activeSlide.id] && (
              <div
                className="col-start-1 row-start-1 w-full aspect-[16/10] sm:aspect-[16/9] bg-gradient-to-br from-[#eaf4ff] via-[#D7E7F7] to-[#eaf4ff] animate-pulse flex flex-col items-center justify-center p-8 z-20"
                aria-hidden="true"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#004AA5]/10 border border-[#004AA5]/20 flex items-center justify-center mb-3">
                  <div className="w-7 h-7 rounded-full border-2 border-[#004AA5] border-t-transparent animate-spin" />
                </div>
                <div className="h-3.5 w-40 bg-[#0B2E57]/15 rounded-full" />
              </div>
            )}
            {slides.map((slide, idx) => {
              const isActive = slide.id === activeSlide.id;
              const isSlideLoaded = !!loadedSlides[slide.id];
              return (
                <div
                  key={slide.id}
                  onClick={() => handleSlideClick(slide)}
                  className={`col-start-1 row-start-1 w-full transition-opacity duration-700 ease-in-out cursor-pointer ${
                    isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                  aria-hidden={!isActive}
                >
                  <img
                    src={slide.image}
                    alt={getLocalizedTitle(slide)}
                    onLoad={() => markSlideLoaded(slide.id)}
                    onError={() => markSlideLoaded(slide.id)}
                    className={`w-full h-auto object-contain block transition-opacity duration-500 ${
                      isSlideLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              );
            })}
          </div>

          {/* Bottom Info & Controls Bar (Never covers the image artwork) */}
          <div className="bg-[#012450] text-white px-5 py-5 sm:px-8 sm:py-6 border-t border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Active Slide Details */}
            <div
              onClick={() => handleSlideClick(activeSlide)}
              className="cursor-pointer space-y-1.5 flex-1 min-w-0"
            >
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#CC9048] text-white text-xs font-extrabold shadow-xs">
                  {activeSlide.num}
                </span>
                <span className="text-xs sm:text-sm font-bold text-amber-200">
                  {getLocalizedService(activeSlide)}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white">
                {getLocalizedTitle(activeSlide)}
              </h3>
            </div>

            {/* Right / End Controls: WhatsApp CTA + Dots + Prev/Pause/Next */}
            <div className="w-full lg:w-auto flex flex-wrap items-center justify-between lg:justify-end gap-3 sm:gap-4 shrink-0">
              <button
                type="button"
                onClick={() => handleSlideClick(activeSlide)}
                className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-xs sm:text-sm font-bold text-emerald-300 transition-colors cursor-pointer"
              >
                <WhatsAppLogo className="w-5 h-5" />
                <span>{t('تواصل الآن عبر واتساب')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-3">
                {/* Dots Indicator */}
                <div className="hidden sm:flex items-center gap-1.5 bg-white/10 px-3 py-2 rounded-xl border border-white/10">
                  {slides.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={() => goToSlide(dotIdx)}
                      className={`transition-all duration-300 rounded-full cursor-pointer ${
                        dotIdx === currentIndex
                          ? 'w-6 h-2 bg-[#CC9048]'
                          : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                      }`}
                      aria-label={`${t('اختيار التصميم')} ${dotIdx + 1}`}
                    />
                  ))}
                </div>

                {/* Controls Bar: Prev, Play/Pause, Next */}
                <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/10">
                  {/* Prev Button */}
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
                    aria-label={t('التصميم السابق')}
                  >
                    {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                  </button>

                  {/* Play/Pause Button */}
                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
                    aria-label={isPlaying ? t('إيقاف التغيير التلقائي') : 'تشغيل'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
                    aria-label={t('التصميم التالي')}
                  >
                    {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
