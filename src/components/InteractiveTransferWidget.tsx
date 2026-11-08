import React, { useState, useRef, useEffect } from 'react';
import {
  Car,
  MapPin,
  Clock,
  Users,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Edit3,
  Search,
  ChevronDown,
  Plane,
  X,
  Check,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SITE_CONTACT } from '../data/content';
import { WhatsAppLogo } from './WhatsAppLogo';
import { InlineSuccessBanner } from './SuccessFeedback';
import { ServiceContactModal } from './common/ServiceContactModal';
import {
  AIRPORTS,
  AirportOption,
  filterAirports,
  formatAirportLabel,
  formatAirportCityAndCode,
  formatAirportCountry,
} from '../data/airports';

interface DestinationZone {
  id: string;
  nameAr: string;
  nameTr: string;
  nameEn: string;
  nameFr: string;
  distIstKm: number;
  timeIstMin: number;
  distSawKm: number;
  timeSawMin: number;
  isCustom?: boolean;
}

const DESTINATION_ZONES: DestinationZone[] = [
  {
    id: 'fatih',
    nameAr: 'الفاتح / السلطان أحمد',
    nameTr: 'Fatih / Sultanahmet',
    nameEn: 'Fatih / Sultanahmet',
    nameFr: 'Fatih / Sultanahmet',
    distIstKm: 42,
    timeIstMin: 40,
    distSawKm: 48,
    timeSawMin: 55,
  },
  {
    id: 'taksim',
    nameAr: 'تقسيم / شيشلي / بيوغلو',
    nameTr: 'Taksim / Şişli / Beyoğlu',
    nameEn: 'Taksim / Sisli / Beyoglu',
    nameFr: 'Taksim / Şişli / Beyoğlu',
    distIstKm: 39,
    timeIstMin: 35,
    distSawKm: 43,
    timeSawMin: 50,
  },
  {
    id: 'kadikoy',
    nameAr: 'كاديكوي / أوسكودار (الطرف الآسيوي)',
    nameTr: 'Kadıköy / Üsküdar (Anadolu)',
    nameEn: 'Kadikoy / Uskudar (Asian Side)',
    nameFr: 'Kadıköy / Üsküdar (Rive Asiatique)',
    distIstKm: 54,
    timeIstMin: 55,
    distSawKm: 32,
    timeSawMin: 30,
  },
  {
    id: 'basaksehir',
    nameAr: 'باشاك شهير / كايا شهير',
    nameArShort: 'باشاك شهير',
    nameTr: 'Başakşehir / Kayaşehir',
    nameEn: 'Basaksehir / Kayasehir',
    nameFr: 'Başakşehir / Kayaşehir',
    distIstKm: 28,
    timeIstMin: 25,
    distSawKm: 65,
    timeSawMin: 70,
  } as DestinationZone,
  {
    id: 'beylikduzu',
    nameAr: 'بيليك دوزو / إسن يورت',
    nameTr: 'Beylikdüzü / Esenyurt',
    nameEn: 'Beylikduzu / Esenyurt',
    nameFr: 'Beylikdüzü / Esenyurt',
    distIstKm: 48,
    timeIstMin: 45,
    distSawKm: 78,
    timeSawMin: 85,
  },
  {
    id: 'bakirkoy',
    nameAr: 'بكركوي / فلوريا / زيتون بورنو',
    nameTr: 'Bakırköy / Florya / Zeytinburnu',
    nameEn: 'Bakirkoy / Florya / Zeytinburnu',
    nameFr: 'Bakırköy / Florya / Zeytinburnu',
    distIstKm: 44,
    timeIstMin: 40,
    distSawKm: 52,
    timeSawMin: 60,
  },
  {
    id: 'other',
    nameAr: 'عنوان آخر / فندق أو منطقة أخرى',
    nameTr: 'Diğer Bölge / Özel Otel & Adres',
    nameEn: 'Other Destination / Custom Address',
    nameFr: 'Autre Destination / Adresse Personnalisée',
    distIstKm: 45,
    timeIstMin: 45,
    distSawKm: 50,
    timeSawMin: 55,
    isCustom: true,
  },
];

