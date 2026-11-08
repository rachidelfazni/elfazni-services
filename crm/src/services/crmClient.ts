import type { CrmEnvelope, CrmSnapshot } from './crmSnapshot';
import { DEFAULT_DOCUMENT_SETTINGS } from '../utils/invoiceCalculations';
import { DEFAULT_EXCHANGE_RATES } from '../utils/formatters';
import { initialSystemLists } from '../data/mockData';
import { emptyContactBook } from '../utils/contactBook';

export interface SavePacket { data: CrmSnapshot; revision: number; requestId: string }
export class StorageRequestError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function storageRequest<T>(path: string, body?: SavePacket): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('/admin/crm/api/' + path, {
      method: body ? 'PUT' : 'GET', credentials: 'same-origin', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-Elfazni-CRM': '1' },
      body: body ? JSON.stringify(body) : undefined, signal: controller.signal,
    });
    const result = await response.json();
    if (!response.ok) throw new StorageRequestError(response.status, result.error || 'تعذّر الاتصال بالخادم.');
    return result;
  } finally { window.clearTimeout(timeout); }
}
export function freshSnapshot(): CrmSnapshot {
  return {
    contactBook: emptyContactBook(), consulateAppointments: [], flightBookings: [], invoices: [],
    documentSettings: { ...DEFAULT_DOCUMENT_SETTINGS }, exchangeRates: { ...DEFAULT_EXCHANGE_RATES },
    systemLists: structuredClone(initialSystemLists),
  };
}
export function legacySnapshot(): CrmSnapshot {
  const result = freshSnapshot();
  const keys: Record<keyof CrmSnapshot, string> = {
    contactBook: 'elfazni_crm_contact_book_v1', consulateAppointments: 'elfazni_crm_consulate_v3',
    flightBookings: 'elfazni_crm_flight_v3', invoices: 'elfazni_crm_invoices_v1',
    documentSettings: 'elfazni_crm_doc_settings_v1', exchangeRates: 'elfazni_crm_exchange_rates_v3',
    systemLists: 'elfazni_crm_system_lists_v3',
  };
  for (const field of Object.keys(keys) as (keyof CrmSnapshot)[]) {
    const raw = localStorage.getItem(keys[field]);
    if (raw) (result as any)[field] = JSON.parse(raw);
  }
  result.documentSettings = { ...DEFAULT_DOCUMENT_SETTINGS, ...result.documentSettings };
  return result;
}
export function hasRecords(data: CrmSnapshot) {
  return data.contactBook.contacts.length + data.consulateAppointments.length + data.flightBookings.length + data.invoices.length > 0;
}
export function downloadSnapshot(data: CrmSnapshot, name = 'ELFAZNI-CRM-recovery') {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ app: 'ELFAZNI_SERVICES_CRM', version: 6, exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = name + '.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export type LoadedCrm = CrmEnvelope & { data: CrmSnapshot; recoveryKey: string };
