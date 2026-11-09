import { isEmailAddress, sendEmail } from './mail';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  query,
} from 'firebase/firestore';
import { DatabaseSchema, readDb, writeDb, computeTrafficPeriods, ServiceTag, FollowUpStatus } from './db';
import { broadcastRealtime, getConnectedClientCount } from './realtime';

const SERVER_INSTANCE_ID = `srv_${process.pid}_${Math.random().toString(36).slice(2, 8)}`;

export interface SystemLogItem {
  id: string;
  level: 'info' | 'success' | 'warn' | 'error';
  module: string;
  message: string;
  timestamp: string;
}

export interface EmailNotificationLog {
  id: string;
  recipient: string;
  subject: string;
  ticketNumber?: string;
  reference?: string;
  serviceTag?: ServiceTag;
  senderName: string;
  senderPhone: string;
  channel: string;
  status: 'accepted' | 'not_configured' | 'failed';
  sentAt: string;
}

const systemLogs: SystemLogItem[] = [];
const emailLogs: EmailNotificationLog[] = [];
let cloudConnected = false;
let lastCloudSyncAt: string | null = null;
let lastPushedHash = '';
let isApplyingRemoteUpdate = false;

export function recordSystemLog(
  level: 'info' | 'success' | 'warn' | 'error',
  module: string,
  message: string
) {
  const entry: SystemLogItem = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    level,
    module,
    message,
    timestamp: new Date().toISOString(),
  };
  systemLogs.unshift(entry);
  if (systemLogs.length > 80) {
    systemLogs.length = 80;
  }
}

export interface DispatchEmailAlertParams {
  ticketNumber?: string;
  reference?: string;
  serviceTag?: ServiceTag;
  followUpStatus?: FollowUpStatus;
  needsFollowUp?: boolean;
  senderName: string;
  senderPhone: string;
  senderWhatsapp?: string;
  senderEmail?: string;
  serviceRequested?: string;
  subject?: string;
  message: string;
  device?: string;
  country?: string;
  details?: Record<string, any>;
  source?: string;
}

