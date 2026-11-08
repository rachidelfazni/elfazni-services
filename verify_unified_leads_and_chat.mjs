import 'dotenv/config';
import { readDb } from './server/db.ts';
import { generateToken } from './server/auth.ts';

const BASE_URL = 'http://127.0.0.1:8080';

async function runTests() {
  console.log('--- STARTING UNIFIED LEADS & CHAT VERIFICATION ---');
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failCount++;
    }
  }

  try {
    // Generate valid admin bearer token for test authentication
    const db = readDb();
    const adminUser = db.users[0];
    if (!adminUser) throw new Error('No admin user found in database');
    const adminToken = generateToken(adminUser);
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // 1. Submit Flight booking request via /api/public/requests
    console.log('\n1. Testing Flight Service Intake...');
    const flightRes = await fetch(`${BASE_URL}/api/public/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'كريم البشير',
        phone: '+212612345678',
        whatsappPhone: '+212612345678',
        email: 'karim@example.com',
        serviceTag: 'FLIGHT',
        subject: 'حجز طيران الدار البيضاء - باريس',
        message: 'أحتاج حجز رحلة ذهاب وعودة الأسبوع القادم لشخصين.',
        country: 'المغرب 🇲🇦',
        payloadJson: {
          tripType: 'round',
          from: 'CMN - الدار البيضاء',
          to: 'CDG - باريس شارل ديغول',
          departureDate: '2026-11-15',
          returnDate: '2026-11-22',
          passengers: 2,
        },
      }),
    });
    const flightData = await flightRes.json();
    assert(flightRes.ok && flightData.success === true, 'Flight intake returned success');
    assert(flightData.reference && flightData.reference.startsWith('REQ-'), `Flight assigned valid reference: ${flightData.reference}`);
    const flightRef = flightData.reference;

    // 2. Submit Hotel request via /api/public/requests
    console.log('\n2. Testing Hotel Service Intake...');
    const hotelRes = await fetch(`${BASE_URL}/api/public/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'سارة العلمي',
        phone: '+212698765432',
        email: 'sara@example.com',
        serviceTag: 'HOTEL',
        subject: 'طلب حجز فندق في إسطنبول',
        message: 'فندق 5 نجوم في منطقة تقسيم لمدة 5 ليال.',
        payloadJson: {
          city: 'إسطنبول',
          nights: 5,
          guests: 2,
        },
      }),
    });
    const hotelData = await hotelRes.json();
    assert(hotelRes.ok && hotelData.success === true, 'Hotel intake returned success');
    assert(hotelData.reference && hotelData.reference.startsWith('REQ-'), `Hotel assigned valid reference: ${hotelData.reference}`);

    // 3. Submit Transfer request via /api/public/requests
    console.log('\n3. Testing Transfer Service Intake...');
    const transferRes = await fetch(`${BASE_URL}/api/public/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'عمر التازي',
        phone: '+212655443322',
        serviceTag: 'TRANSFER',
        subject: 'طلب توصيل من مطار محمد الخامس',
        message: 'استقبال من المطار إلى وسط المدينة بالرباط بسيارة VIP.',
        payloadJson: {
          origin: 'مطار محمد الخامس الدولي (CMN)',
          destination: 'الرباط - أكدال',
          vehicle: 'Mercedes V-Class VIP',
        },
      }),
    });
    const transferData = await transferRes.json();
    assert(transferRes.ok && transferData.success === true, 'Transfer intake returned success');
    assert(transferData.reference && transferData.reference.startsWith('REQ-'), `Transfer assigned valid reference: ${transferData.reference}`);

    // 4. Submit Consular request via /api/public/requests
    console.log('\n4. Testing Consular Service Intake...');
    const consularRes = await fetch(`${BASE_URL}/api/public/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'يوسف بنسليمان',
        phone: '+212611223344',
        email: 'youssef@example.com',
        serviceTag: 'CONSULAR',
        subject: 'استشارة تأشيرة شينغن فرنسا',
        message: 'طلب مراجعة ملف تأشيرة وحجز موعد TLScontact.',
        payloadJson: {
          mission: 'القنصلية الفرنسية بالرباط',
          serviceType: 'تأشيرة شينغن سياحية',
        },
      }),
    });
    const consularData = await consularRes.json();
    assert(consularRes.ok && consularData.success === true, 'Consular intake returned success');
    assert(consularData.reference && consularData.reference.startsWith('REQ-'), `Consular assigned valid reference: ${consularData.reference}`);

    // 5. Submit Offline Chat message via /api/public/offline-messages
    console.log('\n5. Testing Offline Live Chat Capture...');
    const visitorId = `vis_test_${Date.now()}`;
    const offlineRes = await fetch(`${BASE_URL}/api/public/offline-messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        name: 'طارق الزياني',
        phone: '+212677889900',
        whatsappPhone: '+212677889900',
        email: 'tariq@example.com',
        serviceCategory: 'flight',
        message: 'مرحباً، أرجو التواصل معي صباح الغد لتأكيد حجز تذاكر رحلة عاجلة إلى مدريد.',
        country: 'المغرب 🇲🇦',
      }),
    });
    const offlineData = await offlineRes.json();
    assert(offlineRes.ok && offlineData.success === true, 'Offline chat intake returned success');
    assert(offlineData.sessionId && offlineData.reference, `Offline message assigned sessionId: ${offlineData.sessionId} and reference: ${offlineData.reference}`);
    const offlineSessionId = offlineData.sessionId;

    // Verify chat session exists and has the message
    const chatSessionRes = await fetch(`${BASE_URL}/api/chat/messages/${offlineSessionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const chatSessionData = await chatSessionRes.json();
    assert(chatSessionRes.ok && chatSessionData.messages?.length > 0, 'Chat session contains initial offline visitor message');

    // 6. Admin Mailbox / Requests retrieval and filter checks
    console.log('\n6. Testing Admin Unified Inbox Retrieval & Filtering...');
    const mailboxRes = await fetch(`${BASE_URL}/api/admin/mailbox`, {
      headers: authHeaders,
    });
    const mailboxData = await mailboxRes.json();
    assert(mailboxRes.ok && Array.isArray(mailboxData.messages), 'Admin mailbox returned message array');
    
    // Check counts
    assert(mailboxData.counts?.byService?.FLIGHT >= 1, `Counts report FLIGHT requests: ${mailboxData.counts?.byService?.FLIGHT}`);
    assert(mailboxData.counts?.byService?.OFFLINE_CHAT >= 1, `Counts report OFFLINE_CHAT requests: ${mailboxData.counts?.byService?.OFFLINE_CHAT}`);
    assert(mailboxData.counts?.followUpCount >= 5, `Counts report follow-up required >= 5: ${mailboxData.counts?.followUpCount}`);

    // Locate the flight message in mailbox
    const flightMsg = mailboxData.messages.find(m => m.reference === flightRef);
    assert(flightMsg !== undefined, `Found flight request by reference ${flightRef}`);
    assert(flightMsg.serviceTag === 'FLIGHT', 'Flight request has serviceTag === FLIGHT');
    assert(flightMsg.followUpStatus === 'NEW', 'Flight request has default followUpStatus === NEW');
    assert(flightMsg.needsFollowUp === true, 'Flight request has needsFollowUp === true');

    // 7. Test PATCH to update followUpStatus and add internal note
    console.log('\n7. Testing Follow-up Status Update & Internal Notes...');
    const updateRes = await fetch(`${BASE_URL}/api/admin/mailbox/${flightMsg.id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        followUpStatus: 'IN_PROGRESS',
        assignedTo: 'رشيد الفزني (المدير العام)',
        note: 'تم إرسال عروض الخطوط الملكية المغربية للعميل عبر الهاتف.',
      }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.ok && updateData.success === true, 'PATCH mailbox returned success');
    assert(updateData.message?.followUpStatus === 'IN_PROGRESS', 'followUpStatus updated to IN_PROGRESS');
    assert(updateData.message?.assignedTo === 'رشيد الفزني (المدير العام)', 'assignedTo updated');
    assert(updateData.message?.internalNotes?.length >= 1, `internalNotes contains note: ${updateData.message?.internalNotes?.[0]?.text}`);
    assert(updateData.message?.activityTimeline?.length >= 2, `activityTimeline recorded actions: ${updateData.message?.activityTimeline?.length}`);

    // 8. Test marking read does NOT clear followUpStatus
    console.log('\n8. Testing Read Status Preservation...');
    const readRes = await fetch(`${BASE_URL}/api/admin/mailbox/${flightMsg.id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        status: 'read',
      }),
    });
    const readData = await readRes.json();
    assert(readData.message?.status === 'read', 'Status updated to read');
    assert(readData.message?.followUpStatus === 'IN_PROGRESS', 'followUpStatus is strictly preserved as IN_PROGRESS');
    assert(readData.message?.needsFollowUp === true, 'needsFollowUp is preserved');

    // 9. Verify offline chat linked request in db
    console.log('\n9. Testing Offline Chat Request Linkage...');
    const offlineMsg = mailboxData.messages.find(m => m.chatSessionId === offlineSessionId);
    assert(offlineMsg !== undefined, 'Found unified mailbox record for offline chat session');
    assert(offlineMsg.serviceTag === 'OFFLINE_CHAT', 'Offline chat record has serviceTag === OFFLINE_CHAT');
    assert(offlineMsg.requestSource === 'offline_chat', 'Offline chat record has requestSource === offline_chat');

    console.log(`\n========================================`);
    console.log(`VERIFICATION SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log(`========================================\n`);

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
