export type SupportedCurrency = 'TRY' | 'MAD' | 'EUR' | 'USD';

export interface CurrencyConfig {
  code: SupportedCurrency;
  label: string;
  symbol: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  TRY: { code: 'TRY', label: 'ليرة تركية', symbol: '₺', flag: '🇹🇷' },
  MAD: { code: 'MAD', label: 'درهم مغربي', symbol: 'د.م', flag: '🇲🇦' },
  EUR: { code: 'EUR', label: 'يورو', symbol: '€', flag: '🇪🇺' },
  USD: { code: 'USD', label: 'دولار أمريكي', symbol: '$', flag: '🇺🇸' },
};

export interface ExchangeRates {
  // Rates relative to USD (1 USD = X Currency)
  USD: number; // 1
  EUR: number; // e.g. 0.92
  TRY: number; // e.g. 34.50
  MAD: number; // e.g. 9.85
}

export type FlagColor = 'none' | 'gold' | 'red' | 'star' | 'pin';

export interface ItemReminder {
  id: string;
  targetDateTime: string; // ISO string or YYYY-MM-DDTHH:mm
  reason: string;
  isCompleted: boolean;
  isSnoozed?: boolean;
  createdAt: string;
}

export type AppointmentType =
  | 'تأشيرة سياحية'
  | 'تأشيرة دراسة'
  | 'لم شمل'
  | 'تجديد جواز سفر'
  | 'تصديق أوراق'
  | 'حجز موعد عاجل'
  | 'أخرى'
  | string;

export type ConsulateResponse = 'pending' | 'accepted' | 'rejected' | 'missing_docs';

export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

export type TimelineStage = 'registered' | 'submitted' | 'response' | 'completed';

export type FlightPaymentMethod =
  | 'cash'
  | 'bank_transfer'
  | 'credit_card'
  | 'debt'
  | string;

export interface ConsulateAppointment {
  contactId?: string;
  id: string;
  clientName: string;
  phoneNumber: string;
  submissionDate: string; // YYYY-MM-DD
  appointmentType: AppointmentType;
  customAppointmentType?: string;
  consulateResponse: ConsulateResponse;
  missingDocsNotes?: string;
  price: number;
  currency: SupportedCurrency; // Selling currency
  paymentStatus: PaymentStatus;
  paidAmount: number;
  settlementCurrency: SupportedCurrency; // Currency customer actually paid with
  remainingAmount: number;
  timelineStage: TimelineStage;
  flagColor?: FlagColor;
  reminder?: ItemReminder;
  notes?: string;
  orderIndex?: number; // Order within the column
  createdAt: string;
  updatedAt: string;
}

export interface FlightBooking {
  contactId?: string;
  id: string;
  clientName: string;
  phoneNumber: string;
  pnr: string;
  airlineAndRoute: string;
  bookingDate: string; // YYYY-MM-DD
  cost: number;
  costCurrency: SupportedCurrency; // Cost currency paid to provider
  sellingPrice: number;
  currency: SupportedCurrency; // Selling currency agreed with client
  netProfit: number; // Computed in selling currency (or converted)
  paymentMethod: FlightPaymentMethod;
  paidAmount: number;
  settlementCurrency: SupportedCurrency; // Currency customer paid with
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  flagColor?: FlagColor;
  reminder?: ItemReminder;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DebtItem {
  id: string;
  type: 'consulate' | 'flight';
  recordId: string;
  clientName: string;
  phoneNumber: string;
  serviceDetails: string;
  serviceStatusText: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: SupportedCurrency;
  settlementCurrency: SupportedCurrency;
  date: string;
  isCompletedConsulate: boolean;
  flagColor?: FlagColor;
  reminder?: ItemReminder;
  notes?: string;
}

export type ActiveTab = 'dashboard' | 'customers' | 'consulate' | 'flights' | 'invoices' | 'debts' | 'reports' | 'tools';

export type InvoiceStatus = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'void';

export type DocumentClassification = 'invoice' | 'pro_forma' | 'payment_receipt';

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  sourceTransactionId?: string | null; // e.g., 'cons-101' or 'flt-202'
  sourceType?: 'consulate' | 'flight' | 'custom';
  serviceReference?: string; // e.g., PNR code or Appointment Type
  labelAr: string;
  labelEn?: string;
  quantity: number;
  unitPriceMinor: number; // Integer minor units (100 = 1.00)
  discountMinor: number; // Integer minor units
  taxRate: number; // Decimal e.g., 0, 0.18, 0.20
  taxMinor: number; // Integer minor units
  totalMinor: number; // Integer minor units
  sortOrder: number;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amountMinor: number; // Integer minor units
  currency: SupportedCurrency;
  method: string;
  receivedAt: string; // YYYY-MM-DD
  externalReference?: string;
  recordedBy: string;
  status: 'cleared' | 'reversed';
  notes?: string;
}

export interface CreditNote {
  id: string;
  invoiceId: string;
  referenceNumber: string; // e.g., CN-2026-0001
  reason: string;
  amountMinor: number; // Integer minor units
  currency: SupportedCurrency;
  issuedAt: string;
  status: 'applied' | 'void';
  authorizedBy: string;
}