export async function dispatchAdminEmailAlert(params: DispatchEmailAlertParams) {
  const db = readDb();
  const adminEmail = process.env.SMTP_ADMIN_TO || db.settings?.email || 'contact@elfazni.com';
  
  const tag: ServiceTag = params.serviceTag || 'GENERAL';
  const refCode = params.reference || params.ticketNumber || `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  // Format standard subject line strictly adhering to: [ELFAZNI][NEW][<SERVICE>][FOLLOW-UP] <title> — REQ-...
  const serviceLabelMap: Record<ServiceTag, string> = {
    FLIGHT: 'طلب حجز طيران جديد',
    HOTEL: 'طلب حجز فندق جديد',
    TRANSFER: 'طلب سيارة / توصيل',
    CONSULAR: 'طلب موعد قنصلي',
    GENERAL: 'استفسار جديد',
    OFFLINE_CHAT: 'رسالة أثناء عدم التواجد',
  };

  let finalSubject: string;
  if (params.followUpStatus === 'INCOMPLETE_CONSENTED') {
    finalSubject = `[ELFAZNI][FOLLOW-UP][INCOMPLETE] استفسار غير مكتمل — بيانات محفوظة — ${refCode}`;
  } else if (params.subject && params.subject.startsWith('[ELFAZNI]')) {
    finalSubject = params.subject;
  } else {
    const descriptiveTitle = params.subject || serviceLabelMap[tag] || 'طلب خدمة جديد';
    finalSubject = `[ELFAZNI][NEW][${tag}][FOLLOW-UP] ${descriptiveTitle} — ${refCode}`;
  }

  // Plain text fallback
  const plainText = [
    `🏷️ رقم الطلب / المرجع: ${refCode}`,
    `📌 الخدمة: ${tag} (${params.serviceRequested || serviceLabelMap[tag]})`,
    `⚠️ حالة المتابعة: يحتاج متابعة (FOLLOW-UP REQUIRED)`,
    `👤 الاسم: ${params.senderName}`,
    `📱 الهاتف: ${params.senderPhone}`,
    params.senderWhatsapp ? `💬 واتساب: ${params.senderWhatsapp}` : null,
    params.senderEmail ? `✉️ البريد: ${params.senderEmail}` : null,
    params.country ? `🌍 الدولة / المنطقة: ${params.country}` : null,
    params.source ? `📍 المصدر: ${params.source}` : null,
    params.device ? `💻 الجهاز: ${params.device}` : null,
    `----------------------------------------`,
    `📝 تفاصيل الرسالة والطلب:`,
    params.message,
    `----------------------------------------`,
    `بوابة الإدارة: ${process.env.ADMIN_URL || 'http://localhost:8080/portal'}`,
  ].filter(Boolean).join('\n');

  // Rich HTML template with authentic branding
  const htmlBody = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${finalSubject}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Bahij TheSansArabic', Arial, sans-serif; color: #1E293B; line-height: 1.6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #E2E8F0;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #0B2E57 0%, #004AA5 100%); padding: 28px 32px; text-align: center;">
        <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.5px;">ELFAZNI SERVICES</h1>
        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #CC9048;">الفزني للخدمات العامة والسياحية</p>
      </td>
    </tr>

    <!-- Badges Row -->
    <tr>
      <td style="padding: 24px 32px 12px 32px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: right;">
              <span style="display: inline-block; background-color: #EAF4FA; color: #004AA5; border: 1px solid #BCE0F5; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; margin-left: 8px;">
                ${serviceLabelMap[tag]} [${tag}]
              </span>
              <span style="display: inline-block; background-color: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 800;">
                🔴 يحتاج متابعة (FOLLOW-UP REQUIRED)
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Reference & Timestamp -->
    <tr>
      <td style="padding: 0 32px 20px 32px;">
        <div style="background-color: #F1F5F9; border-radius: 10px; padding: 12px 18px; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 13px; color: #64748B;">المرجع: <strong style="color: #0B2E57; font-size: 14px; font-family: monospace;">${refCode}</strong></div>
          <div style="font-size: 12px; color: #64748B;">الوقت: <strong>${new Date().toLocaleString('ar-MA')}</strong></div>
        </div>
      </td>
    </tr>

    <!-- Customer Information Table -->
    <tr>
      <td style="padding: 0 32px 20px 32px;">
        <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0B2E57; border-bottom: 2px solid #E2E8F0; padding-bottom: 6px;">بيانات العميل والتواصل</h3>
        <table role="presentation" width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px;">
          <tr>
            <td width="35%" style="color: #64748B; font-weight: 600;">اسم العميل:</td>
            <td width="65%" style="color: #0F172A; font-weight: 700;">${params.senderName}</td>
          </tr>
          <tr>
            <td style="color: #64748B; font-weight: 600;">رقم الهاتف:</td>
            <td style="color: #0F172A; font-weight: 700; font-family: monospace;"><a href="tel:${params.senderPhone}" style="color: #004AA5; text-decoration: none;">${params.senderPhone}</a></td>
          </tr>
          ${params.senderWhatsapp ? `
          <tr>
            <td style="color: #64748B; font-weight: 600;">واتساب مباشر:</td>
            <td style="color: #0F172A; font-weight: 700; font-family: monospace;"><a href="https://wa.me/${params.senderWhatsapp.replace(/[^0-9]/g, '')}" style="color: #16A34A; text-decoration: none;">${params.senderWhatsapp} 💬</a></td>
          </tr>` : ''}
          ${params.senderEmail ? `
          <tr>
            <td style="color: #64748B; font-weight: 600;">البريد الإلكتروني:</td>
            <td style="color: #0F172A; font-weight: 700;"><a href="mailto:${params.senderEmail}" style="color: #004AA5; text-decoration: none;">${params.senderEmail}</a></td>
          </tr>` : ''}
          ${params.country ? `
          <tr>
            <td style="color: #64748B; font-weight: 600;">الموقع / الدولة:</td>
            <td style="color: #0F172A;">${params.country}</td>
          </tr>` : ''}
          ${params.source ? `
          <tr>
            <td style="color: #64748B; font-weight: 600;">مصدر الطلب:</td>
            <td style="color: #0F172A;">${params.source}</td>
          </tr>` : ''}
        </table>
      </td>
    </tr>

    <!-- Message & Details Box -->
    <tr>
      <td style="padding: 0 32px 28px 32px;">
        <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #0B2E57; border-bottom: 2px solid #E2E8F0; padding-bottom: 6px;">تفاصيل الطلب والرسالة</h3>
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 20px; font-size: 14px; white-space: pre-wrap; color: #334155; line-height: 1.7;">${params.message}</div>
      </td>
    </tr>

    <!-- Action Button -->
    <tr>
      <td style="padding: 0 32px 32px 32px; text-align: center;">
        <a href="${process.env.ADMIN_URL || 'http://localhost:8080/portal'}" style="display: inline-block; background: linear-gradient(135deg, #004AA5 0%, #0B2E57 100%); color: #FFFFFF; font-size: 15px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 74, 165, 0.25);">
          فتح الطلب في بوابة الإدارة ⬅
        </a>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #F8FAFC; padding: 18px 32px; text-align: center; border-top: 1px solid #E2E8F0; font-size: 12px; color: #94A3B8;">
        نظام التنبيهات الموحد — ELFAZNI SERVICES · الفزني سيرفيسز<br />
        هذا إشعار تلقائي داخلي موجه لإدارة الموقع لمتابعة طلبات العملاء فور ورودها.
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const status = await sendEmail({
    to: adminEmail,
    subject: finalSubject,
    text: plainText,
    html: htmlBody,
    replyTo: isEmailAddress(params.senderEmail) ? params.senderEmail : undefined,
  });

  const logEntry: EmailNotificationLog = {
    id: `em_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    recipient: adminEmail,
    subject: finalSubject,
    ticketNumber: refCode,
    reference: refCode,
    serviceTag: tag,
    senderName: params.senderName,
    senderPhone: params.senderPhone,
    channel: params.source || params.device || 'الموقع الإلكتروني',
    status,
    sentAt: new Date().toISOString(),
  };

  emailLogs.unshift(logEntry);
  if (emailLogs.length > 50) {
    emailLogs.length = 50;
  }

  recordSystemLog(
    status === 'accepted' ? 'success' : 'warn',
    'EmailBridge',
    `SMTP: ${status} — [${tag}] ${refCode} — ${finalSubject.slice(0, 45)}...`
  );

  return logEntry;
}

