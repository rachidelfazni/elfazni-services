import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CrmEnvelope, CrmSnapshot, validSnapshot } from '../services/crmSnapshot';
import { downloadSnapshot, freshSnapshot, hasRecords, legacySnapshot, LoadedCrm, SavePacket, storageRequest, StorageRequestError } from '../services/crmClient';

export function CrmStorageGate({ children }: { children: (initial: LoadedCrm) => React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [initial, setInitial] = useState<LoadedCrm | null>(null);
  const [server, setServer] = useState<CrmEnvelope | null>(null);
  const [candidate, setCandidate] = useState<SavePacket | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const key = 'elfazni_crm_server_pending_' + user?.id;
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let active = true;
    storageRequest<CrmEnvelope>('state').then(result => {
      if (!active) return;
      setServer(result);
      let pending: SavePacket | null = null;
      try { pending = JSON.parse(localStorage.getItem(key) || 'null'); }
      catch { setError('تعذّر قراءة نسخة الاسترداد المحلية. احتفظ ببيانات المتصفح قبل المتابعة.'); return; }
      if (pending) {
        if (!validSnapshot(pending.data)) { setError('نسخة الاسترداد المحلية غير صالحة. احتفظ ببيانات المتصفح وراجع الدعم.'); return; }
        if (JSON.stringify(pending.data) === JSON.stringify(result.data)) {
          localStorage.removeItem(key);
        } else { setCandidate(pending); return; }
      }
      if (!result.data) {
        let legacy: CrmSnapshot;
        try { legacy = legacySnapshot(); }
        catch { setError('تعذّر قراءة بيانات المتصفح القديمة. صدّرها من النسخة القديمة قبل بدء العمل.'); return; }
        if (!validSnapshot(legacy)) { setError('بعض البيانات القديمة تحتاج مراجعة قبل نقلها. استخدم تصدير النسخة القديمة للاحتفاظ بها.'); return; }
        if (hasRecords(legacy)) { setCandidate({ data: legacy, revision: 0, requestId: crypto.randomUUID() }); return; }
      }
      setInitial({ ...result, data: result.data || freshSnapshot(), recoveryKey: key });
    }).catch(error => { if (active) setError(error instanceof Error ? error.message : 'تعذّر تحميل CRM.'); });
    return () => { active = false; };
  }, [isAuthenticated, user?.id, key]);

  if (initial) return <>{children(initial)}</>;
  const recover = async () => {
    if (!candidate) return;
    setBusy(true); setError('');
    try {
      await storageRequest('state', candidate);
      localStorage.removeItem(key);
      window.location.reload();
    } catch (error) { setError(error instanceof Error ? error.message : 'تعذّر الحفظ.'); }
    finally { setBusy(false); }
  };
  return <main className="crm-storage-setup" dir="rtl">
    <img src="/admin/crm/assets/logo-horizontal.svg" alt="الفزني سيرفيسز" />
    <h1>{candidate ? 'مراجعة بياناتك قبل المتابعة' : 'فتح مساحة العمل'}</h1>
    {candidate ? <>
      <p>وجدنا بيانات محفوظة في هذا المتصفح. يمكنك تنزيل نسخة منها أو محاولة حفظها على الخادم. عند وجود نسخة أحدث على الخادم سيُطلب منك مراجعة التعارض.</p>
      <p>{candidate.data.contactBook.contacts.length} جهة اتصال · {candidate.data.consulateAppointments.length} معاملة · {candidate.data.flightBookings.length} حجز · {candidate.data.invoices.length} فاتورة</p>
      <button disabled={busy} onClick={() => downloadSnapshot(candidate.data)}>تنزيل نسخة من بيانات المتصفح</button>
      <button disabled={busy} onClick={() => void recover()}>حفظ هذه البيانات على الخادم</button>
      <button disabled={busy} onClick={() => {
        if (!server || !window.confirm('هل تريد فتح نسخة الخادم؟ نزّل بيانات المتصفح أولًا إذا كنت تحتاج مراجعتها.')) return;
        localStorage.removeItem(key);
        setInitial({ ...server, data: server.data || freshSnapshot(), recoveryKey: key });
      }}>فتح نسخة الخادم</button>
    </> : <p>جارٍ تحميل بيانات CRM من الخادم…</p>}
    {error && <p role="alert">{error}</p>}
    {error && <button onClick={() => window.location.reload()}>إعادة المحاولة</button>}
    <a href="/workspace">العودة إلى مساحة العمل</a>
  </main>;
}

