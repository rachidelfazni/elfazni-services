import { SupportedCurrency } from "./index";
export interface CRMContact {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "lead" | "customer";
  rating: number;
  photo?: string;
  starred?: boolean;
  alternatePhone?: string;
  address?: string;
  city?: string;
  social?: Partial<Record<"instagram" | "facebook" | "linkedin", string>>;
  notes: string;
  latestAgreement: string;
  linkedCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}
export type ContactActivityKind =
  "call" | "message" | "meeting" | "agreement" | "historical" | "note";
export interface ContactActivity {
  id: string;
  contactId: string;
  kind: ContactActivityKind;
  text: string;
  occurredAt: string;
  createdAt: string;
}
export interface ManualDebtPayment {
  id: string;
  amountMinor: number;
  paidAt: string;
  note: string;
}
export type DebtDirection = "receivable" | "payable";
export interface ManualDebt {
  direction?: DebtDirection;
  id: string;
  contactId: string;
  title: string;
  currency: SupportedCurrency;
  amountMinor: number;
  date: string;
  dueDate: string;
  notes: string;
  payments: ManualDebtPayment[];
  createdAt: string;
}
export interface ContactReminder {
  id: string;
  contactId: string;
  debtId?: string;
  title: string;
  dueAt: string;
  completedAt?: string;
  createdAt: string;
}
export interface ContactBook {
  contacts: CRMContact[];
  activities: ContactActivity[];
  manualDebts: ManualDebt[];
  reminders: ContactReminder[];
}
