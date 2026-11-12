import type { ContactBook } from '../types/contactBook';
import type { ConsulateAppointment, FlightBooking, Invoice, DocumentSettings, ExchangeRates, SystemLists } from '../types';
import { validContactBook } from '../utils/contactBook';

export interface CrmSnapshot {
  contactBook: ContactBook;
  consulateAppointments: ConsulateAppointment[];
  flightBookings: FlightBooking[];
  invoices: Invoice[];
  documentSettings: DocumentSettings;
  exchangeRates: ExchangeRates;
  systemLists: SystemLists;
}
export interface CrmEnvelope {
  revision: number;
  updatedAt: string | null;
  data: CrmSnapshot | null;
}
const object = (value: unknown): value is Record<string, any> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const text = (value: unknown) => typeof value === 'string' && value.length <= 20000;
const date = (value: unknown) => text(value) && Number.isFinite(Date.parse(value as string));
const money = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const currency = (value: unknown) => ['TRY', 'MAD', 'EUR', 'USD'].includes(value as string);
const records = (value: unknown): value is Record<string, any>[] =>
  Array.isArray(value) && value.length <= 50000 && value.every(row => object(row) && text(row.id) && row.id.length > 0) &&
  new Set(value.map(row => row.id)).size === value.length;
const texts = (row: Record<string, any>, keys: string[]) => keys.every(key => text(row[key]));
const amounts = (row: Record<string, any>, keys: string[]) => keys.every(key => money(row[key]));
const reminder = (value: any) => value === undefined || (object(value) && text(value.id) && text(value.reason) && date(value.targetDateTime) && typeof value.isCompleted === 'boolean');

export function validSnapshot(value: unknown): value is CrmSnapshot {
  try {
    if (!object(value) || !validContactBook(value.contactBook)) return false;
    if (Object.keys(value).some(key => !['contactBook','consulateAppointments','flightBookings','invoices','documentSettings','exchangeRates','systemLists'].includes(key))) return false;
    const contacts = new Set(value.contactBook.contacts.map(c => c.id));
    const operation = (row: Record<string, any>) =>
      texts(row, ['clientName','phoneNumber']) && date(row.createdAt) && date(row.updatedAt) &&
      currency(row.currency) && currency(row.settlementCurrency) &&
      ['paid','unpaid','partial'].includes(row.paymentStatus) &&
      amounts(row, ['paidAmount','remainingAmount']) && reminder(row.reminder) &&
      (row.contactId === undefined || contacts.has(row.contactId));
    if (!records(value.consulateAppointments) || !value.consulateAppointments.every(row =>
      operation(row) && text(row.appointmentType) && date(row.submissionDate) && money(row.price) &&
      (row.cost === undefined || money(row.cost)) &&
      (row.costCurrency === undefined || currency(row.costCurrency)) &&
      ['pending','accepted','rejected','missing_docs'].includes(row.consulateResponse) &&
      ['registered','submitted','response','completed'].includes(row.timelineStage))) return false;
    if (!records(value.flightBookings) || !value.flightBookings.every(row =>
      operation(row) && texts(row,['pnr','airlineAndRoute','paymentMethod']) && date(row.bookingDate) &&
      currency(row.costCurrency) && amounts(row,['cost','sellingPrice']) && Number.isFinite(row.netProfit))) return false;
    if (!records(value.invoices) || !value.invoices.every(row =>
      texts(row,['invoiceNumber','customerId','customerName','customerPhone','createdBy']) &&
      ['draft','issued','partially_paid','paid','void'].includes(row.status) &&
      ['invoice','pro_forma','payment_receipt'].includes(row.documentClassification) &&
      currency(row.currency) && date(row.issueDate) && date(row.createdAt) && date(row.updatedAt) &&
      Number.isSafeInteger(row.version) &&
      ['documentDiscountMinor','subtotalMinor','discountTotalMinor','taxTotalMinor','totalMinor','paidMinor','creditedMinor','balanceDueMinor'].every(key => Number.isSafeInteger(row[key]) && row[key] >= 0) &&
      records(row.lines) && row.lines.every((line: any) => line.invoiceId === row.id && text(line.labelAr) && amounts(line,['quantity','unitPriceMinor','discountMinor','taxRate','taxMinor','totalMinor','sortOrder'])) &&
      records(row.payments) && row.payments.every((payment: any) => payment.invoiceId === row.id && Number.isSafeInteger(payment.amountMinor) && payment.amountMinor > 0 && currency(payment.currency) && date(payment.receivedAt) && ['cleared','reversed'].includes(payment.status)) &&
      records(row.creditNotes) && row.creditNotes.every((credit: any) => credit.invoiceId === row.id && Number.isSafeInteger(credit.amountMinor) && credit.amountMinor > 0 && currency(credit.currency) && date(credit.issuedAt) && ['applied','void'].includes(credit.status)) &&
      records(row.auditEvents) && row.auditEvents.every((event: any) => event.invoiceId === row.id && text(event.action) && date(event.timestamp)))) return false;
    if (!object(value.documentSettings) || !texts(value.documentSettings, ['tradingNameAr','tradingNameEn','legalEntityName','headquartersAr','phone','email','website','invoicePrefix']) ||
      !Number.isSafeInteger(value.documentSettings.nextSequenceNumber) || value.documentSettings.nextSequenceNumber < 1 ||
      !money(value.documentSettings.defaultTaxRate)) return false;
    if (!object(value.exchangeRates) || !['USD','EUR','TRY','MAD'].every(key => Number.isFinite(value.exchangeRates[key]) && value.exchangeRates[key] > 0)) return false;
    return object(value.systemLists) && ['appointmentTypes','airlines','paymentMethods'].every(key =>
      Array.isArray(value.systemLists[key]) && value.systemLists[key].length <= 1000 && value.systemLists[key].every(text));
  } catch { return false; }
}
