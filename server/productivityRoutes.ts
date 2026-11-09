import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'node:crypto';
import { productivityStore, NoteItem, TaskItem, CalEventItem } from './productivityStore';

export const productivityRouter = Router();

// Prepare uploads directory for productivity attachments
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads', 'productivity');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\u0600-\u06FF-]/g, '_');
    cb(null, `${base}-${Date.now()}-${randomUUID().slice(0, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

function getUserId(req: Request, res: Response): string {
  if (res.locals?.crmOwner?.username) return res.locals.crmOwner.username;
  if (res.locals?.crmOwner?.id) return res.locals.crmOwner.id;
  const user = (req as any).user;
  if (user?.username) return user.username;
  if (user?.id) return user.id;
  const headerUser = req.get('x-user-id');
  if (headerUser && typeof headerUser === 'string') return headerUser.trim();
  return 'owner';
}

// 1. Get full productivity state for user
productivityRouter.get('/state', (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  const data = productivityStore.getUserData(userId);
  res.json({ success: true, data });
});

// 2. Bulk sync / backup restore
productivityRouter.post('/sync', (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  const synced = productivityStore.syncAll(userId, req.body || {});
  res.json({ success: true, data: synced });
});

// 3. Notes CRUD
productivityRouter.post('/notes', (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  const note = productivityStore.saveNote(userId, req.body || {});
  res.json({ success: true, note });
});

productivityRouter.delete('/notes/:id', (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  const deleted = productivityStore.deleteNote(userId, req.params.id);
  res.json({ success: deleted });
});

// 4. Tasks CRUD
productivityRouter.post('/tasks', (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  const task = productivityStore.saveTask(userId, req.body || {});
  res.json({ success: true, task });
});

productivityRouter.delete('/tasks/:id', (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  const deleted = productivityStore.deleteTask(userId, req.params.id);
  res.json({ success: deleted });
});

// 5. Events CRUD
productivityRouter.post('/events', (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  const event = productivityStore.saveEvent(userId, req.body || {});
  res.json({ success: true, event });
});

productivityRouter.post('/events/:id/reschedule', (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  const event = productivityStore.rescheduleEvent(userId, req.params.id, req.body || {});
  if (!event) {
    return res.status(404).json({ error: 'الحدث غير موجود.' });
  }
  res.json({ success: true, event });
});

productivityRouter.delete('/events/:id', (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  const deleted = productivityStore.deleteEvent(userId, req.params.id);
  res.json({ success: deleted });
});

// 6. Reminders Actions
productivityRouter.post('/reminders/:id/dismiss', (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  const dismissed = productivityStore.dismissReminder(userId, req.params.id);
  res.json({ success: dismissed });
});

productivityRouter.post('/reminders/:id/complete', (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  const completed = productivityStore.completeReminder(userId, req.params.id);
  res.json({ success: completed });
});

productivityRouter.post('/reminders/:id/snooze', (req: Request, res: Response) => {
  const userId = getUserId(req, res);
  const minutes = Number(req.body?.minutes) || 10;
  const snoozed = productivityStore.snoozeReminder(userId, req.params.id, minutes);
  res.json({ success: Boolean(snoozed), reminder: snoozed });
});

// 7. File & Attachment Upload
productivityRouter.post('/upload', (req: Request, res: Response) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'فشل رفع الملف.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم استلام أي ملف.' });
    }
    const relativeUrl = `/uploads/productivity/${req.file.filename}`;
    res.json({
      success: true,
      file: {
        id: randomUUID(),
        name: req.file.originalname,
        filename: req.file.filename,
        url: relativeUrl,
        size: req.file.size,
        type: req.file.mimetype,
      },
    });
  });
});
