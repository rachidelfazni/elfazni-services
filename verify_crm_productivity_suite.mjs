import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { readDb } from './server/db.ts';
import { generateToken } from './server/auth.ts';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const adminUser = readDb().users.find((u) => u.role === 'superadmin');
const crmToken = generateToken(adminUser, 'crm');

async function runTests() {
  console.log('====================================================');
  console.log('🚀 ELFAZNI SERVICES — CRM PRODUCTIVITY SUITE VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Asset & Font Verification
  console.log('--- 1. Testing Brand Assets & Typography ---');
  const logos = [
    'public/assets/logos/elfazni-horizontal-on-white.svg',
    'public/assets/logos/elfazni-horizontal-on-blue.svg',
    'public/assets/logos/elfazni-horizontal-on-gold.svg',
    'crm/public/assets/logos/elfazni-horizontal-on-white.svg',
    'crm/public/assets/logos/elfazni-horizontal-on-blue.svg',
    'crm/public/assets/logos/elfazni-horizontal-on-gold.svg',
  ];

  for (const l of logos) {
    const exists = fs.existsSync(l);
    assert(exists, `Logo exists: ${l}`);
  }

  const fonts = [
    'crm/public/assets/fonts/Bahij-Plain.ttf',
    'crm/public/assets/fonts/Bahij-Bold.ttf',
    'crm/public/assets/fonts/Bahij-SemiBold.ttf',
    'crm/public/assets/fonts/PlusJakartaSans-400.ttf',
    'crm/public/assets/fonts/PlusJakartaSans-700.ttf',
  ];

  for (const f of fonts) {
    const exists = fs.existsSync(f);
    assert(exists, `Font exists: ${f}`);
  }

  // 2. Component Files Verification
  console.log('\n--- 2. Testing Component Files ---');
  const components = [
    'crm/src/components/tools/ModernNotesEditor.tsx',
    'crm/src/components/tools/ModernTaskManager.tsx',
    'crm/src/components/tools/ModernCalendar.tsx',
    'crm/src/components/tools/CalendarWorkspace.tsx',
    'crm/src/services/productivityService.ts',
    'server/productivityStore.ts',
    'server/productivityRoutes.ts',
  ];

  for (const c of components) {
    const exists = fs.existsSync(c);
    assert(exists, `Component exists: ${c}`);
  }

  // 3. API Endpoints
  console.log('\n--- 3. Testing Productivity API Endpoints ---');
  const headers = {
    'Content-Type': 'application/json',
    'X-Elfazni-CRM': '1',
    'X-User-Id': adminUser?.username || 'owner',
    Cookie: `elfazni_crm=${crmToken}; token=${crmToken}`,
  };

  try {
    // 3.1 Fetch State
    const stateRes = await fetch(`${BASE_URL}/admin/crm/api/productivity/state`, {
      headers,
    });
    assert(stateRes.ok, `GET /admin/crm/api/productivity/state returns ${stateRes.status}`);
    const stateData = await stateRes.json();
    assert(stateData.success === true, 'GET state returns success: true');
    assert(Array.isArray(stateData.data?.notes), 'State contains notes array');
    assert(Array.isArray(stateData.data?.tasks), 'State contains tasks array');
    assert(Array.isArray(stateData.data?.events), 'State contains events array');

    // 3.2 Create Note
    const testNote = {
      title: 'ملاحظة تجريبية لاجتماع القنصلية',
      icon: '🏛️',
      body: 'تم الاتفاق مع العميل على تجهيز ملف فيزا إسبانيا.\n- حجز الطيران مؤكد\n- التأمين ساري',
      contentHtml: '<h1>ملاحظة تجريبية لاجتماع القنصلية</h1><p>تم الاتفاق مع العميل على تجهيز ملف فيزا إسبانيا.</p><ul><li>حجز الطيران مؤكد</li><li>التأمين ساري</li></ul>',
      tags: ['قنصلية', 'تأشيرات'],
      pinned: true,
      favorite: true,
    };

    const noteRes = await fetch(`${BASE_URL}/admin/crm/api/productivity/notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testNote),
    });
    assert(noteRes.ok, `POST /admin/crm/api/productivity/notes returns ${noteRes.status}`);
    const noteData = await noteRes.json();
    const createdNote = noteData.note;
    assert(createdNote && createdNote.id, `Note created with ID: ${createdNote?.id}`);
    assert(createdNote.title === testNote.title, 'Note title matches input');
    assert(createdNote.pinned === true, 'Note pinned status preserved');

    // 3.3 Create Task
    const testTask = {
      title: 'تأكيد حجز الفندق للعميل يوسف',
      description: 'التواصل مع الفندق وإصدار قسيمة الحجز الرسمية',
      status: 'in_progress',
      priority: 'urgent',
      dueDate: '2026-11-15',
      assignee: 'رشيد الفزني (المدير)',
      tags: ['حجوزات', 'عاجل'],
      subtasks: [
        { id: 'sub_1', title: 'مراجعة التواريخ والأسماء', done: true },
        { id: 'sub_2', title: 'إرسال التأكيد للعميل', done: false },
      ],
      linkedNoteId: createdNote.id,
      linkedNoteTitle: createdNote.title,
    };

    const taskRes = await fetch(`${BASE_URL}/admin/crm/api/productivity/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testTask),
    });
    assert(taskRes.ok, `POST /admin/crm/api/productivity/tasks returns ${taskRes.status}`);
    const taskData = await taskRes.json();
    const createdTask = taskData.task;
    assert(createdTask && createdTask.id, `Task created with ID: ${createdTask?.id}`);
    assert(createdTask.priority === 'urgent', 'Task priority is urgent');
    assert(createdTask.linkedNoteId === createdNote.id, 'Task links back to created note');
    assert(createdTask.subtasks.length === 2, 'Task has 2 subtasks');

    // 3.4 Update Note with Linked Task ID
    const updatedNoteRes = await fetch(`${BASE_URL}/admin/crm/api/productivity/notes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...createdNote,
        linkedTaskIds: [createdTask.id],
      }),
    });
    const updatedNoteData = await updatedNoteRes.json();
    assert(
      updatedNoteData.note.linkedTaskIds?.includes(createdTask.id),
      'Note updated with mutual link to task'
    );

    // 3.5 Create Calendar Event
    const testEvent = {
      title: 'موعد إيداع ملف القنصلية الإسبانية',
      kind: 'cns',
      date: '2026-11-20',
      time: '09:30',
      endTime: '10:30',
      allDay: false,
      location: 'قنصلية إسبانيا بالدار البيضاء',
      description: 'حضور العميل شخصياً لتقديم البصمات',
    };

    const eventRes = await fetch(`${BASE_URL}/admin/crm/api/productivity/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testEvent),
    });
    assert(eventRes.ok, `POST /admin/crm/api/productivity/events returns ${eventRes.status}`);
    const eventData = await eventRes.json();
    const createdEvent = eventData.event;
    assert(createdEvent && createdEvent.id, `Event created with ID: ${createdEvent?.id}`);
    assert(createdEvent.kind === 'cns', 'Event kind is cns (Consulate)');

    // 3.6 Re-fetch State and verify persistence
    const finalStateRes = await fetch(`${BASE_URL}/admin/crm/api/productivity/state`, {
      headers,
    });
    const finalStateData = await finalStateRes.json();
    assert(
      finalStateData.data.notes.some((n) => n.id === createdNote.id),
      'Created note verified in persistent state'
    );
    assert(
      finalStateData.data.tasks.some((t) => t.id === createdTask.id),
      'Created task verified in persistent state'
    );
    assert(
      finalStateData.data.events.some((e) => e.id === createdEvent.id),
      'Created event verified in persistent state'
    );

  } catch (err) {
    console.error('API Test Error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
