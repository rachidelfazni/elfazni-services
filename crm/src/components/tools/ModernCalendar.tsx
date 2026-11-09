import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Video,
  X,
  Trash2,
  Edit3,
  Check,
  User,
  ExternalLink,
  List,
  Columns,
  Grid,
  CalendarDays,
  Bell,
  Sparkles,
  Repeat,
  Copy,
  CalendarCheck2,
  AlertCircle,
  FileText,
  ListTodo,
  History,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle2,
  Tag,
  Share2,
} from 'lucide-react';
import {
  productivityService,
  CalEventItem,
  EventKind,
  TaskItem,
  NoteItem,
  EventRescheduleLog,
} from '../../services/productivityService';
import { ResizeHandle } from '../workspace/resizable/ResizeHandle';
import { clampPanelSize } from '../workspace/resizable/layoutPreferences';

interface ModernCalendarProps {
  consulateAppointments?: any[];
  flightBookings?: any[];
  debts?: any[];
  tasks?: TaskItem[];
  contacts?: any[];
  invoices?: any[];
  onGotoTab?: (tab: string) => void;
  onOpenContact?: (contactId: string) => void;
  onOpenNote?: (noteId: string) => void;
  onOpenTask?: (taskId: string) => void;
  lang?: 'ar' | 'en' | 'fr';
  username?: string;
}

type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export const KIND_COLOR: Record<EventKind, string> = {
  cns: '#004AA5', // Consulate blue
  fly: '#0284C7', // Flight cyan/sky
  debt: '#DC2626', // Debt red
  pers: '#CC9048', // Personal gold
  task: '#7C3AED', // Task purple
  meeting: '#059669', // Meeting emerald
  reminder: '#D97706', // Reminder amber
};

const KIND_NAMES: Record<EventKind, { ar: string; en: string; fr: string }> = {
  cns: { ar: 'موعد قنصلي', en: 'Consulate', fr: 'Consulat' },
  fly: { ar: 'حجز طيران', en: 'Flight', fr: 'Vol' },
  debt: { ar: 'دين مستحق', en: 'Debt', fr: 'Dette' },
  pers: { ar: 'حدث شخصي', en: 'Personal', fr: 'Personnel' },
  task: { ar: 'مهمة مؤرخة', en: 'Task', fr: 'Tâche' },
  meeting: { ar: 'اجتماع', en: 'Meeting', fr: 'Réunion' },
  reminder: { ar: 'تذكير', en: 'Reminder', fr: 'Rappel' },
};

const WD_FULL = {
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
};

const pad2 = (n: number) => String(n).padStart(2, '0');
const isoOf = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseISO = (s: string) => {
  const [y, m, d] = (s || '').split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
};

