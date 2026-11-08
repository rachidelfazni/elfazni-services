import React, { useEffect, useState } from "react";
import {
  NotebookPen,
  Trash2,
  Copy,
  Check,
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Download,
  X,
} from "lucide-react";
import { CRMDialog } from "../common/CRMDialog";
import { useCopy } from "../../i18n/useCopy";
import { useAuth } from "../../context/AuthContext";

/**
 * CRM personal tools — Notebook (دفتر الملاحظات) + Calendar (التقويم).
 * Both are per-user, persisted in localStorage so no backend schema
 * changes are required:
 *   elfazni_crm_notebook_<uid>  -> Note[]
 *   elfazni_crm_calendar_<uid>  -> CalEvent[]
 * Identity: white dialog, cobalt + warm-gold accents, Bahij type.
 */

interface Note {
  id: string;
  body: string;
  updatedAt: string;
}

interface CalEvent {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function useUserKey(base: string): string {
  const { user } = useAuth();
  return `${base}_${user?.username || "owner"}`;
}

/* ------------------------------- Notebook ------------------------------- */

export const NotebookModal: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const { l } = useCopy();
  const key = useUserKey("elfazni_crm_notebook");
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const saved = loadJSON<Note[]>(key, []);
    setNotes(saved);
    setActiveId(saved[0]?.id ?? null);
  }, [open, key]);

  const persist = (next: Note[]) => {
    setNotes(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  };

  const active = notes.find((n) => n.id === activeId) || null;

  const addNote = () => {
    const note: Note = {
      id: `n_${Date.now()}`,
      body: "",
      updatedAt: new Date().toISOString(),
    };
    persist([note, ...notes]);
    setActiveId(note.id);
  };

  const updateBody = (body: string) => {
    if (!active) return;
    persist(
      notes.map((n) =>
        n.id === active.id ? { ...n, body, updatedAt: new Date().toISOString() } : n,
      ),
    );
  };

  const removeNote = () => {
    if (!active) return;
    const next = notes.filter((n) => n.id !== active.id);
    persist(next);
    setActiveId(next[0]?.id ?? null);
  };

  const copyAll = async () => {
    const text = notes
      .map((n) => `# ${new Date(n.updatedAt).toLocaleString()}\n${n.body}`)
      .join("\n\n———\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const words = active?.body.trim() ? active.body.trim().split(/\s+/).length : 0;

  if (!open) return null;
  return (
    <CRMDialog
      title={l("دفتر الملاحظات", "Personal notebook", "Carnet de notes")}
      name="crm-notebook"
      onClose={onClose}
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={addNote}
            className="inline-flex items-center gap-2 min-h-[38px] px-4 rounded-xl bg-[#004AA5] text-white text-[13px] font-bold hover:bg-[#2A83D5] transition cursor-pointer"
          >
            <Plus size={16} /> {l("ملاحظة جديدة", "New note", "Nouvelle note")}
          </button>
          <button
            type="button"
            onClick={copyAll}
            className="inline-flex items-center gap-2 min-h-[38px] px-4 rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] text-[13px] font-bold text-[#0B2E57] hover:bg-[#EAF4FF] transition cursor-pointer"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
            {copied ? l("تم النسخ", "Copied", "Copié") : l("نسخ الكل", "Copy all", "Copier tout")}
          </button>
          {active && (
            <button
              type="button"
              onClick={removeNote}
              className="inline-flex items-center gap-2 min-h-[38px] px-4 rounded-xl border border-rose-200 bg-rose-50 text-[13px] font-bold text-rose-600 hover:bg-rose-100 transition cursor-pointer ms-auto"
            >
              <Trash2 size={15} /> {l("حذف", "Delete", "Supprimer")}
            </button>
          )}
        </div>

        {notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D7E7F7] bg-[#F8FAFC] p-10 text-center text-[13px] leading-7 text-[#5E7086]">
            <NotebookPen size={30} aria-hidden="true" className="mx-auto mb-3 text-[#CC9048]" />
            {l(
              "لا توجد ملاحظات بعد. أنشئ أول ملاحظة — تُحفظ تلقائيًا في جهازك باسم حسابك.",
              "No notes yet. Create your first note — it is saved locally under your account.",
              "Aucune note. Créez la première — elle est enregistrée localement sous votre compte.",
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-[minmax(0,190px)_minmax(0,1fr)]">
            <div className="max-h-[340px] overflow-y-auto rounded-2xl border border-[#D7E7F7] bg-[#F8FAFC] p-2 space-y-1">
              {notes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setActiveId(n.id)}
                  className={`w-full text-start px-3 py-2.5 rounded-xl text-[12px] cursor-pointer transition ${
                    n.id === activeId
                      ? "bg-white border border-[#004AA5]/50 shadow-sm"
                      : "hover:bg-white border border-transparent text-[#5E7086]"
                  }`}
                >
                  <span className="block font-bold text-[#0B2E57] truncate">
                    {n.body.trim().split("\n")[0]?.slice(0, 34) ||
                      l("(بدون عنوان)", "(untitled)", "(sans titre)")}
                  </span>
                  <span className="block text-[10px] font-mono text-[#5E7086] mt-0.5">
                    {new Date(n.updatedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative">
              <textarea
                value={active?.body ?? ""}
                onChange={(e) => updateBody(e.target.value)}
                dir="auto"
                placeholder={l("اكتب ملاحظتك هنا…", "Write your note here…", "Écrivez votre note ici…")}
                className="w-full h-[300px] resize-none rounded-2xl border border-[#D7E7F7] bg-[#F8FAFC] focus:border-[#CC9048] focus:bg-white p-4 text-[13px] leading-7 text-[#0B2E57] outline-none transition"
              />
              <span className="absolute bottom-3 end-4 text-[10px] font-mono text-[#5E7086] bg-white/90 rounded-full px-2 py-0.5 border border-[#D7E7F7]">
                {active ? `${words} ${l("كلمة", "words", "mots")}` : ""}
              </span>
            </div>
          </div>
        )}

        <p className="text-[11px] text-[#5E7086] flex items-center gap-1.5">
          <Check size={13} className="text-emerald-600" />
          {l(
            "الحفظ تلقائي في هذا المتصفح فقط (خاص بحسابك).",
            "Saved automatically in this browser only (private to your account).",
            "Enregistrement automatique dans ce navigateur uniquement (privé pour votre compte).",
          )}
        </p>
      </div>
    </CRMDialog>
  );
};

/* ------------------------------- Calendar ------------------------------- */

const WEEKDAYS_AR = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];
const WEEKDAYS_EN = ["S", "M", "T", "W", "T", "F", "S"];

export const CalendarModal: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const { l, language } = useCopy();
  const key = useUserKey("elfazni_crm_calendar");
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(todayISO);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!open) return;
    setEvents(loadJSON<CalEvent[]>(key, []));
    setCursor(new Date());
    setSelected(todayISO());
    setDraft("");
  }, [open, key]);

  const persist = (next: CalEvent[]) => {
    setEvents(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  };

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthLabel = new Intl.DateTimeFormat(
    language === "ar" ? "ar-MA" : language === "fr" ? "fr-FR" : "en-GB",
    { month: "long", year: "numeric" },
  ).format(cursor);

  const eventsOn = (iso: string) => events.filter((e) => e.date === iso);
  const selectedEvents = eventsOn(selected);

  const addEvent = () => {
    const text = draft.trim();
    if (!text || !selected) return;
    persist([...events, { id: `e_${Date.now()}`, date: selected, text }]);
    setDraft("");
  };

  const removeEvent = (id: string) => {
    persist(events.filter((e) => e.id !== id));
  };

  const exportAll = async () => {
    const lines = events
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((e) => `${e.date} — ${e.text}`);
    try {
      await navigator.clipboard.writeText(lines.join("\n") || "");
      setTimeout(() => {}, 0);
    } catch {}
  };

  if (!open) return null;
  return (
    <CRMDialog
      title={l("تقويم شخصي", "Personal calendar", "Calendrier personnel")}
      name="crm-calendar"
      onClose={onClose}
    >
      <div className="grid gap-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label={l("الشهر السابق", "Previous month", "Mois précédent")}
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="p-2 rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] text-[#0B2E57] hover:bg-[#EAF4FF] cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
          <strong className="text-[15px] font-black text-[#0B2E57]">{monthLabel}</strong>
          <button
            type="button"
            aria-label={l("الشهر التالي", "Next month", "Mois suivant")}
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="p-2 rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] text-[#0B2E57] hover:bg-[#EAF4FF] cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Grid */}
        <div className="rounded-2xl border border-[#D7E7F7] bg-[#F8FAFC] p-3">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-[#CC9048] mb-1">
            {(language === "ar" ? WEEKDAYS_AR : WEEKDAYS_EN).map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1" dir="ltr">
            {Array.from({ length: firstDay }).map((_, i) => (
              <span key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isToday = iso === todayISO();
              const isSelected = iso === selected;
              const has = eventsOn(iso).length > 0;
              return (
                <button
                  key={iso}
                  type="button"
                  dir="ltr"
                  onClick={() => setSelected(iso)}
                  className={`relative aspect-square min-h-[36px] rounded-xl text-[12px] font-bold cursor-pointer transition ${
                    isSelected
                      ? "bg-[#004AA5] text-white"
                      : isToday
                        ? "bg-[#E3C88F]/60 text-[#0B2E57] hover:bg-[#E3C88F]"
                        : "bg-white text-[#0B2E57] hover:bg-[#EAF4FF] border border-[#D7E7F7]/60"
                  }`}
                >
                  {day}
                  {has && (
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-1 inset-x-0 mx-auto w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-[#E3C88F]" : "bg-[#CC9048]"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Add event */}
        <div className="rounded-2xl border border-[#D7E7F7] bg-white p-3">
          <p className="text-[11px] font-black text-[#CC9048] mb-2">
            {l("المحدد:", "Selected:", "Sélectionné :")}{" "}
            <span dir="ltr" className="font-mono text-[#0B2E57]">
              {selected}
            </span>
          </p>
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEvent()}
              dir="auto"
              placeholder={l(
                "حدث أو موعد… (اضغط Enter)",
                "Event or reminder… (press Enter)",
                "Événement ou rendez-vous… (Entrée)",
              )}
              className="flex-1 min-w-0 min-h-[42px] rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] focus:border-[#CC9048] px-3 text-[13px] text-[#0B2E57] outline-none transition"
            />
            <button
              type="button"
              onClick={addEvent}
              className="inline-flex items-center gap-1.5 min-h-[42px] px-4 rounded-xl bg-[#004AA5] text-white text-[13px] font-bold hover:bg-[#2A83D5] transition cursor-pointer"
            >
              <Plus size={15} /> {l("إضافة", "Add", "Ajouter")}
            </button>
            <button
              type="button"
              onClick={exportAll}
              title={l("نسخ كل الأحداث", "Copy all events", "Copier tous les événements")}
              className="inline-flex items-center min-h-[42px] px-3 rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] text-[#0B2E57] hover:bg-[#EAF4FF] cursor-pointer"
            >
              <Download size={15} />
            </button>
          </div>

          <ul className="mt-3 space-y-1.5 max-h-[180px] overflow-y-auto">
            {selectedEvents.length === 0 ? (
              <li className="text-[12px] text-[#5E7086] flex items-center gap-2 py-1">
                <CalendarDays size={14} className="text-[#CC9048]" />
                {l(
                  "لا أحداث في هذا اليوم بعد.",
                  "No events for this day yet.",
                  "Aucun événement pour ce jour.",
                )}
              </li>
            ) : (
              selectedEvents.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-2 rounded-xl border border-[#D7E7F7] bg-[#F8FAFC] px-3 py-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#CC9048] shrink-0" />
                  <span dir="auto" className="text-[13px] font-semibold text-[#0B2E57] flex-1 min-w-0">
                    {e.text}
                  </span>
                  <button
                    type="button"
                    aria-label={l("حذف", "Delete", "Supprimer")}
                    onClick={() => removeEvent(e.id)}
                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        <p className="text-[11px] text-[#5E7086] flex items-center gap-1.5">
          <Check size={13} className="text-emerald-600" />
          {l(
            "أحداثك محفوظة تلقائيًا في هذا المتصفح فقط (خاص بحسابك).",
            "Events are saved automatically in this browser only (private to your account).",
            "Événements enregistrés automatiquement dans ce navigateur uniquement (privé pour votre compte).",
          )}
        </p>
      </div>
    </CRMDialog>
  );
};
