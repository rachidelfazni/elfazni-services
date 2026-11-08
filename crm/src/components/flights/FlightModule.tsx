import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FlightBooking, SUPPORTED_CURRENCIES } from '../../types';
import { formatMoney, formatDate, generateWhatsAppLink } from '../../utils/formatters';
import { getCustomerKey } from '../../utils/invoiceCalculations';
import {
  Plane,
  Search,
  PlusCircle,
  Phone,
  DollarSign,
  MessageCircle,
  FileEdit,
  Trash2,
  CheckCircle2,
  Copy,
  Bell,
  Check,
  FileText,
  ScrollText,
  AlertCircle,
} from 'lucide-react';

interface FlightModuleProps {
  onOpenNewModal: () => void;
  onEditItem: (item: FlightBooking) => void;
}

export const FlightModule: React.FC<FlightModuleProps> = ({ onOpenNewModal, onEditItem }) => {
  const { ui } = useUITranslation();
  const {
    flightBookings,
    deleteFlightBooking,
    duplicateFlightBooking,
    settleFlightPayment,
    inlineUpdateFlight,
    setReminderModalTarget,
    invoicedTransactionsMap,
    openInvoiceCreatorFromTransactions,
    openCustomerStatement,
    setActiveTab,
    setInvoiceSubView,
    setActiveInvoiceId,
    invoices,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  // Inline edit state
  const [inlineEditing, setInlineEditing] = useState<{ id: string; field: 'name' | 'price'; value: any } | null>(null);

  const filteredItems = useMemo(() => {
    return flightBookings.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          item.clientName.toLowerCase().includes(q) ||
          item.pnr.toLowerCase().includes(q) ||
          item.airlineAndRoute.toLowerCase().includes(q) ||
          item.phoneNumber.includes(q);
        if (!matches) return false;
      }

      if (filterPaymentStatus !== 'all' && item.paymentStatus !== filterPaymentStatus) return false;
      if (filterPaymentMethod !== 'all' && item.paymentMethod !== filterPaymentMethod) return false;
      if (filterCurrency !== 'all' && item.currency !== filterCurrency) return false;

      return true;
    });
  }, [flightBookings, search, filterPaymentStatus, filterPaymentMethod, filterCurrency]);

  const toggleSelectRow = (id: string) => {
    setSelectionError(null);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateInvoiceFromSelected = () => {
    setSelectionError(null);
    const res = openInvoiceCreatorFromTransactions(
      selectedIds.map((id) => ({ type: 'flight' as const, id }))
    );
    if (!res.success && res.message) {
      setSelectionError(res.message);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSaveInline = (item: FlightBooking) => {
    if (!inlineEditing) return;
    if (inlineEditing.field === 'name' && inlineEditing.value.trim()) {
      inlineUpdateFlight(item.id, 'clientName', inlineEditing.value.trim());
    } else if (inlineEditing.field === 'price') {
      inlineUpdateFlight(item.id, 'sellingPrice', Number(inlineEditing.value) || 0);
    }
    setInlineEditing(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">{ui("سجل تذاكر وحجوزات الطيران")}</h2>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              {filteredItems.length} {ui("تذكرة")}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{ui("متابعة أسعار الشراء، أسعار البيع، وصافي الأرباح مع إصدار الفواتير وكشوف الحساب")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCreateInvoiceFromSelected}
            disabled={selectedIds.length === 0}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedIds.length > 0
                ? 'bg-[#0B2E57] hover:bg-[#195BAC] text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            title={ui("حدد تذكرة أو أكثر لنفس المسافر غير مفوترة مسبقاً لإصدار فاتورة")}
          >
            <FileText className="w-4 h-4" />
            <span>{ui("إعداد فاتورة من المحدد (")}{selectedIds.length})</span>
          </button>

          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-2 bg-[#004AA5] hover:bg-[#0B2E57] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{ui("تسجيل تذكرة طيران جديدة")}</span>
          </button>
        </div>
      </div>

      {selectionError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{ui(selectionError)}</span>
          </div>
          <button
            onClick={() => setSelectionError(null)}
            className="text-rose-600 hover:underline text-[11px] cursor-pointer"
          >{ui("إغلاق")}</button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ui("بحث بالمسافر، PNR، الوجهة، الهاتف...")}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">{ui("كل العملات")}</option>
            {Object.values(SUPPORTED_CURRENCIES).map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">{ui("كل حالات السداد")}</option>
            <option value="paid">{ui("مدفوع بالكامل")}</option>
            <option value="partial">{ui("دفع جزئي")}</option>
            <option value="unpaid">{ui("لم يدفع (دين)")}</option>
          </select>
        </div>

        <div>
          <select
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">{ui("كل طرق الدفع")}</option>
            <option value="كاش / نقداً">{ui("كاش / نقداً")}</option>
            <option value="تحويل بنكي / Virement">{ui("تحويل بنكي")}</option>
            <option value="بطاقة بنكية / TPE">{ui("بطاقة بنكية")}</option>
            <option value="آجل / دين مؤجل">{ui("آجل / دين")}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-8 text-center">{ui("تحديد")}</th>
                <th className="py-3 px-4">{ui("المسافر والهاتف")}</th>
                <th className="py-3 px-4">{ui("رقم الحجز (PNR)")}</th>
                <th className="py-3 px-4">{ui("شركة الطيران والمسار")}</th>
                <th className="py-3 px-4">{ui("تاريخ الحجز")}</th>
                <th className="py-3 px-4">{ui("طريقة الدفع")}</th>
                <th className="py-3 px-4">{ui("التكلفة")}</th>
                <th className="py-3 px-4">{ui("سعر البيع")}</th>
                <th className="py-3 px-4">{ui("صافي الربح")}</th>
                <th className="py-3 px-4">{ui("المحصل")}</th>
                <th className="py-3 px-4">{ui("المتبقي (الدين)")}</th>
                <th className="py-3 px-4 text-center">{ui("الإجراءات")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const hasDebt = item.remainingAmount > 0;
                  const waLink = generateWhatsAppLink(
                    item.phoneNumber,
                    item.clientName,
                    item.remainingAmount,
                    `تذكرة طيران PNR: ${item.pnr}`,
                    item.currency
                  );

                  const isEditingThisName =
                    inlineEditing?.id === item.id && inlineEditing?.field === 'name';
                  const isEditingThisPrice =
                    inlineEditing?.id === item.id && inlineEditing?.field === 'price';

                  const existingInvoiceNumber = invoicedTransactionsMap.get(item.id);
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!!existingInvoiceNumber}
                          onChange={() => toggleSelectRow(item.id)}
                          title={
                            existingInvoiceNumber
                              ? `مفوترة مسبقاً برقم ${existingInvoiceNumber}`
                              : 'تحديد لإصدار فاتورة'
                          }
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-40"
                        />
                      </td>

                      {/* Passenger Name with Double Click Inline Edit */}
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
                              className="text-xs font-bold border border-emerald-500 rounded px-1.5 py-0.5"
                            />
                            <button
                              onClick={() => handleSaveInline(item)}
                              className="p-1 bg-emerald-600 text-white rounded text-[10px]"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div
                              onDoubleClick={() =>
                                setInlineEditing({ id: item.id, field: 'name', value: item.clientName })
                              }
                              title={ui("انقر نقراً مزدوجاً لتعديل اسم المسافر")}
                              className="font-bold text-slate-900 text-sm cursor-pointer hover:text-emerald-600"
                            >
                              {item.clientName}
                            </div>
                            {existingInvoiceNumber && (
                              <button
                                onClick={() => {
                                  const foundInv = invoices.find(
                                    (inv) => inv.invoiceNumber === existingInvoiceNumber
                                  );
                                  if (foundInv) {
                                    setActiveInvoiceId(foundInv.id);
                                    setInvoiceSubView('invoice_detail');
                                    setActiveTab('invoices');
                                  }
                                }}
                                title={ui("عرض الفاتورة المرتبطة")}
                                className="text-[10px] font-mono font-bold bg-[#eaf4ff] text-[#004AA5] border border-[#B7CFEA] px-1.5 py-0.5 rounded hover:bg-[#D7E7F7] cursor-pointer"
                              >
                                {existingInvoiceNumber}
                              </button>
                            )}
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

                      {/* PNR */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 tracking-wider">
                          {item.pnr}
                        </span>
                      </td>

                      {/* Airline & Route */}
                      <td className="py-3 px-4 max-w-[180px]">
                        <p className="font-medium text-slate-800 truncate" title={item.airlineAndRoute}>
                          {item.airlineAndRoute}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(item.bookingDate)}
                      </td>

                      {/* Payment Method */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium text-[11px]">
                          {ui(item.paymentMethod)}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-medium">
                        {formatMoney(item.cost, item.costCurrency || item.currency)}
                      </td>

                      {/* Selling Price with Double Click Inline Edit */}
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                        {isEditingThisPrice ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              autoFocus
                              value={inlineEditing!.value}
                              onChange={(e) =>
                                setInlineEditing({ ...inlineEditing!, value: e.target.value })
                              }
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveInline(item)}
                              className="w-16 text-xs font-bold border border-emerald-500 rounded px-1 py-0.5"
                            />
                            <button
                              onClick={() => handleSaveInline(item)}
                              className="p-1 bg-emerald-600 text-white rounded text-[10px]"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span
                            onDoubleClick={() =>
                              setInlineEditing({ id: item.id, field: 'price', value: item.sellingPrice })
                            }
                            title={ui("انقر نقراً مزدوجاً لتعديل سعر البيع")}
                            className="cursor-pointer hover:text-emerald-600"
                          >
                            {formatMoney(item.sellingPrice, item.currency)}
                          </span>
                        )}
                      </td>

                      {/* Net Profit */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          +{formatMoney(item.netProfit, item.currency)}
                        </span>
                      </td>

                      {/* Paid */}
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {formatMoney(item.paidAmount, item.settlementCurrency || item.currency)}
                      </td>

                      {/* Debt */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasDebt ? (
                          <span className="font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                            {formatMoney(item.remainingAmount, item.currency)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />{ui("مسدد")}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {hasDebt && (
                            <button
                              onClick={() => settleFlightPayment(item.id)}
                              title={ui("تسديد الدين الآن")}
                              className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (existingInvoiceNumber) {
                                const foundInv = invoices.find(
                                  (inv) => inv.invoiceNumber === existingInvoiceNumber
                                );
                                if (foundInv) {
                                  setActiveInvoiceId(foundInv.id);
                                  setInvoiceSubView('invoice_detail');
                                  setActiveTab('invoices');
                                }
                              } else {
                                const res = openInvoiceCreatorFromTransactions([
                                  { type: 'flight', id: item.id },
                                ]);
                                if (!res.success && res.message) setSelectionError(res.message);
                              }
                            }}
                            title={
                              existingInvoiceNumber
                                ? `عرض الفاتورة (${existingInvoiceNumber})`
                                : 'إصدار فاتورة لهذه التذكرة'
                            }
                            className="p-1.5 text-[#004AA5] bg-[#eaf4ff] hover:bg-[#D7E7F7] rounded-lg transition cursor-pointer"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              openCustomerStatement(getCustomerKey(item.clientName, item.phoneNumber))
                            }
                            title={ui("كشف حساب العميل")}
                            className="p-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
                          >
                            <ScrollText className="w-4 h-4" />
                          </button>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={ui("واتساب")}
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() =>
                              setReminderModalTarget({
                                type: 'flight',
                                id: item.id,
                                clientName: item.clientName,
                                currentReminder: item.reminder,
                              })
                            }
                            title={ui("تذكير 🔔")}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          >
                            <Bell className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => duplicateFlightBooking(item.id)}
                            title={ui("تكرار المعاملة (Duplicate)")}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditItem(item)}
                            title={ui("تعديل كامل ✏️")}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          >
                            <FileEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من حذف حجز "${item.clientName}"؟`)) {
                                deleteFlightBooking(item.id);
                              }
                            }}
                            title={ui("حذف")}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
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
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    <Plane className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">{ui("لا توجد حجوزات طيران مطابقة للشروط")}</p>
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

