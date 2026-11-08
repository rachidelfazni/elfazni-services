import {
  ContactRemindersPanel,
  usePendingContactReminders,
} from "../contacts/ContactReminders";
import { useUITranslation } from "../../i18n/useUITranslation";
import React from "react";
import { useApp } from "../../context/AppContext";
import {
  X,
  Bell,
  CheckCircle2,
  Clock,
  MessageCircle,
  Phone,
  AlertTriangle,
  Building2,
  Plane,
  Sparkles,
} from "lucide-react";
import { formatDateTime, generateWhatsAppLink } from "../../utils/formatters";

interface RemindersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RemindersDrawer: React.FC<RemindersDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const { ui } = useUITranslation();
  const contactReminders = usePendingContactReminders();
  const {
    consulateAppointments,
    flightBookings,
    completeReminder,
    snoozeReminder,
    setSpotlightItem,
  } = useApp();

  if (!isOpen) return null;

  // Gather all reminders
  const allReminders: {
    type: "consulate" | "flight";
    item: any;
    reminder: any;
    isDue: boolean;
  }[] = [];

  const now = Date.now();

  consulateAppointments.forEach((c) => {
    if (c.reminder && !c.reminder.isCompleted) {
      const remTime = new Date(c.reminder.targetDateTime).getTime();
      allReminders.push({
        type: "consulate",
        item: c,
        reminder: c.reminder,
        isDue: remTime <= now,
      });
    }
  });

  flightBookings.forEach((f) => {
    if (f.reminder && !f.reminder.isCompleted) {
      const remTime = new Date(f.reminder.targetDateTime).getTime();
      allReminders.push({
        type: "flight",
        item: f,
        reminder: f.reminder,
        isDue: remTime <= now,
      });
    }
  });

  // Sort due first, then chronological
  allReminders.sort((a, b) => {
    if (a.isDue && !b.isDue) return -1;
    if (!a.isDue && b.isDue) return 1;
    return (
      new Date(a.reminder.targetDateTime).getTime() -
      new Date(b.reminder.targetDateTime).getTime()
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs no-print">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-r border-slate-200 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">
                {ui("تذكيرات اليوم والمتابعات العاجلة")}
              </h3>
              <p className="text-[11px] text-slate-400">
                {allReminders.length + contactReminders.length}{" "}
                {ui("تذكير مجدول قيد المتابعة")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reminders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <ContactRemindersPanel onOpenContact={onClose} />
          {allReminders.length > 0 ? (
            allReminders.map(({ type, item, reminder, isDue }) => {
              const waLink = generateWhatsAppLink(
                item.phoneNumber,
                item.clientName,
                item.remainingAmount,
                type === "consulate"
                  ? item.appointmentType
                  : `حجز طيران ${item.pnr}`,
                item.currency,
              );

              return (
                <div
                  key={reminder.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isDue
                      ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-200 shadow-sm"
                      : "bg-slate-50 border-slate-200 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                          isDue
                            ? "bg-amber-500 text-white animate-pulse"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {type === "consulate" ? (
                          <Building2 className="w-4 h-4" />
                        ) : (
                          <Plane className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">
                          {item.clientName}
                        </h4>
                        <span className="text-[10px] text-slate-500">
                          {type === "consulate"
                            ? ui("معاملة قنصلية")
                            : `تذكرة PNR: ${item.pnr}`}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isDue
                          ? "bg-red-500 text-white shadow-xs"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isDue
                        ? ui("🔔 مستحق الآن!")
                        : formatDateTime(reminder.targetDateTime)}
                    </span>
                  </div>

                  {/* Reason Text */}
                  <div className="mt-2 text-xs bg-white/80 p-2 rounded-xl border border-slate-200/80 text-slate-800 font-medium">
                    {reminder.reason}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/70 gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => completeReminder(type, item.id)}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{ui("تم الإنجاز ✅")}</span>
                      </button>

                      <button
                        onClick={() => snoozeReminder(type, item.id, 60)}
                        title={ui("تأجيل التذكير لساعة واحدة")}
                        className="inline-flex items-center gap-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition"
                      >
                        <Clock className="w-3 h-3" />
                        <span>{ui("تأجيل ساعة")}</span>
                      </button>
                    </div>

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition"
                      title={ui("واتساب")}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })
          ) : contactReminders.length ? null : (
            <div className="text-center py-16 text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
              <p className="font-bold text-slate-700 text-xs">
                {ui("لا توجد تذكيرات معلقة حالياً")}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {ui(
                  "يمكنك جدولة تذكير لأي معاملة بالضغط على علامة الجرس أو زر التذكير.",
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