function getFirebaseDb() {
  if (process.env.ENABLE_LEGACY_FIREBASE_SYNC !== 'true') return null;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    if (!raw.projectId || !raw.apiKey) return null;
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(raw);
    return getFirestore(app, raw.firestoreDatabaseId);
  } catch (err) {
    console.warn('CloudSync initialization warning:', err);
    return null;
  }
}

function buildCompactStatePayload(db: DatabaseSchema): string {
  // Strip any oversized base64 media from cloud sync document to stay well below Firestore 1MB doc limit
  const safeCopy: Partial<DatabaseSchema> = {
    categories: db.categories,
    posts: (db.posts || []).map((p) => ({
      ...p,
      coverImage: p.coverImage && p.coverImage.length > 5000 ? '/assets/slides/10-all-services.webp' : p.coverImage,
    })),
    services: (db.services || []).map((s) => ({
      ...s,
      image: s.image && s.image.length > 5000 ? '/assets/slides/10-all-services.webp' : s.image,
    })),
    settings: {
      ...db.settings,
      founderImage:
        db.settings?.founderImage && db.settings.founderImage.length > 5000
          ? '/assets/founder-rachid-elfazni-v2.webp'
          : db.settings?.founderImage,
    },
    seoPages: db.seoPages,
    messages: (db.messages || []).slice(0, 80).map((m) => ({
      ...m,
      attachments: (m.attachments || []).map((a) => ({
        ...a,
        url: a.url && a.url.length > 2000 ? '[مرفق محفوظ محلياً]' : a.url,
      })),
    })),
    chatStatus: db.chatStatus,
    chatSessions: (db.chatSessions || []).slice(0, 60),
    chatMessages: (db.chatMessages || []).slice(-120).map((cm) => ({
      ...cm,
      attachmentUrl: cm.attachmentUrl && cm.attachmentUrl.length > 2000 ? undefined : cm.attachmentUrl,
    })),
    analytics: db.analytics
      ? {
          ...db.analytics,
          recentVisits: (db.analytics.recentVisits || []).slice(0, 30),
          visitTimestamps: (db.analytics.visitTimestamps || []).slice(-200),
          uniqueVisitorIds: (db.analytics.uniqueVisitorIds || []).slice(-300),
        }
      : undefined,
  };
  return JSON.stringify(safeCopy);
}

