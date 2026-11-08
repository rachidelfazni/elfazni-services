import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Maximize2,
  User,
  Phone,
  Calendar,
  DollarSign,
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Plane,
  Tag,
  Bell,
  Trash2,
  Copy,
  Edit,
  ExternalLink,
  Check,
} from 'lucide-react';
import {
  formatMoney,
  formatDate,
  formatDateTime,
  generateWhatsAppLink,
  OFFICIAL_BANK_ACCOUNTS,
} from '../../utils/formatters';
import { FlagColor } from '../../types';
import { FazniLogo } from '../common/FazniLogo';

export const CardSpotlightModal: React.FC = () => {
  const { ui } = useUITranslation();
  const {
    spotlightItem,
    setSpotlightItem,
    setItemFlag,
    setReminderModalTarget,
    deleteConsulateAppointment,
    deleteFlightBooking,
    duplicateConsulateAppointment,
    duplicateFlightBooking,
    settleConsulatePayment,
    settleFlightPayment,
    setEditingConsulate,
    setIsConsulateModalOpen,
    setEditingFlight,
    setIsFlightModalOpen,
  } = useApp();

  const [copiedIban, setCopiedIban] = useState<string | null>(null);

  if (!spotlightItem) return null;

  const handleCopyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIban(key);
    setTimeout(() => setCopiedIban(null), 2000);
  };

  const { type, item } = spotlightItem;
  const isConsulate = type === 'consulate';

  const waLink = generateWhatsAppLink(
    item.phoneNumber,
    item.clientName,
    item.remainingAmount,
    isConsulate
      ? (item as any).appointmentType
      : `تذكرة PNR: ${(item as any).pnr}`,
    item.currency
  );

  const handleEdit = () => {
    if (isConsulate) {
      setEditingConsulate(item as any);
      setIsConsulateModalOpen(true);
    } else {
      setEditingFlight(item as any);
      setIsFlightModalOpen(true);
    }
    setSpotlightItem(null);
  };

  const handleDuplicate = () => {
    if (isConsulate) {
      duplicateConsulateAppointment(item.id);
    } else {
      duplicateFlightBooking(item.id);
    }
    setSpotlightItem(null);
  };

  const handleDelete = () => {
    if (window.confirm(`هل أنت متأكد من حذف معاملة العميل "${item.clientName}"؟`)) {
      if (isConsulate) {
        deleteConsulateAppointment(item.id);
      } else {
        deleteFlightBooking(item.id);
      }
      setSpotlightItem(null);
    }
  };

  const handleSettle = () => {
    if (isConsulate) {
      settleConsulatePayment(item.id);
    } else {
      settleFlightPayment(item.id);
    }
  };

  const handleSetFlag = (flag: FlagColor) => {
    setItemFlag(type, item.id, flag);
    setSpotlightItem({ ...spotlightItem, item: { ...item, flagColor: flag } });
  };

  const flagOptions: { color: FlagColor; label: string; bg: string; border: string }[] = [
    { color: 'none', label: 'بدون تمييز', bg: 'bg-slate-100', border: 'border-slate-200' },
    { color: 'gold', label: 'توهج ذهبي 🌟', bg: 'bg-amber-100 text-amber-900', border: 'border-amber-400' },
    { color: 'red', label: 'تنبيه أحمر 🚨', bg: 'bg-rose-100 text-rose-900', border: 'border-rose-400' },
    { color: 'star', label: 'نجمة مميزة ⭐', bg: 'bg-yellow-100 text-yellow-900', border: 'border-yellow-400' },
    { color: 'pin', label: 'تثبيت بالدبوس 📌', bg: 'bg-[#D7E7F7] text-[#0B2E57]', border: 'border-[#4083D0]' },
  ];

  return (
    <div role="dialog" aria-modal="true" data-crm-dialog="CardSpotlightModal" className="crm-dialog fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <FazniLogo size="sm" showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  {item.id}
                </span>
                <span className="text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold">
                  {isConsulate ? ui("معاملة قنصلية") : ui("حجز طيران")}
                </span>
              </div>
              <h3 className="font-bold text-lg text-white mt-0.5">{item.clientName}</h3>
            </div>
          </div>

          <button
            onClick={() => setSpotlightItem(null)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Action Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            {/* Flag Picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />{ui("العلامة:")}</span>
              <div className="flex gap-1">
                {flagOptions.map((f) => (
                  <button
                    key={f.color}
                    onClick={() => handleSetFlag(f.color)}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold border transition ${
                      item.flagColor === f.color ? `${f.bg} ${f.border} ring-1` : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {ui(f.label)}
                  </button>
                ))}
              </div>
            </div>

            {/* Set Reminder Button */}
            <button
              onClick={() => {
                setReminderModalTarget({
                  type,
                  id: item.id,
                  clientName: item.clientName,
                  currentReminder: item.reminder,
                });
              }}
              className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
            >
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>{item.reminder ? ui("تعديل التذكير") : ui("+ تعيين تذكير")}</span>
            </button>
          </div>

          {/* Active Reminder Banner */}
          {item.reminder && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2">
                <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">{ui("تذكير مجدول:")}{formatDateTime(item.reminder.targetDateTime)}
                  </p>
                  <p className="text-amber-800 mt-0.5">{item.reminder.reason}</p>
                </div>
              </div>
              <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {item.reminder.isCompleted ? ui("تم الإنجاز ✅") : ui("قيد الانتظار ⏳")}
              </span>
            </div>
          )}

          {/* Client & Service Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-700">{ui("بيانات الاتصال والتواصل")}</h4>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{ui("رقم الهاتف:")}</span>
                <a
                  href={`tel:${item.phoneNumber}`}
                  className="font-mono font-bold text-slate-800 hover:text-[#004AA5]"
                  dir="ltr"
                >
                  {item.phoneNumber}
                </a>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{ui("محادثة واتساب مباشرة")}</span>
                </a>
              </div>
            </div>

            {/* Service Details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-700">{ui("تفاصيل الخدمة")}</h4>
              {isConsulate ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{ui("نوع الموعد:")}</span>
                    <span className="font-bold text-slate-800">
                      {(item as any).appointmentType === 'أخرى' && (item as any).customAppointmentType
                        ? (item as any).customAppointmentType
                        : (item as any).appointmentType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{ui("رد القنصلية:")}</span>
                    <span className="font-bold">{(item as any).consulateResponse}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{ui("رقم الحجز (PNR):")}</span>
                    <span className="font-mono font-bold text-slate-900">{(item as any).pnr}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{ui("الشركة والمسار:")}</span>
                    <span className="font-bold text-slate-800 truncate max-w-[150px]">
                      {(item as any).airlineAndRoute}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Financial Breakdown Card */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-400">{ui("البيانات المالية وعملة التسديد")}</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 block">{ui("سعر الخدمة / البيع")}</span>
                <span className="text-sm font-bold text-white">
                  {formatMoney(
                    isConsulate ? (item as any).price : (item as any).sellingPrice,
                    item.currency
                  )}
                </span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                <span className="text-[10px] text-emerald-400 block">{ui("المبلغ المدفوع")}</span>
                <span className="text-sm font-bold text-emerald-400">
                  {formatMoney(item.paidAmount, item.settlementCurrency || item.currency)}
                </span>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                <span className="text-[10px] text-rose-400 block">{ui("المبلغ المتبقي")}</span>
                <span className="text-sm font-bold text-rose-400">
                  {formatMoney(item.remainingAmount, item.currency)}
                </span>
              </div>
            </div>

            {/* Bank Accounts for Settlement */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-amber-300 font-bold">{ui("🏦 الحساب البنكي للسداد (")}{OFFICIAL_BANK_ACCOUNTS.accountHolder}):
                </span>
                <button
                  onClick={() => handleCopyText('name', OFFICIAL_BANK_ACCOUNTS.accountHolder)}
                  className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedIban === 'name' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{ui("نسخ الاسم")}</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => handleCopyText('try', OFFICIAL_BANK_ACCOUNTS.ibanTRY)}
                  className="flex items-center justify-between bg-slate-900/90 hover:bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-[11px] transition cursor-pointer"
                >
                  <span className="text-[#8FBAEE] font-bold">TRY:</span>
                  <span className="font-mono text-slate-200" dir="ltr">
                    {OFFICIAL_BANK_ACCOUNTS.ibanTRY}
                  </span>
                  {copiedIban === 'try' ? (
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </button>
                <button
                  onClick={() => handleCopyText('usd', OFFICIAL_BANK_ACCOUNTS.ibanUSD)}
                  className="flex items-center justify-between bg-slate-900/90 hover:bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-lg text-[11px] transition cursor-pointer"
                >
                  <span className="text-emerald-400 font-bold">USD:</span>
                  <span className="font-mono text-slate-200" dir="ltr">
                    {OFFICIAL_BANK_ACCOUNTS.ibanUSD}
                  </span>
                  {copiedIban === 'usd' ? (
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {item.remainingAmount > 0 && (
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-700/80 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{ui("إرسال مطالبة سداد مع الـ IBAN واتساب")}</span>
                </a>
                <button
                  onClick={handleSettle}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>{ui("تسديد المتبقي بالكامل الآن")}</span>
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          {item.notes && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <h4 className="text-xs font-bold text-slate-700">{ui("الملاحظات المسجلة:")}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{item.notes}</p>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                onClick={handleDuplicate}
                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{ui("تكرار المعاملة (Duplicate)")}</span>
              </button>

              <button
                onClick={handleDelete}
                className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-xl text-xs font-semibold transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{ui("حذف")}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSpotlightItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >{ui("إغلاق")}</button>
              <button
                onClick={handleEdit}
                className="flex items-center gap-1 bg-[#004AA5] hover:bg-[#2A83D5] text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>{ui("تعديل كامل ✏️")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
