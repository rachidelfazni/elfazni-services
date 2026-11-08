import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState, useEffect } from 'react';
import {
  FlightBooking,
  SupportedCurrency,
  SUPPORTED_CURRENCIES,
  FlagColor,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Plane, User, Phone, Calendar, DollarSign, TrendingUp, CreditCard, Bell, Tag } from 'lucide-react';
import { formatMoney, convertCurrency, getQuickReminderDate } from '../../utils/formatters';

interface FlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem: FlightBooking | null;
}

export const FlightModal: React.FC<FlightModalProps> = ({ isOpen, onClose, editItem }) => {
  const { ui } = useUITranslation();
  const { addFlightBooking, updateFlightBooking, systemLists, exchangeRates, bookingContact,
  } = useApp();

  const [clientName, setClientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pnr, setPnr] = useState('');
  const [airlineAndRoute, setAirlineAndRoute] = useState('');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [cost, setCost] = useState<number>(3500);
  const [costCurrency, setCostCurrency] = useState<SupportedCurrency>('MAD');
  const [sellingPrice, setSellingPrice] = useState<number>(4200);
  const [currency, setCurrency] = useState<SupportedCurrency>('MAD');
  const [settlementCurrency, setSettlementCurrency] = useState<SupportedCurrency>('MAD');
  const [paymentMethod, setPaymentMethod] = useState<string>('كاش / نقداً');
  const [paidChoice, setPaidChoice] = useState<'full' | 'zero' | 'custom'>('full');
  const [customPaidAmount, setCustomPaidAmount] = useState<number>(0);
  const [flagColor, setFlagColor] = useState<FlagColor>('none');
  const [notes, setNotes] = useState('');

  // Reminders
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderDateTime, setReminderDateTime] = useState('');
  const [reminderReason, setReminderReason] = useState('');

  useEffect(() => {
    if (editItem) {
      setClientName(editItem.clientName);
      setPhoneNumber(editItem.phoneNumber);
      setPnr(editItem.pnr);
      setAirlineAndRoute(editItem.airlineAndRoute);
      setBookingDate(editItem.bookingDate);
      setCost(editItem.cost);
      setCostCurrency(editItem.costCurrency || 'MAD');
      setSellingPrice(editItem.sellingPrice);
      setCurrency(editItem.currency || 'MAD');
      setSettlementCurrency(editItem.settlementCurrency || editItem.currency || 'MAD');
      setPaymentMethod(editItem.paymentMethod);
      setFlagColor(editItem.flagColor || 'none');
      setNotes(editItem.notes || '');

      if (editItem.paymentStatus === 'paid') {
        setPaidChoice('full');
      } else if (editItem.paidAmount > 0) {
        setPaidChoice('custom');
        setCustomPaidAmount(editItem.paidAmount);
      } else {
        setPaidChoice('zero');
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
      setPhoneNumber(bookingContact?.phone || '+212');
      setPnr('');
      setAirlineAndRoute('');
      setBookingDate(new Date().toISOString().slice(0, 10));
      setCost(bookingContact ? 0 : 3500);
      setCostCurrency('MAD');
      setSellingPrice(bookingContact ? 0 : 4200);
      setCurrency('MAD');
      setSettlementCurrency('MAD');
      setPaymentMethod(systemLists.paymentMethods[0] || 'كاش / نقداً');
      setPaidChoice(bookingContact ? 'zero' : 'full');
      setCustomPaidAmount(0);
      setFlagColor('none');
      setNotes('');
      setEnableReminder(false);
      setReminderDateTime('');
      setReminderReason('');
    }
  }, [editItem, isOpen, bookingContact, systemLists.paymentMethods]);

  if (!isOpen) return null;

  // Auto Calculations with currency conversion if cost currency != selling currency
  const convertedCostInSellingCurr =
    costCurrency === currency
      ? cost
      : convertCurrency(cost, costCurrency, currency, exchangeRates);

  const calculatedNetProfit = Math.max(-100000, Number(sellingPrice) - convertedCostInSellingCurr);

  let calculatedPaid = 0;
  if (paidChoice === 'full') {
    calculatedPaid = Number(sellingPrice);
  } else if (paidChoice === 'zero') {
    calculatedPaid = 0;
  } else {
    calculatedPaid = Number(customPaidAmount);
  }
  const calculatedRemaining = Math.max(0, Number(sellingPrice) - calculatedPaid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('يرجى كتابة اسم المسافر أو العميل');
      return;
    }
    if (!pnr.trim()) {
      alert('يرجى كتابة رقم الحجز PNR');
      return;
    }
    if (!airlineAndRoute.trim()) {
      alert('يرجى كتابة اسم شركة الطيران والوجهة أو خط السير');
      return;
    }

    const payload: any = {
      contactId: editItem?.contactId ?? bookingContact?.id,
      clientName: clientName.trim(),
      phoneNumber: phoneNumber.trim(),
      pnr: pnr.trim().toUpperCase(),
      airlineAndRoute: airlineAndRoute.trim(),
      bookingDate,
      cost: Number(cost) || 0,
      costCurrency,
      sellingPrice: Number(sellingPrice) || 0,
      currency,
      settlementCurrency,
      paymentMethod,
      paidAmount: calculatedPaid,
      flagColor,
      notes: notes.trim() || undefined,
    };

    if (enableReminder && reminderDateTime) {
      payload.reminder = {
        id: editItem?.reminder?.id || `rem-${Date.now()}`,
        targetDateTime: reminderDateTime,
        reason: reminderReason.trim() || 'تذكير حجز طيران',
        isCompleted: false,
        createdAt: editItem?.reminder?.createdAt || new Date().toISOString(),
      };
    } else if (!enableReminder) {
      payload.reminder = undefined;
    }

    if (editItem) {
      updateFlightBooking(editItem.id, payload);
    } else {
      addFlightBooking(payload);
    }

    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" data-crm-dialog="FlightModal" className="crm-dialog fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="crm-dialog-header bg-gradient-to-r from-[#0B2E57] via-[#004AA5] to-[#07203C] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {editItem ? ui("تعديل حجز طيران") : ui("تسجيل حجز طيران جديد")}
              </h3>
              <p className="text-xs text-emerald-100">{ui("تسجيل سعر الشراء وسعر البيع بالعملة المناسبة وحساب الأرباح والديون تلقائياً")}</p>
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
          {/* Client & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{ui("اسم المسافر / العميل")}<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={ui("مثال: سفيان المراكشي")}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  placeholder="+212663998877"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-left focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{ui("رقم الحجز (PNR)")}<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={pnr}
                onChange={(e) => setPnr(e.target.value.toUpperCase())}
                placeholder={ui("مثال: AT-8820B")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">{ui("شركة الطيران والوجهة / المسار")}<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={airlineAndRoute}
                onChange={(e) => setAirlineAndRoute(e.target.value)}
                placeholder={ui("مثال: الخطوط الملكية المغربية - كازا إلى إسطنبول")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Booking Date, Payment Method & Flag */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{ui("تاريخ الحجز / السفر")}<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{ui("طريقة الدفع")}</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
              >
                {systemLists.paymentMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{ui("علامة التمييز")}</label>
              <select
                value={flagColor}
                onChange={(e) => setFlagColor(e.target.value as FlagColor)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
              >
                <option value="none">{ui("بدون تمييز")}</option>
                <option value="gold">{ui("🌟 توهج ذهبي (#E39622)")}</option>
                <option value="red">{ui("🚨 تنبيه أحمر (#EF4444)")}</option>
                <option value="star">{ui("⭐ نجمة مميزة")}</option>
                <option value="pin">{ui("📌 تثبيت دبوس")}</option>
              </select>
            </div>
          </div>

          {/* Pricing & Automatic Profit Section with Currency Pickers */}
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-3">
            <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />{ui("حساب التكلفة وسعر البيع وصافي الربح بالعملات")}</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cost Block */}
              <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">{ui("سعر التكلفة (سعر الشراء من المزود)")}</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value) || 0)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                  <select
                    value={costCurrency}
                    onChange={(e) => setCostCurrency(e.target.value as SupportedCurrency)}
                    className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold"
                  >
                    {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selling Price Block */}
              <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">{ui("سعر البيع للزبون (المتفق عليه)")}</span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value) || 0)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                  />
                  <select
                    value={currency}
                    onChange={(e) => {
                      const c = e.target.value as SupportedCurrency;
                      setCurrency(c);
                      setSettlementCurrency(c);
                    }}
                    className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-bold"
                  >
                    {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Calculated Profit Banner */}
            <div className="bg-white p-3 rounded-xl border border-emerald-300 flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-900">{ui("صافي الربح التلقائي (")}{currency}):
              </span>
              <span className="text-emerald-700 text-sm font-black">
                {formatMoney(calculatedNetProfit, currency)}
              </span>
            </div>
          </div>

          {/* Payment Status & Debt Calculation */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[#004AA5]" />{ui("حالة السداد والتحصيل الفعلي")}</h4>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaidChoice('full')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                  paidChoice === 'full'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >{ui("مدفوع بالكامل")}</button>
              <button
                type="button"
                onClick={() => setPaidChoice('custom')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                  paidChoice === 'custom'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >{ui("دفع جزئي")}</button>
              <button
                type="button"
                onClick={() => setPaidChoice('zero')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition ${
                  paidChoice === 'zero'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >{ui("لم يدفع (دين كامل)")}</button>
            </div>

            {paidChoice === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{ui("المبلغ المستلم فعلياً:")}</label>
                  <input
                    type="number"
                    min="0"
                    max={sellingPrice}
                    value={customPaidAmount}
                    onChange={(e) => setCustomPaidAmount(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">{ui("عملة الدفع المستلمة:")}</label>
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

            {/* Remaining / Debt Notice */}
            <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-200 font-semibold">
              <span className="text-slate-600">{ui("المحصل:")}{formatMoney(calculatedPaid, settlementCurrency)}
              </span>
              <span className={`font-bold ${calculatedRemaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {calculatedRemaining > 0
                  ? `المتبقي (الدين): ${formatMoney(calculatedRemaining, currency)}`
                  : ui("تم السداد بالكامل 100%")}
              </span>
            </div>
          </div>

          {/* Reminder Section */}
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
                <span>{ui("تفعيل تذكير فوري مجدول لهذا الحجز")}</span>
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
                    placeholder={ui("متابعة استلام التحويل، إصدار التذكرة...")}
                    className="w-full bg-white border border-amber-300 rounded-lg p-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{ui("ملاحظات الحجز")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={ui("مثال: مقاعد، أمتعة إضافية...")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >{ui("إلغاء")}</button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition"
            >
              {editItem ? ui("حفظ التعديلات") : ui("تسجيل التذكرة")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
