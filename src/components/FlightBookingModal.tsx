import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plane,
  Calendar,
  Users,
  ArrowLeftRight,
  Car,
  Briefcase,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { SITE_CONTACT, AIRLINES_LIST } from '../data/content';
import { WhatsAppLogo } from './WhatsAppLogo';
import { AirportAutocompleteInput } from './AirportAutocompleteInput';
import { AnimatedSuccessBadge } from './SuccessFeedback';
import { api } from '../services/api';
import { tracker } from '../services/tracker';
import { ServiceContactModal } from './common/ServiceContactModal';

interface FlightBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FlightBookingModal: React.FC<FlightBookingModalProps> = ({ isOpen, onClose }) => {
  const { t, isRtl, language } = useLanguage();
  const { settings } = useSiteSettings();

  const [tripType, setTripType] = useState<'round' | 'oneway'>('round');
  const [fromCity, setFromCity] = useState('إسطنبول (IST / SAW)');
  const [toCity, setToCity] = useState('الدار البيضاء (CMN)');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [cabinClass, setCabinClass] = useState<'economy' | 'business'>('economy');
  const [flexibleDates, setFlexibleDates] = useState(false);
  const [preferredAirline, setPreferredAirline] = useState('أي شركة متاحة');
  const [hasCheckedBaggage, setHasCheckedBaggage] = useState(true);
  const [needTransfer, setNeedTransfer] = useState(false);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      setShowReview(false);
      setIsSubmitted(false);
      setErrorMsg('');
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSwapAirports = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  const handleValidate = () => {
    if (!fromCity.trim() || !toCity.trim()) {
      setErrorMsg(t('يرجى تحديد وجهة المغادرة والوصول'));
      return;
    }
    if (!departDate) {
      setErrorMsg(t('يرجى تحديد تاريخ الذهاب'));
      return;
    }
    if (tripType === 'round' && !returnDate) {
      setErrorMsg(t('يرجى تحديد تاريخ العودة أو اختيار رحلة ذهاب فقط'));
      return;
    }
    setErrorMsg('');
    setShowReview(true);
  };