const VEHICLES = [
  {
    id: 'vito',
    nameAr: 'مرسيدس فيتو VIP (1-6 ركاب)',
    nameTr: 'Mercedes Vito VIP (1-6 Kişi)',
    nameEn: 'Mercedes Vito VIP (1-6 Pax)',
    nameFr: 'Mercedes Vito VIP (1-6 Passagers)',
    descAr: 'مقاعد جلدية مريحة، واي فاي، تكييف، وشواحن',
    descTr: 'Deri konforlu koltuklar, Wi-Fi, klima ve şarj',
    descEn: 'Leather luxury seats, Wi-Fi, climate control & chargers',
    descFr: 'Sièges cuir grand confort, Wi-Fi, climatisation & chargeurs',
    badge: 'الأكثر طلباً',
    capacity: '1 - 6',
    luggage: '6 حقائب',
  },
  {
    id: 'sprinter',
    nameAr: 'مرسيدس سبرينتر VIP (7-14 راكب)',
    nameTr: 'Mercedes Sprinter VIP (7-14 Kişi)',
    nameEn: 'Mercedes Sprinter VIP (7-14 Pax)',
    nameFr: 'Mercedes Sprinter VIP (7-14 Passagers)',
    descAr: 'مساحة عائلية واسعة جداً مع سعة حقائب ضخمة',
    descTr: 'Büyük aileler ve gruplar için geniş bagaj hacmi',
    descEn: 'Extra-large spacious cabin for groups and ample luggage',
    descFr: 'Espace très généreux pour les grands groupes et familles',
    badge: 'للمجموعات والعائلات',
    capacity: '7 - 14',
    luggage: '15+ حقيبة',
  },
];

const QUICK_AIRPORT_CODES = ['IST', 'SAW', 'AYT', 'TZX', 'ESB', 'BJV'];

interface InteractiveTransferWidgetProps {
  embedded?: boolean;
}

