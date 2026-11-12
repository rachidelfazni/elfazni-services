import { SectionTitle } from './SiteContent';
import React, { useState, useRef } from 'react';
import {
  Send,
  Mail,
  User,
  Phone,
  FileText,
  CheckCircle2,
  Sparkles,
  Paperclip,
  X,
  Copy,
  Check,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { WhatsAppLogo } from './WhatsAppLogo';
import { api } from '../services/api';
import { tracker } from '../services/tracker';

type ContactChannel = 'internal' | 'email' | 'whatsapp';

export const ContactFormSection: React.FC = () => {
  const { t } = useLanguage();
  const { settings, services } = useSiteSettings();
  const [activeChannel, setActiveChannel] = useState<ContactChannel>('internal');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<{ name: string; url: string; size: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<string | null>(null);
  const [emailStatus, setEmailStatus] = useState<'accepted' | 'not_configured' | 'failed'>();
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const serviceOptions = [
    ...services.map((entry) => t(entry.title)),
    t('استفسار عام'),
  ];
  const requestedService = serviceOptions.includes(service) ? service : serviceOptions[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorBanner(t('حجم الملف كبير، يرجى اختيار ملف أقل من 10 ميغابايت'));
      setTimeout(() => setErrorBanner(null), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      setAttachment({
        name: file.name,
        url: loadEvent.target?.result as string,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleInternalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (submitting) return;
    setSubmitting(true);
    setErrorBanner(null);
    try {
      const selectedService = requestedService;
      const visitorId = tracker.getVisitorId();
      const { device, browser, screenW, maxTouchPoints } = tracker.detectDevice();
      const { country, flag, city } = tracker.detectGeoLocation();

      const res = await api.submitMailboxMessage({
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : undefined,
        serviceRequested: selectedService,
        subject: subject.trim() || `طلب خدمة: ${selectedService}`,
        message: message.trim() || `طلب تواصل بخصوص ${selectedService}`,
        attachments: attachment ? [attachment] : [],
        country: `${country} ${flag}`,
        flag,
        city,
        device,
        browser,
        visitorId,
        screenW,
        maxTouchPoints,
        notifyByEmail: activeChannel === 'email',
        source: activeChannel === 'email' ? 'نموذج البريد من الموقع' : 'بوابة المراسلة المباشرة داخل الموقع',
      });

      if (!res.ticketNumber) throw new Error("Missing ticket number");
      setEmailStatus(res.emailStatus);
      setTicketResult(res.ticketNumber);
      // Reset form fields
      setMessage('');
      setSubject('');
      setAttachment(null);
    } catch (err) {
      console.error('Failed to submit message:', err);
      setErrorBanner(t('حدث خطأ أثناء الإرسال، يرجى المحاولة ثانية أو التواصل عبر واتساب.'));
      setTimeout(() => setErrorBanner(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const selectedService = requestedService;
    const visitorId = tracker.getVisitorId();
    const { device, browser, screenW, maxTouchPoints } = tracker.detectDevice();
    const { country, flag, city } = tracker.detectGeoLocation();

    const textLines = [
      `السلام عليكم ELFAZNI SERVICES،`,
      `الاسم: ${name}`,
      `الهاتف: ${phone}`,
      email ? `البريد: ${email}` : '',
      `الخدمة: ${selectedService}`,
      subject ? `الموضوع: ${subject}` : '',
      message ? `التفاصيل: ${message}` : '',
    ].filter(Boolean);

    // Register in mailbox FIRST with keepalive so iOS Safari doesn't cancel it when switching to WhatsApp app
    await api.submitMailboxMessage({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : undefined,
      serviceRequested: selectedService,
      subject: subject.trim() || 'طلب عبر واتساب',
      message: message.trim() || 'طلب تحويل واتساب فوري',
      country: `${country} ${flag}`,
      flag,
      city,
      device,
      browser,
      visitorId,
      screenW,
      maxTouchPoints,
      source: 'تحويل واتساب فوري',
    }).catch(() => {});

    const url = `https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(textLines.join('\n'))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyTicketNumber = () => {
    if (!ticketResult) return;
    navigator.clipboard.writeText(ticketResult);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 3000);
  };

  return (
    <section
      id="contact-form"
      aria-labelledby="contact-form-heading"
      className="py-16 md:py-24 bg-[#eaf4ff] relative overflow-hidden border-t border-[#D7E7F7]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#D7E7F7] text-[#004AA5] font-extrabold text-xs sm:text-sm shadow-sm">
            <Sparkles className="w-4 h-4 text-[#CC9048]" />
            <span>{t('بوابة المراسلة والتواصل')} · ELFAZNI SERVICES</span>
          </div>

          <SectionTitle sectionId="contact-form" id="contact-form-heading" className="tracking-tight">
            <span className="block font-black text-2xl sm:text-3xl lg:text-4xl text-[#0B2E57]">
              {t('تواصل مع إدارة الموقع بكل سهولة')}
            </span>
            <span className="block font-bahij-bold text-lg sm:text-xl text-[#CC9048] mt-1">
              {t('مراسلة داخلية مع رقم تذكرة، أو بريد إلكتروني، أو واتساب فوري')}
            </span>
          </SectionTitle>

          <p className="text-[#5E7086] text-sm sm:text-base font-medium">
            {t('اختر طريقة المراسلة المفضلة لديك وسنكون سعداء بخدمتك والرد على كافة استفساراتك.')}
          </p>
        </div>

        {/* 3 Channel Selection Tabs */}
        <div className="max-w-3xl mx-auto mb-8 bg-white p-2 rounded-2xl shadow-md border border-[#D7E7F7] grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveChannel('internal')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeChannel === 'internal'
                ? 'bg-[#004AA5] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t('📩 مراسلة داخل الموقع (تذكرة)')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChannel('whatsapp')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeChannel === 'whatsapp'
                ? 'bg-[#25D366] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <WhatsAppLogo className="w-4 h-4" />
            <span>{t('🟢 واتساب الفوري')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChannel('email')}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeChannel === 'email'
                ? 'bg-gradient-to-br from-[#0E4B87] to-[#0B2E57] text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>{t('📧 إرسال بالبريد')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Direct Contact Info Card */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0B2E57] via-[#0E4B87] to-[#001233] rounded-[2rem] p-7 sm:p-9 text-white flex flex-col justify-between shadow-xl border border-[#CC9048]/30 relative overflow-hidden">
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-[#CC9048]/15 rounded-full blur-2xl pointer-events-none" />

            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#CC9048]/20 border border-[#CC9048]/40 text-[#E3C88F] text-xs font-extrabold mb-4">
                ELFAZNI SERVICES
              </span>
              <h3 className="text-xl sm:text-2xl font-black mb-3 leading-snug text-white">
                {t('إدارة ELFAZNI SERVICES معك خطوة بخطوة')}
              </h3>
              <p className="text-blue-100/85 text-sm sm:text-base leading-relaxed mb-6">
                {t('مديرنا العام')} <strong>{settings.founderName}</strong> {t('وفريق العمل يتابعون رسائل البريد الداخلي والواتساب على مدار اليوم لضمان سرعة إنجاز معاملاتكم.')}
              </p>

              <div className="space-y-3.5">
                <a
                  href={`https://wa.me/${settings.whatsappRaw}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shrink-0">
                    <WhatsAppLogo className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] text-blue-200/80 font-medium">{t('رقم الواتساب المعتمد')}</div>
                    <div className="text-sm sm:text-base font-black text-white" dir="ltr">
                      {settings.phone}
                    </div>
                  </div>
                </a>

                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#CC9048]/20 border border-[#CC9048]/40 flex items-center justify-center text-[#E3C88F] shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-blue-200/80 font-medium">{t('البريد الإلكتروني الرسمي')}</div>
                    <div className="text-sm sm:text-base font-black text-white truncate" dir="ltr">
                      {settings.email}
                    </div>
                  </div>
                </a>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-blue-200/80">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {t('خصوصية تامة وسرية')}
              </span>
              <span>⏱ {settings.workingHoursAr}</span>
            </div>
          </div>

          {/* Interactive Form Card */}
          <div className="lg:col-span-7 bg-white rounded-[2rem] p-7 sm:p-9 shadow-[0_15px_50px_rgba(6,78,168,0.06)] border border-[#D7E7F7]">
            {errorBanner && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center justify-between">
                <span>{errorBanner}</span>
                <button type="button" onClick={() => setErrorBanner(null)} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {/* Success Modal / Ticket Card */}
            {ticketResult && (
              <div className="mb-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-emerald-900 mb-1">
                      {t('تم استلام رسالتك في صندوق بريد الإدارة بنجاح!')}
                    </h4>
                    <p className="text-xs text-emerald-800 leading-relaxed mb-3">
                      {t('احتفظ برقم الطلب للمتابعة مع فريقنا.')}
                    </p>

                    {emailStatus && (
                      <p role="status" className="mb-3 text-sm">
                        {emailStatus === 'accepted'
                          ? t('قبل خادم البريد إرسال الإشعار إلى الإدارة.')
                          : t('حُفظت التذكرة في لوحة الإدارة، وتعذّر إرسال إشعار البريد.')}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-white border border-emerald-300">
                      <span className="text-xs text-slate-500 font-semibold">{t('رقم التذكرة:')}</span>
                      <span className="text-sm font-black text-[#004AA5] font-mono tracking-wider">
                        {ticketResult}
                      </span>
                      <button
                        type="button"
                        onClick={copyTicketNumber}
                        className="mr-auto inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold transition-colors"
                      >
                        {copiedTicket ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> {t('تم النسخ')}
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> {t('نسخ الرقم')}
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTicketResult(null)}
                      className="mt-3 text-xs font-bold text-emerald-700 hover:underline"
                    >
                      {t('+ إرسال رسالة أخرى')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form
              onSubmit={activeChannel === 'whatsapp' ? handleWhatsAppSubmit : handleInternalSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs sm:text-sm font-extrabold text-[#0B2E57] mb-1.5">
                    {t('الاسم الكامل *')}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="{t('اكتب اسمك هنا')}"
                      className="w-full rounded-xl border border-[#D7E7F7] bg-[#FBFBFD] focus:bg-white focus:border-[#004AA5] focus:ring-2 focus:ring-[#004AA5]/15 py-2.5 pr-10 pl-4 text-sm font-medium text-[#0B2E57] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Phone / WhatsApp */}
                <div>
                  <label className="block text-xs sm:text-sm font-extrabold text-[#0B2E57] mb-1.5">
                    {t('رقم الهاتف / الواتساب *')}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+90 5XX XXX XX XX / +212"
                      dir="ltr"
                      className="w-full rounded-xl border border-[#D7E7F7] bg-[#FBFBFD] focus:bg-white focus:border-[#004AA5] focus:ring-2 focus:ring-[#004AA5]/15 py-2.5 px-10 text-sm font-medium text-[#0B2E57] outline-none transition-all text-start"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs sm:text-sm font-extrabold text-[#0B2E57] mb-1.5">
                    {t('البريد الإلكتروني')} {activeChannel === 'email' ? '*' : t('(اختياري)')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 right-3.5 pointer-events-none" />
                    <input
                      type="email"
                      required={activeChannel === 'email'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      dir="ltr"
                      className="w-full rounded-xl border border-[#D7E7F7] bg-[#FBFBFD] focus:bg-white focus:border-[#004AA5] focus:ring-2 focus:ring-[#004AA5]/15 py-2.5 px-10 text-sm font-medium text-[#0B2E57] outline-none transition-all text-start"
                    />
                  </div>
                </div>

                {/* Service Selection */}
                <div>
                  <label htmlFor="contact-service-select" className="block text-xs sm:text-sm font-extrabold text-[#0B2E57] mb-1.5">
                    {t('الخدمة المطلوبة')}
                  </label>
                  <select
                    id="contact-service-select"
                    name="requestedService"
                    aria-label={t('الخدمة المطلوبة')}
                    value={requestedService}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full rounded-xl border border-[#D7E7F7] bg-[#FBFBFD] focus:bg-white focus:border-[#004AA5] focus:ring-2 focus:ring-[#004AA5]/15 py-2.5 px-3 text-sm font-medium text-[#0B2E57] outline-none transition-all"
                  >
                    {serviceOptions.map((opt, idx) => (
                      <option key={idx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message Subject */}
              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-[#0B2E57] mb-1.5">
                  {t('عنوان الموضوع أو التذكرة')}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="{t('مثال: استفسار بخصوص تجديد جواز السفر أو حجز موعد')}"
                  className="w-full rounded-xl border border-[#D7E7F7] bg-[#FBFBFD] focus:bg-white focus:border-[#004AA5] focus:ring-2 focus:ring-[#004AA5]/15 py-2.5 px-4 text-sm font-medium text-[#0B2E57] outline-none transition-all"
                />
              </div>

              {/* Message Text */}
              <div>
                <label className="block text-xs sm:text-sm font-extrabold text-[#0B2E57] mb-1.5">
                  {t('تفاصيل الرسالة أو الاستفسار *')}
                </label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="{t('اكتب هنا كافة تفاصيل طلبك ليتمكن فريقنا من إجابتك بدقة...')}"
                  className="w-full rounded-xl border border-[#D7E7F7] bg-[#FBFBFD] focus:bg-white focus:border-[#004AA5] focus:ring-2 focus:ring-[#004AA5]/15 p-3.5 text-sm font-medium text-[#0B2E57] outline-none transition-all resize-none"
                />
              </div>

              {/* File Attachment for Internal Message Channel */}
              {activeChannel === 'internal' && (
                <div className="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-700">{t('إرفاق صورة أو وثيقة من جهازك:')}</span>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*,application/pdf"
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors shadow-sm"
                    >
                      {attachment ? t('تغيير الملف') : t('اختر ملف من جهازك')}
                    </button>
                  </div>

                  {attachment && (
                    <div className="mt-2.5 flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                      <span className="truncate max-w-xs font-medium text-blue-900">{attachment.name}</span>
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        className="text-red-500 hover:text-red-700 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons depending on selected channel */}
              <div className="pt-2">
                {activeChannel === 'internal' && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#004AA5] to-[#0B2E57] hover:from-[#053d82] hover:to-[#00224b] text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4 rotate-180" />
                    <span>{submitting ? t('جارٍ إرسال التذكرة...') : t('إرسال الرسالة إلى إدارة الموقع (صندوق البريد)')}</span>
                  </button>
                )}

                {activeChannel === 'whatsapp' && (
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-sm sm:text-base shadow-lg hover:shadow-emerald-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <WhatsAppLogo className="w-5 h-5" />
                    <span>{t('إرسال فوري عبر تطبيق واتساب (0552 267 7851)')}</span>
                  </button>
                )}

                {activeChannel === 'email' && (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-br from-[#0E4B87] to-[#0B2E57] hover:bg-[#0B2E57] text-white font-extrabold text-sm sm:text-base shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{submitting ? t('جارٍ الإرسال...') : t('إرسال من الموقع إلى بريد الإدارة')}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
