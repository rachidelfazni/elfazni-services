import { useCrmPersistence } from '../components/CrmStorage';
import { LoadedCrm } from '../services/crmClient';
import { validSnapshot } from '../services/crmSnapshot';
import { ContactBook, CRMContact } from "../types/contactBook";
import { emptyContactBook, validContactBook } from "../utils/contactBook";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import {
  ConsulateAppointment,
  FlightBooking,
  DebtItem,
  ActiveTab,
  TimelineStage,
  ConsulateResponse,
  PaymentStatus,
  SupportedCurrency,
  ExchangeRates,
  FlagColor,
  ItemReminder,
  SystemLists,
  Invoice,
  InvoiceLineItem,
  InvoicePayment,
  CreditNote,
  DocumentSettings,
  DocumentClassification,
  CustomerProfileSummary,
} from "../types";
import {
  initialConsulateAppointments,
  initialFlightBookings,
  initialSystemLists,
  initialInvoices,
} from "../data/mockData";
import {
  DEFAULT_EXCHANGE_RATES,
  convertCurrency,
  playNotificationChime,
} from "../utils/formatters";
import {
  DEFAULT_DOCUMENT_SETTINGS,
  buildCustomerProfiles,
  getCustomerKey,
  getInvoicedTransactionsMap,
  recalculateInvoiceTotals,
  toMinorUnits,
  fromMinorUnits,
} from "../utils/invoiceCalculations";

export type InvoiceSubView =
  | "invoices_list"
  | "invoice_editor"
  | "invoice_detail"
  | "customer_statement"
  | "customers_directory"
  | "all_accounts_report";

export interface PrintPreviewTarget {
  type:
    | "invoice"
    | "payment_receipt"
    | "statement"
    | "all_accounts_report"
    | "outstanding_balances_report"
    | "periodic_payment_report";
  invoiceId?: string;
  customerId?: string;
  currency?: SupportedCurrency;
  fromDate?: string;
  toDate?: string;
  isCopy?: boolean;
  isDemoMode?: boolean;
}

interface AppContextType {
  bookingContact: CRMContact | null;
  setBookingContact: (contact: CRMContact | null) => void;
  contactBook: ContactBook;
  setContactBook: React.Dispatch<React.SetStateAction<ContactBook>>;
  contactBookStorageError: boolean;
  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  consulateAppointments: ConsulateAppointment[];
  flightBookings: FlightBooking[];
  activeTimelineAppointments: ConsulateAppointment[];
  archivedAppointments: ConsulateAppointment[];
  debts: DebtItem[];
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;

  // Multi-Currency & Settlement
  exchangeRates: ExchangeRates;
  setExchangeRates: (rates: ExchangeRates) => void;
  unifiedBaseCurrency: SupportedCurrency;
  setUnifiedBaseCurrency: (curr: SupportedCurrency) => void;
  isUnifiedViewEnabled: boolean;
  setIsUnifiedViewEnabled: (val: boolean) => void;

  // Consulate actions
  addConsulateAppointment: (
    item: Omit<
      ConsulateAppointment,
      "id" | "createdAt" | "updatedAt" | "remainingAmount" | "paymentStatus"
    >,
  ) => void;
  updateConsulateAppointment: (
    id: string,
    updates: Partial<ConsulateAppointment>,
  ) => void;
  inlineUpdateConsulate: (
    id: string,
    field: keyof ConsulateAppointment,
    value: any,
  ) => void;
  deleteConsulateAppointment: (id: string) => void;
  duplicateConsulateAppointment: (id: string) => void;
  moveTimelineStage: (id: string, newStage: TimelineStage) => void;
  reorderTimelineAppointment: (
    sourceId: string,
    targetStage: TimelineStage,
    targetIndex?: number,
  ) => void;
  updateConsulateResponse: (
    id: string,
    response: ConsulateResponse,
    notes?: string,
  ) => void;
  settleConsulatePayment: (
    id: string,
    paidAmount?: number,
    paidCurrency?: SupportedCurrency,
  ) => void;

  // Flight actions
  addFlightBooking: (
    item: Omit<
      FlightBooking,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "netProfit"
      | "remainingAmount"
      | "paymentStatus"
    >,
  ) => void;
  updateFlightBooking: (id: string, updates: Partial<FlightBooking>) => void;
  inlineUpdateFlight: (
    id: string,
    field: keyof FlightBooking,
    value: any,
  ) => void;
  deleteFlightBooking: (id: string) => void;
  duplicateFlightBooking: (id: string) => void;
  settleFlightPayment: (
    id: string,
    paidAmount?: number,
    paidCurrency?: SupportedCurrency,
  ) => void;

  // Debt action
  settleDebt: (
    type: "consulate" | "flight",
    recordId: string,
    paidAmount?: number,
    paidCurrency?: SupportedCurrency,
  ) => void;

  // Flags & Pin
  setItemFlag: (
    type: "consulate" | "flight",
    id: string,
    flag: FlagColor,
  ) => void;

  // Reminders
  setReminder: (
    type: "consulate" | "flight",
    recordId: string,
    reminderData: { targetDateTime: string; reason: string },
  ) => void;
  completeReminder: (type: "consulate" | "flight", recordId: string) => void;
  snoozeReminder: (
    type: "consulate" | "flight",
    recordId: string,
    minutes?: number,
  ) => void;
  dueReminders: {
    type: "consulate" | "flight";
    item: ConsulateAppointment | FlightBooking;
    reminder: ItemReminder;
  }[];

  // Timeline UI States
  timelineViewMode: "expanded" | "compact";
  setTimelineViewMode: (mode: "expanded" | "compact") => void;
  showFlaggedOnly: boolean;
  setShowFlaggedOnly: (val: boolean) => void;
  quickAddStage: TimelineStage | null;
  setQuickAddStage: (stage: TimelineStage | null) => void;

  // Spotlight Modal
  spotlightItem: {
    type: "consulate" | "flight";
    item: ConsulateAppointment | FlightBooking;
  } | null;
  setSpotlightItem: (
    item: {
      type: "consulate" | "flight";
      item: ConsulateAppointment | FlightBooking;
    } | null,
  ) => void;

  // Reminder Modal
  reminderModalTarget: {
    type: "consulate" | "flight";
    id: string;
    clientName: string;
    currentReminder?: ItemReminder;
  } | null;
  setReminderModalTarget: (
    target: {
      type: "consulate" | "flight";
      id: string;
      clientName: string;
      currentReminder?: ItemReminder;
    } | null,
  ) => void;

  // Modals state helper
  editingConsulate: ConsulateAppointment | null;
  setEditingConsulate: (item: ConsulateAppointment | null) => void;
  isConsulateModalOpen: boolean;
  setIsConsulateModalOpen: (open: boolean) => void;
  presetServiceType: string | null;
  setPresetServiceType: (serviceType: string | null) => void;
  showExtraServicesInMenu: boolean;
  setShowExtraServicesInMenu: (show: boolean) => void;

  editingFlight: FlightBooking | null;
  setEditingFlight: (item: FlightBooking | null) => void;
  isFlightModalOpen: boolean;
  setIsFlightModalOpen: (open: boolean) => void;

