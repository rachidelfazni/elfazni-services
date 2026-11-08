import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, X, ChartNoAxesCombined, Download } from "lucide-react";
import { VisibilitySection } from "../common/VisibilitySection";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useCopy } from "../../i18n/useCopy";
import { useUITranslation } from "../../i18n/useUITranslation";
import { SupportedCurrency } from "../../types";
import { formatMoney } from "../../utils/formatters";
const colors = [
  "#004AA5",
  "#CC9048",
  "#238f8b",
  "#7d68b3",
  "#527696",
  "#d89561",
];
export const WorkspaceAnalytics: React.FC<{ currency: SupportedCurrency }> = ({
  currency,
}) => {
  const app = useApp(),
    { user, canViewAccounting } = useAuth(),
    { l, language, isRTL, getMonthName } = useCopy(),
    { ui } = useUITranslation();
  const [report, setReport] = useState(false),
    [mode, setMode] = useState<"count" | "value">("count");
  const reportRef = useRef<HTMLDivElement>(null),
    printTrigger = useRef<HTMLButtonElement>(null);
  const privileged = ["super_admin", "admin", "editor", "agent"].includes(
    user?.role || "",
  );
  const all = [
    ...(privileged || user?.canAccessConsulate
      ? app.consulateAppointments.map((r) => ({
          id: r.id,
          name: r.clientName,
          phone: r.phoneNumber,
          date: r.submissionDate,
          service: ui(r.customAppointmentType || r.appointmentType),
          stage: r.timelineStage || "registered",
          value: r.price,
          balance: r.remainingAmount,
          currency: r.currency,
          flight: false,
        }))
      : []),
    ...(privileged || user?.canAccessFlights
      ? app.flightBookings.map((r) => ({
          id: r.id,
          name: r.clientName,
          phone: r.phoneNumber,
          date: r.bookingDate,
          service: l(
            "حجوزات الطيران",
            "Flight bookings",
            "Réservations de vols",
          ),
          stage: "flight",
          value: r.sellingPrice,
          balance: r.remainingAmount,
          currency: r.currency,
          flight: true,
        }))
      : []),
  ];
  const records = all.filter(
    (r) =>
      +r.date.slice(0, 4) === app.selectedYear &&
      (!app.selectedMonth || +r.date.slice(5, 7) === app.selectedMonth),
  );
  const clients = new Set(records.map((r) => r.phone || r.name)).size;
  const services = Object.entries(
    records.reduce<Record<string, number>>((a, r) => {
      a[r.service] = (a[r.service] || 0) + 1;
      return a;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const groups =
    services.length > 5
      ? [
          ...services.slice(0, 5),
          [
            l("خدمات أخرى", "Other services", "Autres services"),
            services.slice(5).reduce((s, r) => s + r[1], 0),
          ] as [string, number],
        ]
      : services;
  const stages = [
    ["registered", l("تم التسجيل", "Registered", "Enregistré")],
    [
      "submitted",
      l(
        "تم الإرسال والمعالجة",
        "Submitted / processing",
        "Envoyé / en traitement",
      ),
    ],
    [
      "response",
      l(
        "بانتظار الرد / تم الرد",
        "Awaiting / received response",
        "En attente / réponse reçue",
      ),
    ],
    ["completed", l("انتهت الخدمة", "Service completed", "Service terminé")],
    ["flight", l("حجوزات الطيران", "Flight bookings", "Réservations de vols")],
  ];
  const financial = (["TRY", "MAD", "EUR", "USD"] as SupportedCurrency[]).map(
    (c) => {
      const rs = records.filter((r) => r.currency === c);
      return {
        currency: c,
        total: rs.reduce((s, r) => s + r.value, 0),
        balance: rs.reduce((s, r) => s + r.balance, 0),
      };
    },
  );
  const money = financial.find((r) => r.currency === currency)!;
  const months = Array.from({ length: 12 }, (_, i) => {
    const rs = all.filter(
      (r) =>
        +r.date.slice(0, 4) === app.selectedYear &&
        +r.date.slice(5, 7) === i + 1,
    );
    return mode === "value" && canViewAccounting
      ? rs
          .filter((r) => r.currency === currency)
          .reduce((s, r) => s + r.value, 0)
      : rs.length;
  });
  const peak = Math.max(1, ...months),
    points = months
      .map((v, i) => `${35 + i * 43},${155 - (v / peak) * 120}`)
      .join(" ");
  const period = `${app.selectedMonth ? getMonthName(app.selectedMonth) : l("السنة كاملة", "Full year", "Année entière")} ${app.selectedYear}`;
  const pct = (n: number, d = records.length) =>
    d ? Math.round((n / d) * 100) : 0;
  useEffect(() => {
    if (!report) return;
    const previous = document.activeElement as HTMLElement;
    const title = document.title;
    document.title = `ELFAZNI-Analytics-${app.selectedYear}-${app.selectedMonth || "year"}-${language}`;
    document.body.classList.add("analytics-printing");
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    reportRef.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReport(false);
      if (e.key === "Tab") {
        const buttons =
          reportRef.current?.querySelectorAll<HTMLButtonElement>("button");
        if (!buttons?.length) return;
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === reportRef.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.title = title;
      document.body.classList.remove("analytics-printing");
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [report, app.selectedYear, app.selectedMonth, language]);
  const exportCSV = () => {
    const rows = [
      [
        l("الخدمة", "Service", "Service"),
        l("عدد المعاملات", "Transactions", "Dossiers"),
        "%",
      ],
      ...services.map(([name, n]) => [name, n, pct(n)]),
    ];
    const csv =
      "\uFEFF" +
      rows
        .map((row) =>
          row
            .map(
              (v) =>
                '"' +
                String(v)
                  .replace(/^(\s*[=+@-])/, "'$1")
                  .replaceAll('"', '""') +
                '"',
            )
            .join(","),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `ELFAZNI-services-${app.selectedYear}-${app.selectedMonth || "year"}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const trend = (
    <section className="analytics-card analytics-trend">
      <div className="analytics-card-title">
        <div>
          <h3>
            {l(
              "اتجاه النشاط السنوي",
              "Annual activity trend",
              "Évolution annuelle",
            )}
          </h3>
          <p>
            {app.selectedYear} ·{" "}
            {mode === "count" || !canViewAccounting
              ? l(
                  "عدد المعاملات شهرياً",
                  "Transactions per month",
                  "Dossiers par mois",
                )
              : l(
                  "قيمة المعاملات",
                  "Transaction value",
                  "Valeur des dossiers",
                ) +
                " · " +
                currency}
          </p>
        </div>
        {canViewAccounting && (
          <div
            className="analytics-switch"
            aria-label={l(
              "نوع المبيان",
              "Chart measure",
              "Mesure du graphique",
            )}
          >
            {(["count", "value"] as const).map((v) => (
              <button
                key={v}
                aria-pressed={mode === v}
                onClick={() => setMode(v)}
              >
                {v === "count"
                  ? l("المعاملات", "Volume", "Volume")
                  : l("القيمة", "Value", "Valeur")}
              </button>
            ))}
          </div>
        )}
      </div>
      <svg
        viewBox="0 0 540 200"
        role="img"
        aria-label={l(
          "مبيان النشاط الشهري",
          "Monthly activity chart",
          "Graphique mensuel",
        )}
      >
        <title>
          {months.map((n, i) => `${getMonthName(i + 1)}: ${n}`).join("; ")}
        </title>
        {[35, 95, 155].map((y, i) => (
          <g key={y}>
            <line
              x1="35"
              x2="508"
              y1={y}
              y2={y}
              stroke="#D7E7F7"
              strokeDasharray="4 4"
            />
            <text x="4" y={y + 4} fontSize="10" fill="#5E7086">
              {new Intl.NumberFormat(language, { notation: "compact" }).format(
                peak * (1 - i / 2),
              )}
            </text>
          </g>
        ))}
        <polygon points={`35,155 ${points} 508,155`} fill="#eaf4ff" />
        <polyline
          points={points}
          stroke="#004AA5"
          strokeWidth="3"
          fill="none"
          strokeLinejoin="round"
        />
        {months.map((v, i) => (
          <g key={i}>
            <circle
              cx={35 + i * 43}
              cy={155 - (v / peak) * 120}
              r="4"
              fill={v ? "#CC9048" : "#b8cce1"}
            >
              <title>
                {getMonthName(i + 1)}:{" "}
                {mode === "value" && canViewAccounting
                  ? formatMoney(v, currency)
                  : v}
              </title>
            </circle>
            <text
              x={35 + i * 43}
              y="184"
              textAnchor="middle"
              fontSize="10"
              fill="#5E7086"
            >
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <small>
        {l(
          "الأشهر من 1 إلى 12؛ مرّر على النقطة لعرض التفاصيل.",
          "Months 1–12; hover over a point for details.",
          "Mois 1–12 ; survolez un point pour les détails.",
        )}
      </small>
    </section>
  );
  let offset = 0;
  const distribution = (
    <section className="analytics-card">
      <div className="analytics-card-title">
        <div>
          <h3>
            {l("توزيع الخدمات", "Service mix", "Répartition des services")}
          </h3>
          <p>{period}</p>
        </div>
        <ChartNoAxesCombined size={22} />
      </div>
      <div className="analytics-donut-layout">
        <svg
          viewBox="0 0 180 180"
          role="img"
          aria-label={l(
            "توزيع عدد المعاملات حسب الخدمة",
            "Transactions by service",
            "Dossiers par service",
          )}
        >
          <circle
            cx="90"
            cy="90"
            r="67"
            fill="none"
            stroke="#eaf0f7"
            strokeWidth="24"
          />
          {groups.map(([name, n], i) => {
            const start = offset;
            offset += (n / Math.max(1, records.length)) * 100;
            return (
              <circle
                key={name}
                cx="90"
                cy="90"
                r="67"
                pathLength="100"
                fill="none"
                stroke={colors[i]}
                strokeWidth="24"
                strokeDasharray={`${(n / Math.max(1, records.length)) * 100} 100`}
                strokeDashoffset={-start}
                transform="rotate(-90 90 90)"
              >
                <title>
                  {name}: {n} ({pct(n)}%)
                </title>
              </circle>
            );
          })}
          <text
            x="90"
            y="90"
            textAnchor="middle"
            fontSize="30"
            fill="#0B2E57"
            fontWeight="700"
          >
            {records.length}
          </text>
          <text x="90" y="111" textAnchor="middle" fontSize="11" fill="#5E7086">
            {l("معاملة", "transactions", "dossiers")}
          </text>
        </svg>
        <ul className="analytics-legend">
          {groups.map(([name, n], i) => (
            <li key={name}>
              <i style={{ background: colors[i] }} />
              <span>{name}</span>
              <b>{n}</b>
              <small>{pct(n)}%</small>
            </li>
          ))}
          {!records.length && (
            <li>
              {l(
                "لا توجد معاملات في هذه الفترة",
                "No transactions in this period",
                "Aucun dossier sur cette période",
              )}
            </li>
          )}
        </ul>
      </div>
    </section>
  );
  const pipeline = (
    <section className="analytics-card">
      <div className="analytics-card-title">
        <div>
          <h3>
            {l(
              "مراحل متابعة الخدمات",
              "Service progress",
              "Avancement des services",
            )}
          </h3>
          <p>
            {l(
              "التوزيع حسب المرحلة الحالية، مع فصل حجوزات الطيران",
              "Current consular stages, with flights shown separately",
              "Étapes consulaires actuelles, vols présentés séparément",
            )}
          </p>
        </div>
      </div>
      <div className="analytics-bars">
        {stages.map(([id, name], i) => {
          const count = records.filter((r) => r.stage === id).length;
          return (
            <div key={id}>
              <div>
                <span>{name}</span>
                <b>
                  {count} <small>· {pct(count)}%</small>
                </b>
              </div>
              <div className="analytics-track">
                <span
                  style={{ width: `${pct(count)}%`, background: colors[i] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
  const collection = (
    <section className="analytics-card">
      <div className="analytics-card-title">
        <div>
          <h3>
            {l(
              "التحصيل حسب العملة",
              "Collection by currency",
              "Encaissements par devise",
            )}
          </h3>
          <p>
            {l(
              "كل عملة مستقلة دون جمع أو تحويل",
              "Currencies shown separately, without conversion",
              "Devises distinctes, sans conversion",
            )}
          </p>
        </div>
      </div>
      <div className="analytics-currencies">
        {financial.map((r) => {
          const paid = r.total - r.balance;
          return (
            <div key={r.currency}>
              <strong>{r.currency}</strong>
              <div>
                <b dir="auto">{formatMoney(r.total, r.currency)}</b>
                <div className="analytics-track">
                  <span
                    style={{
                      width: `${Math.max(0, Math.min(100, r.total ? (paid / r.total) * 100 : 0))}%`,
                      background: "#238f8b",
                    }}
                  />
                </div>
                <small>
                  {l("المحصّل", "Collected", "Encaissé")}:{" "}
                  {formatMoney(paid, r.currency)} ·{" "}
                  {l("المتبقي", "Balance", "Solde")}:{" "}
                  {formatMoney(r.balance, r.currency)}
                </small>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
  const ranking = (
    <section className="analytics-card">
      <div className="analytics-card-title">
        <div>
          <h3>
            {l(
              "الخدمات الأكثر طلباً",
              "Most requested services",
              "Services les plus demandés",
            )}
          </h3>
          <p>
            {l(
              "أكثر خمس خدمات حسب عدد المعاملات",
              "Top five services by transaction count",
              "Cinq premiers services par nombre de dossiers",
            )}
          </p>
        </div>
      </div>
      <div className="analytics-bars">
        {services.slice(0, 5).map(([name, n], i) => (
          <div key={name}>
            <div>
              <span>
                {i + 1}. {name}
              </span>
              <b>{n}</b>
            </div>
            <div className="analytics-track">
              <span
                style={{
                  width: `${(n / Math.max(1, services[0][1])) * 100}%`,
                  background: colors[i],
                }}
              />
            </div>
          </div>
        ))}
        {!services.length && (
          <p>
            {l(
              "ستظهر النتائج بعد إضافة معاملات",
              "Results appear when you add transactions",
              "Les résultats apparaîtront après ajout de dossiers",
            )}
          </p>
        )}
      </div>
    </section>
  );
  const summary = (
    <div className="analytics-summary">
      {[
        [
          records.length,
          l("معاملات الفترة", "Period transactions", "Dossiers de la période"),
        ],
        [
          clients,
          l("عملاء الفترة", "Period customers", "Clients de la période"),
        ],
        [
          `${pct(records.filter((r) => r.stage === "completed").length, records.filter((r) => !r.flight).length)}%`,
          l(
            "خدمات قنصلية منتهية",
            "Consular services completed",
            "Services consulaires terminés",
          ),
        ],
        ...(canViewAccounting
          ? [
              [
                `${money.total ? Math.round(((money.total - money.balance) / money.total) * 100) : 0}%`,
                l("نسبة التحصيل", "Collection rate", "Taux d’encaissement") +
                  " · " +
                  currency,
              ],
            ]
          : []),
      ].map(([v, label]) => (
        <div key={label}>
          <strong>{v}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
  const header = (page: number) => (
    <header className="analytics-paper-header">
      <img src="/admin/crm/assets/logo-horizontal.svg" alt="ELFAZNI SERVICES" />
      <div>
        <span>
          ELFAZNI SERVICES /{" "}
          {l(
            "تحليلات الأداء",
            "BUSINESS INTELLIGENCE",
            "ANALYSE DE PERFORMANCE",
          )}
        </span>
        <h2>
          {l(
            "تقرير النشاط والأداء",
            "Activity & performance report",
            "Rapport d’activité et de performance",
          )}
        </h2>
        <p>
          {period} · {page}/2
        </p>
      </div>
    </header>
  );
  const footer = (
    <footer className="analytics-paper-footer print-document-footer">
      <b>ELFAZNI SERVICES</b>
      <span>
        {l(
          "من بيانات المعاملات المتاحة لحسابك · الحالة الحالية للمعاملات المسجلة في الفترة",
          "From transactions accessible to your account · current state of records dated in the period",
          "Dossiers accessibles à votre compte · état actuel des dossiers datés de la période",
        )}
      </span>
      <time>
        {new Intl.DateTimeFormat(language, { dateStyle: "medium" }).format(
          new Date(),
        )}
      </time>
    </footer>
  );
  return (
    <section
      id="workspace-analytics"
      className="analytics-section"
      aria-label={l(
        "الإحصاءات والتقارير",
        "Analytics & reports",
        "Analyses et rapports",
      )}
    >
      <div className="analytics-heading">
        <div>
          <span className="ws-eyebrow">
            {l(
              "تحليلات الأداء",
              "BUSINESS INTELLIGENCE",
              "ANALYSE DE PERFORMANCE",
            )}
          </span>
          <h2>
            {l(
              "أرقام تروي قصة نشاطك",
              "The story behind your numbers",
              "Vos chiffres racontent votre activité",
            )}
          </h2>
          <p>
            {period} ·{" "}
            {l(
              "بيانات فعلية من معاملاتك",
              "Live transaction data",
              "Données réelles de vos dossiers",
            )}
          </p>
        </div>
        <div className="analytics-actions">
          <button className="ws-secondary-btn" onClick={exportCSV}>
            <Download size={17} /> CSV
          </button>
          <button
            className="ws-primary-btn"
            ref={printTrigger}
            onClick={() => setReport(true)}
          >
            <Printer size={17} />
            {l(
              "طباعة تقرير المبيانات",
              "Print analytics report",
              "Imprimer le rapport",
            )}
          </button>
        </div>
      </div>
      {summary}
      <div className="analytics-grid analytics-live-grid">
        <VisibilitySection
          sectionId="chart-trend"
          title={l("اتجاه النشاط", "Activity trend", "Évolution de l’activité")}
        >
          {trend}
        </VisibilitySection>
        <VisibilitySection
          sectionId="chart-services"
          title={l("توزيع الخدمات", "Service mix", "Répartition des services")}
        >
          {distribution}
        </VisibilitySection>
        <VisibilitySection
          sectionId="chart-progress"
          title={l(
            "مراحل الخدمات",
            "Service progress",
            "Avancement des services",
          )}
        >
          {pipeline}
        </VisibilitySection>
        {canViewAccounting && (
          <VisibilitySection
            sectionId="chart-collection"
            title={l(
              "التحصيل حسب العملة",
              "Collection by currency",
              "Encaissements par devise",
            )}
          >
            {collection}
          </VisibilitySection>
        )}
        <VisibilitySection
          sectionId="chart-ranking"
          title={l(
            "ترتيب الخدمات",
            "Service ranking",
            "Classement des services",
          )}
        >
          {ranking}
        </VisibilitySection>
      </div>
      {report &&
        createPortal(
          <div
            className="analytics-report-overlay"
            dir={isRTL ? "rtl" : "ltr"}
            role="dialog"
            aria-modal="true"
            aria-label={l(
              "معاينة تقرير الإحصاءات",
              "Analytics report preview",
              "Aperçu du rapport",
            )}
            tabIndex={-1}
            ref={reportRef}
          >
            <div className="analytics-report-toolbar">
              <strong>
                {l(
                  "تقرير جاهز للطباعة · A4",
                  "Print-ready report · A4",
                  "Rapport prêt à imprimer · A4",
                )}
              </strong>
              <button className="ws-primary-btn" onClick={() => window.print()}>
                <Printer size={17} />
                {l(
                  "طباعة / حفظ PDF",
                  "Print / Save PDF",
                  "Imprimer / Enregistrer PDF",
                )}
              </button>
              <button
                className="ws-icon-btn"
                onClick={() => setReport(false)}
                aria-label={l("إغلاق", "Close", "Fermer")}
              >
                <X />
              </button>
            </div>
            <article className="analytics-paper">
              {header(1)}
              {summary}
              <div className="analytics-grid">
                {trend}
                {distribution}
              </div>
              {ranking}
              {footer}
            </article>
            <article className="analytics-paper">
              {header(2)}
              {pipeline}
              {canViewAccounting && collection}
              <div className="analytics-method">
                <h3>
                  {l(
                    "قراءة التقرير",
                    "Reading this report",
                    "Lecture du rapport",
                  )}
                </h3>
                <p>
                  {l(
                    "الفترة مبنية على تاريخ تسجيل المعاملة. مراحل الخدمات والأرصدة تعكس وضعها الحالي. حجوزات الطيران منفصلة عن مراحل الخدمات القنصلية. قيمة المعاملات لا تمثل الربح. لا يشمل التقرير فواتير مستقلة غير مرتبطة بمعاملة.",
                    "The period uses the transaction date. Service stages and balances reflect their current state. Flights are separate from consular stages. Transaction value is not profit. Standalone invoices are excluded.",
                    "La période repose sur la date du dossier. Les étapes et soldes reflètent leur état actuel. Les vols sont séparés des étapes consulaires. La valeur des dossiers ne représente pas le bénéfice. Les factures indépendantes sont exclues.",
                  )}
                </p>
              </div>
              {footer}
            </article>
          </div>,
          document.body,
        )}
    </section>
  );
};