let pushDebounceTimer: NodeJS.Timeout | null = null;

export function scheduleCloudStatePush(db: DatabaseSchema): void {
  if (isApplyingRemoteUpdate) return;
  if (pushDebounceTimer) clearTimeout(pushDebounceTimer);

  pushDebounceTimer = setTimeout(async () => {
    const firestore = getFirebaseDb();
    if (!firestore) return;

    try {
      const payloadJson = buildCompactStatePayload(db);
      if (payloadJson === lastPushedHash || payloadJson.length > 920000) return;
      lastPushedHash = payloadJson;

      await setDoc(doc(firestore, 'site_sync', 'global_state'), {
        updatedAt: new Date().toISOString(),
        instanceId: SERVER_INSTANCE_ID,
        payloadJson,
      });
      cloudConnected = true;
      lastCloudSyncAt = new Date().toISOString();
    } catch (err) {
      recordSystemLog('warn', 'CloudSync', `تعذر رفع نسخة التزامن السحابي: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, 350);
}

export async function initCloudSync(): Promise<void> {
  const firestore = getFirebaseDb();
  if (!firestore) {
    recordSystemLog('warn', 'CloudSync', 'لم يتم العثور على إعدادات Firebase السحابية، يعمل النظام بالتخزين المحلي.');
    return;
  }

  recordSystemLog('info', 'CloudSync', 'بدء الاتصال بقاعدة بيانات Firebase Firestore الموحدة لتزامن الهواتف والزيارات...');

  try {
    // 1. Check initial remote state
    const remoteSnap = await getDoc(doc(firestore, 'site_sync', 'global_state'));
    const localDb = readDb();

    if (remoteSnap.exists()) {
      const data = remoteSnap.data();
      if (data?.payloadJson) {
        mergeRemoteStateIntoLocal(JSON.parse(data.payloadJson));
      }
    } else {
      scheduleCloudStatePush(localDb);
    }
    cloudConnected = true;
    lastCloudSyncAt = new Date().toISOString();
    recordSystemLog('success', 'CloudSync', 'تم الربط الفوري مع قاعدة البيانات السحابية الموحدة بنجاح.');
  } catch (err) {
    recordSystemLog('warn', 'CloudSync', `تنبيه اتصال أولي بـ Firestore: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 2. Listen to unified state updates from other instances (e.g. ais-pre mobile vs ais-dev admin)
  onSnapshot(
    doc(firestore, 'site_sync', 'global_state'),
    (snap) => {
      cloudConnected = true;
      lastCloudSyncAt = new Date().toISOString();
      if (!snap.exists()) return;
      const raw = snap.data();
      if (!raw || raw.instanceId === SERVER_INSTANCE_ID || !raw.payloadJson) return;
      try {
        const parsed = JSON.parse(raw.payloadJson);
        mergeRemoteStateIntoLocal(parsed);
      } catch {
        // ignore parse error
      }
    },
    () => {
      cloudConnected = false;
    }
  );

  // 3. Listen directly to visitor_events collection for instant mobile visits/beacons
  const processedVisitEventIds = new Set<string>();
  let initialVisitsLoaded = false;

  onSnapshot(
    query(collection(firestore, 'visitor_events')),
    (snapshot) => {
      cloudConnected = true;
      if (!initialVisitsLoaded) {
        snapshot.docs.forEach((d) => processedVisitEventIds.add(d.id));
        initialVisitsLoaded = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const docId = change.doc.id;
          if (processedVisitEventIds.has(docId)) return;
          processedVisitEventIds.add(docId);

          const ev = change.doc.data();
          if (!ev || !ev.visitorId) return;
          ingestCloudVisitorEvent(ev);
        }
      });
    },
    () => {}
  );

  // 4. Listen directly to tickets collection for mobile contact messages
  const processedTicketIds = new Set<string>();
  let initialTicketsLoaded = false;

  onSnapshot(
    query(collection(firestore, 'tickets')),
    (snapshot) => {
      if (!initialTicketsLoaded) {
        snapshot.docs.forEach((d) => processedTicketIds.add(d.id));
        initialTicketsLoaded = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docId = change.doc.id;
          if (processedTicketIds.has(docId)) return;
          processedTicketIds.add(docId);

          const tk = change.doc.data();
          if (!tk || !tk.ticketNumber) return;
          ingestCloudTicket(tk);
        }
      });
    },
    () => {}
  );

  // 5. Listen directly to live_chat_messages collection for instant mobile chat messages
  const processedChatMsgIds = new Set<string>();
  let initialChatLoaded = false;

  onSnapshot(
    query(collection(firestore, 'live_chat_messages')),
    (snapshot) => {
      if (!initialChatLoaded) {
        snapshot.docs.forEach((d) => processedChatMsgIds.add(d.id));
        initialChatLoaded = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docId = change.doc.id;
          if (processedChatMsgIds.has(docId)) return;
          processedChatMsgIds.add(docId);

          const cm = change.doc.data();
          if (!cm || !cm.id) return;
          ingestCloudChatMessage(cm);
        }
      });
    },
    () => {}
  );
}

