import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState } from 'react';
import {
  ConsulateAppointment,
  TimelineStage,
  ConsulateResponse,
  FlagColor,
  SupportedCurrency,
} from '../../types';
import { useApp } from '../../context/AppContext';
import {
  formatMoney,
  formatDate,
  formatDateTime,
  generateWhatsAppLink,
} from '../../utils/formatters';
import {
  User,
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  MessageCircle,
  FileEdit,
  Trash2,
  ChevronDown,
  AlertOctagon,
  Maximize2,
  Bell,
  Star,
  Pin,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Check,
} from 'lucide-react';

interface TimelineCardProps {
  item: ConsulateAppointment;
  onEdit: (item: ConsulateAppointment) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export const TimelineCard: React.FC<TimelineCardProps> = ({
  item,
  onEdit,
  onMoveUp,
  onMoveDown,
}) => {
  const { ui, isRTL } = useUITranslation();
  const {
    moveTimelineStage,
    updateConsulateResponse,
    settleConsulatePayment,
    deleteConsulateAppointment,
    setItemFlag,
    setSpotlightItem,
    setReminderModalTarget,
    inlineUpdateConsulate,
    timelineViewMode,
  } = useApp();

  const [showResponseMenu, setShowResponseMenu] = useState(false);
  const [showFlagMenu, setShowFlagMenu] = useState(false);

  // Inline editing states (double-click)
  const [editingField, setEditingField] = useState<'name' | 'price' | null>(null);
  const [tempName, setTempName] = useState(item.clientName);
  const [tempPrice, setTempPrice] = useState(item.price);

  // Completed but unpaid warning check
  const isCompletedUnpaid =
    item.timelineStage === 'completed' &&
    (item.paymentStatus === 'unpaid' ||
      item.paymentStatus === 'partial' ||
      item.remainingAmount > 0);

  const stages: TimelineStage[] = ['registered', 'submitted', 'response', 'completed'];
  const currentStageIndex = stages.indexOf(item.timelineStage);

  const handleNextStage = () => {
    if (currentStageIndex < stages.length - 1) {
      moveTimelineStage(item.id, stages[currentStageIndex + 1]);
    }
  };

  const handlePrevStage = () => {
    if (currentStageIndex > 0) {
      moveTimelineStage(item.id, stages[currentStageIndex - 1]);
    }
  };

  const handleSetResponse = (res: ConsulateResponse) => {
    updateConsulateResponse(item.id, res);
    setShowResponseMenu(false);
  };

  const handleSaveInline = () => {
    if (editingField === 'name' && tempName.trim()) {
      inlineUpdateConsulate(item.id, 'clientName', tempName.trim());
    } else if (editingField === 'price') {
      inlineUpdateConsulate(item.id, 'price', Number(tempPrice) || 0);
    }
    setEditingField(null);
  };

  // Flag styles: golden glow or alert red with visual pulse
  const getFlagClasses = () => {
    switch (item.flagColor) {
      case 'gold':
        return 'border-[#E39622] ring-2 ring-[#E39622]/40 shadow-lg shadow-[#E39622]/15';
      case 'red':
        return 'border-[#EF4444] ring-2 ring-[#EF4444]/40 shadow-lg shadow-[#EF4444]/20 animate-pulse';
      case 'star':
        return 'border-yellow-400 ring-2 ring-yellow-300/40 bg-yellow-50/10';
      case 'pin':
        return 'border-[#2A83D5] ring-2 ring-[#82B1E4]/40';
      default:
        return 'border-slate-200/90 hover:border-slate-300';
    }
  };

  const getResponseBadge = () => {
    switch (item.consulateResponse) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />{ui("مقبول")}</span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3" />{ui("مرفوض")}</span>
        );
      case 'missing_docs':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />{ui("نقص أوراق")}</span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3" />{ui("قيد الانتظار")}</span>
        );
    }
  };

  const appointmentLabel =
    item.appointmentType === 'أخرى' && item.customAppointmentType
      ? item.customAppointmentType
      : item.appointmentType;

  const waLink = generateWhatsAppLink(
    item.phoneNumber,
    item.clientName,
    item.remainingAmount,
    appointmentLabel,
    item.currency
  );

  const hasActiveReminder = item.reminder && !item.reminder.isCompleted;

  // Drag start handler for Kanban
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, stage: item.timelineStage }));
  };

  return (
    <div
      draggable
      data-timeline-card={item.id}
      onDragStart={handleDragStart}
      className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing relative overflow-hidden group ${getFlagClasses()} ${
        isCompletedUnpaid ? 'border-2 border-red-500 ring-2 ring-red-100' : ''
      }`}
    >
      {/* Flag / Pin Decorative Ribbon */}
      {item.flagColor && item.flagColor !== 'none' && (
        <div
          className={`h-1.5 w-full ${
            item.flagColor === 'gold'
              ? 'bg-[#E39622]'
              : item.flagColor === 'red'
              ? 'bg-[#EF4444]'
              : item.flagColor === 'star'
              ? 'bg-yellow-400'
              : 'bg-[#2A83D5]'
          }`}
        />
      )}

      {/* Alert Header if Completed Unpaid */}
      {isCompletedUnpaid && (
        <div className="bg-red-500 text-white px-3 py-1.5 text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 animate-pulse" />{ui("خدمة منتهية معلقة بالدين!")}</span>
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-white font-mono text-[11px]">
            {formatMoney(item.remainingAmount, item.currency)}
          </span>
        </div>
      )}

      <div className={`${timelineViewMode === 'compact' ? 'p-3 space-y-2' : 'p-4 space-y-3'}`}>
        {/* Top: Drag handle, Client Name (Double-click to edit), and Spotlight */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-1.5 flex-1 min-w-0">
            <div className="text-slate-300 hover:text-slate-600 mt-1 cursor-grab" title={ui("اسحب لتحريك البطاقة")}>
              <GripVertical className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              {editingField === 'name' ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveInline()}
                    className="w-full text-xs font-bold border border-[#2A83D5] rounded px-1.5 py-0.5 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveInline}
                    className="p-1 bg-[#004AA5] text-white rounded text-[10px]"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <h4
                  onDoubleClick={() => {
                    setTempName(item.clientName);
                    setEditingField('name');
                  }}
                  title={ui("انقر نقراً مزدوجاً للتعديل السريع للاسم")}
                  className="font-extrabold text-slate-900 text-sm leading-snug truncate hover:text-[#004AA5] cursor-pointer"
                >
                  {item.clientName}
                </h4>
              )}

              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                <span className="font-semibold text-[#004AA5] bg-[#eaf4ff] px-2 py-0.5 rounded text-[10px]">
                  {ui(appointmentLabel)}
                </span>
                <span className="flex items-center gap-1 text-[10px]">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {formatDate(item.submissionDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Icons: Spotlight, Flag, Edit, Delete */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Spotlight Zoom */}
            <button
              onClick={() => setSpotlightItem({ type: 'consulate', item })}
              title={ui("تكبير البطاقة وعرض كامل التفاصيل (Spotlight)")}
              className="p-1 text-slate-400 hover:text-[#004AA5] hover:bg-[#eaf4ff] rounded-lg transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Set Reminder */}
            <button
              onClick={() =>
                setReminderModalTarget({
                  type: 'consulate',
                  id: item.id,
                  clientName: item.clientName,
                  currentReminder: item.reminder,
                })
              }
              title={item.reminder ? 'تعديل التذكير' : 'تعيين تذكير 🔔'}
              className={`p-1 rounded-lg transition ${
                hasActiveReminder
                  ? 'text-amber-500 hover:bg-amber-50'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
            </button>

            {/* Flag Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowFlagMenu(!showFlagMenu)}
                title={ui("تمييز البطاقة بعلامة")}
                className={`p-1 rounded-lg transition ${
                  item.flagColor && item.flagColor !== 'none'
                    ? 'text-[#E39622] hover:bg-amber-50'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.flagColor === 'star' ? (
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                ) : item.flagColor === 'pin' ? (
                  <Pin className="w-3.5 h-3.5 fill-blue-500 text-[#2A83D5]" />
                ) : (
                  <Pin className="w-3.5 h-3.5" />
                )}
              </button>

              {showFlagMenu && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 text-xs">
                  <button
                    onClick={() => {
                      setItemFlag('consulate', item.id, 'none');
                      setShowFlagMenu(false);
                    }}
                    className="w-full text-right px-2.5 py-1.5 hover:bg-slate-50 text-slate-600"
                  >{ui("بدون تمييز")}</button>
                  <button
                    onClick={() => {
                      setItemFlag('consulate', item.id, 'gold');
                      setShowFlagMenu(false);
                    }}
                    className="w-full text-right px-2.5 py-1.5 hover:bg-amber-50 text-[#E39622] font-bold flex items-center gap-1.5"
                  >
                    <span>{ui("🌟 توهج ذهبي")}</span>
                  </button>
                  <button
                    onClick={() => {
                      setItemFlag('consulate', item.id, 'red');
                      setShowFlagMenu(false);
                    }}
                    className="w-full text-right px-2.5 py-1.5 hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-1.5"
                  >
                    <span>{ui("🚨 تنبيه أحمر")}</span>
                  </button>
                  <button
                    onClick={() => {
                      setItemFlag('consulate', item.id, 'star');
                      setShowFlagMenu(false);
                    }}
                    className="w-full text-right px-2.5 py-1.5 hover:bg-yellow-50 text-yellow-700 font-bold flex items-center gap-1.5"
                  >
                    <span>{ui("⭐ نجمة")}</span>
                  </button>
                  <button
                    onClick={() => {
                      setItemFlag('consulate', item.id, 'pin');
                      setShowFlagMenu(false);
                    }}
                    className="w-full text-right px-2.5 py-1.5 hover:bg-[#eaf4ff] text-[#004AA5] font-bold flex items-center gap-1.5"
                  >
                    <span>{ui("📌 تثبيت دبوس")}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Edit modal */}
            <button
              onClick={() => onEdit(item)}
              title={ui("تعديل كامل للاستمارة")}
              className="p-1 text-slate-400 hover:text-[#004AA5] hover:bg-slate-100 rounded-lg transition"
            >
              <FileEdit className="w-3.5 h-3.5" />
            </button>

            {/* Delete */}
            <button
              onClick={() => {
                if (window.confirm(`هل أنت متأكد من حذف معاملة العميل "${item.clientName}"؟`)) {
                  deleteConsulateAppointment(item.id);
                }
              }}
              title={ui("حذف")}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Reminder alert banner if set */}
        {hasActiveReminder && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-2 text-xs flex items-center justify-between text-amber-900">
            <span className="flex items-center gap-1 font-bold text-[11px]">
              <Bell className="w-3 h-3 text-amber-600" />{ui("تذكير:")}{formatDateTime(item.reminder!.targetDateTime)}
            </span>
            <span className="text-[10px] text-amber-700 truncate max-w-[120px]">
              {item.reminder!.reason}
            </span>
          </div>
        )}

        {/* Contact Bar with Direct WhatsApp */}
        {timelineViewMode !== 'compact' && (
          <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
            <a
              href={`tel:${item.phoneNumber}`}
              className="flex items-center gap-1 text-slate-700 hover:text-[#004AA5] font-mono text-[11px]"
              dir="ltr"
            >
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{item.phoneNumber}</span>
            </a>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              title={ui("تواصل عبر واتساب")}
              className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition"
            >
              <MessageCircle className="w-3 h-3 text-emerald-600" />
              <span>{ui("واتساب")}</span>
            </a>
          </div>
        )}

        {/* Consulate Response & Payment Badges */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowResponseMenu(!showResponseMenu)}
              className="flex items-center gap-1 hover:opacity-80 transition"
            >
              {getResponseBadge()}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showResponseMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleSetResponse('pending')}
                  className="w-full text-right px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <Clock className="w-3 h-3 text-slate-400" />{ui("قيد الانتظار")}</button>
                <button
                  type="button"
                  onClick={() => handleSetResponse('accepted')}
                  className="w-full text-right px-3 py-1.5 hover:bg-emerald-50 flex items-center gap-2 text-emerald-700"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />{ui("مقبول")}</button>
                <button
                  type="button"
                  onClick={() => handleSetResponse('rejected')}
                  className="w-full text-right px-3 py-1.5 hover:bg-rose-50 flex items-center gap-2 text-rose-700"
                >
                  <XCircle className="w-3 h-3 text-rose-600" />{ui("مرفوض")}</button>
                <button
                  type="button"
                  onClick={() => handleSetResponse('missing_docs')}
                  className="w-full text-right px-3 py-1.5 hover:bg-amber-50 flex items-center gap-2 text-amber-700"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />{ui("نقص أوراق...")}</button>
              </div>
            )}
          </div>

          {/* Payment Status Pill */}
          <div>
            {item.paymentStatus === 'paid' ? (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-bold">{ui("مدفوع")}</span>
            ) : item.remainingAmount > 0 ? (
              <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-bold">{ui("باقٍ:")}{formatMoney(item.remainingAmount, item.currency)}
              </span>
            ) : (
              <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">{ui("لم يسدد")}</span>
            )}
          </div>
        </div>

        {/* Missing docs notes */}
        {item.consulateResponse === 'missing_docs' && item.missingDocsNotes && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2 text-[11px] text-amber-900 leading-snug">
            <span className="font-bold">{ui("المطلوب:")}</span>
            {item.missingDocsNotes}
          </div>
        )}

        {/* Price & Quick Settle */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">{ui("السعر (انقر للتعديل)")}</span>
            {editingField === 'price' ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  autoFocus
                  value={tempPrice}
                  onChange={(e) => setTempPrice(Number(e.target.value) || 0)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveInline()}
                  className="w-16 text-xs font-bold border border-[#2A83D5] rounded px-1 py-0.5"
                />
                <button
                  onClick={handleSaveInline}
                  className="p-1 bg-[#004AA5] text-white rounded text-[10px]"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <span
                onDoubleClick={() => {
                  setTempPrice(item.price);
                  setEditingField('price');
                }}
                title={ui("انقر نقراً مزدوجاً لتعديل السعر")}
                className="font-bold text-slate-900 cursor-pointer hover:text-[#004AA5]"
              >
                {formatMoney(item.price, item.currency)}
              </span>
            )}
          </div>

          {item.remainingAmount > 0 ? (
            <button
              type="button"
              onClick={() => settleConsulatePayment(item.id)}
              title={ui("تسديد المبلغ المتبقي بالكامل الآن")}
              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs"
            >
              <DollarSign className="w-3 h-3" />
              <span>{ui("تسديد")}</span>
            </button>
          ) : (
            <div className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />{ui("مسدد 100%")}</div>
          )}
        </div>

        {/* Timeline Stepper Controls & Move Up/Down */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            {onMoveUp && (
              <button
                onClick={onMoveUp}
                title={ui("تحريك لأعلى القائمة")}
                className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
            )}
            {onMoveDown && (
              <button
                onClick={onMoveDown}
                title={ui("تحريك لأسفل القائمة")}
                className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentStageIndex === 0}
              onClick={handlePrevStage}
              className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                currentStageIndex === 0
                  ? 'opacity-30 cursor-not-allowed text-slate-400'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              {isRTL ? <ArrowRight className="w-3 h-3" /> : <ArrowLeft className="w-3 h-3" />}
              <span>{ui("السابقة")}</span>
            </button>

            <button
              type="button"
              disabled={currentStageIndex === stages.length - 1}
              onClick={handleNextStage}
              className={`flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                currentStageIndex === stages.length - 1
                  ? 'opacity-30 cursor-not-allowed text-slate-400'
                  : 'text-white bg-[#004AA5] hover:bg-[#2A83D5] shadow-2xs'
              }`}
            >
              <span>{ui("التالية")}</span>
              {isRTL ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
