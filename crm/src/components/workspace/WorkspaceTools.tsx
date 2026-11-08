import { BankDetailsShare } from "../common/BankDetailsShare";
import { ContactRemindersPanel } from "../contacts/ContactReminders";
import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  Download,
  CheckCircle2,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Link2,
  Bell,
  ArrowUpRight,
  Send,
  ClipboardCheck,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useCopy } from "../../i18n/useCopy";
function messageLink(phone: string, message: string) {
  let p = phone.replace(/[^0-9]/g, "").replace(/^00/, "");
  if (p.startsWith("05") && p.length === 11) p = "90" + p.slice(1);
  return `https://wa.me/${p}?text=${encodeURIComponent(message)}`;
}
export function buildCalendarFile(
  events: { id: string; title: string; date: string; description: string }[],
) {
  const escape = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const utc = (date: string) =>
    new Date(date)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  // RFC 5545 limits content lines to 75 octets; fold without splitting Unicode.
  const fold = (line: string) => {
    const parts: string[] = [];
    let current = "",
      bytes = 0;
    for (const char of line) {
      const n = new TextEncoder().encode(char).length;
      if (bytes + n > 74) {
        parts.push(current);
        current = " ";
        bytes = 1;
      }
      current += char;
      bytes += n;
    }
    parts.push(current);
    return parts.join("\r\n");
  };
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ELFAZNI SERVICES//CRM//EN",
    "CALSCALE:GREGORIAN",
    ...events.flatMap((e) => [
      "BEGIN:VEVENT",
      `UID:${e.id}@elfazni-crm`,
      `DTSTAMP:${utc(new Date().toISOString())}`,
      `DTSTART:${utc(e.date)}`,
      `DTEND:${utc(new Date(new Date(e.date).getTime() + 30 * 60000).toISOString())}`,
      `SUMMARY:${escape(e.title)}`,
      `DESCRIPTION:${escape(e.description)}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT30M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escape(e.title)}`,
      "END:VALARM",
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n");
}
export const WorkspaceTools: React.FC = () => {
  const app = useApp(),
    auth = useAuth(),
    { l, language } = useCopy();
  const [tab, setTab] = useState("agenda"),
    [selected, setSelected] = useState(""),
    [template, setTemplate] = useState("followup"),
    [copied, setCopied] = useState(false);
  const privileged = ["super_admin", "admin", "editor", "agent"].includes(
    auth.user?.role || "",
  );
  const records = [
    ...(privileged || auth.user?.canAccessConsulate
      ? app.consulateAppointments.map((item) => ({
          type: "consulate" as const,
          item,
        }))
      : []),
    ...(privileged || auth.user?.canAccessFlights
      ? app.flightBookings.map((item) => ({ type: "flight" as const, item }))
      : []),
  ];
  const agenda = records
    .filter(
      (r) =>
        r.item.reminder &&
        !r.item.reminder.isCompleted &&
        !isNaN(new Date(r.item.reminder.targetDateTime).getTime()),
    )
    .sort((a, b) =>
      a.item.reminder!.targetDateTime.localeCompare(
        b.item.reminder!.targetDateTime,
      ),
    );
  const clients = app.customerProfiles;
  const customer = clients.find((c) => c.customerId === selected) || clients[0];
  const message = customer
    ? l(
        `مرحبًا ${customer.clientName}، معك فريق ELFAZNI SERVICES. ${template === "documents" ? "نرجو التواصل معنا لاستكمال مستندات معاملتكم." : template === "payment" ? "نود تذكيركم بمراجعة الدفعة المستحقة على معاملتكم. يرجى التواصل معنا للتأكد من المبلغ وطريقة السداد." : "نتواصل معكم لمتابعة معاملتكم والإجابة عن استفساراتكم."} شكرًا لثقتكم.`,
        `Hello ${customer.clientName}, this is the ELFAZNI SERVICES team. ${template === "documents" ? "Please contact us to complete the documents for your service." : template === "payment" ? "A friendly reminder to review the payment due on your service. Please contact us to confirm the amount and payment method." : "We are following up on your service and are happy to answer your questions."} Thank you for your trust.`,
        `Bonjour ${customer.clientName}, ici l’équipe ELFAZNI SERVICES. ${template === "documents" ? "Merci de nous contacter pour compléter les documents de votre dossier." : template === "payment" ? "Nous vous invitons à vérifier le paiement à régler pour votre dossier. Contactez-nous pour confirmer le montant et le mode de paiement." : "Nous vous contactons pour assurer le suivi de votre dossier et répondre à vos questions."} Merci de votre confiance.`,
      )
    : "";
  const exportCalendar = () => {
    const text = buildCalendarFile(
      agenda.map((r) => ({
        id: r.item.reminder!.id,
        title: `ELFAZNI · ${r.item.clientName}`,
        date: r.item.reminder!.targetDateTime,
        description: r.item.reminder!.reason,
      })),
    );
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/calendar;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "ELFAZNI_Followups.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="ws-tools">
      <section className="ws-page-heading">
        <div>
          <span className="ws-eyebrow">{l("تجربة الخدمة", "SERVICE EXPERIENCE", "EXPÉRIENCE CLIENT")}</span>
          <h2>
            {l(
              "متابعة أدق، وتجربة أفضل.",
              "Thoughtful follow-ups. Better service.",
              "Un suivi attentif. Un meilleur service.",
            )}
          </h2>
          <p>
            {l(
              "التذكيرات، رسائل العملاء، والخدمات التي تساعدك على تطوير العمل.",
              "Reminders, customer messages and tools that help your business grow.",
              "Rappels, messages clients et outils pour développer votre activité.",
            )}
          </p>
        </div>
        <span className="ws-outline-icon">
          <ClipboardCheck />
        </span>
      </section>
      <BankDetailsShare/>
      <ContactRemindersPanel/>
      <div className="ws-tabs" role="tablist">
        {[
          [
            "agenda",
            l("أجندة المتابعة", "Follow-up agenda", "Agenda de suivi"),
            CalendarDays,
          ],
          [
            "messages",
            l("قوالب التواصل", "Message templates", "Modèles de messages"),
            MessageCircle,
          ],
          [
            "integrations",
            l(
              "الخدمات والإضافات",
              "Services & integrations",
              "Services et intégrations",
            ),
            Link2,
          ],
        ].map(([id, label, Icon]: any) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>
      {tab === "agenda" && (
        <section className="ws-card">
          <div className="ws-card-heading">
            <div>
              <h3>
                {l("أجندة المتابعات", "Follow-up agenda", "Agenda de suivi")}
              </h3>
              <p>
                {l(
                  "المواعيد هنا مأخوذة من تذكيراتك المسجلة.",
                  "Dates come from your saved follow-up reminders.",
                  "Ces dates proviennent de vos rappels enregistrés.",
                )}
              </p>
            </div>
            <button
              className="ws-btn ws-btn-secondary"
              disabled={!agenda.length}
              onClick={exportCalendar}
            >
              <Download size={16} />
              {l("تصدير للتقويم", "Export calendar", "Exporter le calendrier")}
            </button>
          </div>
          <div className="ws-agenda">
            {agenda.map((r) => (
              <article key={r.type + r.item.id}>
                <div className="ws-date-tile">
                  <b>{new Date(r.item.reminder!.targetDateTime).getDate()}</b>
                  <span>
                    {new Intl.DateTimeFormat(
                      language === "ar"
                        ? "ar-MA"
                        : language === "fr"
                          ? "fr-FR"
                          : "en-GB",
                      { month: "short" },
                    ).format(new Date(r.item.reminder!.targetDateTime))}
                  </span>
                </div>
                <div>
                  <strong>{r.item.clientName}</strong>
                  <p>{r.item.reminder!.reason}</p>
                  <small>
                    {new Intl.DateTimeFormat(
                      language === "ar"
                        ? "ar-MA"
                        : language === "fr"
                          ? "fr-FR"
                          : "en-GB",
                      { dateStyle: "medium", timeStyle: "short" },
                    ).format(new Date(r.item.reminder!.targetDateTime))}
                  </small>
                </div>
                <button
                  className="ws-btn ws-btn-secondary"
                  onClick={() => app.completeReminder(r.type, r.item.id)}
                >
                  <CheckCircle2 size={16} />
                  {l("تمت المتابعة", "Mark complete", "Terminer")}
                </button>
              </article>
            ))}
            {!agenda.length && (
              <div className="ws-empty">
                <Bell />
                <strong>
                  {l(
                    "لا توجد متابعات معلقة",
                    "No pending follow-ups",
                    "Aucun suivi en attente",
                  )}
                </strong>
                <span>
                  {l(
                    "أضف تذكيرًا من أي معاملة ليظهر في الأجندة.",
                    "Add a reminder to a transaction to see it here.",
                    "Ajoutez un rappel à un dossier pour le retrouver ici.",
                  )}
                </span>
              </div>
            )}
          </div>
        </section>
      )}
      {tab === "messages" && (
        <div className="ws-message-layout">
          <section className="ws-card ws-message-controls">
            <h3>
              {l(
                "رسالة مناسبة لكل متابعة",
                "A message for every follow-up",
                "Un message pour chaque suivi",
              )}
            </h3>
            <label>
              {l("العميل", "Customer", "Client")}
              <select
                value={customer?.customerId || ""}
                onChange={(e) => setSelected(e.target.value)}
              >
                {clients.map((c) => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.clientName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {l("نوع الرسالة", "Message type", "Type de message")}
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              >
                <option value="followup">
                  {l("متابعة عامة", "General follow-up", "Suivi général")}
                </option>
                <option value="documents">
                  {l(
                    "استكمال المستندات",
                    "Missing documents",
                    "Documents à compléter",
                  )}
                </option>
                {auth.canViewAccounting && (
                  <option value="payment">
                    {l(
                      "تذكير بالدفع",
                      "Payment reminder",
                      "Rappel de paiement",
                    )}
                  </option>
                )}
              </select>
            </label>
            <p>
              {l(
                "راجع النص قبل إرساله. يفتح واتساب لتأكيد الإرسال بنفسك.",
                "Review the message. WhatsApp opens so you can confirm sending.",
                "Relisez le message. WhatsApp s’ouvre pour vous laisser confirmer l’envoi.",
              )}
            </p>
          </section>
          <section className="ws-card ws-message-preview">
            <span className="ws-eyebrow">ELFAZNI SERVICES</span>
            <textarea
              aria-label={l(
                "معاينة الرسالة",
                "Message preview",
                "Aperçu du message",
              )}
              value={message}
              readOnly
              rows={7}
            />
            <div>
              <button
                disabled={!message}
                className="ws-btn ws-btn-secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(message);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
                {copied
                  ? l("تم النسخ", "Copied", "Copié")
                  : l("نسخ النص", "Copy message", "Copier")}
              </button>
              {customer?.phoneNumber && (
                <a
                  className="ws-btn ws-btn-primary"
                  href={messageLink(customer.phoneNumber, message)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={16} />
                  {l("فتح في واتساب", "Open WhatsApp", "Ouvrir WhatsApp")}
                </a>
              )}
            </div>
          </section>
        </div>
      )}
      {tab === "integrations" && (
        <div className="ws-integration-grid">
          {[
            {
              name: "Calendar",
              icon: CalendarDays,
              tag: l("متاح الآن", "Available now", "Disponible"),
              text: l(
                "صدّر متابعاتك إلى Google Calendar أو Outlook أو Apple Calendar بملف تقويم.",
                "Export follow-ups to Google Calendar, Outlook or Apple Calendar.",
                "Exportez vos suivis vers Google Calendar, Outlook ou Apple Calendar.",
              ),
              link: "https://support.google.com/calendar/answer/37118",
              ready: true,
            },
            {
              name: "WhatsApp",
              icon: MessageCircle,
              tag: l(
                "قوالب متاحة",
                "Templates available",
                "Modèles disponibles",
              ),
              text: l(
                "قوالب عربية وإنجليزية وفرنسية للمتابعة واستكمال المستندات. الأتمتة الكاملة تحتاج ربط WhatsApp Business.",
                "Arabic, English and French templates. Automatic messaging requires a WhatsApp Business integration.",
                "Modèles en arabe, anglais et français. L’automatisation nécessite une connexion WhatsApp Business.",
              ),
              link: "https://business.whatsapp.com/products/business-platform",
              ready: true,
            },
            {
              name: "Supabase",
              icon: Database,
              tag: l(
                "ربط مقترح",
                "Suggested integration",
                "Intégration proposée",
              ),
              text: l(
                "قاعدة بيانات مشتركة، مصادقة، وصلاحيات لحفظ عمل الفريق عبر الأجهزة. يحتاج إعداد حساب وربط خادمي.",
                "Shared database, authentication and access control across devices. Requires account and backend setup.",
                "Base partagée, authentification et droits multi-appareils. Nécessite un compte et une configuration serveur.",
              ),
              link: "https://supabase.com/docs/guides/auth",
              ready: false,
            },
            {
              name: "PostHog",
              icon: ChartNoAxesCombined,
              tag: l(
                "ربط مقترح",
                "Suggested integration",
                "Intégration proposée",
              ),
              text: l(
                "تحليل استخدام الواجهات واكتشاف نقاط التعثر، مع ضبط إخفاء بيانات العملاء قبل تفعيله.",
                "Understand interface usage and friction, with customer data masking configured before activation.",
                "Analysez les usages et les difficultés, avec masquage des données clients avant activation.",
              ),
              link: "https://posthog.com/docs/session-replay",
              ready: false,
            },
          ].map((x) => (
            <section className="ws-card ws-integration" key={x.name}>
              <div className="ws-integration-icon">
                <x.icon />
              </div>
              <span className={`ws-tag ${x.ready ? "ready" : ""}`}>
                {x.tag}
              </span>
              <h3>{x.name}</h3>
              <p>{x.text}</p>
              <a
                className="ws-text-link"
                href={x.link}
                target="_blank"
                rel="noreferrer"
              >
                {l("التفاصيل", "Learn more", "En savoir plus")}
                <ExternalLink size={14} />
              </a>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
import { Database, ChartNoAxesCombined } from "lucide-react";