function mergeRemoteStateIntoLocal(remote: Partial<DatabaseSchema>) {
  isApplyingRemoteUpdate = true;
  try {
    const db = readDb();
    let changed = false;

    // Merge messages by ID
    if (Array.isArray(remote.messages)) {
      const existingIds = new Set(db.messages.map((m) => m.id));
      for (const msg of remote.messages) {
        if (!existingIds.has(msg.id)) {
          db.messages.unshift(msg);
          changed = true;
          broadcastRealtime('mailbox:new', {
            message: msg,
            unreadCount: db.messages.filter((m) => m.status === 'new').length,
          });
        } else {
          const localMsg = db.messages.find((m) => m.id === msg.id);
          if (localMsg && (msg.replies?.length || 0) > (localMsg.replies?.length || 0)) {
            localMsg.replies = msg.replies;
            localMsg.status = msg.status;
            changed = true;
          }
        }
      }
    }

    // Merge chat sessions & chat messages
    if (Array.isArray(remote.chatSessions)) {
      if (!db.chatSessions) db.chatSessions = [];
      const existingSessionIds = new Set(db.chatSessions.map((s) => s.id));
      for (const sess of remote.chatSessions) {
        if (!existingSessionIds.has(sess.id)) {
          db.chatSessions.unshift(sess);
          changed = true;
          broadcastRealtime('chat:session', { session: sess });
        }
      }
    }

    if (Array.isArray(remote.chatMessages)) {
      if (!db.chatMessages) db.chatMessages = [];
      const existingMsgIds = new Set(db.chatMessages.map((m) => m.id));
      for (const cmsg of remote.chatMessages) {
        if (!existingMsgIds.has(cmsg.id)) {
          db.chatMessages.push(cmsg);
          changed = true;
          const sess = db.chatSessions?.find((s) => s.id === cmsg.sessionId);
          broadcastRealtime('chat:message', {
            sessionId: cmsg.sessionId,
            message: cmsg,
            session: sess,
          });
        }
      }
    }

    // Merge analytics if remote has newer/higher visits
    if (remote.analytics && db.analytics) {
      if ((remote.analytics.totalVisits || 0) > (db.analytics.totalVisits || 0)) {
        db.analytics.totalVisits = remote.analytics.totalVisits;
        db.analytics.uniqueVisitorIds = Array.from(
          new Set([...(db.analytics.uniqueVisitorIds || []), ...(remote.analytics.uniqueVisitorIds || [])])
        );
        db.analytics.uniqueVisitors = db.analytics.uniqueVisitorIds.length;
        db.analytics.deviceBreakdown = remote.analytics.deviceBreakdown || db.analytics.deviceBreakdown;
        db.analytics.recentVisits = remote.analytics.recentVisits || db.analytics.recentVisits;
        db.analytics.topCountries = remote.analytics.topCountries || db.analytics.topCountries;
        db.analytics.activeSessions = {
          ...(db.analytics.activeSessions || {}),
          ...(remote.analytics.activeSessions || {}),
        };
        db.analytics.activeVisitors = Object.keys(db.analytics.activeSessions).length;
        db.analytics.trafficPeriods = computeTrafficPeriods(db);
        db.analytics.trafficHistory = db.analytics.trafficPeriods.weekly;
        changed = true;

        broadcastRealtime('analytics:visit', {
          newVisit: db.analytics.recentVisits?.[0],
          totalVisits: db.analytics.totalVisits,
          uniqueVisitors: db.analytics.uniqueVisitors,
          activeVisitors: db.analytics.activeVisitors,
          deviceBreakdown: db.analytics.deviceBreakdown,
          recentVisits: db.analytics.recentVisits,
          topCountries: db.analytics.topCountries,
          trafficHistory: db.analytics.trafficHistory,
          trafficPeriods: db.analytics.trafficPeriods,
        });
      }
    }

    if (changed) {
      writeDb(db, true);
    }
  } finally {
    isApplyingRemoteUpdate = false;
  }
}

