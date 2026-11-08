import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ListPlus, Trash2, Plus, Building2, Plane, CreditCard } from 'lucide-react';
import { SystemLists } from '../../types';

interface CustomListsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomListsModal: React.FC<CustomListsModalProps> = ({ isOpen, onClose }) => {
  const { ui } = useUITranslation();
  const { systemLists, addCustomItem, removeCustomItem } = useApp();

  const [activeTab, setActiveTab] = useState<keyof SystemLists>('appointmentTypes');
  const [newItemInput, setNewItemInput] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemInput.trim()) return;
    addCustomItem(activeTab, newItemInput.trim());
    setNewItemInput('');
  };

  const tabs: { key: keyof SystemLists; label: string; icon: React.ReactNode }[] = [
    { key: 'appointmentTypes', label: 'أنواع المواعيد والتأشيرات', icon: <Building2 className="w-4 h-4" /> },
    { key: 'airlines', label: 'شركات الطيران', icon: <Plane className="w-4 h-4" /> },
    { key: 'paymentMethods', label: 'طرق الدفع والتسديد', icon: <CreditCard className="w-4 h-4" /> },
  ];

  const currentItems = systemLists[activeTab] || [];

  return (
    <div role="dialog" aria-modal="true" data-crm-dialog="CustomListsModal" className="crm-dialog fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#004AA5]/30 text-[#4083D0] flex items-center justify-center">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">{ui("تخصيص قوائم النظام (Custom Lists)")}</h3>
              <p className="text-xs text-slate-400">{ui("إضافة وحذف الخيارات المنسدلة في الاستمارات")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition ${
                activeTab === tab.key
                  ? 'bg-white text-[#004AA5] shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              <span className="truncate">{ui(tab.label)}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Add input */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newItemInput}
              onChange={(e) => setNewItemInput(e.target.value)}
              placeholder={ui("اكتب عنصراً جديداً لإضافته للقائمة...")}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-[#2A83D5] focus:outline-none"
            />
            <button
              type="submit"
              className="bg-[#004AA5] hover:bg-[#2A83D5] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{ui("إضافة")}</span>
            </button>
          </form>

          {/* List items */}
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {currentItems.length > 0 ? (
              currentItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs transition"
                >
                  <span className="font-semibold text-slate-800">{ui(item)}</span>
                  <button
                    onClick={() => removeCustomItem(activeTab, item)}
                    title={ui("حذف من القائمة")}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center py-6 text-xs text-slate-400">{ui("القائمة فارغة")}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition"
          >{ui("إغلاق")}</button>
        </div>
      </div>
    </div>
  );
};
