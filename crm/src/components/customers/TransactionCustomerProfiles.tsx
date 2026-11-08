import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  CustomerProfileSummary,
  SUPPORTED_CURRENCIES,
  SupportedCurrency,
} from '../../types';
import {
  formatMinorMoney,
  fromMinorUnits,
} from '../../utils/invoiceCalculations';
import { formatMoney, generateWhatsAppLink } from '../../utils/formatters';
import {
  Users,
  Search,
  Filter,
  FileText,
  Printer,
  Plus,
  Phone,
  CalendarCheck,
  Plane,
  Receipt,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  Eye,
  X,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Sparkles,
} from 'lucide-react';

type ProfileTab =
  | 'overview'
  | 'transactions'
  | 'appointments'
  | 'payments'
  | 'invoices'
  | 'actions';

export const TransactionCustomerProfiles: React.FC = () => {
  const { ui } = useUITranslation();
  const {
    customerProfiles,
    invoicedTransactionsMap,
    setActiveTab,
    setInvoiceSubView,
    setActiveInvoiceId,
    setPrintPreviewTarget,
    openCustomerStatement,
    openInvoiceCreatorFromTransactions,
    setIsConsulateModalOpen,
    setEditingConsulate,
    setIsFlightModalOpen,
    setEditingFlight,
    setSpotlightItem,
  } = useApp();

  const { canViewAccounting } = useAuth();
  const { t, isRTL } = useLanguage();

  // Search (with debounce), filters, sorting & pagination
  const [rawSearch, setRawSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'has_balance' | 'settled'>('all');
  const [serviceFilter, setServiceFilter] = useState<'all' | 'consulate' | 'flights'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'transactions' | 'outstanding'>('outstanding');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected Customer for Profile Modal/Drawer
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>('overview');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(rawSearch.trim().toLowerCase());
      setCurrentPage(1);
    }, 180);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  const filteredAndSortedCustomers = useMemo(() => {
    const list = customerProfiles.filter((cust) => {
      if (debouncedSearch) {
        const matchName = cust.clientName.toLowerCase().includes(debouncedSearch);
        const matchPhone = cust.phoneNumber.toLowerCase().includes(debouncedSearch);
        const matchId = cust.customerId.toLowerCase().includes(debouncedSearch);
        const matchPnr = cust.flightRecords.some((f) =>
          f.pnr.toLowerCase().includes(debouncedSearch)
        );
        if (!matchName && !matchPhone && !matchId && !matchPnr) return false;
      }

      if (currencyFilter !== 'all') {
        if (!cust.currencies.includes(currencyFilter as SupportedCurrency)) return false;
      }

      if (serviceFilter === 'consulate' && cust.consulateRecords.length === 0) return false;
      if (serviceFilter === 'flights' && cust.flightRecords.length === 0) return false;

      const totalOutstandingAcrossCurrencies = Object.values(cust.totalsByCurrency).reduce(
        (acc, item) => acc + item.outstandingMinor,
        0
      );

      if (balanceFilter === 'has_balance' && totalOutstandingAcrossCurrencies <= 0) return false;
      if (balanceFilter === 'settled' && totalOutstandingAcrossCurrencies > 0) return false;

      return true;
    });

    return list.sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;
      if (sortBy === 'name') {
        return a.clientName.localeCompare(b.clientName) * dir;
      }
      if (sortBy === 'transactions') {
        const countA = a.consulateRecords.length + a.flightRecords.length;
        const countB = b.consulateRecords.length + b.flightRecords.length;
        return (countA - countB) * dir;
      }
      const outA = Object.values(a.totalsByCurrency).reduce((s, x) => s + x.outstandingMinor, 0);
      const outB = Object.values(b.totalsByCurrency).reduce((s, x) => s + x.outstandingMinor, 0);
      return (outA - outB) * dir;
    });
  }, [customerProfiles, debouncedSearch, currencyFilter, balanceFilter, serviceFilter, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedCustomers.length / pageSize));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedCustomers.slice(start, start + pageSize);
  }, [filteredAndSortedCustomers, currentPage]);

  const selectedCustomer = useMemo(() => {
    if (!selectedProfileId) return null;
    return customerProfiles.find((c) => c.customerId === selectedProfileId) || null;
  }, [selectedProfileId, customerProfiles]);

  const handleOpenProfile = (cust: CustomerProfileSummary, tab: ProfileTab = 'overview') => {
    setSelectedProfileId(cust.customerId);
    setActiveProfileTab(tab);
  };

  const handleCreateInvoiceForCustomer = (cust: CustomerProfileSummary) => {
    // Find uninvoiced transactions in primary currency
    const primaryCurr = cust.currencies[0] || 'TRY';
    const eligible: { type: 'consulate' | 'flight'; id: string }[] = [];

    cust.consulateRecords.forEach((c) => {
      if (c.currency === primaryCurr && !invoicedTransactionsMap.has(c.id)) {
        eligible.push({ type: 'consulate', id: c.id });
      }
    });
    cust.flightRecords.forEach((f) => {
      if (f.currency === primaryCurr && !invoicedTransactionsMap.has(f.id)) {
        eligible.push({ type: 'flight', id: f.id });
      }
    });

    if (eligible.length > 0) {
      openInvoiceCreatorFromTransactions(eligible);
    } else {
      setActiveInvoiceId(null);
      setInvoiceSubView('invoice_editor');
      setActiveTab('invoices');
    }
    setSelectedProfileId(null);
  };

  const totalClientsWithDebt = useMemo(() => {
    return customerProfiles.filter((c) =>
      Object.values(c.totalsByCurrency).some((v) => v.outstandingMinor > 0)
    ).length;
  }, [customerProfiles]);

  return (
    <div className="space-y-6">
      {/* Top CRM Header & Summary Metrics */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D7E7F7] shadow-2xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0B2E57] text-[#CC9048] flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#0B2E57]">
                {t('customers.title')}
              </h2>
              <p className="text-xs text-[#5E7086] mt-0.5">
                {t('customers.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingConsulate(null);
                setIsConsulateModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#004AA5] hover:bg-[#0B2E57] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t('topbar.newConsulate')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingFlight(null);
                setIsFlightModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#eaf4ff] text-[#0B2E57] border border-[#D7E7F7] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plane className="w-4 h-4 text-[#004AA5]" />
              <span>{t('topbar.newFlight')}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Strip Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#eaf4ff]/60 border border-[#004AA5]/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#5E7086] block">
                {t('dash.kpi.totalCustomers')}
              </span>
              <span className="text-2xl font-black text-[#0B2E57] font-mono tabular-nums mt-1 block">
                {customerProfiles.length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#004AA5] text-white flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-800 block">
                {t('customers.settled')}
              </span>
              <span className="text-2xl font-black text-emerald-700 font-mono tabular-nums mt-1 block">
                {customerProfiles.length - totalClientsWithDebt}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/70 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-rose-800 block">
                {t('customers.hasBalance')}
              </span>
              <span className="text-2xl font-black text-rose-700 font-mono tabular-nums mt-1 block">
                {totalClientsWithDebt}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-900 block">
                {t('customers.colInvoices')}
              </span>
              <span className="text-2xl font-black text-[#0B2E57] font-mono tabular-nums mt-1 block">
                {customerProfiles.reduce((acc, c) => acc + c.invoices.length, 0)}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#CC9048] text-slate-950 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Fast Search & Multi-Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          <div className="sm:col-span-2 relative">
            <Search
              className={`w-4 h-4 text-[#5E7086] absolute top-1/2 -translate-y-1/2 ${
                isRTL ? 'right-3.5' : 'left-3.5'
              }`}
            />
            <input
              type="text"
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              placeholder={t('customers.search')}
              className={`w-full ${
                isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'
              } py-2.5 rounded-xl bg-[#F8FAFC] border border-[#D7E7F7] text-xs font-semibold text-[#0B2E57] focus:bg-white focus:border-[#004AA5] focus:outline-none`}
            />
            {rawSearch && (
              <button
                type="button"
                onClick={() => setRawSearch('')}
                className={`absolute top-1/2 -translate-y-1/2 ${
                  isRTL ? 'left-3' : 'right-3'
                } text-slate-400 hover:text-slate-600 cursor-pointer`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={currencyFilter}
            onChange={(e) => {
              setCurrencyFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2.5 text-xs font-bold text-[#0B2E57] focus:outline-none"
          >
            <option value="all">{t('customers.filterCurrency')}</option>
            {Object.values(SUPPORTED_CURRENCIES).map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>

          <select
            value={balanceFilter}
            onChange={(e) => {
              setBalanceFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2.5 text-xs font-bold text-[#0B2E57] focus:outline-none"
          >
            <option value="all">{t('customers.filterBalance')}</option>
            <option value="has_balance">{t('customers.hasBalance')}</option>
            <option value="settled">{t('customers.settled')}</option>
          </select>

          <button
            type="button"
            onClick={() => {
              if (sortBy === 'outstanding') {
                setSortBy('transactions');
              } else if (sortBy === 'transactions') {
                setSortBy('name');
              } else {
                setSortBy('outstanding');
              }
              setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
            }}
            className="bg-[#F8FAFC] hover:bg-[#eaf4ff] border border-[#D7E7F7] rounded-xl px-3 py-2.5 text-xs font-bold text-[#0B2E57] flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#004AA5]" />
            <span>
              {sortBy === 'outstanding'
                ? t('customers.colOutstanding')
                : sortBy === 'transactions'
                ? t('customers.colServices')
                : t('customers.colClient')}
            </span>
          </button>
        </div>
      </div>

      {/* Customers Directory Data Table */}
      <div className="bg-white rounded-3xl border border-[#D7E7F7] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#0B2E57] text-white font-bold">
                <th className="py-3.5 px-4 text-start">{t('customers.colClient')}</th>
                <th className="py-3.5 px-4 text-start">{t('customers.colPhone')}</th>
                <th className="py-3.5 px-4 text-start">{t('customers.colServices')}</th>
                <th className="py-3.5 px-4 text-center">{t('customers.colInvoices')}</th>
                {canViewAccounting && (
                  <>
                    <th className="py-3.5 px-4 text-end">{t('customers.colBilled')}</th>
                    <th className="py-3.5 px-4 text-end">{t('customers.colPaid')}</th>
                    <th className="py-3.5 px-4 text-end">{t('customers.colOutstanding')}</th>
                  </>
                )}
                <th className="py-3.5 px-4 text-center">{t('customers.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D7E7F7]">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#5E7086]">
                    {t('topbar.noResults')} «{rawSearch || '...'}»
                  </td>
                </tr>
              ) : (
                paginatedCustomers.map((cust) => {
                  const activeCurrencies = cust.currencies.length > 0 ? cust.currencies : (['TRY'] as SupportedCurrency[]);
                  return (
                    <tr
                      key={cust.customerId}
                      className="hover:bg-[#eaf4ff]/40 transition group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#eaf4ff] text-[#004AA5] font-black flex items-center justify-center shrink-0">
                            {cust.clientName.slice(0, 2)}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => handleOpenProfile(cust, 'overview')}
                              className="font-black text-[#0B2E57] hover:text-[#004AA5] transition text-start cursor-pointer block"
                            >
                              {cust.clientName}
                            </button>
                            <span className="text-[10px] font-mono text-[#5E7086]" dir="ltr">
                              ID: {cust.customerId}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-[#0B2E57]" dir="ltr">
                        {cust.phoneNumber || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {cust.consulateRecords.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#eaf4ff] text-[#004AA5]">
                              <CalendarCheck className="w-3 h-3" />
                              <span>{cust.consulateRecords.length}</span>
                            </span>
                          )}
                          {cust.flightRecords.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700">
                              <Plane className="w-3 h-3" />
                              <span>{cust.flightRecords.length}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-[#0B2E57]">
                        {cust.invoices.filter((i) => i.status !== 'void').length}
                      </td>

                      {canViewAccounting && (
                        <>
                          <td className="py-3.5 px-4 text-end">
                            <div className="space-y-0.5">
                              {activeCurrencies.map((curr) => (
                                <div
                                  key={curr}
                                  className="font-mono font-bold text-[#0B2E57] tabular-nums"
                                  dir="ltr"
                                >
                                  {formatMinorMoney(cust.totalsByCurrency[curr].billedMinor, curr)}
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-end">
                            <div className="space-y-0.5">
                              {activeCurrencies.map((curr) => (
                                <div
                                  key={curr}
                                  className="font-mono font-bold text-emerald-700 tabular-nums"
                                  dir="ltr"
                                >
                                  {formatMinorMoney(cust.totalsByCurrency[curr].paidMinor, curr)}
                                </div>
                              ))}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-end">
                            <div className="space-y-0.5">
                              {activeCurrencies.map((curr) => {
                                const out = cust.totalsByCurrency[curr].outstandingMinor;
                                return (
                                  <div
                                    key={curr}
                                    className={`font-mono font-black tabular-nums ${
                                      out > 0 ? 'text-rose-600' : 'text-slate-400'
                                    }`}
                                    dir="ltr"
                                  >
                                    {formatMinorMoney(out, curr)}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </>
                      )}

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenProfile(cust, 'overview')}
                            className="px-2.5 py-1.5 rounded-xl bg-[#eaf4ff] hover:bg-[#004AA5] text-[#004AA5] hover:text-white font-bold transition flex items-center gap-1 cursor-pointer"
                            title={t('customers.viewProfile')}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('customers.viewProfile')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCreateInvoiceForCustomer(cust)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#0B2E57] text-[#0B2E57] hover:text-white border border-[#D7E7F7] font-bold transition flex items-center gap-1 cursor-pointer"
                            title={t('customers.newInvoice')}
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">{t('customers.newInvoice')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setPrintPreviewTarget({
                                type: 'statement',
                                customerId: cust.customerId,
                                currency: cust.currencies[0] || 'TRY',
                              })
                            }
                            className="p-1.5 rounded-xl bg-amber-50 hover:bg-[#CC9048] text-amber-900 hover:text-slate-950 border border-amber-200 transition cursor-pointer"
                            title={t('customers.printStatement')}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 bg-[#F8FAFC] border-t border-[#D7E7F7] flex items-center justify-between text-xs">
            <span className="text-[#5E7086] font-semibold">
              {filteredAndSortedCustomers.length} {t('dash.kpi.clientsCount')} • Page {currentPage} / {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white border border-[#D7E7F7] disabled:opacity-40 hover:bg-[#eaf4ff] cursor-pointer"
              >
                {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-white border border-[#D7E7F7] disabled:opacity-40 hover:bg-[#eaf4ff] cursor-pointer"
              >
                {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Profile Full Modal / Drawer with 6 Organized Tabs */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-3xl border border-[#D7E7F7] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Profile Modal Header */}
            <div className="bg-gradient-to-l from-[#0B2E57] via-[#133A68] to-[#004AA5] text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center text-lg font-black text-[#CC9048]">
                  {selectedCustomer.clientName.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-white">
                      {selectedCustomer.clientName}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-mono bg-white/15 text-[#2A83D5]" dir="ltr">
                      {selectedCustomer.customerId}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#D7E7F7] mt-1">
                    {selectedCustomer.phoneNumber && (
                      <span className="inline-flex items-center gap-1 font-mono" dir="ltr">
                        <Phone className="w-3.5 h-3.5 text-[#CC9048]" />
                        {selectedCustomer.phoneNumber}
                      </span>
                    )}
                    <span>•</span>
                    <span>
                      {selectedCustomer.consulateRecords.length} {t('nav.consulate')}
                    </span>
                    <span>•</span>
                    <span>
                      {selectedCustomer.flightRecords.length} {t('nav.flights')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPrintPreviewTarget({
                      type: 'statement',
                      customerId: selectedCustomer.customerId,
                      currency: selectedCustomer.currencies[0] || 'TRY',
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-[#CC9048] hover:bg-[#e3ba78] text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t('customers.printStatement')} (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProfileId(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 6 Profile Navigation Tabs */}
            <div className="px-5 py-2.5 bg-[#F8FAFC] border-b border-[#D7E7F7] flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'overview', label: t('customers.tab.overview') },
                  { id: 'transactions', label: `${t('customers.tab.transactions')} (${selectedCustomer.consulateRecords.length + selectedCustomer.flightRecords.length})` },
                  { id: 'appointments', label: `${t('customers.tab.appointments')} (${selectedCustomer.consulateRecords.length})` },
                  { id: 'payments', label: t('customers.tab.payments') },
                  { id: 'invoices', label: `${t('customers.tab.invoices')} (${selectedCustomer.invoices.length})` },
                  { id: 'actions', label: t('customers.tab.actions') },
                ] as { id: ProfileTab; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveProfileTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeProfileTab === tab.id
                      ? 'bg-[#0B2E57] text-white shadow-2xs'
                      : 'text-[#5E7086] hover:text-[#0B2E57] hover:bg-white'
                  }`}
                >
                  {ui(tab.label)}
                </button>
              ))}
            </div>

            {/* Tab Content Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* TAB 1: OVERVIEW */}
              {activeProfileTab === 'overview' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {(['TRY', 'MAD', 'EUR', 'USD'] as SupportedCurrency[]).map((curr) => {
                      const b = selectedCustomer.totalsByCurrency[curr];
                      return (
                        <div
                          key={curr}
                          className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D7E7F7] space-y-2"
                        >
                          <div className="flex items-center justify-between border-b border-[#D7E7F7] pb-1.5">
                            <span className="text-xs font-black text-[#0B2E57]">
                              {ui(SUPPORTED_CURRENCIES[curr].label)}
                            </span>
                            <span className="text-xs font-mono font-black text-[#004AA5]" dir="ltr">
                              {curr}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-[#5E7086]">{t('customers.colBilled')}:</span>
                            <span className="font-mono font-bold text-[#0B2E57]" dir="ltr">
                              {formatMinorMoney(b.billedMinor, curr)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-emerald-700">
                            <span>{t('customers.colPaid')}:</span>
                            <span className="font-mono font-bold" dir="ltr">
                              {formatMinorMoney(b.paidMinor, curr)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs font-black pt-1 border-t border-[#D7E7F7]">
                            <span className="text-[#0B2E57]">{t('customers.colOutstanding')}:</span>
                            <span
                              className={`font-mono ${
                                b.outstandingMinor > 0 ? 'text-rose-600' : 'text-emerald-600'
                              }`}
                              dir="ltr"
                            >
                              {formatMinorMoney(b.outstandingMinor, curr)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: TRANSACTION HISTORY */}
              {activeProfileTab === 'transactions' && (
                <div className="space-y-4">
                  <div className="border border-[#D7E7F7] rounded-2xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#0B2E57] text-white font-bold">
                          <th className="py-3 px-4 text-start">{t('chart.date')}</th>
                          <th className="py-3 px-4 text-start">{t('chart.category')}</th>
                          <th className="py-3 px-4 text-start">{t('chart.clientAndDesc')}</th>
                          <th className="py-3 px-4 text-end">{t('chart.amount')}</th>
                          <th className="py-3 px-4 text-end">{t('customers.colPaid')}</th>
                          <th className="py-3 px-4 text-end">{t('customers.colOutstanding')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D7E7F7]">
                        {selectedCustomer.consulateRecords.map((c) => (
                          <tr
                            key={c.id}
                            onClick={() => {
                              setSelectedProfileId(null);
                              setSpotlightItem({ type: 'consulate', item: c });
                            }}
                            className="hover:bg-[#eaf4ff]/40 cursor-pointer"
                          >
                            <td className="py-3 px-4 font-mono" dir="ltr">
                              {c.submissionDate}
                            </td>
                            <td className="py-3 px-4 font-bold text-[#004AA5]">
                              {t('nav.consulate')}
                            </td>
                            <td className="py-3 px-4 font-semibold text-[#0B2E57]">
                              {c.appointmentType}
                            </td>
                            <td className="py-3 px-4 text-end font-mono font-bold" dir="ltr">
                              {formatMoney(c.price, c.currency)}
                            </td>
                            <td className="py-3 px-4 text-end font-mono text-emerald-700" dir="ltr">
                              {formatMoney(c.paidAmount, c.currency)}
                            </td>
                            <td className="py-3 px-4 text-end font-mono font-black text-rose-600" dir="ltr">
                              {formatMoney(c.remainingAmount, c.currency)}
                            </td>
                          </tr>
                        ))}
                        {selectedCustomer.flightRecords.map((f) => (
                          <tr
                            key={f.id}
                            onClick={() => {
                              setSelectedProfileId(null);
                              setSpotlightItem({ type: 'flight', item: f });
                            }}
                            className="hover:bg-emerald-50/40 cursor-pointer"
                          >
                            <td className="py-3 px-4 font-mono" dir="ltr">
                              {f.bookingDate}
                            </td>
                            <td className="py-3 px-4 font-bold text-emerald-700">
                              {t('nav.flights')}
                            </td>
                            <td className="py-3 px-4 font-semibold text-[#0B2E57]">
                              {f.airlineAndRoute} (PNR: {f.pnr})
                            </td>
                            <td className="py-3 px-4 text-end font-mono font-bold" dir="ltr">
                              {formatMoney(f.sellingPrice, f.currency)}
                            </td>
                            <td className="py-3 px-4 text-end font-mono text-emerald-700" dir="ltr">
                              {formatMoney(f.paidAmount, f.currency)}
                            </td>
                            <td className="py-3 px-4 text-end font-mono font-black text-rose-600" dir="ltr">
                              {formatMoney(f.remainingAmount, f.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: APPOINTMENT HISTORY */}
              {activeProfileTab === 'appointments' && (
                <div className="space-y-3">
                  {selectedCustomer.consulateRecords.length === 0 ? (
                    <div className="py-10 text-center text-xs text-[#5E7086]">{ui("لا توجد مواعيد قنصلية مسجلة لهذا العميل.")}</div>
                  ) : (
                    selectedCustomer.consulateRecords.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D7E7F7] flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="text-sm font-black text-[#0B2E57]">
                            {c.appointmentType}
                          </div>
                          <div className="text-xs text-[#5E7086] mt-0.5 font-mono" dir="ltr">
                            {c.submissionDate} • ID: {c.id}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#eaf4ff] text-[#004AA5]">
                            {c.timelineStage}
                          </span>
                          <span className="font-mono font-black text-xs text-[#0B2E57]" dir="ltr">
                            {formatMoney(c.price, c.currency)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: PAYMENT HISTORY */}
              {activeProfileTab === 'payments' && (
                <div className="space-y-3">
                  {selectedCustomer.invoices.flatMap((inv) =>
                    inv.payments.map((p) => ({ ...p, invoiceNumber: inv.invoiceNumber }))
                  ).length === 0 &&
                  selectedCustomer.consulateRecords.filter((c) => c.paidAmount > 0).length === 0 &&
                  selectedCustomer.flightRecords.filter((f) => f.paidAmount > 0).length === 0 ? (
                    <div className="py-10 text-center text-xs text-[#5E7086]">{ui("لا توجد دفعات مسجلة بعد.")}</div>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomer.invoices.flatMap((inv) =>
                        inv.payments.map((p) => (
                          <div
                            key={p.id}
                            className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-black text-[#0B2E57]">
                                {p.method} ({inv.invoiceNumber})
                              </span>
                              <span className="text-[#5E7086] mx-2">•</span>
                              <span className="font-mono text-[#5E7086]" dir="ltr">
                                {p.receivedAt}
                              </span>
                            </div>
                            <span className="font-mono font-black text-emerald-700" dir="ltr">
                              +{formatMinorMoney(p.amountMinor, p.currency)}
                            </span>
                          </div>
                        ))
                      )}
                      {selectedCustomer.consulateRecords
                        .filter((c) => c.paidAmount > 0)
                        .map((c) => (
                          <div
                            key={`pay-c-${c.id}`}
                            className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#D7E7F7] flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-[#0B2E57]">{ui("دفعة معاملة:")}{c.appointmentType}
                              </span>
                              <span className="text-[#5E7086] mx-2">•</span>
                              <span className="font-mono text-[#5E7086]" dir="ltr">
                                {c.submissionDate}
                              </span>
                            </div>
                            <span className="font-mono font-black text-emerald-700" dir="ltr">
                              +{formatMoney(c.paidAmount, c.settlementCurrency || c.currency)}
                            </span>
                          </div>
                        ))}
                      {selectedCustomer.flightRecords
                        .filter((f) => f.paidAmount > 0)
                        .map((f) => (
                          <div
                            key={`pay-f-${f.id}`}
                            className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#D7E7F7] flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-[#0B2E57]">{ui("دفعة تذكرة طيران:")}{f.airlineAndRoute} ({f.pnr})
                              </span>
                              <span className="text-[#5E7086] mx-2">•</span>
                              <span className="font-mono text-[#5E7086]" dir="ltr">
                                {f.bookingDate}
                              </span>
                            </div>
                            <span className="font-mono font-black text-emerald-700" dir="ltr">
                              +{formatMoney(f.paidAmount, f.settlementCurrency || f.currency)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: INVOICES & STATEMENTS */}
              {activeProfileTab === 'invoices' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-black text-[#0B2E57]">{ui("الفواتير الصادرة وكشوف الحساب")}</h4>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCreateInvoiceForCustomer(selectedCustomer)}
                        className="px-3 py-1.5 rounded-xl bg-[#004AA5] text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('customers.newInvoice')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const curr = selectedCustomer.currencies[0] || 'TRY';
                          setSelectedProfileId(null);
                          openCustomerStatement(selectedCustomer.customerId, curr);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#0B2E57] text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{ui("فتح كشف الحساب التفصيلي")}</span>
                      </button>
                    </div>
                  </div>

                  {selectedCustomer.invoices.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#5E7086] bg-[#F8FAFC] rounded-2xl border border-[#D7E7F7]">{ui("لا توجد فواتير مصدرة لهذا العميل بعد. يمكنك إصدار فاتورة جديدة بضغطة زر.")}</div>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomer.invoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D7E7F7] flex flex-wrap items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sm text-[#0B2E57]" dir="ltr">
                                {inv.invoiceNumber}
                              </span>
                              <span className="text-xs text-[#5E7086]" dir="ltr">
                                ({inv.issueDate})
                              </span>
                            </div>
                            <div className="text-xs text-[#5E7086] mt-0.5">
                              {inv.lines.map((l) => l.labelAr).join(' + ')}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-end font-mono text-xs" dir="ltr">
                              <div className="font-black text-[#0B2E57]">
                                {formatMinorMoney(inv.totalMinor, inv.currency)}
                              </div>
                              <div className="text-rose-600 text-[11px]">
                                Due: {formatMinorMoney(inv.balanceDueMinor, inv.currency)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setPrintPreviewTarget({
                                  type: 'invoice',
                                  invoiceId: inv.id,
                                })
                              }
                              className="px-3 py-1.5 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>A4 PDF</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: QUICK ACTIONS */}
              {activeProfileTab === 'actions' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleCreateInvoiceForCustomer(selectedCustomer)}
                    className="p-5 rounded-2xl bg-[#eaf4ff]/60 hover:bg-[#eaf4ff] border border-[#004AA5]/30 text-start transition cursor-pointer space-y-1.5"
                  >
                    <Receipt className="w-6 h-6 text-[#004AA5]" />
                    <div className="text-sm font-black text-[#0B2E57]">{ui("إصدار فاتورة رسمية للعميل (Invoice)")}</div>
                    <p className="text-xs text-[#5E7086]">{ui("تجميع معاملات العميل غير المفوترة وإصدار فاتورة A4 ثنائية اللغة")}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPrintPreviewTarget({
                        type: 'statement',
                        customerId: selectedCustomer.customerId,
                        currency: selectedCustomer.currencies[0] || 'TRY',
                      })
                    }
                    className="p-5 rounded-2xl bg-amber-50/60 hover:bg-amber-50 border border-amber-300/60 text-start transition cursor-pointer space-y-1.5"
                  >
                    <Printer className="w-6 h-6 text-amber-700" />
                    <div className="text-sm font-black text-[#0B2E57]">{ui("طباعة كشف حساب العميل (Account Statement)")}</div>
                    <p className="text-xs text-[#5E7086]">{ui("معاينة وتنزيل كشف حساب مفصل بجميع الفواتير والدفعات والرصيد المتبقي")}</p>
                  </button>

                  {selectedCustomer.phoneNumber && (
                    <a
                      href={generateWhatsAppLink(
                        selectedCustomer.phoneNumber,
                        selectedCustomer.clientName,
                        fromMinorUnits(
                          selectedCustomer.totalsByCurrency[selectedCustomer.currencies[0] || 'TRY']
                            ?.outstandingMinor || 0
                        ),
                        'كشف حساب الفزني سيرفيسز',
                        selectedCustomer.currencies[0] || 'TRY'
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-5 rounded-2xl bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-300/60 text-start transition cursor-pointer space-y-1.5 block"
                    >
                      <MessageCircle className="w-6 h-6 text-emerald-600" />
                      <div className="text-sm font-black text-[#0B2E57]">{ui("إرسال تذكير واتساب مع الحسابات البنكية (IBAN)")}</div>
                      <p className="text-xs text-[#5E7086]">{ui("إرسال رسالة رسمية تتضمن المبلغ المتبقي ورقم الآيبان (RACHID EL FAZNI)")}</p>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
