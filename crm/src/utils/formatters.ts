import { SupportedCurrency, SUPPORTED_CURRENCIES, ExchangeRates } from '../types';

export const ARABIC_MONTHS = [
  { value: 1, label: 'يناير (01)' },
  { value: 2, label: 'فبراير (02)' },
  { value: 3, label: 'مارس (03)' },
  { value: 4, label: 'أبريل (04)' },
  { value: 5, label: 'مايو (05)' },
  { value: 6, label: 'يونيو (06)' },
  { value: 7, label: 'يوليو (07)' },
  { value: 8, label: 'أغسطس (08)' },
  { value: 9, label: 'سبتمبر (09)' },
  { value: 10, label: 'أكتوبر (10)' },
  { value: 11, label: 'نوفمبر (11)' },
  { value: 12, label: 'ديسمبر (12)' },
];

export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.92,
  TRY: 34.5,
  MAD: 9.85,
};

export const getCurrencySymbol = (currency: SupportedCurrency = 'TRY'): string => {
  return currency === 'MAD' && typeof document !== 'undefined' && document.documentElement.lang !== 'ar' ? 'MAD' : SUPPORTED_CURRENCIES[currency]?.symbol || currency;
};

export const formatMoney = (amount: number, currency: SupportedCurrency = 'TRY'): string => {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);

  const symbol = getCurrencySymbol(currency);
  return `${formatted} ${symbol}`;
};

export const convertCurrency = (
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
  rates: ExchangeRates = DEFAULT_EXCHANGE_RATES
): number => {
  if (from === to) return amount;
  const rateFrom = rates[from] || 1;
  const rateTo = rates[to] || 1;
  // Convert from 'from' to USD, then from USD to 'to'
  const inUSD = amount / rateFrom;
  return inUSD * rateTo;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '—';
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateString) ? dateString + 'T12:00:00' : dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const language = typeof document === 'undefined' ? 'ar' : document.documentElement.lang;
  return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : language === 'en' ? 'en-GB' : 'ar-MA', {day:'numeric', month:'short', year:'numeric'}).format(date);
};

export const formatDateTime = (isoString: string): string => {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    const lang = typeof document === 'undefined' ? 'ar' : document.documentElement.lang;
    const timeStr = date.toLocaleTimeString(lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `${lang === 'ar' ? 'اليوم،' : lang === 'fr' ? 'Aujourd’hui,' : 'Today,'} ${timeStr}`;
    if (isTomorrow) return `${lang === 'ar' ? 'غداً،' : lang === 'fr' ? 'Demain,' : 'Tomorrow,'} ${timeStr}`;

    return `${formatDate(isoString.slice(0, 10))} (${timeStr})`;
  } catch {
    return isoString;
  }
};

export const getQuickReminderDate = (
  type: 'hour' | 'today_evening' | 'tomorrow_morning' | 'next_week'
): string => {
  const d = new Date();
  switch (type) {
    case 'hour':
      d.setHours(d.getHours() + 1);
      break;
    case 'today_evening':
      d.setHours(19, 0, 0, 0);
      if (d.getTime() < Date.now()) {
        d.setDate(d.getDate() + 1);
      }
      break;
    case 'tomorrow_morning':
      d.setDate(d.getDate() + 1);
      d.setHours(9, 30, 0, 0);
      break;
    case 'next_week':
      d.setDate(d.getDate() + 7);
      d.setHours(10, 0, 0, 0);
      break;
  }
  // Format as YYYY-MM-DDTHH:mm
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Two-tone bell chime
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {
    // Audio might be blocked by autoplay policies until user clicks
    console.warn('Audio chime ignored:', e);
  }
};

export const OFFICIAL_BANK_ACCOUNTS = {
  accountHolder: 'RACHID EL FAZNI',
  ibanTRY: 'TR490020500009720667500001',
  ibanUSD: 'TR490020500009720667500101',
};

const messageCopy = (ar: string, en: string, fr: string): string => {
  const lang = typeof document === 'undefined' ? 'ar' : document.documentElement.lang;
  return lang === 'fr' ? fr : lang === 'en' ? en : ar;
};

export const getBankDetailsCopyText = (): string => [
  messageCopy('بيانات التحويل البنكي — الفزني للخدمات','Bank transfer details — ELFAZNI SERVICES','Coordonnées de virement — ELFAZNI SERVICES'),
  `${messageCopy('صاحب الحساب','Account holder','Titulaire')} : ${OFFICIAL_BANK_ACCOUNTS.accountHolder}`,
  `IBAN TRY: ${OFFICIAL_BANK_ACCOUNTS.ibanTRY}`,
  `IBAN USD: ${OFFICIAL_BANK_ACCOUNTS.ibanUSD}`,
  messageCopy('يرجى إرسال إيصال التحويل بعد السداد عبر واتساب: +90 552 267 78 51','Please send the transfer receipt via WhatsApp: +90 552 267 78 51','Merci d’envoyer le justificatif de virement sur WhatsApp : +90 552 267 78 51'),
].join('\n');

export const generateWhatsAppLink = (
  phone: string,
  clientName: string,
  debtAmount: number,
  details: string,
  currency: SupportedCurrency = 'TRY'
): string => {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  // Turkey local mobile: 0552... -> 90552...
  if (cleaned.startsWith('05') && cleaned.length === 11) {
    cleaned = '90' + cleaned.substring(1);
  } else if (cleaned.startsWith('5') && cleaned.length === 10) {
    cleaned = '90' + cleaned;
  }
  // Morocco local mobile: 06... / 07... -> 2126... / 2127...
  else if ((cleaned.startsWith('06') || cleaned.startsWith('07')) && cleaned.length === 10) {
    cleaned = '212' + cleaned.substring(1);
  }

  const amount = formatMoney(debtAmount, currency);
  const message = [
    messageCopy(`مرحبًا ${clientName}،`,`Hello ${clientName},`,`Bonjour ${clientName},`),
    messageCopy('معك فريق الفزني للخدمات — إسطنبول.','This is the ELFAZNI SERVICES team in Istanbul.','Ici l’équipe ELFAZNI SERVICES à Istanbul.'),
    debtAmount > 0
      ? messageCopy(`نذكّركم بالمبلغ المتبقي لمعاملتكم (${details}): ${amount}.`,`A reminder of the outstanding amount for your service (${details}): ${amount}.`,`Rappel du solde de votre dossier (${details}) : ${amount}.`)
      : messageCopy(`بخصوص معاملتكم (${details}).`,`Regarding your service (${details}).`,`Concernant votre dossier (${details}).`),
    '',
    getBankDetailsCopyText(),
    '',
    messageCopy('شكرًا لثقتكم. يسعدنا الرد على استفساراتكم.','Thank you for your trust. We are happy to answer your questions.','Merci de votre confiance. Nous restons à votre disposition.'),
  ].join('\n');

  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
};

export const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const BOM = '\uFEFF';
  const csvContent =
    BOM +
    [
      headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const val = cell !== undefined && cell !== null ? String(cell) : '';
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
