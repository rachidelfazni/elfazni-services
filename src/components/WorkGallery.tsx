import { SectionTitle } from './SiteContent';
import React, { useState } from 'react';
import { Eye, X, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { WORK_GALLERY, SITE_CONTACT } from '../data/content';

export const WorkGallery: React.FC = () => {
  const { t, language, isRtl } = useLanguage();
  const [activeImage, setActiveImage] = useState<(typeof WORK_GALLERY)[0] | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  const markLoaded = (idx: number) => {
    setLoadedImages((prev) => (prev[idx] ? prev : { ...prev, [idx]: true }));
  };

  const handleWhatsAppInquiry = (item: (typeof WORK_GALLERY)[0]) => {
    const text = `مرحباً ELFAZNI SERVICES، رأيت نموذج "${item.title}" في معرض الأعمال وأود طلب هذه الخدمة.`;
    const url = `https://wa.me/${SITE_CONTACT.whatsappRaw}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      className="py-20 bg-[#eaf4ff] relative border-y border-[#D7E7F7]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="flex items-center justify-center gap-2 text-[#004AA5] text-xs sm:text-sm font-extrabold">
            <span className="w-2 h-2 rounded-full bg-[#CC9048]" />
            <span>{t('من هويتنا البصرية')}</span>
          </div>
          <SectionTitle sectionId="work"
            id="work-heading"
            className="tracking-tight"
          >
            {language === 'tr' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Görsel Hizmet Galerimiz</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Bilgide Açıklık, Hizmette Güven</span>
              </>
            ) : language === 'en' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Visual Service Gallery</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Clarity in Information, Trust in Service</span>
              </>
            ) : language === 'fr' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Galerie de Nos Services</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Clarté de l’information et confiance</span>
              </>
            ) : (
              <>
                <span className="block font-black text-[#0B2E57]">معرض نماذج خدماتنا</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">وضوح في المعلومة وثقة في الخدمة</span>
              </>
            )}
          </SectionTitle>
          <p className="text-base sm:text-lg lg:text-xl text-[#5E7086] font-medium">
            {t('نماذج من المحتوى التعريفي الذي نقدمه لخدماتنا على منصات التواصل.')}
          </p>
        </div>

        {/* Full-Bleed Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WORK_GALLERY.map((item, idx) => {
            const currentTitle =
              language === 'tr'
                ? item.titleTr
                : language === 'en'
                  ? item.titleEn
                  : language === 'fr'
                    ? item.titleFr
                    : item.title;
            const isLoaded = !!loadedImages[idx];

            return (
              <figure
                key={idx}
                onClick={() => setActiveImage(item)}
                className="group relative rounded-3xl overflow-hidden aspect-[4/5] p-6 flex flex-col justify-between cursor-pointer bg-gradient-to-br from-[#0E4B87] to-[#0B2E57] shadow-[0_14px_34px_rgba(1,26,59,0.15)] hover:-translate-y-1.5 transition-all duration-500"
              >
                {!isLoaded && (
                  <div
                    className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#0B2E57] via-[#0E4B87] to-[#0B2E57]"
                    aria-hidden="true"
                  />
                )}
                {/* Full-Bleed Image */}
                <img
                  src={item.image}
                  alt={currentTitle}
                  onLoad={() => markLoaded(idx)}
                  onError={() => markLoaded(idx)}
                  className={`object-cover w-full h-full absolute inset-0 group-hover:scale-105 transition-all duration-500 ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  loading="lazy"
                />

                {/* Multi-Stop Dark Gradient Overlay */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/10"
                  aria-hidden="true"
                />

                {/* Top Glassmorphic Pill & Quick-View Circular Icon */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span className="bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                    {t('نموذج معتمد')}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImage(item);
                    }}
                    aria-label={t('عرض وتفاصيل')}
                    className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom Overlaid Caption & High-Contrast Primary CTA */}
                <figcaption className="relative z-10 mt-auto pt-10">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-xl font-extrabold text-white leading-snug">
                      {currentTitle}
                    </h3>
                    <span className="bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium px-3 py-1 rounded-full shrink-0">
                      VIP
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-200 line-clamp-2 mb-5 leading-relaxed">
                    {t(item.caption)}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWhatsAppInquiry(item);
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <MessageSquare className="w-4 h-4 text-[#0B2E57]" />
                    <span>{t('طلب هذه الخدمة عبر واتساب')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImage(item);
                    }}
                    className="w-full mt-2.5 text-center text-xs font-semibold text-white/80 hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
                  >
                    {t('عرض وتفاصيل')}
                  </button>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setActiveImage(null)}
        >
          <div
            className="relative max-w-lg w-full bg-zinc-950 text-white rounded-3xl overflow-hidden shadow-2xl border border-white/15 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveImage(null)}
              className={`absolute top-6 ${isRtl ? 'left-6' : 'right-6'} z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer`}
              aria-label={t('إغلاق')}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="rounded-2xl bg-zinc-900 max-h-[60vh] flex items-center justify-center overflow-hidden mb-4">
              <img
                src={activeImage.image}
                alt={activeImage.title}
                className="w-full h-auto max-h-[60vh] object-contain"
              />
            </div>

            <div className="px-2 pb-2 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  {language === 'tr'
                    ? activeImage.titleTr
                    : language === 'en'
                      ? activeImage.titleEn
                      : language === 'fr'
                        ? activeImage.titleFr
                        : activeImage.title}
                </h3>
                <span className="bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium px-3 py-1 rounded-full shrink-0">
                  {t('نموذج معتمد')}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {t(activeImage.caption)}
              </p>

              <button
                type="button"
                onClick={() => handleWhatsAppInquiry(activeImage)}
                className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#0B2E57]" />
                <span>{t('طلب هذه الخدمة عبر واتساب')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
