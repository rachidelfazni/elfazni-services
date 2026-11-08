import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export interface NoteItem {
  id: string;
  userId: string;
  title: string;
  icon?: string;
  coverColor?: string;
  body: string;
  contentHtml: string;
  tags: string[];
  pinned: boolean;
  favorite?: boolean;
  archived?: boolean;
  linkedCustomerId?: string;
  linkedCustomerName?: string;
  linkedRecordType?: 'consulate' | 'flight' | 'debt' | 'request' | 'general';
  linkedRecordId?: string;
  linkedRecordTitle?: string;
  linkedTaskIds?: string[];
  reminderDateTime?: string;
  revisions?: Array<{
    id: string;
    title: string;
    contentHtml: string;
    updatedAt: string;
    summary?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SubtaskItem {
  id: string;
  title: string;
  done: boolean;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface TaskActivity {
  id: string;
  action: string;
  actor: string;
  createdAt: string;
}

export interface TaskItem {
  id: string;
  userId: string;
  title: string;
  descriptionHtml?: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  dueTime?: string;
  startDate?: string;
  assignee?: string;
  tags: string[];
  color?: string;
  subtasks: SubtaskItem[];
  attachments: TaskAttachment[];
  linkedNoteId?: string;
  linkedNoteTitle?: string;
  linkedCustomerId?: string;
  linkedCustomerName?: string;
  linkedRecordType?: 'consulate' | 'flight' | 'debt' | 'request' | 'chat';
  linkedRecordId?: string;
  linkedRecordTitle?: string;
  reminderMinutesBefore?: number;
  reminderDateTime?: string;
  reminderDismissed?: boolean;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  comments?: Array<{
    id: string;
    author: string;
    text: string;
    createdAt: string;
  }>;
  activities: TaskActivity[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export type EventKind = 'pers' | 'cns' | 'fly' | 'debt' | 'task' | 'meeting' | 'reminder';

export interface CalEventItem {
  id: string;
  userId: string;
  title: string;
  kind: EventKind;
  date: string;
  endDate?: string;
  time?: string;
  endTime?: string;
  durationMin?: number;
  allDay: boolean;
  description?: string;
  location?: string;
  onlineLink?: string;
  color?: string;
  participants?: string[];
  assignee?: string;
  linkedRecordType?: 'consulate' | 'flight' | 'debt' | 'customer' | 'task' | 'note';
  linkedRecordId?: string;
  linkedRecordTitle?: string;
  reminderMinutesBefore?: number;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  createdAt: string;
  updatedAt: string;
}

export interface ReminderItem {
  id: string;
  userId: string;
  title: string;
  entityType: 'task' | 'note' | 'event' | 'booking' | 'request';
  entityId: string;
  targetDateTime: string;
  snoozedUntil?: string;
  status: 'pending' | 'triggered' | 'snoozed' | 'dismissed' | 'completed';
  channel?: 'crm' | 'email' | 'all';
  linkedCustomerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductivityData {
  notes: NoteItem[];
  tasks: TaskItem[];
  events: CalEventItem[];
  reminders: ReminderItem[];
}

export interface ProductivityStoreSchema {
  version: 2;
  users: Record<string, ProductivityData>;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.env.ELFAZNI_DATA_DIR || 'data');
const STORE_FILE = path.join(DATA_DIR, 'productivity.json');

function emptyUserData(): ProductivityData {
  return {
    notes: [],
    tasks: [],
    events: [],
    reminders: [],
  };
}

function readStoreFile(): ProductivityStoreSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_FILE)) {
    const initial: ProductivityStoreSchema = {
      version: 2,
      users: {},
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.users) parsed.users = {};
    return parsed;
  } catch (err) {
    console.error('Error reading productivity.json, creating fallback:', err);
    return {
      version: 2,
      users: {},
      updatedAt: new Date().toISOString(),
    };
  }
}

function writeStoreFile(data: ProductivityStoreSchema) {
  data.updatedAt = new Date().toISOString();
  const tmpFile = `${STORE_FILE}.${randomUUID()}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpFile, STORE_FILE);
}

export const productivityStore = {
  getUserData(userId: string): ProductivityData {
    const store = readStoreFile();
    const normalizedId = String(userId || 'owner').trim();
    if (!store.users[normalizedId]) {
      store.users[normalizedId] = emptyUserData();
      writeStoreFile(store);
    }
    return store.users[normalizedId];
  },

  syncAll(userId: string, incoming: Partial<ProductivityData>): ProductivityData {
    const store = readStoreFile();
    const normalizedId = String(userId || 'owner').trim();
    const current = store.users[normalizedId] || emptyUserData();

    if (Array.isArray(incoming.notes)) {
      current.notes = incoming.notes;
    }
    if (Array.isArray(incoming.tasks)) {
      current.tasks = incoming.tasks;
    }
    if (Array.isArray(incoming.events)) {
      current.events = incoming.events;
    }
    if (Array.isArray(incoming.reminders)) {
      current.reminders = incoming.reminders;
    }

    store.users[normalizedId] = current;
    writeStoreFile(store);
    return current;
  },

  saveNote(userId: string, note: Partial<NoteItem>): NoteItem {
    const store = readStoreFile();
    const normalizedId = String(userId || 'owner').trim();
    const current = store.users[normalizedId] || emptyUserData();

    const now = new Date().toISOString();
    const existingIndex = current.notes.findIndex((n) => n.id === note.id);

    if (existingIndex >= 0) {
      const old = current.notes[existingIndex];
      const revisions = old.revisions || [];
      if (old.contentHtml !== note.contentHtml && old.contentHtml) {
        revisions.unshift({
          id: randomUUID(),
          title: old.title,
          contentHtml: old.contentHtml,
          updatedAt: old.updatedAt || now,
          summary: 'حفظ تلقائي قبل التعديل',
        });
      }

      const updated: NoteItem = {
        ...old,
        ...note,
        id: old.id,
        userId: normalizedId,
        revisions: revisions.slice(0, 15),
        updatedAt: now,
      };
      current.notes[existingIndex] = updated;
      store.users[normalizedId] = current;
      writeStoreFile(store);
      return updated;
    } else {
      const newNote: NoteItem = {
        id: note.id || `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: normalizedId,
        title: note.title || 'ملاحظة جديدة',
        icon: note.icon || '📝',
        coverColor: note.coverColor || '#0B2E57',
        body: note.body || '',
        contentHtml: note.contentHtml || '',
        tags: Array.isArray(note.tags) ? note.tags : [],
        pinned: Boolean(note.pinned),
        favorite: Boolean(note.favorite),
        archived: Boolean(note.archived),
        linkedCustomerId: note.linkedCustomerId,
        linkedCustomerName: note.linkedCustomerName,
        linkedRecordType: note.linkedRecordType,
        linkedRecordId: note.linkedRecordId,
        linkedRecordTitle: note.linkedRecordTitle,
        linkedTaskIds: note.linkedTaskIds || [],
        reminderDateTime: note.reminderDateTime,
        revisions: [],
        createdAt: now,
        updatedAt: now,
      };
      current.notes.unshift(newNote);
      store.users[normalizedId] = current;
      writeStoreFile(store);
      return newNote;
    }
  },

  deleteNote(userId: string, noteId: string): boolean {
    const store = readStoreFile();
    const normalizedId = String(userId || 'owner').trim();
    const current = store.users[normalizedId] || emptyUserData();
    const before = current.notes.length;
    current.notes = current.notes.filter((n) => n.id !== noteId);
    if (current.notes.length !== before) {
      store.users[normalizedId] = current;
      writeStoreFile(store);
      return true;
    }
    return false;
  },

  saveTask(userId: string, task: Partial<TaskItem>): TaskItem {
    const store = readStoreFile();
    const normalizedId = String(userId || 'owner').trim();
    const current = store.users[normalizedId] || emptyUserData();
    const now = new Date().toISOString();
    const existingIndex = current.tasks.findIndex((t) => t.id === task.id);

    if (existingIndex >= 0) {
      const old = current.tasks[existingIndex];
      const activities = old.activities || [];

      if (task.status && task.status !== old.status) {
        activities.unshift({
          id: randomUUID(),
          action: `تغيير الحالة من ${old.status} إلى ${task.status}`,
          actor: 'المستخدم',
          createdAt: now,
        });
      }

      const updated: TaskItem = {
        ...old,
        ...task,
        id: old.id,
        userId: normalizedId,
        activities: activities.slice(0, 30),
        updatedAt: now,
        completedAt: task.status === 'done' && old.status !== 'done' ? now : old.completedAt,
      };
      current.tasks[existingIndex] = updated;
      store.users[normalizedId] = current;
      writeStoreFile(store);
      return updated;
    } else {
      const newTask: TaskItem = {
        id: task.id || `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: normalizedId,
        title: task.title || 'مهمة جديدة',
        descriptionHtml: task.descriptionHtml || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        startDate: task.startDate,
        assignee: task.assignee || 'رشيد الفزني',
        tags: Array.isArray(task.tags) ? task.tags : [],
        color: task.color || '#6B5BD2',
        subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
        attachments: Array.isArray(task.attachments) ? task.attachments : [],
        linkedNoteId: task.linkedNoteId,
        linkedNoteTitle: task.linkedNoteTitle,
        linkedCustomerId: task.linkedCustomerId,
        linkedCustomerName: task.linkedCustomerName,
        linkedRecordType: task.linkedRecordType,
        linkedRecordId: task.linkedRecordId,
        linkedRecordTitle: task.linkedRecordTitle,
        reminderMinutesBefore: task.reminderMinutesBefore,
        reminderDateTime: task.reminderDateTime,
        reminderDismissed: false,
        recurrence: task.recurrence || 'none',
        comments: task.comments || [],
        activities: [
          {
            id: randomUUID(),
            action: 'إنشاء المهمة',
            actor: 'المستخدم',
            createdAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
      current.tasks.unshift(newTask);
      store.users[normalizedId] = current;
      writeStoreFile(store);
      return newTask;
    }
  },

  deleteTask(userId: string, taskId: string): boolean {
    const store = readStoreFile();
    const normalizedId = String(userId || 'owner').trim();
    const current = store.users[normalizedId] || emptyUserData();
    const before = current.tasks.length;
    current.tasks = current.tasks.filter((t) => t.id !== taskId);
    if (current.tasks.length !== before) {
      store.users[normalizedId] = current;
      writeStoreFile(store);
      return true;
    }
    return false;
  },

  saveEvent(userId: string, ev: Partial<CalEventItem>): CalEventItem {
    const store = readStoreFile();
    const normalizedId = String(userId || 'owner').trim();
    const current = store.users[normalizedId] || emptyUserData();
    const now = new Date().toISOString();
    const existingIndex = current.events.findIndex((e) => e.id === ev.id);

    if (existingIndex >= 0) {
      const old = current.events[existingIndex];
      const updated: CalEventItem = {
        ...old,
        ...ev,
        id: old.id,
        userId: normalizedId,
        updatedAt: now,
      };
      current.events[existingIndex] = updated;
      store.users[normalizedId] = current;
      writeStoreFile(store);
      return updated;
    } else {
      const newEv: CalEventItem = {
        id: ev.id || `cal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: normalizedId,
        title: ev.title || 'حدث جديد',
        kind: ev.kind || 'pers',
        date: ev.date || now.slice(0, 10),
        endDate: ev.endDate,
        time: ev.time,
        endTime: ev.endTime,
        durationMin: ev.durationMin ?? 60,
        allDay: Boolean(ev.allDay || !ev.time),
        description: ev.description || '',
        location: ev.location,
        onlineLink: ev.onlineLink,
        color: ev.color || '#CC9048',
        participants: ev.participants || [],
        assignee: ev.assignee,
        linkedRecordType: ev.linkedRecordType,
        linkedRecordId: ev.linkedRecordId,
        linkedRecordTitle: ev.linkedRecordTitle,
        reminderMinutesBefore: ev.reminderMinutesBefore,
        recurrence: ev.recurrence || 'none',
        createdAt: now,
        updatedAt: now,
      };
      current.events.unshift(newEv);
      store.users[normalizedId] = current;
      writeStoreFile(store);
      return newEv;
    }
  },

  deleteEvent(userId: string, eventId: string): boolean {
    const store = readStoreFile();
    const normalizedId = String(userId || 'owner').trim();
    const current = store.users[normalizedId] || emptyUserData();
    const before = current.events.length;
    current.events = current.events.filter((e) => e.id !== eventId);
    if (current.events.length !== before) {
      store.users[normalizedId] = current;
      writeStoreFile(store);
      return true;
    }
    return false;
  },

  dismissReminder(userId: string, reminderId: string): boolean {
    const store = readStoreFile();
    const normalizedId = String(userId || 'owner').trim();
    const current = store.users[normalizedId] || emptyUserData();
    const rem = current.reminders.find((r) => r.id === reminderId);
    if (rem) {
      rem.status = 'dismissed';
      rem.updatedAt = new Date().toISOString();
      store.users[normalizedId] = current;
      writeStoreFile(store);
      return true;
    }
    return false;
  },

  snoozeReminder(userId: string, reminderId: string, minutes: number = 10): ReminderItem | null {
    const store = readStoreFile();
    const normalizedId = String(userId || 'owner').trim();
    const current = store.users[normalizedId] || emptyUserData();
    const rem = current.reminders.find((r) => r.id === reminderId);
    if (rem) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + minutes);
      rem.snoozedUntil = now.toISOString();
      rem.status = 'snoozed';
      rem.updatedAt = new Date().toISOString();
      store.users[normalizedId] = current;
      writeStoreFile(store);
      return rem;
    }
    return null;
  },
};
