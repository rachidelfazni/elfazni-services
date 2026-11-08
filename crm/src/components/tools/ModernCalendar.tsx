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
} from 'lucide-react';
import {
  productivityService,
  CalEventItem,
  EventKind,
  TaskItem,
} from '../../services/productivityService';

interface ModernCalendarProps {
  consulateAppointments?: any[];
  flightBookings?: any[];
  debts?: any[];
  tasks?: TaskItem[];
  onGotoTab?: (tab: string) => void;
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

const WD_MINI = {
  ar: ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'],
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  fr: ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'],
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
  onGotoTab,
  lang = 'ar',
  username = 'owner',
}) => {
  const [events, setEvents] = useState<CalEventItem[]>([]);
  const [view, setView] = useState<CalendarView>('month');
  const [cursorDate, setCursorDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(isoOf(new Date()));

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
  const [compCustomer, setCompCustomer] = useState('');

  // Event Detail Popover
  const [activePopper, setActivePopper] = useState<{
    event: any;
    x: number;
    y: number;
  } | null>(null);

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
    const list: Array<{
      id: string;
      title: string;
      kind: EventKind;
      date: string;
      time?: string;
      endTime?: string;
      allDay?: boolean;
      durationMin?: number;
      subtitle?: string;
      location?: string;
      color?: string;
      isSystemRecord?: boolean;
      systemTab?: string;
    }> = [];

    // 1. Personal & custom events from productivity store
    if (sources.pers || sources.meeting || sources.reminder) {
      events.forEach((e) => {
        if (sources[e.kind]) {
          list.push({
            id: e.id,
            title: e.title,
            kind: e.kind,
            date: e.date,
            time: e.time,
            endTime: e.endTime,
            allDay: e.allDay,
            durationMin: e.durationMin || 60,
            subtitle: e.description,
            location: e.location,
            color: e.color || KIND_COLOR[e.kind],
            isSystemRecord: false,
          });
        }
      });
    }

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
            title: `دين: ${db.clientName || 'عميل'} (${db.totalAmount || 0} ${db.currency || 'MAD'})`,
            kind: 'debt',
            date: d,
            allDay: true,
            subtitle: `مبلغ مستحق: ${db.totalAmount || 0} ${db.currency || 'MAD'}`,
            color: KIND_COLOR.debt,
            isSystemRecord: true,
            systemTab: 'debts',
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
          });
        }
      });
    }

    return list;
  }, [events, consulateAppointments, flightBookings, debts, tasks, sources]);

  // Dynamic counts for legend
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
    setCompCustomer('');
    setComposerOpen(true);
  };

  const handleEditEvent = (ev: CalEventItem) => {
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
    setCompCustomer(ev.linkedRecordTitle || '');
    setComposerOpen(true);
    setActivePopper(null);
  };

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
      linkedRecordTitle: compCustomer.trim() || undefined,
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

  const handleDeleteEvent = async (id: string) => {
    await productivityService.deleteEvent(id, username);
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setActivePopper(null);
  };

  // Month Grid Calculation
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

  // Week Grid Calculation
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
    <div className="w-full h-full flex flex-col bg-[#FAFBFD] text-[#0B2E57]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Calendar Control Bar */}
      <div className="p-4 bg-white border-b border-[#D7E7F7] flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
        <div className="flex items-center gap-2">
          {/* Month / Year Display */}
          <h3 className="text-[17px] font-bold text-[#0B2E57] min-w-[150px]">{formattedMonthYear}</h3>

          {/* Navigation Arrows */}
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

          {/* Add Event Button */}
          <button
            type="button"
            onClick={() => handleOpenComposer()}
            className="h-9 px-4 rounded-xl bg-[#004AA5] hover:bg-[#2A83D5] text-white text-[13px] font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Plus size={16} />
            <span>{l('حدث جديد', 'New Event', 'Nouvel événement')}</span>
          </button>
        </div>
      </div>

      {/* Main Container: Sidebar + Calendar Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left/Right Sidebar with Sources & Upcoming Events */}
        <div className="w-64 border-e border-[#D7E7F7] bg-white p-4 hidden md:flex flex-col gap-4 overflow-y-auto shrink-0">
          {/* Source Toggles */}
          <div>
            <span className="text-[11px] font-bold text-[#5E7086] block mb-2 uppercase tracking-wider">
              {l('التقويمات والمصادر', 'Calendars & Sources', 'Sources')}
            </span>
            <div className="space-y-1.5">
              {(
                [
                  ['cns', KIND_NAMES.cns[lang], KIND_COLOR.cns, counts.cns],
                  ['fly', KIND_NAMES.fly[lang], KIND_COLOR.fly, counts.fly],
                  ['debt', KIND_NAMES.debt[lang], KIND_COLOR.debt, counts.debt],
                  ['pers', KIND_NAMES.pers[lang], KIND_COLOR.pers, counts.pers],
                  ['task', KIND_NAMES.task[lang], KIND_COLOR.task, counts.task],
                  ['meeting', KIND_NAMES.meeting[lang], KIND_COLOR.meeting, counts.meeting],
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
              {l('الأحداث القادمة', 'Upcoming', 'À venir')}
            </span>
            <div className="space-y-2">
              {aggregatedEvents
                .filter((e) => e.date >= todayStr)
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 6)
                .map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setSelectedDate(ev.date);
                      setCursorDate(parseISO(ev.date));
                    }}
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

        {/* Main Calendar View Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {view === 'month' && (
            /* MONTH VIEW */
            <div className="h-full flex flex-col bg-white border border-[#D7E7F7] rounded-2xl overflow-hidden shadow-xs">
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
                  const dayEvents = eventsForDay(cellISO);

                  return (
                    <div
                      key={cellISO}
                      onClick={() => {
                        setSelectedDate(cellISO);
                        handleOpenComposer(cellISO);
                      }}
                      className={`p-1.5 flex flex-col justify-between transition cursor-pointer hover:bg-[#F8FAFC] relative ${
                        !isCurrentMonth ? 'bg-slate-50/60 opacity-50' : 'bg-white'
                      } ${isSelected ? 'ring-2 ring-inset ring-[#004AA5]/30' : ''}`}
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
                          <span className="text-[10px] font-mono text-[#5E7086]">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Event Chips */}
                      <div className="space-y-1 flex-1 overflow-hidden">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (ev.isSystemRecord && ev.systemTab) {
                                onGotoTab?.(ev.systemTab);
                              } else {
                                setActivePopper({
                                  event: ev,
                                  x: e.clientX,
                                  y: e.clientY,
                                });
                              }
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white truncate shadow-xs hover:opacity-90 transition"
                            style={{ background: ev.color || KIND_COLOR[ev.kind] }}
                            title={ev.title}
                          >
                            {ev.time ? `${ev.time} ` : ''}
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(cellISO);
                              setCursorDate(cellDate);
                              setView('day');
                            }}
                            className="text-[10px] font-bold text-[#004AA5] hover:underline px-1 cursor-pointer"
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
            <div className="h-full flex flex-col bg-white border border-[#D7E7F7] rounded-2xl overflow-hidden shadow-xs">
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
                      className="p-1 space-y-1.5 hover:bg-[#F8FAFC] transition cursor-pointer"
                    >
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePopper({
                              event: ev,
                              x: e.clientX,
                              y: e.clientY,
                            });
                          }}
                          className="p-2 rounded-xl text-white text-[11px] shadow-xs cursor-pointer hover:opacity-90"
                          style={{ background: ev.color || KIND_COLOR[ev.kind] }}
                        >
                          <div className="font-bold truncate">{ev.title}</div>
                          {ev.time && <div className="text-[10px] opacity-90 font-mono mt-0.5">{ev.time}</div>}
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
            <div className="bg-white border border-[#D7E7F7] rounded-2xl p-6 shadow-xs max-w-2xl mx-auto">
              <div className="flex items-center justify-between pb-4 border-b border-[#D7E7F7] mb-4">
                <div>
                  <h4 className="text-[18px] font-bold text-[#0B2E57]">
                    {cursorDate.toLocaleDateString(
                      lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US',
                      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
                    )}
                  </h4>
                  <p className="text-[12px] text-[#5E7086] mt-0.5">
                    {eventsForDay(isoOf(cursorDate)).length} {l('أحداث مجدولة لهذا اليوم', 'events scheduled today', 'événements')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenComposer(isoOf(cursorDate))}
                  className="h-8 px-3 rounded-lg bg-[#004AA5] text-white text-[12px] font-bold hover:bg-[#2A83D5] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>{l('إضافة حدث', 'Add', 'Ajouter')}</span>
                </button>
              </div>

              <div className="space-y-3">
                {eventsForDay(isoOf(cursorDate)).length === 0 ? (
                  <div className="py-12 text-center text-[#5E7086] text-[13px] border border-dashed border-[#D7E7F7] rounded-xl">
                    {l('لا توجد أحداث مجدولة لهذا اليوم.', 'No events scheduled for today.', 'Aucun événement prévu.')}
                  </div>
                ) : (
                  eventsForDay(isoOf(cursorDate)).map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] flex items-center justify-between gap-3 hover:border-[#004AA5] transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: ev.color }} />
                        <div>
                          <h5 className="text-[13px] font-bold text-[#0B2E57]">{ev.title}</h5>
                          {ev.subtitle && <p className="text-[11px] text-[#5E7086] mt-0.5">{ev.subtitle}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ev.time && (
                          <span className="px-2 py-0.5 rounded-md bg-white border border-[#D7E7F7] text-[11px] font-mono text-[#5E7086]">
                            {ev.time}
                          </span>
                        )}
                        {!ev.isSystemRecord && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {view === 'agenda' && (
            /* AGENDA / LIST VIEW */
            <div className="bg-white border border-[#D7E7F7] rounded-2xl p-6 shadow-xs max-w-3xl mx-auto space-y-4">
              <div className="pb-3 border-b border-[#D7E7F7] flex items-center justify-between">
                <div>
                  <h4 className="text-[16px] font-bold text-[#0B2E57]">
                    {l('أجندة المواعيد والمهام القادمة', 'Chronological Agenda', 'Agenda chronologique')}
                  </h4>
                  <p className="text-[12px] text-[#5E7086] mt-0.5">
                    {l('عرض زمني متسلسل لجميع الحجوزات والمواعيد والمهام', 'Timeline of all bookings, dates and tasks', 'Chronologie complète')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {aggregatedEvents
                  .filter((e) => e.date >= todayStr)
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3.5 rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] hover:bg-[#F1F6FB] flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ background: ev.color }} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-[13px] font-bold text-[#0B2E57]">{ev.title}</h5>
                            <span
                              className="px-2 py-0.2 rounded-md text-[10px] font-bold text-white"
                              style={{ background: ev.color }}
                            >
                              {KIND_NAMES[ev.kind]?.[lang] || ev.kind}
                            </span>
                          </div>
                          {ev.subtitle && <p className="text-[11px] text-[#5E7086] mt-0.5">{ev.subtitle}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-end" dir="ltr">
                          <div className="text-[11px] font-bold font-mono text-[#0B2E57]">{ev.date}</div>
                          {ev.time && <div className="text-[10px] text-[#5E7086] font-mono">{ev.time}</div>}
                        </div>
                        {ev.isSystemRecord && ev.systemTab && (
                          <button
                            type="button"
                            onClick={() => onGotoTab?.(ev.systemTab!)}
                            className="p-1.5 rounded-lg border border-[#D7E7F7] bg-white text-[#004AA5] hover:bg-[#EAF4FF] transition"
                            title={l('فتح في النظام', 'Open in CRM', 'Ouvrir')}
                          >
                            <ExternalLink size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Details Popover */}
      {activePopper && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setActivePopper(null)}
          />
          <div
            className="fixed z-40 bg-white border border-[#D7E7F7] rounded-2xl shadow-xl p-4 w-72 text-[#0B2E57]"
            style={{
              left: Math.min(activePopper.x, window.innerWidth - 300),
              top: Math.min(activePopper.y, window.innerHeight - 200),
            }}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#D7E7F7] mb-2">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: activePopper.event.color }} />
                <span className="text-[12px] font-bold truncate">{activePopper.event.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePopper(null)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            </div>

            <div className="text-[11px] space-y-1.5 text-[#5E7086]">
              <div className="flex items-center gap-1.5 font-mono" dir="ltr">
                <CalendarIcon size={12} className="text-[#004AA5]" />
                <span>{activePopper.event.date}</span>
                {activePopper.event.time && <span>· {activePopper.event.time}</span>}
              </div>
              {activePopper.event.subtitle && <p className="text-[#0B2E57]">{activePopper.event.subtitle}</p>}
            </div>

            <div className="mt-3 pt-2 border-t border-[#D7E7F7] flex items-center justify-between">
              {!activePopper.event.isSystemRecord ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(activePopper.event.id)}
                    className="text-[11px] text-rose-600 font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    <span>{l('حذف', 'Delete', 'Supprimer')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ev = events.find((x) => x.id === activePopper.event.id);
                      if (ev) handleEditEvent(ev);
                    }}
                    className="text-[11px] text-[#004AA5] font-bold hover:underline inline-flex items-center gap-1"
                  >
                    <Edit3 size={12} />
                    <span>{l('تعديل', 'Edit', 'Modifier')}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActivePopper(null);
                    if (activePopper.event.systemTab) onGotoTab?.(activePopper.event.systemTab);
                  }}
                  className="w-full py-1 rounded-lg bg-[#004AA5] text-white text-[11px] font-bold text-center hover:bg-[#2A83D5]"
                >
                  {l('عرض التفاصيل في النظام', 'View details in CRM', 'Voir dans le CRM')}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Event Composer Modal */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-2xl border border-[#D7E7F7] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="p-4 border-b border-[#D7E7F7] bg-[#F8FAFC] flex items-center justify-between">
              <h4 className="text-[14px] font-bold text-[#0B2E57]">
                {editingEventId
                  ? l('تعديل الحدث', 'Edit Event', 'Modifier l’événement')
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

            <form onSubmit={handleSaveComposer} className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5E7086] mb-1">
                  {l('عنوان الحدث', 'Event Title', 'Titre de l’événement')}
                </label>
                <input
                  type="text"
                  required
                  value={compTitle}
                  onChange={(e) => setCompTitle(e.target.value)}
                  placeholder={l('مثال: اجتماع عمل، تذكير اتصال…', 'e.g. Business Meeting…', 'Ex: Réunion…')}
                  className="w-full h-9 px-3 text-[13px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white focus:border-[#004AA5] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#5E7086] mb-1">
                    {l('نوع الحدث', 'Event Type', 'Type d’événement')}
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
                    {l('التاريخ', 'Date', 'Date')}
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
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D7E7F7] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-bold text-[#0B2E57]">
                    {l('طوال اليوم', 'All Day', 'Toute la journée')}
                  </label>
                  <input
                    type="checkbox"
                    checked={compAllDay}
                    onChange={(e) => setCompAllDay(e.target.checked)}
                    className="w-4 h-4 rounded text-[#004AA5] focus:ring-0 cursor-pointer"
                  />
                </div>

                {!compAllDay && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#D7E7F7]/60">
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

              {/* Location or online link */}
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
                  {l('ملاحظات إضافية', 'Notes', 'Notes')}
                </label>
                <textarea
                  rows={2}
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  placeholder={l('تفاصيل الموعد…', 'Details…', 'Détails…')}
                  className="w-full p-2 text-[12px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:bg-white outline-none resize-none"
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
                  {editingEventId ? l('تحديث', 'Update', 'Mettre à jour') : l('حفظ الحدث', 'Save', 'Enregistrer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
