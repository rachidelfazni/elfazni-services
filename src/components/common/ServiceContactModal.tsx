import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Phone,
  Mail,
  User,
  ShieldCheck,
  AlertCircle,
  Copy,
  ExternalLink,
  ChevronDown,
  Search,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { api, ServiceTag, ContactMessage } from '../../services/api';
import { tracker } from '../../services/tracker';
import { WhatsAppLogo } from '../WhatsAppLogo';
import { SITE_CONTACT } from '../../data/content';

export interface CountryCodeOption {
  code: string;
  nameAr: string;
  nameEn: string;
  nameFr: string;
  dialCode: string;
  flag: string;
}

export const COUNTRY_CODES: CountryCodeOption[] = [
  { code: 'MA', nameAr: 'المغرب', nameEn: 'Morocco', nameFr: 'Maroc', dialCode: '+212', flag: '🇲🇦' },
  { code: 'TR', nameAr: 'تركيا', nameEn: 'Türkiye', nameFr: 'Turquie', dialCode: '+90', flag: '🇹🇷' },
  { code: 'FR', nameAr: 'فرنسا', nameEn: 'France', nameFr: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'BE', nameAr: 'بلجيكا', nameEn: 'Belgium', nameFr: 'Belgique', dialCode: '+32', flag: '🇧🇪' },
  { code: 'ES', nameAr: 'إسبانيا', nameEn: 'Spain', nameFr: 'Espagne', dialCode: '+34', flag: '🇪🇸' },
  { code: 'NL', nameAr: 'هولندا', nameEn: 'Netherlands', nameFr: 'Pays-Bas', dialCode: '+31', flag: '🇳🇱' },
  { code: 'DE', nameAr: 'ألمانيا', nameEn: 'Germany', nameFr: 'Allemagne', dialCode: '+49', flag: '🇩🇪' },
  { code: 'IT', nameAr: 'إيطاليا', nameEn: 'Italy', nameFr: 'Italie', dialCode: '+39', flag: '🇮🇹' },
  { code: 'GB', nameAr: 'بريطانيا', nameEn: 'United Kingdom', nameFr: 'Royaume-Uni', dialCode: '+44', flag: '🇬🇧' },
  { code: 'SA', nameAr: 'السعودية', nameEn: 'Saudi Arabia', nameFr: 'Arabie Saoudite', dialCode: '+966', flag: '🇸🇦' },
  { code: 'AE', nameAr: 'الإمارات', nameEn: 'UAE', nameFr: 'Émirats arabes unis', dialCode: '+971', flag: '🇦🇪' },
  { code: 'QA', nameAr: 'قطر', nameEn: 'Qatar', nameFr: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'KW', nameAr: 'الكويت', nameEn: 'Kuwait', nameFr: 'Koweït', dialCode: '+965', flag: '🇰🇼' },
  { code: 'US', nameAr: 'أمريكا', nameEn: 'United States', nameFr: 'États-Unis', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', nameAr: 'كندا', nameEn: 'Canada', nameFr: 'Canada', dialCode: '+1', flag: '🇨🇦' },
];

export interface ServiceContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceTag: ServiceTag;
  serviceTitle: string;
  serviceSummary?: string;
  payloadJson?: Record<string, any>;
  onSuccess?: (request: ContactMessage) => void;
}