export const InteractiveTransferWidget: React.FC<InteractiveTransferWidgetProps> = ({
  embedded = false,
}) => {
  const { t, language, isRtl } = useLanguage();

  const [selectedAirportCode, setSelectedAirportCode] = useState<string>('IST');
  const [airportSearchQuery, setAirportSearchQuery] = useState<string>('');
  const [isAirportDropdownOpen, setIsAirportDropdownOpen] = useState<boolean>(false);
  const [airportFilterTab, setAirportFilterTab] = useState<'all' | 'turkey' | 'international'>('all');

  const [selectedZoneId, setSelectedZoneId] = useState<string>('fatih');
  const [customDestinationAddress, setCustomDestinationAddress] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('vito');
  const [tripType, setTripType] = useState<'arrival' | 'departure' | 'round'>('arrival');
  const [passengerCount, setPassengerCount] = useState<number>(3);
  const [luggageCount, setLuggageCount] = useState<number>(3);
  const [transferSubmitted, setTransferSubmitted] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);

  const airportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (airportDropdownRef.current && !airportDropdownRef.current.contains(event.target as Node)) {
        setIsAirportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedAirportObj: AirportOption =
    AIRPORTS.find((a) => a.code === selectedAirportCode) || AIRPORTS[0];

  const isIstanbulAirport = selectedAirportCode === 'IST' || selectedAirportCode === 'SAW';

  const filteredAirports = filterAirports(airportSearchQuery).filter((airport) => {
    if (airportFilterTab === 'turkey') return airport.category === 'turkey';
    if (airportFilterTab === 'international') return airport.category !== 'turkey';
    return true;
  });

  const selectedZone = DESTINATION_ZONES.find((z) => z.id === selectedZoneId) || DESTINATION_ZONES[0];
  const selectedVehicle = VEHICLES.find((v) => v.id === selectedVehicleId) || VEHICLES[0];

  const estimatedDistance =
    selectedAirportCode === 'IST' ? selectedZone.distIstKm : selectedZone.distSawKm;
  const estimatedTime =
    selectedAirportCode === 'IST' ? selectedZone.timeIstMin : selectedZone.timeSawMin;

  const getZoneName = (zone: DestinationZone) => {
    if (language === 'tr') return zone.nameTr;
    if (language === 'en') return zone.nameEn;
    if (language === 'fr') return zone.nameFr;
    return zone.nameAr;
  };

  const getVehicleName = (v: (typeof VEHICLES)[0]) => {
    if (language === 'tr') return v.nameTr;
    if (language === 'en') return v.nameEn;
    if (language === 'fr') return v.nameFr;
    return v.nameAr;
  };

  const getAirportNameByLang = (airport: AirportOption) => {
    if (language === 'tr') return airport.nameTr;
    if (language === 'en') return airport.nameEn;
    if (language === 'fr') return airport.nameFr;
    return airport.nameAr;
  };

  const getAirportCityByLang = (airport: AirportOption) => {
    if (language === 'tr') return airport.cityTr;
    if (language === 'en') return airport.cityEn;
    if (language === 'fr') return airport.cityFr;
    return airport.cityAr;
  };

  const resolvedDestinationLabel =
    !isIstanbulAirport && customDestinationAddress.trim()
      ? customDestinationAddress.trim()
      : selectedZone.isCustom && customDestinationAddress.trim()
      ? customDestinationAddress.trim()
      : customDestinationAddress.trim()
      ? `${getZoneName(selectedZone)} (${customDestinationAddress.trim()})`
      : getZoneName(selectedZone);

  const handleSelectAirport = (airport: AirportOption) => {
    setSelectedAirportCode(airport.code);
    setIsAirportDropdownOpen(false);
    setAirportSearchQuery('');
    if (airport.code !== 'IST' && airport.code !== 'SAW') {
      setSelectedZoneId('other');
    }
  };

  const handleBookViaWhatsApp = () => {
    const airportName = `${selectedAirportObj.cityAr} - ${selectedAirportObj.nameAr} (${selectedAirportObj.code})`;
    const tripTypeText =
      tripType === 'arrival'
        ? 'استقبال من المطار ونقل إلى الوجهة'
        : tripType === 'departure'
        ? 'توصيل من الوجهة إلى المطار'
        : 'ذهاب وعودة (استقبال وتوصيل)';

    const lines = [
      '🚗 *طلب حجز توصيل VIP للمطار - ELFAZNI SERVICES*',
      '--------------------------------',
      `• *نوع الحجز:* ${tripTypeText}`,
      `• *المطار:* ${airportName}`,
      `• *منطقة التوصيل / الفندق:* ${resolvedDestinationLabel}`,
      `• *نوع السيارة المطلوبة:* ${getVehicleName(selectedVehicle)}`,
      `• *عدد المسافرين:* ${passengerCount} أشخاص`,
      `• *عدد الحقائب:* ${luggageCount} حقائب`,
      isIstanbulAirport && !selectedZone.isCustom
        ? `• *المسافة المقدرة:* حوالي ${estimatedDistance} كم (~${estimatedTime} دقيقة)`
        : null,
      '--------------------------------',
      'أرجو تأكيد التوافر وإرسال السعر والتفاصيل. شكراً لكم!',
    ].filter(Boolean);

    const waUrl = `https://wa.me/${SITE_CONTACT.whatsappRaw}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    setTransferSubmitted(true);
  };

  const content = (
    <div className="bg-[#eaf4ff]/50 rounded-3xl border border-[#D7E7F7] shadow-[0_12px_36px_rgba(6,78,168,0.05)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
      {/* Controls Column */}
      <div className="lg:col-span-7 p-6 sm:p-10 space-y-7 bg-white">
        {/* Step 1: Searchable Airport Dropdown + Quick Turkish Airport Pills */}
        <div ref={airportDropdownRef} className="relative">
          <div className="flex items-center justify-between mb-2.5">
            <label className="block text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
              {t('1. اختر المطار')}
            </label>
            <span className="text-[11px] font-semibold text-[#004AA5]">
              {t('مطارات تركيا والمطارات الدولية')}
            </span>
          </div>

          {/* Searchable Dropdown Trigger / Input */}
          <div
            onClick={() => setIsAirportDropdownOpen(true)}
            className={`w-full rounded-2xl border-2 px-4 py-3 bg-white transition-all cursor-pointer flex items-center justify-between gap-3 ${
              isAirportDropdownOpen
                ? 'border-[#004AA5] ring-4 ring-[#004AA5]/10'
                : 'border-[#D7E7F7] hover:border-[#004AA5]/60'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-[#eaf4ff] text-[#004AA5] flex items-center justify-center shrink-0">
                <Plane className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-[#0B2E57] truncate">
                    {getAirportNameByLang(selectedAirportObj)}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#004AA5] text-white font-mono text-[11px] font-bold shrink-0">
                    {selectedAirportObj.code}
                  </span>
                </div>
                <span className="block text-xs text-slate-500 truncate mt-0.5">
                  {getAirportCityByLang(selectedAirportObj)} · {formatAirportCountry(selectedAirportObj, language)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="hidden sm:inline-block text-xs font-bold text-[#004AA5] bg-[#eaf4ff] px-2.5 py-1 rounded-lg">
                {t('تغيير / بحث')}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  isAirportDropdownOpen ? 'rotate-180 text-[#004AA5]' : ''
                }`}
              />
            </div>
          </div>

          {/* Dropdown Menu */}
          {isAirportDropdownOpen && (
            <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl border border-[#D7E7F7] shadow-[0_20px_50px_rgba(18,85,154,0.22)] overflow-hidden animate-fade-in">
              {/* Search Input Bar */}
              <div className="p-3 bg-[#F8FBFF] border-b border-[#D7E7F7] space-y-2.5">
                <div className="relative flex items-center">
                  <Search
                    className={`w-4 h-4 text-[#004AA5] absolute ${
                      isRtl ? 'right-3.5' : 'left-3.5'
                    } pointer-events-none`}
                  />
                  <input
                    type="text"
                    autoFocus
                    value={airportSearchQuery}
                    onChange={(e) => setAirportSearchQuery(e.target.value)}
                    placeholder={t('ابحث باسم المطار، المدينة، أو الرمز (IST, SAW, AYT, CMN...)')}
                    className={`w-full py-2.5 ${
                      isRtl ? 'pr-10 pl-9' : 'pl-10 pr-9'
                    } rounded-xl border border-[#D7E7F7] bg-white text-xs sm:text-sm font-bold text-[#0B2E57] focus:border-[#004AA5] outline-none`}
                  />
                  {airportSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setAirportSearchQuery('')}
                      className={`absolute ${
                        isRtl ? 'left-2.5' : 'right-2.5'
                      } w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center cursor-pointer`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'all', label: 'جميع المطارات' },
                    { id: 'turkey', label: 'مطارات تركيا' },
                    { id: 'international', label: 'مطارات دولية' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAirportFilterTab(tab.id as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        airportFilterTab === tab.id
                          ? 'bg-[#004AA5] text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {t(tab.label)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Airport Results List */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {filteredAirports.length > 0 ? (
                  filteredAirports.map((airport) => {
                    const isSelected = airport.code === selectedAirportCode;
                    return (
                      <button
                        key={airport.code}
                        type="button"
                        onClick={() => handleSelectAirport(airport)}
                        className={`w-full px-4 py-3 text-start flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#eaf4ff]' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-11 py-1 rounded-lg font-mono text-xs font-black text-center shrink-0 ${
                              isSelected
                                ? 'bg-[#004AA5] text-white'
                                : 'bg-slate-100 text-[#0B2E57]'
                            }`}
                          >
                            {airport.code}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-[#0B2E57] truncate">
                              {getAirportNameByLang(airport)}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">
                              {getAirportCityByLang(airport)} — {formatAirportCountry(airport, language)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {airport.category === 'turkey' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-[#CC9048]">
                              {formatAirportCountry(airport, language)}
                            </span>
                          )}
                          {isSelected && <Check className="w-4 h-4 text-[#004AA5]" />}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs sm:text-sm text-slate-500">
                    {t('لم يتم العثور على مطار مطابق. جرب البحث باسم المدينة أو رمز المطار.')}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick-Select Popular Turkish Airports */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {QUICK_AIRPORT_CODES.map((code) => {
              const airport = AIRPORTS.find((a) => a.code === code);
              if (!airport) return null;
              const isSelected = selectedAirportCode === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSelectAirport(airport)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#0B2E57] text-white border-[#0B2E57] shadow-2xs'
                      : 'bg-[#eaf4ff]/70 text-[#0B2E57] border-[#D7E7F7] hover:bg-[#eaf4ff]'
                  }`}
                >
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{formatAirportCityAndCode(airport, language)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Trip Type (Arrival / Departure / Round) */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            {t('نوع التوصيل')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'arrival', label: 'استقبال من المطار' },
              { id: 'departure', label: 'توصيل إلى المطار' },
              { id: 'round', label: 'ذهاب وعودة' },
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setTripType(type.id as any)}
                className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
                  tripType === type.id
                    ? 'border-[#004AA5] bg-blue-50 text-[#004AA5] shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t(type.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Destination Zone Selector (including Custom/Other option) */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            {t('2. وجهة التوصيل أو الفندق')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {DESTINATION_ZONES.map((zone) => {
              const isSelected = zone.id === selectedZoneId;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                    zone.isCustom ? 'col-span-2 sm:col-span-3' : ''
                  } ${
                    isSelected
                      ? 'border-[#CC9048] bg-amber-50/50 shadow-sm ring-1 ring-[#CC9048]'
                      : 'border-slate-200 hover:border-blue-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="block text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {getZoneName(zone)}
                    </span>
                    {zone.isCustom && <Edit3 className="w-4 h-4 text-[#CC9048] shrink-0" />}
                  </div>
                  <span className="block text-xs text-slate-500 mt-1">
                    {zone.isCustom || !isIstanbulAirport
                      ? t('أدخل اسم الفندق أو المنطقة أو المدينة يدوياً')
                      : `~${selectedAirportCode === 'IST' ? zone.distIstKm : zone.distSawKm} ${t('كم')}`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Address / Hotel Name Input */}
          <div className="mt-3">
            <input
              type="text"
              value={customDestinationAddress}
              onChange={(e) => setCustomDestinationAddress(e.target.value)}
              placeholder={
                selectedZone.isCustom || !isIstanbulAirport
                  ? t('اكتب هنا اسم الفندق، المنطقة، أو العنوان بالتفصيل (مثال: شيشلي، بورصة، صبنجة...)')
                  : t('اختياري: اكتب اسم الفندق أو العنوان الدقيق داخل المنطقة المختارة...')
              }
              className={`w-full px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold outline-none transition-all ${
                selectedZone.isCustom || !isIstanbulAirport
                  ? 'border-[#CC9048] bg-amber-50/30 focus:ring-2 focus:ring-[#CC9048]/20 text-[#0B2E57]'
                  : 'border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#004AA5] text-[#0B2E57]'
              }`}
            />
          </div>
        </div>

        {/* Step 4: Vehicle Selector */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            {t('3. فئة السيارة')}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {VEHICLES.map((vehicle) => {
              const isSelected = vehicle.id === selectedVehicleId;
              return (
                <div
                  key={vehicle.id}
                  onClick={() => setSelectedVehicleId(vehicle.id)}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#004AA5] bg-blue-50/70 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 shrink-0">
                        {t(vehicle.badge)}
                      </span>
                      <Car className="w-4 h-4 text-[#004AA5] opacity-80 shrink-0" />
                    </div>
                    <h4 className="block !text-sm sm:!text-base font-black text-[#0B2E57] leading-snug">
                      {getVehicleName(vehicle)}
                    </h4>
                    <p className="text-xs text-slate-600 font-normal leading-snug">
                      {language === 'tr'
                        ? vehicle.descTr
                        : language === 'en'
                        ? vehicle.descEn
                        : language === 'fr'
                        ? vehicle.descFr
                        : vehicle.descAr}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 mt-3.5 pt-2.5 border-t border-slate-200/60 text-xs text-slate-600 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      {vehicle.capacity}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                      {t(vehicle.luggage)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 5: Passenger & Luggage quick adjust */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 block">{t('الركاب')}</span>
              <span className="text-xs text-slate-500">
                {passengerCount} {t('أشخاص')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer text-sm"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setPassengerCount(Math.min(14, passengerCount + 1))}
                className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer text-sm"
              >
                +
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 block">{t('الحقائب')}</span>
              <span className="text-xs text-slate-500">
                {luggageCount} {t('حقائب')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLuggageCount(Math.max(1, luggageCount - 1))}
                className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer text-sm"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setLuggageCount(Math.min(15, luggageCount + 1))}
                className="w-7 h-7 rounded-lg bg-white border border-slate-300 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer text-sm"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Summary Card Column */}
      <div className="lg:col-span-5 bg-gradient-to-br from-[#0E4B87] to-[#0B2E57] text-white p-6 sm:p-10 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Car className="w-4 h-4 text-[#E3C88F]" />
              </span>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-300 block font-semibold uppercase tracking-wider">
                  {t('ملخص المسار')}
                </span>
                <span className="text-sm sm:text-base font-bold text-white block truncate">
                  {formatAirportLabel(selectedAirportObj, language)}
                </span>
              </div>
            </div>

            <span className="text-xs font-bold text-[#E3C88F] shrink-0">VIP Transfer</span>
          </div>

          {/* Dynamic Route Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10">
              <div className="flex items-center gap-1.5 text-slate-300 text-xs mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{t('المسافة التقديرية')}</span>
              </div>
              <span className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-white">
                {selectedZone.isCustom || !isIstanbulAirport ? t('حسب العنوان') : `~${estimatedDistance}`}{' '}
                {!selectedZone.isCustom && isIstanbulAirport && (
                  <small className="text-xs font-normal text-slate-300">{t('كم')}</small>
                )}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/10">
              <div className="flex items-center gap-1.5 text-slate-300 text-xs mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{t('وقت الرحلة')}</span>
              </div>
              <span className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-white">
                {selectedZone.isCustom || !isIstanbulAirport ? t('مباشر') : `~${estimatedTime}`}{' '}
                {!selectedZone.isCustom && isIstanbulAirport && (
                  <small className="text-xs font-normal text-slate-300">{t('دقيقة')}</small>
                )}
              </span>
            </div>
          </div>

          {/* Destination & Selected Vehicle Spec */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2 text-slate-300">
              <span className="shrink-0">{t('الوجهة')}:</span>
              <b className="text-white text-sm text-end truncate">{resolvedDestinationLabel}</b>
            </div>
            <div className="flex items-center justify-between gap-2 text-slate-300">
              <span className="shrink-0">{t('السيارة')}:</span>
              <b className="text-[#E3C88F] text-sm text-end">{getVehicleName(selectedVehicle)}</b>
            </div>
            <div className="flex items-center justify-between gap-2 text-slate-300">
              <span className="shrink-0">{t('الحمولة')}:</span>
              <span className="text-white">
                {passengerCount} {t('مسافرين')} · {luggageCount} {t('حقائب')}
              </span>
            </div>
          </div>

          {/* Guarantees */}
          <div className="space-y-2 text-xs text-slate-300 font-normal pt-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t('سائق خاص محترف مع استقبال بلافتة باسمك بالمطار')}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t('متابعة حية لموعد هبوط الطائرة بدون أي رسوم تأخير')}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{t('سيارات مرسيدس VIP حديثة ومجهزة بالكامل')}</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Direct Action Button */}
        <div className="pt-6 space-y-3">
          {transferSubmitted && (
            <InlineSuccessBanner
              variant="dark"
              title={t('تم تجهيز طلبك. يرجى إرسال الرسالة عبر واتساب لإكمال الطلب.')}
              subtitle={`${selectedAirportObj.code} ➔ ${resolvedDestinationLabel} · ${getVehicleName(selectedVehicle)}`}
              onDismiss={() => setTransferSubmitted(false)}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="w-full py-3.5 px-4 rounded-full bg-white hover:bg-slate-100 text-[#0B2E57] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#004AA5]" />
              <span>{t('إرسال الطلب عبر الموقع')}</span>
            </button>

            <button
              type="button"
              onClick={handleBookViaWhatsApp}
              className={`w-full py-3.5 px-4 rounded-full text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer ${
                transferSubmitted
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:from-[#20ba5a] hover:to-[#0f7a6e]'
              }`}
            >
              {transferSubmitted ? (
                <Check className="w-4 h-4 animate-success-pop" />
              ) : (
                <WhatsAppLogo className="w-4 h-4" />
              )}
              <span>{transferSubmitted ? t('إعادة فتح واتساب') : t('إرسال عبر واتساب')}</span>
              {!transferSubmitted && (isRtl ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />)}
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-300 font-medium">
            {t('اختر إرسال الطلب مباشرة عبر الموقع أو التأكيد الفوري عبر واتساب')}
          </p>
        </div>
      </div>

      <ServiceContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        serviceTag="TRANSFER"
        serviceTitle={`توصيل مطار VIP: ${selectedAirportObj.code} ➔ ${resolvedDestinationLabel}`}
        serviceSummary={`المسار: ${formatAirportLabel(selectedAirportObj, language)} ➔ ${resolvedDestinationLabel}\nالسيارة: ${getVehicleName(selectedVehicle)}\nالمسافة التقديرية: ${selectedZone.isCustom || !isIstanbulAirport ? 'حسب العنوان' : `~${estimatedDistance} كم`}\nالوقت المتوقع: ${selectedZone.isCustom || !isIstanbulAirport ? 'مباشر' : `~${estimatedTime} دقيقة`}\nالحمولة: ${passengerCount} مسافرين · ${luggageCount} حقائب`}
        payloadJson={{
          airportCode: selectedAirportObj.code,
          airportName: selectedAirportObj.nameAr,
          destination: resolvedDestinationLabel,
          vehicleId: selectedVehicle.id,
          vehicleName: selectedVehicle.nameAr,
          passengerCount,
          luggageCount,
          tripType,
          estimatedDistance,
          estimatedTime,
        }}
        onSuccess={() => {
          setTransferSubmitted(true);
          setShowContactModal(false);
        }}
      />
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <section
      id="airport-transfer"
      aria-labelledby="airport-transfer-heading"
      className="py-24 sm:py-32 bg-[#FFFFFF] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm sm:text-base font-semibold text-[#5E7086]">
            <span className="text-[#CC9048] font-bold">VIP Airport Transfer</span>
            <span aria-hidden="true">·</span>
            <span>{t('إسطنبول (IST) وصبيحة (SAW)')}</span>
          </div>
          <h2 id="airport-transfer-heading" className="tracking-tight">
            {language === 'tr' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Havalimanı VIP Transfer</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">
                  Rotanızı Hesaplayın ve Aracınızı İsteyin
                </span>
              </>
            ) : language === 'en' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Istanbul VIP Airport Transfer</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">
                  Calculate Your Route & Request Your Car
                </span>
              </>
            ) : language === 'fr' ? (
              <>
                <span className="block font-black text-[#0B2E57]">Transfert VIP Aéroport</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">
                  Calculez votre trajet et réservez
                </span>
              </>
            ) : (
              <>
                <span className="block font-black text-[#0B2E57]">توصيل مطارات إسطنبول VIP</span>
                <span className="block font-extralight font-bahij-bold text-[#CC9048] mt-1">
                  احسب مسار رحلتك واطلب سيارتك فوراً
                </span>
              </>
            )}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-[#5E7086] font-normal leading-snug">
            {t('أداة تفاعلية لاختيار مطار إسطنبول ووجهتك وحساب المسافة ووقت الرحلة المتوقع بدقة.')}
          </p>
        </div>
        {content}
      </div>
    </section>
  );
};
