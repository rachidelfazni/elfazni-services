import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

function sanitizeId(raw: string): string {
  return String(raw || `id_${Date.now()}`)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 120);
}

/**
 * Directly writes a mobile/desktop visitor event to Firestore so that even across
 * different preview/shared URLs (ais-pre vs ais-dev), the visit is immediately captured.
 */
export async function pushVisitorEventToCloud(payload: {
  visitorId: string;
  device: string;
  browser: string;
  country: string;
  flag?: string;
  city?: string;
  page: string;
  action?: string;
  durationSec?: number;
  screenW?: number;
  maxTouchPoints?: number;
}): Promise<void> {
  const eventId = sanitizeId(`${payload.visitorId}_${Date.now()}`);
  const path = `visitor_events/${eventId}`;
  try {
    await setDoc(doc(db, 'visitor_events', eventId), {
      visitorId: sanitizeId(payload.visitorId),
      device: String(payload.device || 'الهاتف الذكي').slice(0, 120),
      browser: String(payload.browser || 'متصفح الويب').slice(0, 120),
      country: String(payload.country || 'المغرب').slice(0, 120),
      flag: String(payload.flag || '🇲🇦').slice(0, 32),
      city: String(payload.city || 'الدار البيضاء').slice(0, 120),
      page: String(payload.page || '/').slice(0, 300),
      action: String(payload.action || 'زيارة وتصفح').slice(0, 300),
      durationSec: Number(payload.durationSec) || 0,
      screenW: Number(payload.screenW) || 0,
      maxTouchPoints: Number(payload.maxTouchPoints) || 0,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Logged via handleFirestoreError
    }
  }
}

/**
 * Directly writes a support ticket to Firestore for cross-instance guarantee.
 */
export async function pushTicketToCloud(ticket: {
  id: string;
  ticketNumber: string;
  name: string;
  phone: string;
  email?: string;
  serviceRequested?: string;
  subject?: string;
  message: string;
  status?: string;
  source?: string;
  country?: string;
}): Promise<void> {
  const docId = sanitizeId(ticket.ticketNumber || ticket.id);
  const path = `tickets/${docId}`;
  try {
    await setDoc(doc(db, 'tickets', docId), {
      id: sanitizeId(ticket.id),
      ticketNumber: String(ticket.ticketNumber).slice(0, 64),
      name: String(ticket.name || 'عميل').slice(0, 200),
      phone: String(ticket.phone || '-').slice(0, 80),
      email: String(ticket.email || '').slice(0, 200),
      serviceRequested: String(ticket.serviceRequested || 'خدمات عامة').slice(0, 200),
      subject: String(ticket.subject || 'طلب خدمة').slice(0, 300),
      message: String(ticket.message || '-').slice(0, 5000),
      status: 'new',
      source: String(ticket.source || 'الموقع').slice(0, 200),
      country: String(ticket.country || 'المغرب 🇲🇦').slice(0, 120),
      repliesJson: '[]',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Logged via handleFirestoreError
    }
  }
}

/**
 * Directly writes a live chat message to Firestore so mobile messages arrive immediately across any URL.
 */
export async function pushChatMessageToCloud(msg: {
  id: string;
  sessionId: string;
  visitorId?: string;
  sender: 'admin' | 'visitor';
  senderName: string;
  visitorPhone?: string;
  visitorCountry?: string;
  device?: string;
  text: string;
}): Promise<void> {
  const docId = sanitizeId(msg.id);
  const path = `live_chat_messages/${docId}`;
  try {
    await setDoc(doc(db, 'live_chat_messages', docId), {
      id: docId,
      sessionId: sanitizeId(msg.sessionId),
      visitorId: sanitizeId(msg.visitorId || msg.sessionId),
      sender: msg.sender === 'admin' ? 'admin' : 'visitor',
      senderName: String(msg.senderName || 'زائر').slice(0, 200),
      visitorPhone: String(msg.visitorPhone || '').slice(0, 80),
      visitorCountry: String(msg.visitorCountry || 'المغرب 🇲🇦').slice(0, 120),
      device: String(msg.device || 'الهاتف الذكي').slice(0, 120),
      text: String(msg.text || 'مرفق').slice(0, 4000),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, path);
    } catch {
      // Logged via handleFirestoreError
    }
  }
}

export function subscribeToCloudSync(onSyncUpdate: (data: any) => void): () => void {
  const path = 'site_sync/global_state';
  return onSnapshot(
    doc(db, 'site_sync', 'global_state'),
    (snap) => {
      if (snap.exists()) {
        const raw = snap.data();
        if (raw?.payloadJson) {
          try {
            onSyncUpdate(JSON.parse(raw.payloadJson));
          } catch {
            // ignore parse error
          }
        }
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch {
        // Logged via handleFirestoreError
      }
    }
  );
}