function ingestCloudVisitorEvent(ev: any) {
  isApplyingRemoteUpdate = true;
  try {
    const db = readDb();
    if (!db.analytics) return;

    const page = String(ev.page || '/');
    if (page.startsWith('/admin')) return;

    const vid = String(ev.visitorId);
    if (!db.analytics.uniqueVisitorIds) db.analytics.uniqueVisitorIds = [];
    if (!db.analytics.activeSessions) db.analytics.activeSessions = {};

    db.analytics.activeSessions[vid] = Date.now();

    // Check if this exact visit was already logged in the last 3 seconds by local API
    const recentFirst = db.analytics.recentVisits?.[0];
    if (
      recentFirst &&
      recentFirst.device === ev.device &&
      recentFirst.action === ev.action &&
      recentFirst.timestamp &&
      Math.abs(Date.now() - new Date(recentFirst.timestamp).getTime()) < 3500
    ) {
      return;
    }

    const isNewUnique = !db.analytics.uniqueVisitorIds.includes(vid);
    if (isNewUnique) {
      db.analytics.uniqueVisitorIds.push(vid);
    }
    db.analytics.uniqueVisitors = db.analytics.uniqueVisitorIds.length;
    db.analytics.totalVisits += 1;

    const now = Date.now();
    for (const [id, ts] of Object.entries(db.analytics.activeSessions)) {
      if (now - Number(ts) > 180000) delete db.analytics.activeSessions[id];
    }
    db.analytics.activeVisitors = Object.keys(db.analytics.activeSessions).length;

    const devLower = String(ev.device || '').toLowerCase();
    if (devLower.includes('iphone') || devLower.includes('آيفون') || devLower.includes('أندرويد') || devLower.includes('هاتف')) {
      db.analytics.deviceBreakdown.mobile += 1;
    } else if (devLower.includes('ipad') || devLower.includes('آيباد') || devLower.includes('لوحي')) {
      db.analytics.deviceBreakdown.tablet += 1;
    } else {
      db.analytics.deviceBreakdown.desktop += 1;
    }

    const nowIso = ev.createdAt || new Date().toISOString();
    if (!db.analytics.visitTimestamps) db.analytics.visitTimestamps = [];
    db.analytics.visitTimestamps.push(nowIso);

    const durationLabel =
      ev.durationSec && Number(ev.durationSec) > 0
        ? ` (${Math.round(Number(ev.durationSec))} ثانية)`
        : '';

    const newVisit = {
      id: `v_cloud_${Date.now()}_${Math.floor(Math.random() * 999)}`,
      country: ev.country || 'المغرب',
      flag: ev.flag || '🇲🇦',
      city: ev.city || 'الدار البيضاء',
      device: ev.device || 'هاتف ذكي',
      browser: ev.browser || 'Safari',
      page: page === '/' ? 'الصفحة الرئيسية' : page,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      action: `${ev.action || 'زيارة من الهاتف'}${durationLabel}`,
      timestamp: nowIso,
    };

    db.analytics.recentVisits.unshift(newVisit);
    if (db.analytics.recentVisits.length > 30) {
      db.analytics.recentVisits = db.analytics.recentVisits.slice(0, 30);
    }

    db.analytics.trafficPeriods = computeTrafficPeriods(db);
    db.analytics.trafficHistory = db.analytics.trafficPeriods.weekly;

    writeDb(db, true);
    recordSystemLog('info', 'MobileTracker', `استشعار فوري لزائر من ${newVisit.device} (${newVisit.city}) - ${newVisit.action}`);

    broadcastRealtime('analytics:visit', {
      newVisit,
      totalVisits: db.analytics.totalVisits,
      uniqueVisitors: db.analytics.uniqueVisitors,
      activeVisitors: db.analytics.activeVisitors,
      deviceBreakdown: db.analytics.deviceBreakdown,
      recentVisits: db.analytics.recentVisits,
      topCountries: db.analytics.topCountries,
      trafficHistory: db.analytics.trafficHistory,
      trafficPeriods: db.analytics.trafficPeriods,
    });
  } finally {
    isApplyingRemoteUpdate = false;
  }
}

