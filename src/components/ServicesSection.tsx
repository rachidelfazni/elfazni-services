import { SectionTitle } from './SiteContent';
import { useSiteSettings } from '../context/SiteSettingsContext';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Plane,
  Building2,
  Languages,
  Home,
  Hotel,
  Users2,
  Car,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SERVICES_LIST, ServiceItem } from '../data/content';
import { ServiceCardSkeleton } from './SectionSkeletons';

interface ServicesSectionProps {
  onOpenFlightModal: () => void;
  onOpenConsularModal: (serviceName?: string) => void;
  onOpenStartModal?: (serviceId?: string) => void;
}

const SERVICE_IMAGES: Record<string, string> = {
  consular: '/assets/aistudio/consular-v4_c4b5767c.webp',
  flights: '/assets/aistudio/flights-v4_bc11797f.webp',
  airport: '/assets/aistudio/airport-v4_4a382d43.webp',
  translation: '/assets/aistudio/translation-v4_7279cd12.webp',
  residency: '/assets/aistudio/residency-v4_2edf876b.webp',
  hotels: '/assets/aistudio/hotels-v4_b0c2f2ff.webp',
  community: '/assets/aistudio/community-v4_6ad781a8.webp',
};

const SERVICE_PRICE_PILLS: Record<string, string> = {
  consular: 'متابعة VIP',
  flights: 'مقارنة الرحلات',
  airport: 'سائق خاص',
  translation: 'متابعة التصديق',
  residency: 'ملف متكامل',
  hotels: 'حجز فوري',
  community: 'إرشاد شامل',
};

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onOpenFlightModal,
  onOpenConsularModal,
  onOpenStartModal,
}) => {
  const { services, settings } = useSiteSettings();
  const { t, language, isRtl } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<'all' | 'travel' | 'consular' | 'residence'>('all');
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  const handleFilterChange = (nextFilter: 'all' | 'travel' | 'consular' | 'residence') => {
    if (nextFilter === activeFilter) return;
    setActiveFilter(nextFilter);
    setIsFilterLoading(true);
    window.setTimeout(() => {
      setIsFilterLoading(false);
    }, 180);
  };

  const markImageLoaded = (id: string) => {
    setLoadedImages((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  };

  const getAirportWhatsAppMessage = () => {
    switch (language) {
      case 'tr':
        return [
          '🚗 *Havalimanı VIP Transfer Talebi - ELFAZNI SERVICES*',
          '--------------------------------',
          '• *Hizmet:* İstanbul Havalimanı (IST) / Sabiha Gökçen (SAW) Karşılama ve Transfer',
          '• *Uçuş Tarihi ve Saati:* ',
          '• *Uçuş Numarası:* ',
          '• *Varış / Gidiş Noktası (Otel/Adres):* ',
          '• *Yolcu Sayısı & Bagaj:* ',
          '--------------------------------',
          'Merhaba, transfer araç seçenekleri ve fiyat bilgisi alabilir miyim? Teşekkürler!',
        ].join('\n');

      case 'en':
        return [
          '🚗 *VIP Airport Transfer Inquiry - ELFAZNI SERVICES*',
          '--------------------------------',
          '• *Service:* Istanbul Airport (IST) / Sabiha Gökçen (SAW) Private Transfer',
          '• *Flight Date & Estimated Time:* ',
          '• *Flight Number:* ',
          '• *Destination Hotel / Address:* ',
          '• *Passengers & Luggage count:* ',
          '--------------------------------',
          'Hello, I would like to get vehicle options and rates for airport transfer. Thank you!',
        ].join('\n');

      case 'fr':
        return [
          '🚗 *Demande de Transfert Aéroport VIP - ELFAZNI SERVICES*',
          '--------------------------------',
          '• *Service:* Transfert privé Aéroport d’Istanbul (IST) / Sabiha Gökçen (SAW)',
          '• *Date et heure estimée du vol:* ',
          '• *Numéro de vol:* ',
          '• *Hôtel ou adresse de destination:* ',
          '• *Nombre de passagers et bagages:* ',
          '--------------------------------',
          'Bonjour, je souhaiterais obtenir les options de véhicules et les tarifs pour un transfert aéroport. Merci !',
        ].join('\n');

      case 'ar':
      default:
        return [
          '🚗 *طلب خدمة توصيل واستقبال VIP من وإلى المطار - ELFAZNI SERVICES*',
          '--------------------------------',
          '• *الخدمة:* استقبال أو توصيل بمطار إسطنبول (IST) أو مطار صبيحة (SAW)',
          '• *تاريخ وموعد الرحلة:* ',
          '• *رقم الرحلة:* ',
          '• *اسم الفندق أو عنوان التوصيل:* ',
          '• *عدد الركاب وعدد الحقائب:* ',
          '--------------------------------',
          'مرحباً، أود معرفة أسعار التوصيل وخيارات السيارات المتاحة. شكراً لكم!',
        ].join('\n');
    }
  };

  const getServiceIcon = (id: string) => {
    switch (id) {
      case 'flights':
        return <Plane className="w-4 h-4 text-white" />;
      case 'consular':
        return <Building2 className="w-4 h-4 text-white" />;
      case 'translation':
        return <Languages className="w-4 h-4 text-white" />;
      case 'residency':
        return <Home className="w-4 h-4 text-white" />;
      case 'hotels':
        return <Hotel className="w-4 h-4 text-white" />;
      case 'airport':
        return <Car className="w-4 h-4 text-[#E3C88F]" />;
      case 'community':
      default:
        return <Users2 className="w-4 h-4 text-white" />;
    }
  };

  const handleAction = (service: ServiceItem) => {
    if (service.actionType === 'flight_modal' || service.id === 'flights') {
      onOpenFlightModal();
    } else if (service.actionType === 'consular_modal' || service.id === 'consular') {
      onOpenConsularModal(service.title);
    } else if (service.id === 'airport') {
      const el = document.getElementById('airport-transfer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else if (onOpenStartModal) {
        onOpenStartModal('airport');
      }
    } else if (onOpenStartModal) {
      onOpenStartModal(service.id);
    } else {
      const el = document.getElementById('contact-form');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const cards = services.map((entry, index): ServiceItem & { image: string } => {
    const builtIn = SERVICES_LIST.find((item) => item.id === entry.key);
    return {
      id: entry.key, num: String(index + 1).padStart(2, '0'),
      title: entry.title, desc: entry.description,
      titleTr: builtIn?.titleTr || entry.title, titleEn: builtIn?.titleEn || entry.title,
      titleFr: builtIn?.titleFr || entry.title, descTr: builtIn?.descTr || entry.description,
      descEn: builtIn?.descEn || entry.description, descFr: builtIn?.descFr || entry.description,
      actionText: builtIn?.actionText || 'اطلب الخدمة', actionType: builtIn?.actionType || 'whatsapp',
      whatsappQuery: builtIn?.whatsappQuery, badge: builtIn?.badge,
      image: entry.image || SERVICE_IMAGES[entry.key] || '/assets/slides/10-all-services.webp',
    };
  });
  const filteredServices = cards.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'travel') return item.id === 'flights' || item.id === 'hotels' || item.id === 'airport';
    if (activeFilter === 'consular') return item.id === 'consular' || item.id === 'community';
    if (activeFilter === 'residence') return item.id === 'residency' || item.id === 'translation';
    return true;
  });

  const filterTabs = [
    { id: 'all', label: 'جميع الخدمات' },
    { id: 'consular', label: 'مواعيد قنصلية' },
    { id: 'travel', label: 'حجوزات وسفر' },
    { id: 'residence', label: 'إقامة وترجمة' },
  ];

  if (!cards.length) return null;

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="py-24 sm:py-32 bg-[#FFFFFF] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-semibold text-[#5E7086]">
            <span>{t('منظومة خدمات شاملة')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('متابعة شخصية مستمرة')}</span>
          </div>
          <SectionTitle sectionId="services"
            id="services-heading"
            className="tracking-tight"
          >
            {language === 'tr' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Kapsamlı Hizmetlerimiz</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Net Adımlarla Yanınızdayız</span>
              </>
            ) : language === 'en' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Our Complete Services</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Everything You Need in Clear Steps</span>
              </>
            ) : language === 'fr' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Nos Services Complets</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Tout ce dont vous avez besoin</span>
              </>
            ) : (
              <>
                <span className="block font-black text-[#0B2E57]">خدماتنا المتكاملة</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">كل ما تحتاجه، بخطوات واضحة</span>
              </>
            )}
          </SectionTitle>
          <p className="text-base sm:text-lg lg:text-xl text-[#5E7086] font-normal">
            {t('اختر الخدمة، ثم أرسل لنا تفاصيلك على واتساب لنرشدك إلى الخطوة التالية وتأكيد طلبك.')}
          </p>
        </div>

        {/* Segmented Filter Controls */}
        <div className="flex justify-center mb-14">
          <div
            className="p-1.5 bg-[#eaf4ff] rounded-2xl sm:rounded-full grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-1 max-w-lg w-full sm:w-auto border border-[#D7E7F7]"
            role="tablist"
          >
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleFilterChange(tab.id as any)}
                  className={`relative py-2.5 px-4 sm:px-5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#FFFFFF] text-[#0B2E57] shadow-xs font-black'
                      : 'text-[#5E7086] hover:text-[#0B2E57]'
                  }`}
                >
                  <span>{t(tab.label)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Full-Bleed Immersive Services Grid with Skeleton Loading State */}
        {isFilterLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredServices.map((service) => (
              <ServiceCardSkeleton key={`skeleton-${service.id}`} />
            ))}
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 services-immersive-grid"
          >
            <AnimatePresence>
              {filteredServices.map((service) => {
                const isAirport = service.id === 'airport';
                const bgImage = service.image;
                const ratePill = SERVICE_PRICE_PILLS[service.id] || 'متابعة VIP';
                const isImgLoaded = !!loadedImages[service.id];

                const currentTitle = t(service.title);
                const currentDesc = t(service.desc);

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    key={service.id}
                    onClick={() => handleAction(service)}
                    className={`group relative rounded-3xl overflow-hidden min-h-[430px] sm:min-h-[450px] p-6 sm:p-7 flex flex-col justify-between cursor-pointer transition-all duration-500 hover:-translate-y-1.5 shadow-[0_14px_34px_rgba(1,26,59,0.16)] bg-gradient-to-br from-[#0E4B87] to-[#0B2E57] ${
                      isAirport ? 'ring-2 ring-[#E3C88F]/70' : 'ring-1 ring-black/10'
                    }`}
                  >
                    {/* Skeleton Shimmer Backdrop while image loads */}
                    {!isImgLoaded && (
                      <div
                        className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#0B2E57] via-[#0E4B87] to-[#0B2E57]"
                        aria-hidden="true"
                      />
                    )}

                    {/* Full-Bleed Background Image with object-top for best 3D artwork framing */}
                    <img
                      src={bgImage}
                      alt={currentTitle}
                      loading="lazy"
                      onLoad={() => markImageLoaded(service.id)}
                      onError={() => markImageLoaded(service.id)}
                      className={`object-cover object-top w-full h-full absolute inset-0 group-hover:scale-105 transition-all duration-500 ${
                        isImgLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    {/* Multi-Stop Gradient Overlay: transparent on top, rich royal blue / navy at bottom for crisp text contrast */}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-[#011a3b]/95 via-[#0E4B87]/50 via-40% to-black/15 transition-opacity duration-500 pointer-events-none"
                      aria-hidden="true"
                    />

                  {/* Top Floating Row: Glassmorphic Tag & Circular Action Button */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                      <span className="font-mono text-[11px] text-[#E3C88F] font-bold">
                        {service.num}
                      </span>
                      <span>·</span>
                      <span>
                        {isAirport ? 'IST & SAW VIP' : service.badge ? t(service.badge) : t('خدمة مباشرة')}
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(service);
                      }}
                      aria-label={currentTitle}
                      className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all shrink-0 cursor-pointer"
                    >
                      {getServiceIcon(service.id)}
                    </button>
                  </div>

                  {/* Bottom Overlaid Content & Single High-Contrast Full-Width CTA */}
                  <div className="relative z-10 mt-auto pt-12">
                    {/* Title + Horizontally Aligned Translucent Value/Rate Pill */}
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                        {currentTitle}
                      </h3>
                      <span className="bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium px-3 py-1 rounded-full shrink-0">
                        {t(ratePill)}
                      </span>
                    </div>

                    {/* Crisp Legible Description */}
                    <p className="text-sm sm:text-[15px] text-zinc-200 font-normal leading-relaxed mb-6 line-clamp-2">
                      {currentDesc}
                    </p>

                    {/* Prominent Full-Width High-Contrast Primary CTA */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(service);
                      }}
                      className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-[0.98]"
                    >
                      {isAirport ? (
                        <>
                          <Car className="w-4 h-4 text-[#0B2E57] shrink-0" />
                          <span>{t('احجز توصيل المطار VIP')}</span>
                        </>
                      ) : (
                        <>
                          <span>{t(service.actionText)}</span>
                          {service.actionType === 'whatsapp' ? (
                            <ExternalLink className="w-4 h-4 text-[#0B2E57]" />
                          ) : isRtl ? (
                            <ArrowLeft className="w-4 h-4 text-[#0B2E57]" />
                          ) : (
                            <ArrowRight className="w-4 h-4 text-[#0B2E57]" />
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
        )}
      </div>
    </section>
  );
};