export function useCrmPersistence(data: CrmSnapshot, initial: LoadedCrm) {
  const serialized = useMemo(() => JSON.stringify(data), [data]);
  const baseline = useRef(JSON.stringify(initial.data));
  const revision = useRef(initial.revision);
  const packet = useRef<SavePacket | null>(null);
  const alive = useRef(true);
  const [status, setStatus] = useState<'saved' | 'saving' | 'error' | 'conflict'>('saved');
  const [error, setError] = useState('');
  const [remote, setRemote] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(initial.updatedAt);
  const [backupList, setBackupList] = useState<Array<{ name: string; revision: number }> | null>(null);
  const [backupError, setBackupError] = useState('');
  const dirty = serialized !== baseline.current;
  const save = async () => {
    const pending = packet.current;
    if (!pending) return;
    setStatus('saving'); setError('');
    try {
      const result = await storageRequest<{ revision: number; updatedAt: string }>('state', pending);
      revision.current = result.revision;
      baseline.current = JSON.stringify(pending.data);
      packet.current = null;
      try { localStorage.removeItem(initial.recoveryKey); } catch {}
      if (alive.current) { setUpdatedAt(result.updatedAt); setStatus('saved'); }
    } catch (error) {
      if (!alive.current) return;
      setStatus(error instanceof StorageRequestError && error.status === 409 ? 'conflict' : 'error');
      setError(error instanceof Error ? error.message : 'تعذّر الحفظ. نزّل نسخة ثم أعد المحاولة.');
    }
  };
  useEffect(() => {
    if (serialized === baseline.current || packet.current) return;
    const next = { data, revision: revision.current, requestId: crypto.randomUUID() };
    packet.current = next;
    try { localStorage.setItem(initial.recoveryKey, JSON.stringify(next)); } catch {}
    if (!validSnapshot(data)) {
      setStatus('error');
      setError('التعديل يحتوي بيانات غير صالحة. نزّل نسخة للمراجعة ثم أعد تحميل بيانات الخادم.');
      return;
    }
    void save();
  }, [serialized, status]);
  useEffect(() => {
    alive.current = true;
    const beforeUnload = (event: BeforeUnloadEvent) => { if (packet.current) event.preventDefault(); };
    const check = async () => {
      if (packet.current || document.visibilityState !== 'visible') return;
      try {
        const result = await storageRequest<CrmEnvelope>('state');
        if (alive.current && !packet.current) setRemote(result.revision > revision.current);
      } catch { /* Saves report errors separately; polling never changes local records. */ }
    };
    const timer = window.setInterval(() => void check(), 15000);
    window.addEventListener('focus', check);
    window.addEventListener('beforeunload', beforeUnload);
    return () => { alive.current = false; window.clearInterval(timer); window.removeEventListener('focus', check); window.removeEventListener('beforeunload', beforeUnload); };
  }, []);
  const blocked = dirty || status !== 'saved';
  const toolbar = <aside className="crm-storage-toolbar" dir="rtl" aria-label="حفظ بيانات CRM">
    <span role="status">{status === 'saving' ? 'جارٍ الحفظ على الخادم…' : blocked ? 'تعديلات تحتاج المراجعة' : remote ? 'توجد تحديثات من جهاز آخر' : updatedAt ? 'محفوظ على الخادم · ' + new Date(updatedAt).toLocaleTimeString('ar') : 'جاهز للحفظ على الخادم'}</span>
    {error && <p role="alert">{error}</p>}
    {(status === 'error' || status === 'conflict') && <>
      <button onClick={() => downloadSnapshot(data)}>تنزيل تعديلات الاسترداد</button>
      {status === 'error' && <button onClick={() => void save()}>إعادة الحفظ</button>}
    </>}
    {(remote || status === 'conflict' || status === 'error') && <button onClick={() => {
      if (!window.confirm('نزّل تعديلاتك إذا كنت تحتاجها. هل تريد فتح أحدث نسخة على الخادم؟')) return;
      try { localStorage.removeItem(initial.recoveryKey); } catch {}
      packet.current = null;
      window.location.reload();
    }}>تحميل نسخة الخادم</button>}
    <button disabled={blocked} onClick={async () => {
      setBackupError('');
      try { const result = await storageRequest<{ backups: Array<{ name: string; revision: number }> }>('backups'); setBackupList(result.backups); }
      catch (error) { setBackupError(error instanceof Error ? error.message : 'تعذّر عرض النسخ.'); }
    }}>النسخ الاحتياطية</button>
    {backupError && <span role="alert">{backupError}</span>}
    {backupList && <div className="crm-storage-backups">
      <button onClick={() => setBackupList(null)}>إغلاق النسخ</button>
      <p>آخر 30 نسخة قبل الحفظ. نزّل نسخة ثم استوردها من أداة النسخ داخل CRM إذا احتجت استعادتها.</p>
      {!backupList.length && <p>تظهر أول نسخة احتياطية بعد تعديل بيانات محفوظة مسبقًا.</p>}
      {backupList.map(item => <a key={item.name} href={'/admin/crm/api/backups/' + item.name}>تنزيل النسخة {item.revision}</a>)}
    </div>}
  </aside>;
  return { blocked, toolbar };
}
