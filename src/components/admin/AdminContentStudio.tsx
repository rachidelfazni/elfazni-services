import React, { useEffect, useState } from 'react';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { homepageSections, HomepageSection } from '../../data/siteVisibility';
import { FAQ_LIST } from '../../data/content';
import { api, SiteSettings } from '../../services/api';

export function AdminContentStudio() {
  const { settings, refreshSettings } = useSiteSettings();
  const [draft, setDraft] = useState<SiteSettings>(settings);
  const [dirty, setDirty] = useState(false);
  const [language, setLanguage] = useState<'ar' | 'en' | 'fr' | 'tr'>('ar');
  const [tab, setTab] = useState('hero');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!dirty) setDraft(settings); }, [settings, dirty]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const update = (changes: Partial<SiteSettings>) => { setDraft(current => ({ ...current, ...changes })); setDirty(true); };
  const order = [...new Set([...(draft.sectionOrder || []), ...Object.keys(homepageSections)])];
  const move = (index: number, delta: number) => {
    const next = [...order];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    update({ sectionOrder: next });
  };
  const suffix = { ar: '', en: 'En', fr: 'Fr', tr: 'Tr' }[language];
  const questionKey = ('q' + suffix) as 'q' | 'qEn' | 'qFr' | 'qTr';
  const answerKey = ('a' + suffix) as 'a' | 'aEn' | 'aFr' | 'aTr';
  const faqs = draft.faqItems ?? FAQ_LIST;
  const save = async () => {
    setBusy(true);
    try {
      await api.updateSettings({ heroTitle: draft.heroTitle, heroDescription: draft.heroDescription,
        sectionTitles: draft.sectionTitles, sectionOrder: order, faqItems: draft.faqItems });
      await refreshSettings();
      setDirty(false);
      setMessage('تم نشر التعديلات.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر الحفظ'); }
    finally { setBusy(false); }
  };
  const toggleSection = async (id: HomepageSection, visible: boolean) => {
    setBusy(true);
    try {
      await api.request('/admin/settings/sections/' + id, { method: 'PATCH', body: JSON.stringify({ visible }) });
      await refreshSettings();
      setMessage('تم تحديث ظهور القسم.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'تعذر الحفظ'); }
    finally { setBusy(false); }
  };
  return <section className="content-studio">
    <header><span className="studio-kicker">ELFAZNI · CONTENT STUDIO</span><h2>موقعك، كما تريد أن يراه عملاؤك</h2>
      <p>عدّل النصوص ورتّب الأقسام ثم انشر التغييرات.</p><a href="/" target="_blank" rel="noreferrer">معاينة الموقع ↗</a></header>
    <nav className="studio-tabs" aria-label="أقسام محرر المحتوى">
      {[['hero', 'الواجهة الرئيسية'], ['sections', 'الأقسام والترتيب'], ['faq', 'الأسئلة الشائعة']].map(([id, label]) =>
        <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}
    </nav>
    <label>لغة المحتوى<select value={language} onChange={event => setLanguage(event.target.value as typeof language)}>
      {Object.entries({ ar: 'العربية', en: 'English', fr: 'Français', tr: 'Türkçe' }).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></label>
    {tab === 'hero' && <div className="studio-fields">
      <label>عنوان الواجهة<input dir={language === 'ar' ? 'rtl' : 'ltr'} maxLength={160} placeholder="اتركه فارغًا لاستخدام النص الأصلي" value={draft.heroTitle?.[language] || ''} onChange={e => update({ heroTitle: { ...draft.heroTitle, [language]: e.target.value } })} /></label>
      <label>وصف الواجهة<textarea dir={language === 'ar' ? 'rtl' : 'ltr'} maxLength={1500} rows={4} value={draft.heroDescription?.[language] || ''} onChange={e => update({ heroDescription: { ...draft.heroDescription, [language]: e.target.value } })} /></label>
    </div>}
    {tab === 'sections' && order.map((id, index) => <div className="studio-section" key={id}>
      <span className="studio-order">{String(index + 1).padStart(2, '0')}</span>
      <label>{homepageSections[id as HomepageSection]}<input placeholder="عنوان القسم الأصلي" maxLength={200} value={draft.sectionTitles?.[id]?.[language] || ''} onChange={e => update({ sectionTitles: { ...draft.sectionTitles, [id]: { ...draft.sectionTitles?.[id], [language]: e.target.value } } })} /></label>
      <button aria-label={'رفع ' + homepageSections[id as HomepageSection]} disabled={!index} onClick={() => move(index, -1)}>↑</button>
      <button aria-label={'خفض ' + homepageSections[id as HomepageSection]} disabled={index === order.length - 1} onClick={() => move(index, 1)}>↓</button>
      <button disabled={busy} aria-pressed={!settings.hiddenSections?.includes(id as HomepageSection)} onClick={() => void toggleSection(id as HomepageSection, Boolean(settings.hiddenSections?.includes(id as HomepageSection)))}>
        {settings.hiddenSections?.includes(id as HomepageSection) ? 'إظهار' : 'إخفاء'}</button>
    </div>)}
    {tab === 'faq' && <div className="studio-fields">{faqs.map((item, index) => <div className="studio-faq" key={index}>
      <label>السؤال {index + 1}<input dir={language === 'ar' ? 'rtl' : 'ltr'} maxLength={500} value={item[questionKey]} onChange={e => update({ faqItems: faqs.map((row, i) => i === index ? { ...row, [questionKey]: e.target.value } : row) })} /></label>
      <label>الإجابة<textarea dir={language === 'ar' ? 'rtl' : 'ltr'} rows={3} maxLength={5000} value={item[answerKey]} onChange={e => update({ faqItems: faqs.map((row, i) => i === index ? { ...row, [answerKey]: e.target.value } : row) })} /></label>
      <button onClick={() => update({ faqItems: faqs.filter((_, i) => i !== index) })}>حذف السؤال {index + 1}</button>
    </div>)}<button disabled={faqs.length >= 50} onClick={() => update({ faqItems: [...faqs, { q: '', a: '', qEn: '', aEn: '', qFr: '', aFr: '', qTr: '', aTr: '' }] })}>إضافة سؤال</button></div>}
    <footer className="studio-save"><span>{dirty ? 'تعديلات بانتظار النشر' : 'المحتوى محفوظ'}</span><button disabled={busy || !dirty} onClick={() => void save()}>{busy ? 'جارٍ الحفظ…' : 'حفظ ونشر المحتوى'}</button>
      <button disabled={busy || !dirty} onClick={() => { setDirty(false); setDraft(settings); }}>تراجع عن التعديلات</button></footer>
    <p role="status">{message}</p>
  </section>;
}
