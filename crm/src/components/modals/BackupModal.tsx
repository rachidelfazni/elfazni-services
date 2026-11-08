import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Database,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { ui } = useUITranslation();
  const { exportDataJSON, importDataJSON, resetToMockData, clearAllData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataJSON(content);
      if (success) {
        setMessage({ text: 'تمت استعادة البيانات بنجاح تام!', type: 'success' });
      } else {
        setMessage({
          text: 'فشل استيراد الملف. يرجى التأكد من اختيار ملف JSON صحيح تم تصديره من هذا النظام.',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetMock = () => {
    if (
      window.confirm(
        'هل أنت متأكد من استعادة البيانات التجريبية الأولية؟ سيتم استبدال البيانات الحالية بالبيانات التوضيحية.'
      )
    ) {
      resetToMockData();
      setMessage({ text: 'تمت إعادة تعيين البيانات التجريبية بنجاح!', type: 'success' });
    }
  };

  const handleClear = () => {
    if (
      window.confirm(
        'تحذير هام: هل أنت متأكد من حذف ومسح كافة البيانات نهائياً؟ لن تتمكن من استعادتها إلا إذا قمت بعمل نسخة احتياطية مسبقاً.'
      )
    ) {
      clearAllData();
      setMessage({ text: 'تم مسح وتصفير كافة البيانات من النظام.', type: 'success' });
    }
  };

  return (
    <div role="dialog" aria-modal="true" data-crm-dialog="BackupModal" className="crm-dialog fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#004AA5]/30 text-[#4083D0] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">{ui("إدارة البيانات والنسخ الاحتياطي")}</h3>
              <p className="text-xs text-slate-400">{ui("حفظ، تصدير، واستعادة بيانات المعاملات والمالية")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{ui(message.text)}</span>
            </div>
          )}

          {/* Export */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs text-slate-800">{ui("تصدير نسخة احتياطية (Export JSON)")}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{ui("تنزيل ملف يحتوي على كافة مواعيد القنصلية، التذاكر، الديون والتواريخ")}</p>
            </div>
            <button
              onClick={exportDataJSON}
              className="flex items-center gap-1.5 bg-[#004AA5] hover:bg-[#2A83D5] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{ui("تنزيل النسخة")}</span>
            </button>
          </div>

          {/* Download Master Prompt MD */}
          <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs text-indigo-950">{ui("تحميل ملف البرومبت الشامل (Master Prompt .MD)")}</h4>
              <p className="text-[11px] text-indigo-700 mt-0.5">{ui("ملف Markdown متكامل يوثق بنية النظام، الصلاحيات، الحسابات البنكية، والخدمات")}</p>
            </div>
            <a
              href="/ELFAZNI_MASTER_PROMPT.md"
              download="ELFAZNI_MASTER_PROMPT.md"
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{ui("تنزيل .MD")}</span>
            </a>
          </div>

          {/* Import */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs text-slate-800">{ui("استعادة بيانات (Import JSON)")}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">{ui("تحميل ملف نسخة احتياطية واستعادة المعاملات السابقة")}</p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="json-file-input"
              />
              <label
                htmlFor="json-file-input"
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{ui("اختيار ملف")}</span>
              </label>
            </div>
          </div>

          {/* Reset Mock */}
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs text-amber-900">{ui("إعادة تعيين البيانات التجريبية (Demo Data)")}</h4>
              <p className="text-[11px] text-amber-700 mt-0.5">{ui("استرجاع الأمثلة الافتراضية الجاهزة للتجربة والتعلم")}</p>
            </div>
            <button
              onClick={handleResetMock}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{ui("إعادة تعيين")}</span>
            </button>
          </div>

          {/* Danger Zone: Clear */}
          <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-xs text-rose-900">{ui("تصفير ومسح كافة البيانات")}</h4>
              <p className="text-[11px] text-rose-700 mt-0.5">{ui("مسح جميع المعاملات لبدء استخدام فارغ جديد")}</p>
            </div>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{ui("مسح الكل")}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
          >{ui("إغلاق النافذة")}</button>
        </div>
      </div>
    </div>
  );
};