  const handleSendWhatsApp = async () => {
    const typeLabel = tripType === 'round' ? 'ذهاب وعودة (Gidiş-Dönüş)' : 'ذهاب فقط (Tek Yön)';
    const passengersText = `${adults} بالغين${children > 0 ? `، ${children} أطفال` : ''}${
      infants > 0 ? `، ${infants} رضّع` : ''
    }`;
    const cabinLabel = cabinClass === 'business' ? 'درجة رجال الأعمال (Business)' : 'الدرجة السياحية (Economy)';

    const messageLines = [
      '✈️ *طلب استعلام ومقارنة طيران - ELFAZNI SERVICES*',
      '--------------------------------',
      `• *نوع الرحلة:* ${typeLabel}`,
      `• *من:* ${fromCity}`,
      `• *إلى:* ${toCity}`,
      `• *تاريخ الذهاب:* ${departDate}`,
      tripType === 'round' ? `• *تاريخ العودة:* ${returnDate}` : null,
      flexibleDates ? '• *مرونة التواريخ:* نعم (+/- يوم أو يومين)' : null,
      `• *المسافرون:* ${passengersText}`,
      `• *الدرجة:* ${cabinLabel}`,
      `• *الأمتعة المسجلة (شحن):* ${hasCheckedBaggage ? 'نعم مطلوب وزن' : 'حقيبة يد فقط'}`,
      preferredAirline !== 'أي شركة متاحة' ? `• *الخطوط المفضلة:* ${preferredAirline}` : null,
      needTransfer ? '• *توصيل مطار VIP:* نعم أود حجز سيارة خاصة' : null,
      notes.trim() ? `• *ملاحظات:* ${notes.trim()}` : null,
      '--------------------------------',
      'أرجو موافاتي بالخيارات والأسعار المتاحة. شكراً لكم!',
    ]
      .filter(Boolean)
      .join('\n');

    const visitorId = tracker.getVisitorId();
    const { device, browser, screenW, maxTouchPoints } = tracker.detectDevice();
    const { country, flag, city } = tracker.detectGeoLocation();

    await api.submitMailboxMessage({
      name: `مسافر (${fromCity} ⬅ ${toCity})`,
      phone: 'عبر واتساب',
      serviceRequested: 'حجز واستعلام طيران',
      subject: `رحلة طيران: ${fromCity} إلى ${toCity} (${departDate})`,
      message: messageLines,
      country: `${country} ${flag}`,
      flag,
      city,
      device,
      browser,
      visitorId,
      screenW,
      maxTouchPoints,
      source: 'نموذج حجز الطيران',
    }).catch(() => {});

    const waRaw = settings.whatsappRaw || SITE_CONTACT.whatsappRaw;
    const url = `https://wa.me/${waRaw}?text=${encodeURIComponent(messageLines)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsSubmitted(true);
  };

  const quickCities = [
    'إسطنبول (IST / SAW)',
    'الدار البيضاء (CMN)',
    'مراكش (RAK)',
    'طنجة (TNG)',
    'الرباط (RBA)',
    'فاس (FEZ)',
    'أنطاليا (AYT)',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#011a3b]/60 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="flight-modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-[0_24px_64px_rgba(18,85,154,0.18)] border border-black/[0.08] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with signature brand gradient */}
        <div className="relative bg-gradient-to-r from-[#0B2E57] via-[#004AA5] to-[#2A83D5] text-white p-6 sm:p-7">
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} !w-10 !h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all cursor-pointer z-10`}
            aria-label={t('إغلاق')}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <span className="!w-10 !h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Plane className="w-5 h-5 text-[#E3C88F]" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
              {t('خدمة السفر والطيران')}
            </span>
          </div>
          <h2 id="flight-modal-title" className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('جهّز طلب رحلتك')}
          </h2>
          <p className="text-sm text-blue-100/90 mt-1 max-w-md">
            {t('أرسل مطار المغادرة والوجهة وتاريخ السفر وعدد المسافرين، وسنجهّز طلبك للبحث والمقارنة بين الخيارات المتاحة.')}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-7 max-h-[78vh] overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {!showReview ? (
            <>
              {/* Trip Type Segmented Control */}
              <div className="flex p-1 bg-slate-100 rounded-2xl max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => setTripType('round')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tripType === 'round'
                      ? 'bg-white text-[#0B2E57] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('ذهاب وعودة')}
                </button>
                <button
                  type="button"
                  onClick={() => setTripType('oneway')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    tripType === 'oneway'
                      ? 'bg-white text-[#0B2E57] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('ذهاب فقط')}
                </button>
              </div>

              {/* Origin and Destination with Swap & Searchable Autocomplete */}
              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                <AirportAutocompleteInput
                  label={t('من (مطار / مدينة المغادرة)')}
                  value={fromCity}
                  onChange={setFromCity}
                  placeholder={t('إسطنبول، الدار البيضاء، مراكش...')}
                  compactBox={true}
                />

                {/* Swap button between inputs */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <button
                    type="button"
                    onClick={handleSwapAirports}
                    className="!w-9 !h-9 rounded-full bg-white border border-slate-300 shadow-sm hover:shadow-md text-slate-700 hover:text-[#0B2E57] flex items-center justify-center transition-all cursor-pointer hover:rotate-180 duration-300 shrink-0"
                    title={t('تبديل الوجهات')}
                    aria-label={t('تبديل الوجهات')}
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <AirportAutocompleteInput
                  label={t('إلى (مطار / مدينة الوصول)')}
                  value={toCity}
                  onChange={setToCity}
                  placeholder={t('الدار البيضاء، إسطنبول، طنجة...')}
                  compactBox={true}
                />
              </div>

              {/* Quick airport tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-slate-400 font-semibold">{t('اقتراحات سريعة')}:</span>
                {quickCities.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      if (!fromCity) setFromCity(c);
                      else setToCity(c);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('تاريخ المغادرة')} *</span>
                  </label>
                  <input
                    type="date"
                    value={departDate}
                    onChange={(e) => setDepartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-black/[0.1] focus:border-[#0B2E57] focus:ring-2 focus:ring-[#0B2E57]/10 text-sm font-semibold outline-none transition-all cursor-pointer"
                  />
                </div>

                {tripType === 'round' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('تاريخ العودة')} *</span>
                    </label>
                    <input
                      type="date"
                      value={returnDate}
                      min={departDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-black/[0.1] focus:border-[#0B2E57] focus:ring-2 focus:ring-[#0B2E57]/10 text-sm font-semibold outline-none transition-all cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Passengers Stepper */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-black/[0.06] space-y-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {t('المسافرون')}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Adults */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-black/[0.04]">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{t('بالغون')}</span>
                      <span className="text-[10px] text-slate-400">(+12 سنة)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm min-w-5 text-center">{adults}</span>
                      <button
                        type="button"
                        onClick={() => setAdults((prev) => prev + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-black/[0.04]">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{t('أطفال')}</span>
                      <span className="text-[10px] text-slate-400">(2-11 سنة)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setChildren((prev) => Math.max(0, prev - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm min-w-5 text-center">{children}</span>
                      <button
                        type="button"
                        onClick={() => setChildren((prev) => prev + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Infants */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-black/[0.04]">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{t('رضّع')}</span>
                      <span className="text-[10px] text-slate-400">(تحت سنتين)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInfants((prev) => Math.max(0, prev - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-bold text-sm min-w-5 text-center">{infants}</span>
                      <button
                        type="button"
                        onClick={() => setInfants((prev) => prev + 1)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Class & Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('درجة السفر')}
                  </label>
                  <select
                    value={cabinClass}
                    onChange={(e) => setCabinClass(e.target.value as any)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.1] bg-white text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="economy">{t('الدرجة السياحية (Economy)')}</option>
                    <option value="business">{t('درجة رجال الأعمال (Business)')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t('الخطوط المفضلة (اختياري)')}
                  </label>
                  <select
                    value={preferredAirline}
                    onChange={(e) => setPreferredAirline(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.1] bg-white text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="أي شركة متاحة">{t('أي شركة طيران متاحة (المقارنة الرحلاتاً)')}</option>
                    {AIRLINES_LIST.map((a) => (
                      <option key={a.name} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Checkbox options */}
              <div className="space-y-2 pt-1 text-xs font-semibold text-slate-700">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flexibleDates}
                    onChange={(e) => setFlexibleDates(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0B2E57] focus:ring-0 cursor-pointer"
                  />
                  <span>{t('تواريخ سفري مرنة (أرغب في مقارنة الأيام المجاورة للأرخص)')}</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasCheckedBaggage}
                    onChange={(e) => setHasCheckedBaggage(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0B2E57] focus:ring-0 cursor-pointer"
                  />
                  <span>{t('تضمين وزن حقائب الشحن المسجلة (Checked Baggage)')}</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={needTransfer}
                    onChange={(e) => setNeedTransfer(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0B2E57] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[#004AA5]">{t('أحتاج خدمة توصيل واستقبال مطار VIP في إسطنبول')}</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleValidate}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#0B2E57] hover:bg-[#004AA5] text-white font-bold text-sm shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t('مراجعة الطلب والمتابعة')}</span>
                </button>
              </div>
            </>
          ) : !isSubmitted ? (
            /* Review Step */
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 rounded-2xl bg-slate-50 border border-black/[0.06] space-y-3 text-xs">
                <h3 className="font-bold text-[#0B2E57] text-sm pb-2 border-b border-black/[0.04]">
                  {t('ملخص طلب الرحلة')}
                </h3>

                <div className="flex justify-between py-1 border-b border-black/[0.04]">
                  <span className="text-slate-400 font-semibold">{t('نوع الرحلة:')}</span>
                  <span className="font-bold text-slate-800">
                    {tripType === 'round' ? t('ذهاب وعودة') : t('ذهاب فقط')}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-black/[0.04]">
                  <span className="text-slate-400 font-semibold">{t('المسار:')}</span>
                  <span className="font-bold text-[#0B2E57]">
                    {fromCity} ➔ {toCity}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-black/[0.04]">
                  <span className="text-slate-400 font-semibold">{t('التواريخ:')}</span>
                  <span className="font-bold text-slate-800">
                    {departDate} {tripType === 'round' && `· العودة: ${returnDate}`}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-black/[0.04]">
                  <span className="text-slate-400 font-semibold">{t('المسافرون:')}</span>
                  <span className="font-bold text-slate-800">
                    {adults} بالغين {children > 0 && `، ${children} أطفال`} {infants > 0 && `، ${infants} رضّع`}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-black/[0.04]">
                  <span className="text-slate-400 font-semibold">{t('الأمتعة والدرجة:')}</span>
                  <span className="font-bold text-slate-800">
                    {cabinClass === 'business' ? 'Business' : 'Economy'} ·{' '}
                    {hasCheckedBaggage ? 'حقائب شحن مدرجة' : 'حقيبة يد'}
                  </span>
                </div>

                {needTransfer && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400 font-semibold">{t('توصيل المطار:')}</span>
                    <span className="font-bold text-emerald-600">VIP Transfer مطلوب</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
                {t('اختر طريقة المتابعة المفضلة لديك: إرسال الطلب وتوثيقه في الموقع أو المتابعة المباشرة عبر واتساب.')}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowReview(false)}
                  className="px-5 py-2.5 rounded-full text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer w-full sm:w-auto text-center"
                >
                  {t('تعديل')}
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setShowContactModal(true)}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-gradient-to-r from-[#0B2E57] to-[#004AA5] hover:from-[#004AA5] hover:to-[#2A83D5] text-white font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{t('إرسال الطلب عبر الموقع')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <WhatsAppLogo className="w-5 h-5" />
                    <span>{t('إرسال عبر واتساب')}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4 animate-success-slide-up" role="status" aria-live="polite">
              <div className="flex justify-center pb-1">
                <AnimatedSuccessBadge size="lg" />
              </div>

              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                  <span>{fromCity}</span>
                  <span aria-hidden="true">➔</span>
                  <span>{toCity}</span>
                </span>
                <h3 className="text-xl font-black text-[#0B2E57]">
                  {t('تم إرسال طلب رحلتك بنجاح!')}
                </h3>
              </div>

              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                {t('تم تسجيل تفاصيل رحلتك وسيتواصل معك فريقنا لمقارنة أفضل الأسعار المتاحة.')}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#0B2E57] hover:bg-[#004AA5] text-white font-bold text-sm shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <WhatsAppLogo className="w-5 h-5" />
                  <span>{t('متابعة عبر واتساب أيضاً')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setShowReview(false);
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm transition-colors cursor-pointer"
                >
                  {t('تعديل مسار البحث')}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
                >
                  {t('إغلاق')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ServiceContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        serviceTag="FLIGHT"
        serviceTitle={`حجز واستعلام طيران: ${fromCity} ➔ ${toCity}`}
        serviceSummary={`المسار: ${fromCity} ➔ ${toCity}\nنوع الرحلة: ${tripType === 'round' ? 'ذهاب وعودة' : 'ذهاب فقط'}\nتاريخ الذهاب: ${departDate}${tripType === 'round' ? ` · العودة: ${returnDate}` : ''}\nالمسافرون: ${adults} بالغين ${children > 0 ? `، ${children} أطفال` : ''} ${infants > 0 ? `، ${infants} رضّع` : ''}\nالدرجة: ${cabinClass === 'business' ? 'Business' : 'Economy'}\nالأمتعة: ${hasCheckedBaggage ? 'حقائب شحن مدرجة' : 'حقيبة يد فقط'}${needTransfer ? '\nخدمة المطار: VIP Transfer مطلوب' : ''}`}
        payloadJson={{
          fromCity,
          toCity,
          tripType,
          departDate,
          returnDate: tripType === 'round' ? returnDate : undefined,
          adults,
          children,
          infants,
          cabinClass,
          flexibleDates,
          preferredAirline,
          hasCheckedBaggage,
          needTransfer,
          notes,
        }}
        onSuccess={() => {
          setIsSubmitted(true);
          setShowContactModal(false);
        }}
      />
    </div>
  );
};
