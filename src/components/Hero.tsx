import { useSiteSettings } from '../context/SiteSettingsContext';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileCheck,
  Plane,
  Building2,
  Car,
  Languages,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeroProps {
  onOpenStartModal: (serviceId?: string) => void;
  onOpenFlightModal: () => void;
  onOpenConsularModal: () => void;
}

interface ServiceTab {
  id: string;
  shortLabelAr: string;
  shortLabelEn: string;
  shortLabelTr: string;
  shortLabelFr: string;
  headlineAr: string;
  headlineEn: string;
  headlineTr: string;
  headlineFr: string;
  benefitAr: string;
  benefitEn: string;
  benefitTr: string;
  benefitFr: string;
  icon: React.ReactNode;
  tagAr: string;
  tagEn: string;
  tagTr: string;
  tagFr: string;
}

const HERO_SERVICES: ServiceTab[] = [
  {
    id: 'consular',
    shortLabelAr: 'مواعيد القنصلية',
    shortLabelEn: 'Consular Appts',
    shortLabelTr: 'Konsolosluk',
    shortLabelFr: 'Consulat',
    headlineAr: 'مواعيد القنصلية المغربية في إسطنبول وأنقرة',
    headlineEn: 'Moroccan Consular Appointments in Istanbul & Ankara',
    headlineTr: 'İstanbul ve Ankara Fas Konsolosluk Randevuları',
    headlineFr: 'Rendez-vous consulaires à Istanbul et Ankara',
    benefitAr: 'حجز المواعيد، تدقيق ملفات الجواز، البطاقة الوطنية CNIE، وأهلية الزواج والتوكيلات.',
    benefitEn: 'Appointment booking, checking passport files, CNIE card, marriage capacity, and POA deeds.',
    benefitTr: 'Randevu alma, pasaport, CNIE kimlik, evlilik ehliyeti ve vekâlet evrak kontrolü.',
    benefitFr: 'Prise de rendez-vous, vérification passeport, carte CNIE, capacité de mariage et procurations.',
    icon: <Building2 className="w-4 h-4 text-[#004AA5]" />,
    tagAr: 'متابعة مباشرة خطوة بخطوة',
    tagEn: 'Step-by-step direct follow-up',
    tagTr: 'Adım adım doğrudan takip',
    tagFr: 'Suivi direct pas à pas',
  },
  {
    id: 'flights',
    shortLabelAr: 'حجوزات الطيران',
    shortLabelEn: 'Flight Bookings',
    shortLabelTr: 'Uçak Biletleri',
    shortLabelFr: 'Billets d’avion',
    headlineAr: 'مقارنة وحجز تذاكر الطيران بأفضل الأسعار',
    headlineEn: 'Compare & Book Airline Tickets with Best Rates',
    headlineTr: 'En Uygun Fiyatlarla Uçak Bileti Karşılaştırma',
    headlineFr: 'Comparaison et réservation de vols aux meilleurs tarifs',
    benefitAr: 'خيارات متعددة بين المغرب وتركيا ومختلف الوجهات مع وزن الأمتعة المسجلة.',
    benefitEn: 'Multiple routes between Morocco, Turkey, and worldwide with checked baggage options.',
    benefitTr: 'Fas, Türkiye ve dünya geneli için bagaj dahil farklı uçuş alternatifleri.',
    benefitFr: 'Multiples options entre le Maroc, la Turquie et l’international avec bagages.',
    icon: <Plane className="w-4 h-4 text-[#004AA5]" />,
    tagAr: 'رحلات مباشرة وبأفضل توقيت',
    tagEn: 'Direct routes & optimal timings',
    tagTr: 'Direkt ve uygun saatli uçuşlar',
    tagFr: 'Vols directs aux meilleurs horaires',
  },
  {
    id: 'airport',
    shortLabelAr: 'توصيل مطار VIP',
    shortLabelEn: 'Airport VIP',
    shortLabelTr: 'VIP Transfer',
    shortLabelFr: 'Transfert VIP',
    headlineAr: 'استقبال وتوصيل VIP خاص من وإلى المطار',
    headlineEn: 'Private VIP Airport Transfer in Istanbul',
    headlineTr: 'İstanbul Havalimanı Özel VIP Karşılama ve Transfer',
    headlineFr: 'Accueil et transfert VIP privé aux aéroports d’Istanbul',
    benefitAr: 'سيارات مرسيدس VIP فسيحة ومكيفة من مطار إسطنبول (IST) ومطار صبيحة (SAW).',
    benefitEn: 'Spacious Mercedes VIP minivans for Istanbul Airport (IST) and Sabiha Gökçen (SAW).',
    benefitTr: 'İstanbul (IST) ve Sabiha Gökçen (SAW) için konforlu Mercedes VIP araçlar.',
    benefitFr: 'Minivans Mercedes VIP spacieux pour Istanbul (IST) et Sabiha Gökçen (SAW).',
    icon: <Car className="w-4 h-4 text-[#CC9048]" />,
    tagAr: 'سائق خاص ومواعيد دقيقة',
    tagEn: 'Private driver & punctual service',
    tagTr: 'Özel şoför ve dakik hizmet',
    tagFr: 'Chauffeur privé et ponctualité',
  },
  {
    id: 'translation',
    shortLabelAr: 'ترجمة محلفة',
    shortLabelEn: 'Translation',
    shortLabelTr: 'Tercüme',
    shortLabelFr: 'Traduction',
    headlineAr: 'ترجمة رسمية محلفة ومعتمدة لدى النوتر',
    headlineEn: 'Certified Sworn & Notarized Translation',
    headlineTr: 'Noter Onaylı Yeminli Tercüme Hizmeti',
    headlineFr: 'Traduction assermentée et notariée officielle',
    benefitAr: 'ترجمة عربية، تركية، فرنسية، وإنجليزية للشهادات وعقود الزواج والوثائق القانونية.',
    benefitEn: 'Arabic, Turkish, French, and English sworn translation for civil certificates and deeds.',
    benefitTr: 'Arapça, Türkçe, Fransızca ve İngilizce yeminli belge tercümesi ve onay takibi.',
    benefitFr: 'Traduction assermentée arabe, turque, française et anglaise de tous vos actes.',
    icon: <Languages className="w-4 h-4 text-[#004AA5]" />,
    tagAr: 'معتمد لدى كاتب العدل (النوتر)',
    tagEn: 'Notary acknowledged in Turkey',
    tagTr: 'Noter tasdik garantisi',
    tagFr: 'Certifié conforme chez le notaire',
  },
  {
    id: 'residency',
    shortLabelAr: 'تجديد الإقامة',
    shortLabelEn: 'Residency',
    shortLabelTr: 'İkamet',
    shortLabelFr: 'Séjour',
    headlineAr: 'متابعة وتجهيز ملفات الإقامة في تركيا',
    headlineEn: 'Turkish Residence Permit File Preparation',
    headlineTr: 'Türkiye İkamet İzni Dosya Hazırlığı',
    headlineFr: 'Préparation du titre de séjour en Turquie',
    benefitAr: 'مراجعة شروط الإقامة السياحية والعائلية، حجز موعد الهجرة وتجهيز التأمين الصحي.',
    benefitEn: 'Review of tourist and family permit files, Göç İdaresi appointments and health insurance.',
    benefitTr: 'Turistik ve aile ikameti evrak kontrolü, randevu ve sağlık sigortası desteği.',
    benefitFr: 'Vérification des pièces de séjour, prise de rendez-vous et assurance santé.',
    icon: <ShieldCheck className="w-4 h-4 text-[#004AA5]" />,
    tagAr: 'ترتيب متكامل وموثوق',
    tagEn: 'Organized & reliable process',
    tagTr: 'Eksiksiz ve güvenilir süreç',
    tagFr: 'Dossier complet et structuré',
  },
];

