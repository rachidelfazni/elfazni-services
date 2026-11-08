import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { CrmEnvelope, CrmSnapshot, validSnapshot } from '../crm/src/services/crmSnapshot';

export class CrmStoreError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
interface Receipt { id: string; hash: string; revision: number }
interface Stored extends CrmEnvelope {
  schemaVersion: 1;
  updatedBy: string | null;
  receipts: Receipt[];
  checksum: string;
}
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const empty = (): Stored => ({ schemaVersion: 1, revision: 0, data: null, updatedAt: null, updatedBy: null, receipts: [], checksum: digest(null) });

export function createCrmStore(directory = path.resolve(process.env.ELFAZNI_DATA_DIR || 'data')) {
  const filename = path.join(directory, 'crm.json');
  const backupDirectory = path.join(directory, 'crm-backups');
  const lockfile = path.join(directory, 'crm-write.lock');
  fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });

  function readFile(file: string): Stored {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (value.schemaVersion !== 1 || !Number.isSafeInteger(value.revision) || value.revision < 0 ||
      (value.data !== null && !validSnapshot(value.data)) ||
      !Array.isArray(value.receipts) || value.checksum !== digest(value.data)) {
      throw new Error('Invalid CRM store');
    }
    return value;
  }
  function read(): Stored {
    if (!fs.existsSync(filename)) {
      if (backups().length) throw new CrmStoreError(503, 'ملف CRM مفقود مع وجود نسخ احتياطية. يلزم استعادته قبل المتابعة.');
      return empty();
    }
    try { return readFile(filename); }
    catch { throw new CrmStoreError(503, 'تعذّر قراءة ملف CRM. احتُفظ بالملف كما هو؛ راجع النسخة الاحتياطية مع مسؤول التشغيل.'); }
  }
  function atomicWrite(file: string, value: Stored) {
    const temporary = file + '.' + randomUUID() + '.tmp';
    try {
      const fd = fs.openSync(temporary, 'wx', 0o600);
      try { fs.writeFileSync(fd, JSON.stringify(value)); fs.fsyncSync(fd); }
      finally { fs.closeSync(fd); }
      fs.renameSync(temporary, file);
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  }
  function backups() {
    return fs.readdirSync(backupDirectory).filter(name => /^revision-\d+-[a-f0-9-]+\.json$/.test(name))
      .sort((a,b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  }
  function save(data: CrmSnapshot, expectedRevision: number, requestId: string, actor: string) {
    if (!validSnapshot(data) || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0 ||
      typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) {
      throw new CrmStoreError(400, 'بيانات CRM غير صالحة. راجع النسخة المستوردة أو التعديل الأخير.');
    }
    if (Buffer.byteLength(JSON.stringify(data)) > 12 * 1024 * 1024) throw new CrmStoreError(413, 'بلغت البيانات حد 12 ميغابايت للحفظ. احتفظ بنسخة وتواصل مع مسؤول التشغيل.');
    let lock: number;
    try { lock = fs.openSync(lockfile, 'wx', 0o600); }
    catch (error: any) {
      if (error.code === 'EEXIST') throw new CrmStoreError(503, 'هناك عملية حفظ أخرى أو قفل يحتاج مراجعة. أعد المحاولة.');
      throw error;
    }
    try {
      fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, at: new Date().toISOString() }));
      const current = read();
      const hash = digest({ data, expectedRevision });
      const receipt = current.receipts.find(item => item.id === requestId);
      if (receipt) {
        if (receipt.hash !== hash) throw new CrmStoreError(409, 'معرّف الحفظ مستخدم لبيانات مختلفة.');
        return { revision: receipt.revision, updatedAt: current.updatedAt, replayed: true };
      }
      if (current.revision !== expectedRevision) throw new CrmStoreError(409, 'تغيرت البيانات من جهاز آخر. نزّل تعديلاتك ثم حمّل نسخة الخادم للمراجعة.');
      const next: Stored = {
        schemaVersion: 1, data, revision: current.revision + 1,
        updatedAt: new Date().toISOString(), updatedBy: actor, checksum: digest(data),
        receipts: [...current.receipts.slice(-31), { id: requestId, hash, revision: current.revision + 1 }],
      };
      if (current.data !== null) atomicWrite(path.join(backupDirectory, 'revision-' + current.revision + '-' + randomUUID() + '.json'), current);
      atomicWrite(filename, next);
      // Cleanup cannot turn a successfully committed save into an apparent failure.
      try { for (const name of backups().slice(30)) fs.unlinkSync(path.join(backupDirectory, name)); }
      catch (error) { console.warn('CRM backup cleanup deferred', error); }
      return { revision: next.revision, updatedAt: next.updatedAt, replayed: false };
    } finally {
      fs.closeSync(lock);
      fs.unlinkSync(lockfile);
    }
  }
  function getBackup(name: string) {
    if (!backups().includes(name)) throw new CrmStoreError(404, 'النسخة المطلوبة غير موجودة.');
    return readFile(path.join(backupDirectory, name));
  }
  return { read, save, backups, getBackup };
}
