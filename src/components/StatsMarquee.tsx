import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { SERVICES_LIST } from '../data/content';
import { useSiteSettings } from '../context/SiteSettingsContext';

const INITIAL_COPIES = 3;
const MAX_COPIES = 8;

export const StatsMarquee: React.FC = () => {
  const { t, language } = useLanguage();
  const { isServiceVisible } = useSiteSettings();

  const trackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const [copies, setCopies] = useState(INITIAL_COPIES);

  const steps = [
    {
      num: '01',
      title: t('اختر الخدمة المطلوبة'),
      desc: t('طيران، مواعيد قنصلية، استقبال مطار، أو ترجمة محلفة'),
    },
    {
      num: '02',
      title: t('أرسل بياناتك عبر واتساب'),
      desc: t('معلومات أولية وصور واضحة للوثائق المطلوبة'),
    },
    {
      num: '03',
      title: t('متابعة شخصية حتى الإنجاز'),
      desc: t('تدقيق دقيق، حجز مؤكد، واستلام وثائقك دون تعقيد'),
    },
  ];

  const items = useMemo(() => {
    return SERVICES_LIST.filter((service) => isServiceVisible(service.id)).map((service) => service.title);
  }, [isServiceVisible]);

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const buildAnimation = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    animationRef.current?.cancel();
    animationRef.current = null;
    track.style.transform = '';

    if (prefersReducedMotion || items.length === 0) {
      track.style.transform = 'translateX(0)';
      return;
    }

    const firstSequence = track.firstElementChild as HTMLElement | null;
    if (!firstSequence) return;

    const trackStyle = window.getComputedStyle(track);
    const gap = parseFloat(trackStyle.columnGap || trackStyle.gap || '0') || 0;
    const loopWidth = firstSequence.getBoundingClientRect().width + gap;
    if (loopWidth <= 0) return;

    const viewport = Math.max(window.innerWidth, 320);
    const required = Math.min(
      MAX_COPIES,
      Math.max(2, Math.ceil((viewport + loopWidth) / loopWidth))
    );
    setCopies((prev) => (prev === required ? prev : required));

    // Right-to-left continuous flow
    const keyframes = [
      { transform: 'translateX(0)' },
      { transform: `translateX(${-loopWidth}px)` },
    ];

    // Smooth constant-speed duration based on loop width (approx 45px/s)
    const durationMs = Math.max(20000, Math.round((loopWidth / 45) * 1000));

    try {
      const anim = track.animate(keyframes, {
        duration: durationMs,
        iterations: Infinity,
        easing: 'linear',
      });
      animationRef.current = anim;
    } catch {
      // Fallback if Web Animations API fails
      track.style.transform = 'translateX(0)';
    }
  }, [items.length, prefersReducedMotion]);

  useEffect(() => {
    buildAnimation();

    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      buildAnimation();
    });

    observer.observe(track);
    const firstSeq = track.firstElementChild;
    if (firstSeq) observer.observe(firstSeq);

    return () => {
      observer.disconnect();
      animationRef.current?.cancel();
    };
  }, [buildAnimation]);

  const renderSequence = (seqIdx: number) => (
    <div
      key={`seq-${seqIdx}`}
      className="flex items-center gap-10 shrink-0"
      aria-hidden={seqIdx > 0}
    >
      {items.map((item, idx) => (
        <span key={`item-${seqIdx}-${idx}`} className="flex items-center gap-8 whitespace-nowrap">
          <span className="text-sm sm:text-base font-semibold text-slate-100 tracking-wide hover:text-white transition-colors">
            {t(item)}
          </span>
          <span aria-hidden="true" className="text-[#CC9048] text-xs select-none">
            ✦
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <section
      id="quick-steps"
      aria-labelledby="quick-steps-heading"
      className="bg-gradient-to-br from-[#0E4B87] to-[#0B2E57] text-white py-10 border-y border-white/[0.08] overflow-hidden"
    >
      {/* Descriptive H2 Section Heading */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 text-center">
        <h2
          id="quick-steps-heading"
          className="!text-[30px] !leading-[49px] font-extrabold text-white/95 tracking-tight text-balance"
        >
          {language === 'tr'
            ? 'Türkiye’de Konsolosluk ve Seyahat İşlemleriniz İçin 3 Hızlı Adım'
            : language === 'en'
            ? '3 Quick Steps to Complete Your Consular & Travel Services in Türkiye'
            : language === 'fr'
            ? '3 étapes rapides pour vos démarches consulaires et voyages en Turquie'
            : 'خطوات إنجاز معاملاتك القنصلية وحجوزات السفر في تركيا'}
        </h2>
      </div>

      {/* 3 Steps Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex items-start gap-3.5 p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-colors duration-200"
            >
              <span className="font-mono tabular-nums text-lg sm:text-xl font-black text-[#2A83D5] shrink-0 pt-0.5">
                {step.num}
              </span>
              <div>
                <h3 className="!text-sm sm:!text-base font-bold text-white tracking-tight leading-snug">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed font-normal">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Measured Seamless Web Animations API Marquee */}
      <div
        className="relative w-full overflow-hidden border-t border-white/[0.08] pt-5 mask-marquee-edges"
        dir="ltr"
        role="region"
        aria-label={t('قائمة الخدمات المتاحة')}
      >
        <div
          ref={trackRef}
          className="flex w-max gap-10 will-change-transform items-center"
        >
          {Array.from({ length: copies }, (_, i) => renderSequence(i))}
        </div>
      </div>
    </section>
  );
};