export const Hero: React.FC<HeroProps> = ({
  onOpenStartModal,
  onOpenFlightModal,
  onOpenConsularModal,
}) => {
  const { settings, isServiceVisible, isSectionVisible } = useSiteSettings();
  const availableServices = HERO_SERVICES.filter((service) => isServiceVisible(service.id));
  const { language, isRtl, t } = useLanguage();
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [isUserInteracting, setIsUserInteracting] = useState(false);

  // Auto-cycle through services every 5 seconds unless user clicked
  useEffect(() => {
    if (isUserInteracting || availableServices.length < 2) return;
    const timer = setInterval(() => {
      setActiveTabIdx((prev) => (prev + 1) % availableServices.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isUserInteracting, availableServices.length]);

  const activeService = availableServices[activeTabIdx] || availableServices[0];

  const getLabel = (s: ServiceTab) => {
    if (language === 'tr') return s.shortLabelTr;
    if (language === 'en') return s.shortLabelEn;
    if (language === 'fr') return s.shortLabelFr;
    return s.shortLabelAr;
  };

  const getHeadline = (s: ServiceTab) => {
    if (language === 'tr') return s.headlineTr;
    if (language === 'en') return s.headlineEn;
    if (language === 'fr') return s.headlineFr;
    return s.headlineAr;
  };

  const getBenefit = (s: ServiceTab) => {
    if (language === 'tr') return s.benefitTr;
    if (language === 'en') return s.benefitEn;
    if (language === 'fr') return s.benefitFr;
    return s.benefitAr;
  };

  const getTag = (s: ServiceTab) => {
    if (language === 'tr') return s.tagTr;
    if (language === 'en') return s.tagEn;
    if (language === 'fr') return s.tagFr;
    return s.tagAr;
  };

  const handleServiceClick = (idx: number) => {
    setIsUserInteracting(true);
    setActiveTabIdx(idx);
  };

  const handleActionClick = () => {
    if (!activeService) return;
    if (activeService.id === 'flights') {
      onOpenFlightModal();
    } else if (activeService.id === 'consular') {
      onOpenConsularModal();
    } else {
      onOpenStartModal(activeService.id);
    }
  };

  return (
    <section id="hero" className="relative pt-28 pb-12 sm:pt-32 sm:pb-16 overflow-hidden bg-gradient-to-b from-[#EAF4FF]/70 via-[#FFFFFF] to-[#FFFFFF]">
      {/* Soft atmospheric ambient background glow */}
      <div className="absolute top-0 inset-x-0 h-[680px] bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(6,78,168,0.12),rgba(255,255,255,0))] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Main Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-start">
            {/* Quiet kicker */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-sm sm:text-base font-bold text-[#5E7086] tracking-wide">
              <span>{t('إسطنبول')}</span>
              <span aria-hidden="true" className="text-[#D7E7F7]">·</span>
              <span className="text-[#004AA5]">{t('للجالية المغربية في تركيا')}</span>
              <span aria-hidden="true" className="text-[#D7E7F7]">·</span>
              <span>{t('كل ما تحتاجه، بخطوات واضحة')}</span>
            </div>

            {/* Two-Line Split Headline: Line 1 font-black, Line 2 Bahij TheSansArabic-bold (weight 200) */}
            <h1 className="elfazni-display tracking-tight">{settings.heroTitle?.[language] || <> 
              {language === 'ar' && (
                <>
                  <span className="block font-black text-[#004AA5]">خدمات متكاملة</span>
                  <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">في مكان واحد</span>
                </>
              )}
              {language === 'tr' && (
                <>
                  <span className="block font-black text-[#004AA5]">Kapsamlı Hizmetler</span>
                  <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">Tek Bir Yerde</span>
                </>
              )}
              {language === 'en' && (
                <>
                  <span className="block font-black text-[#004AA5]">Complete Services</span>
                  <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">All in One Place</span>
                </>
              )}
              {language === 'fr' && (
                <>
                  <span className="block font-black text-[#004AA5]">Services Complets</span>
                  <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">En Un Seul Endroit</span>
                </>
              )}
             </>}</h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl lg:text-[1.35rem] text-[#5E7086] leading-snug font-normal max-w-2xl mx-auto lg:mx-0">
              {settings.heroDescription?.[language] || <>
              {language === 'ar' &&
                'نساعد الجالية المغربية في تركيا على ترتيب المعاملات والحجوزات، بخطوات واضحة وتواصل مباشر عبر واتساب.'}
              {language === 'tr' &&
                'Türkiye’deki Fas topluluğuna resmi işlemler ve rezervasyonlarda net adımlar ve doğrudan WhatsApp iletişimiyle destek oluyoruz.'}
              {language === 'en' &&
                'Helping the Moroccan diaspora in Turkey manage paperwork and bookings with clear steps and direct WhatsApp communication.'}
              {language === 'fr' &&
                'Nous accompagnons la communauté marocaine en Turquie pour ses démarches et réservations, avec clarté et suivi direct via WhatsApp.'}
            </>}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 sm:gap-4 pt-2">
              <button
                type="button"
                onClick={() => onOpenStartModal()}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#004AA5] hover:bg-[#2A83D5] text-white font-bold text-base sm:text-lg shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>{t('ابدأ طلبك')}</span>
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>

              {isSectionVisible('services') && <a
                href="#services"
                className="w-full sm:w-auto px-7 py-4 rounded-full bg-[#FFFFFF] hover:bg-[#EAF4FF] text-[#0B2E57] border border-[#D7E7F7] font-bold text-base sm:text-lg shadow-2xs active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-center"
              >
                <span>{t('استكشف الخدمات')}</span>
                <span className="text-[#CC9048]">↓</span>
              </a>}
            </div>

            {/* Interactive Service Switcher / Selector */}
            {activeService && <div className="rounded-3xl bg-[#FFFFFF] border border-[#D7E7F7] shadow-[0_8px_28px_rgba(6,78,168,0.06)] p-4 sm:p-6 space-y-5">
              {/* Tab Bar */}
              <div
                className="flex flex-wrap items-center justify-center sm:justify-between gap-1.5 p-1.5 bg-[#EAF4FF] rounded-2xl border border-[#D7E7F7]"
                role="tablist"
                aria-label="Service Selector"
              >
                {availableServices.map((srv, idx) => {
                  const isActive = srv.id === activeService.id;
                  return (
                    <button
                      key={srv.id}
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => handleServiceClick(idx)}
                      className={`flex-1 min-w-[130px] sm:min-w-0 py-2.5 px-3 rounded-xl text-xs sm:text-[13px] font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        isActive
                          ? 'bg-[#FFFFFF] text-[#0B2E57] shadow-xs scale-[1.01]'
                          : 'text-[#5E7086] hover:text-[#0B2E57] hover:bg-white/60'
                      }`}
                    >
                      <span className="shrink-0">{srv.icon}</span>
                      <span>{getLabel(srv)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Service Card Preview */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeService.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col sm:flex-row items-center sm:items-stretch justify-between gap-4 pt-1"
                >
                  <div className="text-center sm:text-start flex-1 min-w-0">
                    <div className="inline-flex items-center gap-1.5 text-[#004AA5] text-xs sm:text-sm font-bold mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#CC9048]" />
                      <span>{getTag(activeService)}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0B2E57] leading-snug mb-1.5">
                      {getHeadline(activeService)}
                    </h3>
                    <p className="text-sm sm:text-base text-[#5E7086] leading-snug font-normal">
                      {getBenefit(activeService)}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center">
                    <button
                      type="button"
                      onClick={handleActionClick}
                      className="px-6 py-3.5 rounded-full bg-[#004AA5] hover:bg-[#2A83D5] text-white text-sm font-bold shadow-xs active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                    >
                      <span>{t('طلب هذه الخدمة')}</span>
                      {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>}

            {/* 4 Tangible Guarantees */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-6 border-t border-[#D7E7F7] text-[#0B2E57] text-xs sm:text-sm font-semibold">
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('متابعة مباشرة عبر واتساب')}</span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <FileCheck className="w-4 h-4 text-[#004AA5] shrink-0" />
                <span>{t('تدقيق الملفات قبل الموعد')}</span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <ShieldCheck className="w-4 h-4 text-[#CC9048] shrink-0" />
                <span>{t('ترجمة معتمدة لدى النوتير')}</span>
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <Clock className="w-4 h-4 text-slate-600 shrink-0" />
                <span>{t('استجابة سريعة ومستمرة')}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-sm sm:max-w-md w-full"
            >
              {/* Subtle ambient light shadow */}
              <div className="absolute inset-0 bg-radial from-[#004AA5]/10 to-transparent rounded-full blur-3xl scale-95 pointer-events-none" />

              {/* Main Phone Visual with Apple-grade smooth hover */}
              <button type="button" aria-label={t('ابدأ طلبك')} onClick={() => onOpenStartModal()} className="relative z-10 flex w-full justify-center rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#004AA5]">
                <motion.img
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  src="/assets/phone-services-transparent.webp"
                  alt="ELFAZNI SERVICES"
                  width={480}
                  height={540}
                  className="w-full max-h-[540px] object-contain drop-shadow-[0_24px_48px_rgba(18,85,154,0.14)] cursor-pointer"
                  fetchPriority="high"
                  decoding="async"
                />
              </button>

              {/* Apple-style floating badge 1 */}
              <div className="pointer-events-none absolute top-6 -right-2 sm:-right-4 z-20 bg-white/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.06] flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                  ✓
                </span>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                    {t('خدمة مباشرة')}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {t('عن بُعد عبر واتساب')}
                  </span>
                </div>
              </div>

              {/* Apple-style floating badge 2 */}
              <div className="pointer-events-none absolute -bottom-2 -left-2 sm:-left-4 z-20 bg-white/90 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-black/[0.06] flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-[#004AA5]/10 text-[#004AA5] flex items-center justify-center font-bold text-xs">
                  ★
                </span>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                    {t('متابعة الطلب')}
                  </span>
                  <span className="text-xs font-bold text-[#0B2E57]">
                    {t('متابعة خطوة بخطوة')}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
