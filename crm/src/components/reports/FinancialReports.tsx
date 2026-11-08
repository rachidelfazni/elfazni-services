import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  formatMoney,
  formatDate,
  ARABIC_MONTHS,
  exportToCSV,
  convertCurrency,
} from '../../utils/formatters';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Filter,
  DollarSign,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Calendar,
  Building2,
  Plane,
  ArrowRightLeft,
} from 'lucide-react';
import { SupportedCurrency, SUPPORTED_CURRENCIES } from '../../types';
import { FazniLogo, FazniOfficialSeal } from '../common/FazniLogo';

export const FinancialReports: React.FC = () => {
  const { ui } = useUITranslation();
  const {
    consulateAppointments,
    flightBookings,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    exchangeRates,
    unifiedBaseCurrency,
    setUnifiedBaseCurrency,
    isUnifiedViewEnabled,
    setIsUnifiedViewEnabled,
    setActiveTab,
    setInvoiceSubView,
    setPrintPreviewTarget,
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<'all' | 'consulate' | 'flights'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid_or_partial'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');

  const monthPrefix = useMemo(() => {
    if (selectedMonth === 0) return `${selectedYear}-`;
    return `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  }, [selectedMonth, selectedYear, ui]);

  const selectedMonthLabel = useMemo(() => {
    if (selectedMonth === 0) return `${ui("كل الشهور (")} ${selectedYear})`;
    const found = ARABIC_MONTHS.find((m) => m.value === selectedMonth);
    return `${found ? ui(found.label) : selectedMonth} ${selectedYear}`;
  }, [selectedMonth, selectedYear]);

  // Filter Consulate Appointments
  const filteredConsulate = useMemo(() => {
    if (categoryFilter === 'flights') return [];

    return consulateAppointments.filter((item) => {
      const matchMonth =
        selectedMonth === 0
          ? item.submissionDate.startsWith(`${selectedYear}`)
          : item.submissionDate.startsWith(monthPrefix);
      if (!matchMonth) return false;

      if (currencyFilter !== 'all' && item.currency !== currencyFilter) return false;
      if (paymentFilter === 'paid' && item.paymentStatus !== 'paid') return false;
      if (
        paymentFilter === 'unpaid_or_partial' &&
        item.paymentStatus !== 'unpaid' &&
        item.paymentStatus !== 'partial'
      )
        return false;

      return true;
    });
  }, [consulateAppointments, selectedMonth, selectedYear, monthPrefix, categoryFilter, paymentFilter, currencyFilter]);

  // Filter Flight Bookings
  const filteredFlights = useMemo(() => {
    if (categoryFilter === 'consulate') return [];

    return flightBookings.filter((item) => {
      const matchMonth =
        selectedMonth === 0
          ? item.bookingDate.startsWith(`${selectedYear}`)
          : item.bookingDate.startsWith(monthPrefix);
      if (!matchMonth) return false;

      if (currencyFilter !== 'all' && item.currency !== currencyFilter) return false;
      if (paymentFilter === 'paid' && item.paymentStatus !== 'paid') return false;
      if (
        paymentFilter === 'unpaid_or_partial' &&
        item.paymentStatus !== 'unpaid' &&
        item.paymentStatus !== 'partial'
      )
        return false;

      return true;
    });
  }, [flightBookings, selectedMonth, selectedYear, monthPrefix, categoryFilter, paymentFilter, currencyFilter]);

  // Currency breakdown sums
  const currencyBreakdown = useMemo(() => {
    const currencies: SupportedCurrency[] = ['MAD', 'TRY', 'EUR', 'USD'];
    const sales: Record<SupportedCurrency, number> = { MAD: 0, TRY: 0, EUR: 0, USD: 0 };
    const profits: Record<SupportedCurrency, number> = { MAD: 0, TRY: 0, EUR: 0, USD: 0 };
    const collected: Record<SupportedCurrency, number> = { MAD: 0, TRY: 0, EUR: 0, USD: 0 };
    const debts: Record<SupportedCurrency, number> = { MAD: 0, TRY: 0, EUR: 0, USD: 0 };

    filteredConsulate.forEach((c) => {
      sales[c.currency] = (sales[c.currency] || 0) + c.price;
      profits[c.currency] = (profits[c.currency] || 0) + c.price;
      const settCurr = c.settlementCurrency || c.currency;
      collected[settCurr] = (collected[settCurr] || 0) + c.paidAmount;
      debts[c.currency] = (debts[c.currency] || 0) + c.remainingAmount;
    });

    filteredFlights.forEach((f) => {
      sales[f.currency] = (sales[f.currency] || 0) + f.sellingPrice;
      profits[f.currency] = (profits[f.currency] || 0) + f.netProfit;
      const settCurr = f.settlementCurrency || f.currency;
      collected[settCurr] = (collected[settCurr] || 0) + f.paidAmount;
      debts[f.currency] = (debts[f.currency] || 0) + f.remainingAmount;
    });

    let unifiedSales = 0;
    let unifiedProfit = 0;
    let unifiedCollected = 0;
    let unifiedDebts = 0;

    currencies.forEach((curr) => {
      unifiedSales += convertCurrency(sales[curr], curr, unifiedBaseCurrency, exchangeRates);
      unifiedProfit += convertCurrency(profits[curr], curr, unifiedBaseCurrency, exchangeRates);
      unifiedCollected += convertCurrency(collected[curr], curr, unifiedBaseCurrency, exchangeRates);
      unifiedDebts += convertCurrency(debts[curr], curr, unifiedBaseCurrency, exchangeRates);
    });

    return {
      sales,
      profits,
      collected,
      debts,
      unifiedSales,
      unifiedProfit,
      unifiedCollected,
      unifiedDebts,
    };
  }, [filteredConsulate, filteredFlights, unifiedBaseCurrency, exchangeRates]);

  const handleExportCSV = () => {
    const headers = [
      'القسم',
      'اسم الزبون',
      'رقم الهاتف',
      'الخدمة / المسار / PNR',
      'التاريخ',
      'العملة',
      'المبلغ / سعر البيع',
      'التكلفة',
      'صافي الربح',
      'المحصل',
      'المتبقي (الدين)',
      'حالة السداد',
    ];

    const rows: (string | number)[][] = [];

    filteredConsulate.forEach((c) => {
      rows.push([
        'مواعيد القنصلية',
        c.clientName,
        c.phoneNumber,
        c.appointmentType,
        c.submissionDate,
        c.currency,
        c.price,
        0,
        c.price,
        c.paidAmount,
        c.remainingAmount,
        c.paymentStatus === 'paid' ? 'مدفوع' : c.paymentStatus === 'partial' ? 'دفع جزئي' : 'لم يدفع',
      ]);
    });

    filteredFlights.forEach((f) => {
      rows.push([
        'حجوزات الطيران',
        f.clientName,
        f.phoneNumber,
        `PNR: ${f.pnr} - ${f.airlineAndRoute}`,
        f.bookingDate,
        f.currency,
        f.sellingPrice,
        f.cost,
        f.netProfit,
        f.paidAmount,
        f.remainingAmount,
        f.paymentStatus === 'paid' ? 'مدفوع' : f.paymentStatus === 'partial' ? 'دفع جزئي' : 'لم يدفع',
      ]);
    });

    exportToCSV(`التقرير_المالي_ELFAZNI_${selectedYear}_${selectedMonth || 'الكل'}`, headers, rows);
  };

  const totalTransactionsCount = filteredConsulate.length + filteredFlights.length;
  const estimatedReportPages = Math.max(1, Math.ceil(totalTransactionsCount / 16));

  return (
    <div className="space-y-6">
      {/* Screen Controls Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#eaf4ff] text-[#004AA5] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{ui("التقارير المالية واستخراج المبيعات (ELFAZNI SERVICES — الفزني سيرفيسز)")}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{ui("تصفية شاملة للمبيعات والأرباح والديون بالعملات الأربع (TRY, MAD, EUR, USD)")}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() =>
              setPrintPreviewTarget({
                type: 'all_accounts_report',
                currency:
                  currencyFilter !== 'all' ? (currencyFilter as SupportedCurrency) : undefined,
              })
            }
            className="flex items-center gap-1.5 bg-[#0B2E57] hover:bg-[#004AA5] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#CC9048]" />
            <span>{ui("التقرير المالي الشامل (PDF)")}</span>
          </button>

          <button
            onClick={() =>
              setPrintPreviewTarget({
                type: 'outstanding_balances_report',
              })
            }
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>{ui("تقرير الأرصدة المتبقية (PDF)")}</span>
          </button>

          <button
            onClick={() =>
              setPrintPreviewTarget({
                type: 'periodic_payment_report',
              })
            }
            className="flex items-center gap-1.5 bg-[#004AA5] hover:bg-[#0B2E57] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{ui("تقرير المدفوعات الدوري (PDF)")}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{ui("تصدير CSV/XLSX")}</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3 no-print">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pb-2 border-b border-slate-100">
          <Filter className="w-4 h-4 text-[#004AA5]" />
          <span>{ui("خيارات التصفية والفترة:")}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Month */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{ui("الشهر")}</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value={0}>{ui("كل الشهور (")}{selectedYear})</option>
              {ARABIC_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {ui(m.label)}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{ui("السنة")}</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {/* Currency Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{ui("العملة")}</label>
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="all">{ui("كل العملات")}</option>
              {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{ui("القسم")}</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="all">{ui("الكل (القنصلية والطيران)")}</option>
              <option value="consulate">{ui("مواعيد القنصلية فقط")}</option>
              <option value="flights">{ui("حجوزات الطيران فقط")}</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{ui("حالة الدفع")}</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
            >
              <option value="all">{ui("كل حالات الدفع")}</option>
              <option value="paid">{ui("مدفوع بالكامل")}</option>
              <option value="unpaid_or_partial">{ui("غير مدفوع / دفع جزئي")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Printable A4 Master Table (Repeats Corporate Header & Page X of Y Footer on Direct Print) */}
      <table className="print-master-table w-full">
        <thead className="print-repeating-header print-only">
          <tr>
            <td className="pb-4">
              <div className="h-3 w-full bg-gradient-to-r from-[#0B2E57] via-[#004AA5] to-[#CC9048] mb-4" />
              <div className="flex items-center justify-between border-b-2 border-[#0B2E57] pb-4">
                <div>
                  <div className="text-xl font-black text-[#0B2E57]" dir="ltr">
                    ELFAZNI SERVICES
                  </div>
                  <div className="text-lg font-black text-[#004AA5]">{ui("الفزني سيرفيسز — التقرير المالي")}</div>
                  <div className="text-xs font-bold text-[#5E7086]">{ui("الفزني للخدمات – إسطنبول")}</div>
                </div>
                <FazniLogo size="lg" variant="dark" />
                <div className="text-left font-mono text-xs text-[#5E7086]">
                  <p className="font-bold text-[#0B2E57]">{ui("الفترة:")}{selectedMonthLabel}</p>
                  <p>{ui("تاريخ الاستخراج:")}{new Date().toLocaleDateString('ar-SA')}</p>
                  <p dir="ltr">REF: FAZNI-CRM-FIN-{selectedYear}{selectedMonth}</p>
                </div>
              </div>
            </td>
          </tr>
        </thead>

        <tbody className="print-master-body">
          <tr>
            <td className="space-y-6">
              {/* Multi-Currency Financial Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print-break-inside-avoid">
                {/* Sales */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs print-break-inside-avoid">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
                    <span>{ui("إجمالي المبيعات (")}{selectedMonthLabel})</span>
                    <DollarSign className="w-4 h-4 text-[#004AA5]" />
                  </div>
                  {isUnifiedViewEnabled ? (
                    <div className="text-xl font-black text-slate-900">
                      {formatMoney(currencyBreakdown.unifiedSales, unifiedBaseCurrency)}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Object.entries(currencyBreakdown.sales)
                        .filter(([_, val]) => val > 0)
                        .map(([curr, val]) => (
                          <span key={curr} className="bg-slate-100 text-xs font-bold px-2 py-0.5 rounded">
                            {formatMoney(val, curr as SupportedCurrency)}
                          </span>
                        ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 mt-2">
                    {totalTransactionsCount} {ui("معاملة في هذه الفترة")}</p>
                </div>

                {/* Profit */}
                <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs print-break-inside-avoid">
                  <div className="flex items-center justify-between text-xs text-emerald-700 font-bold mb-1">
                    <span>{ui("صافي الأرباح")}</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  {isUnifiedViewEnabled ? (
                    <div className="text-xl font-black text-emerald-600">
                      {formatMoney(currencyBreakdown.unifiedProfit, unifiedBaseCurrency)}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Object.entries(currencyBreakdown.profits)
                        .filter(([_, val]) => val > 0)
                        .map(([curr, val]) => (
                          <span key={curr} className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded">
                            {formatMoney(val, curr as SupportedCurrency)}
                          </span>
                        ))}
                    </div>
                  )}
                  <p className="text-[11px] text-emerald-700 font-medium mt-2">{ui("أرباح القنصلية + هامش الطيران")}</p>
                </div>

                {/* Collected */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs print-break-inside-avoid">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
                    <span>{ui("المحصل فعلياً")}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  {isUnifiedViewEnabled ? (
                    <div className="text-xl font-black text-slate-900">
                      {formatMoney(currencyBreakdown.unifiedCollected, unifiedBaseCurrency)}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Object.entries(currencyBreakdown.collected)
                        .filter(([_, val]) => val > 0)
                        .map(([curr, val]) => (
                          <span key={curr} className="bg-slate-100 text-xs font-bold px-2 py-0.5 rounded">
                            {formatMoney(val, curr as SupportedCurrency)}
                          </span>
                        ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 mt-2">{ui("المقبوضات المستلمة")}</p>
                </div>

                {/* Debts */}
                <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-xs print-break-inside-avoid">
                  <div className="flex items-center justify-between text-xs text-rose-700 font-bold mb-1">
                    <span>{ui("الديون المعلقة للفترة")}</span>
                    <Receipt className="w-4 h-4 text-rose-600" />
                  </div>
                  {isUnifiedViewEnabled ? (
                    <div className="text-xl font-black text-rose-600">
                      {formatMoney(currencyBreakdown.unifiedDebts, unifiedBaseCurrency)}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Object.entries(currencyBreakdown.debts)
                        .filter(([_, val]) => val > 0)
                        .map(([curr, val]) => (
                          <span key={curr} className="bg-rose-50 text-rose-700 text-xs font-bold px-2 py-0.5 rounded">
                            {formatMoney(val, curr as SupportedCurrency)}
                          </span>
                        ))}
                    </div>
                  )}
                  <p className="text-[11px] text-rose-700 font-semibold mt-2">{ui("مستحقات قيد التحصيل")}</p>
                </div>
              </div>

              {/* Official Sign-off on Print */}
              <div className="print-only pt-8 mt-8 border-t border-slate-300 print-break-inside-avoid">
                <div className="grid grid-cols-3 gap-6 text-center text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{ui("إعداد المحاسب المسؤول")}</p>
                    <div className="h-16"></div>
                    <p className="text-slate-500 border-t border-slate-200 pt-1">{ui("التوقيع والاعتماد")}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{ui("إدارة مكتب ELFAZNI SERVICES")}</p>
                    <div className="h-16"></div>
                    <p className="text-slate-500 border-t border-slate-200 pt-1">{ui("التوقيع والتاريخ")}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{ui("ختم وتوقيع الإدارة المعتمد")}</p>
                    <div className="h-20 flex items-center justify-center my-1">
                      <FazniOfficialSeal size={100} />
                    </div>
                    <p className="text-slate-500 border-t border-slate-200 pt-1">{ui("المصادقة الرسمية")}</p>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>

        <tfoot className="print-repeating-footer print-only">
          <tr>
            <td className="pt-4">
              <footer className="print-document-footer invoice-summary print-break-inside-avoid w-full">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#CC9048] via-[#004AA5] to-[#0B2E57]" />
                <div className="bg-[#0B2E57] text-white px-5 py-3 flex items-center justify-between text-xs">
                  <span className="font-black" dir="ltr">{ui("ELFAZNI SERVICES — الفزني سيرفيسز")}</span>
                  <span>{ui("خدمة مساعدة مستقلة ولا تمثل أي جهة حكومية.")}</span>
                  <span className="font-mono font-black text-[#CC9048]" dir="ltr">
                    Page 1 of {estimatedReportPages} {ui("• صفحة 1 من")}{estimatedReportPages}
                  </span>
                </div>
              </footer>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
