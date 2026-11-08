import React from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';

export interface WorkspaceTabItem {
  id: string;
  title: string;
  icon?: React.ReactNode;
  isDirty?: boolean;
  closable?: boolean;
  badge?: string | number;
}

interface WorkspaceTabsProps {
  tabs: WorkspaceTabItem[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab?: (id: string) => void;
  onNewTab?: () => void;
  className?: string;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  className = '',
}) => {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1 px-2 border-b border-[#D7E7F7] bg-slate-50/80 overflow-x-auto scrollbar-none select-none text-xs ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelectTab(tab.id)}
            className={`group inline-flex items-center gap-2 px-3 py-2 border-b-2 text-xs font-bold transition cursor-pointer max-w-[200px] truncate ${
              isActive
                ? 'border-[#004AA5] text-[#004AA5] bg-white rounded-t-xl shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-t-lg'
            }`}
          >
            {tab.icon ? (
              <span className="shrink-0">{tab.icon}</span>
            ) : (
              <FileText size={13} className="shrink-0 opacity-70" />
            )}

            <span className="truncate flex-1">{tab.title}</span>

            {/* Dirty Unsaved Dot */}
            {tab.isDirty && (
              <span
                className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                title="تغييرات غير محفوظة"
              />
            )}

            {/* Close Button */}
            {tab.closable !== false && onCloseTab && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition shrink-0"
                title="إغلاق التبويب"
              >
                <X size={11} />
              </button>
            )}
          </div>
        );
      })}

      {onNewTab && (
        <button
          type="button"
          onClick={onNewTab}
          className="p-1.5 rounded-lg text-slate-400 hover:text-[#004AA5] hover:bg-slate-200/60 transition ms-1"
          title="فتح علامة تبويب جديدة"
        >
          +
        </button>
      )}
    </div>
  );
};
