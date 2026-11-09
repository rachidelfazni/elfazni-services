/**
 * ELFAZNI SERVICES — CRM Productivity Service
 * Server-first persistence with localStorage resilience and automatic migration
 */

export interface NoteRevision {
  id: string;
  title: string;
  contentHtml: string;
  updatedAt: string;
  summary?: string;
}

export interface PageSetupConfig {
  paperSize?: 'A4' | 'A5' | 'Letter' | 'Legal' | 'Custom';
  customWidthMm?: number;
  customHeightMm?: number;
  orientation?: 'portrait' | 'landscape';
  margins?: {
    topMm?: number;
    bottomMm?: number;
    leftMm?: number;
    rightMm?: number;
  };
  header?: {
    enabled?: boolean;
    text?: string;
    showTitle?: boolean;
    showDate?: boolean;
  };
  footer?: {
    enabled?: boolean;
    text?: string;
    showPageNumbers?: boolean;
    showDate?: boolean;
  };
  printBackground?: boolean;
  pageBreaks?: boolean;
}

export interface StampConfig {
  enabled?: boolean;
  stampId?: string;
  stampUrl?: string;
  stampName?: string;
  targetPages?: 'all' | 'first' | 'last' | 'current' | 'custom';
  presetPosition?: 'bottom_right' | 'bottom_left' | 'bottom_center' | 'top_right' | 'top_left' | 'center' | 'custom';
  xPercent?: number; // 0-100
  yPercent?: number; // 0-100
  scalePercent?: number; // 10-400
  rotationDeg?: number; // -180 to 180
  opacityPercent?: number; // 10-100
  layer?: 'foreground' | 'watermark';
  locked?: boolean;
}

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
  linkedRecordType?: 'consulate' | 'flight' | 'debt' | 'request' | 'chat' | 'general';
  linkedRecordId?: string;
  linkedRecordTitle?: string;
  linkedTaskIds?: string[];
  reminderDateTime?: string;
  revisions?: NoteRevision[];
  pageSetup?: PageSetupConfig;
  stampConfig?: StampConfig;
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
  linkedRecordType?: 'consulate' | 'flight' | 'debt' | 'request' | 'chat' | 'general';
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

export interface EventRescheduleLog {
  id: string;
  previousDate: string;
  previousTime?: string;
  previousEndTime?: string;
  newDate: string;
  newTime?: string;
  newEndTime?: string;
  rescheduledBy: string;
  rescheduledAt: string;
  note?: string;
}

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
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  // CRM integration fields
  linkedRecordType?: 'consulate' | 'flight' | 'debt' | 'customer' | 'task' | 'note' | 'invoice';
  linkedRecordId?: string;
  linkedRecordTitle?: string;
  linkedCustomerId?: string;
  linkedCustomerName?: string;
  linkedCustomerPhone?: string;
  linkedCustomerEmail?: string;
  linkedServiceType?: string;
  linkedTransactionRef?: string;
  linkedStatus?: string;
  nextFollowUpDate?: string;
  // Smart reminder fields
  reminderMinutesBefore?: number;
  reminderStatus?: 'scheduled' | 'due' | 'snoozed' | 'acknowledged' | 'completed' | 'cancelled';
  reminderSnoozedUntil?: string;
  reminderCompletedAt?: string;
  // Recurrence fields
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  recurrenceInterval?: number;
  recurrenceEnd?: string;
  recurrenceExceptions?: string[];
  parentEventId?: string;
  // Reschedule audit trail
  rescheduleHistory?: EventRescheduleLog[];
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

export interface ProductivityState {
  notes: NoteItem[];
  tasks: TaskItem[];
  events: CalEventItem[];
  reminders: ReminderItem[];
}

const API_BASE = '/admin/crm/api/productivity';

function getStorageKey(type: string, username: string = 'owner') {
  return `elfazni_crm_${type}_${username}`;
}

/**
 * Migration helper: loads old unstructured localStorage data and translates it into rich models
 */