function ingestCloudTicket(tk: any) {
  isApplyingRemoteUpdate = true;
  try {
    const db = readDb();
    const exists = db.messages.some(
      (m) => m.ticketNumber === tk.ticketNumber || m.id === tk.id
    );
    if (exists) return;

    const newMsg = {
      id: tk.id || `msg_${Date.now()}`,
      ticketNumber: tk.ticketNumber,
      name: tk.name,
      phone: tk.phone,
      email: tk.email || undefined,
      serviceRequested: tk.serviceRequested || 'خدمات عامة',
      subject: tk.subject || 'طلب خدمة من الهاتف',
      message: tk.message,
      folder: 'inbox' as const,
      status: 'new' as const,
      starred: false,
      country: tk.country || 'المغرب 🇲🇦',
      attachments: [],
      replies: [],
      source: tk.source || 'تزامن سحابي فوري (الهاتف)',
      createdAt: tk.createdAt || new Date().toISOString(),
    };

    db.messages.unshift(newMsg);
    writeDb(db, true);

    dispatchAdminEmailAlert({
      ticketNumber: newMsg.ticketNumber,
      senderName: newMsg.name,
      senderPhone: newMsg.phone,
      senderEmail: newMsg.email,
      serviceRequested: newMsg.serviceRequested,
      subject: newMsg.subject || 'رسالة واردة جديدة',
      message: newMsg.message,
      device: newMsg.source,
      country: newMsg.country,
    });

    broadcastRealtime('mailbox:new', {
      message: newMsg,
      unreadCount: db.messages.filter((m) => m.status === 'new').length,
    });
  } finally {
    isApplyingRemoteUpdate = false;
  }
}

