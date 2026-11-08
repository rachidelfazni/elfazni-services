import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  NotebookPen,
  CalendarDays,
  ListTodo,
  CalendarCheck2,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useCopy } from "../../i18n/useCopy";
import { formatMoney } from "../../utils/formatters";
import type { ActiveTab } from "../../types";
import {
  productivityService,
  NoteItem,
  TaskItem,
  CalEventItem,
} from "../../services/productivityService";
import { ModernNotesEditor } from "./ModernNotesEditor";
import { ModernTaskManager } from "./ModernTaskManager";
import { ModernCalendar } from "./ModernCalendar";
import "./tools.css";

export type ToolsTab = "calendar" | "notebook" | "tasks" | "booking";

interface CalendarWorkspaceProps {
  open: boolean;
  initialTab?: ToolsTab;
  onClose: () => void;
}

const KIND_COLOR = {
  cns: "#004AA5",
  fly: "#0284C7",
  debt: "#DC2626",
};

export const CalendarWorkspace: React.FC<CalendarWorkspaceProps> = ({
  open,
  initialTab = "calendar",
  onClose,
}) => {
  const {
    consulateAppointments,
    flightBookings,
    debts,
    setActiveTab,
  } = useApp();
  const { user } = useAuth();
  const { l, language } = useCopy();

  const username = user?.username || "owner";

  const [tab, setTab] = useState<ToolsTab>(initialTab);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<CalEventItem[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);

  // Load productivity state on mount and when modal opens
  useEffect(() => {
    if (!open) return;
    setTab(initialTab);

    productivityService.fetchState(username).then((state) => {
      setNotes(state.notes || []);
      setTasks(state.tasks || []);
      setEvents(state.events || []);
      if (state.notes && state.notes.length > 0 && !activeNoteId) {
        setActiveNoteId(state.notes[0].id);
      }
    });

    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    return () => {
      document.body.style.overflow = before;
    };
  }, [open, username, initialTab]);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [initialTab, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleNotesChange = (updatedNotes: NoteItem[]) => {
    setNotes(updatedNotes);
  };

  const handleTasksChange = (updatedTasks: TaskItem[]) => {
    setTasks(updatedTasks);
  };

  const handleConvertToTask = async (note: NoteItem, taskOptions?: any) => {
    const res = await productivityService.convertNoteToTask(note, taskOptions, username);
    setTasks((prev) => [res.task, ...prev]);
    setNotes((prev) => prev.map((n) => (n.id === res.updatedNote.id ? res.updatedNote : n)));
    return res;
  };

  const handleCreateTaskFromSelection = async (selectedText: string, note: NoteItem) => {
    const newTask = await productivityService.createTaskFromSelection(selectedText, note, {}, username);
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const gotoTab = (t: ActiveTab) => {
    onClose();
    setActiveTab(t);
  };

  if (!open) return null;

  /* ============================== Booking Pane ============================== */
  const bookingPane = (
    <div className="flex-1 overflow-y-auto p-6 bg-[#FAFBFD]" dir={language === "ar" ? "rtl" : "ltr"}>
      {consulateAppointments.length + flightBookings.length + debts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D7E7F7] bg-white p-12 text-center text-[13px] leading-7 text-[#5E7086]">
          <CalendarCheck2 size={36} aria-hidden="true" className="mx-auto mb-3 text-[#CC9048]" />
          <strong className="block text-[#0B2E57] text-[15px] font-bold mb-2">
            {l("لا معاملات بعد", "No records yet", "Aucun dossier")}
          </strong>
          {l(
            "عند إضافة موعد قنصلية أو حجز طيران أو دين من الشاشة الرئيسية، ستظهر بطاقاتها هنا مع جردها في التقويم تلقائيًا.",
            "Once you add a consulate appointment, flight booking or debt from the main workspace, its card appears here and on the calendar automatically.",
            "Dès l'ajout d'un rendez-vous, d'un vol ou d'une dette, ses cartes apparaissent ici et dans le calendrier."
          )}
        </div>
      ) : (
        <>
          <p className="text-[12px] text-[#5E7086] mb-4 flex items-center gap-1.5 font-bold">
            <CalendarCheck2 size={14} className="text-[#CC9048]" />
            {l(
              "انقر على بطاقة لفتح قسمها وإدارتها في النظام مباشرة.",
              "Click a card to jump directly to its management section.",
              "Cliquez sur une carte pour ouvrir sa section."
            )}
          </p>
          <div className="tools-bookgrid">
            {consulateAppointments.slice(0, 30).map((c) => (
              <button key={c.id} type="button" className="tools-bookcard" onClick={() => gotoTab("consulate")}>
                <span className="tools-bookhead">
                  <i className="tools-bookdot" style={{ background: KIND_COLOR.cns }} />
                  <h4 dir="auto">{c.clientName || "—"}</h4>
                  <span className="tools-chip ms-auto" style={{ background: KIND_COLOR.cns }}>CNS</span>
                </span>
                <p dir="ltr">{c.submissionDate}</p>
                <p dir="auto">{c.appointmentType}</p>
                <p dir="ltr">{formatMoney(c.price, c.currency)}</p>
              </button>
            ))}
            {flightBookings.slice(0, 30).map((f) => (
              <button key={f.id} type="button" className="tools-bookcard" onClick={() => gotoTab("flights")}>
                <span className="tools-bookhead">
                  <i className="tools-bookdot" style={{ background: KIND_COLOR.fly }} />
                  <h4 dir="auto">{f.clientName || "—"}</h4>
                  <span className="tools-chip ms-auto" style={{ background: KIND_COLOR.fly }}>FLY</span>
                </span>
                <p dir="ltr">{f.bookingDate} · {f.pnr}</p>
                <p dir="auto">{f.airlineAndRoute}</p>
                <p dir="ltr">{formatMoney(f.sellingPrice, f.currency)}</p>
              </button>
            ))}
            {debts.slice(0, 20).map((d) => (
              <button key={d.id} type="button" className="tools-bookcard" onClick={() => gotoTab("debts")}>
                <span className="tools-bookhead">
                  <i className="tools-bookdot" style={{ background: KIND_COLOR.debt }} />
                  <h4 dir="auto">{d.clientName || "—"}</h4>
                  <span className="tools-chip ms-auto" style={{ background: KIND_COLOR.debt }}>DEBT</span>
                </span>
                <p dir="ltr">{d.date}</p>
                <p dir="auto">{l("دين", "Debt", "Dette")}</p>
                <p dir="ltr">{formatMoney(d.totalAmount, d.currency)}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const tabs: [ToolsTab, string, React.ReactNode][] = [
    ["calendar", l("التقويم", "Calendar", "Calendrier"), <CalendarDays key="i" size={15} />],
    ["notebook", l("المفكرة الذكية", "Notebook", "Carnet"), <NotebookPen key="i" size={15} />],
    ["tasks", l("إدارة المهام", "Tasks", "Tâches"), <ListTodo key="i" size={15} />],
    ["booking", l("الحجوزات والديون", "Bookings & Debts", "Réservations"), <CalendarCheck2 key="i" size={15} />],
  ];

  return createPortal(
    <div
      className="tools-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="tools-dialog"
        role="dialog"
        aria-modal="true"
        ref={dialogRef}
        tabIndex={-1}
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {/* Topbar with standardized brand logo */}
        <header className="tools-topbar">
          <div className="hidden lg:flex items-center shrink-0">
            <img
              src="/admin/crm/assets/logos/kit/elfazni-horizontal-on-white.svg"
              alt="ELFAZNI SERVICES"
              className="h-9 sm:h-10 w-auto max-w-[165px] object-contain"
            />
          </div>

          <nav className="tools-tabs" aria-label={l("أدوات الإنتاجية", "Productivity Suite", "Outils de productivité")}>
            {tabs.map(([id, label, icon]) => (
              <button
                key={id}
                type="button"
                className={`tools-tab${tab === id ? " is-active" : ""}`}
                onClick={() => setTab(id)}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <button
            type="button"
            className="tools-close"
            onClick={onClose}
            aria-label={l("إغلاق", "Close", "Fermer")}
            title={l("إغلاق (Esc)", "Close (Esc)", "Fermer (Esc)")}
          >
            <X size={16} />
          </button>
        </header>

        {/* Tab Panes */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {tab === "calendar" && (
            <ModernCalendar
              consulateAppointments={consulateAppointments}
              flightBookings={flightBookings}
              debts={debts}
              tasks={tasks}
              username={username}
              lang={language as any}
              onGotoTab={(t) => gotoTab(t as ActiveTab)}
            />
          )}

          {tab === "notebook" && (
            <ModernNotesEditor
              notes={notes}
              onNotesChange={handleNotesChange}
              onConvertToTask={handleConvertToTask}
              onCreateTaskFromSelection={handleCreateTaskFromSelection}
              username={username}
              activeNoteId={activeNoteId}
              onSelectNoteId={setActiveNoteId}
              onNavigateToTasks={() => setTab("tasks")}
              onClose={onClose}
            />
          )}

          {tab === "tasks" && (
            <ModernTaskManager
              initialTasks={tasks}
              onTasksChange={handleTasksChange}
              username={username}
              lang={language as any}
              onOpenNote={(noteId) => {
                setActiveNoteId(noteId);
                setTab("notebook");
              }}
              onGotoTab={(t) => gotoTab(t as ActiveTab)}
            />
          )}

          {tab === "booking" && bookingPane}
        </div>
      </div>
    </div>,
    document.body
  );
};
