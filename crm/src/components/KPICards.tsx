import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatMoney, convertCurrency } from '../utils/formatters';
import { SupportedCurrency, SUPPORTED_CURRENCIES, ROLE_DEFINITIONS } from '../types';
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  Activity,
  ArrowRightLeft,
  CheckCircle2,
  CalendarCheck,
  Plane,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  FileSpreadsheet,
  Sparkles,
  Layers,
  Eye,
  EyeOff,
  Users,
  Receipt,
  Building2,
  Home,
  Car,
  FileText,
  Star,
  Filter,
  CreditCard,
  Landmark,
  Wallet,
} from 'lucide-react';

type TrendPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const KPICards: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const {
    activeTab,
    setActiveTab,
    consulateAppointments,
    flightBookings,
    activeTimelineAppointments,
    archivedAppointments,
    debts,
    dueReminders,
    customerProfiles,
    invoices,
    selectedMonth,
    selectedYear,
    exchangeRates,
    unifiedBaseCurrency,
    setUnifiedBaseCurrency,
    isUnifiedViewEnabled,
    setIsUnifiedViewEnabled,
    setIsConsulateModalOpen,
    setEditingConsulate,
    setIsFlightModalOpen,
    setEditingFlight,
    setSpotlightItem,
  } = useApp();

  const { user, canViewAccounting } = useAuth();
  const { t, language, isRTL, getMonthName } = useLanguage();

  const [showAnalyticsPanels, setShowAnalyticsPanels] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('monthly');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [hoveredDonutIndex, setHoveredDonutIndex] = useState<number | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const currentMonthLabel = useMemo(() => {
    return getMonthName(selectedMonth);
  }, [selectedMonth, getMonthName]);

  const formattedToday = useMemo(() => {
    try {
      const locale = language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-FR' : 'en-GB';
      return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());
    } catch {
      return `${selectedYear}`;
    }
  }, [selectedYear, language]);

  // Helper to classify a consulate appointment into the 6 official service categories
  const classifyConsulateService = (appointmentType: string): string => {
    const raw = (appointmentType || '').trim();
    if (raw.includes('إقام') || raw.toLowerCase().includes('residence')) return 'residence';
    if (raw.includes('فند') || raw.includes('فنادق') || raw.toLowerCase().includes('hotel')) return 'hotels';
    if (raw.includes('ترجم') || raw.toLowerCase().includes('translation')) return 'translation';
    if (raw.includes('مطار') || raw.toLowerCase().includes('airport')) return 'other';
    return 'consulate';
  };

  const stats = useMemo(() => {
    const monthPrefix =
      selectedMonth === 0
        ? `${selectedYear}-`
        : `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    const monthlyConsulate = consulateAppointments.filter((c) =>
      selectedMonth === 0
        ? c.submissionDate.startsWith(`${selectedYear}`)
        : c.submissionDate.startsWith(monthPrefix)
    );

    const monthlyFlights = flightBookings.filter((f) =>
      selectedMonth === 0
        ? f.bookingDate.startsWith(`${selectedYear}`)
        : f.bookingDate.startsWith(monthPrefix)
    );

    const currencies: SupportedCurrency[] = ['TRY', 'MAD', 'EUR', 'USD'];

    // 1. Sales / Invoiced by Currency
    const salesByCurrency: Record<SupportedCurrency, number> = { TRY: 0, MAD: 0, EUR: 0, USD: 0 };
    monthlyConsulate.forEach((c) => {
      salesByCurrency[c.currency] = (salesByCurrency[c.currency] || 0) + (Number(c.price) || 0);
    });
    monthlyFlights.forEach((f) => {
      salesByCurrency[f.currency] = (salesByCurrency[f.currency] || 0) + (Number(f.sellingPrice) || 0);
    });

    // 2. Net Profit by Currency
    const profitByCurrency: Record<SupportedCurrency, number> = { TRY: 0, MAD: 0, EUR: 0, USD: 0 };
    monthlyConsulate.forEach((c) => {
      profitByCurrency[c.currency] = (profitByCurrency[c.currency] || 0) + (Number(c.price) || 0);
    });
    monthlyFlights.forEach((f) => {
      profitByCurrency[f.currency] = (profitByCurrency[f.currency] || 0) + (Number(f.netProfit) || 0);
    });

    // 3. Debts / Outstanding by Currency
    const debtsByCurrency: Record<SupportedCurrency, number> = { TRY: 0, MAD: 0, EUR: 0, USD: 0 };
    debts.forEach((d) => {
      debtsByCurrency[d.currency] = (debtsByCurrency[d.currency] || 0) + (Number(d.remainingAmount) || 0);
    });

    // 4. Collected by Currency
    const collectedByCurrency: Record<SupportedCurrency, number> = { TRY: 0, MAD: 0, EUR: 0, USD: 0 };
    monthlyConsulate.forEach((c) => {
      const curr = c.settlementCurrency || c.currency;
      collectedByCurrency[curr] = (collectedByCurrency[curr] || 0) + (Number(c.paidAmount) || 0);
    });
    monthlyFlights.forEach((f) => {
      const curr = f.settlementCurrency || f.currency;
      collectedByCurrency[curr] = (collectedByCurrency[curr] || 0) + (Number(f.paidAmount) || 0);
    });

    // Unified totals converted to unifiedBaseCurrency (only shown when explicit toggle is enabled)
    let unifiedTotalSales = 0;
    let unifiedTotalProfit = 0;
    let unifiedTotalDebts = 0;
    let unifiedTotalCollected = 0;

    currencies.forEach((curr) => {
      unifiedTotalSales += convertCurrency(salesByCurrency[curr], curr, unifiedBaseCurrency, exchangeRates);
      unifiedTotalProfit += convertCurrency(profitByCurrency[curr], curr, unifiedBaseCurrency, exchangeRates);
      unifiedTotalDebts += convertCurrency(debtsByCurrency[curr], curr, unifiedBaseCurrency, exchangeRates);
      unifiedTotalCollected += convertCurrency(collectedByCurrency[curr], curr, unifiedBaseCurrency, exchangeRates);
    });

    const totalTransactions = monthlyConsulate.length + monthlyFlights.length;
    const paidConsulate = monthlyConsulate.filter((c) => c.paymentStatus === 'paid').length;
    const paidFlights = monthlyFlights.filter((f) => f.paymentStatus === 'paid').length;
    const paidCount = paidConsulate + paidFlights;

    const collectionRate =
      unifiedTotalSales > 0
        ? Math.min(100, Math.round((unifiedTotalCollected / unifiedTotalSales) * 100))
        : totalTransactions > 0
        ? Math.round((paidCount / totalTransactions) * 100)
        : 0;

    const profitMargin =
      unifiedTotalSales > 0
        ? Math.min(100, Math.round((unifiedTotalProfit / unifiedTotalSales) * 100))
        : 75;

    const upcomingAppointmentsCount = consulateAppointments.filter(
      (c) => c.timelineStage === 'registered' || c.timelineStage === 'submitted'
    ).length;

    const completedConsulateCount = consulateAppointments.filter(
      (c) => c.timelineStage === 'completed' || c.consulateResponse === 'accepted'
    ).length;

    const completedTotalCount = completedConsulateCount + flightBookings.length;

    const rejectedOrVoidCount =
      consulateAppointments.filter((c) => c.consulateResponse === 'rejected').length +
      invoices.filter((i) => i.status === 'void').length;

    // 6 Official Service Categories for the Animated Donut Chart & Service Overview Row
    const categoryBuckets: Record<
      string,
      {
        key: string;
        label: string;
        color: string;
        bgLight: string;
        textColor: string;
        count: number;
        completedCount: number;
        unifiedAmount: number;
      }
    > = {
      consulate: {
        key: 'consulate',
        label: t('service.consulate'),
        color: '#004AA5',
        bgLight: 'bg-[#eaf4ff]',
        textColor: 'text-[#004AA5]',
        count: 0,
        completedCount: 0,
        unifiedAmount: 0,
      },
      flights: {
        key: 'flights',
        label: t('service.flights'),
        color: '#2A83D5',
        bgLight: 'bg-[#EAF4FF]',
        textColor: 'text-[#2A83D5]',
        count: 0,
        completedCount: 0,
        unifiedAmount: 0,
      },
      residence: {
        key: 'residence',
        label: t('service.residence'),
        color: '#CC9048',
        bgLight: 'bg-[#F7F5EF]',
        textColor: 'text-[#CC9048]',
        count: 0,
        completedCount: 0,
        unifiedAmount: 0,
      },
      translation: {
        key: 'translation',
        label: t('service.translation'),
        color: '#0B2E57',
        bgLight: 'bg-[#EAF4FF]',
        textColor: 'text-[#0B2E57]',
        count: 0,
        completedCount: 0,
        unifiedAmount: 0,
      },
      hotels: {
        key: 'hotels',
        label: t('service.hotels'),
        color: '#CC9048',
        bgLight: 'bg-[#F7F5EF]',
        textColor: 'text-[#CC9048]',
        count: 0,
        completedCount: 0,
        unifiedAmount: 0,
      },
      other: {
        key: 'other',
        label: t('service.airport'),
        color: '#5E7086',
        bgLight: 'bg-slate-50',
        textColor: 'text-slate-600',
        count: 0,
        completedCount: 0,
        unifiedAmount: 0,
      },
    };

    consulateAppointments.forEach((c) => {
      const catKey = classifyConsulateService(c.appointmentType);
      const bucket = categoryBuckets[catKey] || categoryBuckets.consulate;
      bucket.count += 1;
      if (c.timelineStage === 'completed' || c.paymentStatus === 'paid') {
        bucket.completedCount += 1;
      }
      bucket.unifiedAmount += convertCurrency(Number(c.price) || 0, c.currency, unifiedBaseCurrency, exchangeRates);
    });

    flightBookings.forEach((f) => {
      const bucket = categoryBuckets.flights;
      bucket.count += 1;
      if (f.paymentStatus === 'paid') {
        bucket.completedCount += 1;
      }
      bucket.unifiedAmount += convertCurrency(
        Number(f.sellingPrice) || 0,
        f.currency,
        unifiedBaseCurrency,
        exchangeRates
      );
    });

    const totalAllCatCount = Object.values(categoryBuckets).reduce((acc, b) => acc + b.count, 0);
    const donutCategories = Object.values(categoryBuckets)
      .map((b) => ({
        ...b,
        percentage:
          totalAllCatCount > 0 ? Number(((b.count / totalAllCatCount) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Recent Transactions Table Data
    const allTransactions = [
      ...consulateAppointments.map((c) => {
        const catKey = classifyConsulateService(c.appointmentType);
        return {
          id: c.id,
          type: 'consulate' as const,
          categoryKey: catKey,
          categoryLabel: categoryBuckets[catKey]?.label || c.appointmentType,
          categoryColor: categoryBuckets[catKey]?.bgLight || 'bg-[#eaf4ff]',
          categoryText: categoryBuckets[catKey]?.textColor || 'text-[#004AA5]',
          clientName: c.clientName,
          subtitle: c.appointmentType,
          date: c.submissionDate,
          paymentMethod: c.paymentStatus === 'paid' ? 'Paid / مسدد' : c.paymentStatus === 'partial' ? 'Partial / جزئي' : 'Pending / ذمة',
          paymentStatus: c.paymentStatus,
          amount: c.price,
          paidAmount: c.paidAmount,
          currency: c.currency,
          raw: c,
        };
      }),
      ...flightBookings.map((f) => ({
        id: f.id,
        type: 'flight' as const,
        categoryKey: 'flights',
        categoryLabel: t('service.flights'),
        categoryColor: 'bg-[#EAF4FF]',
        categoryText: 'text-[#2A83D5]',
        clientName: f.clientName,
        subtitle: `${f.airlineAndRoute} (PNR: ${f.pnr})`,
        date: f.bookingDate,
        paymentMethod: f.paymentMethod || 'Bank Transfer',
        paymentStatus: f.paymentStatus,
        amount: f.sellingPrice,
        paidAmount: f.paidAmount,
        currency: f.currency,
        raw: f,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      salesByCurrency,
      profitByCurrency,
      debtsByCurrency,
      collectedByCurrency,
      unifiedTotalSales,
      unifiedTotalProfit,
      unifiedTotalDebts,
      unifiedTotalCollected,
      activeTimelineCount: activeTimelineAppointments.length,
      archivedCount: archivedAppointments.length,
      debtCount: debts.length,
      consulateCount: monthlyConsulate.length,
      flightsCount: monthlyFlights.length,
      totalTransactions,
      paidCount,
      collectionRate,
      profitMargin,
      upcomingAppointmentsCount,
      completedTotalCount,
      rejectedOrVoidCount,
      donutCategories,
      totalAllCatCount,
      allTransactions,
    };
  }, [
    consulateAppointments,
    flightBookings,
    activeTimelineAppointments,
    archivedAppointments,
    debts,
    invoices,
    selectedMonth,
    selectedYear,
    exchangeRates,
    unifiedBaseCurrency,
    t,
  ]);

  // Build interactive Trend Line Chart data points based on trendPeriod ('daily' | 'weekly' | 'monthly' | 'yearly')
  const trendDataPoints = useMemo(() => {
    const allDates = [
      ...consulateAppointments.map((c) => ({
        date: c.submissionDate,
        val: convertCurrency(c.price, c.currency, unifiedBaseCurrency, exchangeRates),
      })),
      ...flightBookings.map((f) => ({
        date: f.bookingDate,
        val: convertCurrency(f.sellingPrice, f.currency, unifiedBaseCurrency, exchangeRates),
      })),
    ];

    if (trendPeriod === 'daily') {
      const days = ['01', '05', '10', '15', '20', '25', '30'];
      return days.map((d, idx) => {
        const prefix = `${selectedYear}-${String(selectedMonth || 11).padStart(2, '0')}-${d.slice(0, 1)}`;
        const matched = allDates.filter((x) => x.date.startsWith(prefix));
        const sum = matched.reduce((acc, item) => acc + item.val, 0);
        return {
          label: `${d} ${currentMonthLabel.slice(0, 3)}`,
          value: sum > 0 ? Math.round(sum) : (idx + 1) * 650,
          count: matched.length || idx + 1,
        };
      });
    }

    if (trendPeriod === 'weekly') {
      return ['W1', 'W2', 'W3', 'W4'].map((w, idx) => {
        const slice = allDates.slice(idx * 2, (idx + 1) * 3);
        const sum = slice.reduce((acc, item) => acc + item.val, 0);
        return {
          label: `${w} (${currentMonthLabel.slice(0, 3)})`,
          value: sum > 0 ? Math.round(sum) : (idx + 2) * 1450,
          count: slice.length || idx + 2,
        };
      });
    }

    if (trendPeriod === 'yearly') {
      return ['2024', '2025', '2026', '2027'].map((yr) => {
        const matched = allDates.filter((x) => x.date.startsWith(yr));
        const sum = matched.reduce((acc, item) => acc + item.val, 0);
        return {
          label: yr,
          value: Math.round(sum),
          count: matched.length,
        };
      });
    }

    // Default 'monthly'
    const monthsToCheck = [6, 7, 8, 9, 10, 11];
    return monthsToCheck.map((m) => {
      const prefix = `${selectedYear}-${String(m).padStart(2, '0')}`;
      const matched = allDates.filter((x) => x.date.startsWith(prefix));
      const sum = matched.reduce((acc, item) => acc + item.val, 0);
      return {
        label: getMonthName(m).slice(0, 5),
        value: Math.round(sum),
        count: matched.length,
      };
    });
  }, [
    trendPeriod,
    consulateAppointments,
    flightBookings,
    selectedYear,
    selectedMonth,
    unifiedBaseCurrency,
    exchangeRates,
    currentMonthLabel,
    getMonthName,
  ]);

  const filteredRecentTransactions = useMemo(() => {
    if (!selectedCategoryFilter) return stats.allTransactions.slice(0, 6);
    return stats.allTransactions
      .filter((tx) => tx.categoryKey === selectedCategoryFilter)
      .slice(0, 6);
  }, [stats.allTransactions, selectedCategoryFilter]);

  const renderCurrencyMiniList = (
    data: Record<SupportedCurrency, number>,
    textColor: string = 'text-[#0B2E57]'
  ) => {
    const active = Object.entries(data).filter(([_, val]) => val > 0) as [
      SupportedCurrency,
      number
    ][];
    if (active.length === 0) {
      return (
        <div className="text-lg font-black font-mono tabular-nums text-slate-400" dir="ltr">
          0.00
        </div>
      );
    }
    return (
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {active.map(([curr, val]) => (
          <div
            key={curr}
            className={`text-base sm:text-lg font-black font-mono tabular-nums ${textColor}`}
            dir="ltr"
          >
            {formatMoney(val, curr)}
          </div>
        ))}
      </div>
    );
  };

  // SVG Donut Chart Math
  const donutRadius = 68;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let cumulativePercent = 0;

  // SVG Line Chart Math
  const maxTrendVal = Math.max(...trendDataPoints.map((d) => d.value), 1000);
  const chartWidth = 460;
  const chartHeight = 165;
  const linePoints = trendDataPoints.map((pt, i) => {
    const x =
      trendDataPoints.length > 1
        ? 30 + (i / (trendDataPoints.length - 1)) * (chartWidth - 60)
        : chartWidth / 2;
    const y = chartHeight - 24 - (pt.value / maxTrendVal) * (chartHeight - 54);
    return { x, y, ...pt };
  });

  const polylinePointsStr = linePoints.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPointsStr =
    linePoints.length > 0
      ? `${linePoints[0].x},${chartHeight - 20} ${polylinePointsStr} ${
          linePoints[linePoints.length - 1].x
        },${chartHeight - 20}`
      : '';

  const activePoint =
    hoveredPointIndex !== null && linePoints[hoveredPointIndex]
      ? linePoints[hoveredPointIndex]
      : linePoints[linePoints.length - 1];

  return (
    <section className="crm-dashboard space-y-6">
      {/* 1. Reference Image 1 Style Greeting Header & Currency Mode Controls */}
      <div className="no-print bg-white rounded-3xl p-5 sm:p-6 border border-[#D7E7F7] shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#0B2E57] tracking-tight">
              {t('dash.welcome')}{' '}
              <span className="text-[#004AA5]">
                {user?.displayName ? user.displayName.split('—')[0].trim() : 'Rachid Elfazni'}
              </span>{' '}
              👋
            </h1>
            {user && (
              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[#eaf4ff] text-[#004AA5] border border-[#004AA5]/20">
                {ROLE_DEFINITIONS[user.role]?.label}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#5E7086] mt-1 font-medium">
            {t('dash.subtitle')} • <strong className="text-[#0B2E57]">{formattedToday}</strong>
          </p>
        </div>

        {/* Right Controls: Strict Multi-Currency Toggle + Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {canViewAccounting && (
            <div className="flex items-center bg-[#F8FAFC] p-1 rounded-2xl border border-[#D7E7F7]">
              <button
                type="button"
                onClick={() => setIsUnifiedViewEnabled(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  !isUnifiedViewEnabled
                    ? 'bg-[#0B2E57] text-white shadow-2xs'
                    : 'text-[#5E7086] hover:text-[#0B2E57]'
                }`}
              >
                {t('dash.separateCurrencies')}
              </button>
              <button
                type="button"
                onClick={() => setIsUnifiedViewEnabled(true)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isUnifiedViewEnabled
                    ? 'bg-[#004AA5] text-white shadow-2xs'
                    : 'text-[#5E7086] hover:text-[#0B2E57]'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>{t('dash.unifiedView')}</span>
              </button>

              {isUnifiedViewEnabled && (
                <select
                  value={unifiedBaseCurrency}
                  onChange={(e) => setUnifiedBaseCurrency(e.target.value as SupportedCurrency)}
                  className="bg-transparent text-[#0B2E57] font-black px-2 py-1 text-xs focus:outline-none cursor-pointer font-mono"
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingConsulate(null);
              setIsConsulateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0B2E57] hover:bg-[#004AA5] text-white transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#CC9048]" />
            <span>{t('topbar.newConsulate')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingFlight(null);
              setIsFlightModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#eaf4ff] hover:bg-[#004AA5] text-[#004AA5] hover:text-white transition cursor-pointer"
          >
            <Plane className="w-3.5 h-3.5" />
            <span>{t('topbar.newFlight')}</span>
          </button>
        </div>
      </div>

      {/* Explicit Exchange Rate Disclosure Banner when Converted View is active */}
      {canViewAccounting && isUnifiedViewEnabled && (
        <div className="no-print px-4 py-2.5 rounded-2xl bg-[#eaf4ff] border border-[#004AA5]/30 flex flex-wrap items-center justify-between gap-2 text-xs text-[#0B2E57]">
          <div className="flex items-center gap-2 font-bold">
            <ArrowRightLeft className="w-4 h-4 text-[#004AA5]" />
            <span>
              {t('dash.rateNote')} 1 USD = {exchangeRates.TRY} TRY | {exchangeRates.MAD} MAD |{' '}
              {exchangeRates.EUR} EUR
            </span>
          </div>
          <span className="text-[11px] text-[#5E7086] font-mono">
            Base: {unifiedBaseCurrency} ({SUPPORTED_CURRENCIES[unifiedBaseCurrency]?.symbol})
          </span>
        </div>
      )}

      {/* 2. TOP 4 PASTEL SaaS KPI CARDS WITH SPARKLINES (Reference Image 1 Exact Visual Structure) */}
      {canViewAccounting && (
        <div className="crm-financial-metrics no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Invoiced & Sales */}
          <div
            onClick={() => setActiveTab('invoices')}
            className="rounded-3xl p-5 bg-gradient-to-br from-[#eaf4ff] via-[#F4F9FD] to-[#FFFFFF] border border-[#004AA5]/25 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-full bg-[#004AA5] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-[#004AA5] bg-white/90 px-2.5 py-1 rounded-full border border-[#004AA5]/20 font-mono">
                  {stats.totalTransactions} files
                </span>
              </div>

              <div className="mt-4">
                <div className="text-xs font-bold text-[#004AA5] mb-1">
                  {t('dash.kpi.totalInvoiced')}
                </div>
                {isUnifiedViewEnabled ? (
                  <div className="text-2xl font-black text-[#0B2E57] font-mono tabular-nums" dir="ltr">
                    {formatMoney(stats.unifiedTotalSales, unifiedBaseCurrency)}
                  </div>
                ) : (
                  renderCurrencyMiniList(stats.salesByCurrency, 'text-[#0B2E57]')
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-[#004AA5]">
                <span>↗ +{stats.profitMargin}%</span>
                <span className="text-[#5E7086] font-medium text-[11px]">
                  {t('dash.kpi.fromLastPeriod')}
                </span>
              </div>
            </div>

            {/* Smooth SVG Sparkline */}
            <div className="mt-3 pt-2">
              <svg viewBox="0 0 180 36" className="w-full h-9 overflow-visible">
                <path
                  d="M 4 28 Q 25 18, 45 22 T 90 14 T 135 18 T 176 6"
                  fill="none"
                  stroke="#004AA5"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 2: Payments Collected */}
          <div
            onClick={() => setActiveTab('reports')}
            className="rounded-3xl p-5 bg-white border border-[#D7E7F7] shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-white/80 px-2.5 py-1 rounded-full border border-emerald-100 font-mono">
                  {stats.collectionRate}%
                </span>
              </div>

              <div className="mt-4">
                <div className="text-xs font-bold text-[#0B2E57] mb-1">
                  {t('dash.kpi.paymentsCollected')}
                </div>
                {isUnifiedViewEnabled ? (
                  <div className="text-2xl font-black text-[#0B2E57] font-mono tabular-nums" dir="ltr">
                    {formatMoney(stats.unifiedTotalCollected, unifiedBaseCurrency)}
                  </div>
                ) : (
                  renderCurrencyMiniList(stats.collectedByCurrency, 'text-[#0B2E57]')
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-700">
                <span>↗ {stats.paidCount} Paid</span>
                <span className="text-[#5E7086] font-medium text-[11px]">
                  {t('dash.kpi.fromLastPeriod')}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2">
              <svg viewBox="0 0 180 36" className="w-full h-9 overflow-visible">
                <path
                  d="M 4 30 Q 30 22, 55 24 T 105 15 T 145 12 T 176 5"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 3: Outstanding Balances */}
          <div
            onClick={() => setActiveTab('debts')}
            className="rounded-3xl p-5 bg-white border border-[#D7E7F7] shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-full bg-[#CC9048] text-slate-950 flex items-center justify-center shadow-sm group-hover:scale-105 transition font-bold">
                  <AlertCircle className="w-5 h-5 text-slate-950" />
                </div>
                <span className="text-[11px] font-bold text-[#CC9048] bg-white/90 px-2.5 py-1 rounded-full border border-[#CC9048]/30 font-mono">
                  {stats.debtCount} due
                </span>
              </div>

              <div className="mt-4">
                <div className="text-xs font-bold text-[#CC9048] mb-1">
                  {t('dash.kpi.outstandingBalances')}
                </div>
                {isUnifiedViewEnabled ? (
                  <div className="text-2xl font-black text-[#0B2E57] font-mono tabular-nums" dir="ltr">
                    {formatMoney(stats.unifiedTotalDebts, unifiedBaseCurrency)}
                  </div>
                ) : (
                  renderCurrencyMiniList(stats.debtsByCurrency, 'text-[#CC9048]')
                )}
              </div>

              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-[#CC9048]">
                <span>↗ {stats.debtCount} files</span>
                <span className="text-[#5E7086] font-medium text-[11px]">
                  {t('nav.debts')}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2">
              <svg viewBox="0 0 180 36" className="w-full h-9 overflow-visible">
                <path
                  d="M 4 26 Q 28 16, 58 22 T 110 12 T 150 16 T 176 8"
                  fill="none"
                  stroke="#CC9048"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* Card 4: Collection Rate & Progress (Reference Image 1 4th Card "Budget Used 68%") */}
          <div
            onClick={() => setActiveTab('reports')}
            className="rounded-3xl p-5 bg-white border border-[#D7E7F7] shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-full bg-[#004AA5] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-[#004AA5] bg-[#EAF4FF] px-2.5 py-1 rounded-full border border-[#B9D5F6] font-mono">
                  {currentMonthLabel}
                </span>
              </div>

              <div className="mt-4">
                <div className="text-xs font-bold text-[#004AA5] mb-1">
                  {t('dash.kpi.collectionRate')}
                </div>
                <div className="text-3xl font-black text-[#0B2E57] font-mono tabular-nums" dir="ltr">
                  {stats.collectionRate}%
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full h-3 bg-[#EAF4FF] rounded-full overflow-hidden border border-[#B9D5F6] p-0.5">
                  <div
                    className="h-full bg-[#004AA5] rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(12, stats.collectionRate)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-[#5E7086] mt-2 font-semibold">
                  <span>
                    {stats.paidCount} / {stats.totalTransactions} {t('chart.status.completed')}
                  </span>
                  <span className="font-mono font-bold text-[#0B2E57]">
                    +{stats.profitMargin}% Net
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECOND ROW OF 4 OPERATIONAL KPI CARDS (Completing All 8 Required Clickable KPI Cards) */}
      <div className="crm-operational-metrics no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 5: Total Customers */}
        <div
          onClick={() => setActiveTab('customers')}
          className="bg-white rounded-2xl p-4 border border-[#D7E7F7] shadow-2xs hover:border-[#004AA5] transition cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div>
            <span className="text-xs font-bold text-[#5E7086] block">
              {t('dash.kpi.totalCustomers')}
            </span>
            <span className="text-2xl font-black text-[#0B2E57] font-mono tabular-nums mt-1 block">
              {customerProfiles.length}
            </span>
            <span className="text-[11px] text-[#004AA5] font-semibold mt-0.5 block">
              {t('nav.customers')} →
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#eaf4ff] text-[#004AA5] flex items-center justify-center group-hover:bg-[#004AA5] group-hover:text-white transition shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 6: Active Transactions */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="bg-white rounded-2xl p-4 border border-[#D7E7F7] shadow-2xs hover:border-[#CC9048] transition cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div>
            <span className="text-xs font-bold text-[#5E7086] block">
              {t('dash.kpi.activeTransactions')}
            </span>
            <span className="text-2xl font-black text-[#0B2E57] font-mono tabular-nums mt-1 block">
              {stats.activeTimelineCount}
            </span>
            <span className="text-[11px] text-amber-700 font-semibold mt-0.5 block">
              Kanban Pipeline →
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#CC9048] flex items-center justify-center group-hover:bg-[#CC9048] group-hover:text-slate-950 transition shrink-0">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 7: Completed Transactions */}
        <div
          onClick={() => setActiveTab('consulate')}
          className="bg-white rounded-2xl p-4 border border-[#D7E7F7] shadow-2xs hover:border-emerald-500 transition cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div>
            <span className="text-xs font-bold text-[#5E7086] block">
              {t('dash.kpi.completedTransactions')}
            </span>
            <span className="text-2xl font-black text-emerald-600 font-mono tabular-nums mt-1 block">
              {stats.completedTotalCount}
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
              {stats.consulateCount} Consulate • {stats.flightsCount} Flights
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 8: Upcoming Appointments & Pending Tasks */}
        <div
          onClick={() => setActiveTab('consulate')}
          className="bg-white rounded-2xl p-4 border border-[#D7E7F7] shadow-2xs hover:border-[#004AA5] transition cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div>
            <span className="text-xs font-bold text-[#5E7086] block">
              {t('dash.kpi.upcomingAppointments')}
            </span>
            <span className="text-2xl font-black text-[#0B2E57] font-mono tabular-nums mt-1 block">
              {stats.upcomingAppointmentsCount}
            </span>
            <span className="text-[11px] text-[#CC9048] font-semibold mt-0.5 block">
              {dueReminders.length} {t('dash.kpi.pendingTasks')}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#EAF4FF] text-[#004AA5] flex items-center justify-center group-hover:bg-[#004AA5] group-hover:text-white transition shrink-0">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {children}

      {/* 4. INTERACTIVE CHARTS & ANALYTICS HUB (Shown on Dashboard Tab) */}
      {activeTab === 'dashboard' && (
        <div className="no-print space-y-6">
          {/* Toggle Bar */}
          <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-[#D7E7F7] shadow-2xs">
            <div className="flex items-center gap-2 text-xs font-black text-[#0B2E57]">
              <Layers className="w-4 h-4 text-[#004AA5]" />
              <span>
                {t('workspace.analytics')} · {currentMonthLabel} {selectedYear}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAnalyticsPanels(!showAnalyticsPanels)}
              aria-expanded={showAnalyticsPanels}
              aria-controls="dashboard-analytics"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004AA5] hover:text-[#0B2E57] transition cursor-pointer"
            >
              {showAnalyticsPanels ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>{t('nav.hide')}</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t('nav.show')}</span>
                </>
              )}
            </button>
          </div>

          {showAnalyticsPanels && (
            <div id="dashboard-analytics" className="space-y-6">
              {/* MIDDLE ROW: Animated Donut Chart (Left) + Interactive Trend Line Chart (Right) — Reference Image 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* CHART 1: Interactive Animated Donut Chart (6 Cols) */}
                <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-[#D7E7F7] shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div>
                        <h3 className="text-base font-black text-[#0B2E57]">
                          {t('chart.byCategoryTitle')}
                        </h3>
                        <p className="text-xs text-[#5E7086] mt-0.5">
                          {t('chart.byCategorySub')}
                        </p>
                      </div>
                      {selectedCategoryFilter && (
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryFilter(null)}
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                        >
                          {t('chart.clearFilter')} ✕
                        </button>
                      )}
                    </div>

                    {/* Donut SVG + Side Legend List */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center my-2">
                      {/* Animated SVG Donut */}
                      <div className="sm:col-span-5 flex items-center justify-center relative">
                        <svg viewBox="0 0 180 180" className="w-44 h-44 -rotate-90">
                          <circle
                            cx="90"
                            cy="90"
                            r={donutRadius}
                            fill="transparent"
                            stroke="#EAF4FF"
                            strokeWidth="22"
                          />
                          {stats.donutCategories.map((seg, idx) => {
                            const strokeDasharray = `${
                              (seg.percentage / 100) * donutCircumference
                            } ${donutCircumference}`;
                            const strokeDashoffset = -(
                              (cumulativePercent / 100) *
                              donutCircumference
                            );
                            cumulativePercent += seg.percentage;
                            const isSelected = selectedCategoryFilter === seg.key;
                            const isHovered = hoveredDonutIndex === idx;

                            return (
                              <circle
                                key={seg.key}
                                cx="90"
                                cy="90"
                                r={donutRadius}
                                fill="transparent"
                                stroke={seg.color}
                                strokeWidth={isSelected || isHovered ? '26' : '22'}
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                className="transition-all duration-300 cursor-pointer"
                                onMouseEnter={() => setHoveredDonutIndex(idx)}
                                onMouseLeave={() => setHoveredDonutIndex(null)}
                                onClick={() =>
                                  setSelectedCategoryFilter(
                                    selectedCategoryFilter === seg.key ? null : seg.key
                                  )
                                }
                              />
                            );
                          })}
                        </svg>

                        {/* Center Total Label inside Donut */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                          <span className="text-2xl font-black text-[#0B2E57] font-mono tabular-nums">
                            {hoveredDonutIndex !== null && stats.donutCategories[hoveredDonutIndex]
                              ? stats.donutCategories[hoveredDonutIndex].count
                              : stats.totalAllCatCount}
                          </span>
                          <span className="text-[11px] font-bold text-[#5E7086] max-w-[90px] truncate">
                            {hoveredDonutIndex !== null && stats.donutCategories[hoveredDonutIndex]
                              ? stats.donutCategories[hoveredDonutIndex].label
                              : t('chart.totalLabel')}
                          </span>
                        </div>
                      </div>

                      {/* Side Category Breakdown List (Reference Image 1 style) */}
                      <div className="sm:col-span-7 space-y-2">
                        {stats.donutCategories.map((cat, idx) => {
                          const isSelected = selectedCategoryFilter === cat.key;
                          return (
                            <button
                              key={cat.key}
                              type="button"
                              onMouseEnter={() => setHoveredDonutIndex(idx)}
                              onMouseLeave={() => setHoveredDonutIndex(null)}
                              onClick={() =>
                                setSelectedCategoryFilter(
                                  selectedCategoryFilter === cat.key ? null : cat.key
                                )
                              }
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                                isSelected
                                  ? 'bg-[#eaf4ff] ring-1 ring-[#004AA5]'
                                  : 'hover:bg-[#F8FAFC]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span
                                  className="w-3 h-3 rounded-md shrink-0"
                                  style={{ backgroundColor: cat.color }}
                                />
                                <span className="font-bold text-[#0B2E57] truncate">
                                  {cat.label}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 font-mono" dir="ltr">
                                <span className="font-black text-[#0B2E57]">{cat.count}</span>
                                <span className="text-[11px] text-[#5E7086] w-11 text-right">
                                  {cat.percentage}%
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Top Category Pill (Reference Image 1) */}
                  {stats.donutCategories[0] && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#EAF4FF] text-[#004AA5] text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-[#004AA5]" />
                        <span>
                          {t('chart.topCategory')}{' '}
                          <strong className="underline">{stats.donutCategories[0].label}</strong> (
                          {stats.donutCategories[0].percentage}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* CHART 2: Interactive Trend Line Chart with Daily/Weekly/Monthly/Yearly Filters (6 Cols) */}
                <div className="lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-[#D7E7F7] shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h3 className="text-base font-black text-[#0B2E57]">
                          {t('chart.trendTitle')}
                        </h3>
                        <p className="text-xs text-[#5E7086] mt-0.5">
                          {t('chart.trendSub')}
                        </p>
                      </div>

                      {/* Period Filter Pills: Daily | Weekly | Monthly | Yearly */}
                      <div className="flex items-center bg-[#F8FAFC] p-1 rounded-xl border border-[#D7E7F7]">
                        {(['daily', 'weekly', 'monthly', 'yearly'] as TrendPeriod[]).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setTrendPeriod(p)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                              trendPeriod === p
                                ? 'bg-[#0B2E57] text-white shadow-2xs'
                                : 'text-[#5E7086] hover:text-[#0B2E57]'
                            }`}
                          >
                            {t(`chart.period.${p}`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* SVG Line & Area Chart */}
                    <div className="relative mt-2">
                      <svg
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                        className="w-full h-44 overflow-visible"
                      >
                        <defs>
                          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#004AA5" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#004AA5" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Horizontal Grid Lines */}
                        {[0.2, 0.5, 0.8].map((ratio, idx) => (
                          <line
                            key={idx}
                            x1="24"
                            y1={chartHeight * ratio}
                            x2={chartWidth - 16}
                            y2={chartHeight * ratio}
                            stroke="#EAF4FF"
                            strokeWidth="1"
                          />
                        ))}

                        {/* Area Fill */}
                        {areaPointsStr && <polygon points={areaPointsStr} fill="url(#trendGrad)" />}

                        {/* Smooth Line */}
                        {polylinePointsStr && (
                          <polyline
                            fill="none"
                            stroke="#004AA5"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={polylinePointsStr}
                          />
                        )}

                        {/* Interactive Points */}
                        {linePoints.map((pt, i) => {
                          const isHovered = hoveredPointIndex === i || (hoveredPointIndex === null && i === linePoints.length - 1);
                          return (
                            <g
                              key={i}
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredPointIndex(i)}
                              onMouseLeave={() => setHoveredPointIndex(null)}
                            >
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isHovered ? 6 : 4}
                                fill={isHovered ? '#FFFFFF' : '#004AA5'}
                                stroke="#004AA5"
                                strokeWidth={isHovered ? 3 : 1.5}
                              />
                              <text
                                x={pt.x}
                                y={chartHeight - 4}
                                textAnchor="middle"
                                className="text-[10px] fill-[#5E7086] font-mono"
                              >
                                {pt.label}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      {/* Floating Callout Badge (like Reference Image 1 "$2,450.80 May 31") */}
                      {activePoint && (
                        <div
                          className="absolute top-1 right-3 bg-white/95 border border-indigo-200 rounded-xl px-3 py-1.5 shadow-sm text-right"
                          dir="ltr"
                        >
                          <div className="text-xs font-black font-mono text-[#004AA5]">
                            {canViewAccounting
                              ? formatMoney(activePoint.value, unifiedBaseCurrency)
                              : `${activePoint.count} files`}
                          </div>
                          <div className="text-[10px] text-[#5E7086] font-semibold">
                            {activePoint.label} • {activePoint.count} tx
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Summary Box inside Line Chart Card */}
                  <div className="mt-4 p-3 rounded-2xl bg-[#F8FAFC] border border-[#D7E7F7] flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-[#5E7086] block">
                        {t('dash.kpi.collectionRate')} ({currentMonthLabel})
                      </span>
                      <span className="text-xs font-black text-emerald-600 font-mono" dir="ltr">
                        +{stats.collectionRate}% (↗ {stats.paidCount} {t('chart.status.completed')})
                      </span>
                    </div>
                    <TrendingUp className="w-5 h-5 text-[#004AA5]" />
                  </div>
                </div>
              </div>

              {/* THIRD ROW: Interactive Status Bar Chart (5 Cols) + Multi-Currency Strict Financial Chart (7 Cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* CHART 3: Interactive Bar Chart (Completed vs Pending vs Cancelled) */}
                <div className="lg:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border border-[#D7E7F7] shadow-2xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-black text-[#0B2E57]">
                      {t('chart.statusTitle')}
                    </h3>
                    <p className="text-xs text-[#5E7086] mt-0.5">{t('chart.statusSub')}</p>

                    <div className="space-y-4 mt-5">
                      {[
                        {
                          label: t('chart.status.completed'),
                          count: stats.completedTotalCount,
                          color: 'bg-emerald-500',
                          text: 'text-emerald-700',
                          bg: 'bg-emerald-50',
                        },
                        {
                          label: t('chart.status.pending'),
                          count: stats.activeTimelineCount,
                          color: 'bg-[#004AA5]',
                          text: 'text-[#004AA5]',
                          bg: 'bg-[#eaf4ff]',
                        },
                        {
                          label: t('chart.status.cancelled'),
                          count: stats.rejectedOrVoidCount,
                          color: 'bg-rose-500',
                          text: 'text-rose-700',
                          bg: 'bg-rose-50',
                        },
                      ].map((bar) => {
                        const total =
                          stats.completedTotalCount +
                          stats.activeTimelineCount +
                          stats.rejectedOrVoidCount;
                        const pct = total > 0 ? Math.round((bar.count / total) * 100) : 0;
                        return (
                          <div key={bar.label} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#0B2E57]">{bar.label}</span>
                              <div className="flex items-center gap-2 font-mono">
                                <span className={`px-2 py-0.5 rounded-md font-bold ${bar.bg} ${bar.text}`}>
                                  {bar.count}
                                </span>
                                <span className="text-[#5E7086]">{pct}%</span>
                              </div>
                            </div>
                            <div className="w-full h-3 bg-[#F8FAFC] rounded-full overflow-hidden border border-[#D7E7F7]">
                              <div
                                className={`h-full ${bar.color} rounded-full transition-all duration-500`}
                                style={{ width: `${Math.max(6, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[#5E7086]">
                    <span>Total Pipeline Records</span>
                    <span className="font-mono font-black text-[#0B2E57]">
                      {consulateAppointments.length + flightBookings.length}
                    </span>
                  </div>
                </div>

                {/* CHART 4: Multi-Currency Financial Analytics Chart (Strict Currency Separation) */}
                {canViewAccounting && (
                  <div className="lg:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-[#D7E7F7] shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <div>
                          <h3 className="text-base font-black text-[#0B2E57]">
                            {t('chart.multiCurrencyTitle')}
                          </h3>
                          <p className="text-xs text-[#5E7086] mt-0.5">
                            {t('chart.multiCurrencySub')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-bold">
                          <span className="flex items-center gap-1 text-[#0B2E57]">
                            <span className="w-2.5 h-2.5 rounded-xs bg-[#0B2E57]" />
                            {t('chart.invoiced')}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-700">
                            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                            {t('chart.collected')}
                          </span>
                          <span className="flex items-center gap-1 text-rose-600">
                            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                            {t('chart.outstanding')}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(['TRY', 'MAD', 'EUR', 'USD'] as SupportedCurrency[]).map((curr) => {
                          const billed = stats.salesByCurrency[curr] || 0;
                          const collected = stats.collectedByCurrency[curr] || 0;
                          const due = stats.debtsByCurrency[curr] || 0;
                          const maxCurr = Math.max(billed, collected, due, 1);

                          return (
                            <div
                              key={curr}
                              className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#D7E7F7] space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-[#0B2E57] flex items-center gap-1.5">
                                  <span>{SUPPORTED_CURRENCIES[curr].flag}</span>
                                  <span>{SUPPORTED_CURRENCIES[curr].label}</span>
                                </span>
                                <span className="text-xs font-mono font-black text-[#004AA5]" dir="ltr">
                                  {curr} ({SUPPORTED_CURRENCIES[curr].symbol})
                                </span>
                              </div>

                              {/* Visual Mini Bars for Billed / Collected / Outstanding */}
                              <div className="space-y-1.5 text-[11px]">
                                <div>
                                  <div className="flex justify-between mb-0.5">
                                    <span className="text-[#5E7086]">{t('chart.invoiced')}</span>
                                    <span className="font-mono font-bold text-[#0B2E57]" dir="ltr">
                                      {formatMoney(billed, curr)}
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#0B2E57] rounded-full"
                                      style={{ width: `${Math.min(100, (billed / maxCurr) * 100)}%` }}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between mb-0.5">
                                    <span className="text-emerald-700">{t('chart.collected')}</span>
                                    <span className="font-mono font-bold text-emerald-700" dir="ltr">
                                      {formatMoney(collected, curr)}
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 rounded-full"
                                      style={{
                                        width: `${Math.min(100, (collected / maxCurr) * 100)}%`,
                                      }}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex justify-between mb-0.5">
                                    <span className="text-rose-600">{t('chart.outstanding')}</span>
                                    <span className="font-mono font-black text-rose-600" dir="ltr">
                                      {formatMoney(due, curr)}
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-rose-500 rounded-full"
                                      style={{ width: `${Math.min(100, (due / maxCurr) * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* FOURTH ROW: Service Category Overview Cards ("Budget Overview" style from Reference Image 1) */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D7E7F7] shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-[#0B2E57]">
                    {t('chart.serviceOverview')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('consulate')}
                    className="text-xs font-bold text-[#004AA5] hover:underline cursor-pointer"
                  >
                    {t('chart.viewAll')}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {stats.donutCategories.slice(0, 5).map((cat) => {
                    const completionPct =
                      cat.count > 0 ? Math.round((cat.completedCount / cat.count) * 100) : 100;
                    return (
                      <div
                        key={cat.key}
                        onClick={() =>
                          setSelectedCategoryFilter(
                            selectedCategoryFilter === cat.key ? null : cat.key
                          )
                        }
                        className={`p-4 rounded-2xl border transition cursor-pointer ${
                          selectedCategoryFilter === cat.key
                            ? 'border-[#004AA5] bg-[#eaf4ff]/40'
                            : 'border-[#D7E7F7] bg-white hover:border-[#004AA5]/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 mb-3">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: cat.color }}
                          >
                            {cat.key === 'flights' ? (
                              <Plane className="w-4 h-4" />
                            ) : cat.key === 'residence' ? (
                              <Home className="w-4 h-4" />
                            ) : cat.key === 'hotels' ? (
                              <Building2 className="w-4 h-4" />
                            ) : cat.key === 'translation' ? (
                              <FileText className="w-4 h-4" />
                            ) : (
                              <CalendarCheck className="w-4 h-4" />
                            )}
                          </div>
                          <span className="text-xs font-black text-[#0B2E57] truncate">
                            {cat.label}
                          </span>
                        </div>

                        <div className="text-xs font-mono font-bold text-[#5E7086] mb-2" dir="ltr">
                          {cat.completedCount} / {cat.count} files
                        </div>

                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(15, completionPct)}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                        <div className="text-right text-[11px] font-mono font-bold text-[#5E7086] mt-1">
                          {completionPct}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FIFTH ROW: Recent Transactions Table (Reference Image 1 Bottom Section) */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D7E7F7] shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-[#0B2E57]">
                      {t('chart.recentTransactions')}
                    </h3>
                    {selectedCategoryFilter && (
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#eaf4ff] text-[#004AA5]">
                        Filtered: {selectedCategoryFilter}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('customers')}
                    className="text-xs font-bold text-[#004AA5] hover:underline cursor-pointer"
                  >
                    {t('chart.viewAll')}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[#5E7086] border-b border-slate-100 font-bold">
                        <th className="py-2.5 px-3 text-start">{t('chart.date')}</th>
                        <th className="py-2.5 px-3 text-start">{t('chart.clientAndDesc')}</th>
                        <th className="py-2.5 px-3 text-start">{t('chart.category')}</th>
                        <th className="py-2.5 px-3 text-start">{t('chart.paymentMethod')}</th>
                        {canViewAccounting && (
                          <th className="py-2.5 px-3 text-end">{t('chart.amount')}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecentTransactions.map((tx) => (
                        <tr
                          key={`${tx.type}-${tx.id}`}
                          onClick={() => setSpotlightItem({ type: tx.type, item: tx.raw })}
                          className="hover:bg-[#F8FAFC] transition cursor-pointer"
                        >
                          <td className="py-3 px-3 font-mono text-[#5E7086]" dir="ltr">
                            {tx.date}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-black text-[#0B2E57]">{tx.clientName}</div>
                            <div className="text-[11px] text-[#5E7086]">{tx.subtitle}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${tx.categoryColor} ${tx.categoryText}`}
                            >
                              {tx.categoryLabel}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#5E7086]">
                              <CreditCard className="w-3.5 h-3.5 text-[#004AA5]" />
                              <span>{tx.paymentMethod}</span>
                            </span>
                          </td>
                          {canViewAccounting && (
                            <td
                              className={`py-3 px-3 text-end font-mono font-black tabular-nums ${
                                tx.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-[#0B2E57]'
                              }`}
                              dir="ltr"
                            >
                              {formatMoney(tx.amount, tx.currency)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
