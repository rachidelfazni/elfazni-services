import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  Plane,
  Building2,
  Car,
  Languages,
  ShieldCheck,
  HelpCircle,
  FileText,
  User,
  MapPin,
  Edit2,
  Phone,
  Mail,
  Send,
  Loader2,
  Copy,
  CheckCircle2,
  Lock,
  Info,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { SITE_CONTACT } from '../data/content';
import { WhatsAppLogo } from './WhatsAppLogo';
import { AnimatedSuccessBadge } from './SuccessFeedback';
import { api, ServiceTag } from '../services/api';
import { tracker } from '../services/tracker';

interface StartRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialServiceId?: string;
}

interface ServiceOption {
  id: string;
  titleAr: string;
  titleEn: string;
  titleTr: string;
  titleFr: string;
  descAr: string;
  descEn: string;
  descTr: string;
  descFr: string;
  icon: React.ReactNode;
  category: string;
}

const COUNTRY_CALLING_CODES = [
  { code: '+90', label: 'تركيا (+90)', flag: '🇹🇷' },
  { code: '+212', label: 'المغرب (+212)', flag: '🇲🇦' },
  { code: '+33', label: 'فرنسا (+33)', flag: '🇫🇷' },
  { code: '+49', label: 'ألمانيا (+49)', flag: '🇩🇪' },
  { code: '+971', label: 'الإمارات (+971)', flag: '🇦🇪' },
  { code: '+966', label: 'السعودية (+966)', flag: '🇸🇦' },
  { code: '+34', label: 'إسبانيا (+34)', flag: '🇪🇸' },
  { code: '+44', label: 'بريطانيا (+44)', flag: '🇬🇧' },
  { code: '+1', label: 'أمريكا/كندا (+1)', flag: '🇺🇸' },
  { code: '+974', label: 'قطر (+974)', flag: '🇶🇦' },
  { code: '+965', label: 'الكويت (+965)', flag: '🇰🇼' },
  { code: '+31', label: 'هولندا (+31)', flag: '🇳🇱' },
  { code: '+32', label: 'بلجيكا (+32)', flag: '🇧🇪' },
  { code: '+39', label: 'إيطاليا (+39)', flag: '🇮🇹' },
];