  // Invoices, Customer Statements & Print Module
  invoices: Invoice[];
  documentSettings: DocumentSettings;
  updateDocumentSettings: (updates: Partial<DocumentSettings>) => void;
  customerProfiles: CustomerProfileSummary[];
  invoicedTransactionsMap: Map<string, string>;
  invoiceSubView: InvoiceSubView;
  setInvoiceSubView: (view: InvoiceSubView) => void;
  activeInvoiceId: string | null;
  setActiveInvoiceId: (id: string | null) => void;
  selectedCustomerIdForStatement: string | null;
  setSelectedCustomerIdForStatement: (customerId: string | null) => void;
  preselectedTransactionsForInvoice: {
    type: "consulate" | "flight";
    id: string;
  }[];
  setPreselectedTransactionsForInvoice: (
    items: { type: "consulate" | "flight"; id: string }[],
  ) => void;
  printPreviewTarget: PrintPreviewTarget | null;
  setPrintPreviewTarget: (target: PrintPreviewTarget | null) => void;

  createOrSaveInvoice: (payload: {
    id?: string;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    customerTaxId?: string;
    documentClassification: DocumentClassification;
    currency: SupportedCurrency;
    issueDate: string;
    serviceDate?: string;
    dueDate?: string;
    lines: Omit<
      InvoiceLineItem,
      "invoiceId" | "taxMinor" | "totalMinor" | "sortOrder"
    >[];
    documentDiscountMinor: number;
    initialPayments?: Omit<InvoicePayment, "id" | "invoiceId">[];
    notes?: string;
    issueImmediately?: boolean;
    actor: string;
    isDemoRecord?: boolean;
  }) => { success: boolean; message: string; invoice?: Invoice };

  issueDraftInvoice: (
    invoiceId: string,
    actor: string,
  ) => { success: boolean; message: string };
  recordInvoicePayment: (
    invoiceId: string,
    payment: {
      amountMinor: number;
      method: string;
      receivedAt: string;
      externalReference?: string;
      notes?: string;
    },
    actor: string,
  ) => { success: boolean; message: string };
  addInvoiceCreditNote: (
    invoiceId: string,
    creditNote: { reason: string; amountMinor: number; issuedAt: string },
    actor: string,
  ) => { success: boolean; message: string };
  voidInvoice: (
    invoiceId: string,
    reason: string,
    actor: string,
  ) => { success: boolean; message: string };
  logInvoiceAudit: (
    invoiceId: string,
    action: "printed" | "exported_pdf",
    actor: string,
    details: string,
  ) => void;
  openInvoiceCreatorFromTransactions: (
    items: { type: "consulate" | "flight"; id: string }[],
  ) => { success: boolean; message?: string };
  openCustomerStatement: (
    customerId: string,
    currency?: SupportedCurrency,
  ) => void;

  // Custom Lists
  systemLists: SystemLists;
  addCustomItem: (category: keyof SystemLists, item: string) => void;
  removeCustomItem: (category: keyof SystemLists, item: string) => void;

  // Undo delete
  lastDeletedItem: { type: "consulate" | "flight"; data: any } | null;
  undoLastDelete: () => void;
  clearUndoToast: () => void;

  // Data persistence & backup
  exportDataJSON: () => void;
  importDataJSON: (jsonStr: string) => boolean;
  resetToMockData: () => void;
  clearAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CONSULATE: "elfazni_crm_consulate_v3",
  FLIGHTS: "elfazni_crm_flight_v3",
  INVOICES: "elfazni_crm_invoices_v1",
  DOC_SETTINGS: "elfazni_crm_doc_settings_v1",
  YEAR: "elfazni_crm_year_v3",
  MONTH: "elfazni_crm_month_v3",
  RATES: "elfazni_crm_exchange_rates_v3",
  BASE_CURRENCY: "elfazni_crm_base_currency_v3",
  UNIFIED_VIEW: "elfazni_crm_unified_view_v3",
  LISTS: "elfazni_crm_system_lists_v3",
};