export const ModernCalendar: React.FC<ModernCalendarProps> = ({
  consulateAppointments = [],
  flightBookings = [],
  debts = [],
  tasks = [],
  contacts = [],
  invoices = [],
  onGotoTab,
  onOpenContact,
  onOpenNote,
  onOpenTask,
  lang = 'ar',
  username = 'owner',
}) => {
  const [events, setEvents] = useState<CalEventItem[]>([]);
  const [view, setView] = useState<CalendarView>('month');
  const [cursorDate, setCursorDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(isoOf(new Date()));

  // Active Details Drawer / Modal
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Quick Reschedule Modal State
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleTargetEvent, setRescheduleTargetEvent] = useState<CalEventItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00');
  const [rescheduleEndTime, setRescheduleEndTime] = useState('11:00');
  const [rescheduleNote, setRescheduleNote] = useState('');

  // "More Events" Overflow Popover State
  const [overflowPopover, setOverflowPopover] = useState<{
    date: string;
    events: any[];
    x: number;
    y: number;
  } | null>(null);

  // Snooze Dropdown State inside Details Panel
  const [snoozeOpen, setSnoozeOpen] = useState(false);

  // Event Composer Modal State
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [compTitle, setCompTitle] = useState('');
  const [compKind, setCompKind] = useState<EventKind>('pers');
  const [compDate, setCompDate] = useState(isoOf(new Date()));
  const [compTime, setCompTime] = useState('10:00');
  const [compEndTime, setCompEndTime] = useState('11:00');
  const [compAllDay, setCompAllDay] = useState(false);
  const [compLocation, setCompLocation] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compColor, setCompColor] = useState(KIND_COLOR.pers);
  const [compCustomerName, setCompCustomerName] = useState('');
  const [compCustomerId, setCompCustomerId] = useState('');
  const [compServiceType, setCompServiceType] = useState('consular');
  const [compTransactionRef, setCompTransactionRef] = useState('');
  const [compReminderMinutes, setCompReminderMinutes] = useState<number | undefined>(15);
  const [compRecurrence, setCompRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  const [compAssignee, setCompAssignee] = useState('رشيد الفزني');

  // Drag-and-drop feedback
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Resizable Sources Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 256;
    try {
      const saved = localStorage.getItem('elfazni_calendar_sidebar_width');
      const num = saved ? parseInt(saved, 10) : 256;
      return isNaN(num) ? 256 : clampPanelSize(num, 180, 420);
    } catch {
      return 256;
    }
  });

  const handleSidebarResize = (delta: number) => {
    setSidebarWidth((prev) => {
      const next = clampPanelSize(prev + delta, 180, 420);
      try {
        localStorage.setItem('elfazni_calendar_sidebar_width', String(next));
      } catch {}
      return next;
    });
  };

  const handleResetSidebarWidth = () => {
    setSidebarWidth(256);
    try {
      localStorage.setItem('elfazni_calendar_sidebar_width', '256');
    } catch {}
  };

  // Source visibility toggles
  const [sources, setSources] = useState<Record<EventKind, boolean>>({
    cns: true,
    fly: true,
    debt: true,
    pers: true,
    task: true,
    meeting: true,
    reminder: true,
  });

  const l = (ar: string, en: string, fr: string) => {
    if (lang === 'en') return en;
    if (lang === 'fr') return fr;
    return ar;
  };

  // Load custom events from productivityService
  useEffect(() => {
    productivityService.fetchState(username).then((state) => {
      if (state.events) {
        setEvents(state.events);
      }
    });
  }, [username]);

  // Aggregate all events
  const aggregatedEvents = useMemo(() => {
    const list: Array<any> = [];

    // 1. Personal & custom events from productivity store
    events.forEach((e) => {
      if (sources[e.kind] ?? true) {
        list.push({
          ...e,
          subtitle: e.description,
          color: e.color || KIND_COLOR[e.kind] || '#004AA5',
          isSystemRecord: false,
        });
      }
    });

    // 2. Consulate Appointments
    if (sources.cns) {
      consulateAppointments.forEach((c) => {
        const d = (c.submissionDate || '').slice(0, 10);
        if (d) {
          list.push({
            id: `cns_${c.id}`,
            title: `${c.clientName || 'عميل'} · ${c.appointmentType || 'موعد قنصلي'}`,
            kind: 'cns',
            date: d,
            time: c.appointmentTime || '09:00',
            allDay: !c.appointmentTime,
            subtitle: `قنصلية: ${c.consulateCity || 'الدار البيضاء'} | كود: ${c.code || '—'}`,
            color: KIND_COLOR.cns,
            isSystemRecord: true,
            systemTab: 'consulate',
            clientName: c.clientName,
            clientPhone: c.clientPhone,
            transactionRef: c.code,
            serviceType: 'خدمة قنصلية وتأشيرة',
            status: c.status || 'قيد المتابعة',
            assignee: c.assignedTo || 'المشرف',
          });
        }
      });
    }

    // 3. Flight Bookings
    if (sources.fly) {
      flightBookings.forEach((f) => {
        const d = (f.bookingDate || '').slice(0, 10);
        if (d) {
          list.push({
            id: `fly_${f.id}`,
            title: `${f.clientName || 'مسافر'} · ${f.pnr || 'PNR'}`,
            kind: 'fly',
            date: d,
            time: '12:00',
            allDay: true,
            subtitle: `${f.airlineAndRoute || 'رحلة طيران'} | ${f.sellingPrice || ''} ${f.currency || 'MAD'}`,
            color: KIND_COLOR.fly,
            isSystemRecord: true,
            systemTab: 'flights',
            clientName: f.clientName,
            clientPhone: f.clientPhone,
            transactionRef: f.pnr,
            serviceType: 'حجز طيران',
            status: f.status || 'مؤكد',
            assignee: 'قسم الطيران',
          });
        }
      });
    }

    // 4. Debts
    if (sources.debt) {
      debts.forEach((db) => {
        const d = (db.date || '').slice(0, 10);
        if (d) {
          list.push({
            id: `debt_${db.id}`,
            title: `دين مستحق: ${db.clientName || 'عميل'} (${db.totalAmount || 0} ${db.currency || 'MAD'})`,
            kind: 'debt',
            date: d,
            allDay: true,
            subtitle: `مبلغ مستحق: ${db.totalAmount || 0} ${db.currency || 'MAD'}`,
            color: KIND_COLOR.debt,
            isSystemRecord: true,
            systemTab: 'debts',
            clientName: db.clientName,
            transactionRef: db.id,
            serviceType: 'تسوية مالية',
            status: db.status || 'غير مسدد',
          });
        }
      });
    }

    // 5. Tasks with due dates
    if (sources.task) {
      tasks.forEach((t) => {
        if (t.dueDate) {
          list.push({
            id: `task_${t.id}`,
            title: t.title,
            kind: 'task',
            date: t.dueDate,
            time: t.dueTime,
            allDay: !t.dueTime,
            subtitle: `مهمة (${t.status === 'done' ? 'منجزة' : 'قيد التنفيذ'}) · أولوية ${t.priority}`,
            color: KIND_COLOR.task,
            isSystemRecord: false,
            taskRecord: t,
            clientName: t.linkedCustomerName,
          });
        }
      });
    }

    return list;
  }, [events, consulateAppointments, flightBookings, debts, tasks, sources]);

  // Counts for sidebar legend
  const counts = useMemo(() => {
    return {
      cns: consulateAppointments.length,
      fly: flightBookings.length,
      debt: debts.length,
      pers: events.filter((e) => e.kind === 'pers').length,
      task: tasks.filter((t) => Boolean(t.dueDate)).length,
      meeting: events.filter((e) => e.kind === 'meeting').length,
      reminder: events.filter((e) => e.kind === 'reminder').length,
    };
  }, [consulateAppointments, flightBookings, debts, events, tasks]);

  // Date utilities
  const shiftDate = (delta: number) => {
    const next = new Date(cursorDate);
    if (view === 'month') {
      next.setMonth(next.getMonth() + delta);
    } else if (view === 'week') {
      next.setDate(next.getDate() + delta * 7);
    } else {
      next.setDate(next.getDate() + delta);
    }
    setCursorDate(next);
  };

  const jumpToToday = () => {
    const today = new Date();
    setCursorDate(today);
    setSelectedDate(isoOf(today));
  };

  const formattedMonthYear = useMemo(() => {
    return cursorDate.toLocaleDateString(
      lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US',
      { month: 'long', year: 'numeric' }
    );
  }, [cursorDate, lang]);

  // Events for a specific day
  const eventsForDay = (isoDate: string) => {
    return aggregatedEvents.filter((e) => e.date === isoDate);
  };

  // Open Event Composer
  const handleOpenComposer = (dateStr?: string) => {
    setEditingEventId(null);
    setCompTitle('');
    setCompKind('pers');
    setCompDate(dateStr || selectedDate);
    setCompTime('10:00');
    setCompEndTime('11:00');
    setCompAllDay(false);
    setCompLocation('');
    setCompDesc('');
    setCompColor(KIND_COLOR.pers);
    setCompCustomerName('');
    setCompCustomerId('');
    setCompServiceType('consular');
    setCompTransactionRef('');
    setCompReminderMinutes(15);
    setCompRecurrence('none');
    setCompAssignee('رشيد الفزني');
    setComposerOpen(true);
  };

  // Open Event Details Panel
  const handleOpenDetails = (ev: any) => {
    setSelectedEvent(ev);
    setIsEditMode(false);
    setSnoozeOpen(false);
    setOverflowPopover(null);
  };

  // Open Edit Mode inside Details Panel or Composer
  const handleStartEditing = (ev: CalEventItem) => {
    setEditingEventId(ev.id);
    setCompTitle(ev.title);
    setCompKind(ev.kind);
    setCompDate(ev.date);
    setCompTime(ev.time || '10:00');
    setCompEndTime(ev.endTime || '11:00');
    setCompAllDay(Boolean(ev.allDay));
    setCompLocation(ev.location || '');
    setCompDesc(ev.description || '');
    setCompColor(ev.color || KIND_COLOR[ev.kind]);
    setCompCustomerName(ev.linkedCustomerName || ev.linkedRecordTitle || '');
    setCompCustomerId(ev.linkedCustomerId || '');
    setCompServiceType(ev.linkedServiceType || 'consular');
    setCompTransactionRef(ev.linkedTransactionRef || '');
    setCompReminderMinutes(ev.reminderMinutesBefore);
    setCompRecurrence(ev.recurrence || 'none');
    setCompAssignee(ev.assignee || 'رشيد الفزني');
    setComposerOpen(true);
    setSelectedEvent(null);
  };

  // Save Event from Composer
  const handleSaveComposer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compTitle.trim()) return;

    const eventPayload: Partial<CalEventItem> = {
      id: editingEventId || undefined,
      title: compTitle.trim(),
      kind: compKind,
      date: compDate,
      time: compAllDay ? undefined : compTime,
      endTime: compAllDay ? undefined : compEndTime,
      allDay: compAllDay,
      location: compLocation.trim() || undefined,
      description: compDesc.trim() || undefined,
      color: compColor,
      linkedCustomerName: compCustomerName.trim() || undefined,
      linkedCustomerId: compCustomerId || undefined,
      linkedServiceType: compServiceType,
      linkedTransactionRef: compTransactionRef.trim() || undefined,
      reminderMinutesBefore: compReminderMinutes,
      recurrence: compRecurrence,
      assignee: compAssignee,
    };

    const saved = await productivityService.saveEvent(eventPayload, username);

    setEvents((prev) => {
      const idx = prev.findIndex((x) => x.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });

    setComposerOpen(false);
  };

  // Delete Event
  const handleDeleteEvent = async (id: string) => {
    await productivityService.deleteEvent(id, username);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
  };

  // Duplicate Event
  const handleDuplicateEvent = async (ev: CalEventItem) => {
    const clonePayload: Partial<CalEventItem> = {
      ...ev,
      id: undefined,
      title: `${ev.title} (نسخة)`,
      createdAt: undefined,
      updatedAt: undefined,
    };
    const cloned = await productivityService.saveEvent(clonePayload, username);
    setEvents((prev) => [cloned, ...prev]);
    setSelectedEvent(cloned);
  };

  // Open Quick Reschedule Modal
  const handleOpenRescheduleModal = (ev: CalEventItem) => {
    setRescheduleTargetEvent(ev);
    setRescheduleDate(ev.date);
    setRescheduleTime(ev.time || '10:00');
    setRescheduleEndTime(ev.endTime || '11:00');
    setRescheduleNote('');
    setRescheduleModalOpen(true);
  };

  // Execute Quick Rescheduling
  const handleExecuteReschedule = async () => {
    if (!rescheduleTargetEvent || !rescheduleDate) return;

    const updated = await productivityService.rescheduleEvent(
      rescheduleTargetEvent.id,
      {
        newDate: rescheduleDate,
        newTime: rescheduleTime,
        newEndTime: rescheduleEndTime,
        note: rescheduleNote.trim() || undefined,
        rescheduledBy: 'رشيد الفزني',
      },
      username
    );

    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    if (selectedEvent?.id === updated.id) {
      setSelectedEvent(updated);
    }
    setRescheduleModalOpen(false);
  };

  // Quick Date Shortcut buttons in Rescheduler
  const setQuickDate = (type: 'today' | 'tomorrow' | 'nextWeek') => {
    const d = new Date();
    if (type === 'tomorrow') d.setDate(d.getDate() + 1);
    else if (type === 'nextWeek') d.setDate(d.getDate() + 7);
    setRescheduleDate(isoOf(d));
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    setDraggedEventId(eventId);
    e.dataTransfer.setData('text/plain', eventId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnDate = async (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const eventId = draggedEventId || e.dataTransfer.getData('text/plain');
    if (!eventId) return;

    const targetEv = events.find((x) => x.id === eventId);
    if (!targetEv || targetEv.date === targetDate) return;

    // Reschedule event to new date
    const updated = await productivityService.rescheduleEvent(
      targetEv.id,
      {
        newDate: targetDate,
        newTime: targetEv.time,
        newEndTime: targetEv.endTime,
        note: `نقل مباشر بالسحب والإفلات إلى ${targetDate}`,
        rescheduledBy: 'المشرف',
      },
      username
    );

    setEvents((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    setDraggedEventId(null);
  };

  // Smart Reminder Snooze
  const handleSnooze = async (minutes: number) => {
    if (!selectedEvent) return;
    const remId = `rem_ev_${selectedEvent.id}`;
    await productivityService.snoozeReminder(remId, minutes, username);
    setSnoozeOpen(false);
    // Update local state
    const target = new Date();
    target.setMinutes(target.getMinutes() + minutes);
    setEvents((prev) =>
      prev.map((e) =>
        e.id === selectedEvent.id
          ? { ...e, reminderStatus: 'snoozed', reminderSnoozedUntil: target.toISOString() }
          : e
      )
    );
    setSelectedEvent((prev: any) =>
      prev ? { ...prev, reminderStatus: 'snoozed', reminderSnoozedUntil: target.toISOString() } : null
    );
  };

  // Smart Reminder Mark Completed
  const handleMarkCompleted = async () => {
    if (!selectedEvent) return;
    const remId = `rem_ev_${selectedEvent.id}`;
    await productivityService.completeReminder(remId, username);
    setEvents((prev) =>
      prev.map((e) =>
        e.id === selectedEvent.id ? { ...e, status: 'completed', reminderStatus: 'completed' } : e
      )
    );
    setSelectedEvent((prev: any) =>
      prev ? { ...prev, status: 'completed', reminderStatus: 'completed' } : null
    );
  };

  // Create follow-up Task from current event
  const handleCreateTaskFromEvent = async () => {
    if (!selectedEvent) return;
    const task = await productivityService.saveTask(
      {
        title: `متابعة: ${selectedEvent.title}`,
        status: 'todo',
        priority: 'high',
        dueDate: selectedEvent.date,
        dueTime: selectedEvent.time,
        linkedCustomerId: selectedEvent.linkedCustomerId,
        linkedCustomerName: selectedEvent.linkedCustomerName || selectedEvent.clientName,
        linkedRecordType: selectedEvent.kind === 'cns' ? 'consulate' : 'general',
        linkedRecordId: selectedEvent.id,
        linkedRecordTitle: selectedEvent.title,
      },
      username
    );
    if (onOpenTask) onOpenTask(task.id);
    else onGotoTab?.('tasks');
  };

  // Month Grid Calculation (42 cells)
  const monthCells = useMemo(() => {
    const y = cursorDate.getFullYear();
    const m = cursorDate.getMonth();
    const first = new Date(y, m, 1);
    const start = new Date(y, m, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursorDate]);

  // Week Grid Calculation (7 days)
  const weekDays = useMemo(() => {
    const d = new Date(cursorDate);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const col = new Date(start);
      col.setDate(start.getDate() + i);
      return col;
    });
  }, [cursorDate]);

  const todayStr = isoOf(new Date());

  return (
    <div className="w-full h-full flex flex-col bg-[#FAFBFD] text-[#0B2E57] select-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Calendar Control Bar */}
      <div className="p-3.5 bg-white border-b border-[#D7E7F7] flex flex-wrap items-center justify-between gap-3 shadow-2xs shrink-0">
        <div className="flex items-center gap-2">
          {/* Month / Year Display */}
          <div className="flex items-center gap-2 min-w-[170px]">
            <CalendarIcon className="w-5 h-5 text-[#004AA5]" />
            <h3 className="text-[17px] font-black text-[#0B2E57]">{formattedMonthYear}</h3>
          </div>

          {/* Navigation Arrows & Jump to Today */}
          <div className="flex items-center border border-[#D7E7F7] rounded-xl p-0.5 bg-[#F8FAFC]">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="p-1.5 rounded-lg hover:bg-white text-[#5E7086] hover:text-[#0B2E57] transition cursor-pointer"
              title={l('السابق', 'Previous', 'Précédent')}
            >
              {lang === 'ar' ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            <button
              type="button"
              onClick={jumpToToday}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg hover:bg-white text-[#004AA5] transition cursor-pointer"
            >
              {l('اليوم', 'Today', 'Aujourd’hui')}
            </button>
            <button
              type="button"
              onClick={() => shiftDate(1)}
              className="p-1.5 rounded-lg hover:bg-white text-[#5E7086] hover:text-[#0B2E57] transition cursor-pointer"
              title={l('التالي', 'Next', 'Suivant')}
            >
              {lang === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>

        {/* View Mode Switcher and Add Event */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-[#D7E7F7] rounded-xl p-0.5 bg-[#F8FAFC] text-[12px] font-bold">
            <button
              type="button"
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                view === 'month' ? 'bg-white shadow-xs text-[#004AA5]' : 'text-[#5E7086] hover:text-[#0B2E57]'
              }`}
            >
              {l('شهر', 'Month', 'Mois')}
            </button>
            <button
              type="button"
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                view === 'week' ? 'bg-white shadow-xs text-[#004AA5]' : 'text-[#5E7086] hover:text-[#0B2E57]'
              }`}
            >
              {l('أسبوع', 'Week', 'Semaine')}
            </button>
            <button
              type="button"
              onClick={() => setView('day')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                view === 'day' ? 'bg-white shadow-xs text-[#004AA5]' : 'text-[#5E7086] hover:text-[#0B2E57]'
              }`}
            >
              {l('يوم', 'Day', 'Jour')}
            </button>
            <button
              type="button"
              onClick={() => setView('agenda')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                view === 'agenda' ? 'bg-white shadow-xs text-[#004AA5]' : 'text-[#5E7086] hover:text-[#0B2E57]'
              }`}
            >
              {l('أجندة', 'Agenda', 'Agenda')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenComposer()}
            className="px-3.5 py-1.5 rounded-xl bg-[#004AA5] text-white text-[12px] font-bold flex items-center gap-1.5 hover:bg-[#2A83D5] transition shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>{l('حدث جديد', 'New Event', 'Nouvel événement')}</span>
          </button>
        </div>
      </div>

      {/* Main Body: Sidebar + Views + Details Drawer */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left/Right Sidebar: Categories & Upcoming Highlights */}
        <div
          className="border-e border-[#D7E7F7] bg-white p-3 shrink-0 hidden md:flex flex-col gap-4 overflow-y-auto"
          style={{ width: `${sidebarWidth}px` }}
        >
          {/* Categories Filter */}
          <div>
            <span className="text-[11px] font-bold text-[#5E7086] block mb-2 uppercase tracking-wider">
              {l('تصنيفات التقويم', 'Categories', 'Catégories')}
            </span>
            <div className="space-y-1">
              {(
                [
                  ['cns', KIND_NAMES.cns[lang], KIND_COLOR.cns, counts.cns],
                  ['fly', KIND_NAMES.fly[lang], KIND_COLOR.fly, counts.fly],
                  ['debt', KIND_NAMES.debt[lang], KIND_COLOR.debt, counts.debt],
                  ['pers', KIND_NAMES.pers[lang], KIND_COLOR.pers, counts.pers],
                  ['task', KIND_NAMES.task[lang], KIND_COLOR.task, counts.task],
                  ['meeting', KIND_NAMES.meeting[lang], KIND_COLOR.meeting, counts.meeting],
                  ['reminder', KIND_NAMES.reminder[lang], KIND_COLOR.reminder, counts.reminder],
                ] as const
              ).map(([key, label, color, count]) => {
                const isChecked = sources[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSources((prev) => ({ ...prev, [key]: !prev[key] }))}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-[12px] font-bold transition cursor-pointer ${
                      isChecked
                        ? 'bg-[#F8FAFC] border-[#D7E7F7] text-[#0B2E57]'
                        : 'bg-white border-transparent text-[#5E7086] opacity-50 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                      <span className="truncate">{label}</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded-full bg-white border border-[#D7E7F7] text-[10px] font-mono text-[#5E7086]">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Mini Agenda / Upcoming Highlights */}
          <div className="pt-3 border-t border-[#D7E7F7] flex-1">
            <span className="text-[11px] font-bold text-[#5E7086] block mb-2 uppercase tracking-wider">
              {l('المواعيد القادمة', 'Upcoming', 'À venir')}
            </span>
            <div className="space-y-2">
              {aggregatedEvents
                .filter((e) => e.date >= todayStr)
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 6)
                .map((ev) => (
                  <div
                    key={ev.id}
                    data-event-chip={ev.id}
                    onClick={() => handleOpenDetails(ev)}
                    className="p-2 rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] hover:bg-[#F1F6FB] transition cursor-pointer text-[11px]"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ev.color }} />
                      <span className="font-bold text-[#0B2E57] truncate flex-1">{ev.title}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#5E7086] font-mono" dir="ltr">
                      <span>{ev.date}</span>
                      {ev.time && <span>{ev.time}</span>}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Desktop Resizable Separator Handle */}
        <div className="hidden md:block shrink-0 h-full">
          <ResizeHandle
            id="calendar-sources-sidebar"
            direction="horizontal"
            isRtl={lang === 'ar'}
            onResize={handleSidebarResize}
            onReset={handleResetSidebarWidth}
            currentSize={sidebarWidth}
            minSize={180}
            maxSize={420}
            ariaLabel="فاصل تغيير حجم قائمة مصادر التقويم"
          />
        </div>

        {/* Main Calendar View Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          {view === 'month' && (
            /* MONTH VIEW */
            <div className="flex-1 flex flex-col bg-white border border-[#D7E7F7] rounded-2xl overflow-hidden shadow-xs">
              {/* Day-of-week header */}
              <div className="grid grid-cols-7 border-b border-[#D7E7F7] bg-[#F8FAFC] text-center text-[12px] font-bold text-[#5E7086] py-2">
                {WD_FULL[lang]?.map((wd) => (
                  <div key={wd}>{wd}</div>
                ))}
              </div>

              {/* 42-cell Grid */}
              <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-[#D7E7F7] divide-x-reverse min-h-[560px]">
                {monthCells.map((cellDate) => {
                  const cellISO = isoOf(cellDate);
                  const isCurrentMonth = cellDate.getMonth() === cursorDate.getMonth();
                  const isToday = cellISO === todayStr;
                  const isSelected = cellISO === selectedDate;
                  const isDragTarget = dragOverDate === cellISO;
                  const dayEvents = eventsForDay(cellISO);

                  return (
                    <div
                      key={cellISO}
                      onClick={() => {
                        setSelectedDate(cellISO);
                        handleOpenComposer(cellISO);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverDate(cellISO);
                      }}
                      onDragLeave={() => setDragOverDate(null)}
                      onDrop={(e) => handleDropOnDate(e, cellISO)}
                      className={`p-1.5 flex flex-col justify-between transition cursor-pointer hover:bg-[#F8FAFC] relative ${
                        !isCurrentMonth ? 'bg-slate-50/50 opacity-45' : 'bg-white'
                      } ${isSelected ? 'ring-2 ring-inset ring-[#004AA5]/40' : ''} ${
                        isDragTarget ? 'bg-blue-100/60 ring-2 ring-blue-500' : ''
                      }`}
                    >
                      {/* Date Badge */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`w-6 h-6 rounded-full text-[11px] font-bold font-mono grid place-items-center ${
                            isToday ? 'bg-[#004AA5] text-white shadow-xs' : 'text-[#0B2E57]'
                          }`}
                        >
                          {cellDate.getDate()}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] font-mono text-[#5E7086]">{dayEvents.length}</span>
                        )}
                      </div>

                      {/* Event Chips (Draggable) */}
                      <div className="space-y-1 flex-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            data-event-chip={ev.id}
                            draggable={!ev.isSystemRecord}
                            onDragStart={(e) => handleDragStart(e, ev.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetails(ev);
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white truncate shadow-2xs hover:opacity-90 transition flex items-center justify-between gap-1 cursor-grab active:cursor-grabbing"
                            style={{ background: ev.color || KIND_COLOR[ev.kind as EventKind] }}
                            title={ev.title}
                          >
                            <span className="truncate">
                              {ev.time ? `${ev.time} ` : ''}
                              {ev.title}
                            </span>
                            {ev.recurrence && ev.recurrence !== 'none' && (
                              <Repeat size={9} className="shrink-0 opacity-80" />
                            )}
                          </div>
                        ))}

                        {/* More Events Overflow Badge */}
                        {dayEvents.length > 3 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setOverflowPopover({
                                date: cellISO,
                                events: dayEvents,
                                x: rect.left,
                                y: rect.bottom,
                              });
                            }}
                            className="text-[10px] font-bold text-[#004AA5] hover:underline px-1 cursor-pointer bg-blue-50/70 rounded py-0.5 inline-block"
                          >
                            +{dayEvents.length - 3} {l('المزيد', 'more', 'plus')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'week' && (
            /* WEEK VIEW */
            <div className="flex-1 flex flex-col bg-white border border-[#D7E7F7] rounded-2xl overflow-hidden shadow-xs">
              <div className="grid grid-cols-7 border-b border-[#D7E7F7] bg-[#F8FAFC] text-center text-[12px] font-bold text-[#5E7086] py-2">
                {weekDays.map((wd) => {
                  const iso = isoOf(wd);
                  const isToday = iso === todayStr;
                  return (
                    <div key={iso} className="flex flex-col items-center">
                      <span>{WD_FULL[lang]?.[wd.getDay()]}</span>
                      <span
                        className={`w-6 h-6 rounded-full text-[11px] font-mono mt-0.5 grid place-items-center ${
                          isToday ? 'bg-[#004AA5] text-white' : 'text-[#0B2E57]'
                        }`}
                      >
                        {wd.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-7 flex-1 divide-x divide-[#D7E7F7] divide-x-reverse min-h-[500px] p-2 overflow-y-auto">
                {weekDays.map((wd) => {
                  const iso = isoOf(wd);
                  const dayEvents = eventsForDay(iso);
                  return (
                    <div
                      key={iso}
                      onClick={() => handleOpenComposer(iso)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDropOnDate(e, iso)}
                      className="p-1 space-y-1.5 hover:bg-[#F8FAFC] transition cursor-pointer"
                    >
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          draggable={!ev.isSystemRecord}
                          onDragStart={(e) => handleDragStart(e, ev.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetails(ev);
                          }}
                          className="p-1.5 rounded-lg text-white text-[11px] font-bold shadow-xs hover:opacity-95 transition"
                          style={{ background: ev.color || KIND_COLOR[ev.kind as EventKind] }}
                        >
                          <div className="flex items-center justify-between text-[10px] opacity-90 mb-0.5">
                            <span>{ev.time || 'طوال اليوم'}</span>
                            {ev.recurrence && ev.recurrence !== 'none' && <Repeat size={10} />}
                          </div>
                          <div className="truncate">{ev.title}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'day' && (
            /* DAY VIEW */
            <div className="flex-1 bg-white border border-[#D7E7F7] rounded-2xl p-4 overflow-y-auto shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D7E7F7]">
                <h4 className="text-base font-black text-[#0B2E57]">{selectedDate}</h4>
                <button
                  type="button"
                  onClick={() => handleOpenComposer(selectedDate)}
                  className="px-3 py-1 rounded-lg bg-[#004AA5] text-white text-xs font-bold"
                >
                  {l('إضافة موعد في هذا اليوم', 'Add appointment', 'Ajouter un rendez-vous')}
                </button>
              </div>

              <div className="space-y-3">
                {eventsForDay(selectedDate).length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">لا توجد مواعيد مسجلة لهذا اليوم</p>
                    <p className="text-[11px] text-slate-400 mt-1">انقر على الزر أعلاه لإضافة موعد جديد.</p>
                  </div>
                ) : (
                  eventsForDay(selectedDate).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => handleOpenDetails(ev)}
                      className="p-3 rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] hover:border-blue-400 transition cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-3.5 h-3.5 rounded-full" style={{ background: ev.color }} />
                        <div>
                          <h5 className="font-bold text-slate-800 text-sm">{ev.title}</h5>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {ev.time || 'طوال اليوم'} {ev.location ? `· ${ev.location}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 font-bold text-slate-700">
                          {KIND_NAMES[ev.kind as EventKind]?.[lang] || ev.kind}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {view === 'agenda' && (
            /* AGENDA VIEW */
            <div className="flex-1 bg-white border border-[#D7E7F7] rounded-2xl p-4 overflow-y-auto shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#D7E7F7]">
                <h4 className="text-base font-black text-[#0B2E57] flex items-center gap-2">
                  <List className="w-5 h-5 text-[#004AA5]" />
                  <span>{l('جدول الأجندة الشامل', 'Agenda Schedule', 'Calendrier de l’ordre du jour')}</span>
                </h4>
                <span className="text-xs font-bold text-slate-500">
                  {aggregatedEvents.length} {l('مواعيد وأحداث مسجلة', 'events scheduled', 'événements')}
                </span>
              </div>

              <div className="space-y-2.5">
                {aggregatedEvents
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => handleOpenDetails(ev)}
                      className="p-3 rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] hover:bg-white hover:border-blue-400 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: ev.color }} />
                        <div>
                          <h5 className="font-bold text-slate-800 text-sm">{ev.title}</h5>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span className="font-mono">{ev.date}</span>
                            {ev.time && <span>· {ev.time}</span>}
                            {ev.clientName && (
                              <span className="text-[#004AA5] font-bold">· العميل: {ev.clientName}</span>
                            )}
                            {ev.transactionRef && (
                              <span className="text-slate-600 font-mono">({ev.transactionRef})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-white border border-slate-200 font-bold text-slate-700">
                          {KIND_NAMES[ev.kind as EventKind]?.[lang] || ev.kind}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenRescheduleModal(ev);
                          }}
                          className="px-2 py-1 rounded-lg bg-blue-50 text-[#004AA5] text-xs font-bold hover:bg-blue-100"
                        >
                          إعادة الجدولة
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overflow "+X More Events" Popover */}
      {overflowPopover && (
        <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setOverflowPopover(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute z-50 bg-white rounded-2xl border border-[#D7E7F7] shadow-2xl p-3 w-72 max-h-80 overflow-y-auto animate-in fade-in"
            style={{
              top: `${Math.min(overflowPopover.y, window.innerHeight - 340)}px`,
              left: `${Math.min(overflowPopover.x, window.innerWidth - 300)}px`,
            }}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-[#0B2E57]">
                {overflowPopover.date} ({overflowPopover.events.length} مواعيد)
              </span>
              <button onClick={() => setOverflowPopover(null)} className="p-0.5 text-slate-400 hover:text-slate-700">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-1.5">
              {overflowPopover.events.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => {
                    handleOpenDetails(ev);
                    setOverflowPopover(null);
                  }}
                  className="p-1.5 rounded-lg text-white text-[11px] font-bold hover:opacity-90 cursor-pointer truncate"
                  style={{ background: ev.color }}
                >
                  {ev.time ? `${ev.time} ` : ''}
                  {ev.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EVENT DETAILS PANEL / DRAWER (PHASE 3, 4, 5, 6) */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl border border-[#D7E7F7] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="p-4 border-b border-[#D7E7F7] bg-[#F8FAFC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ background: selectedEvent.color || KIND_COLOR[selectedEvent.kind as EventKind] }}
                />
                <h4 data-testid="event-details-drawer" className="text-[15px] font-bold text-[#0B2E57]">تفاصيل الموعد والحدث</h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Title & Status */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#004AA5] border border-blue-200/60">
                    {KIND_NAMES[selectedEvent.kind as EventKind]?.[lang] || selectedEvent.kind}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {selectedEvent.status === 'completed' ? '🟢 منجز' : '🔵 مجدول'}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900">{selectedEvent.title}</h3>
                {selectedEvent.subtitle && (
                  <p className="text-slate-500 mt-0.5 leading-relaxed">{selectedEvent.subtitle}</p>
                )}
              </div>

              {/* Date, Time, Duration & Location */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-slate-700">
                  <CalendarIcon className="w-4 h-4 text-[#004AA5]" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">التاريخ</span>
                    <span className="font-bold font-mono">{selectedEvent.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-[#004AA5]" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">الوقت</span>
                    <span className="font-bold font-mono">
                      {selectedEvent.time || 'طوال اليوم'}
                      {selectedEvent.endTime ? ` - ${selectedEvent.endTime}` : ''}
                    </span>
                  </div>
                </div>

                {selectedEvent.location && (
                  <div className="col-span-2 flex items-center gap-2 text-slate-700 pt-1.5 border-t border-slate-200/60">
                    <MapPin className="w-4 h-4 text-[#CC9048]" />
                    <span className="font-medium truncate">{selectedEvent.location}</span>
                  </div>
                )}
              </div>

              {/* PHASE 5: DEDICATED FOLLOW-UP FILE (ملف المتابعة) */}
              <div className="p-3.5 rounded-2xl bg-[#004AA5]/5 border border-[#004AA5]/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h5 className="font-black text-[#004AA5] text-xs flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>ملف المتابعة — Follow-Up File</span>
                  </h5>
                  {(selectedEvent.transactionRef || selectedEvent.linkedTransactionRef) && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                      Ref: {selectedEvent.transactionRef || selectedEvent.linkedTransactionRef}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">اسم العميل:</span>
                    <strong className="text-slate-800">
                      {selectedEvent.clientName || selectedEvent.linkedCustomerName || 'غير محدد'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">نوع الخدمة / المعاملة:</span>
                    <strong className="text-slate-800">
                      {selectedEvent.serviceType || selectedEvent.linkedServiceType || 'عام'}
                    </strong>
                  </div>
                  {selectedEvent.assignee && (
                    <div>
                      <span className="text-slate-400 block">الموظف المسؤول:</span>
                      <strong className="text-slate-800">{selectedEvent.assignee}</strong>
                    </div>
                  )}
                  {(selectedEvent.clientPhone || selectedEvent.linkedCustomerPhone) && (
                    <div>
                      <span className="text-slate-400 block">رقم الهاتف:</span>
                      <strong className="text-slate-800 font-mono" dir="ltr">
                        {selectedEvent.clientPhone || selectedEvent.linkedCustomerPhone}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#004AA5]/15">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEvent(null);
                      if (onOpenContact && selectedEvent.linkedCustomerId) {
                        onOpenContact(selectedEvent.linkedCustomerId);
                      } else {
                        onGotoTab?.('contacts');
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[#004AA5] font-bold text-[11px] hover:bg-blue-50 transition cursor-pointer"
                  >
                    فتح ملف العميل
                  </button>

                  {selectedEvent.systemTab && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEvent(null);
                        onGotoTab?.(selectedEvent.systemTab);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#004AA5] text-white font-bold text-[11px] hover:bg-[#2A83D5] transition cursor-pointer"
                    >
                      فتح المعاملة
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCreateTaskFromEvent}
                    className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-700 font-bold text-[11px] hover:bg-purple-50 transition cursor-pointer flex items-center gap-1"
                  >
                    <ListTodo size={12} />
                    <span>إنشاء مهمة متابعة</span>
                  </button>
                </div>
              </div>

              {/* Reschedule Audit Trail (Phase 4.4) */}
              {selectedEvent.rescheduleHistory && selectedEvent.rescheduleHistory.length > 0 && (
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-2">
                  <h5 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>سجل إعادة الجدولة (Audit Trail)</span>
                  </h5>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {selectedEvent.rescheduleHistory.map((h: EventRescheduleLog) => (
                      <div key={h.id} className="text-[10px] text-amber-800 bg-white/80 p-2 rounded-xl">
                        <div className="flex items-center justify-between font-bold">
                          <span>
                            تم النقل من <code className="font-mono">{h.previousDate}</code> إلى{' '}
                            <code className="font-mono">{h.newDate}</code>
                          </span>
                          <span className="text-slate-400 font-normal">{h.rescheduledAt.slice(0, 10)}</span>
                        </div>
                        {h.note && <p className="text-slate-600 mt-0.5 italic">«{h.note}»</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 border-t border-[#D7E7F7] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {!selectedEvent.isSystemRecord && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartEditing(selectedEvent)}
                      className="px-3 py-1.5 rounded-xl border border-blue-200 bg-white text-[#004AA5] font-bold text-xs hover:bg-blue-50 transition cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 size={13} />
                      <span>تعديل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenRescheduleModal(selectedEvent)}
                      className="px-3 py-1.5 rounded-xl bg-[#004AA5] text-white font-bold text-xs hover:bg-[#2A83D5] transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <CalendarCheck2 size={13} />
                      <span>إعادة الجدولة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicateEvent(selectedEvent)}
                      className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                      title="نسخ الحدث"
                    >
                      <Copy size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      className="p-1.5 rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="حذف الحدث"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}

                {/* Snooze & Complete Actions */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSnoozeOpen(!snoozeOpen)}
                    className="px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 font-bold text-xs hover:bg-amber-100 transition cursor-pointer flex items-center gap-1"
                  >
                    <Bell size={13} />
                    <span>تأجيل التنبيه</span>
                  </button>

                  {snoozeOpen && (
                    <div className="absolute bottom-10 right-0 z-50 w-44 bg-white rounded-xl shadow-2xl border border-slate-200 py-1 text-xs">
                      {[
                        [5, '5 دقائق'],
                        [15, '15 دقيقة'],
                        [30, '30 دقيقة'],
                        [60, 'ساعة واحدة'],
                        [1440, 'غداً نفس الوقت'],
                      ].map(([mins, label]) => (
                        <button
                          key={mins}
                          onClick={() => handleSnooze(mins as number)}
                          className="w-full px-3 py-1.5 text-right hover:bg-amber-50 font-medium text-slate-700 block transition cursor-pointer"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleMarkCompleted}
                  className="px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1"
                >
                  <CheckCircle2 size={13} />
                  <span>تم الإنجاز</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK RESCHEDULING MODAL (PHASE 4) */}
      {rescheduleModalOpen && rescheduleTargetEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl border border-[#D7E7F7] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="p-4 border-b border-[#D7E7F7] bg-[#F8FAFC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck2 className="w-5 h-5 text-[#004AA5]" />
                <h4 className="text-[15px] font-black text-[#0B2E57]">إعادة الجدولة السريعة — Reschedule</h4>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1">الحدث المستهدف:</span>
                <strong className="text-sm text-slate-900 block">{rescheduleTargetEvent.title}</strong>
                <span className="text-slate-500 font-mono">
                  الموعد الحالي: {rescheduleTargetEvent.date} ({rescheduleTargetEvent.time || 'طوال اليوم'})
                </span>
              </div>

              {/* Quick Date Buttons (Phase 4.2) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5">خيارات سريعة:</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickDate('today')}
                    className="flex-1 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition cursor-pointer"
                  >
                    اليوم
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate('tomorrow')}
                    className="flex-1 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition cursor-pointer"
                  >
                    غداً
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate('nextWeek')}
                    className="flex-1 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition cursor-pointer"
                  >
                    الأسبوع القادم
                  </button>
                </div>
              </div>

              {/* Date & Time Input */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">التاريخ الجديد:</label>
                  <input
                    type="date"
                    required
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full h-9 px-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">وقت البدء الجديد:</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full h-9 px-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Rescheduling Note */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  سبب أو ملاحظة إعادة الجدولة (اختياري):
                </label>
                <input
                  type="text"
                  value={rescheduleNote}
                  onChange={(e) => setRescheduleNote(e.target.value)}
                  placeholder="مثال: طلب العميل التأجيل ليوم الأحد…"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div className="p-4 border-t border-[#D7E7F7] bg-[#F8FAFC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRescheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteReschedule}
                className="px-5 py-2 rounded-xl bg-[#004AA5] text-white font-bold text-xs hover:bg-[#2A83D5] transition cursor-pointer shadow-sm"
              >
                تأكيد إعادة الجدولة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVENT COMPOSER / FULL EDITOR MODAL */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl border border-[#D7E7F7] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="p-4 border-b border-[#D7E7F7] bg-[#F8FAFC] flex items-center justify-between">
              <h4 className="text-[15px] font-bold text-[#0B2E57]">
                {editingEventId
                  ? l('تعديل الحدث والموعد', 'Edit Event', 'Modifier l’événement')
                  : l('إضافة حدث جديد إلى التقويم', 'Add New Calendar Event', 'Nouvel événement')}
              </h4>
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveComposer} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#5E7086] mb-1">
                  {l('عنوان الحدث', 'Event Title', 'Titre de l’événement')} *
                </label>
                <input
                  type="text"
                  required
                  value={compTitle}
                  onChange={(e) => setCompTitle(e.target.value)}
                  placeholder={l('مثال: اجتماع موعد قنصلي، حجز طيران…', 'e.g. Consulate Appointment…', 'Ex: Rendez-vous…')}
                  className="w-full h-9 px-3 text-[13px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white focus:border-[#004AA5] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#5E7086] mb-1">
                    {l('نوع الحدث والتصنيف', 'Event Type', 'Type d’événement')}
                  </label>
                  <select
                    value={compKind}
                    onChange={(e) => {
                      const k = e.target.value as EventKind;
                      setCompKind(k);
                      setCompColor(KIND_COLOR[k]);
                    }}
                    className="w-full h-9 px-2 text-[12px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white outline-none font-bold text-[#0B2E57]"
                  >
                    <option value="pers">{KIND_NAMES.pers[lang]}</option>
                    <option value="meeting">{KIND_NAMES.meeting[lang]}</option>
                    <option value="reminder">{KIND_NAMES.reminder[lang]}</option>
                    <option value="cns">{KIND_NAMES.cns[lang]}</option>
                    <option value="fly">{KIND_NAMES.fly[lang]}</option>
                    <option value="debt">{KIND_NAMES.debt[lang]}</option>
                    <option value="task">{KIND_NAMES.task[lang]}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5E7086] mb-1">
                    {l('التاريخ', 'Date', 'Date')} *
                  </label>
                  <input
                    type="date"
                    required
                    value={compDate}
                    onChange={(e) => setCompDate(e.target.value)}
                    className="w-full h-9 px-2 text-[12px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white outline-none font-mono text-[#0B2E57]"
                  />
                </div>
              </div>

              {/* Time and All Day */}
              <div className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#D7E7F7] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold text-[#0B2E57]">
                    {l('طوال اليوم (All Day)', 'All Day', 'Toute la journée')}
                  </label>
                  <input
                    type="checkbox"
                    checked={compAllDay}
                    onChange={(e) => setCompAllDay(e.target.checked)}
                    className="w-4 h-4 rounded text-[#004AA5] focus:ring-0 cursor-pointer"
                  />
                </div>

                {!compAllDay && (
                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-[#D7E7F7]/60">
                    <div>
                      <label className="block text-[10px] font-bold text-[#5E7086] mb-0.5">
                        {l('وقت البدء', 'Start Time', 'Heure de début')}
                      </label>
                      <input
                        type="time"
                        value={compTime}
                        onChange={(e) => setCompTime(e.target.value)}
                        className="w-full h-8 px-2 text-[11px] rounded-lg border border-[#D7E7F7] bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#5E7086] mb-0.5">
                        {l('وقت الانتهاء', 'End Time', 'Heure de fin')}
                      </label>
                      <input
                        type="time"
                        value={compEndTime}
                        onChange={(e) => setCompEndTime(e.target.value)}
                        className="w-full h-8 px-2 text-[11px] rounded-lg border border-[#D7E7F7] bg-white font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CRM Customer & Transaction Relationship */}
              <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-2">
                <span className="font-bold text-[#004AA5] text-xs block">
                  ربط بملف عميل أو معاملة (CRM Integration):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">اسم العميل:</label>
                    <input
                      type="text"
                      value={compCustomerName}
                      onChange={(e) => setCompCustomerName(e.target.value)}
                      placeholder="اسم العميل المرتبط…"
                      className="w-full h-8 px-2 text-[11px] rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">مرجع المعاملة:</label>
                    <input
                      type="text"
                      value={compTransactionRef}
                      onChange={(e) => setCompTransactionRef(e.target.value)}
                      placeholder="كود الحجز / PNR…"
                      className="w-full h-8 px-2 text-[11px] rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Smart Reminder & Recurrence */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#5E7086] mb-1">
                    {l('التنبيه الذكي', 'Smart Reminder', 'Rappel intelligent')}
                  </label>
                  <select
                    value={compReminderMinutes ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCompReminderMinutes(v === '' ? undefined : Number(v));
                    }}
                    className="w-full h-9 px-2 text-[11px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] font-medium"
                  >
                    <option value="">{l('بدون تنبيه', 'No reminder', 'Sans rappel')}</option>
                    <option value="0">{l('في نفس الوقت', 'At event time', 'À l’heure')}</option>
                    <option value="5">{l('قبل 5 دقائق', '5 minutes before', '5 min avant')}</option>
                    <option value="15">{l('قبل 15 دقيقة', '15 minutes before', '15 min avant')}</option>
                    <option value="30">{l('قبل 30 دقيقة', '30 minutes before', '30 min avant')}</option>
                    <option value="60">{l('قبل ساعة واحدة', '1 hour before', '1 h avant')}</option>
                    <option value="180">{l('قبل 3 ساعات', '3 hours before', '3 h avant')}</option>
                    <option value="1440">{l('قبل يوم كامل', '1 day before', '1 j avant')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5E7086] mb-1">
                    {l('التكرار (Recurrence)', 'Recurrence', 'Répétition')}
                  </label>
                  <select
                    value={compRecurrence}
                    onChange={(e) => setCompRecurrence(e.target.value as any)}
                    className="w-full h-9 px-2 text-[11px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] font-medium"
                  >
                    <option value="none">{l('لا يتكرر', 'Does not repeat', 'Ne se répète pas')}</option>
                    <option value="daily">{l('يومياً', 'Daily', 'Tous les jours')}</option>
                    <option value="weekly">{l('أسبوعياً', 'Weekly', 'Toutes les semaines')}</option>
                    <option value="monthly">{l('شهرياً', 'Monthly', 'Tous les mois')}</option>
                    <option value="yearly">{l('سنوياً', 'Yearly', 'Tous les ans')}</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-[11px] font-bold text-[#5E7086] mb-1">
                  {l('المكان أو رابط الاجتماع', 'Location / Link', 'Lieu / Lien')}
                </label>
                <input
                  type="text"
                  value={compLocation}
                  onChange={(e) => setCompLocation(e.target.value)}
                  placeholder={l('المكتب، مقر القنصلية، Google Meet…', 'Office, Google Meet…', 'Bureau, Meet…')}
                  className="w-full h-9 px-3 text-[12px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-[#5E7086] mb-1">
                  {l('ملاحظات وتفاصيل', 'Notes & Details', 'Notes')}
                </label>
                <textarea
                  rows={2}
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  placeholder={l('تفاصيل الموعد الإضافية…', 'Details…', 'Détails…')}
                  className="w-full p-2.5 text-[12px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D7E7F7] text-[12px] font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  {l('إلغاء', 'Cancel', 'Annuler')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#004AA5] text-white text-[12px] font-bold hover:bg-[#2A83D5] transition cursor-pointer shadow-sm"
                >
                  {editingEventId ? l('تحديث الموعد', 'Update Event', 'Mettre à jour') : l('حفظ الحدث', 'Save Event', 'Enregistrer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
