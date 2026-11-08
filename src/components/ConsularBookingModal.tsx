import React, { useState, useEffect } from 'react';
import { X, Building2, User, FileText, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { SITE_CONTACT } from '../data/content';
import { WhatsAppLogo } from './WhatsAppLogo';
import { AnimatedSuccessBadge } from './SuccessFeedback';
import { api } from '../services/api';
import { tracker } from '../services/tracker';
import { ServiceContactModal } from './common/ServiceContactModal';

interface ConsularBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultService?: string;
}

interface ConsularGroup {
  num: string;
  title: string;
  titleTr: string;
  titleEn: string;
  options: {
    id: string;
    label: string;
    labelTr: string;
    labelEn: string;
    desc: string;
    descTr: string;
    descEn: string;
  }[];
}

const CONSULAR_GROUPS: ConsularGroup[] = [
  {
    num: '01',
    title: 'الجواز والهوية',
    titleTr: 'Pasaport ve Kimlik',
    titleEn: 'Passport & National ID',
    options: [
      {
        id: 'passport',
        label: 'جواز السفر البيومتري',
        labelTr: 'Biyometrik Fas Pasaportu',
        labelEn: 'Biometric Passport',
        desc: 'صورة البطاقة الوطنية + الإقامة التركية + صورة النفوس (Yerleşim Belgesi)',
        descTr: 'Kimlik fotokopisi + Türk İkameti + Yerleşim Belgesi',
        descEn: 'Copy of National ID + Turkish Residence Permit + Yerleşim Belgesi',
      },
      {
        id: 'cnie',
        label: 'البطاقة الوطنية الإلكترونية CNIE',
        labelTr: 'Elektronik Kimlik Kartı (CNIE)',
        labelEn: 'Electronic National ID (CNIE)',
        desc: 'إصدار أول مرة أو تجديد أو تحديث البيانات',
        descTr: 'İlk kez çıkarma, yenileme veya bilgi güncelleme',
        descEn: 'First issue, renewal or info update',
      },
      {
        id: 'cert_cnie',
        label: 'شهادة إدارية لإنجاز البطاقة',
        labelTr: 'Kimlik İçin İdari Belge',
        labelEn: 'Administrative Certificate for ID',
        desc: 'لمن لا يتوفر على وثائق مغربية كافية',
        descTr: 'Yeterli Fas belgesi bulunmayanlar için',
        descEn: 'For applicants with missing primary documents',
      },
      {
        id: 'lost_doc',
        label: 'تصريح بضياع الوثائق',
        labelTr: 'Kayıp Belge Beyanı',
        labelEn: 'Declaration of Lost Documents',
        desc: 'تصريح ضياع الجواز أو البطاقة الوطنية',
        descTr: 'Pasaport veya kimlik kaybı beyanı',
        descEn: 'Declaration of lost passport or ID card',
      },
    ],
  },
  {
    num: '02',
    title: 'الحالة المدنية والأسرة',
    titleTr: 'Nüfus ve Aile İşlemleri',
    titleEn: 'Civil Status & Family',
    options: [
      {
        id: 'marriage_eligibility',
        label: 'شهادة أهلية الزواج',
        labelTr: 'Evlenme Ehliyet Belgesi',
        labelEn: 'Marriage Eligibility Certificate',
        desc: 'جمع وتقديم ملف الأهلية (وثائق الطرف المغربي بأبوستيل مغربي + أوراق الزوج بأبوستيل تركي)',
        descTr: 'Fas Apostilli başvuru belgeleri + Türk Apostilli eş belgeleri ile başvuru',
        descEn: 'Moroccan applicant docs (Moroccan Apostille) + Spouse docs (Turkish Apostille)',
      },
      {
        id: 'birth_registration',
        label: 'تسجيل المواليد',
        labelTr: 'Doğum Kaydı',
        labelEn: 'Birth Registration',
        desc: 'تسجيل الولادة وإضافتها إلى السجلات والحالة المدنية',
        descTr: 'Doğumun Fas nüfus kütüğüne tescili',
        descEn: 'Registering newborns into Moroccan civil registry',
      },
      {
        id: 'full_copy',
        label: 'نسخة كاملة أو شهادة ميلاد',
        labelTr: 'Tam Vukuatlı Doğum Kaydı',
        labelEn: 'Full Birth Certificate Copy',
        desc: 'لوثائق الجنسية أو المعاملات الإدارية والقانونية',
        descTr: 'Vatandaşlık veya idari işlemler için',
        descEn: 'For nationality files or administrative legal affairs',
      },
      {
        id: 'civil_event',
        label: 'تسجيل واقعة مدنية',
        labelTr: 'Medeni Durum Tescili',
        labelEn: 'Civil Event Registration',
        desc: 'الزواج أو الطلاق أو الوفاة في السجلات المغربية',
        descTr: 'Evlilik, boşanma veya vefat kaydı',
        descEn: 'Marriage, divorce or death registration in Moroccan records',
      },
    ],
  },
  {
    num: '03',
    title: 'التوكيلات والتوثيق',
    titleTr: 'Vekâletname ve Tasdik',
    titleEn: 'Powers of Attorney & Attestation',
    options: [
      {
        id: 'agency',
        label: 'وكالة خاصة عادية لشخص بالمغرب',
        labelTr: 'Normal Özel Vekâletname',
        labelEn: 'Ordinary Special Power of Attorney',
        desc: 'خدمة الوكالات الخاصة العادية (تنبيه: الوكالة العقارية عدلية بالمغرب عند العدول وليست بالقنصلية)',
        descTr: 'Normal özel vekâlet (Gayrimenkul vekâleti Fas’ta Adoul nezdinde yapılır, konsoloslukta yoktur)',
        descEn: 'Ordinary special POA only (Real estate POA is an Adoul deed in Morocco, not at the Consulate)',
      },
      {
        id: 'signature_attest',
        label: 'التصديق والإمضاءات',
        labelTr: 'İmza ve Aslına Uygunluk Tasdiki',
        labelEn: 'Signature Attestation & Certified Copy',
        desc: 'تصديق الإمضاء ومطابقة النسخ للأصل',
        descTr: 'İmza tasdiki ve aslı gibidir onayı',
        descEn: 'Signature authentication and true copy attestation',
      },
      {
        id: 'notarial',
        label: 'خدمات توثيقية وإدارية',
        labelTr: 'İdari Tasdik Hizmetleri',
        labelEn: 'Administrative Attestation Services',
        desc: 'تصديق الوثائق الإدارية والوكالات الخاصة العادية',
        descTr: 'İdari belgeler ve normal özel vekâlet işlemleri',
        descEn: 'Administrative documents and ordinary special POA',
      },
    ],
  },
  {
    num: '04',
    title: 'التسجيل والجنسية والتأشيرات',
    titleTr: 'Kayıt, Vatandaşlık ve Vizeler',
    titleEn: 'Registration, Citizenship & Visas',
    options: [
      {
        id: 'consular_card',
        label: 'التسجيل القنصلي والبطاقة القنصلية',
        labelTr: 'Konsolosluk Kaydı ve Kartı',
        labelEn: 'Consular Registration & Card',
        desc: 'شهادة التسجيل أو تجديد البطاقة القنصلية',
        descTr: 'Konsolosluk kayıt belgesi veya kartı',
        descEn: 'Consular registration certificate or consular card',
      },
      {
        id: 'nationality_cert',
        label: 'شهادة الجنسية المغربية',
        labelTr: 'Fas Vatandaşlık Belgesi',
        labelEn: 'Moroccan Nationality Certificate',
        desc: 'معالجة الطلب بالتنسيق مع الجهات المختصة',
        descTr: 'Yetkili makamlarla koordinasyon içinde başvuru',
        descEn: 'Application processing in coordination with authorities',
      },
      {
        id: 'turkish_citizenship_docs',
        label: 'وثائق ملف الجنسية التركية',
        labelTr: 'Türk Vatandaşlığı İçin Fas Belgeleri',
        labelEn: 'Documents for Turkish Citizenship',
        desc: 'شهادة الميلاد والنسخة الكاملة والوثائق المطلوبة للملف',
        descTr: 'Doğum belgesi ve başvuru için gerekli Fas evrakları',
        descEn: 'Birth certificate, full copy and required Moroccan civil docs',
      },
      {
        id: 'moroccan_visa',
        label: 'طلب التأشيرة المغربية',
        labelTr: 'Fas Vizesi Başvurusu',
        labelEn: 'Moroccan Entry Visa',
        desc: 'للأجانب الراغبين في زيارة أو دخول المغرب',
        descTr: 'Fas’a seyahat etmek isteyen yabancılar için',
        descEn: 'For foreign nationals planning to travel to Morocco',
      },
    ],
  },
];

