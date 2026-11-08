import { randomUUID } from 'node:crypto';
import { createCrmStore } from './crmStore';
import { normalizeContactPhone } from '../crm/src/utils/contactBook';
import type { CRMContact, ContactActivity } from '../crm/src/types/contactBook';

export interface InquirySyncData {
  name: string;
  phone?: string;
  email?: string;
  serviceRequested?: string;
  reference?: string;
  message?: string;
}

export function syncInquiryToCrmLead(inquiry: InquirySyncData): { matched: boolean; contactId: string } | null {
  try {
    const store = createCrmStore();
    const current = store.read();
    if (!current.data || !current.data.contactBook) {
      return null;
    }

    const normPhone = inquiry.phone ? normalizeContactPhone(inquiry.phone) : '';
    const normEmail = inquiry.email ? inquiry.email.trim().toLowerCase() : '';

    let matchedContact = current.data.contactBook.contacts.find((c) => {
      if (normPhone && normPhone.length >= 6) {
        const cPhone = normalizeContactPhone(c.phone || '');
        if (cPhone && (cPhone === normPhone || cPhone.endsWith(normPhone) || normPhone.endsWith(cPhone))) {
          return true;
        }
      }
      if (normEmail && c.email) {
        if (c.email.trim().toLowerCase() === normEmail) {
          return true;
        }
      }
      return false;
    });

    const now = new Date().toISOString();
    let contactId = '';
    let isMatched = false;

    if (matchedContact) {
      isMatched = true;
      contactId = matchedContact.id;
      matchedContact.updatedAt = now;
      const activity: ContactActivity = {
        id: randomUUID(),
        contactId: matchedContact.id,
        kind: 'message',
        text: `استفسار جديد [${inquiry.reference || ''}]: ${inquiry.serviceRequested || 'خدمة'} - ${inquiry.message || ''}`.slice(0, 1000),
        occurredAt: now,
        createdAt: now,
      };
      current.data.contactBook.activities.push(activity);
    } else {
      isMatched = false;
      contactId = randomUUID();
      const newContact: CRMContact = {
        id: contactId,
        name: inquiry.name.trim() || 'عميل محتمل',
        phone: inquiry.phone ? inquiry.phone.trim() : '',
        email: inquiry.email ? inquiry.email.trim() : '',
        status: 'lead',
        rating: 3,
        notes: `طلب قادم من الموقع [${inquiry.reference || ''}]: ${inquiry.serviceRequested || ''}`,
        latestAgreement: '',
        createdAt: now,
        updatedAt: now,
      };
      current.data.contactBook.contacts.push(newContact);

      const activity: ContactActivity = {
        id: randomUUID(),
        contactId,
        kind: 'message',
        text: `تم إنشاء العميل المحتمل تلقائياً من طلب [${inquiry.reference || ''}]: ${inquiry.serviceRequested || ''}`,
        occurredAt: now,
        createdAt: now,
      };
      current.data.contactBook.activities.push(activity);
    }

    store.save(current.data, current.revision, 'sync-inq-' + randomUUID(), 'lead_inquiry_sync');
    return { matched: isMatched, contactId };
  } catch (err) {
    console.warn('[CRM Sync] Failed to sync inquiry to CRM lead:', err);
    return null;
  }
}
