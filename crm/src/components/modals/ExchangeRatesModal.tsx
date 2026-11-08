import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExchangeRates, SUPPORTED_CURRENCIES } from '../../types';
import { X, DollarSign, RefreshCw, Check, ArrowRightLeft } from 'lucide-react';
import { DEFAULT_EXCHANGE_RATES } from '../../utils/formatters';

interface ExchangeRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExchangeRatesModal: React.FC<ExchangeRatesModalProps> = ({ isOpen, onClose }) => {
  const { ui } = useUITranslation();
  const { exchangeRates, setExchangeRates } = useApp();
  const [rates, setRates] = useState<ExchangeRates>(exchangeRates);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setExchangeRates(rates);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    setRates(DEFAULT_EXCHANGE_RATES);
  };

  // Live conversion simulator
  const sampleUSD = 100;
  const inEUR = (sampleUSD * rates.EUR).toFixed(2);
  const inTRY = (sampleUSD * rates.TRY).toFixed(2);
  const inMAD = (sampleUSD * rates.MAD).toFixed(2);

  return (
    <div role="dialog" aria-modal="true" data-crm-dialog="ExchangeRatesModal" className="crm-dialog fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header */}
        <div className="crm-dialog-header bg-gradient-to-r from-[#004AA5] via-indigo-700 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">{ui("أسعار الصرف المرجعية (Exchange Rates)")}</h3>
              <p className="text-xs text-[#D7E7F7]">{ui("تحويل العملات واحتساب المجموع التقديري الموحد")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">{ui("يتم تحديد أسعار الصرف بالنسبة لـ")}<strong className="text-slate-800">{ui("1 دولار أمريكي (1 USD)")}</strong>{ui(". تُستخدم هذه الأسعار في التحويل الفوري عند الدفع بعملة مختلفة وفي لوحة التقارير الموحدة.")}</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* USD */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <span>{SUPPORTED_CURRENCIES.USD.flag}</span>
                <span>{ui("الدولار الأمريكي (USD)")}</span>
              </label>
              <input
                type="number"
                disabled
                value={1}
                className="w-full bg-slate-200/70 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">{ui("العملة المرجعية الأساسية (1.00)")}</span>
            </div>

            {/* EUR */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <span>{SUPPORTED_CURRENCIES.EUR.flag}</span>
                <span>{ui("اليورو الأوروبي (EUR €)")}</span>
              </label>
              <input
                type="number"
                step="0.001"
                min="0.1"
                value={rates.EUR}
                onChange={(e) => setRates({ ...rates, EUR: Number(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#2A83D5] focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">1 USD = {rates.EUR} EUR</span>
            </div>

            {/* TRY */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <span>{SUPPORTED_CURRENCIES.TRY.flag}</span>
                <span>{ui("الليرة التركية (TRY ₺)")}</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={rates.TRY}
                onChange={(e) => setRates({ ...rates, TRY: Number(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#2A83D5] focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">1 USD = {rates.TRY} TRY</span>
            </div>

            {/* MAD */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <span>{SUPPORTED_CURRENCIES.MAD.flag}</span>
                <span>{ui("الدرهم المغربي (MAD د.م)")}</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={rates.MAD}
                onChange={(e) => setRates({ ...rates, MAD: Number(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#2A83D5] focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">1 USD = {rates.MAD} MAD</span>
            </div>
          </div>

          {/* Live Simulator Preview */}
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
              <span>{ui("معاينة فورية للتحويل: 100 دولار ($) تعادل:")}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
              <div className="bg-white p-2 rounded-xl border border-indigo-100">
                <span className="text-slate-500 text-[10px] block">{ui("اليورو")}</span>
                <span className="text-indigo-700">{inEUR} €</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-indigo-100">
                <span className="text-slate-500 text-[10px] block">{ui("الليرة التركية")}</span>
                <span className="text-indigo-700">{inTRY} ₺</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-indigo-100">
                <span className="text-slate-500 text-[10px] block">{ui("الدرهم المغربي")}</span>
                <span className="text-indigo-700">{inMAD} {ui("د.م")}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />{ui("استعادة الافتراضي")}</button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >{ui("إلغاء")}</button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#004AA5] hover:bg-[#2A83D5] shadow-sm transition flex items-center gap-1.5"
              >
                {saved ? <Check className="w-4 h-4" /> : null}
                <span>{ui("حفظ الأسعار")}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
