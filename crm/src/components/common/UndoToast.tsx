import { useUITranslation } from '../../i18n/useUITranslation';
import React from 'react';
import { useApp } from '../../context/AppContext';
import { RotateCcw, X, AlertCircle } from 'lucide-react';

export const UndoToast: React.FC = () => {
  const { ui } = useUITranslation();
  const { lastDeletedItem, undoLastDelete, clearUndoToast } = useApp();

  if (!lastDeletedItem) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom duration-200 no-print">
      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
      <span className="text-xs font-medium">{ui("تم حذف المعاملة (")}{lastDeletedItem.data.clientName})
      </span>
      <button
        onClick={undoLastDelete}
        className="flex items-center gap-1 bg-[#004AA5] hover:bg-[#2A83D5] text-white px-3 py-1 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>{ui("تراجع (Undo)")}</span>
      </button>
      <button
        onClick={clearUndoToast}
        className="text-slate-400 hover:text-white p-1 rounded-lg transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