export interface InvoiceAuditEvent {
  id: string;
  invoiceId: string;
  actor: string;
  action:
    | 'created_draft'
    | 'updated_draft'
    | 'issued'
    | 'payment_recorded'
    | 'payment_reversed'
    | 'credit_note_added'
    | 'voided'
    | 'printed'
    | 'exported_pdf';
  timestamp: string;
  previousStatus?: InvoiceStatus;
  nextStatus?: InvoiceStatus;
  details: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // Immutable once issued, e.g., INV-2026-0001
  documentClassification: DocumentClassification; // 'invoice' | 'pro_forma' | 'payment_receipt'
  customerId: string; // Normalized key for customer
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerTaxId?: string;
  status: InvoiceStatus;
  currency: SupportedCurrency;
  issueDate: string; // YYYY-MM-DD
  serviceDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  lines: InvoiceLineItem[];
  documentDiscountMinor: number; // Additional document-level discount in minor units
  subtotalMinor: number; // Sum of (qty * unitPrice - lineDiscount)
  discountTotalMinor: number; // Sum of line discounts + documentDiscountMinor
  taxTotalMinor: number; // Sum of line taxes
  totalMinor: number; // Grand total in minor units
  paidMinor: number; // Sum of cleared payments + Synced initial payments
  creditedMinor: number; // Sum of applied credit notes
  balanceDueMinor: number; // totalMinor - paidMinor - creditedMinor
  payments: InvoicePayment[];
  creditNotes: CreditNote[];
  auditEvents: InvoiceAuditEvent[];
  notes?: string;
  createdBy: string;
  approvedBy?: string;
  version: number;
  isDemoRecord?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSettings {
  tradingNameAr: string;
  tradingNameEn: string;
  legalEntityName: string;
  headquartersAr: string;
  phone: string;
  email: string;
  website: string;
  taxId?: string; // Optional, never invented unless entered by admin
  tradeRegistryNo?: string; // Optional
  defaultDocumentClassification: DocumentClassification;
  defaultTaxRate: number; // e.g., 0
  invoicePrefix: string; // e.g., 'INV'
  nextSequenceNumber: number;
  logoVariant: 'horizontal' | 'vertical';
  showDigitalStamp: boolean;
  digitalStampPosition?: 'signature' | 'bottom_corner';
  showBankAccountsOnInvoices: boolean;
  bankAccountHolder: string;
  ibanTRY: string;
  ibanUSD: string;
  footerDisclaimerAr: string;
  footerDisclaimerEn: string;
}

export interface CustomerProfileSummary {
  customerId: string;
  clientName: string;
  phoneNumber: string;
  consulateRecords: ConsulateAppointment[];
  flightRecords: FlightBooking[];
  invoices: Invoice[];
  currencies: SupportedCurrency[];
  totalsByCurrency: Record<
    SupportedCurrency,
    {
      billedMinor: number;
      paidMinor: number;
      creditedMinor: number;
      outstandingMinor: number;
    }
  >;
}

export interface MonthlyFilter {
  year: number;
  month: number; // 1-12 or 0 for all
}

export interface SystemLists {
  appointmentTypes: string[];
  airlines: string[];
  paymentMethods: string[];
}

export type UserRole = 'super_admin' | 'admin' | 'accountant' | 'editor' | 'agent' | 'viewer';

export interface RoleMetadata {
  role: UserRole;
  label: string;
  description: string;
  badgeColor: string;
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleMetadata> = {
  super_admin: {
    role: 'super_admin',
    label: 'مدير عام جذري (Super Admin)',
    description: 'صلاحية مطلقة على كافة الأقسام، المحاسبة، الفواتير، وإدارة المستخدمين والنظام',
    badgeColor: 'bg-[#CC9048] text-slate-950 font-black',
  },
  admin: {
    role: 'admin',
    label: 'مدير نظام (Admin)',
    description: 'إدارة كاملة للعمليات، المحاسبة، الفواتير، والمستخدمين',
    badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
  },
  accountant: {
    role: 'accountant',
    label: 'محاسب مالي (Accountant)',
    description: 'إدارة الحسابات المالية، الفواتير، كشوف الحساب، جدول الديون، والتقارير وأسعار الصرف',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
  },
  editor: {
    role: 'editor',
    label: 'محرر عمليات (Editor)',
    description: 'تسجيل وتعديل مواعيد القنصلية وحجوزات الطيران والخط الزمني دون الوصول للمحاسبة الشاملة أو المستخدمين',
    badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
  },
  agent: {
    role: 'agent',
    label: 'موظف حجوزات (Agent)',
    description: 'إدارة مواعيد القنصلية وحجوزات الطيران ومتابعة الخط الزمني',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
  },
  viewer: {
    role: 'viewer',
    label: 'مشاهد فقط (Viewer)',
    description: 'الاطلاع على الخط الزمني والمواعيد دون تعديل البيانات المالية أو إدارة المستخدمين',
    badgeColor: 'bg-slate-700 text-slate-300 border border-slate-600',
  },
};

export interface PasswordResetRequest {
  id: string;
  username: string;
  contactInfo?: string;
  requestedAt: string;
  status: 'pending' | 'resolved';
  notes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface SystemUser {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
  email: string;
  phone: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  // Granular Module-Level Permissions
  canAccessConsulate: boolean;
  canAccessFlights: boolean;
  canAccessAccounting: boolean;
  canAccessDebts: boolean;
  canAccessReports: boolean;
  canManageUsers: boolean;
  canEditFinances?: boolean;
  notes?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  email: string;
  phone: string;
  avatarUrl?: string;
  lastLoginAt: string;
  // Granular Module-Level Permissions
  canAccessConsulate: boolean;
  canAccessFlights: boolean;
  canAccessAccounting: boolean;
  canAccessDebts: boolean;
  canAccessReports: boolean;
  canManageUsers: boolean;
  canEditFinances?: boolean;
}



