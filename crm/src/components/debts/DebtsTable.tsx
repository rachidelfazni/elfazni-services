import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatMoney,
  formatDate,
  formatDateTime,
  generateWhatsAppLink,
  exportToCSV,
  convertCurrency,
  OFFICIAL_BANK_ACCOUNTS,
  getBankDetailsCopyText,
} from '../../utils/formatters';
import {
  Receipt,
  Search,
  DollarSign,
  MessageCircle,
  Phone,
  AlertTriangle,
  Building2,
  Plane,
  CheckCircle2,
  AlertOctagon,
  Download,
  Copy,
  Trash2,
  Bell,
  Star,
  Pin,
  Check,
  Tag,
  ArrowRightLeft,
} from 'lucide-react';
import { SupportedCurrency, SUPPORTED_CURRENCIES } from '../../types';

export const DebtsTable: React.FC = () => {
  const { ui } = useUITranslation();
  const {
    debts,
    settleDebt,
    duplicateConsulateAppointment,
    duplicateFlightBooking,
    deleteConsulateAppointment,
    deleteFlightBooking,
    setReminderModalTarget,
    setItemFlag,
    inlineUpdateConsulate,
    inlineUpdateFlight,
    exchangeRates,
    unifiedBaseCurrency,
    isUnifiedViewEnabled,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'consulate' | 'flight'>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');

  // Inline editing
  const [inlineEditing, setInlineEditing] = useState<{ id: string; field: 'name' | 'amount'; value: any } | null>(null);
  const [copiedBankKey, setCopiedBankKey] = useState<string | null>(null);

  const handleCopyBankText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBankKey(key);
    setTimeout(() => setCopiedBankKey(null), 2000);
  };

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      if (filterType !== 'all' && d.type !== filterType) return false;
      if (filterCurrency !== 'all' && d.currency !== filterCurrency) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          d.clientName.toLowerCase().includes(q) ||
          d.phoneNumber.includes(q) ||
          d.serviceDetails.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [debts, filterType, filterCurrency, search]);

  // Debts totals by currency
  const debtTotalsByCurrency = useMemo(() => {
    const totals: Record<SupportedCurrency, number> = { TRY: 0, MAD: 0, EUR: 0, USD: 0 };
    filteredDebts.forEach((d) => {
      totals[d.currency] = (totals[d.currency] || 0) + d.remainingAmount;
    });

    let unified = 0;
    Object.entries(totals).forEach(([curr, amount]) => {
      unified += convertCurrency(amount, curr as SupportedCurrency, unifiedBaseCurrency, exchangeRates);
    });

    return { totals, unified };
  }, [filteredDebts, unifiedBaseCurrency, exchangeRates]);

  const handleSettle = (d: any) => {
    if (
      window.confirm(
        `تأكيد تسديد دين الزبون "${d.clientName}" بمبلغ ${formatMoney(d.remainingAmount, d.currency)}؟\nسيتم تصفير الدين فوراً وتحديث المعاملة كمدفوعة بالكامل.`
      )
    ) {
      settleDebt(d.type, d.recordId);
    }
  };

  const handleDuplicate = (type: 'consulate' | 'flight', recordId: string) => {
    if (type === 'consulate') {
      duplicateConsulateAppointment(recordId);
    } else {
      duplicateFlightBooking(recordId);
    }
  };

  const handleDelete = (type: 'consulate' | 'flight', recordId: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف معاملة الزبون "${name}"؟`)) {
      if (type === 'consulate') {
        deleteConsulateAppointment(recordId);
      } else {
        deleteFlightBooking(recordId);
      }
    }
  };

  const handleSaveInline = (d: any) => {
    if (!inlineEditing) return;
    if (inlineEditing.field === 'name' && inlineEditing.value.trim()) {
      if (d.type === 'consulate') {
        inlineUpdateConsulate(d.recordId, 'clientName', inlineEditing.value.trim());
      } else {
        inlineUpdateFlight(d.recordId, 'clientName', inlineEditing.value.trim());
      }
    } else if (inlineEditing.field === 'amount') {
      const newAmount = Number(inlineEditing.value) || 0;
      if (d.type === 'consulate') {
        inlineUpdateConsulate(d.recordId, 'remainingAmount', newAmount);
      } else {
        inlineUpdateFlight(d.recordId, 'remainingAmount', newAmount);
      }
    }
    setInlineEditing(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'اسم الزبون',
      'رقم الهاتف',
      'نوع المعاملة',
      'تفاصيل الخدمة',
      'العملة',
      'إجمالي المبلغ',
      'المبلغ المدفوع',
      'المبلغ المتبقي (الدين)',
      'تاريخ المعاملة',
    ];

    const rows = filteredDebts.map((d) => [
      d.clientName,
      d.phoneNumber,
      d.type === 'consulate' ? 'موعد قنصلية' : 'حجز طيران',
      d.serviceDetails,
      d.currency,
      d.totalAmount,
      d.paidAmount,
      d.remainingAmount,
      d.date,
    ]);

    exportToCSV(`قائمة_الديون_ELFAZNI_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Multi-Currency Breakdown */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{ui("جدول الديون والمستحقات المالية المعلقة")}</h2>
              <span className="text-xs font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full">
                {filteredDebts.length} {ui("زبون مدين")}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{ui("متابعة ديون القنصلية وحجوزات الطيران مع إمكانية التعديل السريع والتسديد بضغطة زر")}</p>
          </div>
        </div>

        {/* Currency Totals Display */}
        <div className="flex flex-wrap items-center gap-3 bg-rose-50/80 border border-rose-200 rounded-2xl p-3 px-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-rose-800 block">{ui("إجمالي الديون مفصلة:")}</span>
            <div className="flex flex-wrap gap-2 text-xs font-bold">
              {Object.entries(debtTotalsByCurrency.totals)
                .filter(([_, val]) => val > 0)
                .map(([curr, val]) => (
                  <span
                    key={curr}
                    className="bg-white px-2 py-0.5 rounded-md border border-rose-200 text-rose-700 shadow-2xs"
                  >
                    {SUPPORTED_CURRENCIES[curr as SupportedCurrency]?.flag} {formatMoney(val, curr as SupportedCurrency)}
                  </span>
                ))}
            </div>
            {isUnifiedViewEnabled && (
              <p className="text-[11px] font-black text-rose-900 pt-0.5">{ui("المجموع التقديري:")}{formatMoney(debtTotalsByCurrency.unified, unifiedBaseCurrency)}
              </p>
            )}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer self-center"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{ui("تصدير Excel")}</span>
          </button>
        </div>
      </div>

      {/* Official Bank Accounts Bar (Auto-included in all WhatsApp Settlement Messages) */}
      <div className="bg-gradient-to-l from-[#0B2E57] via-[#133661] to-[#0B2E57] text-white rounded-2xl p-4 border border-[#CC9048]/40 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#CC9048]/20 text-[#CC9048] border border-[#CC9048]/30 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-[#CC9048]">{ui("الحسابات البنكية المعتمدة للتحويل والسداد (مضمنة تلقائياً في رسائل واتساب):")}</span>
              <button
                onClick={() => handleCopyBankText('holder', OFFICIAL_BANK_ACCOUNTS.accountHolder)}
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-lg text-xs font-black text-white border border-white/15 transition cursor-pointer"
                title={ui("نسخ اسم صاحب الحساب")}
              >
                <span>{OFFICIAL_BANK_ACCOUNTS.accountHolder}</span>
                {copiedBankKey === 'holder' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-[#CC9048]" />
                )}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* IBAN TRY */}
              <button
                onClick={() => handleCopyBankText('try', OFFICIAL_BANK_ACCOUNTS.ibanTRY)}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                title={ui("انقر لنسخ آيبان الليرة التركية (TRY)")}
              >
                <span className="font-extrabold text-[#2A83D5]">🇹🇷 IBAN TRY:</span>
                <span className="font-mono font-bold tracking-wide text-white" dir="ltr">
                  {OFFICIAL_BANK_ACCOUNTS.ibanTRY}
                </span>
                {copiedBankKey === 'try' ? (
                  <span className="text-[10px] font-bold text-emerald-400">{ui("تم النسخ ✓")}</span>
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                )}
              </button>

              {/* IBAN USD */}
              <button
                onClick={() => handleCopyBankText('usd', OFFICIAL_BANK_ACCOUNTS.ibanUSD)}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                title={ui("انقر لنسخ آيبان الدولار الأمريكي (USD)")}
              >
                <span className="font-extrabold text-emerald-400">🇺🇸 IBAN USD:</span>
                <span className="font-mono font-bold tracking-wide text-white" dir="ltr">
                  {OFFICIAL_BANK_ACCOUNTS.ibanUSD}
                </span>
                {copiedBankKey === 'usd' ? (
                  <span className="text-[10px] font-bold text-emerald-400">{ui("تم النسخ ✓")}</span>
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleCopyBankText('all', getBankDetailsCopyText())}
          className="inline-flex items-center justify-center gap-1.5 bg-[#CC9048] hover:bg-[#c6954c] text-[#0B2E57] px-3.5 py-2 rounded-xl text-xs font-black transition shrink-0 cursor-pointer shadow-xs"
        >
          {copiedBankKey === 'all' ? (
            <>
              <Check className="w-4 h-4" />
              <span>{ui("تم نسخ بيانات التحويل كاملة")}</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>{ui("نسخ رسالة الحساب البنكي")}</span>
            </>
          )}
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ui("بحث باسم الزبون المدين، الهاتف، تفاصيل الخدمة...")}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          {/* Currency Filter */}
          <select
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">{ui("كل العملات")}</option>
            {Object.values(SUPPORTED_CURRENCIES).map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >{ui("الكل (")}{debts.length})
            </button>
            <button
              onClick={() => setFilterType('consulate')}
              className={`px-3 py-1 rounded-lg transition ${
                filterType === 'consulate'
                  ? 'bg-white text-[#004AA5] shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >{ui("القنصلية")}</button>
            <button
              onClick={() => setFilterType('flight')}
              className={`px-3 py-1 rounded-lg transition ${
                filterType === 'flight'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >{ui("الطيران")}</button>
          </div>
        </div>
      </div>

      {/* Debts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">{ui("اسم الزبون ورقم الهاتف")}</th>
                <th className="py-3 px-4">{ui("النوع")}</th>
                <th className="py-3 px-4">{ui("تفاصيل الخدمة")}</th>
                <th className="py-3 px-4">{ui("العملة")}</th>
                <th className="py-3 px-4">{ui("تاريخ المعاملة")}</th>
                <th className="py-3 px-4">{ui("إجمالي السعر")}</th>
                <th className="py-3 px-4">{ui("المسدد")}</th>
                <th className="py-3 px-4">{ui("المتبقي (الدين)")}</th>
                <th className="py-3 px-4 text-center">{ui("الإجراءات السريعة")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDebts.length > 0 ? (
                filteredDebts.map((item) => {
                  const waLink = generateWhatsAppLink(
                    item.phoneNumber,
                    item.clientName,
                    item.remainingAmount,
                    item.serviceDetails,
                    item.currency
                  );

                  const isEditingThisName =
                    inlineEditing?.id === item.id && inlineEditing?.field === 'name';
                  const isEditingThisAmount =
                    inlineEditing?.id === item.id && inlineEditing?.field === 'amount';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition ${
                        item.isCompletedConsulate ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* Client Name & Phone with Double-click Inline Edit */}
                      <td className="py-3 px-4">
                        {isEditingThisName ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              autoFocus
                              value={inlineEditing!.value}
                              onChange={(e) =>
                                setInlineEditing({ ...inlineEditing!, value: e.target.value })
                              }
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveInline(item)}
                              className="text-xs font-bold border border-[#2A83D5] rounded px-1.5 py-0.5"
                            />
                            <button
                              onClick={() => handleSaveInline(item)}
                              className="p-1 bg-[#004AA5] text-white rounded text-[10px]"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onDoubleClick={() =>
                              setInlineEditing({ id: item.id, field: 'name', value: item.clientName })
                            }
                            title={ui("انقر نقراً مزدوجاً لتعديل الاسم")}
                            className="font-bold text-slate-900 text-sm cursor-pointer hover:text-[#004AA5]"
                          >
                            {item.clientName}
                          </div>
                        )}
                        <div
                          className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] mt-0.5"
                          dir="ltr"
                        >
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{item.phoneNumber}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.type === 'consulate' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#eaf4ff] text-[#004AA5] border border-[#B7CFEA] px-2 py-0.5 rounded-md">
                            <Building2 className="w-3 h-3" />{ui("قنصلية")}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <Plane className="w-3 h-3" />{ui("طيران")}</span>
                        )}
                      </td>

                      {/* Service Details */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="font-medium text-slate-800 truncate" title={item.serviceDetails}>
                          {item.serviceDetails}
                        </p>
                      </td>

                      {/* Currency */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {SUPPORTED_CURRENCIES[item.currency]?.flag} {item.currency}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(item.date)}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                        {formatMoney(item.totalAmount, item.currency)}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {formatMoney(item.paidAmount, item.settlementCurrency || item.currency)}
                      </td>

                      {/* Remaining (Debt) with Double-click edit */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isEditingThisAmount ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              autoFocus
                              value={inlineEditing!.value}
                              onChange={(e) =>
                                setInlineEditing({ ...inlineEditing!, value: e.target.value })
                              }
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveInline(item)}
                              className="w-20 text-xs font-bold border border-red-500 rounded px-1.5 py-0.5"
                            />
                            <button
                              onClick={() => handleSaveInline(item)}
                              className="p-1 bg-red-600 text-white rounded text-[10px]"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span
                            onDoubleClick={() =>
                              setInlineEditing({
                                id: item.id,
                                field: 'amount',
                                value: item.remainingAmount,
                              })
                            }
                            title={ui("انقر نقراً مزدوجاً لتعديل مبلغ الدين")}
                            className="font-black text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md text-xs inline-block cursor-pointer hover:bg-rose-100"
                          >
                            {formatMoney(item.remainingAmount, item.currency)}
                          </span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {/* Settle Now */}
                          <button
                            onClick={() => handleSettle(item)}
                            title={ui("تسديد الدين بالكامل الآن")}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>{ui("تسديد الآن")}</span>
                          </button>

                          {/* WhatsApp Reminder */}
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={ui("إرسال تذكير سداد واتساب")}
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Set Reminder */}
                          <button
                            onClick={() =>
                              setReminderModalTarget({
                                type: item.type,
                                id: item.recordId,
                                clientName: item.clientName,
                                currentReminder: item.reminder,
                              })
                            }
                            title={ui("جدولة تذكير 🔔")}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <Bell className="w-4 h-4" />
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => handleDuplicate(item.type, item.recordId)}
                            title={ui("تكرار المعاملة (Duplicate)")}
                            className="p-1.5 text-slate-500 hover:text-[#004AA5] hover:bg-[#eaf4ff] rounded-lg transition"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(item.type, item.recordId, item.clientName)}
                            title={ui("حذف")}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
                    <p className="font-bold text-slate-700 text-sm">{ui("ممتاز! لا توجد ديون معلقة حالياً")}</p>
                    <p className="text-xs text-slate-400 mt-1">{ui("جميع المعاملات مسددة بنسبة 100%")}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