export function migrateLegacyLocalStorage(username: string = 'owner'): ProductivityState {
  const kNotes = `elfazni_crm_notebook_${username}`;
  const kTasks = `elfazni_crm_tasks_${username}`;
  const kEvents = `elfazni_crm_calendar_${username}`;
  const kRichNotes = getStorageKey('notes_v2', username);
  const kRichTasks = getStorageKey('tasks_v2', username);
  const kRichEvents = getStorageKey('events_v2', username);
  const kReminders = getStorageKey('reminders_v2', username);

  // If rich stores already exist, use them
  try {
    const richNotes = localStorage.getItem(kRichNotes);
    const richTasks = localStorage.getItem(kRichTasks);
    const richEvents = localStorage.getItem(kRichEvents);
    const richReminders = localStorage.getItem(kReminders);

    if (richNotes || richTasks || richEvents) {
      return {
        notes: richNotes ? JSON.parse(richNotes) : [],
        tasks: richTasks ? JSON.parse(richTasks) : [],
        events: richEvents ? JSON.parse(richEvents) : [],
        reminders: richReminders ? JSON.parse(richReminders) : [],
      };
    }
  } catch (err) {
    console.warn('Failed reading rich productivity storage:', err);
  }

  // Otherwise, migrate from legacy keys without losing any data
  const migratedNotes: NoteItem[] = [];
  try {
    const rawNotes = localStorage.getItem(kNotes);
    if (rawNotes) {
      const parsed = JSON.parse(rawNotes);
      if (Array.isArray(parsed)) {
        parsed.forEach((old: any) => {
          const body = String(old.body || '').trim();
          const lines = body.split('\n').filter(Boolean);
          const title = lines[0]?.slice(0, 50) || 'ملاحظة مستوردة';
          const contentHtml = body
            .split('\n\n')
            .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
            .join('');

          migratedNotes.push({
            id: String(old.id || `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
            userId: username,
            title,
            icon: '📝',
            coverColor: '#0B2E57',
            body,
            contentHtml: contentHtml || `<p>${body}</p>`,
            tags: ['عام'],
            pinned: false,
            favorite: false,
            archived: false,
            createdAt: old.updatedAt || new Date().toISOString(),
            updatedAt: old.updatedAt || new Date().toISOString(),
          });
        });
      }
    }
  } catch (err) {
    console.error('Notes migration error:', err);
  }

  const migratedTasks: TaskItem[] = [];
  try {
    const rawTasks = localStorage.getItem(kTasks);
    if (rawTasks) {
      const parsed = JSON.parse(rawTasks);
      if (Array.isArray(parsed)) {
        parsed.forEach((old: any) => {
          migratedTasks.push({
            id: String(old.id || `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
            userId: username,
            title: String(old.title || 'مهمة').trim(),
            description: '',
            descriptionHtml: '',
            status: old.done ? 'done' : 'todo',
            priority: 'medium',
            dueDate: old.date ? String(old.date).slice(0, 10) : undefined,
            assignee: 'رشيد الفزني',
            tags: ['عام'],
            color: '#6B5BD2',
            subtasks: [],
            attachments: [],
            activities: [
              {
                id: `act_${Date.now()}`,
                action: 'استيراد المهمة من النسخة السابقة',
                actor: username,
                createdAt: old.createdAt || new Date().toISOString(),
              },
            ],
            createdAt: old.createdAt || new Date().toISOString(),
            updatedAt: old.createdAt || new Date().toISOString(),
            completedAt: old.done ? new Date().toISOString() : undefined,
          });
        });
      }
    }
  } catch (err) {
    console.error('Tasks migration error:', err);
  }

  const migratedEvents: CalEventItem[] = [];
  try {
    const rawEvents = localStorage.getItem(kEvents);
    if (rawEvents) {
      const parsed = JSON.parse(rawEvents);
      if (Array.isArray(parsed)) {
        parsed.forEach((old: any) => {
          migratedEvents.push({
            id: String(old.id || `e_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
            userId: username,
            title: String(old.text || 'حدث شخصي').trim(),
            kind: 'pers',
            date: old.date ? String(old.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
            time: old.time,
            durationMin: old.durationMin ?? 60,
            allDay: !old.time,
            color: '#CC9048',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        });
      }
    }
  } catch (err) {
    console.error('Events migration error:', err);
  }

  const initial: ProductivityState = {
    notes: migratedNotes,
    tasks: migratedTasks,
    events: migratedEvents,
    reminders: [],
  };

  // Cache migrated state into rich stores
  try {
    localStorage.setItem(kRichNotes, JSON.stringify(initial.notes));
    localStorage.setItem(kRichTasks, JSON.stringify(initial.tasks));
    localStorage.setItem(kRichEvents, JSON.stringify(initial.events));
    localStorage.setItem(kReminders, JSON.stringify(initial.reminders));
  } catch {}

  return initial;
}

export const productivityService = {
  migrateLegacyLocalStorage(username: string = 'owner') {
    return migrateLegacyLocalStorage(username);
  },

  async fetchState(username: string = 'owner'): Promise<ProductivityState> {
    try {
      const res = await fetch(`${API_BASE}/state`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Elfazni-CRM': '1',
          'X-User-Id': username,
        },
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          // If server had data, sync to local cache
          const state: ProductivityState = {
            notes: json.data.notes || [],
            tasks: json.data.tasks || [],
            events: json.data.events || [],
            reminders: json.data.reminders || [],
          };
          this.saveToLocalCache(state, username);
          return state;
        }
      }
    } catch (err) {
      console.warn('Server fetchState failed, falling back to local cache:', err);
    }
    return migrateLegacyLocalStorage(username);
  },

  saveToLocalCache(state: ProductivityState, username: string = 'owner') {
    try {
      localStorage.setItem(getStorageKey('notes_v2', username), JSON.stringify(state.notes));
      localStorage.setItem(getStorageKey('tasks_v2', username), JSON.stringify(state.tasks));
      localStorage.setItem(getStorageKey('events_v2', username), JSON.stringify(state.events));
      localStorage.setItem(getStorageKey('reminders_v2', username), JSON.stringify(state.reminders));
    } catch {}
  },

  async syncAllToServer(state: ProductivityState, username: string = 'owner'): Promise<boolean> {
    this.saveToLocalCache(state, username);
    try {
      const res = await fetch(`${API_BASE}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Elfazni-CRM': '1',
          'X-User-Id': username,
        },
        credentials: 'same-origin',
        body: JSON.stringify(state),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async saveNote(note: Partial<NoteItem>, username: string = 'owner'): Promise<NoteItem> {
    try {
      const res = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Elfazni-CRM': '1',
          'X-User-Id': username,
        },
        credentials: 'same-origin',
        body: JSON.stringify(note),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.note) return json.note;
      }
    } catch (err) {
      console.warn('Server saveNote failed, persisting locally:', err);
    }

    // Local fallback
    const local = migrateLegacyLocalStorage(username);
    const existingIndex = local.notes.findIndex((n) => n.id === note.id);
    const now = new Date().toISOString();
    let saved: NoteItem;

    if (existingIndex >= 0) {
      const old = local.notes[existingIndex];
      saved = { ...old, ...note, updatedAt: now } as NoteItem;
      local.notes[existingIndex] = saved;
    } else {
      saved = {
        id: note.id || `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: username,
        title: note.title || 'ملاحظة جديدة',
        icon: note.icon || '📝',
        coverColor: note.coverColor || '#0B2E57',
        body: note.body || '',
        contentHtml: note.contentHtml || '',
        tags: note.tags || ['عام'],
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
      local.notes.unshift(saved);
    }
    this.saveToLocalCache(local, username);
    return saved;
  },

  async deleteNote(noteId: string, username: string = 'owner'): Promise<boolean> {
    try {
      await fetch(`${API_BASE}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'X-Elfazni-CRM': '1',
          'X-User-Id': username,
        },
        credentials: 'same-origin',
      });
    } catch {}

    const local = migrateLegacyLocalStorage(username);
    local.notes = local.notes.filter((n) => n.id !== noteId);
    this.saveToLocalCache(local, username);
    return true;
  },

  async saveTask(task: Partial<TaskItem>, username: string = 'owner'): Promise<TaskItem> {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Elfazni-CRM': '1',
          'X-User-Id': username,
        },
        credentials: 'same-origin',
        body: JSON.stringify(task),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.task) return json.task;
      }
    } catch (err) {
      console.warn('Server saveTask failed, persisting locally:', err);
    }

    const local = migrateLegacyLocalStorage(username);
    const existingIndex = local.tasks.findIndex((t) => t.id === task.id);
    const now = new Date().toISOString();
    let saved: TaskItem;

    if (existingIndex >= 0) {
      const old = local.tasks[existingIndex];
      saved = {
        ...old,
        ...task,
        updatedAt: now,
        completedAt: task.status === 'done' && old.status !== 'done' ? now : old.completedAt,
      } as TaskItem;
      local.tasks[existingIndex] = saved;
    } else {
      saved = {
        id: task.id || `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: username,
        title: task.title || 'مهمة جديدة',
        descriptionHtml: task.descriptionHtml || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        startDate: task.startDate,
        assignee: task.assignee || 'رشيد الفزني',
        tags: task.tags || ['عام'],
        color: task.color || '#6B5BD2',
        subtasks: task.subtasks || [],
        attachments: task.attachments || [],
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
            id: `act_${Date.now()}`,
            action: 'إنشاء المهمة',
            actor: username,
            createdAt: now,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
      local.tasks.unshift(saved);
    }
    this.saveToLocalCache(local, username);
    return saved;
  },

  async deleteTask(taskId: string, username: string = 'owner'): Promise<boolean> {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'X-Elfazni-CRM': '1',
          'X-User-Id': username,
        },
        credentials: 'same-origin',
      });
    } catch {}

    const local = migrateLegacyLocalStorage(username);
    local.tasks = local.tasks.filter((t) => t.id !== taskId);
    this.saveToLocalCache(local, username);
    return true;
  },

  async saveEvent(event: Partial<CalEventItem>, username: string = 'owner'): Promise<CalEventItem> {
    try {
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Elfazni-CRM': '1',
          'X-User-Id': username,
        },
        credentials: 'same-origin',
        body: JSON.stringify(event),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.event) return json.event;
      }
    } catch (err) {
      console.warn('Server saveEvent failed, persisting locally:', err);
    }

    const local = migrateLegacyLocalStorage(username);
    const existingIndex = local.events.findIndex((e) => e.id === event.id);
    const now = new Date().toISOString();
    let saved: CalEventItem;

    if (existingIndex >= 0) {
      saved = { ...local.events[existingIndex], ...event, updatedAt: now } as CalEventItem;
      local.events[existingIndex] = saved;
    } else {
      saved = {
        id: event.id || `e_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: username,
        title: event.title || 'حدث جديد',
        kind: event.kind || 'pers',
        date: event.date || now.slice(0, 10),
        endDate: event.endDate,
        time: event.time,
        endTime: event.endTime,
        durationMin: event.durationMin ?? 60,
        allDay: Boolean(event.allDay || !event.time),
        description: event.description || '',
        location: event.location,
        onlineLink: event.onlineLink,
        color: event.color || '#CC9048',
        participants: event.participants || [],
        assignee: event.assignee,
        linkedRecordType: event.linkedRecordType,
        linkedRecordId: event.linkedRecordId,
        linkedRecordTitle: event.linkedRecordTitle,
        reminderMinutesBefore: event.reminderMinutesBefore,
        recurrence: event.recurrence || 'none',
        createdAt: now,
        updatedAt: now,
      };
      local.events.unshift(saved);
    }
    this.saveToLocalCache(local, username);
    return saved;
  },

  async deleteEvent(eventId: string, username: string = 'owner'): Promise<boolean> {
    try {
      await fetch(`${API_BASE}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'X-Elfazni-CRM': '1',
          'X-User-Id': username,
        },
        credentials: 'same-origin',
      });
    } catch {}

    const local = migrateLegacyLocalStorage(username);
    local.events = local.events.filter((e) => e.id !== eventId);
    this.saveToLocalCache(local, username);
    return true;
  },

  async uploadFile(file: File): Promise<{ url: string; name: string; size: number; type: string } | null> {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: {
          'X-Elfazni-CRM': '1',
        },
        credentials: 'same-origin',
        body: formData,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.file) return json.file;
      }
    } catch (err) {
      console.error('File upload failed:', err);
    }
    return null;
  },

  /**
   * Convert note to a linked task with mutual backlink
   */
  async convertNoteToTask(
    note: NoteItem,
    taskOptions: {
      dueDate?: string;
      dueTime?: string;
      priority?: TaskPriority;
      assignee?: string;
    } = {},
    username: string = 'owner'
  ): Promise<{ task: TaskItem; updatedNote: NoteItem }> {
    const newTask = await this.saveTask(
      {
        title: note.title,
        descriptionHtml: note.contentHtml,
        description: note.body,
        status: 'todo',
        priority: taskOptions.priority || 'medium',
        dueDate: taskOptions.dueDate,
        dueTime: taskOptions.dueTime,
        assignee: taskOptions.assignee || 'رشيد الفزني',
        tags: note.tags,
        linkedNoteId: note.id,
        linkedNoteTitle: note.title,
        linkedCustomerId: note.linkedCustomerId,
        linkedCustomerName: note.linkedCustomerName,
        linkedRecordType: note.linkedRecordType,
        linkedRecordId: note.linkedRecordId,
        linkedRecordTitle: note.linkedRecordTitle,
      },
      username
    );

    const linkedTaskIds = Array.from(new Set([...(note.linkedTaskIds || []), newTask.id]));
    const updatedNote = await this.saveNote(
      {
        ...note,
        linkedTaskIds,
      },
      username
    );

    return { task: newTask, updatedNote };
  },

  /**
   * Create task from selected text inside a note
   */
  async createTaskFromSelection(
    selectedText: string,
    note: NoteItem,
    taskOptions: {
      dueDate?: string;
      priority?: TaskPriority;
    } = {},
    username: string = 'owner'
  ): Promise<TaskItem> {
    const title = selectedText.trim().split('\n')[0]?.slice(0, 80) || 'مهمة مقتطعة من الملاحظة';
    return this.saveTask(
      {
        title,
        description: selectedText.trim(),
        descriptionHtml: `<p>${selectedText.trim().replace(/\n/g, '<br/>')}</p>`,
        status: 'todo',
        priority: taskOptions.priority || 'medium',
        dueDate: taskOptions.dueDate,
        linkedNoteId: note.id,
        linkedNoteTitle: note.title,
        linkedCustomerId: note.linkedCustomerId,
        linkedCustomerName: note.linkedCustomerName,
        tags: note.tags,
      },
      username
    );
  },
  /**
   * Reschedule an existing calendar event with audit log
   */
  async rescheduleEvent(
    eventId: string,
    details: {
      newDate: string;
      newTime?: string;
      newEndTime?: string;
      note?: string;
      rescheduledBy?: string;
    },
    username: string = 'owner'
  ): Promise<CalEventItem> {
    try {
      const res = await fetch(`${API_BASE}/events/${eventId}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Elfazni-CRM': '1',
          'X-User-Id': username,
        },
        credentials: 'same-origin',
        body: JSON.stringify(details),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.event) return json.event;
      }
    } catch (err) {
      console.warn('Server rescheduleEvent failed, persisting locally:', err);
    }

    const local = migrateLegacyLocalStorage(username);
    const ev = local.events.find((e) => e.id === eventId);
    const now = new Date().toISOString();
    const historyItem: EventRescheduleLog = {
      id: `resh_${Date.now()}`,
      previousDate: ev?.date || '',
      previousTime: ev?.time,
      previousEndTime: ev?.endTime,
      newDate: details.newDate,
      newTime: details.newTime ?? ev?.time,
      newEndTime: details.newEndTime ?? ev?.endTime,
      rescheduledBy: details.rescheduledBy || username,
      rescheduledAt: now,
      note: details.note,
    };

    if (ev) {
      ev.date = details.newDate;
      if (details.newTime !== undefined) ev.time = details.newTime;
      if (details.newEndTime !== undefined) ev.endTime = details.newEndTime;
      ev.rescheduleHistory = [historyItem, ...(ev.rescheduleHistory || [])];
      ev.updatedAt = now;
      this.saveToLocalCache(local, username);
      return ev;
    }

    throw new Error('Event not found');
  },

  /**
   * Snooze a smart reminder
   */
  async snoozeReminder(
    reminderId: string,
    minutes: number = 10,
    username: string = 'owner'
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/reminders/${reminderId}/snooze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Elfazni-CRM': '1',
          'X-User-Id': username,
        },
        credentials: 'same-origin',
        body: JSON.stringify({ minutes }),
      });
      if (res.ok) return true;
    } catch {}

    const local = migrateLegacyLocalStorage(username);
    const rem = local.reminders?.find((r) => r.id === reminderId);
    if (rem) {
      const target = new Date();
      target.setMinutes(target.getMinutes() + minutes);
      rem.snoozedUntil = target.toISOString();
      rem.status = 'snoozed';
      rem.updatedAt = new Date().toISOString();
      this.saveToLocalCache(local, username);
      return true;
    }
    return false;
  },

  /**
   * Complete a smart reminder
   */
  async completeReminder(
    reminderId: string,
    username: string = 'owner'
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/reminders/${reminderId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Elfazni-CRM': '1',
          'X-User-Id': username,
        },
        credentials: 'same-origin',
      });
      if (res.ok) return true;
    } catch {}

    const local = migrateLegacyLocalStorage(username);
    const rem = local.reminders?.find((r) => r.id === reminderId);
    if (rem) {
      rem.status = 'completed';
      rem.updatedAt = new Date().toISOString();
      this.saveToLocalCache(local, username);
      return true;
    }
    return false;
  },

  /**
   * Dismiss a smart reminder
   */
  async dismissReminder(
    reminderId: string,
    username: string = 'owner'
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/reminders/${reminderId}/dismiss`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Elfazni-CRM': '1',
          'X-User-Id': username,
        },
        credentials: 'same-origin',
      });
      if (res.ok) return true;
    } catch {}

    const local = migrateLegacyLocalStorage(username);
    const rem = local.reminders?.find((r) => r.id === reminderId);
    if (rem) {
      rem.status = 'dismissed';
      rem.updatedAt = new Date().toISOString();
      this.saveToLocalCache(local, username);
      return true;
    }
    return false;
  },

  /**
   * Create a calendar event from a task
   */
  async createEventFromTask(
    task: TaskItem,
    eventOptions: {
      time?: string;
      durationMin?: number;
      kind?: EventKind;
    } = {},
    username: string = 'owner'
  ): Promise<CalEventItem> {
    return this.saveEvent(
      {
        title: task.title,
        kind: eventOptions.kind || 'task',
        date: task.dueDate || new Date().toISOString().slice(0, 10),
        time: eventOptions.time || task.dueTime || '10:00',
        durationMin: eventOptions.durationMin || 60,
        allDay: !task.dueTime && !eventOptions.time,
        description: task.description || '',
        color: task.color || '#7C3AED',
        linkedRecordType: 'task',
        linkedRecordId: task.id,
        linkedRecordTitle: task.title,
        linkedCustomerId: task.linkedCustomerId,
        linkedCustomerName: task.linkedCustomerName,
        reminderMinutesBefore: task.reminderMinutesBefore,
      },
      username
    );
  },

  /**
   * Convert a note into a calendar event
   */
  async convertNoteToEvent(
    note: NoteItem,
    eventOptions: {
      date: string;
      time?: string;
      kind?: EventKind;
    },
    username: string = 'owner'
  ): Promise<CalEventItem> {
    return this.saveEvent(
      {
        title: note.title,
        kind: eventOptions.kind || 'meeting',
        date: eventOptions.date,
        time: eventOptions.time || '10:00',
        durationMin: 60,
        allDay: !eventOptions.time,
        description: note.body || '',
        color: note.coverColor || '#CC9048',
        linkedRecordType: 'note',
        linkedRecordId: note.id,
        linkedRecordTitle: note.title,
        linkedCustomerId: note.linkedCustomerId,
        linkedCustomerName: note.linkedCustomerName,
      },
      username
    );
  },
};