export const AppProvider: React.FC<{ children: React.ReactNode; initial: LoadedCrm }> = ({
  children, initial,
}) => {
  const [contactBook, setContactBook] = useState<ContactBook>(initial.data.contactBook);
  const contactBookStorageError = false;
  const [bookingContact, setBookingContact] = useState<CRMContact | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null,
  );
  const [consulateAppointments, setConsulateAppointments] = useState<ConsulateAppointment[]>(initial.data.consulateAppointments);
  const [flightBookings, setFlightBookings] = useState<FlightBooking[]>(initial.data.flightBookings);
  const [invoices, setInvoices] = useState<Invoice[]>(initial.data.invoices);
  const [documentSettings, setDocumentSettings] = useState<DocumentSettings>(initial.data.documentSettings);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(initial.data.exchangeRates);

  const [unifiedBaseCurrency, setUnifiedBaseCurrency] =
    useState<SupportedCurrency>(() => {
      const saved = localStorage.getItem(STORAGE_KEYS.BASE_CURRENCY);
      return (saved as SupportedCurrency) || "MAD";
    });

  const [isUnifiedViewEnabled, setIsUnifiedViewEnabled] = useState<boolean>(
    () => {
      return localStorage.getItem(STORAGE_KEYS.UNIFIED_VIEW) === "true";
    },
  );

  const [systemLists, setSystemLists] = useState<SystemLists>(initial.data.systemLists);
  const snapshot = useMemo(() => ({
    contactBook, consulateAppointments, flightBookings, invoices, documentSettings, exchangeRates, systemLists,
  }), [contactBook, consulateAppointments, flightBookings, invoices, documentSettings, exchangeRates, systemLists]);
  const persistence = useCrmPersistence(snapshot, initial);

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== "undefined") {
      try {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (tab && ["dashboard", "customers", "consulate", "flights", "debts", "accounting", "invoices", "tools"].includes(tab)) {
          return tab as ActiveTab;
        }
      } catch {}
    }
    return "dashboard";
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.YEAR);
    return saved ? parseInt(saved, 10) : 2026;
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MONTH);
    return saved !== null ? parseInt(saved, 10) : 11;
  });

  // Timeline UI States
  const [timelineViewMode, setTimelineViewMode] = useState<
    "expanded" | "compact"
  >("expanded");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState<boolean>(false);
  const [quickAddStage, setQuickAddStage] = useState<TimelineStage | null>(
    null,
  );

  // Modals & Popups
  const [editingConsulate, setEditingConsulate] =
    useState<ConsulateAppointment | null>(null);
  const [isConsulateModalOpen, setIsConsulateModalOpen] = useState(false);
  const [presetServiceType, setPresetServiceType] = useState<string | null>(
    null,
  );
  const [showExtraServicesInMenu, setShowExtraServicesInMenu] =
    useState<boolean>(() => {
      const saved = localStorage.getItem("elfazni_crm_show_extra_services_v1");
      return saved === null ? true : saved === "true";
    });
  const [editingFlight, setEditingFlight] = useState<FlightBooking | null>(
    null,
  );
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [spotlightItem, setSpotlightItem] = useState<{
    type: "consulate" | "flight";
    item: ConsulateAppointment | FlightBooking;
  } | null>(null);
  const [reminderModalTarget, setReminderModalTarget] = useState<{
    type: "consulate" | "flight";
    id: string;
    clientName: string;
    currentReminder?: ItemReminder;
  } | null>(null);

  // Undo delete buffer
  const [lastDeletedItem, setLastDeletedItem] = useState<{
    type: "consulate" | "flight";
    data: any;
  } | null>(null);

  // Device-specific display preferences stay in local storage.

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BASE_CURRENCY, unifiedBaseCurrency);
  }, [unifiedBaseCurrency]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.UNIFIED_VIEW,
      String(isUnifiedViewEnabled),
    );
  }, [isUnifiedViewEnabled]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.YEAR, selectedYear.toString());
  }, [selectedYear]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MONTH, selectedMonth.toString());
  }, [selectedMonth]);

  // Due Reminders detector
  const dueReminders = useMemo(() => {
    const list: {
      type: "consulate" | "flight";
      item: ConsulateAppointment | FlightBooking;
      reminder: ItemReminder;
    }[] = [];

    const now = new Date().getTime();

    consulateAppointments.forEach((item) => {
      if (item.reminder && !item.reminder.isCompleted) {
        const remTime = new Date(item.reminder.targetDateTime).getTime();
        if (remTime <= now) {
          list.push({ type: "consulate", item, reminder: item.reminder });
        }
      }
    });

    flightBookings.forEach((item) => {
      if (item.reminder && !item.reminder.isCompleted) {
        const remTime = new Date(item.reminder.targetDateTime).getTime();
        if (remTime <= now) {
          list.push({ type: "flight", item, reminder: item.reminder });
        }
      }
    });

    return list;
  }, [consulateAppointments, flightBookings]);

  // Play audio chime when new reminder is due
  const prevDueCountRef = React.useRef(0);
  useEffect(() => {
    if (
      dueReminders.length > prevDueCountRef.current &&
      prevDueCountRef.current !== 0
    ) {
      playNotificationChime();
    }
    prevDueCountRef.current = dueReminders.length;
  }, [dueReminders.length]);

  // Active Timeline Logic with Priority Sorting (Flagged items float up)
  const activeTimelineAppointments = useMemo(() => {
    const active = consulateAppointments.filter((app) => {
      const isArchived =
        app.timelineStage === "completed" && app.paymentStatus === "paid";
      return !isArchived;
    });

    return active.sort((a, b) => {
      // Flagged items first
      const hasFlagA = a.flagColor && a.flagColor !== "none" ? 1 : 0;
      const hasFlagB = b.flagColor && b.flagColor !== "none" ? 1 : 0;
      if (hasFlagA !== hasFlagB) return hasFlagB - hasFlagA;

      // Has active reminder first
      const hasRemA = a.reminder && !a.reminder.isCompleted ? 1 : 0;
      const hasRemB = b.reminder && !b.reminder.isCompleted ? 1 : 0;
      if (hasRemA !== hasRemB) return hasRemB - hasRemA;

      return (a.orderIndex || 0) - (b.orderIndex || 0);
    });
  }, [consulateAppointments]);

  const archivedAppointments = useMemo(() => {
    return consulateAppointments.filter((app) => {
      return app.timelineStage === "completed" && app.paymentStatus === "paid";
    });
  }, [consulateAppointments]);

  // Unified Debts List
  const debts = useMemo(() => {
    const items: DebtItem[] = [];

    consulateAppointments.forEach((item) => {
      const remaining = Number(item.remainingAmount) || 0;
      if (
        remaining > 0 ||
        item.paymentStatus === "unpaid" ||
        item.paymentStatus === "partial"
      ) {
        const stageArabic: Record<TimelineStage, string> = {
          registered: "تم التسجيل",
          submitted: "تم التقديم",
          response: "رد القنصلية",
          completed: "انتهاء الخدمة",
        };

        const isCompletedConsulate = item.timelineStage === "completed";
        const typeText =
          item.appointmentType === "أخرى" && item.customAppointmentType
            ? item.customAppointmentType
            : item.appointmentType;

        items.push({
          id: `debt-cons-${item.id}`,
          type: "consulate",
          recordId: item.id,
          clientName: item.clientName,
          phoneNumber: item.phoneNumber,
          serviceDetails: `موعد قنصلية: ${typeText}`,
          serviceStatusText: `${stageArabic[item.timelineStage]} ${
            isCompletedConsulate ? "(خدمة منتهية معلقة بالسداد)" : ""
          }`,
          totalAmount: item.price,
          paidAmount: item.paidAmount,
          remainingAmount:
            remaining > 0 ? remaining : item.price - item.paidAmount,
          currency: item.currency || "TRY",
          settlementCurrency: item.settlementCurrency || item.currency || "TRY",
          date: item.submissionDate,
          isCompletedConsulate,
          flagColor: item.flagColor,
          reminder: item.reminder,
          notes: item.notes,
        });
      }
    });

    flightBookings.forEach((item) => {
      const remaining = Number(item.remainingAmount) || 0;
      if (
        remaining > 0 ||
        item.paymentStatus === "unpaid" ||
        item.paymentStatus === "partial" ||
        item.paymentMethod.includes("دين") ||
        item.paymentMethod.includes("آجل")
      ) {
        items.push({
          id: `debt-flt-${item.id}`,
          type: "flight",
          recordId: item.id,
          clientName: item.clientName,
          phoneNumber: item.phoneNumber,
          serviceDetails: `تذكرة طيران PNR: ${item.pnr} (${item.airlineAndRoute})`,
          serviceStatusText: `حجز طيران - طريقة الدفع: ${item.paymentMethod}`,
          totalAmount: item.sellingPrice,
          paidAmount: item.paidAmount,
          remainingAmount:
            remaining > 0 ? remaining : item.sellingPrice - item.paidAmount,
          currency: item.currency || "MAD",
          settlementCurrency: item.settlementCurrency || item.currency || "MAD",
          date: item.bookingDate,
          isCompletedConsulate: false,
          flagColor: item.flagColor,
          reminder: item.reminder,
          notes: item.notes,
        });
      }
    });

    return items.sort((a, b) => b.remainingAmount - a.remainingAmount);
  }, [consulateAppointments, flightBookings]);

  // Helper payment status calculation
  const calculatePaymentStatus = (
    price: number,
    paid: number,
  ): { status: PaymentStatus; remaining: number } => {
    const validPaid = Math.max(0, paid);
    const remaining = Math.max(0, price - validPaid);
    let status: PaymentStatus = "unpaid";
    if (remaining <= 0 && validPaid > 0) {
      status = "paid";
    } else if (validPaid > 0 && remaining > 0) {
      status = "partial";
    } else {
      status = "unpaid";
    }
    return { status, remaining };
  };

  // Consulate CRUD & Inline edits
  const addConsulateAppointment = (
    item: Omit<
      ConsulateAppointment,
      "id" | "createdAt" | "updatedAt" | "remainingAmount" | "paymentStatus"
    >,
  ) => {
    const now = new Date().toISOString();
    const { status, remaining } = calculatePaymentStatus(
      item.price,
      item.paidAmount,
    );
    const newAppointment: ConsulateAppointment = {
      ...item,
      id: `cons-${Date.now()}`,
      currency: item.currency || "MAD",
      settlementCurrency: item.settlementCurrency || item.currency || "MAD",
      paymentStatus: status,
      remainingAmount: remaining,
      flagColor: item.flagColor || "none",
      createdAt: now,
      updatedAt: now,
    };
    setConsulateAppointments((prev) => [newAppointment, ...prev]);
  };

  const updateConsulateAppointment = (
    id: string,
    updates: Partial<ConsulateAppointment>,
  ) => {
    setConsulateAppointments((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const merged = {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        if (updates.price !== undefined || updates.paidAmount !== undefined) {
          const { status, remaining } = calculatePaymentStatus(
            merged.price,
            merged.paidAmount,
          );
          merged.paymentStatus = status;
          merged.remainingAmount = remaining;
        }
        return merged;
      }),
    );
  };

  const inlineUpdateConsulate = (
    id: string,
    field: keyof ConsulateAppointment,
    value: any,
  ) => {
    updateConsulateAppointment(id, { [field]: value });
  };

  const deleteConsulateAppointment = (id: string) => {
    const target = consulateAppointments.find((c) => c.id === id);
    if (target) {
      setLastDeletedItem({ type: "consulate", data: target });
    }
    setConsulateAppointments((prev) => prev.filter((item) => item.id !== id));
  };

  const duplicateConsulateAppointment = (id: string) => {
    const original = consulateAppointments.find((c) => c.id === id);
    if (!original) return;
    const now = new Date().toISOString();
    const duplicated: ConsulateAppointment = {
      ...original,
      id: `cons-${Date.now()}`,
      clientName: `${original.clientName} (نسخة)`,
      paidAmount: 0,
      remainingAmount: original.price,
      paymentStatus: "unpaid",
      timelineStage: "registered",
      createdAt: now,
      updatedAt: now,
    };
    setConsulateAppointments((prev) => [duplicated, ...prev]);
  };

  const moveTimelineStage = (id: string, newStage: TimelineStage) => {
    updateConsulateAppointment(id, { timelineStage: newStage });
  };

  const reorderTimelineAppointment = (
    sourceId: string,
    targetStage: TimelineStage,
    targetIndex?: number,
  ) => {
    setConsulateAppointments((prev) => {
      const itemIndex = prev.findIndex((i) => i.id === sourceId);
      if (itemIndex === -1) return prev;
      const item = { ...prev[itemIndex], timelineStage: targetStage };
      const rest = prev.filter((i) => i.id !== sourceId);
      if (targetIndex !== undefined) {
        rest.splice(targetIndex, 0, item);
        return rest;
      }
      return [item, ...rest];
    });
  };

  const updateConsulateResponse = (
    id: string,
    response: ConsulateResponse,
    notes?: string,
  ) => {
    updateConsulateAppointment(id, {
      consulateResponse: response,
      missingDocsNotes: response === "missing_docs" ? (notes ?? "") : undefined,
    });
  };

  const settleConsulatePayment = (
    id: string,
    paidAmount?: number,
    paidCurrency?: SupportedCurrency,
  ) => {
    setConsulateAppointments((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const targetCurrency = paidCurrency || item.currency;

        // If paying partially or fully
        let newPaid = item.price;
        if (paidAmount !== undefined) {
          // If paid in a different currency, convert to item.currency
          if (paidCurrency && paidCurrency !== item.currency) {
            const convertedPaid = convertCurrency(
              paidAmount,
              paidCurrency,
              item.currency,
              exchangeRates,
            );
            newPaid = Math.min(item.price, item.paidAmount + convertedPaid);
          } else {
            newPaid = Math.min(item.price, item.paidAmount + paidAmount);
          }
        }

        const remaining = Math.max(0, item.price - newPaid);
        return {
          ...item,
          paidAmount: newPaid,
          remainingAmount: remaining,
          paymentStatus: remaining === 0 ? "paid" : "partial",
          settlementCurrency: targetCurrency,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  };

  // Flight CRUD & Inline
  const addFlightBooking = (
    item: Omit<
      FlightBooking,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "netProfit"
      | "remainingAmount"
      | "paymentStatus"
    >,
  ) => {
    const now = new Date().toISOString();
    // Net profit calculation in selling currency
    let convertedCost = item.cost;
    if (item.costCurrency && item.costCurrency !== item.currency) {
      convertedCost = convertCurrency(
        item.cost,
        item.costCurrency,
        item.currency,
        exchangeRates,
      );
    }
    const netProfit = item.sellingPrice - convertedCost;
    const { status, remaining } = calculatePaymentStatus(
      item.sellingPrice,
      item.paidAmount,
    );

    const newFlight: FlightBooking = {
      ...item,
      id: `flt-${Date.now()}`,
      currency: item.currency || "MAD",
      costCurrency: item.costCurrency || item.currency || "MAD",
      settlementCurrency: item.settlementCurrency || item.currency || "MAD",
      netProfit,
      remainingAmount: remaining,
      paymentStatus: status,
      flagColor: item.flagColor || "none",
      createdAt: now,
      updatedAt: now,
    };
    setFlightBookings((prev) => [newFlight, ...prev]);
  };

  const updateFlightBooking = (id: string, updates: Partial<FlightBooking>) => {
    setFlightBookings((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const merged = {
          ...item,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        if (
          updates.cost !== undefined ||
          updates.sellingPrice !== undefined ||
          updates.costCurrency !== undefined ||
          updates.currency !== undefined
        ) {
          let convertedCost = merged.cost;
          if (merged.costCurrency && merged.costCurrency !== merged.currency) {
            convertedCost = convertCurrency(
              merged.cost,
              merged.costCurrency,
              merged.currency,
              exchangeRates,
            );
          }
          merged.netProfit = merged.sellingPrice - convertedCost;
        }
        if (
          updates.sellingPrice !== undefined ||
          updates.paidAmount !== undefined
        ) {
          const { status, remaining } = calculatePaymentStatus(
            merged.sellingPrice,
            merged.paidAmount,
          );
          merged.paymentStatus = status;
          merged.remainingAmount = remaining;
        }
        return merged;
      }),
    );
  };

  const inlineUpdateFlight = (
    id: string,
    field: keyof FlightBooking,
    value: any,
  ) => {
    updateFlightBooking(id, { [field]: value });
  };

  const deleteFlightBooking = (id: string) => {
    const target = flightBookings.find((f) => f.id === id);
    if (target) {
      setLastDeletedItem({ type: "flight", data: target });
    }
    setFlightBookings((prev) => prev.filter((item) => item.id !== id));
  };

  const duplicateFlightBooking = (id: string) => {
    const original = flightBookings.find((f) => f.id === id);
    if (!original) return;
    const now = new Date().toISOString();
    const duplicated: FlightBooking = {
      ...original,
      id: `flt-${Date.now()}`,
      clientName: `${original.clientName} (نسخة)`,
      pnr: `${original.pnr}-COPY`,
      paidAmount: 0,
      remainingAmount: original.sellingPrice,
      paymentStatus: "unpaid",
      createdAt: now,
      updatedAt: now,
    };
    setFlightBookings((prev) => [duplicated, ...prev]);
  };

  const settleFlightPayment = (
    id: string,
    paidAmount?: number,
    paidCurrency?: SupportedCurrency,
  ) => {
    setFlightBookings((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const targetCurrency = paidCurrency || item.currency;

        let newPaid = item.sellingPrice;
        if (paidAmount !== undefined) {
          if (paidCurrency && paidCurrency !== item.currency) {
            const convertedPaid = convertCurrency(
              paidAmount,
              paidCurrency,
              item.currency,
              exchangeRates,
            );
            newPaid = Math.min(
              item.sellingPrice,
              item.paidAmount + convertedPaid,
            );
          } else {
            newPaid = Math.min(item.sellingPrice, item.paidAmount + paidAmount);
          }
        }

        const remaining = Math.max(0, item.sellingPrice - newPaid);
        return {
          ...item,
          paidAmount: newPaid,
          remainingAmount: remaining,
          paymentStatus: remaining === 0 ? "paid" : "partial",
          settlementCurrency: targetCurrency,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  };

  // Settle Debt Action
  const settleDebt = (
    type: "consulate" | "flight",
    recordId: string,
    paidAmount?: number,
    paidCurrency?: SupportedCurrency,
  ) => {
    if (type === "consulate") {
      settleConsulatePayment(recordId, paidAmount, paidCurrency);
    } else {
      settleFlightPayment(recordId, paidAmount, paidCurrency);
    }
  };

  // Flags
  const setItemFlag = (
    type: "consulate" | "flight",
    id: string,
    flag: FlagColor,
  ) => {
    if (type === "consulate") {
      updateConsulateAppointment(id, { flagColor: flag });
    } else {
      updateFlightBooking(id, { flagColor: flag });
    }
  };

  // Reminders
  const setReminder = (
    type: "consulate" | "flight",
    recordId: string,
    reminderData: { targetDateTime: string; reason: string },
  ) => {
    const newReminder: ItemReminder = {
      id: `rem-${Date.now()}`,
      targetDateTime: reminderData.targetDateTime,
      reason: reminderData.reason,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    if (type === "consulate") {
      updateConsulateAppointment(recordId, { reminder: newReminder });
    } else {
      updateFlightBooking(recordId, { reminder: newReminder });
    }
  };

  const completeReminder = (type: "consulate" | "flight", recordId: string) => {
    if (type === "consulate") {
      const item = consulateAppointments.find((c) => c.id === recordId);
      if (item && item.reminder) {
        updateConsulateAppointment(recordId, {
          reminder: { ...item.reminder, isCompleted: true },
        });
      }
    } else {
      const item = flightBookings.find((f) => f.id === recordId);
      if (item && item.reminder) {
        updateFlightBooking(recordId, {
          reminder: { ...item.reminder, isCompleted: true },
        });
      }
    }
  };

  const snoozeReminder = (
    type: "consulate" | "flight",
    recordId: string,
    minutes: number = 60,
  ) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutes);
    const pad = (n: number) => String(n).padStart(2, "0");
    const newDateTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`;

    if (type === "consulate") {
      const item = consulateAppointments.find((c) => c.id === recordId);
      if (item && item.reminder) {
        updateConsulateAppointment(recordId, {
          reminder: {
            ...item.reminder,
            targetDateTime: newDateTime,
            isSnoozed: true,
          },
        });
      }
    } else {
      const item = flightBookings.find((f) => f.id === recordId);
      if (item && item.reminder) {
        updateFlightBooking(recordId, {
          reminder: {
            ...item.reminder,
            targetDateTime: newDateTime,
            isSnoozed: true,
          },
        });
      }
    }
  };

  // Custom Lists
  const addCustomItem = (category: keyof SystemLists, item: string) => {
    if (!item.trim()) return;
    setSystemLists((prev) => {
      const existing = prev[category] || [];
      if (existing.includes(item.trim())) return prev;
      return {
        ...prev,
        [category]: [...existing, item.trim()],
      };
    });
  };

  const removeCustomItem = (category: keyof SystemLists, item: string) => {
    setSystemLists((prev) => ({
      ...prev,
      [category]: (prev[category] || []).filter((i) => i !== item),
    }));
  };

  // Undo Delete
  const undoLastDelete = () => {
    if (!lastDeletedItem) return;
    if (lastDeletedItem.type === "consulate") {
      setConsulateAppointments((prev) => [lastDeletedItem.data, ...prev]);
    } else {
      setFlightBookings((prev) => [lastDeletedItem.data, ...prev]);
    }
    setLastDeletedItem(null);
  };

  const clearUndoToast = () => setLastDeletedItem(null);

  // Invoices & Statements UI state
  const [invoiceSubView, setInvoiceSubView] =
    useState<InvoiceSubView>("invoices_list");
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [selectedCustomerIdForStatement, setSelectedCustomerIdForStatement] =
    useState<string | null>(null);
  const [
    preselectedTransactionsForInvoice,
    setPreselectedTransactionsForInvoice,
  ] = useState<{ type: "consulate" | "flight"; id: string }[]>([]);
  const [printPreviewTarget, setPrintPreviewTarget] =
    useState<PrintPreviewTarget | null>(null);

  const updateDocumentSettings = (updates: Partial<DocumentSettings>) => {
    setDocumentSettings((prev) => ({ ...prev, ...updates }));
  };

  const invoicedTransactionsMap = useMemo(() => {
    return getInvoicedTransactionsMap(invoices);
  }, [invoices]);

  const customerProfiles = useMemo(() => {
    return buildCustomerProfiles(
      consulateAppointments,
      flightBookings,
      invoices,
    );
  }, [consulateAppointments, flightBookings, invoices]);

  // Create or Update Draft / Issue Invoice with idempotency & double-billing guard
  const createOrSaveInvoice = (payload: {
    id?: string;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    customerTaxId?: string;
    documentClassification: DocumentClassification;
    currency: SupportedCurrency;
    issueDate: string;
    serviceDate?: string;
    dueDate?: string;
    lines: Omit<
      InvoiceLineItem,
      "invoiceId" | "taxMinor" | "totalMinor" | "sortOrder"
    >[];
    documentDiscountMinor: number;
    initialPayments?: Omit<InvoicePayment, "id" | "invoiceId">[];
    notes?: string;
    issueImmediately?: boolean;
    actor: string;
    isDemoRecord?: boolean;
  }): { success: boolean; message: string; invoice?: Invoice } => {
    const cleanName = payload.customerName.trim();
    if (!cleanName) {
      return {
        success: false,
        message: "يرجى تحديد اسم العميل لإصدار الفاتورة.",
      };
    }
    if (!payload.lines || payload.lines.length === 0) {
      return {
        success: false,
        message: "يرجى إضافة بند خدمة واحد على الأقل في الفاتورة.",
      };
    }

    const existingInvoice = payload.id
      ? invoices.find((inv) => inv.id === payload.id)
      : undefined;
    if (existingInvoice && existingInvoice.status !== "draft") {
      return {
        success: false,
        message:
          "لا يمكن تعديل البنود الأساسية لفاتورة معتمدة وصادرة رسمياً. استخدم الإشعار الدائن أو الإلغاء (Void).",
      };
    }

    // Double-billing guard: verify none of the sourceTransactionIds are already billed in another non-void invoice
    for (const line of payload.lines) {
      if (line.sourceTransactionId) {
        const conflictInvoice = invoices.find(
          (inv) =>
            inv.id !== payload.id &&
            inv.status !== "void" &&
            inv.lines.some(
              (l) => l.sourceTransactionId === line.sourceTransactionId,
            ),
        );
        if (conflictInvoice) {
          return {
            success: false,
            message: `المعاملة المختارة (${line.labelAr}) مفوترة مسبقاً ضمن الفاتورة رقم ${conflictInvoice.invoiceNumber}. لا يُسمح بالفوترة المزدوجة.`,
          };
        }
      }
    }

    const nowIso = new Date().toISOString();
    const invoiceId = existingInvoice
      ? existingInvoice.id
      : `inv-${Date.now()}`;

    let invoiceNumber = existingInvoice?.invoiceNumber || "";
    let nextSeq = documentSettings.nextSequenceNumber || 1004;

    if (!invoiceNumber) {
      const yearPart =
        payload.issueDate.slice(0, 4) || String(new Date().getFullYear());
      const prefix = (documentSettings.invoicePrefix || "INV")
        .trim()
        .toUpperCase();
      invoiceNumber = `${prefix}-${yearPart}-${String(nextSeq).padStart(4, "0")}`;
      nextSeq += 1;
      setDocumentSettings((prev) => ({ ...prev, nextSequenceNumber: nextSeq }));
    }

    const rawLines: InvoiceLineItem[] = payload.lines.map((l, idx) => ({
      ...l,
      id: l.id || `line-${Date.now()}-${idx}`,
      invoiceId,
      taxMinor: 0,
      totalMinor: 0,
      sortOrder: idx + 1,
    }));

    const paymentsList: InvoicePayment[] = existingInvoice
      ? existingInvoice.payments
      : (payload.initialPayments || []).map((p, idx) => ({
          ...p,
          id: `pay-${Date.now()}-${idx}`,
          invoiceId,
        }));

    const creditNotesList: CreditNote[] = existingInvoice
      ? existingInvoice.creditNotes
      : [];

    const targetInitialStatus = payload.issueImmediately ? "issued" : "draft";
    const totals = recalculateInvoiceTotals(
      rawLines,
      paymentsList,
      creditNotesList,
      payload.documentDiscountMinor,
      targetInitialStatus,
    );

    const customerId = getCustomerKey(cleanName, payload.customerPhone);

    const auditEvent = {
      id: `evt-${Date.now()}`,
      invoiceId,
      actor: payload.actor || "elfazni.admin",
      action: (payload.issueImmediately
        ? "issued"
        : existingInvoice
          ? "updated_draft"
          : "created_draft") as any,
      timestamp: nowIso,
      previousStatus: existingInvoice?.status,
      nextStatus: totals.status,
      details: payload.issueImmediately
        ? `إصدار واعتماد الفاتورة رقم ${invoiceNumber}`
        : existingInvoice
          ? `تحديث مسودة الفاتورة رقم ${invoiceNumber}`
          : `إنشاء مسودة فاتورة جديدة رقم ${invoiceNumber}`,
    };

    const finalInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      documentClassification: payload.documentClassification,
      customerId,
      customerName: cleanName,
      customerPhone: payload.customerPhone.trim(),
      customerAddress: payload.customerAddress?.trim() || "",
      customerTaxId: payload.customerTaxId?.trim() || "",
      status: totals.status,
      currency: payload.currency,
      issueDate: payload.issueDate,
      serviceDate: payload.serviceDate || payload.issueDate,
      dueDate: payload.dueDate || payload.issueDate,
      lines: totals.computedLines,
      documentDiscountMinor: payload.documentDiscountMinor,
      subtotalMinor: totals.subtotalMinor,
      discountTotalMinor: totals.discountTotalMinor,
      taxTotalMinor: totals.taxTotalMinor,
      totalMinor: totals.totalMinor,
      paidMinor: totals.paidMinor,
      creditedMinor: totals.creditedMinor,
      balanceDueMinor: totals.balanceDueMinor,
      payments: paymentsList,
      creditNotes: creditNotesList,
      auditEvents: existingInvoice
        ? [auditEvent, ...existingInvoice.auditEvents]
        : [auditEvent],
      notes: payload.notes || "",
      createdBy: existingInvoice?.createdBy || payload.actor || "elfazni.admin",
      approvedBy: payload.issueImmediately
        ? payload.actor
        : existingInvoice?.approvedBy,
      version: (existingInvoice?.version || 0) + 1,
      isDemoRecord: payload.isDemoRecord,
      createdAt: existingInvoice?.createdAt || nowIso,
      updatedAt: nowIso,
    };

    setInvoices((prev) => {
      if (existingInvoice) {
        return prev.map((inv) => (inv.id === invoiceId ? finalInvoice : inv));
      }
      return [finalInvoice, ...prev];
    });

    return {
      success: true,
      message: payload.issueImmediately
        ? `تم إصدار واعتماد الفاتورة (${invoiceNumber}) بنجاح!`
        : `تم حفظ مسودة الفاتورة (${invoiceNumber}) بنجاح.`,
      invoice: finalInvoice,
    };
  };

  const issueDraftInvoice = (
    invoiceId: string,
    actor: string,
  ): { success: boolean; message: string } => {
    const target = invoices.find((inv) => inv.id === invoiceId);
    if (!target) return { success: false, message: "الفاتورة غير موجودة." };
    if (target.status !== "draft") {
      return { success: false, message: "هذه الفاتورة صادرة مسبقاً." };
    }

    const totals = recalculateInvoiceTotals(
      target.lines,
      target.payments,
      target.creditNotes,
      target.documentDiscountMinor,
      "issued",
    );

    const nowIso = new Date().toISOString();
    const updated: Invoice = {
      ...target,
      status: totals.status,
      approvedBy: actor,
      version: target.version + 1,
      updatedAt: nowIso,
      auditEvents: [
        {
          id: `evt-${Date.now()}`,
          invoiceId,
          actor,
          action: "issued",
          timestamp: nowIso,
          previousStatus: "draft",
          nextStatus: totals.status,
          details: `اعتماد وإصدار الفاتورة رسمياً برقم ${target.invoiceNumber}`,
        },
        ...target.auditEvents,
      ],
    };

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? updated : inv)),
    );
    return {
      success: true,
      message: `تم اعتماد وإصدار الفاتورة ${target.invoiceNumber} بنجاح.`,
    };
  };

  const recordInvoicePayment = (
    invoiceId: string,
    payment: {
      amountMinor: number;
      method: string;
      receivedAt: string;
      externalReference?: string;
      notes?: string;
    },
    actor: string,
  ): { success: boolean; message: string } => {
    const target = invoices.find((inv) => inv.id === invoiceId);
    if (!target) return { success: false, message: "الفاتورة غير موجودة." };
    if (target.status === "void") {
      return {
        success: false,
        message: "لا يمكن تسجيل دفعة على فاتورة ملغاة (Void).",
      };
    }
    if (payment.amountMinor <= 0) {
      return {
        success: false,
        message: "يرجى إدخال مبلغ دفعة صحيح أكبر من الصفر.",
      };
    }

    const newPayment: InvoicePayment = {
      id: `pay-${Date.now()}`,
      invoiceId,
      amountMinor: Math.min(
        target.balanceDueMinor,
        Math.round(payment.amountMinor),
      ),
      currency: target.currency,
      method: payment.method,
      receivedAt: payment.receivedAt,
      externalReference:
        payment.externalReference || `RCPT-${Date.now().toString().slice(-4)}`,
      recordedBy: actor,
      status: "cleared",
      notes: payment.notes,
    };

    const updatedPayments = [...target.payments, newPayment];
    const totals = recalculateInvoiceTotals(
      target.lines,
      updatedPayments,
      target.creditNotes,
      target.documentDiscountMinor,
      target.status === "draft" ? "issued" : target.status,
    );

    const nowIso = new Date().toISOString();
    const updatedInvoice: Invoice = {
      ...target,
      status: totals.status,
      paidMinor: totals.paidMinor,
      balanceDueMinor: totals.balanceDueMinor,
      payments: updatedPayments,
      version: target.version + 1,
      updatedAt: nowIso,
      auditEvents: [
        {
          id: `evt-${Date.now()}`,
          invoiceId,
          actor,
          action: "payment_recorded",
          timestamp: nowIso,
          previousStatus: target.status,
          nextStatus: totals.status,
          details: `تسجيل دفعة مستلمة بقيمة ${fromMinorUnits(newPayment.amountMinor)} ${target.currency} (${payment.method})`,
        },
        ...target.auditEvents,
      ],
    };

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? updatedInvoice : inv)),
    );

    // Sync paid status to linked CRM records if single-transaction or fully paid
    if (totals.balanceDueMinor === 0) {
      target.lines.forEach((line) => {
        if (line.sourceTransactionId && line.sourceType === "consulate") {
          settleConsulatePayment(line.sourceTransactionId);
        } else if (line.sourceTransactionId && line.sourceType === "flight") {
          settleFlightPayment(line.sourceTransactionId);
        }
      });
    } else if (
      target.lines.length === 1 &&
      target.lines[0].sourceTransactionId
    ) {
      const singleLine = target.lines[0];
      const addMajor = fromMinorUnits(newPayment.amountMinor);
      if (singleLine.sourceType === "consulate") {
        settleConsulatePayment(
          singleLine.sourceTransactionId!,
          addMajor,
          target.currency,
        );
      } else if (singleLine.sourceType === "flight") {
        settleFlightPayment(
          singleLine.sourceTransactionId!,
          addMajor,
          target.currency,
        );
      }
    }

    return {
      success: true,
      message: "تم تسجيل الدفعة وتحديث الرصيد المتبقي بنجاح!",
    };
  };

  const addInvoiceCreditNote = (
    invoiceId: string,
    creditNote: { reason: string; amountMinor: number; issuedAt: string },
    actor: string,
  ): { success: boolean; message: string } => {
    const target = invoices.find((inv) => inv.id === invoiceId);
    if (!target) return { success: false, message: "الفاتورة غير موجودة." };
    if (target.status === "void" || target.status === "draft") {
      return {
        success: false,
        message: "الإشعار الدائن متاح فقط للفواتير الصادرة.",
      };
    }
    if (!creditNote.reason.trim() || creditNote.amountMinor <= 0) {
      return {
        success: false,
        message: "يرجى تحديد سبب وقيمة الإشعار الدائن.",
      };
    }

    const validCreditMinor = Math.min(
      target.balanceDueMinor,
      Math.round(creditNote.amountMinor),
    );
    const newCreditNote: CreditNote = {
      id: `cn-${Date.now()}`,
      invoiceId,
      referenceNumber: `CN-${target.invoiceNumber.replace("INV-", "")}-${target.creditNotes.length + 1}`,
      reason: creditNote.reason.trim(),
      amountMinor: validCreditMinor,
      currency: target.currency,
      issuedAt: creditNote.issuedAt,
      status: "applied",
      authorizedBy: actor,
    };

    const updatedCredits = [...target.creditNotes, newCreditNote];
    const totals = recalculateInvoiceTotals(
      target.lines,
      target.payments,
      updatedCredits,
      target.documentDiscountMinor,
      target.status,
    );

    const nowIso = new Date().toISOString();
    const updatedInvoice: Invoice = {
      ...target,
      status: totals.status,
      creditedMinor: totals.creditedMinor,
      balanceDueMinor: totals.balanceDueMinor,
      creditNotes: updatedCredits,
      version: target.version + 1,
      updatedAt: nowIso,
      auditEvents: [
        {
          id: `evt-${Date.now()}`,
          invoiceId,
          actor,
          action: "credit_note_added",
          timestamp: nowIso,
          previousStatus: target.status,
          nextStatus: totals.status,
          details: `إصدار إشعار دائن (${newCreditNote.referenceNumber}) بقيمة ${fromMinorUnits(validCreditMinor)} ${target.currency} — السبب: ${newCreditNote.reason}`,
        },
        ...target.auditEvents,
      ],
    };

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? updatedInvoice : inv)),
    );
    return {
      success: true,
      message: `تم إصدار الإشعار الدائن (${newCreditNote.referenceNumber}) وتخفيض الرصيد المستحق.`,
    };
  };

  const voidInvoice = (
    invoiceId: string,
    reason: string,
    actor: string,
  ): { success: boolean; message: string } => {
    const target = invoices.find((inv) => inv.id === invoiceId);
    if (!target) return { success: false, message: "الفاتورة غير موجودة." };
    if (target.status === "void")
      return { success: false, message: "الفاتورة ملغاة مسبقاً." };
    if (!reason.trim())
      return {
        success: false,
        message: "يرجى كتابة سبب إلغاء الفاتورة في سجل التدقيق.",
      };

    const nowIso = new Date().toISOString();
    const updatedInvoice: Invoice = {
      ...target,
      status: "void",
      balanceDueMinor: 0,
      version: target.version + 1,
      updatedAt: nowIso,
      auditEvents: [
        {
          id: `evt-${Date.now()}`,
          invoiceId,
          actor,
          action: "voided",
          timestamp: nowIso,
          previousStatus: target.status,
          nextStatus: "void",
          details: `إلغاء الفاتورة رسمياً (VOID) — السبب: ${reason.trim()}`,
        },
        ...target.auditEvents,
      ],
    };

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? updatedInvoice : inv)),
    );
    return {
      success: true,
      message: `تم إلغاء الفاتورة (${target.invoiceNumber}) وحفظ السبب في سجل التدقيق.`,
    };
  };

  const logInvoiceAudit = (
    invoiceId: string,
    action: "printed" | "exported_pdf",
    actor: string,
    details: string,
  ) => {
    const nowIso = new Date().toISOString();
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        return {
          ...inv,
          auditEvents: [
            {
              id: `evt-${Date.now()}`,
              invoiceId,
              actor,
              action,
              timestamp: nowIso,
              details,
            },
            ...inv.auditEvents,
          ],
        };
      }),
    );
  };

  // Validate selected transactions from Consulate/Flights and open the Invoice Editor
  const openInvoiceCreatorFromTransactions = (
    items: { type: "consulate" | "flight"; id: string }[],
  ): { success: boolean; message?: string } => {
    if (!items || items.length === 0) {
      return {
        success: false,
        message: "يرجى تحديد معاملة واحدة على الأقل لإعداد الفاتورة.",
      };
    }

    const resolvedRecords: {
      type: "consulate" | "flight";
      id: string;
      customerKey: string;
      clientName: string;
      currency: SupportedCurrency;
    }[] = [];

    for (const entry of items) {
      if (invoicedTransactionsMap.has(entry.id)) {
        const existingInvNo = invoicedTransactionsMap.get(entry.id);
        return {
          success: false,
          message: `المعاملة رقم (${entry.id}) مفوترة مسبقاً ضمن الفاتورة (${existingInvNo}). لا يمكن فوترتها مرتين.`,
        };
      }

      if (entry.type === "consulate") {
        const rec = consulateAppointments.find((c) => c.id === entry.id);
        if (rec) {
          resolvedRecords.push({
            type: "consulate",
            id: rec.id,
            customerKey: getCustomerKey(rec.clientName, rec.phoneNumber),
            clientName: rec.clientName,
            currency: rec.currency,
          });
        }
      } else {
        const rec = flightBookings.find((f) => f.id === entry.id);
        if (rec) {
          resolvedRecords.push({
            type: "flight",
            id: rec.id,
            customerKey: getCustomerKey(rec.clientName, rec.phoneNumber),
            clientName: rec.clientName,
            currency: rec.currency,
          });
        }
      }
    }

    if (resolvedRecords.length === 0) {
      return {
        success: false,
        message: "لم يتم العثور على المعاملات المحددة.",
      };
    }

    const firstCustKey = resolvedRecords[0].customerKey;
    const hasDifferentCustomer = resolvedRecords.some(
      (r) => r.customerKey !== firstCustKey,
    );
    if (hasDifferentCustomer) {
      return {
        success: false,
        message:
          "لا يمكن جمع معاملات لعملاء مختلفين في فاتورة واحدة. يرجى اختيار معاملات تخص عميلاً واحداً فقط.",
      };
    }

    const firstCurrency = resolvedRecords[0].currency;
    const hasDifferentCurrency = resolvedRecords.some(
      (r) => r.currency !== firstCurrency,
    );
    if (hasDifferentCurrency) {
      return {
        success: false,
        message: `المعاملات المحددة مسجلة بعملات مختلفة. يجب أن تكون بنود الفاتورة الواحدة بنفس العملة (${firstCurrency}).`,
      };
    }

    setPreselectedTransactionsForInvoice(items);
    setActiveInvoiceId(null);
    setInvoiceSubView("invoice_editor");
    setActiveTab("invoices");
    return { success: true };
  };

  const openCustomerStatement = (customerId: string) => {
    setSelectedCustomerIdForStatement(customerId);
    setInvoiceSubView("customer_statement");
    setActiveTab("invoices");
  };

  // Backup & Import
  const exportDataJSON = () => {
    const backupData = {
      app: "ELFAZNI_SERVICES_CRM",
      version: 5,
      contactBook,
      exportedAt: new Date().toISOString(),
      exchangeRates,
      systemLists,
      documentSettings,
      consulateAppointments,
      flightBookings,
      invoices,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ELFAZNI_CRM_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importDataJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      const candidate = {
        contactBook: data.contactBook ?? contactBook,
        consulateAppointments: data.consulateAppointments,
        flightBookings: data.flightBookings,
        invoices: data.invoices ?? invoices,
        documentSettings: { ...documentSettings, ...(data.documentSettings || {}) },
        exchangeRates: data.exchangeRates ?? exchangeRates,
        systemLists: data.systemLists ?? systemLists,
      };
      if (!validSnapshot(candidate)) return false;
      if (data.contactBook !== undefined && !validContactBook(data.contactBook))
        return false;
      if (
        Array.isArray(data.consulateAppointments) &&
        Array.isArray(data.flightBookings)
      ) {
        if (data.contactBook !== undefined) setContactBook(data.contactBook);
        setConsulateAppointments(data.consulateAppointments);
        setFlightBookings(data.flightBookings);
        if (Array.isArray(data.invoices)) setInvoices(data.invoices);
        if (data.documentSettings)
          setDocumentSettings({
            ...candidate.documentSettings,
          });
        if (data.exchangeRates) setExchangeRates(data.exchangeRates);
        if (data.systemLists) setSystemLists(data.systemLists);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Import parse error:", e);
      return false;
    }
  };

  const resetToMockData = () => {
    setContactBook(emptyContactBook());
    setSelectedContactId(null);
    setConsulateAppointments(initialConsulateAppointments);
    setFlightBookings(initialFlightBookings);
    setInvoices(initialInvoices);
    setDocumentSettings(DEFAULT_DOCUMENT_SETTINGS);
    setExchangeRates(DEFAULT_EXCHANGE_RATES);
    setSystemLists(initialSystemLists);
  };

  const clearAllData = () => {
    setContactBook(emptyContactBook());
    setSelectedContactId(null);
    setConsulateAppointments([]);
    setFlightBookings([]);
    setInvoices([]);
  };

  return (
    <AppContext.Provider
      value={{
        bookingContact,
        setBookingContact,
        contactBook,
        setContactBook,
        contactBookStorageError,
        selectedContactId,
        setSelectedContactId,
        activeTab,
        setActiveTab,
        consulateAppointments,
        flightBookings,
        activeTimelineAppointments,
        archivedAppointments,
        debts,
        selectedYear,
        setSelectedYear,
        selectedMonth,
        setSelectedMonth,

        exchangeRates,
        setExchangeRates,
        unifiedBaseCurrency,
        setUnifiedBaseCurrency,
        isUnifiedViewEnabled,
        setIsUnifiedViewEnabled,

        addConsulateAppointment,
        updateConsulateAppointment,
        inlineUpdateConsulate,
        deleteConsulateAppointment,
        duplicateConsulateAppointment,
        moveTimelineStage,
        reorderTimelineAppointment,
        updateConsulateResponse,
        settleConsulatePayment,

        addFlightBooking,
        updateFlightBooking,
        inlineUpdateFlight,
        deleteFlightBooking,
        duplicateFlightBooking,
        settleFlightPayment,

        settleDebt,
        setItemFlag,

        setReminder,
        completeReminder,
        snoozeReminder,
        dueReminders,

        timelineViewMode,
        setTimelineViewMode,
        showFlaggedOnly,
        setShowFlaggedOnly,
        quickAddStage,
        setQuickAddStage,

        spotlightItem,
        setSpotlightItem,
        reminderModalTarget,
        setReminderModalTarget,

        editingConsulate,
        setEditingConsulate,
        isConsulateModalOpen,
        setIsConsulateModalOpen,
        presetServiceType,
        setPresetServiceType,
        showExtraServicesInMenu,
        setShowExtraServicesInMenu: (val: boolean) => {
          setShowExtraServicesInMenu(val);
          try {
            localStorage.setItem(
              "elfazni_crm_show_extra_services_v1",
              String(val),
            );
          } catch (e) {
            console.error(e);
          }
        },

        editingFlight,
        setEditingFlight,
        isFlightModalOpen,
        setIsFlightModalOpen,

        invoices,
        documentSettings,
        updateDocumentSettings,
        customerProfiles,
        invoicedTransactionsMap,
        invoiceSubView,
        setInvoiceSubView,
        activeInvoiceId,
        setActiveInvoiceId,
        selectedCustomerIdForStatement,
        setSelectedCustomerIdForStatement,
        preselectedTransactionsForInvoice,
        setPreselectedTransactionsForInvoice,
        printPreviewTarget,
        setPrintPreviewTarget,

        createOrSaveInvoice,
        issueDraftInvoice,
        recordInvoicePayment,
        addInvoiceCreditNote,
        voidInvoice,
        logInvoiceAudit,
        openInvoiceCreatorFromTransactions,
        openCustomerStatement,

        systemLists,
        addCustomItem,
        removeCustomItem,

        lastDeletedItem,
        undoLastDelete,
        clearUndoToast,

        exportDataJSON,
        importDataJSON,
        resetToMockData,
        clearAllData,
      }}
    >
      {persistence.toolbar}
      <div inert={persistence.blocked} aria-busy={persistence.blocked}>{children}</div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