const SERVICES_OPTIONS: ServiceOption[] = [
  {
    id: 'consular',
    titleAr: 'مواعيد القنصلية المغربية',
    titleEn: 'Moroccan Consular Appointments',
    titleTr: 'Fas Konsolosluk Randevusu',
    titleFr: 'Rendez-vous consulaires marocains',
    descAr: 'حجز المواعيد وتجهيز ملفات الجواز، الهوية، أهلية الزواج والتوكيلات',
    descEn: 'Passport, national ID, marriage capacity, and power of attorney',
    descTr: 'Pasaport, kimlik kartı, evlilik ehliyeti ve vekâlet işlemleri',
    descFr: 'Passeport, CNIE, certificat de capacité matrimoniale et procurations',
    icon: <Building2 className="w-5 h-5 text-[#004AA5]" />,
    category: 'قنصلية',
  },
  {
    id: 'flights',
    titleAr: 'حجوزات واستعلام الطيران',
    titleEn: 'Flight Search & Booking',
    titleTr: 'Uçak Bileti Rezervasyonu',
    titleFr: 'Recherche et réservation de vols',
    descAr: 'مقارنة الرحلات والأسعار داخل تركيا وإلى المغرب ومختلف الوجهات',
    descEn: 'Comparing flights and best fares within Turkey, Morocco, and globally',
    descTr: 'Türkiye içi, Fas ve dünya çapında uçuş ve fiyat karşılaştırması',
    descFr: 'Comparaison des vols et tarifs en Turquie, vers le Maroc et le monde',
    icon: <Plane className="w-5 h-5 text-[#004AA5]" />,
    category: 'طيران',
  },
  {
    id: 'airport',
    titleAr: 'استقبال وتوصيل مطار VIP',
    titleEn: 'VIP Airport Transfer',
    titleTr: 'VIP Havalimanı Transferi',
    titleFr: 'Transfert aéroport VIP',
    descAr: 'سيارات VIP خاصة وسائقون محترفون من وإلى مطار إسطنبول وصبيحة',
    descEn: 'Private VIP minivans to/from Istanbul Airport (IST) & Sabiha (SAW)',
    descTr: 'İstanbul ve Sabiha Gökçen havalimanları için konforlu özel araç',
    descFr: 'Véhicules VIP privés vers et depuis les aéroports IST et SAW',
    icon: <Car className="w-5 h-5 text-[#CC9048]" />,
    category: 'نقل',
  },
  {
    id: 'translation',
    titleAr: 'الترجمة المحلفة والمعتمدة',
    titleEn: 'Sworn & Notarized Translation',
    titleTr: 'Yeminli Tercüme ve Noter Onayı',
    titleFr: 'Traduction assermentée et notariée',
    descAr: 'ترجمة رسمية معتمدة لدى النوتر التركي للوثائق والشهادات والعقود',
    descEn: 'Official notarized translations for certificates, contracts, and legal deeds',
    descTr: 'Resmi belgeler, diplomalar ve sözleşmeler için noter onaylı tercüme',
    descFr: 'Traduction officielle notariée pour actes, diplômes et documents juridiques',
    icon: <Languages className="w-5 h-5 text-[#004AA5]" />,
    category: 'ترجمة',
  },
  {
    id: 'residency',
    titleAr: 'تجديد واستشارات الإقامة',
    titleEn: 'Residence Permit Assistance',
    titleTr: 'İkamet İzni Danışmanlığı',
    titleFr: 'Assistance titre de séjour',
    descAr: 'تجهيز أوراق الإقامة السياحية والعائلية في تركيا وتنسيق التأمين الصحي',
    descEn: 'Preparation for Turkish tourist & family residence permits and health insurance',
    descTr: 'Turistik ve aile ikamet izinleri için dosya hazırlığı ve sigorta',
    descFr: 'Préparation du dossier de séjour touristique/familial et assurance',
    icon: <ShieldCheck className="w-5 h-5 text-[#004AA5]" />,
    category: 'إقامات',
  },
  {
    id: 'other',
    titleAr: 'استفسار أو معاملة أخرى',
    titleEn: 'General Inquiry / Other Service',
    titleTr: 'Genel Danışmanlık veya Diğer Hizmet',
    titleFr: 'Autre démarche / Demande générale',
    descAr: 'معاملات الجالية، حجز فنادق، أو أي مساعدة خاصة في تركيا',
    descEn: 'Hotel bookings, community affairs, or custom assistance in Turkey',
    descTr: 'Otel rezervasyonları, topluluk işleri veya özel destek talepleri',
    descFr: 'Réservation d’hôtel, affaires communautaires ou demande spécifique',
    icon: <HelpCircle className="w-5 h-5 text-slate-500" />,
    category: 'أخرى',
  },
];

