import React from 'react';
import { AlertCircle, Save, Trash2, X } from 'lucide-react';

interface UnsavedChangesGuardProps {
  open: boolean;
  title?: string;
  message?: string;
  onSaveAndClose: () => void | Promise<void>;
  onDiscardAndClose: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  isRtl?: boolean;
}

export const UnsavedChangesGuard: React.FC<UnsavedChangesGuardProps> = ({
  open,
  title,
  message,
  onSaveAndClose,
  onDiscardAndClose,
  onCancel,
  isSaving = false,
  isRtl = true,
}) => {
  if (!open) return null;

  const defaultTitle = isRtl
    ? 'تنبيه: توجد تغييرات غير محفوظة'
    : 'Warning: Unsaved Changes Detected';

  const defaultMessage = isRtl
    ? 'لقد قمت بإجراء تعديلات لم يتم حفظها بعد. هل ترغب في حفظ التعديلات قبل الإغلاق أم تجاهلها؟'
    : 'You have modified this document. Do you want to save your changes before closing, or discard them?';

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-amber-50/60">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-amber-950 truncate">
              {title || defaultTitle}
            </h3>
            <p className="text-[11px] text-amber-800/80">
              {isRtl ? 'حماية البيانات ومنع فقدان العمل' : 'Data loss prevention guard'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label={isRtl ? 'إلغاء' : 'Cancel'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Message */}
        <div className="p-5 text-xs text-slate-600 leading-relaxed">
          {message || defaultMessage}
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700 font-bold transition cursor-pointer"
          >
            {isRtl ? 'إلغاء الأمر' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={onDiscardAndClose}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>{isRtl ? 'تجاهل التغييرات' : 'Discard Changes'}</span>
          </button>

          <button
            type="button"
            onClick={onSaveAndClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-[#004AA5] hover:bg-[#003B84] text-white font-bold transition flex items-center gap-1.5 shadow-sm shadow-[#004AA5]/25 cursor-pointer disabled:opacity-50"
          >
            <Save size={13} className={isSaving ? 'animate-spin' : ''} />
            <span>
              {isSaving
                ? isRtl ? 'جاري الحفظ…' : 'Saving…'
                : isRtl ? 'حفظ وإغلاق' : 'Save & Close'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
