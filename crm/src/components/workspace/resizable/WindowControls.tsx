import React from 'react';
import {
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Undo2,
  Redo2,
  Save,
  X,
  SlidersHorizontal,
} from 'lucide-react';

interface WindowControlsProps {
  onClose?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  onCollapse?: () => void;
  isCollapsed?: boolean;
  collapseDirection?: 'left' | 'right';
  onResetLayout?: () => void;
  onSave?: () => void;
  saveStatus?: 'saved' | 'saving' | 'failed' | 'unsaved';
  onUndo?: () => void;
  canUndo?: boolean;
  onRedo?: () => void;
  canRedo?: boolean;
  showSave?: boolean;
  showUndoRedo?: boolean;
  showReset?: boolean;
  className?: string;
  isRtl?: boolean;
}

export const WindowControls: React.FC<WindowControlsProps> = ({
  onClose,
  onMaximize,
  isMaximized = false,
  onCollapse,
  isCollapsed = false,
  collapseDirection = 'left',
  onResetLayout,
  onSave,
  saveStatus = 'saved',
  onUndo,
  canUndo = false,
  onRedo,
  canRedo = false,
  showSave = false,
  showUndoRedo = false,
  showReset = true,
  className = '',
  isRtl = true,
}) => {
  return (
    <div className={`flex items-center gap-1 select-none text-slate-600 ${className}`}>
      {/* Undo & Redo (Content editing) */}
      {showUndoRedo && (
        <div className="flex items-center gap-0.5 border-e border-slate-200 pe-1.5 me-1">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-600 cursor-pointer"
            title={isRtl ? 'تراجع عن التعديل (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
            aria-label={isRtl ? 'تراجع' : 'Undo'}
          >
            <Undo2 size={13} />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-600 cursor-pointer"
            title={isRtl ? 'إعادة التعديل (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
            aria-label={isRtl ? 'إعادة' : 'Redo'}
          >
            <Redo2 size={13} />
          </button>
        </div>
      )}

      {/* Save Button with Status Indicator */}
      {showSave && onSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
            saveStatus === 'saved'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              : saveStatus === 'saving'
              ? 'bg-amber-50 border-amber-200 text-amber-700 cursor-wait'
              : saveStatus === 'failed'
              ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
              : 'bg-[#004AA5] text-white border-transparent hover:bg-[#003B84]'
          }`}
          title={isRtl ? 'حفظ التغييرات (Ctrl+S)' : 'Save changes (Ctrl+S)'}
        >
          <Save size={13} className={saveStatus === 'saving' ? 'animate-spin' : ''} />
          <span>
            {saveStatus === 'saving'
              ? isRtl ? 'جاري الحفظ…' : 'Saving…'
              : saveStatus === 'saved'
              ? isRtl ? 'تم الحفظ' : 'Saved'
              : saveStatus === 'failed'
              ? isRtl ? 'فشل الحفظ' : 'Failed'
              : isRtl ? 'حفظ' : 'Save'}
          </span>
        </button>
      )}

      {/* Reset Layout */}
      {showReset && onResetLayout && (
        <button
          type="button"
          onClick={onResetLayout}
          className="p-1.5 rounded-lg text-slate-500 hover:text-[#004AA5] hover:bg-blue-50 transition cursor-pointer"
          title={isRtl ? 'إعادة ضبط أبعاد النوافذ — Reset Layout' : 'Reset layout dimensions'}
          aria-label={isRtl ? 'إعادة ضبط التخطيط' : 'Reset layout'}
        >
          <RotateCcw size={13} />
        </button>
      )}

      {/* Collapse / Expand Panel */}
      {onCollapse && (
        <button
          type="button"
          onClick={onCollapse}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
          title={
            isCollapsed
              ? isRtl ? 'توسيع اللوحة — Expand' : 'Expand panel'
              : isRtl ? 'تصغير اللوحة — Collapse' : 'Collapse panel'
          }
          aria-label={isCollapsed ? (isRtl ? 'توسيع' : 'Expand') : (isRtl ? 'تصغير' : 'Collapse')}
        >
          {isCollapsed ? (
            collapseDirection === 'left' ? <ChevronRight size={14} /> : <ChevronLeft size={14} />
          ) : (
            collapseDirection === 'left' ? <ChevronLeft size={14} /> : <ChevronRight size={14} />
          )}
        </button>
      )}

      {/* Maximize / Restore */}
      {onMaximize && (
        <button
          type="button"
          onClick={onMaximize}
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            isMaximized
              ? 'bg-[#004AA5] text-white hover:bg-[#003B84]'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
          title={
            isMaximized
              ? isRtl ? 'استعادة الحجم الطبيعي — Restore' : 'Restore panel size'
              : isRtl ? 'تكبير لشاشة كاملة — Maximize' : 'Maximize panel'
          }
          aria-label={isMaximized ? (isRtl ? 'استعادة' : 'Restore') : (isRtl ? 'تكبير' : 'Maximize')}
        >
          {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      )}

      {/* Close Panel */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          title={isRtl ? 'إغلاق — Close (Esc)' : 'Close (Esc)'}
          aria-label={isRtl ? 'إغلاق' : 'Close'}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
