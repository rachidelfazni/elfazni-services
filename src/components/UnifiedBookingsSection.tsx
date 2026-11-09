import { SectionTitle } from './SiteContent';
import { useSiteSettings } from '../context/SiteSettingsContext';
import React, { useState, useEffect, useRef } from 'react';
import {
  Plane,
  Hotel,
  Car,
  Calendar,
  Users,
  ArrowLeftRight,
  ArrowLeft,
  ArrowRight,
  Plus,
  Play,
  Pause,
  Star,
  MapPin,
  X,
  Check,
  Compass,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AIRLINES_LIST, SITE_CONTACT } from '../data/content';
import { AirportAutocompleteInput } from './AirportAutocompleteInput';
import { InteractiveTransferWidget } from './InteractiveTransferWidget';
import { WhatsAppLogo } from './WhatsAppLogo';
import { AirlineLogoMarquee } from './AirlineLogoMarquee';
import { InlineSuccessBanner } from './SuccessFeedback';
import { ServiceContactModal } from './common/ServiceContactModal';

export type BookingTabType = 'flights' | 'hotels' | 'transfer';

interface UnifiedBookingsSectionProps {
  onOpenFlightModal: () => void;
  activeTabExternal?: BookingTabType;
  onTabChangeExternal?: (tab: BookingTabType) => void;
}

const HOTEL_DESTINATIONS = [
  {
    id: 'ist-fatih',
    ar: 'إسطنبول - الفاتح / السلطان أحمد، تركيا',
    en: 'Istanbul - Fatih / Sultanahmet, Türkiye',
    tr: 'İstanbul - Fatih / Sultanahmet, Türkiye',
    fr: 'Istanbul - Fatih / Sultanahmet, Turquie',
    tagAr: 'تاريخي وقريب من المعالم',
  },
  {
    id: 'ist-taksim',
    ar: 'إسطنبول - تقسيم / شيشلي / بشكتاش، تركيا',
    en: 'Istanbul - Taksim / Sisli / Besiktas, Türkiye',
    tr: 'İstanbul - Taksim / Şişli / Beşiktaş, Türkiye',
    fr: 'Istanbul - Taksim / Şişli / Beşiktaş, Turquie',
    tagAr: 'قلب المدينة والتسوق',
  },
  {
    id: 'ist-bosphorus',
    ar: 'إسطنبول - إطلالة البوسفور / ساريير، تركيا',
    en: 'Istanbul - Bosphorus View / Sariyer, Türkiye',
    tr: 'İstanbul - Boğaz Hattı / Sarıyer, Türkiye',
    fr: 'Istanbul - Vue Bosphore / Sarıyer, Turquie',
    tagAr: 'فنادق فاخرة 5 نجوم',
  },
  {
    id: 'antalya',
    ar: 'أنطاليا - لارا / كونيالتي / بيليك، تركيا',
    en: 'Antalya - Lara / Konyaalti / Belek, Türkiye',
    tr: 'Antalya - Lara / Konyaaltı / Belek, Türkiye',
    fr: 'Antalya - Lara / Konyaaltı / Belek, Turquie',
    tagAr: 'منتجعات ساحلية وعائلية',
  },
  {
    id: 'trabzon',
    ar: 'طرابزون وأوزنجول، الشمال التركي',
    en: 'Trabzon & Uzungol, Black Sea, Türkiye',
    tr: 'Trabzon ve Uzungöl, Karadeniz, Türkiye',
    fr: 'Trabzon et Uzungöl, Mer Noire, Turquie',
    tagAr: 'طبيعة وأكواخ عائلية',
  },
  {
    id: 'bursa',
    ar: 'بورصة وأولوداغ، تركيا',
    en: 'Bursa & Uludag, Türkiye',
    tr: 'Bursa ve Uludağ, Türkiye',
    fr: 'Bursa et Uludağ, Turquie',
    tagAr: 'منتجعات وفنادق ينابيع',
  },
  {
    id: 'sapanca',
    ar: 'صبنجة ومعشوقية، تركيا',
    en: 'Sapanca & Masukiye, Türkiye',
    tr: 'Sapanca ve Maşukiye, Türkiye',
    fr: 'Sapanca et Maşukiye, Turquie',
    tagAr: 'فلل وأكواخ بمسبح خاص',
  },
  {
    id: 'cappadocia',
    ar: 'كابادوكيا (غوريميه)، تركيا',
    en: 'Cappadocia (Goreme), Türkiye',
    tr: 'Kapadokya (Göreme), Türkiye',
    fr: 'Cappadoce (Göreme), Turquie',
    tagAr: 'فنادق كهفية مميزة',
  },
  {
    id: 'morocco-cities',
    ar: 'الدار البيضاء / مراكش / طنجة / الرباط، المغرب',
    en: 'Casablanca / Marrakech / Tangier / Rabat, Morocco',
    tr: 'Kazablanka / Marakeş / Tanca / Rabat, Fas',
    fr: 'Casablanca / Marrakech / Tanger / Rabat, Maroc',
    tagAr: 'فنادق ورياضات بالمغرب',
  },
];

const formatDisplayDate = (dateStr: string, lang: string): string => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);

      const locale =
        lang === 'tr' ? 'tr-TR' : lang === 'en' ? 'en-US' : lang === 'fr' ? 'fr-FR' : 'ar-MA';

      const dayStr = String(day).padStart(2, '0');
      const monthStr = date.toLocaleDateString(locale, { month: 'short' });
      const weekdayStr = date.toLocaleDateString(locale, { weekday: 'short' });
      const sep = lang === 'ar' ? '، ' : ', ';

      return `${dayStr} ${monthStr}${sep}${weekdayStr}`;
    }
  } catch {
    // fallback
  }
  return dateStr;
};

