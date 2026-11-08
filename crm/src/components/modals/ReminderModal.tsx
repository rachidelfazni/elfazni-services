import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Bell, Calendar, Clock, Trash2, CheckCircle2 } from 'lucide-react';
import { getQuickReminderDate } from '../../utils/formatters';

export const ReminderModal: React.FC = () => {
  const { ui } = useUITranslation();
  const { reminderModalTarget, setReminderModalTarget, setReminder, updateConsulateAppointment, updateFlightBooking } = useApp();

  const [targetDateTime, setTargetDateTime] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (reminderModalTarget) {
      if (reminderModalTarget.currentReminder) {
        setTargetDateTime(reminderModalTarget.currentReminder.targetDateTime);
        setReason(reminderModalTarget.currentReminder.reason);
      } else {
        setTargetDateTime(getQuickReminderDate('hour'));
        setReason('متابعة سداد أو إجراء للعميل');
      }
    }
  }, [reminderModalTarget]);

  if (!reminderModalTarget) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDateTime) {
      alert('يرجى تحديد وقت وتاريخ التذكير');
      return;
    }
    setReminder(reminderModalTarget.type, reminderModalTarget.id, {
      targetDateTime,
      reason: reason.trim() || 'تذكير متابعة',
    });
    setReminderModalTarget(null);
  };

  const handleClearReminder = () => {
    if (reminderModalTarget.type === 'consulate') {
      updateConsulateAppointment(reminderModalTarget.id, { reminder: undefined });
    } else {
      updateFlightBooking(reminderModalTarget.id, { reminder: undefined });
    }
    setReminderModalTarget(null);
  };

  const handleQuickPreset = (preset: 'hour' | 'today_evening' | 'tomorrow_morning' | 'next_week') => {
    setTargetDateTime(getQuickReminderDate(preset));
  };

  return (
    <div role="dialog" aria-modal="true" data-crm-dialog="ReminderModal" className="crm-dialog fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="crm-dialog-header bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">{ui("ضبط تذكير فوري (Reminder)")}</h3>
              <p className="text-xs text-amber-100">{ui("العميل:")}<strong className="font-bold">{reminderModalTarget.clientName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => setReminderModalTarget(null)}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">{ui("خيارات التذكير السريع:")}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickPreset('hour')}
                className="p-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:border-amber-300 transition text-center"
              >{ui("⏱️ بعد ساعة")}</button>
              <button
                type="button"
                onClick={() => handleQuickPreset('today_evening')}
                className="p-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:border-amber-300 transition text-center"
              >{ui("🌆 مساء اليوم (19:00)")}</button>
              <button
                type="button"
                onClick={() => handleQuickPreset('tomorrow_morning')}
                className="p-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:border-amber-300 transition text-center"
              >{ui("☀️ غداً صباحاً (09:30)")}</button>
              <button
                type="button"
                onClick={() => handleQuickPreset('next_week')}
                className="p-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:border-amber-300 transition text-center"
              >{ui("📅 الأسبوع القادم")}</button>
            </div>
          </div>

          {/* Date and Time Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{ui("تاريخ ووقت التنبيه")}<span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="datetime-local"
                required
                value={targetDateTime}
                onChange={(e) => setTargetDateTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{ui("سبب التذكير / المطلوب تنفيذه")}</label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={ui("مثال: متابعة سداد الدفعة الثانية، إرسال تذكرة الطيران، فحص رد القنصلية...")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {reminderModalTarget.currentReminder ? (
              <button
                type="button"
                onClick={handleClearReminder}
                className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />{ui("حذف التذكير")}</button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReminderModalTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >{ui("إلغاء")}</button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-sm transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{ui("حفظ التذكير")}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
