import React, { useState } from "react";
import {
  Plus,
  Download,
  Wallet,
  Users,
  Receipt,
  Check,
  Search,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useCopy } from "../../i18n/useCopy";
import { useUITranslation } from "../../i18n/useUITranslation";
import { manualDebtBalance, exportContactCSV, debtDirection } from "../../utils/contactBook";
import {
  formatMinorMoney,
  toMinorUnits,
  fromMinorUnits,
} from "../../utils/invoiceCalculations";
import { formatDate } from "../../utils/formatters";
import { ManualDebt } from "../../types/contactBook";
import { SupportedCurrency } from "../../types";
import {
  ManualDebtForm,
  ManualDebtPaymentForm,
  useContactFinanceAccess,
} from "../contacts/ContactFinanceForms";
import { ContactStorageNotice } from "../contacts/ContactReminders";
import { BankDetailsShare } from "../common/BankDetailsShare";
import { DebtsTable } from "./DebtsTable";
export const DebtWorkspace: React.FC = () => {
  const app = useApp(),
    { canViewAccounting } = useAuth(),
    write = useContactFinanceAccess(),
    { l } = useCopy(),
    { ui } = useUITranslation();
  const [source, setSource] = useState("all"),
    [currency, setCurrency] = useState("all"),
    [status, setStatus] = useState("open"),
    [query, setQuery] = useState(""),
    [adding, setAdding] = useState(false),
    [payment, setPayment] = useState<ManualDebt | null>(null);
  if (!canViewAccounting) return null;
  const manual = app.contactBook.manualDebts.map((d) => {
    const c = app.contactBook.contacts.find((c) => c.id === d.contactId);
    return {
      id: "manual:" + d.id,
      source: "manual" as const,
      contactId: d.contactId,
      name: c?.name || "—",
      phone: c?.phone || "",
      title: d.title,
      currency: d.currency,
      total: d.amountMinor,
      balance: manualDebtBalance(d),
      date: d.date,
      due: d.dueDate,
      original: d,
      transaction: undefined,
    };
  });
  const transactions = app.debts
    .filter((d) => d.remainingAmount > 0)
    .map((d) => ({
      id: "transaction:" + d.id,
      source: "transaction" as const,
      contactId: "",
      name: d.clientName,
      phone: d.phoneNumber,
      title: ui(d.serviceDetails),
      currency: d.currency,
      total: toMinorUnits(d.totalAmount),
      balance: toMinorUnits(d.remainingAmount),
      date: d.date,
      due: "",
      original: undefined,
      transaction: d,
    }));
  const rows = [...manual, ...transactions]
    .filter(
      (d) =>
        (source === "all" || d.source === source) &&
        (currency === "all" || currency === d.currency) &&
        (status === "all" ||
          (status === "open" ? d.balance > 0 : d.balance === 0)) &&
        `${d.name} ${d.phone} ${d.title}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const sourceLabel = (v: string, original?: ManualDebt) =>
    v === "manual"
      ? original && debtDirection(original) === 'payable'
        ? l("عليّ له", "I owe them", "À payer")
        : l("لي عليه", "They owe me", "À recevoir")
      : l("دين معاملة", "Transaction balance", "Solde de dossier");
  const exportRows = () =>
    exportContactCSV(`ELFAZNI-debts-${source}`, [
      [
        l("التصنيف", "Source", "Catégorie"),
        l("الاسم", "Name", "Nom"),
        l("الهاتف", "Phone", "Téléphone"),
        l("الوصف", "Description", "Description"),
        l("العملة", "Currency", "Devise"),
        l("المبلغ الأصلي", "Original amount", "Montant initial"),
        l("المسدد", "Paid", "Payé"),
        l("المتبقي", "Balance", "Solde"),
        l("التاريخ", "Date", "Date"),
        l("الاستحقاق", "Due date", "Échéance"),
      ],
      ...rows.map((d) => [
        sourceLabel(d.source, d.original),
        d.name,
        d.phone,
        d.title,
        d.currency,
        fromMinorUnits(d.total).toFixed(2),
        fromMinorUnits(d.total - d.balance).toFixed(2),
        fromMinorUnits(d.balance).toFixed(2),
        d.date,
        d.due,
      ]),
    ]);
  return (
    <div className="crm-debt-workspace">
      <ContactStorageNotice />
      <header className="crm-book-heading">
        <div>
          <span className="ws-eyebrow">
            ELFAZNI CRM /{" "}
            {l("سجل الديون", "DEBT LEDGER", "REGISTRE DES DETTES")}
          </span>
          <h2>
            {l(
              "كل الديون، بتصنيف واضح",
              "Every debt, clearly classified",
              "Toutes les dettes, clairement classées",
            )}
          </h2>
          <p>
            {l(
              "الديون المستقلة منفصلة عن أرصدة معاملات الخدمات، ولا تُضاف إلى المبيعات.",
              "Standalone debts stay separate from service balances and do not count as sales.",
              "Les dettes indépendantes sont distinctes des soldes de services et ne sont pas des ventes.",
            )}
          </p>
        </div>
        <div className="crm-book-actions">
          <button className="ws-secondary-btn" onClick={exportRows}>
            <Download size={17} />
            {l(
              "تصدير النتائج CSV",
              "Export results CSV",
              "Exporter les résultats CSV",
            )}
          </button>
          {write && (
            <button
              className="ws-primary-btn"
              disabled={!app.contactBook.contacts.length}
              onClick={() => setAdding(true)}
            >
              <Plus size={17} />
              {l(
                "تسجيل دين مستقل",
                "Add standalone debt",
                "Ajouter une dette indépendante",
              )}
            </button>
          )}
        </div>
      </header>
      {!app.contactBook.contacts.length && (
        <p className="crm-book-hint">
          {l(
            "أضف جهة الاتصال أولًا من قسم العملاء، ثم سجّل الدين باسمها.",
            "Add a contact in Customers first, then record their debt.",
            "Ajoutez un contact dans Clients, puis enregistrez sa dette.",
          )}{" "}
          <button
            className="ws-text-link"
            onClick={() => app.setActiveTab("customers")}
          >
            {l("فتح جهات الاتصال", "Open contacts", "Ouvrir les contacts")}
          </button>
        </p>
      )}
      <BankDetailsShare />
      <div
        className="crm-debt-source-tabs"
        role="group"
        aria-label={l("تصنيف الديون", "Debt source", "Catégorie de dette")}
      >
        {[
          ["all", l("جميع الديون", "All debts", "Toutes les dettes"), Wallet],
          [
            "manual",
            l(
              "ديون جهات الاتصال المستقلة",
              "Standalone contact debts",
              "Dettes indépendantes des contacts",
            ),
            Users,
          ],
          [
            "transaction",
            l("ديون المعاملات", "Transaction debts", "Dettes des dossiers"),
            Receipt,
          ],
        ].map(([value, label, Icon]: any) => (
          <button
            key={value}
            aria-pressed={source === value}
            onClick={() => setSource(value)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>
      <div className="crm-debt-summary">
        {(["TRY", "MAD", "EUR", "USD"] as SupportedCurrency[]).map((c) => {
          const independent = rows
              .filter((d) => d.currency === c && d.original && debtDirection(d.original) === "receivable")
              .reduce((s, d) => s + d.balance, 0),
            payable = rows.filter((d) => d.currency === c && d.original && debtDirection(d.original) === "payable")
              .reduce((s, d) => s + d.balance, 0),
            service = rows
              .filter((d) => d.currency === c && d.source === "transaction")
              .reduce((s, d) => s + d.balance, 0);
          return (
            <article key={c}>
              <span>{c}</span>
              <strong>
                {formatMinorMoney(independent + service, c, true)}
              </strong>
              <small>
                {l("ديون لي", "Owed to me", "À recevoir")}:{" "}
                {formatMinorMoney(independent, c, true)}
              </small>
              <small>{l("ديون عليّ", "I owe", "À payer")}: {formatMinorMoney(payable, c, true)}</small>
              <small>
                {l("معاملات", "Transactions", "Dossiers")}:{" "}
                {formatMinorMoney(service, c, true)}
              </small>
            </article>
          );
        })}
      </div>
      <div className="crm-debt-filters">
        <label className="crm-contact-search">
          <Search size={16} />
          <input
            aria-label={l("بحث الديون", "Search debts", "Rechercher une dette")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={l(
              "الاسم، الهاتف أو وصف الدين…",
              "Name, phone or debt description…",
              "Nom, téléphone ou description…",
            )}
          />
        </label>
        <select
          aria-label={l("عملة الديون", "Debt currency", "Devise des dettes")}
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="all">
            {l("كل العملات", "All currencies", "Toutes les devises")}
          </option>
          {["TRY", "MAD", "EUR", "USD"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label={l("حالة الدين", "Debt status", "État de la dette")}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="open">
            {l("الأرصدة المتبقية", "Outstanding balances", "Soldes restants")}
          </option>
          <option value="all">
            {l(
              "القائمة والديون المستقلة المسددة",
              "Open + settled standalone debts",
              "En cours + dettes indépendantes réglées",
            )}
          </option>
          <option value="paid">
            {l(
              "الديون المستقلة المسددة",
              "Settled standalone debts",
              "Dettes indépendantes réglées",
            )}
          </option>
        </select>
      </div>
      <div className="crm-debt-table-scroll">
        <table className="crm-debt-table">
          <thead>
            <tr>
              {[
                l(
                  "الشخص / الوصف",
                  "Contact / description",
                  "Contact / description",
                ),
                l("التصنيف", "Source", "Catégorie"),
                l("الأصلي", "Original", "Initial"),
                l("المسدد", "Paid", "Payé"),
                l("المتبقي", "Balance", "Solde"),
                l("متابعة", "Action", "Action"),
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} data-debt-source={d.source}>
                <td>
                  <strong>{d.name}</strong>
                  <small dir="auto">{d.phone}</small>
                  <p>{d.title}</p>
                  <small>
                    {formatDate(d.date)}
                    {d.due
                      ? " · " +
                        l("استحقاق", "Due", "Échéance") +
                        " " +
                        formatDate(d.due)
                      : ""}
                  </small>
                </td>
                <td>
                  <span className={`crm-debt-source ${d.source}`}>
                    {sourceLabel(d.source, d.original)}
                  </span>
                </td>
                <td>{formatMinorMoney(d.total, d.currency, true)}</td>
                <td>
                  {formatMinorMoney(d.total - d.balance, d.currency, true)}
                </td>
                <td>
                  <b
                    className={
                      d.balance ? "crm-balance-due" : "crm-balance-paid"
                    }
                  >
                    {formatMinorMoney(d.balance, d.currency, true)}
                  </b>
                </td>
                <td>
                  <div className="crm-book-actions">
                    {d.balance > 0 && write && (
                      <button
                        className="ws-primary-btn"
                        onClick={() => {
                          if (d.original) setPayment(d.original);
                          else if (
                            d.transaction &&
                            window.confirm(
                              l(
                                `تأكيد تسديد ${d.name} كامل المتبقي: ${formatMinorMoney(d.balance, d.currency, true)}؟`,
                                `Confirm full payment for ${d.name}: ${formatMinorMoney(d.balance, d.currency, true)}?`,
                                `Confirmer le règlement intégral de ${d.name} : ${formatMinorMoney(d.balance, d.currency, true)} ?`,
                              ),
                            )
                          )
                            app.settleDebt(
                              d.transaction.type,
                              d.transaction.recordId,
                            );
                        }}
                      >
                        {l("تسديد", "Pay", "Régler")}
                      </button>
                    )}
                    {d.balance === 0 && (
                      <span className="crm-paid-badge">
                        <Check size={14} />
                        {l("مسدد", "Paid", "Réglée")}
                      </span>
                    )}
                    {d.contactId && (
                      <button
                        className="ws-secondary-btn"
                        onClick={() => {
                          app.setSelectedContactId(d.contactId);
                          app.setActiveTab("customers");
                        }}
                      >
                        {l("الملف", "Profile", "Profil")}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <div className="crm-book-empty">
            <Check size={30} />
            <p>
              {l(
                "لا توجد ديون ضمن هذا التصنيف والفلاتر.",
                "No debts match these filters.",
                "Aucune dette ne correspond aux filtres.",
              )}
            </p>
          </div>
        )}
      </div>
      <p className="crm-book-hint">
        {l(
          "الإجماليات والتصدير يطابقان النتائج المعروضة، وكل عملة مستقلة. سجل الديون المستقلة يحتفظ بالتسديدات؛ ديون المعاملات تعرض الأرصدة القائمة.",
          "Totals and exports follow these filters, with each currency kept separate. Standalone debt payments are retained; transaction debts show current balances.",
          "Totaux et exports suivent les filtres, par devise distincte. Les paiements indépendants sont conservés ; les dossiers affichent leurs soldes actuels.",
        )}
      </p>
      {source === "transaction" && (
        <details className="crm-debt-advanced">
          <summary>
            {l(
              "أدوات معاملات الخدمات التفصيلية",
              "Detailed service transaction tools",
              "Outils détaillés des dossiers de services",
            )}
          </summary>
          <DebtsTable />
        </details>
      )}
      {adding && <ManualDebtForm onClose={() => setAdding(false)} />}
      {payment && (
        <ManualDebtPaymentForm
          debt={payment}
          onClose={() => setPayment(null)}
        />
      )}
    </div>
  );
};
