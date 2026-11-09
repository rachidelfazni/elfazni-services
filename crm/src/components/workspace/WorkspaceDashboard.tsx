import React, { useMemo, useState } from "react";
import {
  ArrowUpLeft,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Users,
  CalendarCheck,
  Plane,
  Wallet,
  Receipt,
  CheckCircle2,
  Clock3,
  FileText,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useCopy } from "../../i18n/useCopy";
import { formatMoney } from "../../utils/formatters";
import { useUITranslation } from "../../i18n/useUITranslation";
import { VisibilitySection } from "../common/VisibilitySection";
import { WorkspaceAnalytics } from "./WorkspaceAnalytics";
import { SupportedCurrency } from "../../types";
export const WorkspaceDashboard: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { ui } = useUITranslation();
  const app = useApp(),
    { user, canViewAccounting, setIsUserProfileModalOpen } = useAuth(),
    { l, language, isRTL } = useCopy();
  const [currency, setCurrency] = useState<SupportedCurrency>("TRY");
  const privileged = ["super_admin", "admin", "editor", "agent"].includes(
    user?.role || "",
  );
  const canConsulate = privileged || !!user?.canAccessConsulate,
    canFlights = privileged || !!user?.canAccessFlights;
  const records = useMemo(
    () =>
      [
        ...(canConsulate
          ? app.consulateAppointments.map((item) => ({
              type: "consulate" as const,
              item,
              id: item.id,
              name: item.clientName,
              date: item.submissionDate,
              service: item.appointmentType,
              total: item.price,
              paid: item.paidAmount,
              balance: item.remainingAmount,
              currency: item.currency,
              status: item.paymentStatus,
              updated: item.updatedAt,
            }))
          : []),
        ...(canFlights
          ? app.flightBookings.map((item) => ({
              type: "flight" as const,
              item,
              id: item.id,
              name: item.clientName,
              date: item.bookingDate,
              service: item.airlineAndRoute,
              total: item.sellingPrice,
              paid: item.paidAmount,
              balance: item.remainingAmount,
              currency: item.currency,
              status: item.paymentStatus,
              updated: item.updatedAt,
            }))
          : []),
      ].sort((a, b) => b.date.localeCompare(a.date)),
    [app.consulateAppointments, app.flightBookings, canConsulate, canFlights],
  );
  const period = records.filter((r) => {
    const [y, m] = r.date.split("-").map(Number);
    return (
      y === app.selectedYear && (!app.selectedMonth || m === app.selectedMonth)
    );
  });
  const finance = period.filter((r) => r.currency === currency);
  const total = finance.reduce((s, r) => s + r.total, 0),
    balance = finance.reduce((s, r) => s + r.balance, 0);
  // Remaining balances are already calculated in the selling currency by AppContext.
  const paid = total - balance;
  const clients = new Set(period.map((r) => r.item.phoneNumber || r.name)).size;
  const reminders = records
    .filter((r) => r.item.reminder && !r.item.reminder.isCompleted)
    .sort((a, b) =>
      a.item.reminder!.targetDateTime.localeCompare(
        b.item.reminder!.targetDateTime,
      ),
    )
    .slice(0, 3);
  const arrow = isRTL ? <ArrowLeft size={15} /> : <ArrowRight size={15} />;
  const labelDate = (date: string) =>
    new Intl.DateTimeFormat(
      language === "ar" ? "ar-MA" : language === "fr" ? "fr-FR" : "en-GB",
      { day: "numeric", month: "short" },
    ).format(new Date(date + "T12:00:00"));
  const status = (key: string) =>
    key === "paid"
      ? l("مدفوع", "Paid", "Payé")
      : key === "partial"
        ? l("دفع جزئي", "Part paid", "Partiel")
        : l("غير مدفوع", "Unpaid", "Impayé");
  return (
    <div className="ws-dashboard">
      <VisibilitySection
        sectionId="welcome"
        title={l(
          "الترحيب والملف الشخصي",
          "Welcome & profile",
          "Accueil et profil",
        )}
      >
        <section className="ws-page-heading ws-welcome-banner ws-welcome-banner-split">
          <div>
            <span className="ws-eyebrow">
              ELFAZNI SERVICES <b>PRO</b>
            </span>
            <h2>
              {l(
                `مرحبًا بك، ${user?.displayName?.split("(")[0]?.trim() || "رشيد"}`,
                `Welcome back, ${user?.displayName?.split("(")[0]?.trim() || "Rachid"}`,
                `Bon retour, ${user?.displayName?.split("(")[0]?.trim() || "Rachid"}`,
              )}
            </h2>
            <p>
              {l(
                "تابع عملاءك ومعاملاتك، وامنح كل خدمة الاهتمام الذي تستحقه.",
                "Stay close to your customers and keep every service moving.",
                "Suivez vos clients et faites avancer chaque dossier.",
              )}
            </p>
            <a href="#section-analytics" className="ws-analytics-jump">
              <FileText size={16} />
              {l(
                "استعرض الإحصاءات والتقارير",
                "Explore analytics & reports",
                "Consulter les analyses et rapports",
              )}
            </a>
          </div>
          <button
            className="ws-welcome-profile"
            onClick={() => setIsUserProfileModalOpen(true)}
          >
            <span className="ws-welcome-avatar">
              {user?.avatarUrl ? (
                <img
                  key={user.avatarUrl}
                  src={user.avatarUrl}
                  alt=""
                  onError={(e) => {
                    const fallback = '/admin/crm/assets/founder-rachid-elfazni-v2.webp';
                    if (e.currentTarget.getAttribute('src') !== fallback) e.currentTarget.src = fallback;
                    else e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
              <span>{user?.displayName?.slice(0, 1) || "E"}</span>
            </span>
            <span>
              <small>
                {l("أهلاً بك مجدداً", "Welcome back", "Bon retour")}
              </small>
              <strong>{user?.displayName?.split("(")[0]?.trim()}</strong>
              <span>
                {l(
                  "الملف الشخصي وإعدادات الصورة",
                  "Profile and photo settings",
                  "Profil et réglages de la photo",
                )}
              </span>
            </span>
          </button>
        </section>
      </VisibilitySection>
      <VisibilitySection
        sectionId="pipeline"
        title={l(
          "الخط الزمني للخدمات",
          "Service pipeline",
          "Suivi des services",
        )}
      >
        <section
          id="service-pipeline"
          className="ws-service-pipeline"
          tabIndex={-1}
          aria-label={l(
            "الخط الزمني لمتابعة الخدمات",
            "Service pipeline",
            "Suivi des services",
          )}
        >
          {children}
        </section>
      </VisibilitySection>
      {canViewAccounting && (
        <>
          <div className="ws-section-caption">
            <span>
              {l("المؤشرات المالية", "FINANCIAL SNAPSHOT", "APERÇU FINANCIER")}
            </span>
            <label>
              {l("عملة العرض", "Display currency", "Devise")}{" "}
              <select
                aria-label={l(
                  "عملة المؤشرات",
                  "Metrics currency",
                  "Devise des indicateurs",
                )}
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value as SupportedCurrency)
                }
              >
                {["TRY", "MAD", "EUR", "USD"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <VisibilitySection
            sectionId="metrics"
            title={l(
              "المؤشرات المالية",
              "Financial snapshot",
              "Indicateurs financiers",
            )}
          >
            <section className="ws-metric-grid">
              {[
                {
                  name: l(
                    "قيمة المعاملات",
                    "Transaction value",
                    "Valeur des dossiers",
                  ),
                  value: formatMoney(total, currency),
                  sub: l(
                    "معاملات الفترة المحددة",
                    "Selected reporting period",
                    "Période sélectionnée",
                  ),
                  icon: Receipt,
                  tone: "blue",
                  tab: "invoices",
                },
                {
                  name: l(
                    "المحصّل من المعاملات",
                    "Collected from transactions",
                    "Encaissements des dossiers",
                  ),
                  value: formatMoney(paid, currency),
                  sub: l(
                    "بالعملة الأصلية للمعاملة",
                    "In the transaction currency",
                    "Dans la devise du dossier",
                  ),
                  icon: CheckCircle2,
                  tone: "green",
                  tab: "reports",
                },
                {
                  name: l(
                    "المستحقات المتبقية",
                    "Outstanding balance",
                    "Solde à recevoir",
                  ),
                  value: formatMoney(balance, currency),
                  sub: l(
                    "متابعة الدفعات المستحقة",
                    "Keep track of receivables",
                    "Suivez les paiements à recevoir",
                  ),
                  icon: Wallet,
                  tone: "gold",
                  tab: "debts",
                },
                {
                  name: l(
                    "عملاء الفترة",
                    "Customers this period",
                    "Clients de la période",
                  ),
                  value: String(clients).padStart(2, "0"),
                  sub: l(
                    "عبر جميع العملات",
                    "Across all currencies",
                    "Toutes devises confondues",
                  ),
                  icon: Users,
                  tone: "navy",
                  tab: "customers",
                },
              ].map((m) => (
                <button
                  className={`ws-metric ws-metric-${m.tone}`}
                  key={m.tab}
                  onClick={() => app.setActiveTab(m.tab as any)}
                >
                  <div>
                    <span>{m.name}</span>
                    <m.icon size={18} />
                  </div>
                  <strong dir="ltr">{m.value}</strong>
                  <small>
                    {m.sub}
                    <span>{arrow}</span>
                  </small>
                </button>
              ))}
            </section>
          </VisibilitySection>
        </>
      )}
      <>
        <VisibilitySection
          sectionId="analytics"
          title={l(
            "الإحصاءات والتقارير",
            "Analytics & reports",
            "Analyses et rapports",
          )}
        >
          <WorkspaceAnalytics currency={currency} />
        </VisibilitySection>
        <div className="ws-dashboard-bottom">
          <VisibilitySection
            sectionId="recent"
            title={l(
              "أحدث المعاملات",
              "Recent transactions",
              "Dossiers récents",
            )}
          >
            <section className="ws-card ws-recent-card">
              <div className="ws-card-heading">
                <div>
                  <h3>
                    {l(
                      "أحدث المعاملات",
                      "Recent transactions",
                      "Derniers dossiers",
                    )}
                  </h3>
                  <p>
                    {l(
                      "كل التفاصيل التي تحتاجها للمتابعة",
                      "The details you need to keep moving",
                      "L’essentiel pour assurer le suivi",
                    )}
                  </p>
                </div>
                <button
                  className="ws-text-link"
                  onClick={() => {
                    const pipeline =
                      document.getElementById("service-pipeline");
                    pipeline?.scrollIntoView({ block: "start" });
                    pipeline?.focus({ preventScroll: true });
                  }}
                >
                  {l("عرض المسار", "View pipeline", "Voir le suivi")}
                  {arrow}
                </button>
              </div>
              <div className="ws-table-scroll">
                <table className="ws-table">
                  <thead>
                    <tr>
                      <th>
                        {l(
                          "العميل والخدمة",
                          "Customer & service",
                          "Client et service",
                        )}
                      </th>
                      <th>{l("التاريخ", "Date", "Date")}</th>
                      {canViewAccounting && (
                        <th>{l("القيمة", "Amount", "Montant")}</th>
                      )}
                      <th>{l("الحالة", "Status", "Statut")}</th>
                      <th>
                        <span className="sr-only">
                          {l("فتح", "Open", "Ouvrir")}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {period.slice(0, 6).map((r) => (
                      <tr key={r.type + r.id}>
                        <td>
                          <button
                            className="ws-client-cell"
                            onClick={() =>
                              app.setSpotlightItem({
                                type: r.type,
                                item: r.item,
                              } as any)
                            }
                          >
                            <span className={`ws-service-icon ${r.type}`}>
                              {r.type === "flight" ? (
                                <Plane size={17} />
                              ) : (
                                <CalendarCheck size={17} />
                              )}
                            </span>
                            <span>
                              <strong>{r.name}</strong>
                              <small>{ui(r.service)}</small>
                            </span>
                          </button>
                        </td>
                        <td>{labelDate(r.date)}</td>
                        {canViewAccounting && (
                          <td>
                            <bdi className="ws-amount">
                              {formatMoney(r.total, r.currency)}
                            </bdi>
                          </td>
                        )}
                        <td>
                          <span className={`ws-status ${r.status}`}>
                            {status(r.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="ws-icon-btn"
                            aria-label={l(
                              "فتح المعاملة",
                              "Open transaction",
                              "Ouvrir le dossier",
                            )}
                            onClick={() =>
                              app.setSpotlightItem({
                                type: r.type,
                                item: r.item,
                              } as any)
                            }
                          >
                            {isRTL ? (
                              <ArrowUpLeft size={16} />
                            ) : (
                              <ArrowUpRight size={16} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {period.length === 0 && (
                  <div className="ws-empty">
                    <FileText />
                    <strong>
                      {l(
                        "لا توجد معاملات لهذه الفترة",
                        "No transactions in this period",
                        "Aucun dossier pour cette période",
                      )}
                    </strong>
                    <span>
                      {l(
                        "غيّر فترة العرض أو أضف معاملة جديدة.",
                        "Change the period or create a transaction.",
                        "Modifiez la période ou créez un dossier.",
                      )}
                    </span>
                  </div>
                )}
              </div>
            </section>
          </VisibilitySection>
          <div className="ws-side-stack">
            <VisibilitySection
              sectionId="followups"
              title={l(
                "التذكيرات والمتابعات",
                "Reminders & follow-ups",
                "Rappels et suivi",
              )}
            >
              <section className="ws-card ws-followups">
                <div className="ws-card-heading">
                  <h3>
                    {l("المتابعات القادمة", "Follow-ups", "Prochains suivis")}
                  </h3>
                  <Clock3 size={18} />
                </div>
                {reminders.length ? (
                  reminders.map((r) => (
                    <button
                      key={r.id}
                      onClick={() =>
                        app.setSpotlightItem({
                          type: r.type,
                          item: r.item,
                        } as any)
                      }
                    >
                      <span className="ws-reminder-mark" />
                      <span>
                        <strong>{r.name}</strong>
                        <small>{r.item.reminder!.reason}</small>
                        <time>
                          {new Intl.DateTimeFormat(
                            language === "ar"
                              ? "ar-MA"
                              : language === "fr"
                                ? "fr-FR"
                                : "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          ).format(new Date(r.item.reminder!.targetDateTime))}
                        </time>
                      </span>
                    </button>
                  ))
                ) : (
                  <p>
                    {l(
                      "لا توجد متابعات معلقة.",
                      "No pending follow-ups.",
                      "Aucun suivi en attente.",
                    )}
                  </p>
                )}
                <button
                  className="ws-text-link"
                  onClick={() => app.setActiveTab("tools")}
                >
                  {l("مركز المتابعات", "Follow-up center", "Centre de suivi")}
                  {arrow}
                </button>
              </section>
            </VisibilitySection>
            <VisibilitySection
              sectionId="brand-note"
              title={l("من المؤسسة", "From our company", "Notre entreprise")}
            >
              <section className="ws-brand-note">
                <span>ELFAZNI SERVICES</span>
                <h3>
                  {l(
                    "علاقات أقوى.\nخدمة تستحق الثقة.",
                    "Closer connections.\nService you can trust.",
                    "Des liens durables.\nUn service de confiance.",
                  )}
                </h3>
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                >
                  {l(
                    "اكتشف موقع المؤسسة",
                    "Visit our website",
                    "Découvrir notre site",
                  )}
                  {arrow}
                </a>
                <div className="ws-brand-note-lines" aria-hidden="true" />
              </section>
            </VisibilitySection>
          </div>
        </div>
      </>
    </div>
  );
};
