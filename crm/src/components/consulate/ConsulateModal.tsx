import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState, useEffect } from 'react';
import {
  ConsulateAppointment,
  ConsulateResponse,
  PaymentStatus,
  TimelineStage,
  SupportedCurrency,
  SUPPORTED_CURRENCIES,
  FlagColor,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Calendar, Phone, User, DollarSign, FileText, AlertTriangle, Tag, Bell } from 'lucide-react';
import { formatMoney, getQuickReminderDate } from '../../utils/formatters';

interface ConsulateModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem: ConsulateAppointment | null;
  presetStage?: TimelineStage;
}

export const ConsulateModal: React.FC<ConsulateModalProps> = ({
  isOpen,
  onClose,
  editItem,
  presetStage = 'registered',
}) => {
  const { ui } = useUITranslation();
  const {
    addConsulateAppointment,
    updateConsulateAppointment,
    systemLists,
    presetServiceType,
    setPresetServiceType,
    bookingContact,
  } = useApp();

  const [clientName, setClientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submissionDate, setSubmissionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [appointmentType, setAppointmentType] = useState<string>('تأشيرة سياحية');
  const [customAppointmentType, setCustomAppointmentType] = useState('');
  const [consulateResponse, setConsulateResponse] = useState<ConsulateResponse>('pending');
  const [missingDocsNotes, setMissingDocsNotes] = useState('');
  const [price, setPrice] = useState<number>(3000);
  const [currency, setCurrency] = useState<SupportedCurrency>('MAD');
  const [settlementCurrency, setSettlementCurrency] = useState<SupportedCurrency>('MAD');
  const [paymentChoice, setPaymentChoice] = useState<'paid' | 'unpaid' | 'partial'>('unpaid');
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [timelineStage, setTimelineStage] = useState<TimelineStage>(presetStage);
  const [flagColor, setFlagColor] = useState<FlagColor>('none');
  const [notes, setNotes] = useState('');

  // Reminder fields
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderDateTime, setReminderDateTime] = useState('');
  const [reminderReason, setReminderReason] = useState('');

  useEffect(() => {
    if (editItem) {
      setClientName(editItem.clientName);
      setPhoneNumber(editItem.phoneNumber);
      setSubmissionDate(editItem.submissionDate);
      setAppointmentType(editItem.appointmentType);
      setCustomAppointmentType(editItem.customAppointmentType || '');
      setConsulateResponse(editItem.consulateResponse);
      setMissingDocsNotes(editItem.missingDocsNotes || '');
      setPrice(editItem.price);
      setCurrency(editItem.currency || 'MAD');
      setSettlementCurrency(editItem.settlementCurrency || editItem.currency || 'MAD');
      setPaidAmount(editItem.paidAmount);
      setTimelineStage(editItem.timelineStage);
      setFlagColor(editItem.flagColor || 'none');
      setNotes(editItem.notes || '');

      if (editItem.paymentStatus === 'paid') {
        setPaymentChoice('paid');
      } else if (editItem.paidAmount > 0) {
        setPaymentChoice('partial');
      } else {
        setPaymentChoice('unpaid');
      }

      if (editItem.reminder && !editItem.reminder.isCompleted) {
        setEnableReminder(true);
        setReminderDateTime(editItem.reminder.targetDateTime);
        setReminderReason(editItem.reminder.reason);
      } else {
        setEnableReminder(false);
        setReminderDateTime('');
        setReminderReason('');
      }
    } else {
      setClientName(bookingContact?.name || '');
      setPhoneNumber(bookingContact?.phone || '+90');
      setSubmissionDate(new Date().toISOString().slice(0, 10));
      setAppointmentType(presetServiceType || systemLists.appointmentTypes[0] || 'تأشيرة سياحية');
      setCustomAppointmentType('');
      setConsulateResponse('pending');
      setMissingDocsNotes('');
      setPrice(bookingContact ? 0 : 3000);
      setCurrency('TRY');
      setSettlementCurrency('TRY');
      setPaymentChoice('unpaid');
      setPaidAmount(0);
      setTimelineStage(presetStage);
      setFlagColor('none');
      setNotes('');
      setEnableReminder(false);
      setReminderDateTime('');
      setReminderReason('');
    }
  }, [editItem, isOpen, bookingContact, presetStage, presetServiceType, systemLists.appointmentTypes]);

  if (!isOpen) return null;

  const calculatedPaidAmount =
    paymentChoice === 'paid' ? price : paymentChoice === 'unpaid' ? 0 : paidAmount;
  const calculatedRemaining = Math.max(0, price - calculatedPaidAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('يرجى كتابة اسم العميل الثلاثي');
      return;
    }
    if (!phoneNumber.trim()) {
      alert('يرجى إدخال رقم الهاتف أو الواتساب');
      return;
    }

    const payload: any = {
      contactId: editItem?.contactId ?? bookingContact?.id,
      clientName: clientName.trim(),
      phoneNumber: phoneNumber.trim(),
      submissionDate,
      appointmentType,
      customAppointmentType: appointmentType === 'أخرى' ? customAppointmentType.trim() : undefined,
      consulateResponse,
      missingDocsNotes: consulateResponse === 'missing_docs' ? missingDocsNotes.trim() : undefined,
      price: Number(price) || 0,
      currency,
      settlementCurrency,
      paidAmount: Number(calculatedPaidAmount) || 0,
      remainingAmount: Number(calculatedRemaining) || 0,
      paymentStatus:
        calculatedRemaining === 0 && calculatedPaidAmount > 0
          ? ('paid' as PaymentStatus)
          : calculatedPaidAmount > 0
          ? ('partial' as PaymentStatus)
          : ('unpaid' as PaymentStatus),
      timelineStage,
      flagColor,
      notes: notes.trim() || undefined,
    };

    if (enableReminder && reminderDateTime) {
      payload.reminder = {
        id: editItem?.reminder?.id || `rem-${Date.now()}`,
        targetDateTime: reminderDateTime,
        reason: reminderReason.trim() || 'تذكير متابعة',
        isCompleted: false,
        createdAt: editItem?.reminder?.createdAt || new Date().toISOString(),
      };
    } else if (!enableReminder) {
      payload.reminder = undefined;
    }

    if (editItem) {
      updateConsulateAppointment(editItem.id, payload);
    } else {
      addConsulateAppointment(payload);
    }

    setPresetServiceType(null);
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" data-crm-dialog="ConsulateModal" className="crm-dialog fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="crm-dialog-header bg-gradient-to-r from-[#004AA5] via-indigo-700 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {editItem ? ui("تعديل موعد قنصلية") : ui("إضافة موعد قنصلية جديد")}
              </h3>
              <p className="text-xs text-[#D7E7F7]">{ui("سجل بيانات الزبون، العملة المتفق عليها، وحالة السداد")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Client Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{ui("اسم العميل الثلاثي")}<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={ui("مثال: رشيد الفزني")}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-[#2A83D5] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{ui("رقم الهاتف / واتساب")}<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+212661234567"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-left focus:bg-white focus:ring-2 focus:ring-[#2A83D5] focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Appointment Specifics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{ui("تاريخ التقديم")}<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={submissionDate}
                  onChange={(e) => setSubmissionDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-[#2A83D5] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{ui("نوع الموعد المطلوب")}</label>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-[#2A83D5] focus:outline-none font-semibold text-slate-800"
              >
                {systemLists.appointmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {ui(type)}
                  </option>
                ))}
                <option value="أخرى">{ui("أخرى (تحديد مخصص)...")}</option>
              </select>
            </div>
          </div>

          {/* Custom type input if "أخرى" */}
          {appointmentType === 'أخرى' && (
            <div className="bg-[#eaf4ff]/60 p-3 rounded-xl border border-[#D7E7F7]">
              <label className="block text-xs font-bold text-[#0B2E57] mb-1">{ui("تحديد نوع الموعد المخصص:")}</label>
              <input
                type="text"
                value={customAppointmentType}
                onChange={(e) => setCustomAppointmentType(e.target.value)}
                placeholder={ui("مثال: تصديق شهادة جامعية أو حجز موعد عاجل")}
                className="w-full bg-white border border-[#B7CFEA] rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#2A83D5] focus:outline-none"
              />
            </div>
          )}

          {/* Section 3: Status, Stage & Flag */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{ui("رد القنصلية")}</label>
              <select
                value={consulateResponse}
                onChange={(e) => setConsulateResponse(e.target.value as ConsulateResponse)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-[#2A83D5] focus:outline-none font-bold"
              >
                <option value="pending">{ui("⏳ قيد الانتظار")}</option>
                <option value="accepted">{ui("✅ مقبول")}</option>
                <option value="rejected">{ui("❌ مرفوض")}</option>
                <option value="missing_docs">{ui("⚠️ نقص أوراق")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{ui("مرحلة الخط الزمني")}</label>
              <select
                value={timelineStage}
                onChange={(e) => setTimelineStage(e.target.value as TimelineStage)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-[#2A83D5] focus:outline-none font-bold"
              >
                <option value="registered">{ui("1. تم التسجيل / جديد")}</option>
                <option value="submitted">{ui("2. قيد المعالجة والقنصلية")}</option>
                <option value="response">{ui("3. بانتظار الرد / تم الرد")}</option>
                <option value="completed">{ui("4. انتهاء الخدمة")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{ui("علامة التمييز")}</label>
              <select
                value={flagColor}
                onChange={(e) => setFlagColor(e.target.value as FlagColor)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-[#2A83D5] focus:outline-none font-bold"
              >
                <option value="none">{ui("بدون تمييز")}</option>
                <option value="gold">{ui("🌟 توهج ذهبي (#E39622)")}</option>
                <option value="red">{ui("🚨 تنبيه أحمر (#EF4444)")}</option>
                <option value="star">{ui("⭐ نجمة مميزة")}</option>
                <option value="pin">{ui("📌 تثبيت بالدبوس")}</option>
              </select>
            </div>
          </div>

          {/* Missing docs notes */}
          {consulateResponse === 'missing_docs' && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1">
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />{ui("تفاصيل وملاحظات الأوراق الناقصة المطلوبة:")}</label>
              <textarea
                value={missingDocsNotes}
                onChange={(e) => setMissingDocsNotes(e.target.value)}
                rows={2}
                placeholder={ui("اكتب المستندات التي طلبتها القنصلية...")}
                className="w-full bg-white border border-amber-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          )}

          {/* Section 4: Multi-Currency Price & Payments */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />{ui("البيانات المالية وتعدد العملات")}</h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{ui("سعر الخدمة المتفق عليه")}</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#2A83D5] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{ui("عملة المعاملة المتفق عليها")}</label>
                <select
                  value={currency}
                  onChange={(e) => {
                    const c = e.target.value as SupportedCurrency;
                    setCurrency(c);
                    setSettlementCurrency(c);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#2A83D5] focus:outline-none"
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{ui("حالة الدفع")}</label>
                <select
                  value={paymentChoice}
                  onChange={(e) =>
                    setPaymentChoice(e.target.value as 'paid' | 'unpaid' | 'partial')
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#2A83D5] focus:outline-none"
                >
                  <option value="paid">{ui("مدفوع بالكامل")}</option>
                  <option value="unpaid">{ui("لم يدفع بعد (دين)")}</option>
                  <option value="partial">{ui("دفع جزئي")}</option>
                </select>
              </div>
            </div>

            {paymentChoice === 'partial' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{ui("المبلغ المدفوع حالياً:")}</label>
                  <input
                    type="number"
                    min="0"
                    max={price}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-2 focus:ring-[#2A83D5] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{ui("عملة التسديد الفعلي المستلمة:")}</label>
                  <select
                    value={settlementCurrency}
                    onChange={(e) => setSettlementCurrency(e.target.value as SupportedCurrency)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900"
                  >
                    {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Auto Calculation Preview */}
            <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-200 font-semibold">
              <span className="text-slate-600">{ui("المدفوع:")}{formatMoney(calculatedPaidAmount, settlementCurrency)}
              </span>
              <span className={`font-bold ${calculatedRemaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{ui("المتبقي (الدين):")}{formatMoney(calculatedRemaining, currency)}
              </span>
            </div>
          </div>

          {/* Section 5: Reminder Setup */}
          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableReminder}
                  onChange={(e) => {
                    setEnableReminder(e.target.checked);
                    if (e.target.checked && !reminderDateTime) {
                      setReminderDateTime(getQuickReminderDate('hour'));
                    }
                  }}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <Bell className="w-3.5 h-3.5 text-amber-600" />
                <span>{ui("تفعيل تذكير فوري مجدول لهذه المعاملة")}</span>
              </label>
            </div>

            {enableReminder && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-1">{ui("وقت التذكير:")}</label>
                  <input
                    type="datetime-local"
                    value={reminderDateTime}
                    onChange={(e) => setReminderDateTime(e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-lg p-1.5 text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-1">{ui("سبب التذكير:")}</label>
                  <input
                    type="text"
                    value={reminderReason}
                    onChange={(e) => setReminderReason(e.target.value)}
                    placeholder={ui("متابعة تسليم الجواز أو رد القنصلية...")}
                    className="w-full bg-white border border-amber-300 rounded-lg p-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{ui("ملاحظات إضافية")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={ui("أي ملاحظات أو مستندات خاصة...")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-[#2A83D5] focus:outline-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >{ui("إلغاء")}</button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#004AA5] hover:bg-[#2A83D5] shadow-sm transition"
            >
              {editItem ? ui("حفظ التعديلات") : ui("إنشاء المعاملة")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