export const StartRequestModal: React.FC<StartRequestModalProps> = ({
  isOpen,
  onClose,
  initialServiceId = 'consular',
}) => {
  const { language, isRtl, t } = useLanguage();
  const { settings, isServiceVisible, services } = useSiteSettings();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>(initialServiceId);
  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+90');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('إسطنبول');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Consent-based auto-save state (unchecked by default)
  const [consentAutoSave, setConsentAutoSave] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceCode, setReferenceCode] = useState<string>('');
  const [submissionMethod, setSubmissionMethod] = useState<'website' | 'whatsapp'>('website');
  const [copiedRef, setCopiedRef] = useState(false);

  // Stable client-generated draft ID across wizard lifecycle
  const draftIdRef = useRef<string>(crypto.randomUUID());
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync initial service
  useEffect(() => {
    if (initialServiceId) {
      setSelectedServiceId(initialServiceId);
    }
  }, [initialServiceId]);

  // Handle escape key and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      draftIdRef.current = crypto.randomUUID();
    } else {
      document.body.style.overflow = '';
      setCurrentStep(1);
      setErrorMsg('');
      setConsentAutoSave(false);
      setDraftSaved(false);
      setReferenceCode('');
      setFullName('');
      setPhone('');
      setEmail('');
      setCity('إسطنبول');
      setNotes('');
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const options = SERVICES_OPTIONS.filter((option) => option.id === 'other' || isServiceVisible(option.id));
  for (const entry of services) {
    if (options.some((option) => option.id === entry.key)) continue;
    options.push({
      ...SERVICES_OPTIONS[SERVICES_OPTIONS.length - 1],
      id: entry.key,
      titleAr: entry.title,
      titleTr: entry.title,
      titleEn: entry.title,
      titleFr: entry.title,
      descAr: entry.description,
      descTr: entry.description,
      descEn: entry.description,
      descFr: entry.description,
    });
  }

  const selectedService = options.find((s) => s.id === selectedServiceId) || options[0];

  const getServiceTitle = (srv: ServiceOption) => {
    if (language === 'tr') return srv.titleTr;
    if (language === 'en') return srv.titleEn;
    if (language === 'fr') return srv.titleFr;
    return srv.titleAr;
  };

  const getServiceDesc = (srv: ServiceOption) => {
    if (language === 'tr') return srv.descTr;
    if (language === 'en') return srv.descEn;
    if (language === 'fr') return srv.descFr;
    return srv.descAr;
  };

  const getServiceTag = (srvId: string): ServiceTag => {
    const map: Record<string, ServiceTag> = {
      flights: 'FLIGHT',
      airport: 'TRANSFER',
      consular: 'CONSULAR',
      residency: 'CONSULAR',
      translation: 'GENERAL',
      other: 'GENERAL',
    };
    return map[srvId] || 'GENERAL';
  };

  // Automated Consent-Based Auto-Save effect:
  // ONLY fires when user explicitly checked the consent box AND has typed name + (phone or email)
  useEffect(() => {
    if (!consentAutoSave) {
      setDraftSaved(false);
      return;
    }

    const cleanDigits = phone.replace(/\D/g, '');
    const hasValidPhone = cleanDigits.length >= 7;
    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    if (fullName.trim().length < 2 || (!hasValidPhone && !hasValidEmail)) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSavingDraft(true);
        const fullPhone = cleanDigits ? `${countryCode} ${cleanDigits}` : '';
        const res = await api.saveRequestDraft({
          draftId: draftIdRef.current,
          consent: true,
          name: fullName.trim(),
          phone: fullPhone,
          whatsappPhone: fullPhone,
          email: email.trim() || undefined,
          serviceTag: getServiceTag(selectedServiceId),
          serviceRequested: selectedService.titleAr,
          city: city.trim() || 'إسطنبول',
          notes: notes.trim(),
          source: 'معالج طلب الخدمة بالموقع (حفظ تلقائي بموافقة صريحة)',
        });
        if (res.reference) {
          setReferenceCode(res.reference);
        }
        setDraftSaved(true);
      } catch (err) {
        console.warn('Consent-based auto-save notice: draft could not be saved', err);
      } finally {
        setIsSavingDraft(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [consentAutoSave, fullName, phone, countryCode, email, city, notes, selectedServiceId]);

  if (!isOpen) return null;

  const handleNextFromStep1 = () => {
    setErrorMsg('');
    setCurrentStep(2);
  };

  const handleNextFromStep2 = () => {
    setErrorMsg('');
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg(t('يرجى إدخال اسمك الكامل للمتابعة'));
      return;
    }

    const cleanDigits = phone.replace(/\D/g, '');
    const hasPhone = cleanDigits.length > 0;
    const hasEmail = email.trim().length > 0;

    if (!hasPhone && !hasEmail) {
      setErrorMsg(t('يرجى إدخال رقم الهاتف أو البريد الإلكتروني للتواصل'));
      return;
    }

    if (hasPhone && cleanDigits.length < 7) {
      setErrorMsg(t('يرجى التأكد من كتابة رقم هاتف صالح (7 أرقام على الأقل)'));
      return;
    }

    if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg(t('يرجى إدخال عنوان بريد إلكتروني صالح'));
      return;
    }

    setCurrentStep(3);
  };

  const cleanDigits = phone.replace(/\D/g, '');
  const fullPhone = cleanDigits ? `${countryCode} ${cleanDigits}` : '';

  // METHOD B: Direct Website Submission
  const handleWebsiteSubmit = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const visitorId = tracker.getVisitorId();
      const { device, browser } = tracker.detectDevice();
      const { country, flag } = tracker.detectGeoLocation();

      const res = await api.submitServiceRequest({
        draftId: draftIdRef.current,
        name: fullName.trim(),
        phone: fullPhone || 'عبر البريد',
        whatsappPhone: fullPhone || undefined,
        email: email.trim() || undefined,
        serviceTag: getServiceTag(selectedServiceId),
        serviceRequested: selectedService.titleAr,
        subject: `طلب خدمة: ${selectedService.titleAr} (${selectedService.titleEn})`,
        message: `المدينة: ${city.trim() || 'إسطنبول'}\n${notes.trim() || 'طلب موعد ومتابعة عبر المعالج السريع'}`,
        country: `${country} ${flag}`,
        source: `معالج الموقع (${device})`,
        payloadJson: {
          submissionChannel: 'website_form',
          serviceName: selectedService.titleAr,
          serviceCategory: selectedService.category,
          city: city.trim() || 'إسطنبول',
          notes: notes.trim(),
          browser,
          visitorId,
        },
      });

      setReferenceCode(res.reference || res.ticketNumber);
      setSubmissionMethod('website');
      setCurrentStep(4);
    } catch (err: any) {
      console.error('Failed to submit request via website:', err);
      setErrorMsg(err.message || t('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مجدداً أو استخدام واتساب'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // METHOD A: WhatsApp Handoff
  const handleSendToWhatsApp = async () => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const waRef = referenceCode || `REQ-${draftIdRef.current.slice(0, 6).toUpperCase()}`;

      const lines = [
        '👋 *مرحباً ELFAZNI SERVICES*',
        `أود متابعة طلبي برقم مرجع: *${waRef}*`,
        '--------------------------------',
        `📌 *نوع الخدمة:* ${selectedService.titleAr} (${selectedService.titleEn})`,
        `👤 *الاسم:* ${fullName.trim()}`,
        fullPhone ? `📱 *رقم الهاتف:* ${fullPhone}` : null,
        email.trim() ? `✉️ *البريد:* ${email.trim()}` : null,
        `📍 *المدينة في تركيا:* ${city.trim() || 'إسطنبول'}`,
        notes.trim() ? `📝 *تفاصيل الطلب:* ${notes.trim()}` : null,
        '--------------------------------',
        'يرجى إفادتي بالخطوات والمواعيد والتكلفة المتاحة. شكراً لكم!',
      ]
        .filter(Boolean)
        .join('\n');

      // Record inquiry handoff without claiming message was sent
      api.submitServiceRequest({
        draftId: draftIdRef.current,
        name: fullName.trim(),
        phone: fullPhone || 'عبر واتساب',
        whatsappPhone: fullPhone || undefined,
        email: email.trim() || undefined,
        serviceTag: getServiceTag(selectedServiceId),
        serviceRequested: selectedService.titleAr,
        subject: `متابعة واتساب: ${selectedService.titleAr}`,
        message: `المدينة: ${city.trim() || 'إسطنبول'}\n${notes.trim() || 'طلب تواصل ومتابعة عبر واتساب'}`,
        source: 'معالج الموقع (تحويل واتساب)',
        payloadJson: {
          submissionChannel: 'whatsapp_handoff',
          serviceName: selectedService.titleAr,
          city: city.trim() || 'إسطنبول',
          notes: notes.trim(),
        },
      }).catch(() => {});

      const waRaw = settings.whatsappRaw || SITE_CONTACT.whatsappRaw;
      const url = `https://wa.me/${waRaw}?text=${encodeURIComponent(lines)}`;
      window.open(url, '_blank', 'noopener,noreferrer');

      setReferenceCode(waRef);
      setSubmissionMethod('whatsapp');
      setCurrentStep(4);
    } catch (err: any) {
      console.error('Failed to open WhatsApp handoff:', err);
      setErrorMsg(t('تعذر تجهيز رسالة واتساب، يرجى المحاولة ثانية'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRefToClipboard = () => {
    if (!referenceCode) return;
    navigator.clipboard.writeText(referenceCode);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#011a3b]/60 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="start-request-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-[0_24px_64px_rgba(18,85,154,0.18)] border border-black/[0.08] overflow-hidden my-auto transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple-style minimalist header */}
        <div className="p-6 sm:p-7 border-b border-black/[0.06] bg-slate-50/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>{t('معالج طلب الخدمة')}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#004AA5]">
                {language === 'ar' ? `الخطوة ${currentStep} من 4` : `Step ${currentStep} of 4`}
              </span>
            </div>
            <h2 id="start-request-title" className="text-xl sm:text-2xl font-black text-[#0B2E57] tracking-tight">
              {currentStep === 1 && t('اختر الخدمة المطلوبة')}
              {currentStep === 2 && t('معلومات التواصل والمتابعة')}
              {currentStep === 3 && t('مراجعة وتأكيد الطلب')}
              {currentStep === 4 && (submissionMethod === 'website' ? t('تم استلام طلبكم بنجاح') : t('تم تجهيز رسالة واتساب'))}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
            aria-label={t('إغلاق')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="grid grid-cols-4 h-1 bg-slate-100">
          <div className={`h-full transition-all duration-300 ${currentStep >= 1 ? 'bg-[#004AA5]' : 'bg-transparent'}`} />
          <div className={`h-full transition-all duration-300 ${currentStep >= 2 ? 'bg-[#004AA5]' : 'bg-transparent'}`} />
          <div className={`h-full transition-all duration-300 ${currentStep >= 3 ? 'bg-[#004AA5]' : 'bg-transparent'}`} />
          <div className={`h-full transition-all duration-300 ${currentStep >= 4 ? 'bg-emerald-500' : 'bg-transparent'}`} />
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Choose Service */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {t('حدد الخدمة التي ترغب في طلبها أو الاستفسار عنها لبدء الإجراءات فوراً:')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {options.map((srv) => {
                  const isSelected = selectedService.id === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedServiceId(srv.id)}
                      className={`text-start p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#004AA5] bg-blue-50/50 ring-1 ring-[#004AA5]'
                          : 'border-black/[0.06] hover:border-black/[0.16] bg-white hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-white border border-black/[0.06] flex items-center justify-center shadow-2xs">
                          {srv.icon}
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#004AA5] text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#0B2E57] mb-1 leading-snug">
                          {getServiceTitle(srv)}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {getServiceDesc(srv)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#004AA5] hover:bg-[#0B2E57] text-white font-bold text-sm shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t('المتابعة')}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Contact Information & Consent-Based Auto-Save */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0">
                  {selectedService.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {t('الخدمة المختارة')}
                  </span>
                  <span className="text-xs font-bold text-[#0B2E57] truncate block">
                    {getServiceTitle(selectedService)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-[#004AA5] font-bold hover:underline shrink-0"
                >
                  {t('تغيير')}
                </button>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('الاسم الكامل')} *</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: رشيد الفزني' : 'e.g. Rachid Elfazni'}
                  className="w-full px-4 py-3 rounded-2xl border border-black/[0.1] focus:border-[#004AA5] focus:ring-2 focus:ring-[#004AA5]/10 text-sm font-semibold outline-none transition-all"
                  autoFocus
                />
              </div>

              {/* International Phone with Country Code Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('رقم الهاتف المرتبط بواتساب')}</span>
                </label>
                <div className="flex gap-2" dir="ltr">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-36 px-2.5 py-3 rounded-2xl border border-black/[0.1] bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-[#004AA5] cursor-pointer"
                  >
                    {COUNTRY_CALLING_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="552 267 7851"
                    className="flex-1 px-4 py-3 rounded-2xl border border-black/[0.1] focus:border-[#004AA5] focus:ring-2 focus:ring-[#004AA5]/10 text-sm font-semibold outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('البريد الإلكتروني')}</span>
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-2xl border border-black/[0.1] focus:border-[#004AA5] focus:ring-2 focus:ring-[#004AA5]/10 text-sm font-semibold outline-none transition-all text-start"
                />
              </div>

              {/* City / Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('المدينة الحالية أو المطار في تركيا')}</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="إسطنبول (الفاتح، باشاك شهير، كاديكوي...) أو مطار IST/SAW"
                  className="w-full px-4 py-3 rounded-2xl border border-black/[0.1] focus:border-[#004AA5] focus:ring-2 focus:ring-[#004AA5]/10 text-sm font-semibold outline-none transition-all"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('تفاصيل الطلب أو التواريخ المفضلة (اختياري)')}</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('اكتب أي تفاصيل إضافية: تاريخ السفر، نوع الوثيقة، عدد الأفراد...')}
                  className="w-full px-4 py-2.5 rounded-2xl border border-black/[0.1] focus:border-[#004AA5] focus:ring-2 focus:ring-[#004AA5]/10 text-sm font-medium outline-none transition-all resize-none"
                />
              </div>

              {/* TRANSPARENT, CONSENT-BASED AUTOSAVE BOX */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                  <Info className="w-4 h-4 text-[#004AA5] shrink-0 mt-0.5" />
                  <span>
                    {t('يمكننا حفظ معلومات التواصل التي أدخلتها لمتابعة استفسارك، حتى إذا غادرت الصفحة قبل إرسال الطلب.')}
                  </span>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={consentAutoSave}
                    onChange={(e) => setConsentAutoSave(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#004AA5] rounded border-slate-300 focus:ring-[#004AA5] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 leading-snug">
                    {t('أوافق على حفظ بيانات التواصل الخاصة بي لغرض متابعة هذا الاستفسار.')}
                  </span>
                </label>

                {consentAutoSave && (
                  <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5 pt-1">
                    {isSavingDraft ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                        <span>{t('جارٍ حفظ مسودة التواصل بأمان...')}</span>
                      </>
                    ) : draftSaved ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t('تم حفظ بيانات التواصل لمتابعة استفسارك في حال غادرت الصفحة')}</span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 rounded-full text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
                >
                  {t('رجوع')}
                </button>

                <button
                  type="button"
                  onClick={handleNextFromStep2}
                  className="px-7 py-3 rounded-full bg-[#004AA5] hover:bg-[#0B2E57] text-white font-bold text-sm shadow-xs active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>{t('مراجعة الطلب')}</span>
                  {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review and DUAL ACTIONS (Equal prominence) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {t('راجع تفاصيل طلبك واختر طريقة المتابعة الأنسب لك:')}
              </p>

              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-black/[0.06] space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-black/[0.04]">
                  <span className="text-slate-400 font-semibold">{t('الخدمة:')}</span>
                  <span className="font-bold text-[#0B2E57] text-sm">{getServiceTitle(selectedService)}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-black/[0.04]">
                  <span className="text-slate-400 font-semibold">{t('الاسم:')}</span>
                  <span className="font-bold text-slate-800">{fullName}</span>
                </div>

                {fullPhone && (
                  <div className="flex items-center justify-between py-1 border-b border-black/[0.04]">
                    <span className="text-slate-400 font-semibold">{t('الهاتف / واتساب:')}</span>
                    <span className="font-bold text-slate-800 font-mono" dir="ltr">{fullPhone}</span>
                  </div>
                )}

                {email && (
                  <div className="flex items-center justify-between py-1 border-b border-black/[0.04]">
                    <span className="text-slate-400 font-semibold">{t('البريد الإلكتروني:')}</span>
                    <span className="font-bold text-slate-800 font-mono" dir="ltr">{email}</span>
                  </div>
                )}

                <div className="flex items-center justify-between py-1 border-b border-black/[0.04]">
                  <span className="text-slate-400 font-semibold">{t('الموقع / المدينة:')}</span>
                  <span className="font-bold text-slate-800">{city || 'إسطنبول'}</span>
                </div>

                {notes && (
                  <div className="py-1">
                    <span className="text-slate-400 font-semibold block mb-1">{t('ملاحظات:')}</span>
                    <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-black/[0.04] leading-relaxed">
                      {notes}
                    </p>
                  </div>
                )}
              </div>

              {/* DUAL ACTION BUTTONS (Method B + Method A with equal visual weight) */}
              <div className="pt-2 space-y-3">
                <div className="text-xs font-bold text-slate-700 text-center mb-1">
                  {t('اختر وسيلة تأكيد الطلب:')}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Button 1: Website Submission */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleWebsiteSubmit}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-[#004AA5] hover:bg-[#0B2E57] text-white font-bold text-sm shadow-sm hover:shadow active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-[#E3C88F] rotate-180" />
                    )}
                    <span>{t('إرسال الطلب عبر الموقع')}</span>
                  </button>

                  {/* Button 2: WhatsApp Handoff */}
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleSendToWhatsApp}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm hover:shadow active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <WhatsAppLogo className="w-4 h-4" />
                    <span>{t('المتابعة عبر واتساب')}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-start">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{t('تعديل البيانات')}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Success / Confirmation */}
          {currentStep === 4 && (
            <div className="text-center py-5 space-y-4 animate-success-slide-up" role="status" aria-live="polite">
              <div className="flex justify-center pb-1">
                <AnimatedSuccessBadge size="lg" />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#004AA5] text-xs font-bold">
                  <span>{getServiceTitle(selectedService)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{city || 'إسطنبول'}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-[#0B2E57]">
                  {submissionMethod === 'website'
                    ? t('تم استلام طلبكم بنجاح!')
                    : t('تم تجهيز طلبكم للمتابعة عبر واتساب')}
                </h3>
              </div>

              {/* Reference Code Card */}
              {referenceCode && (
                <div className="max-w-xs mx-auto p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('رقم مرجع الطلب الخاص بك')}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono font-black text-lg text-[#0B2E57]" dir="ltr">
                      {referenceCode}
                    </span>
                    <button
                      type="button"
                      onClick={copyRefToClipboard}
                      className="p-1 text-slate-400 hover:text-[#004AA5] rounded transition-colors cursor-pointer"
                      title={t('نسخ رقم المرجع')}
                    >
                      {copiedRef ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                {submissionMethod === 'website'
                  ? t('تم تسجيل طلبكم في نظامنا وسيقوم فريق العمل بالتواصل معكم عبر الهاتف أو البريد الإلكتروني لتأكيد المواعيد والخطوات.')
                  : t('إذا فُتح تطبيق واتساب، يرجى الضغط على زر الإرسال لتصلنا رسالتك. يمكنك أيضاً الضغط على الزر أدناه لإعادة فتح المحادثة.')}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                {submissionMethod === 'whatsapp' && (
                  <button
                    type="button"
                    onClick={handleSendToWhatsApp}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <WhatsAppLogo className="w-4 h-4" />
                    <span>{t('إعادة فتح واتساب')}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    setReferenceCode('');
                    draftIdRef.current = crypto.randomUUID();
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-full bg-blue-50 hover:bg-blue-100 text-[#004AA5] font-bold text-sm transition-colors cursor-pointer"
                >
                  {t('طلب خدمة أخرى')}
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
    </div>
  );
};
