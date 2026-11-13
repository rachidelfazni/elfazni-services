import { ContactStorageNotice } from "./ContactReminders";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Users,
  Phone,
  MessageCircle,
  Star,
  Clock3,
  Check,
  FileText,
  Download,
  ArrowUpRight,
  Bell,
  Wallet,
  UserRound,
  Mail,
  MapPin,
  Camera,
  Edit2,
  Trash2,
  Plane,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useCopy } from "../../i18n/useCopy";
import { useUITranslation } from "../../i18n/useUITranslation";
import {
  CRMContact,
  ContactActivity,
  ContactActivityKind,
  ManualDebt,
} from "../../types/contactBook";
import {
  contactBookId,
  normalizeContactPhone,
  manualDebtBalance,
  debtDirection,
  safeContactLink,
  exportContactCSV,
} from "../../utils/contactBook";
import { formatDateTime, formatDate } from "../../utils/formatters";
import {
  formatMinorMoney,
  toMinorUnits,
} from "../../utils/invoiceCalculations";
import { CRMDialog } from "../common/CRMDialog";
import { BankDetailsShare } from "../common/BankDetailsShare";
import {
  ManualDebtForm,
  ManualDebtPaymentForm,
  useContactFinanceAccess,
} from "./ContactFinanceForms";
import { ResizeHandle } from "../workspace/resizable/ResizeHandle";
import { clampPanelSize } from "../workspace/resizable/layoutPreferences";
function ContactAvatar({ contact, large = false }: { contact: Pick<CRMContact, "name" | "photo">; large?: boolean }) {
  return <span className={`crm-contact-avatar${large ? ' large' : ''}`}>
    {contact.photo ? <img src={contact.photo} alt="" /> : contact.name.slice(0, 1)}
  </span>;
}

const socialPlatforms = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn' } as const;
type SocialPlatform = keyof typeof socialPlatforms;

function ContactStars({ rating, onChange }: { rating: number; onChange?: (value: number) => void }) {
  const { l } = useCopy();
  return <div className="crm-contact-rating crm-star-picker" role="group"
    aria-label={l("التقييم", "Rating", "Évaluation")}>
    {[1, 2, 3, 4, 5].map((value) => {
      const icon = <Star size={19} aria-hidden="true" fill={value <= rating ? '#CC9048' : 'none'} color={value <= rating ? '#CC9048' : '#5E7086'} />;
      return onChange ? <button type="button" key={value} aria-pressed={rating === value}
        aria-label={l(`تقييم ${value} من 5`, `Rate ${value} out of 5`, `Note ${value} sur 5`)}
        onClick={() => onChange(value === rating ? 0 : value)}>{icon}</button> : <span key={value}>{icon}</span>;
    })}
    <small>{rating ? `${rating}/5` : l("غير مقيّم", "Unrated", "Non évalué")}</small>
  </div>;
}

function ContactPhotoCrop({ bitmap, onApply, onCancel }: {
  bitmap: ImageBitmap; onApply: (photo: string) => void; onCancel: () => void;
}) {
  const { l } = useCopy();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [horizontal, setHorizontal] = useState(50);
  const [vertical, setVertical] = useState(50);
  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const side = Math.min(bitmap.width, bitmap.height) / zoom;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, 256, 256);
    context.drawImage(bitmap, (bitmap.width - side) * horizontal / 100, (bitmap.height - side) * vertical / 100,
      side, side, 0, 0, 256, 256);
  }, [bitmap, zoom, horizontal, vertical]);
  return <section className="crm-photo-crop" aria-label={l("قص الصورة", "Crop photo", "Recadrer la photo")}>
    <canvas ref={canvasRef} width={256} height={256} aria-label={l("معاينة القص", "Crop preview", "Aperçu du cadrage")} />
    <div className="crm-photo-controls">
      <label>{l("تكبير", "Zoom", "Zoom")}<input type="range" min={1} max={3} step={0.05} value={zoom} onChange={e => setZoom(+e.target.value)} /></label>
      <label>{l("الموضع الأفقي", "Horizontal position", "Position horizontale")}<input type="range" min={0} max={100} value={horizontal} onChange={e => setHorizontal(+e.target.value)} /></label>
      <label>{l("الموضع العمودي", "Vertical position", "Position verticale")}<input type="range" min={0} max={100} value={vertical} onChange={e => setVertical(+e.target.value)} /></label>
      <div className="crm-book-actions">
        <button type="button" className="ws-primary-btn" onClick={() => {
          const canvas = canvasRef.current;
          if (canvas) onApply(canvas.toDataURL('image/jpeg', 0.82));
        }}>{l("اعتماد القص", "Apply crop", "Appliquer le recadrage")}</button>
        <button type="button" className="ws-secondary-btn" onClick={onCancel}>{l("إلغاء القص", "Cancel crop", "Annuler le recadrage")}</button>
      </div>
    </div>
  </section>;
}

