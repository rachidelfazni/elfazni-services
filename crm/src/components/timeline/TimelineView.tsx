import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TimelineCard } from './TimelineCard';
import { ConsulateAppointment, TimelineStage } from '../../types';
import {
  FileText,
  Send,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Archive,
  Search,
  PlusCircle,
  RotateCcw,
  Sparkles,
  Info,
  Maximize2,
  Minimize2,
  Pin,
  Plus,
} from 'lucide-react';
import { formatMoney, formatDate } from '../../utils/formatters';

interface TimelineViewProps {
  onEditItem: (item: ConsulateAppointment) => void;
  onOpenNewModal: (presetStage?: TimelineStage) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ onEditItem, onOpenNewModal }) => {
  const { ui } = useUITranslation();
  const {
    activeTimelineAppointments,
    archivedAppointments,
    moveTimelineStage,
    reorderTimelineAppointment,
    timelineViewMode,
    setTimelineViewMode,
    showFlaggedOnly,
    setShowFlaggedOnly,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<TimelineStage | null>(null);

  const stageDefinitions: {
    id: TimelineStage;
    title: string;
    subtitle: string;
    color: string;
    headerBg: string;
    borderColor: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'registered',
      title: '1. تم التسجيل / جديد',
      subtitle: 'استلام المستندات وتجهيز الملف',
      color: 'text-[#004AA5]',
      headerBg: 'bg-[#eaf4ff]/90',
      borderColor: 'border-[#B7CFEA]',
      icon: <FileText className="w-4 h-4 text-[#004AA5]" />,
    },
    {
      id: 'submitted',
      title: '2. قيد المعالجة والقنصلية',
      subtitle: 'الملف قيد التقديم والمعالجة',
      color: 'text-indigo-700',
      headerBg: 'bg-indigo-50/90',
      borderColor: 'border-indigo-200',
      icon: <Send className="w-4 h-4 text-indigo-600" />,
    },
    {
      id: 'response',
      title: '3. بانتظار الرد / تم الرد',
      subtitle: 'مقبول / مرفوض / نقص أوراق',
      color: 'text-amber-700',
      headerBg: 'bg-amber-50/90',
      borderColor: 'border-amber-200',
      icon: <HelpCircle className="w-4 h-4 text-amber-600" />,
    },
    {
      id: 'completed',
      title: '4. انتهاء الخدمة (معلقة بالسداد)',
      subtitle: 'الخدمة انتهت ومتبقي عليها دين',
      color: 'text-rose-700',
      headerBg: 'bg-rose-50/90',
      borderColor: 'border-rose-200',
      icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
    },
  ];

  // Filtering
  const filteredActive = activeTimelineAppointments.filter((item) => {
    if (showFlaggedOnly && (!item.flagColor || item.flagColor === 'none')) {
      return false;
    }
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.clientName.toLowerCase().includes(q) ||
      item.phoneNumber.includes(q) ||
      item.appointmentType.toLowerCase().includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  const filteredArchived = archivedAppointments.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.clientName.toLowerCase().includes(q) ||
      item.phoneNumber.includes(q) ||
      item.appointmentType.toLowerCase().includes(q)
    );
  });

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent, stageId: TimelineStage) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: TimelineStage) => {
    e.preventDefault();
    setDragOverStage(null);
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (dataStr) {
        const { id } = JSON.parse(dataStr);
        if (id) {
          moveTimelineStage(id, targetStage);
        }
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Harmonious Enterprise Header & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Row 1: Title, Subtitle, Search, and New Appointment Button */}
        <div className="p-4 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#eaf4ff] text-[#004AA5] flex items-center justify-center shrink-0 border border-[#D7E7F7]">
              <FileText className="w-4 h-4 text-[#004AA5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900">{ui("الخط الزمني التفاعلي للمواعيد")}</h2>
                <span className="text-[11px] bg-[#eaf4ff] text-[#004AA5] border border-[#B7CFEA]/60 px-2.5 py-0.5 rounded-full font-bold">
                  {activeTimelineAppointments.length} {ui("معاملة نشطة")}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{ui("سحب وإفلات حر، تتبع فوري لحالات القنصلية، والمتابعات المستعجلة")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-stretch md:self-auto">
            {/* Search Input Integrated in Row 1 */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={ui("بحث بالاسم أو الهاتف...")}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-[#004AA5] focus:outline-none transition shadow-2xs"
              />
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => onOpenNewModal('registered')}
              className="inline-flex items-center gap-1.5 bg-[#004AA5] hover:bg-[#003B84] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{ui("+ موعد جديد")}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Filters & View Mode Toggles */}
        <div className="px-4 py-2 sm:px-5 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Active vs Archived segmented switcher */}
          <div className="bg-slate-200/70 p-0.5 rounded-xl flex items-center gap-1 font-bold">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-3 py-1 rounded-lg transition cursor-pointer text-xs ${
                !showArchived
                  ? 'bg-white text-[#0B2E57] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >{ui("النشط (")}{activeTimelineAppointments.length})
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition cursor-pointer text-xs ${
                showArchived
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Archive className="w-3 h-3 text-emerald-600" />
              <span>{ui("الأرشيف المسدد (")}{archivedAppointments.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Flagged filter toggle */}
            <button
              onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                showFlaggedOnly
                  ? 'bg-[#CC9048] text-slate-950 border-[#CC9048] shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Pin className="w-3 h-3" />
              <span>{ui("المميزة فقط")}</span>
            </button>

            {/* Compact / Expanded view toggle */}
            <button
              onClick={() =>
                setTimelineViewMode(timelineViewMode === 'expanded' ? 'compact' : 'expanded')
              }
              className="flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer"
              title={ui("تبديل حجم عرض البطاقات")}
            >
              {timelineViewMode === 'expanded' ? (
                <>
                  <Minimize2 className="w-3 h-3 text-slate-500" />
                  <span>{ui("عرض مدمج")}</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3 h-3 text-slate-500" />
                  <span>{ui("عرض مفصل")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board View */}
      {!showArchived ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {stageDefinitions.map((stage) => {
            const stageItems = filteredActive.filter((item) => item.timelineStage === stage.id);
            const isCompletedStage = stage.id === 'completed';
            const isTargeted = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                data-timeline-stage={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={`bg-slate-50/90 rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col min-h-[240px] md:min-h-[400px] lg:min-h-[520px] ${
                  isTargeted
                    ? 'border-[#2A83D5] ring-2 ring-[#82B1E4] bg-[#eaf4ff]/50'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Column Header with Instant Quick Add */}
                <div className={`${stage.headerBg} p-3.5 border-b ${stage.borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {stage.icon}
                      <h3 className={`font-bold text-xs lg:text-sm ${stage.color}`}>{ui(stage.title)}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-white text-slate-700 text-[11px] font-bold flex items-center justify-center shadow-2xs">
                        {stageItems.length}
                      </span>
                      {/* Quick Add Button in this stage */}
                      <button
                        onClick={() => onOpenNewModal(stage.id)}
                        title={`${ui("إضافة سريعة")} · ${ui(stage.title)}`}
                        className="w-6 h-6 rounded-lg bg-white/80 hover:bg-white text-slate-700 hover:text-[#004AA5] flex items-center justify-center shadow-2xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{ui(stage.subtitle)}</p>
                </div>

                {/* Column Content / Cards List */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[750px]">
                  {stageItems.length > 0 ? (
                    stageItems.map((item, idx) => (
                      <TimelineCard
                        key={item.id}
                        item={item}
                        onEdit={onEditItem}
                        onMoveUp={
                          idx > 0
                            ? () => reorderTimelineAppointment(item.id, stage.id, idx - 1)
                            : undefined
                        }
                        onMoveDown={
                          idx < stageItems.length - 1
                            ? () => reorderTimelineAppointment(item.id, stage.id, idx + 1)
                            : undefined
                        }
                      />
                    ))
                  ) : (
                    <div className="h-44 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
                      {isCompletedStage ? (
                        <>
                          <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-1" />
                          <p className="font-semibold text-slate-600">{ui("لا توجد خدمات منتهية بديون")}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{ui("المسدد بالكامل ينتقل للأرشيف تلقائياً")}</p>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                            {stage.icon}
                          </div>
                          <p>{ui("اسحب بطاقة إلى هنا أو اضغط (+) للإضافة")}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Archived / Completed Paid Transactions View */
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-base">{ui("سجل المعاملات المكتملة والمسددة 100% (")}{filteredArchived.length})
              </h3>
            </div>
            <p className="text-xs text-slate-500">{ui("معاملات تمت أرشفتها تلقائياً بعد اكتمال الخدمة واستلام كامل المبلغ")}</p>
          </div>

          {filteredArchived.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredArchived.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 space-y-2 hover:bg-white transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.clientName}</h4>
                      <p className="text-xs text-slate-500">
                        {item.appointmentType === 'أخرى' && item.customAppointmentType
                          ? item.customAppointmentType
                          : item.appointmentType}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />{ui("مكتمل ومسدد")}</span>
                  </div>

                  <div className="text-xs flex items-center justify-between pt-2 border-t border-slate-200 text-slate-600">
                    <span>{ui("تاريخ:")}{formatDate(item.submissionDate)}</span>
                    <span className="font-bold text-slate-900">
                      {formatMoney(item.price, item.currency)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400 font-mono text-[11px]">{item.phoneNumber}</span>
                    <button
                      onClick={() => moveTimelineStage(item.id, 'response')}
                      className="text-[#004AA5] hover:text-[#0B2E57] text-[11px] font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />{ui("إعادة للخط الزمني")}</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Archive className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">{ui("لا توجد معاملات مؤرشفة حالياً")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
