import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ConsulateAppointment,
  ConsulateResponse,
  TimelineStage,
  SUPPORTED_CURRENCIES,
} from '../../types';
import { formatMoney, formatDate, generateWhatsAppLink } from '../../utils/formatters';
import { getCustomerKey } from '../../utils/invoiceCalculations';
import {
  CalendarCheck,
  Search,
  PlusCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Phone,
  MessageCircle,
  DollarSign,
  FileEdit,
  Trash2,
  Copy,
  Bell,
  Check,
  FileText,
  ScrollText,
  AlertCircle,
} from 'lucide-react';

interface ConsulateModuleProps {
  onOpenNewModal: () => void;
  onEditItem: (item: ConsulateAppointment) => void;
}

export const ConsulateModule: React.FC<ConsulateModuleProps> = ({ onOpenNewModal, onEditItem }) => {
  const { ui } = useUITranslation();
  const {
    consulateAppointments,
    deleteConsulateAppointment,
    duplicateConsulateAppointment,
    settleConsulatePayment,
    inlineUpdateConsulate,
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
  const [filterResponse, setFilterResponse] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  // Inline edit state
  const [inlineEditing, setInlineEditing] = useState<{ id: string; field: 'name' | 'price'; value: any } | null>(null);

  const filteredItems = useMemo(() => {
    return consulateAppointments.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          item.clientName.toLowerCase().includes(q) ||
          item.phoneNumber.includes(q) ||
          item.appointmentType.toLowerCase().includes(q) ||
          (item.customAppointmentType && item.customAppointmentType.toLowerCase().includes(q)) ||
          (item.notes && item.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (filterResponse !== 'all' && item.consulateResponse !== filterResponse) return false;
      if (filterPayment !== 'all' && item.paymentStatus !== filterPayment) return false;
      if (filterStage !== 'all' && item.timelineStage !== filterStage) return false;
      if (filterCurrency !== 'all' && item.currency !== filterCurrency) return false;

      return true;
    });
  }, [consulateAppointments, search, filterResponse, filterPayment, filterStage, filterCurrency]);

  const toggleSelectRow = (id: string) => {
    setSelectionError(null);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreateInvoiceFromSelected = () => {
    setSelectionError(null);
    const res = openInvoiceCreatorFromTransactions(
      selectedIds.map((id) => ({ type: 'consulate' as const, id }))
    );
    if (!res.success && res.message) {
      setSelectionError(res.message);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSaveInline = (item: ConsulateAppointment) => {
    if (!inlineEditing) return;
    if (inlineEditing.field === 'name' && inlineEditing.value.trim()) {
      inlineUpdateConsulate(item.id, 'clientName', inlineEditing.value.trim());
    } else if (inlineEditing.field === 'price') {
      inlineUpdateConsulate(item.id, 'price', Number(inlineEditing.value) || 0);
    }
    setInlineEditing(null);
  };

  const getResponseBadge = (res: ConsulateResponse) => {
    switch (res) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />{ui("مقبول")}</span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3.5 h-3.5" />{ui("مرفوض")}</span>
        );
      case 'missing_docs':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" />{ui("نقص أوراق")}</span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            <Clock className="w-3.5 h-3.5" />{ui("قيد الانتظار")}</span>
        );
    }
  };

  const getStageBadge = (stage: TimelineStage) => {
    switch (stage) {
      case 'registered':
        return <span className="text-xs bg-[#eaf4ff] text-[#004AA5] px-2 py-0.5 rounded font-medium">{ui("1. تم التسجيل")}</span>;
      case 'submitted':
        return <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">{ui("2. قيد المعالجة")}</span>;
      case 'response':
        return <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium">{ui("3. رد القنصلية")}</span>;
      case 'completed':
        return <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">{ui("4. انتهاء الخدمة")}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">{ui("سجل مواعيد وخدمات القنصلية")}</h2>
            <span className="text-xs font-bold bg-[#D7E7F7] text-[#0B2E57] px-2.5 py-0.5 rounded-full">
              {filteredItems.length} {ui("معاملة")}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{ui("إدارة طلبات التأشيرات والمواعيد القنصلية مع دعم إصدار الفواتير وكشوف الحساب المباشرة")}</p>
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
            title={ui("حدد معاملة أو أكثر لنفس العميل غير مفوترة مسبقاً لإصدار فاتورة")}
          >
            <FileText className="w-4 h-4" />
            <span>{ui("إعداد فاتورة من المحدد (")}{selectedIds.length})</span>
          </button>

          <button
            onClick={onOpenNewModal}
            className="inline-flex items-center gap-2 bg-[#004AA5] hover:bg-[#2A83D5] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{ui("إضافة موعد قنصلية جديد")}</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={ui("بحث بالاسم، الجوال، التأشيرة...")}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs focus:bg-white focus:ring-2 focus:ring-[#2A83D5] focus:outline-none"
          />
        </div>

        {/* Currency Filter */}
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

        {/* Filter Response */}
        <div>
          <select
            value={filterResponse}
            onChange={(e) => setFilterResponse(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">{ui("كل ردود القنصلية")}</option>
            <option value="pending">{ui("قيد الانتظار")}</option>
            <option value="accepted">{ui("مقبول")}</option>
            <option value="rejected">{ui("مرفوض")}</option>
            <option value="missing_docs">{ui("نقص أوراق")}</option>
          </select>
        </div>

        {/* Filter Payment */}
        <div>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">{ui("كل حالات الدفع")}</option>
            <option value="paid">{ui("مدفوع بالكامل")}</option>
            <option value="partial">{ui("دفع جزئي")}</option>
            <option value="unpaid">{ui("لم يدفع بعد")}</option>
          </select>
        </div>

        {/* Filter Stage */}
        <div>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">{ui("كل مراحل الخط الزمني")}</option>
            <option value="registered">{ui("تم التسجيل")}</option>
            <option value="submitted">{ui("قيد المعالجة")}</option>
            <option value="response">{ui("رد القنصلية")}</option>
            <option value="completed">{ui("انتهاء الخدمة")}</option>
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
                <th className="py-3 px-4">{ui("اسم الزبون والهاتف")}</th>
                <th className="py-3 px-4">{ui("نوع الموعد")}</th>
                <th className="py-3 px-4">{ui("تاريخ التقديم")}</th>
                <th className="py-3 px-4">{ui("مرحلة الخدمة")}</th>
                <th className="py-3 px-4">{ui("رد القنصلية")}</th>
                <th className="py-3 px-4">{ui("السعر")}</th>
                <th className="py-3 px-4">{ui("المدفوع")}</th>
                <th className="py-3 px-4">{ui("المتبقي (الدين)")}</th>
                <th className="py-3 px-4 text-center">{ui("الإجراءات السريعة")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const hasDebt = item.remainingAmount > 0;
                  const isCompletedUnpaid = item.timelineStage === 'completed' && hasDebt;
                  const typeLabel =
                    item.appointmentType === 'أخرى' && item.customAppointmentType
                      ? item.customAppointmentType
                      : item.appointmentType;

                  const waLink = generateWhatsAppLink(
                    item.phoneNumber,
                    item.clientName,
                    item.remainingAmount,
                    typeLabel,
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
                        isCompletedUnpaid ? 'bg-red-50/40' : ''
                      } ${isSelected ? 'bg-[#eaf4ff]/50' : ''}`}
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
                          className="rounded border-slate-300 text-[#004AA5] focus:ring-[#2A83D5] cursor-pointer disabled:opacity-40"
                        />
                      </td>

                      {/* Client Name with Double-Click Inline Edit */}
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div
                              onDoubleClick={() =>
                                setInlineEditing({ id: item.id, field: 'name', value: item.clientName })
                              }
                              title={ui("انقر نقراً مزدوجاً للتعديل السريع للاسم")}
                              className="font-bold text-slate-900 text-sm cursor-pointer hover:text-[#004AA5]"
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

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 bg-slate-100 px-2 py-1 rounded-md text-[11px]">
                          {ui(typeLabel)}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {formatDate(item.submissionDate)}
                      </td>

                      {/* Stage */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStageBadge(item.timelineStage)}
                      </td>

                      {/* Response */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div>
                          {getResponseBadge(item.consulateResponse)}
                          {item.consulateResponse === 'missing_docs' && item.missingDocsNotes && (
                            <p
                              className="text-[10px] text-amber-700 mt-1 max-w-[180px] truncate"
                              title={item.missingDocsNotes}
                            >
                              {item.missingDocsNotes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Price with Double Click Inline Edit */}
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
                              className="w-16 text-xs font-bold border border-[#2A83D5] rounded px-1 py-0.5"
                            />
                            <button
                              onClick={() => handleSaveInline(item)}
                              className="p-1 bg-[#004AA5] text-white rounded text-[10px]"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span
                            onDoubleClick={() =>
                              setInlineEditing({ id: item.id, field: 'price', value: item.price })
                            }
                            title={ui("انقر نقراً مزدوجاً لتعديل السعر")}
                            className="cursor-pointer hover:text-[#004AA5]"
                          >
                            {formatMoney(item.price, item.currency)}
                          </span>
                        )}
                      </td>

                      {/* Paid */}
                      <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
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
                              onClick={() => settleConsulatePayment(item.id)}
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
                                  { type: 'consulate', id: item.id },
                                ]);
                                if (!res.success && res.message) setSelectionError(res.message);
                              }
                            }}
                            title={
                              existingInvoiceNumber
                                ? `عرض الفاتورة (${existingInvoiceNumber})`
                                : 'إصدار فاتورة لهذه المعاملة'
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
                                type: 'consulate',
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
                            onClick={() => duplicateConsulateAppointment(item.id)}
                            title={ui("تكرار المعاملة (Duplicate)")}
                            className="p-1.5 text-slate-500 hover:text-[#004AA5] hover:bg-[#eaf4ff] rounded-lg transition cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditItem(item)}
                            title={ui("تعديل كامل ✏️")}
                            className="p-1.5 text-slate-600 hover:text-[#004AA5] hover:bg-[#eaf4ff] rounded-lg transition cursor-pointer"
                          >
                            <FileEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من حذف معاملة "${item.clientName}"؟`)) {
                                deleteConsulateAppointment(item.id);
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
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <CalendarCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">{ui("لا توجد مواعيد تطابق شروط البحث الحالية")}</p>
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

