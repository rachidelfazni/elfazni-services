import {
  ConsulateAppointment,
  CreditNote,
  CustomerProfileSummary,
  DocumentSettings,
  FlightBooking,
  Invoice,
  InvoiceLineItem,
  InvoicePayment,
  InvoiceStatus,
  SUPPORTED_CURRENCIES,
  SupportedCurrency,
} from '../types';
import { BRAND_CONFIG } from '../config/brandConfig';

/**
 * Convert major currency amount (e.g. 3200 or 145.50) to integer minor units (e.g. 320000 or 14550).
 * Uses Math.round to eliminate binary floating-point inaccuracy.
 */
export const toMinorUnits = (majorAmount: number): number => {
  if (!Number.isFinite(majorAmount)) return 0;
  return Math.round(majorAmount * 100);
};

/**
 * Convert integer minor units back to major decimal number for display.
 */
export const fromMinorUnits = (minorAmount: number): number => {
  if (!Number.isFinite(minorAmount)) return 0;
  return Math.round(minorAmount) / 100;
};

/**
 * Format integer minor units with currency symbol and Bidi-safe numeric formatting.
 */
export const formatMinorMoney = (
  minorAmount: number,
  currency: SupportedCurrency = 'TRY',
  showDecimals: boolean = false
): string => {
  const major = fromMinorUnits(minorAmount);
  const hasCents = Math.abs(major % 1) > 0.001;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: showDecimals || hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(major);

  const currConfig = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.TRY;
  const symbol = currency === 'MAD' && typeof document !== 'undefined' && document.documentElement.lang !== 'ar' ? 'MAD' : currConfig.symbol;
  return `${formatted} ${symbol}`;
};

/**
 * Canonical customer ID generator from name + phone to ensure strict per-customer isolation.
 */