export const ContactWorkspace: React.FC = () => {
  const app = useApp(),
    { contactBook, setContactBook, selectedContactId, setSelectedContactId } =
      app,
    { user, canViewAccounting, canEditOperations } = useAuth(),
    finance = useContactFinanceAccess(),
    { l } = useCopy(),
    { ui, isRTL } = useUITranslation();

  // Resizable Contact Directory State
  const [directoryWidth, setDirectoryWidth] = useState<number>(() => {
    if (typeof window === "undefined") return 310;
    try {
      const saved = localStorage.getItem("elfazni_crm_contact_directory_width");
      const num = saved ? parseInt(saved, 10) : 310;
      return isNaN(num) ? 310 : clampPanelSize(num, 240, 520);
    } catch {
      return 310;
    }
  });

  const handleDirectoryResize = (delta: number) => {
    setDirectoryWidth((prev) => {
      const next = clampPanelSize(prev + delta, 240, 520);
      try {
        localStorage.setItem("elfazni_crm_contact_directory_width", String(next));
      } catch {}
      return next;
    });
  };

  const handleResetDirectoryWidth = () => {
    setDirectoryWidth(310);
    try {
      localStorage.setItem("elfazni_crm_contact_directory_width", "310");
    } catch {}
  };

  const canWrite = canEditOperations || finance,
    privileged = ["super_admin", "admin", "editor", "agent"].includes(
      user?.role || "",
    );
  const canConsulate = privileged || user?.canAccessConsulate,
    canFlights = privileged || user?.canAccessFlights;
  const profiles = app.customerProfiles.filter(
    (p) =>
      (canConsulate && p.consulateRecords.length) ||
      (canFlights && p.flightRecords.length) ||
      (canViewAccounting && p.invoices.length),
  );
  const [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [followupFilter, setFollowupFilter] = useState("all"),
    [sortBy, setSortBy] = useState("recent"),
    [editor, setEditor] = useState<CRMContact | "new" | null>(null),
    [activity, setActivity] = useState<ContactActivity | boolean>(false),
    [reminder, setReminder] = useState(false),
    [debt, setDebt] = useState<ManualDebt | boolean>(false),
    [payment, setPayment] = useState<ManualDebt | null>(null),
    [notice, setNotice] = useState("");
  const selected = contactBook.contacts.find((c) => c.id === selectedContactId);
  const linked = selected
    ? profiles.find(
        (p) =>
          p.customerId === selected.linkedCustomerId ||
          (!selected.linkedCustomerId &&
            normalizeContactPhone(selected.phone).length >= 6 &&
            normalizeContactPhone(p.phoneNumber) ===
              normalizeContactPhone(selected.phone)),
      )
    : undefined;
  const actualConsulates = canConsulate && selected
    ? app.consulateAppointments.filter((item) => item.contactId === selected.id ||
        (!item.contactId && linked?.consulateRecords.some((record) => record.id === item.id)))
    : [];
  const actualFlights = canFlights && selected
    ? app.flightBookings.filter((item) => item.contactId === selected.id ||
        (!item.contactId && linked?.flightRecords.some((record) => record.id === item.id)))
    : [];
  const startLinkedService = (type: 'consulate' | 'flight' | 'invoice') => {
    if (!selected) return;
    app.setBookingContact(selected);
    if (type === 'consulate') {
      app.setPresetServiceType(null);
      app.setEditingConsulate(null);
      app.setIsConsulateModalOpen(true);
    } else if (type === 'flight') {
      app.setEditingFlight(null);
      app.setIsFlightModalOpen(true);
    } else if (type === 'invoice') {
      app.setEditingInvoice(null);
      app.setIsInvoiceModalOpen(true);
    }
  };
  const activities = contactBook.activities.filter(
      (a) => a.contactId === selected?.id,
    ),
    debts = canViewAccounting
      ? contactBook.manualDebts.filter((d) => d.contactId === selected?.id)
      : [];
  const transactionDebts = canViewAccounting
    ? app.debts.filter(
        (d) =>
          actualConsulates.some(
            (r) => d.type === "consulate" && r.id === d.recordId,
          ) ||
          actualFlights.some((r) => d.type === "flight" && r.id === d.recordId),
      )
    : [];
  const activityName = (kind: string) =>
    ({
      call: l("مكالمة", "Call", "Appel"),
      message: l("رسالة", "Message", "Message"),
      meeting: l("لقاء", "Meeting", "Rendez-vous"),
      agreement: l("اتفاق", "Agreement", "Accord"),
      historical: l("تعامل سابق", "Historical dealing", "Échange antérieur"),
      note: l("ملاحظة", "Note", "Note"),
    })[kind] || kind;
  const filtered = contactBook.contacts.filter(
    (c) =>
      (followupFilter === "all" || (followupFilter === "due"
        ? contactBook.reminders.some(r => r.contactId === c.id && !r.completedAt && (!r.debtId || canViewAccounting) && new Date(r.dueAt) <= new Date())
        : !contactBook.reminders.some(r => r.contactId === c.id && !r.completedAt && (!r.debtId || canViewAccounting)))) &&
      (status === "all" || (status === "starred" ? c.starred : c.status === status)) &&
      `${c.name} ${c.phone} ${c.email} ${c.city || ""} ${c.alternatePhone || ""}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  filtered.sort((a, b) => sortBy === "name" ? a.name.localeCompare(b.name) : sortBy === "rating" ? b.rating - a.rating : b.updatedAt.localeCompare(a.updatedAt));
  const events = useMemo(
    () =>
      selected
        ? [
            ...activities.map((a) => ({
              id: a.id,
              date: a.occurredAt,
              title: activityName(a.kind),
              text: a.text,
              tag: "contact",
            })),
            ...actualConsulates.map((r) => ({
              id: "c" + r.id,
              date: r.submissionDate,
              title: ui(r.customAppointmentType || r.appointmentType),
              text: ui(
                r.timelineStage === "completed"
                  ? "انتهاء الخدمة"
                  : r.timelineStage === "registered"
                    ? "تم التسجيل"
                    : r.timelineStage === "submitted"
                      ? "قيد المعالجة"
                      : "بانتظار الرد",
              ),
              tag: "service",
            })),
            ...actualFlights.map((r) => ({
              id: "f" + r.id,
              date: r.bookingDate,
              title: l("حجز طيران", "Flight booking", "Réservation de vol"),
              text: r.airlineAndRoute,
              tag: "service",
            })),
            ...debts.flatMap((d) => [
              {
                id: "d" + d.id,
                date: d.date,
                title: l(
                  "تسجيل دين مستقل",
                  "Standalone debt recorded",
                  "Dette indépendante enregistrée",
                ),
                text:
                  d.title +
                  " · " +
                  formatMinorMoney(d.amountMinor, d.currency, true),
                tag: "debt",
              },
              ...d.payments.map((p) => ({
                id: p.id,
                date: p.paidAt,
                title: l(
                  "تسديد دين مستقل",
                  "Standalone debt payment",
                  "Paiement de dette indépendante",
                ),
                text:
                  formatMinorMoney(p.amountMinor, d.currency, true) +
                  (p.note ? " · " + p.note : ""),
                tag: "payment",
              })),
            ]),
          ].sort((a, b) => b.date.localeCompare(a.date))
        : [],
    [
      selected,
      contactBook,
      linked,
      actualConsulates,
      actualFlights,
      canViewAccounting,
      canConsulate,
      canFlights,
      ui,
      l,
    ],
  );
  const exportContacts = () =>
    exportContactCSV("ELFAZNI-contacts", [
      [
        l("الاسم", "Name", "Nom"),
        l("الهاتف", "Phone", "Téléphone"),
        l("البريد", "Email", "E-mail"),
        l("التصنيف", "Status", "Statut"),
        l("التقييم من 5", "Rating / 5", "Évaluation / 5"),
        l("آخر اتفاق", "Last agreement", "Dernier accord"),
        l("ملاحظات", "Notes", "Notes"),
      ],
      ...filtered.map((c) => [
        c.name,
        c.phone,
        c.email,
        c.status === "lead"
          ? l("جهة محتملة", "Prospect", "Prospect")
          : l("عميل", "Customer", "Client"),
        c.rating,
        c.latestAgreement,
        c.notes,
      ]),
    ]);
  const importCustomers = () => {
    const now = new Date().toISOString();
    setContactBook((b) => {
      const additions: CRMContact[] = [];
      for (const p of profiles) {
        if (
          [...b.contacts, ...additions].some(
            (c) =>
              c.linkedCustomerId === p.customerId ||
              (normalizeContactPhone(p.phoneNumber).length >= 6 &&
                normalizeContactPhone(c.phone) ===
                  normalizeContactPhone(p.phoneNumber)),
          )
        )
          continue;
        additions.push({
          id: contactBookId(),
          name: p.clientName,
          phone: p.phoneNumber,
          email: "",
          status: "customer",
          rating: 0,
          notes: "",
          latestAgreement: "",
          linkedCustomerId: p.customerId,
          createdAt: now,
          updatedAt: now,
        });
      }
      return { ...b, contacts: [...b.contacts, ...additions] };
    });
    setNotice(
      l(
        "أضيف العملاء غير الموجودين دون تكرار جهات الاتصال.",
        "Missing customers added without duplicating contacts.",
        "Les clients manquants ont été ajoutés sans doublons.",
      ),
    );
  };
  return (
    <div className="crm-contact-workspace">
      <ContactStorageNotice />
      <header className="crm-book-heading">
        <div>
          <span className="ws-eyebrow">
            ELFAZNI CRM /{" "}
            {l("العلاقات والمتابعة", "RELATIONSHIPS", "RELATIONS CLIENTS")}
          </span>
          <h2>
            {l(
              "جهات الاتصال والمتابعات",
              "Contacts & follow-ups",
              "Contacts et suivi",
            )}
          </h2>
          <p>
            {l(
              "جهة اتصال اليوم، وعميل تثق بعلاقته غدًا.",
              "A contact today. A stronger customer relationship tomorrow.",
              "Un contact aujourd’hui. Une relation client durable demain.",
            )}
          </p>
        </div>
        <div className="crm-book-actions">
          <button className="ws-secondary-btn" onClick={exportContacts}>
            <Download size={17} /> CSV
          </button>
          {canWrite && (
            <>
              <button className="ws-secondary-btn" onClick={importCustomers}>
                <Users size={17} />
                {l(
                  "إضافة عملاء المعاملات",
                  "Add transaction customers",
                  "Ajouter les clients des dossiers",
                )}
              </button>
              <button
                className="ws-primary-btn"
                onClick={() => setEditor("new")}
              >
                <Plus size={17} />
                {l("جهة اتصال جديدة", "New contact", "Nouveau contact")}
              </button>
            </>
          )}
        </div>
      </header>
      <p role="status" className="crm-book-hint">
        {notice}
      </p>
      <BankDetailsShare />
      <section className="crm-followup-agenda"><div><h3>{l("المتابعات القادمة", "Upcoming follow-ups", "Prochains suivis")}</h3><a href="/workspace">{l("مساحة العمل", "Workspace", "Espace de travail")} ↗</a></div>
        {contactBook.reminders.filter(r => !r.completedAt && (!r.debtId || canViewAccounting)).sort((a,b)=>a.dueAt.localeCompare(b.dueAt)).slice(0,6).map(r=><button key={r.id} onClick={()=>setSelectedContactId(r.contactId)}><strong>{contactBook.contacts.find(c=>c.id===r.contactId)?.name}</strong><span>{r.title}</span><time style={{color:new Date(r.dueAt)<new Date()?'#a13232':'#5E7086'}}>{new Date(r.dueAt).toLocaleString()}</time></button>)}
      </section>
      <div
        className="crm-contact-layout"
        style={
          {
            "--crm-contact-dir-width": `${directoryWidth}px`,
          } as React.CSSProperties
        }
      >
        <aside className="crm-contact-directory">
          <div className="crm-contact-search">
            <Search size={17} />
            <input
              aria-label={l(
                "بحث جهات الاتصال",
                "Search contacts",
                "Rechercher un contact",
              )}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={l(
                "الاسم أو الهاتف…",
                "Name or phone…",
                "Nom ou téléphone…",
              )}
            />
          </div>
          <select
            aria-label={l(
              "تصنيف جهات الاتصال",
              "Contact status",
              "Statut des contacts",
            )}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">
              {l("جميع جهات الاتصال", "All contacts", "Tous les contacts")}
            </option>
            <option value="starred">{l("جهات مميزة", "Starred contacts", "Contacts favoris")}</option>
            <option value="lead">
              {l("جهات محتملة", "Prospects", "Prospects")}
            </option>
            <option value="customer">
              {l("العملاء", "Customers", "Clients")}
            </option>
          </select>
          <div className="crm-directory-filters">
            <label>{l("المتابعة", "Follow-up", "Suivi")}<select value={followupFilter} onChange={e=>setFollowupFilter(e.target.value)}>
              <option value="all">{l("الجميع", "All", "Tous")}</option><option value="due">{l("متابعة مستحقة", "Due follow-up", "Suivi à faire")}</option><option value="none">{l("بدون متابعة مخططة", "No planned follow-up", "Sans suivi prévu")}</option>
            </select></label>
            <label>{l("ترتيب حسب", "Sort by", "Trier par")}<select value={sortBy} onChange={e=>setSortBy(e.target.value)}>
              <option value="recent">{l("آخر تحديث", "Last updated", "Mise à jour")}</option><option value="name">{l("الاسم", "Name", "Nom")}</option><option value="rating">{l("التقييم", "Rating", "Note")}</option>
            </select></label><small>{filtered.length} {l("جهة اتصال", "contacts", "contacts")}</small>
          </div>
          <div className="crm-contact-list">
            {filtered.map((c) => (
              <button
                key={c.id}
                className={selected?.id === c.id ? "selected" : ""}
                onClick={() => setSelectedContactId(c.id)}
              >
                <ContactAvatar contact={c} />
                <span>
                  <strong>{c.starred && <Star size={14} fill="#CC9048" color="#CC9048" aria-hidden="true" />} {c.name}</strong>
                  <small dir="auto">{c.phone || c.email || "—"}</small>
                </span>
                <span className="crm-contact-status">
                  {c.status === "lead"
                    ? l("محتمل", "Lead", "Prospect")
                    : l("عميل", "Client", "Client")}
                </span>
              </button>
            ))}
            {!filtered.length && (
              <div className="crm-book-empty">
                <UserRound size={32} />
                <p>
                  {l(
                    "أضف أول جهة اتصال أو أضف عملاء معاملاتك الحالية.",
                    "Add your first contact or bring in your transaction customers.",
                    "Ajoutez votre premier contact ou les clients de vos dossiers.",
                  )}
                </p>
              </div>
            )}
          </div>
        </aside>
        <div className="hidden md:block shrink-0 h-full self-stretch">
          <ResizeHandle
            id="crm-contact-directory"
            direction="horizontal"
            isRtl={isRTL}
            onResize={handleDirectoryResize}
            onReset={handleResetDirectoryWidth}
            currentSize={directoryWidth}
            minSize={240}
            maxSize={520}
            ariaLabel={l(
              "فاصل تغيير حجم قائمة جهات الاتصال",
              "Resize contact list panel",
              "Redimensionner le répertoire des contacts",
            )}
          />
        </div>
        <section className="crm-contact-profile">
          {!selected ? (
            <div className="crm-book-empty">
              <Users size={44} />
              <h3>
                {l(
                  "لكل شخص، ملف متابعة",
                  "A follow-up file for every contact",
                  "Un dossier de suivi pour chaque contact",
                )}
              </h3>
              <p>
                {l(
                  "اختر جهة اتصال لتسجيل التواصل والاتفاقات والتذكيرات والديون.",
                  "Choose a contact to track conversations, agreements, reminders and debts.",
                  "Choisissez un contact pour suivre échanges, accords, rappels et dettes.",
                )}
              </p>
            </div>
          ) : (
            <>
              <header className="crm-contact-profile-header">
                <ContactAvatar contact={selected} large />
                <div>
                  <h3>{selected.name}</h3>
                  <ContactStars rating={selected.rating} onChange={canWrite ? (rating) =>
                    setContactBook(book => ({ ...book, contacts: book.contacts.map(contact =>
                      contact.id === selected.id ? { ...contact, rating, updatedAt: new Date().toISOString() } : contact
                    ) })) : undefined} />
                  {selected.starred && <span className="crm-vip-badge"><Star size={13} fill="currentColor" />{l("جهة مميزة", "Featured contact", "Contact favori")}</span>}
                  <span className="crm-contact-status">
                    {selected.status === "lead"
                      ? l("جهة اتصال محتملة", "Prospect", "Prospect")
                      : l("عميل", "Customer", "Client")}
                  </span>
                </div>
                <div className="crm-book-actions">
                  {canWrite && (
                    <button
                      className="ws-secondary-btn"
                      onClick={() => setEditor(selected)}
                    >
                      {l("تعديل الملف", "Edit profile", "Modifier le profil")}
                    </button>
                  )}
                  {canWrite && <button type="button" className="ws-secondary-btn"
                    aria-pressed={Boolean(selected.starred)}
                    onClick={() => setContactBook((book) => ({...book, contacts: book.contacts.map((contact) =>
                      contact.id === selected.id ? { ...contact, starred: !contact.starred, updatedAt: new Date().toISOString() } : contact
                    )}))}>
                    <Star size={16} fill={selected.starred ? '#CC9048' : 'none'} />
                    {l("تمييز جهة الاتصال", "Star contact", "Mettre en favori")}
                  </button>}
                  {canEditOperations && (
                    <>
                      {canConsulate && (
                        <button type="button" className="ws-primary-btn" onClick={() => startLinkedService('consulate')}>
                          <Plus size={16} />
                          {l("ربط بمعاملة قنصلية", "Add linked consulate", "Ajouter démarche consulaire")}
                        </button>
                      )}
                      {canFlights && (
                        <button type="button" className="ws-secondary-btn" onClick={() => startLinkedService('flight')}>
                          <Plane size={16} />
                          {l("ربط بحجز طيران", "Add linked flight", "Ajouter un vol lié")}
                        </button>
                      )}
                      {canViewAccounting && (
                        <button type="button" className="ws-secondary-btn" onClick={() => startLinkedService('invoice')}>
                          <FileText size={16} />
                          {l("إصدار فاتورة", "Issue invoice", "Créer une facture")}
                        </button>
                      )}
                    </>
                  )}
                  {canWrite && selected.status === "lead" && (
                    <button
                      className="ws-secondary-btn"
                      onClick={() =>
                        setContactBook((b) => ({
                          ...b,
                          contacts: b.contacts.map((c) =>
                            c.id === selected.id
                              ? {
                                  ...c,
                                  status: "customer",
                                  updatedAt: new Date().toISOString(),
                                }
                              : c,
                          ),
                        }))
                      }
                    >
                      {l(
                        "تحويل إلى عميل",
                        "Convert to customer",
                        "Convertir en client",
                      )}
                    </button>
                  )}
                </div>
              </header>
              <section className="crm-contact-details">
                <h4>{l("بيانات التواصل", "Contact details", "Coordonnées")}</h4>
                <div className="crm-contact-links">
                  {[selected.phone, selected.alternatePhone].filter(Boolean).map((phone, index) =>
                    <a key={index} href={`tel:${phone}`}><Phone size={16} /><bdi>{phone}</bdi></a>
                  )}
                  {selected.phone && <a href={`https://wa.me/${normalizeContactPhone(selected.phone)}`} target="_blank" rel="noreferrer"><MessageCircle size={16} /> WhatsApp</a>}
                  {selected.email && <a href={`mailto:${selected.email}`}><Mail size={16} /><bdi>{selected.email}</bdi></a>}
                  {(selected.address || selected.city) && <span className="crm-contact-location"><MapPin size={16} />{[selected.address, selected.city].filter(Boolean).join('، ')}</span>}
                  {Object.entries(socialPlatforms).map(([key, label]) => {
                    const href = safeContactLink(selected.social?.[key as SocialPlatform] || '');
                    return href && <a key={key} href={href} target="_blank" rel="noreferrer"><ArrowUpRight size={16} />{label}</a>;
                  })}
                </div>
                {canWrite && <div className="crm-book-actions">
                  <button type="button" className="ws-secondary-btn" onClick={() => setReminder(true)}><Bell size={16} />{l("إضافة تنبيه", "Add reminder", "Ajouter un rappel")}</button>
                  {finance && <button type="button" className="ws-secondary-btn" onClick={() => setDebt(true)}><Wallet size={16} />{l("تسجيل دين", "Record debt", "Enregistrer une dette")}</button>}
                </div>}
              </section>
              <div className="crm-contact-metrics">
                <div>
                  <strong>
                    {
                      activities.filter((a) =>
                        ["call", "message", "meeting"].includes(a.kind),
                      ).length
                    }
                  </strong>
                  <span>
                    {l(
                      "تواصل مسجل",
                      "Logged interactions",
                      "Échanges enregistrés",
                    )}
                  </span>
                </div>
                <div>
                  <strong>
                    {actualConsulates.length +
                      actualFlights.length +
                      activities.filter((a) => a.kind === "historical").length}
                  </strong>
                  <span>
                    {l(
                      "معاملات وتعاملات سابقة",
                      "Transactions & past dealings",
                      "Dossiers et échanges antérieurs",
                    )}
                  </span>
                </div>
                <div>
                  <strong>
                    {
                      contactBook.reminders.filter(
                        (r) =>
                          r.contactId === selected.id &&
                          !r.completedAt &&
                          (!r.debtId || canViewAccounting),
                      ).length
                    }
                  </strong>
                  <span>
                    {l(
                      "تذكيرات معلقة",
                      "Pending reminders",
                      "Rappels en attente",
                    )}
                  </span>
                </div>
              </div>
              <div className="crm-contact-notes">
                <article>
                  <h4>{l("آخر اتفاق", "Last agreement", "Dernier accord")}</h4>
                  <p>
                    {selected.latestAgreement ||
                      l(
                        "لم يسجّل اتفاق بعد.",
                        "No agreement recorded yet.",
                        "Aucun accord enregistré.",
                      )}
                  </p>
                </article>
                <article>
                  <h4>
                    {l("ملاحظات الملف", "Profile notes", "Notes du profil")}
                  </h4>
                  <p>
                    {selected.notes ||
                      l(
                        "لا توجد ملاحظات بعد.",
                        "No notes yet.",
                        "Aucune note pour le moment.",
                      )}
                  </p>
                </article>
              </div>
              <div className="crm-contact-section-heading">
                <h4>
                  <Clock3 size={18} />
                  {l(
                    "الخط الزمني للتعاملات والمتابعة",
                    "Interactions & transaction timeline",
                    "Historique des échanges et dossiers",
                  )}
                </h4>
                {canWrite && (
                  <div className="crm-book-actions">
                    <button
                      className="ws-secondary-btn"
                      onClick={() => setReminder(true)}
                    >
                      <Bell size={15} />
                      {l("تذكير", "Reminder", "Rappel")}
                    </button>
                    <button
                      className="ws-primary-btn"
                      onClick={() => setActivity(true)}
                    >
                      <Plus size={15} />
                      {l(
                        "تسجيل متابعة",
                        "Log interaction",
                        "Ajouter un échange",
                      )}
                    </button>
                  </div>
                )}
              </div>
              {events.length ? (
                <ol className="crm-contact-timeline">
                  {events.map((event) => (
                    <li key={event.id} data-event-kind={event.tag}>
                      <span />
                      <div>
                        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <strong>{event.title}</strong>
                            <time style={{ marginInlineStart: '8px' }}>{formatDateTime(event.date)}</time>
                          </div>
                          {canWrite && event.tag === "contact" && (
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="ws-secondary-btn"
                                style={{ padding: '2px 8px', fontSize: '12px' }}
                                title={l("تعديل", "Edit", "Modifier")}
                                onClick={() => {
                                  const act = activities.find((a) => a.id === event.id);
                                  if (act) setActivity(act);
                                }}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                className="ws-secondary-btn"
                                style={{ padding: '2px 8px', fontSize: '12px', color: '#D32F2F' }}
                                title={l("حذف", "Delete", "Supprimer")}
                                onClick={() => {
                                  if (window.confirm(l("هل أنت متأكد أنك تريد المسح؟", "Are you sure you want to delete?", "Êtes-vous sûr de vouloir supprimer ?"))) {
                                    setContactBook((b) => ({
                                      ...b,
                                      activities: b.activities.filter((a) => a.id !== event.id),
                                    }));
                                  }
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </header>
                        <p>{event.text}</p>
                        <small>
                          {event.tag === "contact"
                            ? l(
                                "سجل المتابعة",
                                "Interaction log",
                                "Journal de suivi",
                              )
                            : event.tag === "service"
                              ? l(
                                  "معاملة مسجلة بالنظام",
                                  "System transaction",
                                  "Dossier du système",
                                )
                              : l(
                                  "سجل الديون المستقلة",
                                  "Standalone debt ledger",
                                  "Registre des dettes indépendantes",
                                )}
                        </small>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="crm-book-empty small">
                  <Clock3 size={28} />
                  <p>
                    {l(
                      "لم تسجّل أي متابعة أو معاملة بعد.",
                      "No interactions or transactions yet.",
                      "Aucun échange ou dossier pour le moment.",
                    )}
                  </p>
                </div>
              )}
              {canViewAccounting && (
                <section className="crm-contact-debts">
                  <div className="crm-contact-section-heading">
                    <h4>
                      <Wallet size={18} />
                      {l(
                        "الديون والأرصدة",
                        "Debts & balances",
                        "Dettes et soldes",
                      )}
                    </h4>
                    {finance && (
                      <button
                        className="ws-primary-btn"
                        onClick={() => setDebt(true)}
                      >
                        <Plus size={15} />
                        {l(
                          "دين مستقل",
                          "Standalone debt",
                          "Dette indépendante",
                        )}
                      </button>
                    )}
                  </div>
                  <div className="crm-contact-debt-totals">
                    {(["TRY", "MAD", "EUR", "USD"] as const).map((currency) => {
                      const independent = debts
                          .filter((d) => d.currency === currency && debtDirection(d) === "receivable")
                          .reduce((s, d) => s + manualDebtBalance(d), 0),
                        payable = debts.filter((d) => d.currency === currency && debtDirection(d) === "payable")
                          .reduce((s, d) => s + manualDebtBalance(d), 0),
                        transactions = transactionDebts
                          .filter((d) => d.currency === currency)
                          .reduce(
                            (s, d) => s + toMinorUnits(d.remainingAmount),
                            0,
                          );
                      return (
                        <div key={currency}>
                          <strong>{currency}</strong>
                          <span>
                            {l("ديون لي", "Owed to me", "À recevoir")}:{" "}
                            {formatMinorMoney(independent, currency, true)}
                          </span>
                          <span>{l("ديون عليّ", "I owe", "À payer")}: {formatMinorMoney(payable, currency, true)}</span>
                          <span>
                            {l("معاملات", "Transactions", "Dossiers")}:{" "}
                            {formatMinorMoney(transactions, currency, true)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {debts.map((d) => (
                    <article key={d.id} className="crm-contact-debt">
                      <div>
                        <strong>{d.title}</strong>
                        <small>
                          {formatDate(d.date)} · {debtDirection(d) === 'payable'
                            ? l("عليّ له", "I owe them", "Je lui dois")
                            : l("لي عليه", "They owe me", "Il me doit")}
                        </small>
                        {d.notes && <p>{d.notes}</p>}
                      </div>
                      <b>
                        {formatMinorMoney(
                          manualDebtBalance(d),
                          d.currency,
                          true,
                        )}
                      </b>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        {finance && (
                          <>
                            <button
                              type="button"
                              className="ws-secondary-btn"
                              style={{ padding: '4px 8px', fontSize: '13px' }}
                              title={l("تعديل الدين", "Edit debt", "Modifier la dette")}
                              onClick={() => setDebt(d)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="ws-secondary-btn"
                              style={{ padding: '4px 8px', fontSize: '13px', color: '#D32F2F' }}
                              title={l("حذف الدين", "Delete debt", "Supprimer la dette")}
                              onClick={() => {
                                if (window.confirm(l("هل أنت متأكد أنك تريد مسح هذا الدين؟", "Are you sure you want to delete this debt?", "Êtes-vous sûr de vouloir supprimer cette dette ?"))) {
                                  setContactBook((b) => ({
                                    ...b,
                                    manualDebts: b.manualDebts.filter((x) => x.id !== d.id),
                                    reminders: b.reminders.filter((r) => r.debtId !== d.id),
                                  }));
                                }
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        {finance && manualDebtBalance(d) > 0 ? (
                          <button
                            className="ws-secondary-btn"
                            onClick={() => setPayment(d)}
                          >
                            {l("تسديد", "Pay", "Régler")}
                          </button>
                        ) : manualDebtBalance(d) === 0 ? (
                          <span className="crm-paid-badge">
                            <Check size={14} />
                            {l("مسدد", "Paid", "Réglée")}
                          </span>
                        ) : null}
                      </div>
                    </article>
                  ))}
                  <button
                    className="ws-text-link"
                    onClick={() => app.setActiveTab("debts")}
                  >
                    {l(
                      "فتح سجل الديون والتصدير",
                      "Open debt ledger & exports",
                      "Ouvrir le registre et les exports",
                    )}
                    <ArrowUpRight size={15} />
                  </button>
                </section>
              )}
              {contactBook.reminders
                .filter(
                  (r) =>
                    r.contactId === selected.id &&
                    !r.completedAt &&
                    (!r.debtId || canViewAccounting),
                )
                .map((r) => (
                  <div className="crm-profile-reminder" key={r.id}>
                    <Bell size={17} />
                    <span>
                      <strong>{r.title}</strong>
                      <small>{formatDateTime(r.dueAt)}</small>
                    </span>
                    {(r.debtId ? finance : canWrite) && (
                      <button
                        className="ws-secondary-btn"
                        onClick={() =>
                          setContactBook((b) => ({
                            ...b,
                            reminders: b.reminders.map((x) =>
                              x.id === r.id
                                ? {
                                    ...x,
                                    completedAt: new Date().toISOString(),
                                  }
                                : x,
                            ),
                          }))
                        }
                      >
                        {l("تمت المتابعة", "Done", "Terminé")}
                      </button>
                    )}
                  </div>
                ))}
            </>
          )}
        </section>
      </div>
      {editor && (
        <ContactEditor
          contact={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}
      {activity && selected && (
        <ActivityEditor
          contact={selected}
          activity={typeof activity === 'object' ? activity : undefined}
          onClose={() => setActivity(false)}
        />
      )}
      {reminder && selected && (
        <ReminderEditor contact={selected} onClose={() => setReminder(false)} />
      )}
      {debt && selected && (
        <ManualDebtForm
          contactId={selected.id}
          debt={typeof debt === 'object' ? debt : undefined}
          onClose={() => setDebt(false)}
        />
      )}
      {payment && (
        <ManualDebtPaymentForm
          debt={payment}
          onClose={() => setPayment(null)}
        />
      )}
    </div>
  );
};
const ContactEditor: React.FC<{
  contact?: CRMContact;
  onClose: () => void;
}> = ({ contact, onClose }) => {
  const {
      contactBook,
      setContactBook,
      setSelectedContactId,
      customerProfiles,
    } = useApp(),
    { l } = useCopy();
  const [bitmap, setBitmap] = useState<ImageBitmap>();
  const photoInput = useRef<HTMLInputElement>(null);
  const [alternatePhone, setAlternatePhone] = useState(contact?.alternatePhone || '');
  const [city, setCity] = useState(contact?.city || '');
  const [address, setAddress] = useState(contact?.address || '');
  const [social, setSocial] = useState(contact?.social || {});
  useEffect(() => () => bitmap?.close(), [bitmap]);
  const [photo, setPhoto] = useState(contact?.photo);
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [name, setName] = useState(contact?.name || ""),
    [phone, setPhone] = useState(contact?.phone || ""),
    [email, setEmail] = useState(contact?.email || ""),
    [status, setStatus] = useState<"lead" | "customer">(
      contact?.status || "lead",
    ),
    [rating, setRating] = useState(contact?.rating || 0),
    [notes, setNotes] = useState(contact?.notes || ""),
    [agreement, setAgreement] = useState(contact?.latestAgreement || ""),
    [error, setError] = useState("");
  return (
    <CRMDialog
      name="ContactEditor"
      title={
        contact
          ? l("تعديل جهة الاتصال", "Edit contact", "Modifier le contact")
          : l("جهة اتصال جديدة", "New contact", "Nouveau contact")
      }
      onClose={onClose}
    >
      <form
        className="crm-book-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (readingPhoto || bitmap) return;
          const normalizedSocial: NonNullable<CRMContact['social']> = {};
          for (const key of Object.keys(socialPlatforms) as SocialPlatform[]) {
            const value = social[key]?.trim();
            if (!value) continue;
            const href = safeContactLink(value);
            if (!href) {
              setError(l("أدخل روابط تواصل تبدأ بـ https:// أو http://.", "Social links must start with https:// or http://.", "Les liens doivent commencer par https:// ou http://."));
              return;
            }
            normalizedSocial[key] = href;
          }
          const clean = normalizeContactPhone(phone);
          if (!name.trim()) {
            setError(
              l(
                "أدخل اسم جهة الاتصال.",
                "Enter a contact name.",
                "Saisissez un nom de contact.",
              ),
            );
            return;
          }
          if ((clean && clean.length < 6) || (alternatePhone.trim() && normalizeContactPhone(alternatePhone).length < 6)) {
            setError(
              l(
                "أدخل رقمًا صالحًا، ويفضل أن يتضمن رمز البلد.",
                "Enter a valid phone number, preferably with country code.",
                "Saisissez un numéro valide, de préférence avec indicatif pays.",
              ),
            );
            return;
          }
          if (
            clean &&
            contactBook.contacts.some(
              (c) =>
                c.id !== contact?.id &&
                normalizeContactPhone(c.phone) === clean,
            )
          ) {
            setError(
              l(
                "هذا الرقم موجود بالفعل في جهات الاتصال.",
                "This phone number already belongs to a contact.",
                "Ce numéro existe déjà dans les contacts.",
              ),
            );
            return;
          }
          const now = new Date().toISOString(),
            id = contact?.id || contactBookId(),
            linked =
              contact?.linkedCustomerId ||
              (clean
                ? customerProfiles.find(
                    (p) => normalizeContactPhone(p.phoneNumber) === clean,
                  )?.customerId
                : undefined);
          const saved: CRMContact = {
            id,
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            status,
            rating,
            photo,
            starred: contact?.starred,
            alternatePhone: alternatePhone.trim(),
            city: city.trim(),
            address: address.trim(),
            social: normalizedSocial,
            notes: notes.trim(),
            latestAgreement: agreement.trim(),
            linkedCustomerId: linked,
            createdAt: contact?.createdAt || now,
            updatedAt: now,
          };
          setContactBook((b) => ({
            ...b,
            contacts: contact
              ? b.contacts.map((c) => (c.id === id ? saved : c))
              : [...b.contacts, saved],
          }));
          setSelectedContactId(id);
          onClose();
        }}
      >
        <div className="crm-contact-photo-field">
          <ContactAvatar contact={{ name: name || '•', photo }} large />
          <input ref={photoInput} type="file" hidden aria-label={l("صورة جهة الاتصال", "Contact photo", "Photo du contact")}
            accept="image/jpeg,image/png,image/webp" disabled={readingPhoto} onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              setReadingPhoto(true);
              setError('');
              try {
                if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) throw new Error();
                const decoded = await createImageBitmap(file);
                if (photoInput.current) setBitmap(decoded);
                else decoded.close();
              } catch {
                setError(l("اختر صورة JPG أو PNG أو WebP لا تتجاوز 8 ميغابايت.", "Choose a JPG, PNG or WebP up to 8 MB.", "Choisissez une image JPG, PNG ou WebP de 8 Mo maximum."));
              } finally { setReadingPhoto(false); }
            }} />
          <button type="button" className="ws-primary-btn" disabled={readingPhoto} onClick={() => photoInput.current?.click()}>
            <Camera size={16} />{l("اختيار صورة وقصّها", "Choose and crop photo", "Choisir et recadrer")}
          </button>
          {photo && <button type="button" className="ws-secondary-btn" disabled={readingPhoto} onClick={() => setPhoto(undefined)}>
            {l("إزالة الصورة", "Remove photo", "Supprimer la photo")}
          </button>}
        </div>
        {bitmap && <ContactPhotoCrop bitmap={bitmap} onCancel={() => setBitmap(undefined)}
          onApply={(value) => { setPhoto(value); setBitmap(undefined); }} />}
        <label>
          {l("الاسم", "Name", "Nom")}
          <input
            required
            maxLength={150}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="crm-book-form-row">
          <label>
            {l("رقم الهاتف", "Phone number", "Téléphone")}
            <input
              type="tel"
              dir="ltr"
              maxLength={30}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label>
            {l("البريد الإلكتروني", "Email", "E-mail")}
            <input
              type="email"
              dir="ltr"
              maxLength={200}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        </div>
        <div className="crm-book-form-row">
          <label>
            {l("التصنيف", "Status", "Statut")}
            <select aria-label={l("التصنيف", "Status", "Statut")}
              value={status}
              onChange={(e) => setStatus(e.target.value as "lead" | "customer")}
            >
              <option value="lead">
                {l("جهة محتملة", "Prospect", "Prospect")}
              </option>
              <option value="customer">
                {l("عميل", "Customer", "Client")}
              </option>
            </select>
          </label>
          <div>
            <span>{l("التقييم بالنجمات", "Star rating", "Note par étoiles")}</span>
            <ContactStars rating={rating} onChange={setRating} />
          </div>
        </div>
        <div className="crm-book-form-row">
          <label>{l("هاتف إضافي", "Additional phone", "Téléphone supplémentaire")}
            <input type="tel" dir="ltr" maxLength={30} value={alternatePhone} onChange={e => setAlternatePhone(e.target.value)} />
          </label>
          <label>{l("المدينة", "City", "Ville")}
            <input maxLength={100} value={city} onChange={e => setCity(e.target.value)} />
          </label>
        </div>
        <label>{l("العنوان", "Address", "Adresse")}
          <input maxLength={250} value={address} onChange={e => setAddress(e.target.value)} />
        </label>
        <fieldset className="crm-contact-social-form">
          <legend>{l("روابط التواصل الاجتماعي", "Social links", "Réseaux sociaux")}</legend>
          {Object.entries(socialPlatforms).map(([key, title]) =>
            <label key={key}>{title}
              <input type="url" dir="ltr" maxLength={500} placeholder="https://" value={social[key as SocialPlatform] || ''}
                onChange={e => setSocial({ ...social, [key]: e.target.value })} />
            </label>
          )}
        </fieldset>
        <label>
          {l("آخر اتفاق", "Last agreement", "Dernier accord")}
          <textarea
            maxLength={5000}
            value={agreement}
            onChange={(e) => setAgreement(e.target.value)}
          />
        </label>
        <label>
          {l("ملاحظات", "Notes", "Notes")}
          <textarea
            maxLength={5000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="crm-book-error">
            {error}
          </p>
        )}
        <div className="crm-book-form-actions">
          <button type="button" className="ws-secondary-btn" onClick={onClose}>
            {l("إلغاء", "Cancel", "Annuler")}
          </button>
          <button type="submit" disabled={readingPhoto || Boolean(bitmap)} className="ws-primary-btn">
            {l("حفظ جهة الاتصال", "Save contact", "Enregistrer le contact")}
          </button>
        </div>
      </form>
    </CRMDialog>
  );
};
const ActivityEditor: React.FC<{
  contact: CRMContact;
  activity?: ContactActivity;
  onClose: () => void;
}> = ({ contact, activity, onClose }) => {
  const { setContactBook } = useApp(),
    { l } = useCopy();
  const [kind, setKind] = useState<ContactActivityKind>(activity?.kind || "call"),
    [text, setText] = useState(activity?.text || ""),
    [date, setDate] = useState(() => {
      if (activity?.occurredAt) {
        const d = new Date(activity.occurredAt);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
      }
      const d = new Date();
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    });
  return (
    <CRMDialog
      name="ActivityEditor"
      title={
        activity
          ? l("تعديل متابعة أو ملاحظة", "Edit interaction or note", "Modifier l’échange ou la note")
          : l(
              "تسجيل متابعة أو تعامل سابق",
              "Log an interaction or past dealing",
              "Enregistrer un échange ou un historique",
            )
      }
      onClose={onClose}
    >
      <form
        className="crm-book-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          const now = new Date().toISOString();
          if (activity) {
            setContactBook((b) => ({
              ...b,
              activities: b.activities.map((a) =>
                a.id === activity.id
                  ? {
                      ...a,
                      kind,
                      text: text.trim(),
                      occurredAt: new Date(date).toISOString(),
                    }
                  : a,
              ),
              contacts:
                kind === "agreement"
                  ? b.contacts.map((c) =>
                      c.id === contact.id
                        ? { ...c, latestAgreement: text.trim(), updatedAt: now }
                        : c,
                    )
                  : b.contacts,
            }));
            onClose();
            return;
          }
          setContactBook((b) => ({
            ...b,
            activities: [
              ...b.activities,
              {
                id: contactBookId(),
                contactId: contact.id,
                kind,
                text: text.trim(),
                occurredAt: new Date(date).toISOString(),
                createdAt: now,
              },
            ],
            contacts:
              kind === "agreement"
                ? b.contacts.map((c) =>
                    c.id === contact.id
                      ? { ...c, latestAgreement: text.trim(), updatedAt: now }
                      : c,
                  )
                : b.contacts,
          }));
          onClose();
        }}
      >
        <label>
          {l("نوع المتابعة", "Interaction type", "Type d’échange")}
          <select aria-label={l("نوع المتابعة", "Interaction type", "Type d’échange")}
            value={kind}
            onChange={(e) => setKind(e.target.value as ContactActivityKind)}
          >
            {[
              ["call", l("مكالمة", "Call", "Appel")],
              ["message", l("رسالة", "Message", "Message")],
              ["meeting", l("لقاء", "Meeting", "Rendez-vous")],
              ["agreement", l("اتفاق", "Agreement", "Accord")],
              [
                "historical",
                l("تعامل سابق", "Historical dealing", "Échange antérieur"),
              ],
              ["note", l("ملاحظة", "Note", "Note")],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          {l("التاريخ والوقت", "Date & time", "Date et heure")}
          <input
            required
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          {l("التفاصيل", "Details", "Détails")}
          <textarea
            required
            maxLength={5000}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        <p className="crm-book-hint">
          {l(
            "التعامل السابق يُضاف إلى التاريخ فقط، دون إنشاء خدمة أو فاتورة أو مبلغ مالي.",
            "Historical dealings add context only; they create no service, invoice or financial amount.",
            "Un échange antérieur enrichit l’historique sans créer de service, facture ou montant.",
          )}
        </p>
        <div className="crm-book-form-actions">
          {activity && (
            <button
              type="button"
              className="ws-secondary-btn"
              style={{ color: '#D32F2F', borderColor: '#D32F2F', marginRight: 'auto' }}
              onClick={() => {
                if (window.confirm(l("هل أنت متأكد أنك تريد المسح؟", "Are you sure you want to delete this note?", "Êtes-vous sûr de vouloir supprimer cette note ?"))) {
                  setContactBook((b) => ({
                    ...b,
                    activities: b.activities.filter((a) => a.id !== activity.id),
                  }));
                  onClose();
                }
              }}
            >
              {l("حذف الملاحظة", "Delete note", "Supprimer la note")}
            </button>
          )}
          <button type="button" className="ws-secondary-btn" onClick={onClose}>
            {l("إلغاء", "Cancel", "Annuler")}
          </button>
          <button type="submit" className="ws-primary-btn">
            {l("حفظ المتابعة", "Save interaction", "Enregistrer l’échange")}
          </button>
        </div>
      </form>
    </CRMDialog>
  );
};
const ReminderEditor: React.FC<{
  contact: CRMContact;
  onClose: () => void;
}> = ({ contact, onClose }) => {
  const { setContactBook } = useApp(),
    { l } = useCopy();
  const [title, setTitle] = useState(""),
    [date, setDate] = useState("");
  return (
    <CRMDialog
      name="ContactReminderEditor"
      title={l("تذكير متابعة", "Follow-up reminder", "Rappel de suivi")}
      onClose={onClose}
    >
      <form
        className="crm-book-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          setContactBook((b) => ({
            ...b,
            reminders: [
              ...b.reminders,
              {
                id: contactBookId(),
                contactId: contact.id,
                title: title.trim(),
                dueAt: new Date(date).toISOString(),
                createdAt: new Date().toISOString(),
              },
            ],
          }));
          onClose();
        }}
      >
        <label>
          {l("سبب التذكير", "Reminder reason", "Motif du rappel")}
          <input
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label>
          {l("التاريخ والوقت", "Date & time", "Date et heure")}
          <input
            required
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <p className="crm-book-hint">
          {l(
            "يظهر داخل النظام عند فتحه؛ ليس إشعارًا تلقائيًا خارج المتصفح.",
            "Shown in the app when it is open; not a background notification.",
            "Visible dans l’application ouverte, sans notification en arrière-plan.",
          )}
        </p>
        <div className="crm-book-form-actions">
          <button type="button" className="ws-secondary-btn" onClick={onClose}>
            {l("إلغاء", "Cancel", "Annuler")}
          </button>
          <button type="submit" className="ws-primary-btn">
            {l("حفظ التذكير", "Save reminder", "Enregistrer le rappel")}
          </button>
        </div>
      </form>
    </CRMDialog>
  );
};