export const ConsularBookingModal: React.FC<ConsularBookingModalProps> = ({
  isOpen,
  onClose,
  defaultService,
}) => {
  const { t, language, isRtl } = useLanguage();
  const { settings } = useSiteSettings();

  const [selectedService, setSelectedService] = useState<string>(
    defaultService || 'شهادة أهلية الزواج'
  );
  const [selectedOffice, setSelectedOffice] = useState<string>(
    'القنصلية العامة للمملكة المغربية في إسطنبول'
  );
  const [applicantType, setApplicantType] = useState<string>('بالغ');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitted(false);
      setShowContactModal(false);
      setErrorMsg('');
    }
  }, [isOpen]);

  const handleOpenWebsiteModal = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedService) {
      setErrorMsg(t('يرجى اختيار نوع الخدمة القنصلية'));
      return;
    }
    setErrorMsg('');
    setShowContactModal(true);
  };

  if (!isOpen) return null;

  const isMarriageSelected =
    selectedService.includes('أهلية الزواج') ||
    selectedService.includes('Evlenme Ehliyet') ||
    selectedService.includes('Marriage Eligibility');

  const isAgencySelected =
    selectedService.includes('وكالة') ||
    selectedService.includes('توكيل') ||
    selectedService.includes('Vekâlet') ||
    selectedService.includes('Power of Attorney');

  const isPassportSelected =
    selectedService.includes('جواز السفر') ||
    selectedService.includes('Pasaport') ||
    selectedService.includes('Passport');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) {
      setErrorMsg(t('يرجى اختيار نوع الخدمة القنصلية'));
      return;
    }

    const messageLines = [
      '🏛️ *طلب موعد قنصلي - ELFAZNI SERVICES*',
      '--------------------------------',
      `• *الخدمة المطلوبة:* ${selectedService}`,
      `• *البعثة القنصلية:* ${selectedOffice}`,
      `• *صاحب الطلب:* ${applicantType}`,
      notes ? `• *تفاصيل إضافية:* ${notes}` : null,
      '--------------------------------',
      'أرجو المساعدة في حجز الموعد وتوضيح الوثائق المطلوبة. شكراً لكم!',
    ]
      .filter(Boolean)
      .join('\n');

    const visitorId = tracker.getVisitorId();
    const { device, browser, screenW, maxTouchPoints } = tracker.detectDevice();
    const { country, flag, city } = tracker.detectGeoLocation();

    await api.submitMailboxMessage({
      name: `طالب موعد قنصلي (${applicantType})`,
      phone: 'عبر واتساب',
      serviceRequested: `موعد قنصلي: ${selectedService}`,
      subject: `حجز موعد قنصلي: ${selectedService}`,
      message: `البعثة: ${selectedOffice}\nالفئة: ${applicantType}\n${notes || 'طلب موعد قنصلي عبر الموقع'}`,
      country: `${country} ${flag}`,
      flag,
      city,
      device,
      browser,
      visitorId,
      screenW,
      maxTouchPoints,
      source: 'نموذج حجز المواعيد القنصلية',
    }).catch(() => {});

    const waRaw = settings.whatsappRaw || SITE_CONTACT.whatsappRaw;
    const whatsappUrl = `https://wa.me/${waRaw}?text=${encodeURIComponent(messageLines)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setIsSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#011a3b]/70 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#0B2E57] via-[#004AA5] to-[#2A83D5] text-white p-6 sm:p-7">
          <button
            onClick={onClose}
            className={`absolute top-5 ${isRtl ? 'left-5' : 'right-5'} w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all cursor-pointer`}
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#E3C88F]" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
              {t('مواعيد القنصلية المغربية')}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {t('اختر الخدمة المطلوبة')}
          </h2>
          <p className="text-sm text-blue-100/90 mt-1">
            {t('اختر نوع المعاملة، ثم أرسل طلب الموعد عبر واتساب بخطوات منظمة.')}
          </p>
        </div>

        {/* Content & Options */}
        {isSubmitted ? (
          <div className="p-8 sm:p-10 text-center space-y-5 animate-success-slide-up" role="status" aria-live="polite">
            <div className="flex justify-center pb-1">
              <AnimatedSuccessBadge size="lg" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <span>{selectedService}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedOffice.includes('أنقرة') ? t('أنقرة') : t('إسطنبول')}</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#0B2E57]">
                {t('تم فتح طلب الموعد القنصلي على واتساب!')}
              </h3>
            </div>

            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {t('تم تجهيز رسالتك مع نوع المعاملة والبعثة القنصلية المختارة. سنراجع معك الوثائق المطلوبة خطوة بخطوة.')}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleSubmit as any}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:from-[#20ba5a] hover:to-[#0f7a6e] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <WhatsAppLogo className="w-5 h-5" />
                <span>{t('إعادة فتح واتساب')}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="w-full sm:w-auto px-5 py-3.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm transition-colors cursor-pointer"
              >
                {t('تغيير نوع المعاملة')}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
              >
                {t('إغلاق')}
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
          {CONSULAR_GROUPS.map((group) => (
            <div key={group.num} className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <span className="w-6 h-6 rounded-md bg-blue-100 text-[#004AA5] font-bold text-xs flex items-center justify-center">
                  {group.num}
                </span>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                  {language === 'tr' ? group.titleTr : language === 'en' ? group.titleEn : group.title}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {group.options.map((opt) => {
                  const label = language === 'tr' ? opt.labelTr : language === 'en' ? opt.labelEn : opt.label;
                  const desc = language === 'tr' ? opt.descTr : language === 'en' ? opt.descEn : opt.desc;
                  const isSelected = selectedService === opt.label || selectedService === label;

                  return (
                    <label
                      key={opt.id}
                      className={`relative flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#004AA5] bg-blue-50/70 shadow-sm ring-1 ring-[#004AA5]'
                          : 'border-gray-200 hover:border-blue-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="consularService"
                        value={opt.label}
                        checked={isSelected}
                        onChange={() => setSelectedService(opt.label)}
                        className="mt-1 text-[#004AA5] focus:ring-[#004AA5]"
                      />
                      <div className="flex-1">
                        <b className="block text-sm font-bold text-gray-900 leading-snug">
                          {label}
                        </b>
                        <small className="block text-xs text-gray-500 mt-0.5 leading-relaxed">
                          {desc}
                        </small>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Dynamic Required Documents Box for Marriage Eligibility, POA, and Passport */}
          {isMarriageSelected && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/80 border-2 border-[#004AA5]/25 space-y-3">
              <div className="flex items-center gap-2 text-[#0B2E57] font-black text-sm sm:text-base">
                <CheckCircle2 className="w-5 h-5 text-[#004AA5] shrink-0" />
                <span>الأوراق المطلوبة لاستخراج شهادة أهلية الزواج:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-800">
                <div className="bg-white p-3.5 rounded-xl border border-blue-100 space-y-1.5">
                  <b className="block text-[#0B2E57] font-extrabold">أولاً: وثائق الطرف المغربي</b>
                  <ul className="space-y-1 list-decimal list-inside font-semibold">
                    <li>شهادة الخطوبة صادرة من المغرب مع الأبوستيل.</li>
                    <li>نسخة كاملة مع الأبوستيل.</li>
                    <li>السجل العدلي مع الأبوستيل.</li>
                    <li>جواز السفر، وفي حالة وجود إقامة، نسخة عن الإقامة.</li>
                    <li>وثيقة إثبات العنوان (Yerleşim Belgesi).</li>
                  </ul>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-blue-100 space-y-1.5">
                  <b className="block text-[#0B2E57] font-extrabold">ثانياً: أوراق الزوج</b>
                  <ul className="space-y-1 list-decimal list-inside font-semibold">
                    <li>بطاقة التعريف الوطنية الخاصة بالزوج.</li>
                    <li>سجل القيد العائلي الخاص بالزوج.</li>
                    <li>أوراق العمل الخاصة بالزوج.</li>
                    <li>السجل العدلي الخاص بالزوج.</li>
                  </ul>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  راجع القنصلية لتأكيد الوثائق التي تحتاج إلى أبوستيل والجهة المختصة بتصديقها قبل تقديم الملف.
                </span>
              </div>
            </div>
          )}

          {isAgencySelected && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/80 border-2 border-[#004AA5]/25 space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  تنبيه بخصوص الوكالة العقارية: الوكالة الخاصة بالعقارات هي وكالة عدلية في المغرب تقام عند العدول والقنصلية ليس لديها هذه الخدمة. يوجد في القنصلية خدمة الوكالات الخاصة العادية فقط.
                </span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-blue-100 space-y-1.5 text-xs sm:text-sm text-slate-800">
                <b className="block text-[#0B2E57] font-extrabold">
                  الأوراق المطلوبة للوكالة الخاصة العادية:
                </b>
                <ul className="space-y-1 list-disc list-inside font-semibold">
                  <li>إرسال نص الوكالة</li>
                  <li>بطاقة التعريف الوطنية</li>
                  <li>الإقامة</li>
                  <li>جواز السفر</li>
                  <li>النفوس (Yerleşim Belgesi)</li>
                </ul>
              </div>
            </div>
          )}

          {isPassportSelected && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/80 border-2 border-[#004AA5]/25 space-y-2.5">
              <div className="flex items-center gap-2 text-[#0B2E57] font-black text-sm sm:text-base">
                <CheckCircle2 className="w-5 h-5 text-[#004AA5] shrink-0" />
                <span>الأوراق المطلوبة لجواز السفر:</span>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-blue-100 text-xs sm:text-sm text-slate-800">
                <ul className="space-y-1.5 list-disc list-inside font-semibold">
                  <li>صورة لبطاقة التعريف الوطنية</li>
                  <li>الإقامة في تركيا (الإقامة التركية)</li>
                  <li>صورة لـ Yerleşim Belgesi أو النفوس</li>
                </ul>
              </div>
            </div>
          )}

          {/* Section 05: Consulate Office Selection */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <span className="w-6 h-6 rounded-md bg-blue-100 text-[#004AA5] font-bold text-xs flex items-center justify-center">
                05
              </span>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                {t('اختر البعثة القنصلية')}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedOffice.includes('إسطنبول')
                    ? 'border-[#004AA5] bg-blue-50/70 shadow-sm ring-1 ring-[#004AA5]'
                    : 'border-gray-200 hover:border-blue-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="consularOffice"
                  value="القنصلية العامة للمملكة المغربية في إسطنبول"
                  checked={selectedOffice.includes('إسطنبول')}
                  onChange={() => setSelectedOffice('القنصلية العامة للمملكة المغربية في إسطنبول')}
                  className="mt-1 text-[#004AA5] focus:ring-[#004AA5]"
                />
                <div>
                  <b className="block text-sm font-bold text-gray-900">
                    {t('القنصلية العامة في إسطنبول')}
                  </b>
                  <small className="block text-xs text-gray-500 mt-1">
                    {t('موعد لدى القنصلية العامة للمملكة المغربية في إسطنبول')}
                  </small>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  selectedOffice.includes('أنقرة')
                    ? 'border-[#004AA5] bg-blue-50/70 shadow-sm ring-1 ring-[#004AA5]'
                    : 'border-gray-200 hover:border-blue-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="consularOffice"
                  value="سفارة المملكة المغربية في أنقرة"
                  checked={selectedOffice.includes('أنقرة')}
                  onChange={() => setSelectedOffice('سفارة المملكة المغربية في أنقرة')}
                  className="mt-1 text-[#004AA5] focus:ring-[#004AA5]"
                />
                <div>
                  <b className="block text-sm font-bold text-gray-900">
                    {t('سفارة المملكة المغربية في أنقرة')}
                  </b>
                  <small className="block text-xs text-gray-500 mt-1">
                    {t('موعد لدى السفارة المغربية في العاصمة أنقرة')}
                  </small>
                </div>
              </label>
            </div>
          </div>

          {/* Applicant & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('صاحب الطلب')}</span>
              </label>
              <select
                value={applicantType}
                onChange={(e) => setApplicantType(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004AA5] focus:bg-white text-sm"
              >
                <option value="بالغ">{t('بالغ')}</option>
                <option value="قاصر">{t('قاصر')}</option>
                <option value="أسرة">{t('أسرة')}</option>
                <option value="أجنبي">{t('أجنبي')}</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('تفاصيل إضافية (اختياري)')}</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('اكتب أي تفاصيل تساعدنا في فهم طلبك وموعدك')}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004AA5] focus:bg-white text-sm"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Legal Disclaimer (إخلاء المسؤولية) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 font-extrabold text-[#0B2E57]">
              <AlertCircle className="w-4 h-4 text-[#004AA5] shrink-0" />
              <span>إخلاء المسؤولية:</span>
            </div>
            <ul className="space-y-1 list-disc list-inside leading-[1.75] font-medium">
              <li>لا تربطنا أي علاقة رسمية مع القنصلية المغربية أو مع الإدارة العمومية.</li>
              <li>نقوم بتقديم خدمات استشارية وخدمات المساعدة في إصدار الأوراق.</li>
              <li>لا ننوب عن الشخص، لكن نساعده بالإرشاد حتى نسهل عليه المعاملات، وتكون المعاملات أسهل وأبسط.</li>
            </ul>
          </div>

          {/* Dual Submission CTAs */}
          <div className="pt-2 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleOpenWebsiteModal}
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-[#0B2E57] to-[#004AA5] hover:from-[#004AA5] hover:to-[#2A83D5] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-blue-900/15 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Check className="w-5 h-5" />
                <span>{t('إرسال الطلب عبر الموقع')}</span>
              </button>

              <button
                type="submit"
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-[#25d366] to-[#128c7e] hover:from-[#20ba5a] hover:to-[#0f7a6e] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <WhatsAppLogo className="w-5 h-5" />
                <span>{t('إرسال عبر واتساب')}</span>
              </button>
            </div>
            <p className="text-center text-xs text-gray-500 font-medium">
              {t('يمكنك إرسال وتوثيق الطلب مباشرة في الموقع وسيتواصل معك فريقنا، أو إرساله فورياً عبر واتساب.')}
            </p>
          </div>
        </form>
        )}
      </div>

      <ServiceContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        serviceTag="CONSULAR"
        serviceTitle={`موعد قنصلي: ${selectedService}`}
        serviceSummary={`الخدمة المطلوبة: ${selectedService}\nالبعثة القنصلية: ${selectedOffice}\nصاحب الطلب: ${applicantType}${notes ? `\nتفاصيل إضافية: ${notes}` : ''}`}
        payloadJson={{
          selectedService,
          selectedOffice,
          applicantType,
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