export const getCustomerKey = (clientName: string, phoneNumber?: string): string => {
  const cleanName = (clientName || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const cleanPhone = (phoneNumber || '').replace(/[^\d+]/g, '');
  if (cleanPhone.length >= 6) {
    return `cust_${cleanPhone}`;
  }
  return `cust_${cleanName}`;
};

/**
 * Default verified DocumentSettings derived strictly from BRAND_CONFIG.
 * Never invents tax IDs, trade registry numbers, or unverified addresses.
 */
export const DEFAULT_DOCUMENT_SETTINGS: DocumentSettings = {
  tradingNameAr: BRAND_CONFIG.nameArabic || 'الفزني سيرفيسز',
  tradingNameEn: BRAND_CONFIG.name || 'ELFAZNI SERVICES',
  legalEntityName: BRAND_CONFIG.nameArabicAlt || 'الفزني للخدمات',
  headquartersAr: BRAND_CONFIG.headquarters || 'إسطنبول',
  phone: BRAND_CONFIG.phone || '+905522677851',
  email: BRAND_CONFIG.email || 'rachidelfazni@gmail.com',
  website: BRAND_CONFIG.websiteUrl || 'https://elfazni.com',
  taxId: '',
  tradeRegistryNo: '',
  defaultDocumentClassification: 'invoice',
  defaultTaxRate: 0,
  invoicePrefix: 'INV',
  nextSequenceNumber: 1004,
  logoVariant: 'horizontal',
  showDigitalStamp: true,
  digitalStampPosition: 'signature',
  showBankAccountsOnInvoices: true,
  bankAccountHolder: BRAND_CONFIG.bankAccounts.accountHolder || 'RACHID EL FAZNI',
  ibanTRY: BRAND_CONFIG.bankAccounts.ibanTRY || 'TR490020500009720667500001',
  ibanUSD: BRAND_CONFIG.bankAccounts.ibanUSD || 'TR490020500009720667500101',
  footerDisclaimerAr:
    'مؤسسة الفزني للخدمات (الفزني سيرفيسز) — مكتب خدمات إدارية وتسيير مواعيد وحجوزات مستقل غير تابع لأي جهة حكومية. هذه الوثيقة صادرة إلكترونياً من النظام المحاسبي المعتمد.',
  footerDisclaimerEn:
    'ELFAZNI SERVICES — Independent administrative & travel services agency. Generated from the official accounting ledger.',
};

/**
 * Calculate a single invoice line item using integer minor units.
 * Rule: line_before_tax = quantity * unit_price_minor - discount_minor
 *       tax_minor = round(line_before_tax * tax_rate)
 *       total_minor = line_before_tax + tax_minor
 */
export const calculateInvoiceLine = (
  line: Pick<
    InvoiceLineItem,
    'id' | 'invoiceId' | 'labelAr' | 'labelEn' | 'quantity' | 'unitPriceMinor' | 'discountMinor' | 'taxRate' | 'sortOrder' | 'sourceTransactionId' | 'sourceType' | 'serviceReference'
  >
): InvoiceLineItem => {
  const qty = Math.max(1, Math.round(Number(line.quantity) || 1));
  const unitMinor = Math.max(0, Math.round(Number(line.unitPriceMinor) || 0));
  const rawGrossMinor = qty * unitMinor;
  const discountMinor = Math.min(rawGrossMinor, Math.max(0, Math.round(Number(line.discountMinor) || 0)));
  const lineBeforeTaxMinor = Math.max(0, rawGrossMinor - discountMinor);
  const rate = Math.max(0, Number(line.taxRate) || 0);
  const taxMinor = Math.round(lineBeforeTaxMinor * rate);
  const totalMinor = lineBeforeTaxMinor + taxMinor;

  return {
    ...line,
    quantity: qty,
    unitPriceMinor: unitMinor,
    discountMinor,
    taxRate: rate,
    taxMinor,
    totalMinor,
  };
};

/**
 * Calculate canonical invoice totals, payments, credit notes, balance due, and status.
 */
export const recalculateInvoiceTotals = (
  lines: InvoiceLineItem[],
  payments: InvoicePayment[],
  creditNotes: CreditNote[],
  documentDiscountMinor: number = 0,
  currentStatus: InvoiceStatus = 'draft'
): {
  computedLines: InvoiceLineItem[];
  subtotalMinor: number;
  discountTotalMinor: number;
  taxTotalMinor: number;
  totalMinor: number;
  paidMinor: number;
  creditedMinor: number;
  balanceDueMinor: number;
  status: InvoiceStatus;
} => {
  const computedLines = lines.map((l, idx) =>
    calculateInvoiceLine({
      ...l,
      sortOrder: idx + 1,
    })
  );

  let subtotalMinor = 0; // Sum of line_before_tax
  let lineDiscountsSumMinor = 0;
  let taxTotalMinor = 0;
  let linesGrandSumMinor = 0;

  computedLines.forEach((l) => {
    const gross = l.quantity * l.unitPriceMinor;
    const beforeTax = Math.max(0, gross - l.discountMinor);
    subtotalMinor += beforeTax;
    lineDiscountsSumMinor += l.discountMinor;
    taxTotalMinor += l.taxMinor;
    linesGrandSumMinor += l.totalMinor;
  });

  const validDocDiscountMinor = Math.min(
    linesGrandSumMinor,
    Math.max(0, Math.round(Number(documentDiscountMinor) || 0))
  );
  const discountTotalMinor = lineDiscountsSumMinor + validDocDiscountMinor;
  const totalMinor = Math.max(0, linesGrandSumMinor - validDocDiscountMinor);

  const paidMinor = payments
    .filter((p) => p.status === 'cleared')
    .reduce((acc, p) => acc + Math.max(0, Math.round(p.amountMinor)), 0);

  const creditedMinor = creditNotes
    .filter((cn) => cn.status === 'applied')
    .reduce((acc, cn) => acc + Math.max(0, Math.round(cn.amountMinor)), 0);

  const balanceDueMinor = Math.max(0, totalMinor - paidMinor - creditedMinor);

  let status: InvoiceStatus = currentStatus;
  if (currentStatus !== 'void' && currentStatus !== 'draft') {
    if (balanceDueMinor === 0 && totalMinor > 0) {
      status = 'paid';
    } else if (paidMinor > 0 || creditedMinor > 0) {
      status = 'partially_paid';
    } else {
      status = 'issued';
    }
  }

  return {
    computedLines,
    subtotalMinor,
    discountTotalMinor,
    taxTotalMinor,
    totalMinor,
    paidMinor,
    creditedMinor,
    balanceDueMinor,
    status,
  };
};

/**
 * Returns a Map of sourceTransactionId -> invoiceNumber for all non-void invoices
 * so that no transaction can be billed twice.
 */
export const getInvoicedTransactionsMap = (invoices: Invoice[]): Map<string, string> => {
  const map = new Map<string, string>();
  invoices.forEach((inv) => {
    if (inv.status === 'void') return;
    inv.lines.forEach((line) => {
      if (line.sourceTransactionId) {
        map.set(line.sourceTransactionId, inv.invoiceNumber);
      }
    });
  });
  return map;
};

/**
 * Build aggregated Customer Profiles from existing Consulate Appointments, Flight Bookings, and Invoices.
 */
export const buildCustomerProfiles = (
  consulateAppointments: ConsulateAppointment[],
  flightBookings: FlightBooking[],
  invoices: Invoice[]
): CustomerProfileSummary[] => {
  const map = new Map<string, CustomerProfileSummary>();

  const ensureCustomer = (name: string, phone: string, explicitId?: string): CustomerProfileSummary => {
    const key = explicitId || getCustomerKey(name, phone);
    const existing = map.get(key);
    if (existing) {
      if (!existing.phoneNumber && phone) existing.phoneNumber = phone;
      return existing;
    }
    const created: CustomerProfileSummary = {
      customerId: key,
      clientName: name.trim(),
      phoneNumber: phone.trim(),
      consulateRecords: [],
      flightRecords: [],
      invoices: [],
      currencies: [],
      totalsByCurrency: {
        TRY: { billedMinor: 0, paidMinor: 0, creditedMinor: 0, outstandingMinor: 0 },
        MAD: { billedMinor: 0, paidMinor: 0, creditedMinor: 0, outstandingMinor: 0 },
        EUR: { billedMinor: 0, paidMinor: 0, creditedMinor: 0, outstandingMinor: 0 },
        USD: { billedMinor: 0, paidMinor: 0, creditedMinor: 0, outstandingMinor: 0 },
      },
    };
    map.set(key, created);
    return created;
  };

  consulateAppointments.forEach((c) => {
    const cust = ensureCustomer(c.clientName, c.phoneNumber);
    cust.consulateRecords.push(c);
  });

  flightBookings.forEach((f) => {
    const cust = ensureCustomer(f.clientName, f.phoneNumber);
    cust.flightRecords.push(f);
  });

  invoices.forEach((inv) => {
    const cust = ensureCustomer(inv.customerName, inv.customerPhone, inv.customerId);
    cust.invoices.push(inv);
  });

  const invoicedTxMap = getInvoicedTransactionsMap(invoices);

  map.forEach((cust) => {
    const activeCurrencies = new Set<SupportedCurrency>();

    // 1. Add non-void issued/paid/partially_paid invoices to customer totals
    cust.invoices.forEach((inv) => {
      if (inv.status === 'void' || inv.status === 'draft') return;
      activeCurrencies.add(inv.currency);
      const bucket = cust.totalsByCurrency[inv.currency];
      bucket.billedMinor += inv.totalMinor;
      bucket.paidMinor += inv.paidMinor;
      bucket.creditedMinor += inv.creditedMinor;
      bucket.outstandingMinor += inv.balanceDueMinor;
    });

    // 2. Add uninvoiced Consulate records so existing CRM transactions are reflected accurately
    cust.consulateRecords.forEach((c) => {
      if (invoicedTxMap.has(c.id)) return; // Already counted in an official invoice
      activeCurrencies.add(c.currency);
      const bucket = cust.totalsByCurrency[c.currency];
      const priceMinor = toMinorUnits(c.price);
      const paidMinor = toMinorUnits(c.paidAmount);
      const remMinor = Math.max(0, priceMinor - paidMinor);
      bucket.billedMinor += priceMinor;
      bucket.paidMinor += paidMinor;
      bucket.outstandingMinor += remMinor;
    });

    // 3. Add uninvoiced Flight records
    cust.flightRecords.forEach((f) => {
      if (invoicedTxMap.has(f.id)) return; // Already counted in an official invoice
      activeCurrencies.add(f.currency);
      const bucket = cust.totalsByCurrency[f.currency];
      const priceMinor = toMinorUnits(f.sellingPrice);
      const paidMinor = toMinorUnits(f.paidAmount);
      const remMinor = Math.max(0, priceMinor - paidMinor);
      bucket.billedMinor += priceMinor;
      bucket.paidMinor += paidMinor;
      bucket.outstandingMinor += remMinor;
    });

    cust.currencies = Array.from(activeCurrencies);
  });

  return Array.from(map.values()).sort((a, b) => a.clientName.localeCompare(b.clientName, 'ar'));
};

export interface StatementLedgerEntry {
  id: string;
  date: string; // YYYY-MM-DD
  referenceNumber: string;
  entryType: 'invoice' | 'uninvoiced_service' | 'payment' | 'credit_note';
  entryTypeLabelAr: string;
  description: string;
  currency: SupportedCurrency;
  debitMinor: number; // Charges / Invoices
  creditMinor: number; // Payments / Credit Notes
  runningBalanceMinor: number;
  statusLabelAr: string;
}

export interface CustomerStatementResult {
  customer: CustomerProfileSummary;
  currency: SupportedCurrency;
  fromDate: string;
  toDate: string;
  openingBalanceMinor: number;
  periodDebitMinor: number;
  periodCreditMinor: number;
  closingBalanceMinor: number;
  entries: StatementLedgerEntry[];
}

/**
 * Builds a complete, chronologically ordered Customer Account Statement (كشف حساب عميل)
 * for a single customer and currency, with accurate Opening Balance, Running Balance, and Closing Balance.
 */
export const buildCustomerStatement = (
  customer: CustomerProfileSummary,
  currency: SupportedCurrency,
  options: {
    fromDate?: string; // YYYY-MM-DD or ''
    toDate?: string; // YYYY-MM-DD or ''
    includeInvoices?: boolean;
    includeUninvoicedServices?: boolean;
    includePayments?: boolean;
    includeCredits?: boolean;
  } = {}
): CustomerStatementResult => {
  const {
    fromDate = '',
    toDate = '',
    includeInvoices = true,
    includeUninvoicedServices = true,
    includePayments = true,
    includeCredits = true,
  } = options;

  const invoicedTxMap = getInvoicedTransactionsMap(customer.invoices);
  const rawMovements: Omit<StatementLedgerEntry, 'runningBalanceMinor'>[] = [];

  // 1. Issued Invoices & their Payments & Credit Notes
  customer.invoices.forEach((inv) => {
    if (inv.currency !== currency) return;
    if (inv.status === 'void' || inv.status === 'draft') return;

    if (includeInvoices) {
      const lineSummary = inv.lines.map((l) => l.labelAr).join(' + ');
      rawMovements.push({
        id: `stmt-inv-${inv.id}`,
        date: inv.issueDate,
        referenceNumber: inv.invoiceNumber,
        entryType: 'invoice',
        entryTypeLabelAr:
          inv.documentClassification === 'pro_forma'
            ? 'فاتورة أولية'
            : inv.documentClassification === 'payment_receipt'
            ? 'إيصال فوترة'
            : 'فاتورة رسمية',
        description: lineSummary || 'خدمات الفزني سيرفيسز',
        currency,
        debitMinor: inv.totalMinor,
        creditMinor: 0,
        statusLabelAr:
          inv.status === 'paid'
            ? 'مدفوعة'
            : inv.status === 'partially_paid'
            ? 'مدفوعة جزئياً'
            : 'صادرة',
      });
    }

    if (includePayments) {
      inv.payments
        .filter((p) => p.status === 'cleared')
        .forEach((pay) => {
          rawMovements.push({
            id: `stmt-pay-${pay.id}`,
            date: pay.receivedAt,
            referenceNumber: pay.externalReference || `PAY-${inv.invoiceNumber}`,
            entryType: 'payment',
            entryTypeLabelAr: 'دفعة مسددة',
            description: `سداد على فاتورة ${inv.invoiceNumber} (${pay.method})`,
            currency,
            debitMinor: 0,
            creditMinor: pay.amountMinor,
            statusLabelAr: 'مقبوضة',
          });
        });
    }

    if (includeCredits) {
      inv.creditNotes
        .filter((cn) => cn.status === 'applied')
        .forEach((cn) => {
          rawMovements.push({
            id: `stmt-cn-${cn.id}`,
            date: cn.issuedAt,
            referenceNumber: cn.referenceNumber,
            entryType: 'credit_note',
            entryTypeLabelAr: 'إشعار دائن / تسوية',
            description: `إشعار دائن على ${inv.invoiceNumber}: ${cn.reason}`,
            currency,
            debitMinor: 0,
            creditMinor: cn.amountMinor,
            statusLabelAr: 'مطبق',
          });
        });
    }
  });

  // 2. Uninvoiced Consulate Appointments & their recorded payments
  if (includeUninvoicedServices) {
    customer.consulateRecords.forEach((c) => {
      if (c.currency !== currency) return;
      if (invoicedTxMap.has(c.id)) return; // Already represented by an official invoice

      const priceMinor = toMinorUnits(c.price);
      const paidMinor = toMinorUnits(c.paidAmount);
      const serviceTitle =
        c.appointmentType === 'أخرى' && c.customAppointmentType
          ? c.customAppointmentType
          : c.appointmentType;

      rawMovements.push({
        id: `stmt-cons-${c.id}`,
        date: c.submissionDate,
        referenceNumber: c.id.toUpperCase(),
        entryType: 'uninvoiced_service',
        entryTypeLabelAr: 'معاملة قنصلية',
        description: `موعد قنصلية: ${serviceTitle}`,
        currency,
        debitMinor: priceMinor,
        creditMinor: 0,
        statusLabelAr:
          c.paymentStatus === 'paid'
            ? 'مدفوع'
            : c.paymentStatus === 'partial'
            ? 'جزئي'
            : 'غير مدفوع',
      });

      if (includePayments && paidMinor > 0) {
        rawMovements.push({
          id: `stmt-conspay-${c.id}`,
          date: c.submissionDate,
          referenceNumber: `REC-${c.id.toUpperCase()}`,
          entryType: 'payment',
          entryTypeLabelAr: 'دفعة مستلمة',
          description: `دفعة مسددة لمعاملة القنصلية (${serviceTitle})`,
          currency,
          debitMinor: 0,
          creditMinor: paidMinor,
          statusLabelAr: 'مقبوضة',
        });
      }
    });

    // 3. Uninvoiced Flight Bookings & their recorded payments
    customer.flightRecords.forEach((f) => {
      if (f.currency !== currency) return;
      if (invoicedTxMap.has(f.id)) return;

      const priceMinor = toMinorUnits(f.sellingPrice);
      const paidMinor = toMinorUnits(f.paidAmount);

      rawMovements.push({
        id: `stmt-flt-${f.id}`,
        date: f.bookingDate,
        referenceNumber: f.pnr || f.id.toUpperCase(),
        entryType: 'uninvoiced_service',
        entryTypeLabelAr: 'حجز طيران',
        description: `تذكرة طيران (${f.pnr}): ${f.airlineAndRoute}`,
        currency,
        debitMinor: priceMinor,
        creditMinor: 0,
        statusLabelAr:
          f.paymentStatus === 'paid'
            ? 'مدفوع'
            : f.paymentStatus === 'partial'
            ? 'جزئي'
            : 'غير مدفوع',
      });

      if (includePayments && paidMinor > 0) {
        rawMovements.push({
          id: `stmt-fltpay-${f.id}`,
          date: f.bookingDate,
          referenceNumber: `REC-${f.pnr || f.id.toUpperCase()}`,
          entryType: 'payment',
          entryTypeLabelAr: 'دفعة مستلمة',
          description: `دفعة مسددة لتذكرة الطيران PNR: ${f.pnr} (${f.paymentMethod})`,
          currency,
          debitMinor: 0,
          creditMinor: paidMinor,
          statusLabelAr: 'مقبوضة',
        });
      }
    });
  }

  // Sort chronologically by date, with charges (debits) before payments (credits) on the same date
  rawMovements.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.debitMinor > 0 && b.debitMinor === 0) return -1;
    if (a.debitMinor === 0 && b.debitMinor > 0) return 1;
    return a.id.localeCompare(b.id);
  });

  // Compute Opening Balance from movements strictly before fromDate
  let openingBalanceMinor = 0;
  const inRangeMovements: Omit<StatementLedgerEntry, 'runningBalanceMinor'>[] = [];

  rawMovements.forEach((m) => {
    if (fromDate && m.date < fromDate) {
      openingBalanceMinor += m.debitMinor - m.creditMinor;
      return;
    }
    if (toDate && m.date > toDate) {
      return;
    }
    inRangeMovements.push(m);
  });

  let runningBalanceMinor = openingBalanceMinor;
  let periodDebitMinor = 0;
  let periodCreditMinor = 0;

  const entries: StatementLedgerEntry[] = inRangeMovements.map((m) => {
    periodDebitMinor += m.debitMinor;
    periodCreditMinor += m.creditMinor;
    runningBalanceMinor += m.debitMinor - m.creditMinor;
    return {
      ...m,
      runningBalanceMinor,
    };
  });

  const closingBalanceMinor = openingBalanceMinor + periodDebitMinor - periodCreditMinor;

  return {
    customer,
    currency,
    fromDate,
    toDate,
    openingBalanceMinor,
    periodDebitMinor,
    periodCreditMinor,
    closingBalanceMinor,
    entries,
  };
};