function ingestCloudChatMessage(cm: any) {
  isApplyingRemoteUpdate = true;
  try {
    const db = readDb();
    if (!db.chatMessages) db.chatMessages = [];
    if (!db.chatSessions) db.chatSessions = [];

    if (db.chatMessages.some((m) => m.id === cm.id)) return;

    let session = db.chatSessions.find(
      (s) => s.id === cm.sessionId || (cm.visitorId && s.visitorId === cm.visitorId && s.status === 'active')
    );

    if (!session) {
      session = {
        id: cm.sessionId,
        visitorId: cm.visitorId || cm.sessionId,
        visitorName: cm.senderName || `زائر (${cm.device || 'هاتف ذكي'})`,
        visitorPhone: cm.visitorPhone || '',
        visitorCountry: cm.visitorCountry || 'المغرب 🇲🇦',
        currentPage: 'الرئيسية',
        unreadAdmin: cm.sender === 'visitor' ? 1 : 0,
        unreadVisitor: cm.sender === 'admin' ? 1 : 0,
        createdAt: cm.createdAt || new Date().toISOString(),
        lastMessageAt: cm.createdAt || new Date().toISOString(),
        status: 'active',
      };
      db.chatSessions.unshift(session);
      broadcastRealtime('chat:session', { session });
    } else {
      session.lastMessageAt = cm.createdAt || new Date().toISOString();
      if (cm.sender === 'visitor') {
        session.unreadAdmin = (session.unreadAdmin || 0) + 1;
      } else {
        session.unreadVisitor = (session.unreadVisitor || 0) + 1;
      }
    }

    const newMsg = {
      id: cm.id,
      sessionId: session.id,
      sender: (cm.sender === 'admin' ? 'admin' : 'visitor') as 'admin' | 'visitor',
      senderName: cm.senderName || 'زائر',
      text: cm.text || '',
      createdAt: cm.createdAt || new Date().toISOString(),
    };

    db.chatMessages.push(newMsg);
    writeDb(db, true);

    if (newMsg.sender === 'visitor') {
      dispatchAdminEmailAlert({
        senderName: newMsg.senderName,
        senderPhone: session.visitorPhone || 'محادثة فورية',
        subject: `رسالة محادثة فورية جديدة من ${newMsg.senderName}`,
        message: newMsg.text,
        device: cm.device || 'الهاتف المحمول',
        country: session.visitorCountry,
      });
    }

    broadcastRealtime('chat:message', {
      sessionId: session.id,
      message: newMsg,
      session,
    });
  } finally {
    isApplyingRemoteUpdate = false;
  }
}

export function getSystemHealthReport() {
  const db = readDb();
  const mem = process.memoryUsage();
  return {
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    memoryMb: Math.round(mem.rss / (1024 * 1024)),
    heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024)),
    cloudConnected,
    lastCloudSyncAt: lastCloudSyncAt || new Date().toISOString(),
    activeRealtimeClients: getConnectedClientCount(),
    adminEmailTarget: 'rachidelfazni@gmail.com',
    counts: {
      posts: db.posts?.length || 0,
      services: db.services?.length || 0,
      seoPages: db.seoPages?.length || 0,
      messages: db.messages?.length || 0,
      chatSessions: db.chatSessions?.length || 0,
      totalVisits: db.analytics?.totalVisits || 0,
    },
    systemLogs: systemLogs.slice(0, 40),
    emailLogs: emailLogs.slice(0, 30),
  };
}