export const UnifiedBookingsSection: React.FC<UnifiedBookingsSectionProps> = ({
  onOpenFlightModal,
  activeTabExternal,
  onTabChangeExternal,
}) => {
  const { t, isRtl, language } = useLanguage();
  const { isServiceVisible } = useSiteSettings();
  const [requestedTab, setActiveTab] = useState<BookingTabType>('flights');
  const visibleTabs = (['flights', 'hotels', 'transfer'] as const).filter((tab) =>
    isServiceVisible(tab === 'transfer' ? 'airport' : tab)
  );
  const activeTab = visibleTabs.includes(requestedTab) ? requestedTab : visibleTabs[0];
  const [isPlayingMarquee, setIsPlayingMarquee] = useState(true);

  // Sync with external tab prop or hash navigation
  useEffect(() => {
    if (activeTabExternal) {
      setActiveTab(activeTabExternal);
    }
  }, [activeTabExternal]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#airport-transfer') {
        setActiveTab('transfer');
      } else if (hash === '#hotels') {
        setActiveTab('hotels');
      } else if (hash === '#airlines' || hash === '#flights') {
        setActiveTab('flights');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTab = (tab: BookingTabType) => {
    setActiveTab(tab);
    onTabChangeExternal?.(tab);
  };

  // --- FLIGHT SEARCH STATE ---
  const [flightTripType, setFlightTripType] = useState<'oneway' | 'round'>('oneway');
  const [nonStopOnly, setNonStopOnly] = useState<boolean>(false);
  const [fromAirport, setFromAirport] = useState<string>(
    'إسطنبول (جميع المطارات (IST & SAW))، تركيا (IST/SAW)'
  );
  const [toAirport, setToAirport] = useState<string>(
    'طنجة (مطار طنجة ابن بطوطة الدولي)، المغرب (TNG)'
  );
  const [departDate, setDepartDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    return tomorrow.toISOString().split('T')[0];
  });
  const [returnDate, setReturnDate] = useState<string>('');
  const [flightAdults, setFlightAdults] = useState<number>(1);
  const [flightChildren, setFlightChildren] = useState<number>(0);
  const [flightInfants, setFlightInfants] = useState<number>(0);
  const [cabinClass, setCabinClass] = useState<'economy' | 'business'>('economy');
  const [checkedBaggage, setCheckedBaggage] = useState<boolean>(true);
  const [showPassengerPopover, setShowPassengerPopover] = useState<boolean>(false);
  const passengerPopoverRef = useRef<HTMLDivElement>(null);

  // --- HOTEL SEARCH STATE ---
  const [hotelDestination, setHotelDestination] = useState<string>(
    'إسطنبول - الفاتح / السلطان أحمد، تركيا'
  );
  const [showHotelDestDropdown, setShowHotelDestDropdown] = useState<boolean>(false);
  const [checkInDate, setCheckInDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [checkOutDate, setCheckOutDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [hotelRooms, setHotelRooms] = useState<number>(1);
  const [hotelAdults, setHotelAdults] = useState<number>(2);
  const [hotelChildren, setHotelChildren] = useState<number>(0);
  const [hotelStars, setHotelStars] = useState<string>('4 أو 5 نجوم');
  const [mealPlan, setMealPlan] = useState<string>('شامل الإفطار');
  const [hotelNotes, setHotelNotes] = useState<string>('');
  const [showHotelGuestsPopover, setShowHotelGuestsPopover] = useState<boolean>(false);
  const [flightSubmitted, setFlightSubmitted] = useState<boolean>(false);
  const [showFlightWebsiteModal, setShowFlightWebsiteModal] = useState<boolean>(false);
  const [hotelSubmitted, setHotelSubmitted] = useState<boolean>(false);
  const [showHotelWebsiteModal, setShowHotelWebsiteModal] = useState<boolean>(false);
  const hotelDestRef = useRef<HTMLDivElement>(null);
  const hotelGuestsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (passengerPopoverRef.current && !passengerPopoverRef.current.contains(e.target as Node)) {
        setShowPassengerPopover(false);
      }
      if (hotelDestRef.current && !hotelDestRef.current.contains(e.target as Node)) {
        setShowHotelDestDropdown(false);
      }
      if (hotelGuestsRef.current && !hotelGuestsRef.current.contains(e.target as Node)) {
        setShowHotelGuestsPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwapFlightAirports = () => {
    const temp = fromAirport;
    setFromAirport(toAirport);
    setToAirport(temp);
  };

  const totalFlightPassengers = flightAdults + flightChildren + flightInfants;

  const handleFlightSearchWhatsApp = () => {
    const typeLabel = flightTripType === 'round' ? 'ذهاب وعودة (Round Trip)' : 'ذهاب فقط (One Way)';
    const cabinLabel = cabinClass === 'business' ? 'درجة رجال الأعمال (Business)' : 'الدرجة السياحية (Economy)';
    const paxDetails = `${flightAdults} بالغين${flightChildren > 0 ? `، ${flightChildren} أطفال` : ''}${
      flightInfants > 0 ? `، ${flightInfants} رضّع` : ''
    }`;

    const lines = [
      '✈️ *طلب بحث وحجز تذاكر طيران - ELFAZNI SERVICES*',
      '--------------------------------',
      `• *نوع الرحلة:* ${typeLabel}${nonStopOnly ? ' (رحلة مباشرة بدون توقف)' : ''}`,
      `• *من:* ${fromAirport || 'غير محدد'}`,
      `• *إلى:* ${toAirport || 'غير محدد'}`,
      `• *تاريخ المغادرة:* ${departDate || 'مرن'}`,
      flightTripType === 'round' && returnDate ? `• *تاريخ العودة:* ${returnDate}` : null,
      `• *المسافرون:* ${paxDetails}`,
      `• *درجة السفر:* ${cabinLabel}`,
      `• *الأمتعة:* ${checkedBaggage ? 'شامل حقائب الشحن المسجلة' : 'حقيبة يد فقط'}`,
      '--------------------------------',
      'مرحباً، أود الحصول على أفضل عروض وأسعار الطيران المتاحة لهذا المسار. شكراً لكم!',
    ].filter(Boolean);

    const waUrl = `https://wa.me/${SITE_CONTACT.whatsappRaw}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setFlightSubmitted(true);
  };

  const calculateHotelNights = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const handleHotelSearchWhatsApp = () => {
    const nights = calculateHotelNights();
    const lines = [
      '🏨 *طلب حجز فندق وإقامة - ELFAZNI SERVICES*',
      '--------------------------------',
      `• *الوجهة / الفندق المطلوب:* ${hotelDestination || 'إسطنبول'}`,
      `• *تاريخ الدخول (Check-in):* ${checkInDate}`,
      `• *تاريخ المغادرة (Check-out):* ${checkOutDate} (${nights} ليالٍ)`,
      `• *عدد الغرف والضيوف:* ${hotelRooms} غرفة · ${hotelAdults} بالغين${
        hotelChildren > 0 ? ` · ${hotelChildren} أطفال` : ''
      }`,
      `• *فئة الفندق المفضلة:* ${hotelStars}`,
      `• *نظام الوجبات:* ${mealPlan}`,
      hotelNotes.trim() ? `• *ملاحظات أو اسم فندق محدد:* ${hotelNotes.trim()}` : null,
      '--------------------------------',
      'مرحباً، أرجو إرسال أفضل خيارات وأسعار الفنادق المتاحة في هذه التواريخ. شكراً لكم!',
    ].filter(Boolean);

    const waUrl = `https://wa.me/${SITE_CONTACT.whatsappRaw}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setHotelSubmitted(true);
  };

  // Divide active airlines into 2 balanced rows for the dual-row marquee
  const visibleAirlines = AIRLINES_LIST.filter((a) => !a.hidden && a.slug !== 'air-france');
  const midPoint = Math.ceil(visibleAirlines.length / 2);
  const row1 = visibleAirlines.slice(0, midPoint);
  const row2 = visibleAirlines.slice(midPoint);

  return (
    <section
      id="airlines"
      aria-labelledby="bookings-hub-heading"
      className="py-20 sm:py-28 bg-gradient-to-b from-[#0B2E57] via-[#0E4B87] to-[#0B2E57] relative overflow-hidden border-y border-[#D7E7F7]"
    >
      {/* Hidden anchor targets so #airport-transfer and #hotels scroll straight here */}
      <span id="airport-transfer" className="block absolute -top-20 pointer-events-none" aria-hidden="true" />
      <span id="hotels" className="block absolute -top-20 pointer-events-none" aria-hidden="true" />

      {/* Subtle gold & blue ambient radial glow */}
      <span className="block absolute top-0 inset-x-0 h-[420px] bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,rgba(42,131,213,0.28),rgba(18,85,154,0))] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-[#E3C88F] text-xs sm:text-sm font-bold">
            <Compass className="w-4 h-4 text-[#E3C88F]" />
            <span>{t('منصة الحجوزات الموحدة — طيران · فنادق · توصيل مطار VIP')}</span>
          </div>

          <SectionTitle sectionId="airlines" id="bookings-hub-heading" className="tracking-tight">
            {language === 'tr' ? (
              <>
                <span className="block font-black text-white">Tüm Seyahat Rezervasyonlarınız</span>
                <span className="block font-extralight font-bahij-bold text-[#E3C88F] mt-1">
                  Uçak Bileti, Otel ve VIP Transfer Tek Bölümde
                </span>
              </>
            ) : language === 'en' ? (
              <>
                <span className="block font-black text-white">All Your Travel Bookings in One Hub</span>
                <span className="block font-extralight font-bahij-bold text-[#E3C88F] mt-1">
                  Flights, Hotels & VIP Airport Transfer
                </span>
              </>
            ) : language === 'fr' ? (
              <>
                <span className="block font-black text-white">Toutes Vos Réservations au Même Endroit</span>
                <span className="block font-extralight font-bahij-bold text-[#E3C88F] mt-1">
                  Vols, Hôtels et Transfert Aéroport VIP
                </span>
              </>
            ) : (
              <>
                <span className="block font-black text-white">مركز الحجوزات والسفر الموحد</span>
                <span className="block font-extralight font-bahij-bold text-[#E3C88F] mt-1">
                  حجوزات الطيران، الفنادق، وتوصيل المطار في قسم واحد
                </span>
              </>
            )}
          </SectionTitle>
        </div>

        {/* Top Category Pill Tabs (Flights | Hotels | VIP Transfer) */}
        <div className="flex justify-center mb-7">
          <div
            className="inline-flex flex-nowrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 max-w-full overflow-x-auto"
            role="tablist"
            aria-label={t('أقسام الحجوزات')}
          >
            {visibleTabs.includes('flights') && <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'flights'}
              onClick={() => handleSelectTab('flights')}
              className={`!w-auto shrink-0 whitespace-nowrap justify-center px-4 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'flights'
                  ? 'bg-white text-[#0B2E57] shadow-md'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <Plane className="w-4 h-4 shrink-0" />
              <span>{t('حجوزات الطيران')}</span>
            </button>}

            {visibleTabs.includes('hotels') && <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'hotels'}
              onClick={() => handleSelectTab('hotels')}
              className={`!w-auto shrink-0 whitespace-nowrap justify-center px-4 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'hotels'
                  ? 'bg-white text-[#0B2E57] shadow-md'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <Hotel className="w-4 h-4 shrink-0" />
              <span>{t('حجز الفنادق')}</span>
            </button>}

            {visibleTabs.includes('transfer') && <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'transfer'}
              onClick={() => handleSelectTab('transfer')}
              className={`!w-auto shrink-0 whitespace-nowrap justify-center px-4 sm:px-7 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'transfer'
                  ? 'bg-white text-[#0B2E57] shadow-md'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <Car className="w-4 h-4 shrink-0" />
              <span>{t('توصيل المطار')}</span>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-[#CC9048] text-white">
                VIP
              </span>
            </button>}
          </div>
        </div>

        {/* ==================== TAB 1: FLIGHTS ==================== */}
        {activeTab === 'flights' && (
          <div className="space-y-10 animate-fade-in">
            {/* White Search Box Card (inspired by screenshot) */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-[0_24px_60px_rgba(0,0,0,0.22)] border border-[#D7E7F7]">
              {/* Top Row: One Way / Round Trip Radio + Non-stop Checkbox */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-6">
                  <label
                    onClick={() => setFlightTripType('oneway')}
                    className="inline-flex items-center gap-2 cursor-pointer select-none"
                  >
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        flightTripType === 'oneway'
                          ? 'border-[#004AA5]'
                          : 'border-slate-300'
                      }`}
                    >
                      {flightTripType === 'oneway' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#004AA5]" />
                      )}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        flightTripType === 'oneway' ? 'text-[#0B2E57]' : 'text-slate-600'
                      }`}
                    >
                      {t('ذهاب فقط (One Way)')}
                    </span>
                  </label>

                  <label
                    onClick={() => {
                      setFlightTripType('round');
                      if (!returnDate && departDate) {
                        try {
                          const d = new Date(departDate + 'T00:00:00');
                          d.setDate(d.getDate() + 7);
                          setReturnDate(d.toISOString().split('T')[0]);
                        } catch {}
                      }
                    }}
                    className="inline-flex items-center gap-2 cursor-pointer select-none"
                  >
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        flightTripType === 'round'
                          ? 'border-[#004AA5]'
                          : 'border-slate-300'
                      }`}
                    >
                      {flightTripType === 'round' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#004AA5]" />
                      )}
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        flightTripType === 'round' ? 'text-[#0B2E57]' : 'text-slate-600'
                      }`}
                    >
                      {t('ذهاب وعودة (Round Trip)')}
                    </span>
                  </label>
                </div>

                {/* Non-stop Checkbox + Subtle Swap Action */}
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={handleSwapFlightAirports}
                    className="!w-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eaf4ff] hover:bg-[#D7E7F7] text-[#0B2E57] text-xs font-bold transition-colors cursor-pointer"
                    title={t('تبديل مطار المغادرة والوصول')}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#004AA5]" />
                    <span>{t('تبديل المطارات')}</span>
                  </button>

                  <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm font-bold text-[#0B2E57]">
                    <input
                      type="checkbox"
                      checked={nonStopOnly}
                      onChange={(e) => setNonStopOnly(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#004AA5] focus:ring-[#004AA5] cursor-pointer"
                    />
                    <span>{t('رحلات مباشرة فقط (Non-stop)')}</span>
                  </label>
                </div>
              </div>

              {/* Main Inputs Row - Clean Single-Row 6-Column Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.35fr_1.35fr_1fr_1fr_1.15fr_auto] gap-2.5 items-center">
                {/* 1. From Airport */}
                <AirportAutocompleteInput
                  label={t('من (From)')}
                  value={fromAirport}
                  onChange={setFromAirport}
                  placeholder={t('مدينة أو مطار المغادرة...')}
                />

                {/* 2. To Airport */}
                <AirportAutocompleteInput
                  label={t('إلى (To)')}
                  value={toAirport}
                  onChange={setToAirport}
                  placeholder={t('مدينة أو مطار الوصول...')}
                />

                {/* 3. Depart Date */}
                <div className="relative rounded-xl border border-slate-300 hover:border-[#004AA5]/60 px-3.5 py-2 bg-white flex flex-col justify-center h-[60px] transition-all group">
                  <span className="text-[11px] font-bold text-slate-600 block select-none">
                    {t('تاريخ المغادرة')}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 pointer-events-none min-w-0">
                    <Calendar className="w-3.5 h-3.5 text-[#004AA5] shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-[#0B2E57] truncate select-none">
                      {formatDisplayDate(departDate, language)}
                    </span>
                  </div>
                  <input
                    type="date"
                    value={departDate}
                    onChange={(e) => setDepartDate(e.target.value)}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker?.();
                      } catch {}
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    title={t('تاريخ المغادرة')}
                    aria-label={t('تاريخ المغادرة')}
                  />
                </div>

                {/* 4. Return Date or Add Return */}
                {flightTripType === 'round' ? (
                  <div className="relative rounded-xl border border-[#004AA5]/60 px-3.5 py-2 bg-white flex flex-col justify-center h-[60px] transition-all group">
                    <div className="flex items-center justify-between relative z-20">
                      <span className="text-[11px] font-bold text-slate-600 block select-none">
                        {t('تاريخ العودة')}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReturnDate('');
                          setFlightTripType('oneway');
                        }}
                        className="!w-4 !h-4 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center cursor-pointer transition-colors shrink-0"
                        title={t('إلغاء العودة')}
                        aria-label={t('إلغاء العودة')}
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 pointer-events-none min-w-0">
                      <Calendar className="w-3.5 h-3.5 text-[#CC9048] shrink-0" />
                      <span
                        className={`text-xs sm:text-sm font-bold truncate select-none ${
                          returnDate ? 'text-[#0B2E57]' : 'text-slate-400'
                        }`}
                      >
                        {returnDate ? formatDisplayDate(returnDate, language) : t('حدد تاريخ العودة')}
                      </span>
                    </div>
                    <input
                      type="date"
                      value={returnDate}
                      min={departDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      onClick={(e) => {
                        try {
                          e.currentTarget.showPicker?.();
                        } catch {}
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      title={t('تاريخ العودة')}
                      aria-label={t('تاريخ العودة')}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setFlightTripType('round');
                      if (!returnDate && departDate) {
                        try {
                          const d = new Date(departDate + 'T00:00:00');
                          d.setDate(d.getDate() + 7);
                          setReturnDate(d.toISOString().split('T')[0]);
                        } catch {}
                      }
                    }}
                    className="w-full h-[60px] rounded-xl border border-dashed border-slate-300 hover:border-[#004AA5] hover:bg-[#eaf4ff]/40 px-3.5 py-2 bg-white flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-[#0B2E57] transition-all cursor-pointer select-none whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4 text-[#004AA5] shrink-0" />
                    <span>{t('إضافة عودة')}</span>
                  </button>
                )}

                {/* 5. Traveler & Cabin Selector */}
                <div ref={passengerPopoverRef} className="relative h-[60px]">
                  <button
                    type="button"
                    onClick={() => setShowPassengerPopover(!showPassengerPopover)}
                    className="w-full h-[60px] rounded-xl border border-slate-300 hover:border-[#004AA5]/60 px-3.5 py-2 bg-white text-start flex flex-col justify-center cursor-pointer"
                  >
                    <span className="text-[11px] font-bold text-slate-600 block truncate">
                      {t('المسافرون، الدرجة')}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                      <Users className="w-3.5 h-3.5 text-[#004AA5] shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-[#0B2E57] truncate">
                        {totalFlightPassengers} {t('مسافر')} /{' '}
                        {cabinClass === 'business' ? t('أعمال') : t('سياحية')}
                      </span>
                    </div>
                  </button>

                  {showPassengerPopover && (
                    <div className="absolute z-50 left-0 right-0 sm:w-72 mt-1.5 bg-white rounded-2xl border border-[#D7E7F7] shadow-[0_16px_40px_rgba(18,85,154,0.18)] p-4 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-[#0B2E57] block">{t('بالغون')}</span>
                          <span className="text-[10px] text-slate-400">+12 {t('سنة')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFlightAdults(Math.max(1, flightAdults - 1))}
                            className="!w-7 !h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-sm cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-5 text-center">{flightAdults}</span>
                          <button
                            type="button"
                            onClick={() => setFlightAdults(flightAdults + 1)}
                            className="!w-7 !h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-sm cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-[#0B2E57] block">{t('أطفال')}</span>
                          <span className="text-[10px] text-slate-400">2 - 11 {t('سنة')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFlightChildren(Math.max(0, flightChildren - 1))}
                            className="!w-7 !h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-sm cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-5 text-center">{flightChildren}</span>
                          <button
                            type="button"
                            onClick={() => setFlightChildren(flightChildren + 1)}
                            className="!w-7 !h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-sm cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-[#0B2E57] block">{t('رضّع')}</span>
                          <span className="text-[10px] text-slate-400">&lt; 2 {t('سنة')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFlightInfants(Math.max(0, flightInfants - 1))}
                            className="!w-7 !h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-sm cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-5 text-center">{flightInfants}</span>
                          <button
                            type="button"
                            onClick={() => setFlightInfants(flightInfants + 1)}
                            className="!w-7 !h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-sm cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCabinClass('economy')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold cursor-pointer ${
                            cabinClass === 'economy'
                              ? 'bg-[#004AA5] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t('الدرجة السياحية')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCabinClass('business')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold cursor-pointer ${
                            cabinClass === 'business'
                              ? 'bg-[#004AA5] text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t('رجال الأعمال')}
                        </button>
                      </div>

                      <label className="flex items-center gap-2 pt-1 text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checkedBaggage}
                          onChange={(e) => setCheckedBaggage(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-[#004AA5]"
                        />
                        <span>{t('مع أمتعة شحن مسجلة (23+ كغ)')}</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* 6. Dual Submit Action (Website Request & WhatsApp) */}
                <div className="sm:col-span-2 lg:col-span-1 flex flex-col sm:flex-row lg:flex-row gap-2 w-full lg:!w-auto">
                  <button
                    type="button"
                    onClick={() => setShowFlightWebsiteModal(true)}
                    className="w-full lg:w-auto h-[60px] px-4 rounded-xl bg-gradient-to-r from-[#0B2E57] to-[#004AA5] hover:from-[#004AA5] hover:to-[#2A83D5] text-white font-bold text-xs sm:text-sm whitespace-nowrap shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{t('إرسال الطلب عبر الموقع')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFlightSearchWhatsApp}
                    className={`w-full lg:w-auto h-[60px] px-4 rounded-xl text-white font-black text-xs sm:text-sm whitespace-nowrap shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      flightSubmitted
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-[#25d366] hover:bg-[#20ba5a]'
                    }`}
                  >
                    {flightSubmitted ? (
                      <Check className="w-4 h-4 shrink-0 animate-success-pop" />
                    ) : (
                      <WhatsAppLogo className="w-4 h-4 shrink-0" />
                    )}
                    <span>{flightSubmitted ? t('إعادة فتح واتساب') : t('إرسال عبر واتساب')}</span>
                  </button>
                </div>
              </div>

              {flightSubmitted && (
                <div className="mt-4">
                  <InlineSuccessBanner
                    title={t('تم تجهيز طلبك. يرجى إرسال الرسالة عبر واتساب لإكمال الطلب.')}
                    subtitle={`${fromAirport} ➔ ${toAirport} · ${departDate || t('مرن')}`}
                    onReopenWhatsApp={handleFlightSearchWhatsApp}
                    onDismiss={() => setFlightSubmitted(false)}
                  />
                </div>
              )}

              {/* Bottom Quick Helper Bar */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-[#5E7086]">
                <span>
                  {t('يمكنك كتابة أي مدينة أو مطار في العالم، وسنرسل لك مقارنة شاملة لأرخص وأقرب الرحلات عبر واتساب.')}
                </span>
                <button
                  type="button"
                  onClick={onOpenFlightModal}
                  className="text-[#004AA5] hover:text-[#0B2E57] font-bold underline underline-offset-4 cursor-pointer"
                >
                  {t('خيارات متقدمة وتحديد شركة طيران مفضلة')}
                </button>
              </div>
            </div>

            {/* Dual-Row Airlines Marquee */}
            <div className="space-y-4 relative pt-2">
              <div className="flex items-center justify-between text-white/80 text-xs sm:text-sm font-bold px-1">
                <span>{t('نقارن لك الأسعار عبر أبرز شركات الطيران العالمية والإقليمية:')}</span>
                <button
                  type="button"
                  onClick={() => setIsPlayingMarquee(!isPlayingMarquee)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer transition-colors"
                >
                  {isPlayingMarquee ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingMarquee ? t('إيقاف مؤقت') : t('تشغيل')}</span>
                </button>
              </div>

              {/* Row 1 */}
              <AirlineLogoMarquee
                items={row1}
                direction="forward"
                playing={isPlayingMarquee}
                compact
                label={t('شعارات شركات الطيران — الصف الأول')}
              />

              {/* Row 2 */}
              <AirlineLogoMarquee
                items={row2}
                direction="reverse"
                playing={isPlayingMarquee}
                compact
                label={t('شعارات شركات الطيران — الصف الثاني')}
              />
            </div>
          </div>
        )}

        {/* ==================== TAB 2: HOTELS ==================== */}
        {activeTab === 'hotels' && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-[0_24px_60px_rgba(0,0,0,0.22)] border border-[#D7E7F7] space-y-5 animate-fade-in">
            {/* Top Row: Star Category & Meal Plan */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-[#CC9048] fill-[#CC9048]" />
                  <span>{t('تصنيف الفندق:')}</span>
                </span>
                {['4 أو 5 نجوم', '5 نجوم فاخرة', '4 نجوم مميزة', 'شقق فندقية عائلية'].map((starOpt) => (
                  <button
                    key={starOpt}
                    type="button"
                    onClick={() => setHotelStars(starOpt)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      hotelStars === starOpt
                        ? 'bg-[#004AA5] text-white shadow-2xs'
                        : 'bg-[#eaf4ff] text-[#0B2E57] hover:bg-[#D7E7F7]'
                    }`}
                  >
                    {t(starOpt)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500">{t('الوجبات:')}</span>
                {['شامل الإفطار', 'إقامة فقط', 'نصف إقامة / شامل كلياً'].map((meal) => (
                  <button
                    key={meal}
                    type="button"
                    onClick={() => setMealPlan(meal)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      mealPlan === meal
                        ? 'bg-[#CC9048] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t(meal)}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Hotel Search Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.15fr_auto] gap-2.5 items-center">
              {/* 1. Destination or Hotel Name Input with Autocomplete Dropdown */}
              <div ref={hotelDestRef} className="relative h-[60px]">
                <div
                  onClick={() => setShowHotelDestDropdown(true)}
                  className="w-full h-[60px] rounded-xl border border-slate-300 hover:border-[#004AA5]/60 px-3.5 py-2 bg-white flex flex-col justify-center cursor-text"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 block truncate">
                      {t('المدينة / المنطقة أو اسم الفندق')}
                    </span>
                    {hotelDestination && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setHotelDestination('');
                          setShowHotelDestDropdown(true);
                        }}
                        className="!w-4 !h-4 rounded-full bg-slate-800 text-white flex items-center justify-center cursor-pointer shrink-0"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-[#004AA5] shrink-0" />
                    <input
                      type="text"
                      value={hotelDestination}
                      onFocus={() => setShowHotelDestDropdown(true)}
                      onChange={(e) => {
                        setHotelDestination(e.target.value);
                        setShowHotelDestDropdown(true);
                      }}
                      placeholder={t('إسطنبول، أنطاليا، طرابزون، أو اسم الفندق...')}
                      className="w-full text-xs sm:text-sm font-bold text-[#0B2E57] bg-transparent outline-none truncate"
                    />
                  </div>
                </div>

                {showHotelDestDropdown && (
                  <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-[#D7E7F7] shadow-[0_16px_40px_rgba(18,85,154,0.16)] max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {HOTEL_DESTINATIONS.map((dest) => {
                      const label =
                        language === 'tr'
                          ? dest.tr
                          : language === 'en'
                          ? dest.en
                          : language === 'fr'
                          ? dest.fr
                          : dest.ar;
                      return (
                        <button
                          key={dest.id}
                          type="button"
                          onClick={() => {
                            setHotelDestination(label);
                            setShowHotelDestDropdown(false);
                          }}
                          className="w-full px-3.5 py-2.5 text-start hover:bg-[#eaf4ff]/70 flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Hotel className="w-4 h-4 text-[#004AA5] shrink-0" />
                            <span className="text-xs sm:text-sm font-bold text-[#0B2E57] truncate">
                              {label}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-[#CC9048] shrink-0">
                            {dest.tagAr}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Check-in Date */}
              <div className="relative rounded-xl border border-slate-300 hover:border-[#004AA5]/60 px-3.5 py-2 bg-white flex flex-col justify-center h-[60px] transition-all group">
                <span className="text-[11px] font-bold text-slate-600 block select-none truncate">
                  {t('تاريخ الدخول (Check-in)')}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 pointer-events-none min-w-0">
                  <Calendar className="w-3.5 h-3.5 text-[#004AA5] shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-[#0B2E57] truncate select-none">
                    {formatDisplayDate(checkInDate, language)}
                  </span>
                </div>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch {}
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  title={t('تاريخ الدخول (Check-in)')}
                  aria-label={t('تاريخ الدخول (Check-in)')}
                />
              </div>

              {/* 3. Check-out Date */}
              <div className="relative rounded-xl border border-slate-300 hover:border-[#004AA5]/60 px-3.5 py-2 bg-white flex flex-col justify-center h-[60px] transition-all group">
                <div className="flex items-center justify-between relative z-20 pointer-events-none">
                  <span className="text-[11px] font-bold text-slate-600 block select-none truncate">
                    {t('تاريخ المغادرة')}
                  </span>
                  <span className="text-[10px] font-black text-[#CC9048] shrink-0">
                    {calculateHotelNights()} {t('ليالٍ')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 pointer-events-none min-w-0">
                  <Calendar className="w-3.5 h-3.5 text-[#CC9048] shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-[#0B2E57] truncate select-none">
                    {formatDisplayDate(checkOutDate, language)}
                  </span>
                </div>
                <input
                  type="date"
                  value={checkOutDate}
                  min={checkInDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch {}
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  title={t('تاريخ المغادرة')}
                  aria-label={t('تاريخ المغادرة')}
                />
              </div>

              {/* 4. Rooms & Guests */}
              <div ref={hotelGuestsRef} className="relative h-[60px]">
                <button
                  type="button"
                  onClick={() => setShowHotelGuestsPopover(!showHotelGuestsPopover)}
                  className="w-full h-[60px] rounded-xl border border-slate-300 hover:border-[#004AA5]/60 px-3.5 py-2 bg-white text-start flex flex-col justify-center cursor-pointer"
                >
                  <span className="text-[11px] font-bold text-slate-600 block truncate">
                    {t('الغرف والضيوف')}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                    <Users className="w-3.5 h-3.5 text-[#004AA5] shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-[#0B2E57] truncate">
                      {hotelRooms} {t('غرفة')} · {hotelAdults + hotelChildren} {t('ضيوف')}
                    </span>
                  </div>
                </button>

                {showHotelGuestsPopover && (
                  <div className="absolute z-50 left-0 right-0 sm:w-64 mt-1.5 bg-white rounded-2xl border border-[#D7E7F7] shadow-[0_16px_40px_rgba(18,85,154,0.18)] p-4 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B2E57]">{t('عدد الغرف')}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setHotelRooms(Math.max(1, hotelRooms - 1))}
                          className="!w-7 !h-7 rounded-lg bg-slate-100 font-bold text-sm cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-5 text-center">{hotelRooms}</span>
                        <button
                          type="button"
                          onClick={() => setHotelRooms(hotelRooms + 1)}
                          className="!w-7 !h-7 rounded-lg bg-slate-100 font-bold text-sm cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B2E57]">{t('البالغون')}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setHotelAdults(Math.max(1, hotelAdults - 1))}
                          className="!w-7 !h-7 rounded-lg bg-slate-100 font-bold text-sm cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-5 text-center">{hotelAdults}</span>
                        <button
                          type="button"
                          onClick={() => setHotelAdults(hotelAdults + 1)}
                          className="!w-7 !h-7 rounded-lg bg-slate-100 font-bold text-sm cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B2E57]">{t('الأطفال')}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setHotelChildren(Math.max(0, hotelChildren - 1))}
                          className="!w-7 !h-7 rounded-lg bg-slate-100 font-bold text-sm cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-bold w-5 text-center">{hotelChildren}</span>
                        <button
                          type="button"
                          onClick={() => setHotelChildren(hotelChildren + 1)}
                          className="!w-7 !h-7 rounded-lg bg-slate-100 font-bold text-sm cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Dual Submit Hotel Inquiry CTAs (Website and WhatsApp) */}
              <div className="sm:col-span-2 lg:col-span-1 flex flex-col sm:flex-row lg:flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowHotelWebsiteModal(true)}
                  className="w-full h-[52px] sm:h-[60px] px-4 rounded-xl bg-gradient-to-r from-[#0B2E57] to-[#004AA5] hover:from-[#004AA5] hover:to-[#2A83D5] text-white font-bold text-xs sm:text-sm whitespace-nowrap shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{t('إرسال الطلب عبر الموقع')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleHotelSearchWhatsApp}
                  className={`w-full h-[52px] sm:h-[60px] px-4 rounded-xl text-white font-black text-xs sm:text-sm whitespace-nowrap shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    hotelSubmitted
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-[#25d366] hover:bg-[#20ba5a]'
                  }`}
                >
                  {hotelSubmitted ? (
                    <Check className="w-4 h-4 shrink-0 animate-success-pop" />
                  ) : (
                    <WhatsAppLogo className="w-4 h-4 shrink-0" />
                  )}
                  <span>{hotelSubmitted ? t('إعادة فتح واتساب') : t('إرسال عبر واتساب')}</span>
                </button>
              </div>
            </div>

            {hotelSubmitted && (
              <div className="pt-1">
                <InlineSuccessBanner
                  title={t('تم تجهيز طلبك. يرجى إرسال الرسالة عبر واتساب لإكمال الطلب.')}
                  subtitle={`${hotelDestination || t('إسطنبول')} · ${calculateHotelNights()} ${t('ليالٍ')} · ${hotelRooms} ${t('غرفة')}`}
                  onReopenWhatsApp={handleHotelSearchWhatsApp}
                  onDismiss={() => setHotelSubmitted(false)}
                />
              </div>
            )}

            {/* Optional Hotel Note Input */}
            <div className="pt-2">
              <input
                type="text"
                value={hotelNotes}
                onChange={(e) => setHotelNotes(e.target.value)}
                placeholder={t(
                  'اختياري: هل لديك اسم فندق معين تود الاستفسار عن سعره أو طلبات خاصة (إطلالة بحرية، غرف متصلة، قرب المترو)؟'
                )}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#004AA5] text-xs sm:text-sm text-[#0B2E57] outline-none transition-all"
              />
            </div>

            {/* Hotel Booking Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-semibold text-[#0B2E57]">
              <div className="p-3 rounded-xl bg-[#eaf4ff]/60 border border-[#D7E7F7] flex items-center gap-2">
                <Check className="w-4 h-4 text-[#004AA5] shrink-0" />
                <span>{t('حجوزات فنادق مؤكدة بأسعار خاصة في إسطنبول وجميع المدن التركية')}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#eaf4ff]/60 border border-[#D7E7F7] flex items-center gap-2">
                <Check className="w-4 h-4 text-[#004AA5] shrink-0" />
                <span>{t('تأكيد فوري للحجز (Voucher رسمي) صالح لتقديمه في المطار والقنصلية')}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#eaf4ff]/60 border border-[#D7E7F7] flex items-center gap-2">
                <Check className="w-4 h-4 text-[#004AA5] shrink-0" />
                <span>{t('خيارات دفع مرنة بحوالة بنكية مع متابعة شخصية حتى تسجيل الدخول')}</span>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: VIP AIRPORT TRANSFER ==================== */}
        {activeTab === 'transfer' && (
          <div className="animate-fade-in">
            <InteractiveTransferWidget embedded={true} />
          </div>
        )}
      </div>

      <ServiceContactModal
        isOpen={showFlightWebsiteModal}
        onClose={() => setShowFlightWebsiteModal(false)}
        serviceTag="FLIGHT"
        serviceTitle={`طلب حجز ومقارنة طيران: ${fromAirport} ➔ ${toAirport}`}
        serviceSummary={`المسار: ${fromAirport} ➔ ${toAirport}\nنوع الرحلة: ${flightTripType === 'round' ? 'ذهاب وعودة' : 'ذهاب فقط'}\nتاريخ المغادرة: ${departDate || 'مرن'}${flightTripType === 'round' && returnDate ? `\nتاريخ العودة: ${returnDate}` : ''}\nالمسافرون: ${flightAdults} بالغين${flightChildren > 0 ? ` · ${flightChildren} أطفال` : ''}${flightInfants > 0 ? ` · ${flightInfants} رضّع` : ''}\nالدرجة: ${cabinClass === 'business' ? 'درجة رجال الأعمال' : 'الدرجة السياحية'}\nالأمتعة: ${checkedBaggage ? 'شامل حقائب الشحن' : 'حقيبة يد فقط'}`}
        payloadJson={{
          fromAirport,
          toAirport,
          flightTripType,
          departDate,
          returnDate,
          cabinClass,
          checkedBaggage,
          flightAdults,
          flightChildren,
          flightInfants,
        }}
        onSuccess={() => {
          setFlightSubmitted(true);
          setShowFlightWebsiteModal(false);
        }}
      />

      <ServiceContactModal
        isOpen={showHotelWebsiteModal}
        onClose={() => setShowHotelWebsiteModal(false)}
        serviceTag="HOTEL"
        serviceTitle={`حجز فندق: ${hotelDestination || 'إسطنبول'}`}
        serviceSummary={`الوجهة: ${hotelDestination || 'إسطنبول'}\nتاريخ الدخول: ${checkInDate}\nتاريخ المغادرة: ${checkOutDate} (${calculateHotelNights()} ليالٍ)\nالغرف والضيوف: ${hotelRooms} غرفة · ${hotelAdults} بالغين ${hotelChildren > 0 ? `· ${hotelChildren} أطفال` : ''}\nالفئة المطلوبة: ${hotelStars}\nنظام الوجبات: ${mealPlan}${hotelNotes ? `\nملاحظات: ${hotelNotes}` : ''}`}
        payloadJson={{
          destination: hotelDestination || 'إسطنبول',
          checkInDate,
          checkOutDate,
          nights: calculateHotelNights(),
          hotelRooms,
          hotelAdults,
          hotelChildren,
          hotelStars,
          mealPlan,
          hotelNotes,
        }}
        onSuccess={() => {
          setHotelSubmitted(true);
          setShowHotelWebsiteModal(false);
        }}
      />
    </section>
  );
};