export const ServiceContactModal: React.FC<ServiceContactModalProps> = ({
  isOpen,
  onClose,
  serviceTag,
  serviceTitle,
  serviceSummary,
  payloadJson,
  onSuccess,
}) => {
  const { t, isRtl, language } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCodeOption>(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [whatsappCountry, setWhatsappCountry] = useState<CountryCodeOption>(COUNTRY_CODES[0]);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(true);

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<ContactMessage | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSubmittedRequest(null);
      setErrorBanner(null);
      setCopiedRef(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCountries = COUNTRY_CODES.filter((c) => {
    const q = countrySearch.toLowerCase().trim();
    return (
      c.nameAr.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.nameFr.toLowerCase().includes(q) ||
      c.dialCode.includes(q)
    );
  });

  const getCountryName = (c: CountryCodeOption) => {
    if (language === 'en') return c.nameEn;
    if (language === 'fr') return c.nameFr;
    return c.nameAr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorBanner(t('يرجى إدخال الاسم الكامل'));
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorBanner(t('يرجى إدخال رقم الهاتف للتواصل'));
      return;
    }
    if (!privacyAccepted) {
      setErrorBanner(t('يرجى الموافقة على سياسة الخصوصية لمتابعة الطلب'));
      return;
    }

    setSubmitting(true);
    setErrorBanner(null);

    const fullPhone = `${selectedCountry.dialCode} ${phoneNumber.trim()}`;
    const fullWa = sameAsPhone
      ? fullPhone
      : whatsappNumber.trim()
      ? `${whatsappCountry.dialCode} ${whatsappNumber.trim()}`
      : undefined;

    const visitorId = tracker.getVisitorId();
    const { device, browser, screenW, maxTouchPoints } = tracker.detectDevice();
    const { country, flag, city } = tracker.detectGeoLocation();

    try {
      const fullMessageText = [
        serviceSummary ? `📌 تفاصيل الخدمة:\n${serviceSummary}` : null,
        notes.trim() ? `📝 ملاحظات العميل:\n${notes.trim()}` : null,
      ]
        .filter(Boolean)
        .join('\n\n');

      const res = await api.submitServiceRequest({
        name: fullName.trim(),
        phone: fullPhone,
        whatsappPhone: fullWa,
        email: email.trim() || undefined,
        serviceTag,
        serviceRequested: serviceTitle,
        subject: `طلب ${serviceTitle} — ${fullName.trim()}`,
        message: fullMessageText || `طلب ${serviceTitle}`,
        payloadJson: {
          ...payloadJson,
          visitorId,
          device,
          browser,
          screenW,
          maxTouchPoints,
          userCountry: selectedCountry.nameAr,
        },
        source: 'نموذج طلب الخدمة الموحد عبر الموقع',
        country: `${country || selectedCountry.nameAr} ${flag || selectedCountry.flag}`,
      });

      if (res.success && res.request) {
        setSubmittedRequest(res.request);
        if (onSuccess) onSuccess(res.request);
      } else {
        throw new Error(res.message || 'تعذر إرسال الطلب');
      }
    } catch (err: any) {
      setErrorBanner(err.message || t('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة ثانية.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (submittedRequest?.reference || submittedRequest?.ticketNumber) {
      navigator.clipboard.writeText(submittedRequest.reference || submittedRequest.ticketNumber);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#011a3b]/70 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B2E57] via-[#004AA5] to-[#2A83D5] text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-4 ${
              isRtl ? 'left-4' : 'right-4'
            } w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all cursor-pointer`}
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#CC9048] text-[#0B2E57] tracking-wider uppercase">
              {serviceTag}
            </span>
            <span className="text-xs text-blue-200 font-semibold">ELFAZNI SERVICES</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white">
            {submittedRequest ? t('تم استلام طلبك بنجاح!') : t('تأكيد وإرسال الطلب عبر الموقع')}
          </h3>
          <p className="text-xs text-blue-100 mt-1 font-medium">{serviceTitle}</p>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4">
          {submittedRequest ? (
            /* Success confirmation screen */
            <div className="space-y-5 text-center py-2 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900">
                  {t('شكراً لك، تم حفظ طلبك وإرسال إشعار للإدارة')}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {t('سيتواصل معك فريقنا في أقرب وقت عبر الهاتف أو الواتساب لمتابعة طلبك.')}
                </p>
              </div>

              {/* Reference Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto">
                <div className="text-xs text-slate-500 mb-1 font-medium">{t('رقم مرجع الطلب (احتفظ به للمتابعة)')}</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-base sm:text-lg font-black text-[#0B2E57] tracking-wider">
                    {submittedRequest.reference || submittedRequest.ticketNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="نسخ المرجع"
                  >
                    {copiedRef ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copiedRef && <span className="text-[11px] text-emerald-600 font-bold block mt-1">{t('تم النسخ')}</span>}
              </div>

              {/* Service Details Card */}
              {serviceSummary && (
                <div className="text-start bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 text-xs text-slate-700 font-medium whitespace-pre-line">
                  {serviceSummary}
                </div>
              )}

              {/* Advisory note */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 text-start flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {t('يرجى ملاحظة أن هذا إشعار باستلام الطلب وليس حجزاً أو موعداً نهائياً مؤكداً، وسيتم التأكيد بعد مراجعة الفريق.')}
                </span>
              </div>

              <a
                href={`https://wa.me/${SITE_CONTACT.whatsappRaw}?text=${encodeURIComponent(
                  `مرحباً، أود متابعة طلبي برقم مرجع: ${submittedRequest.reference || submittedRequest.ticketNumber}\n• الخدمة: ${serviceTitle}\n• الاسم: ${fullName.trim()}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="whatsapp-direct-link"
                className="w-full py-3 px-6 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <WhatsAppLogo className="w-5 h-5 text-white" />
                <span>{t('متابعة الطلب عبر واتساب مع رقم المرجع')}</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-6 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white font-bold text-sm transition-all cursor-pointer shadow-md"
              >
                {t('إغلاق')}
              </button>
            </div>
          ) : (
            /* Input Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Service details preview */}
              {serviceSummary && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 max-h-24 overflow-y-auto whitespace-pre-line">
                  {serviceSummary}
                </div>
              )}

              {errorBanner && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorBanner}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('الاسم الكامل')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className={`w-4 h-4 text-slate-400 absolute top-3 ${isRtl ? 'right-3' : 'left-3'} pointer-events-none`} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('اكتب اسمك الثلاثي أو الكامل')}
                    className={`w-full py-2.5 ${
                      isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                    } rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#004AA5] text-sm text-slate-900 outline-none transition-all`}
                  />
                </div>
              </div>

              {/* Phone with Country Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('رقم الهاتف')} <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {/* Country Selector Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryPicker(!showCountryPicker)}
                      className="h-10 px-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 flex items-center gap-1.5 text-xs font-bold text-slate-800 cursor-pointer"
                    >
                      <span>{selectedCountry.flag}</span>
                      <span className="font-mono dir-ltr">{selectedCountry.dialCode}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {showCountryPicker && (
                      <div className="absolute top-12 z-20 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-1.5 animate-fade-in max-h-56 overflow-hidden flex flex-col">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute top-2.5 right-2.5" />
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder={t('بحث عن دولة أو رمز...')}
                            className="w-full py-1.5 pr-8 pl-2 text-xs border border-slate-200 rounded-lg outline-none"
                          />
                        </div>
                        <div className="overflow-y-auto space-y-0.5 max-h-40">
                          {filteredCountries.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(c);
                                if (sameAsPhone) setWhatsappCountry(c);
                                setShowCountryPicker(false);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-slate-100 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span>{c.flag}</span>
                                <span>{getCountryName(c)}</span>
                              </div>
                              <span className="font-mono text-slate-500 dir-ltr">{c.dialCode}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="612345678"
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#004AA5] text-sm text-slate-900 outline-none transition-all dir-ltr"
                  />
                </div>
              </div>

              {/* WhatsApp Checkbox & Alternate WhatsApp Field */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sameAsPhone}
                    onChange={(e) => setSameAsPhone(e.target.checked)}
                    className="rounded border-slate-300 text-[#004AA5] focus:ring-[#004AA5] w-4 h-4 cursor-pointer"
                  />
                  <WhatsAppLogo className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('رقم الواتساب هو نفسه رقم الهاتف أعلاه')}</span>
                </label>

                {!sameAsPhone && (
                  <div className="pt-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('رقم الواتساب المنفصل')}</label>
                    <div className="flex gap-2">
                      <span className="h-10 px-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span>{whatsappCountry.flag}</span>
                        <span className="font-mono dir-ltr">{whatsappCountry.dialCode}</span>
                      </span>
                      <input
                        type="tel"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="612345678"
                        className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#004AA5] text-sm text-slate-900 outline-none transition-all dir-ltr"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('البريد الإلكتروني')} <span className="text-slate-400 font-normal">({t('اختياري لتوثيق الرد')})</span>
                </label>
                <div className="relative">
                  <Mail className={`w-4 h-4 text-slate-400 absolute top-3 ${isRtl ? 'right-3' : 'left-3'} pointer-events-none`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@domain.com"
                    className={`w-full py-2.5 ${
                      isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
                    } rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#004AA5] text-sm text-slate-900 outline-none transition-all dir-ltr`}
                  />
                </div>
              </div>

              {/* Notes / Special Requests */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t('ملاحظات أو تفاصيل إضافية')}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('أي تفاصيل إضافية تود إبلاغ الفريق بها')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#004AA5] text-xs text-slate-900 outline-none transition-all resize-none"
                />
              </div>

              {/* Privacy Notice */}
              <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="rounded border-slate-300 text-[#004AA5] focus:ring-[#004AA5] w-3.5 h-3.5 mt-0.5 cursor-pointer shrink-0"
                />
                <span>
                  {t('أوافق على سياسة الخصوصية واستخدام بيانات التواصل لتأكيد ومتابعة هذا الطلب من قبل فريق ELFAZNI SERVICES.')}
                </span>
              </label>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#0B2E57] to-[#004AA5] hover:from-[#004AA5] hover:to-[#2A83D5] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/15 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>{t('جارٍ إرسال وحفظ الطلب...')}</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t('تأكيد وإرسال الطلب عبر الموقع')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
