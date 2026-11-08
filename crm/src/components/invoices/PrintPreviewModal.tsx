import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, Download, X, FileText, Check, Settings2 } from "lucide-react";
import { useApp, PrintPreviewTarget } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useCopy } from "../../i18n/useCopy";
import {
  buildCustomerStatement,
  formatMinorMoney,
  getInvoicedTransactionsMap,
} from "../../utils/invoiceCalculations";
import { SupportedCurrency } from "../../types";
import { FazniOfficialSeal } from "../common/FazniLogo";
type Row = { id: string; cells: React.ReactNode[] };
export const PrintPreviewModal: React.FC = () => {
  const app = useApp(),
    auth = useAuth(),
    { l, language, isRTL } = useCopy();
  const target = app.printPreviewTarget,
    settings = app.documentSettings;
  const [sample, setSample] = useState(false),
    [copy, setCopy] = useState(false),
    [options, setOptions] = useState(false);
  const [pagination, setPagination] = useState<{
    key: string;
    sizes: number[];
  }>({ key: "", sizes: [] });
  const [paginationReady, setPaginationReady] = useState(false);
  // Measure real font/layout height before export, moving overflow rows to the next A4 sheet.
  useEffect(() => {
    if (
      !target ||
      ([
        "all_accounts_report",
        "outstanding_balances_report",
        "periodic_payment_report",
      ].includes(target.type) &&
        !auth.canViewAccounting)
    )
      return;
    let cancelled = false;
    setPaginationReady(false);
    document.fonts.ready.then(() => {
      if (cancelled) return;
      const sheets = Array.from(
        document.querySelectorAll<HTMLElement>(".pdf-sheet"),
      );
      const overflowIndex = sheets.findIndex(
        (sheet) => sheet.scrollHeight > 1124,
      );
      if (overflowIndex !== -1) {
        const sizes = pages.map((page) => page.length);
        if (sizes[overflowIndex] > 1) {
          sizes[overflowIndex] -= 1;
          sizes[overflowIndex + 1] = (sizes[overflowIndex + 1] || 0) + 1;
          setPagination({ key: pageKey, sizes });
          return;
        }
        if (
          overflowIndex === sizes.length - 1 &&
          sizes[overflowIndex] === 1 &&
          summary
        ) {
          setPagination({ key: pageKey, sizes: [...sizes, 0] });
          return;
        }
      }
      setPaginationReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [
    target,
    language,
    sample,
    copy,
    settings,
    app.invoices,
    app.consulateAppointments,
    app.flightBookings,
    pagination,
  ]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!target) return;
    previousFocus.current = document.activeElement as HTMLElement;
    document.body.classList.add("printing-active-document");
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setSample(!!target.isDemoMode);
    setCopy(!!target.isCopy);
    closeRef.current?.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") app.setPrintPreviewTarget(null);
    };
    window.addEventListener("keydown", esc);
    return () => {
      document.body.classList.remove("printing-active-document");
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", esc);
      previousFocus.current?.focus();
    };
  }, [!!target]);
  if (!target) return null;
  const report = [
    "all_accounts_report",
    "outstanding_balances_report",
    "periodic_payment_report",
  ].includes(target.type);
  if (report && !auth.canViewAccounting) return null;
  const invoice =
    app.invoices.find((x) => x.id === target.invoiceId) ||
    (!target.invoiceId ? app.invoices[0] : undefined);
  const customer =
    app.customerProfiles.find((x) => x.customerId === target.customerId) ||
    (!target.customerId ? app.customerProfiles[0] : undefined);
  const titles: { [key: string]: [string, string, string] } = {
    invoice: ["فاتورة", "Invoice", "Facture"],
    payment_receipt: ["إيصال دفع", "Payment receipt", "Reçu de paiement"],
    statement: ["كشف حساب", "Account statement", "Relevé de compte"],
    all_accounts_report: [
      "التقرير المالي",
      "Financial report",
      "Rapport financier",
    ],
    outstanding_balances_report: [
      "تقرير المستحقات",
      "Receivables report",
      "Rapport des créances",
    ],
    periodic_payment_report: [
      "تقرير المدفوعات",
      "Payment report",
      "Rapport des paiements",
    ],
  };
  const title = titles[target.type];
  const isInvoice = target.type === "invoice",
    isReceipt = target.type === "payment_receipt";
  const primaryTitle =
    isInvoice && invoice?.documentClassification === "pro_forma"
      ? l("فاتورة أولية", "Pro forma invoice", "Facture pro forma")
      : l(...title);
  const money = (n: number, c: SupportedCurrency) => (
    <bdi className="pdf-money">{formatMinorMoney(n, c, true)}</bdi>
  );
  const inPeriod = (date: string) =>
    date.startsWith(
      `${app.selectedYear}-${app.selectedMonth ? String(app.selectedMonth).padStart(2, "0") : ""}`,
    );
  const status = (s: string) =>
    ({
      paid: l("مدفوع", "Paid", "Payé"),
      issued: l("صادرة", "Issued", "Émise"),
      draft: l("مسودة", "Draft", "Brouillon"),
      void: l("ملغاة", "Voided", "Annulée"),
      partially_paid: l("دفع جزئي", "Part paid", "Partiel"),
    })[s] || s;
  let headings: string[] = [],
    rows: Row[] = [],
    summary: React.ReactNode = null;
  let reference =
    invoice && (isInvoice || isReceipt)
      ? invoice.invoiceNumber
      : target.type === "statement"
        ? customer?.customerId || ""
        : `${app.selectedYear}-${String(app.selectedMonth || 0).padStart(2, "0")}`;
  let periodLabel =
    target.type === "all_accounts_report"
      ? l("جميع الفترات", "All periods", "Toutes les périodes")
      : `${app.selectedYear} / ${app.selectedMonth || l("كل الشهور", "All months", "Tous les mois")}`;
  if (isInvoice && invoice) {
    headings = [
      l("الخدمة والتفاصيل", "Service & details", "Service et détails"),
      l("العدد", "Qty", "Qté"),
      l("سعر الوحدة", "Unit price", "Prix unitaire"),
      l("خصم", "Discount", "Remise"),
      l("ضريبة", "Tax", "Taxe"),
      l("الإجمالي", "Total", "Total"),
    ];
    rows = invoice.lines.map((line) => ({
      id: line.id,
      cells: [
        <div>
          <strong>
            {language === "ar" ? line.labelAr : line.labelEn || line.labelAr}
          </strong>
          {language === "ar" && line.labelEn && (
            <small dir="ltr">{line.labelEn}</small>
          )}
          {line.serviceReference && (
            <small dir="ltr">{line.serviceReference}</small>
          )}
        </div>,
        line.quantity,
        money(line.unitPriceMinor, invoice.currency),
        money(line.discountMinor, invoice.currency),
        money(line.taxMinor, invoice.currency),
        money(line.totalMinor, invoice.currency),
      ],
    }));
    summary = (
      <div className="pdf-summary-grid">
        <div className="pdf-notes">
          <h4>{l("ملاحظات", "Notes", "Notes")}</h4>
          <p>
            {invoice.notes ||
              l(
                "شكرًا لثقتكم بخدمات الفزني. يرجى ذكر مرجع الفاتورة عند السداد.",
                "Thank you for choosing ELFAZNI SERVICES. Please quote the invoice reference when paying.",
                "Merci de votre confiance. Veuillez indiquer la référence de facture lors du paiement.",
              )}
          </p>
          {settings.showBankAccountsOnInvoices && (
            <div className="pdf-bank">
              <h4>
                {l(
                  "بيانات التحويل البنكي",
                  "Bank transfer details",
                  "Coordonnées bancaires",
                )}
              </h4>
              <bdi>{settings.bankAccountHolder}</bdi>
              <small>
                TRY · <bdi>{settings.ibanTRY}</bdi>
              </small>
              <small>
                USD · <bdi>{settings.ibanUSD}</bdi>
              </small>
            </div>
          )}
        </div>
        <div className="pdf-totals">
          <div>
            <span>{l("قبل الضريبة", "Subtotal", "Sous-total")}</span>
            {money(invoice.subtotalMinor, invoice.currency)}
          </div>
          {invoice.documentDiscountMinor > 0 && (
            <div>
              <span>
                {l("خصم إضافي", "Document discount", "Remise globale")}
              </span>
              {money(invoice.documentDiscountMinor, invoice.currency)}
            </div>
          )}
          <div>
            <span>{l("الضريبة", "Tax", "Taxe")}</span>
            {money(invoice.taxTotalMinor, invoice.currency)}
          </div>
          <div className="pdf-total">
            <strong>{l("الإجمالي", "Total", "Total")}</strong>
            {money(invoice.totalMinor, invoice.currency)}
          </div>
          <div>
            <span>{l("المدفوع", "Paid", "Payé")}</span>
            {money(invoice.paidMinor, invoice.currency)}
          </div>
          {invoice.creditedMinor > 0 && (
            <div>
              <span>{l("إشعارات دائنة", "Credits", "Avoirs")}</span>
              {money(invoice.creditedMinor, invoice.currency)}
            </div>
          )}
          <div className="pdf-balance">
            <strong>{l("المتبقي", "Balance due", "Solde dû")}</strong>
            {money(invoice.balanceDueMinor, invoice.currency)}
          </div>
        </div>
      </div>
    );
  } else if (isReceipt && invoice) {
    headings = [
      l("تاريخ الاستلام", "Received on", "Date de réception"),
      l("طريقة الدفع", "Payment method", "Mode de paiement"),
      l("المرجع", "Reference", "Référence"),
      l("المبلغ المقبوض", "Amount received", "Montant reçu"),
    ];
    const payments = invoice.payments.filter((p) => p.status === "cleared");
    rows = payments.map((p) => ({
      id: p.id,
      cells: [
        p.receivedAt,
        p.method,
        p.externalReference || "—",
        money(p.amountMinor, p.currency),
      ],
    }));
    summary = (
      <div className="pdf-report-totals">
        {(["TRY", "MAD", "EUR", "USD"] as SupportedCurrency[])
          .filter((c) => payments.some((p) => p.currency === c))
          .map((c) => (
            <div key={c}>
              <span>
                {l("إجمالي المقبوض", "Total received", "Total reçu")} · {c}
              </span>
              {money(
                payments
                  .filter((p) => p.currency === c)
                  .reduce((s, p) => s + p.amountMinor, 0),
                c,
              )}
            </div>
          ))}
      </div>
    );
  } else if (target.type === "statement" && customer) {
    const currency = target.currency || customer.currencies[0] || "TRY";
    const statement = buildCustomerStatement(customer, currency, {
      fromDate: target.fromDate || "",
      toDate: target.toDate || "",
    });
    periodLabel = [
      target.fromDate || l("من البداية", "From start", "Depuis le début"),
      target.toDate || l("حتى الآن", "To date", "À ce jour"),
    ].join(" / ");
    headings = [
      l("التاريخ والمرجع", "Date & reference", "Date et référence"),
      l("الوصف", "Description", "Description"),
      l("مدين", "Debit", "Débit"),
      l("دائن", "Credit", "Crédit"),
      l("الرصيد", "Balance", "Solde"),
    ];
    rows = statement.entries.map((e) => ({
      id: e.id,
      cells: [
        <div>
          {e.date}
          <small dir="ltr">{e.referenceNumber}</small>
        </div>,
        e.description,
        money(e.debitMinor, currency),
        money(e.creditMinor, currency),
        money(e.runningBalanceMinor, currency),
      ],
    }));
    summary = (
      <div className="pdf-report-totals">
        {[
          [
            l("الرصيد الافتتاحي", "Opening balance", "Solde initial"),
            statement.openingBalanceMinor,
          ],
          [l("حركات مدينة", "Debits", "Débits"), statement.periodDebitMinor],
          [l("حركات دائنة", "Credits", "Crédits"), statement.periodCreditMinor],
          [
            l("الرصيد الختامي", "Closing balance", "Solde final"),
            statement.closingBalanceMinor,
          ],
        ].map(([label, value], i) => (
          <div key={i}>
            <span>{label}</span>
            {money(+value, currency)}
          </div>
        ))}
      </div>
    );
  } else if (target.type === "all_accounts_report") {
    headings = [
      l("العميل", "Customer", "Client"),
      l("العملة", "Currency", "Devise"),
      l("الفوترة", "Billed", "Facturé"),
      l("المدفوع", "Paid", "Payé"),
      l("الدائن", "Credits", "Avoirs"),
      l("المتبقي", "Outstanding", "Solde"),
    ];
    const reportRows = app.customerProfiles.flatMap((c) =>
      c.currencies.map((currency) => ({
        customer: c,
        currency,
        totals: c.totalsByCurrency[currency],
      })),
    );
    rows = reportRows.map((r, i) => ({
      id: String(i),
      cells: [
        <div>
          <strong>{r.customer.clientName}</strong>
          <small dir="ltr">{r.customer.phoneNumber}</small>
        </div>,
        r.currency,
        money(r.totals.billedMinor, r.currency),
        money(r.totals.paidMinor, r.currency),
        money(r.totals.creditedMinor, r.currency),
        money(r.totals.outstandingMinor, r.currency),
      ],
    }));
    summary = (
      <div className="pdf-report-totals">
        {(["TRY", "MAD", "EUR", "USD"] as SupportedCurrency[])
          .filter((c) => reportRows.some((r) => r.currency === c))
          .map((c) => (
            <div key={c}>
              <span>
                {l("المتبقي", "Outstanding", "Solde")} · {c}
              </span>
              {money(
                reportRows
                  .filter((r) => r.currency === c)
                  .reduce((s, r) => s + r.totals.outstandingMinor, 0),
                c,
              )}
            </div>
          ))}
      </div>
    );
  } else if (target.type === "outstanding_balances_report") {
    headings = [
      l("العميل", "Customer", "Client"),
      l("الخدمة", "Service", "Service"),
      l("الإجمالي", "Total", "Total"),
      l("المتبقي", "Outstanding", "Solde"),
    ];
    const debts = app.debts.filter((d) => inPeriod(d.date));
    rows = debts.map((d) => ({
      id: d.id,
      cells: [
        <div>
          <strong>{d.clientName}</strong>
          <small dir="ltr">{d.phoneNumber}</small>
        </div>,
        d.serviceDetails,
        money(Math.round(d.totalAmount * 100), d.currency),
        money(Math.round(d.remainingAmount * 100), d.currency),
      ],
    }));
    summary = (
      <div className="pdf-report-totals">
        {(["TRY", "MAD", "EUR", "USD"] as SupportedCurrency[])
          .filter((c) => debts.some((d) => d.currency === c))
          .map((c) => (
            <div key={c}>
              <span>
                {l("المستحقات", "Receivables", "Créances")} · {c}
              </span>
              {money(
                debts
                  .filter((d) => d.currency === c)
                  .reduce((s, d) => s + Math.round(d.remainingAmount * 100), 0),
                c,
              )}
            </div>
          ))}
      </div>
    );
  } else if (target.type === "periodic_payment_report") {
    const linked = getInvoicedTransactionsMap(app.invoices);
    const payments = app.invoices
      .filter((inv) => inv.status !== "void")
      .flatMap((inv) =>
        inv.payments
          .filter((p) => p.status === "cleared" && inPeriod(p.receivedAt))
          .map((p) => ({
            id: p.id,
            date: p.receivedAt,
            name: inv.customerName,
            ref: inv.invoiceNumber,
            method: p.method,
            amount: p.amountMinor,
            currency: p.currency,
          })),
      );
    // Linked services are represented by their invoice payments, so they must not be counted twice.
    app.consulateAppointments
      .filter(
        (c) =>
          !linked.has(c.id) && c.paidAmount > 0 && inPeriod(c.submissionDate),
      )
      .forEach((c) =>
        payments.push({
          id: c.id,
          date: c.submissionDate,
          name: c.clientName,
          ref: c.id,
          method: l("دفعة معاملة", "Service payment", "Paiement de dossier"),
          amount: Math.round(c.paidAmount * 100),
          currency: c.currency,
        }),
      );
    app.flightBookings
      .filter(
        (f) => !linked.has(f.id) && f.paidAmount > 0 && inPeriod(f.bookingDate),
      )
      .forEach((f) =>
        payments.push({
          id: f.id,
          date: f.bookingDate,
          name: f.clientName,
          ref: f.pnr,
          method: f.paymentMethod,
          amount: Math.round(f.paidAmount * 100),
          currency: f.currency,
        }),
      );
    headings = [
      l("التاريخ", "Date", "Date"),
      l("العميل", "Customer", "Client"),
      l("المرجع", "Reference", "Référence"),
      l("طريقة الدفع", "Method", "Mode"),
      l("المبلغ", "Amount", "Montant"),
    ];
    rows = payments
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({
        id: p.id,
        cells: [p.date, p.name, p.ref, p.method, money(p.amount, p.currency)],
      }));
    summary = (
      <div className="pdf-report-totals">
        {(["TRY", "MAD", "EUR", "USD"] as SupportedCurrency[])
          .filter((c) => payments.some((p) => p.currency === c))
          .map((c) => (
            <div key={c}>
              <span>
                {l("المقبوض", "Received", "Reçu")} · {c}
              </span>
              {money(
                payments
                  .filter((p) => p.currency === c)
                  .reduce((s, p) => s + p.amount, 0),
                c,
              )}
            </div>
          ))}
      </div>
    );
  }
  const missing =
    ((isInvoice || isReceipt) && !invoice) ||
    (target.type === "statement" && !customer);
  const pageSize = isInvoice ? 5 : isReceipt ? 10 : 7;
  const pageKey = `${target.type}/${reference}/${invoice?.version}/${rows.length}/${language}/${sample}/${settings.showDigitalStamp}`;
  const pages: Row[][] = [];
  if (
    pagination.key === pageKey &&
    pagination.sizes.reduce((sum, size) => sum + size, 0) === rows.length
  ) {
    let offset = 0;
    pagination.sizes.forEach((size) => {
      pages.push(rows.slice(offset, offset + size));
      offset += size;
    });
  } else {
    for (let i = 0; i < rows.length; i += pageSize)
      pages.push(rows.slice(i, i + pageSize));
  }
  if (!pages.length) pages.push([]);
  const fileName = `ELFAZNI_${target.type}_${reference.replace(/[^a-zA-Z0-9_-]/g, "_")}${sample ? "_SAMPLE" : ""}`;
  const triggerPrint = async (mode: "pdf" | "print") => {
    await document.fonts.ready;
    const previous = document.title;
    document.title = fileName;
    if (invoice && (isInvoice || isReceipt))
      app.logInvoiceAudit(
        invoice.id,
        mode === "pdf" ? "exported_pdf" : "printed",
        auth.user?.username || "",
        fileName,
      );
    const restore = () => {
      document.title = previous;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
    setTimeout(restore, 1000);
  };
  return createPortal(
    <div
      className="print-document-portal pdf-portal"
      data-pagination-ready={paginationReady}
      role="dialog"
      aria-modal="true"
      aria-label={l("معاينة المستند", "Document preview", "Aperçu du document")}
    >
      <div className="pdf-toolbar no-print">
        <div>
          <FileText size={20} />
          <span>
            <strong>
              {l("استوديو المستندات", "Document studio", "Studio de documents")}
            </strong>
            <small>
              {primaryTitle} · A4 · {pages.length}{" "}
              {l("صفحة", "page(s)", "page(s)")}
            </small>
          </span>
        </div>
        <div className="pdf-toolbar-actions">
          <button
            className="ws-btn ws-btn-secondary"
            onClick={() => setOptions(!options)}
            aria-expanded={options}
          >
            <Settings2 size={16} />
            {l("خيارات", "Options", "Options")}
          </button>
          <button
            className="ws-btn ws-btn-primary"
            disabled={!!missing || !paginationReady}
            onClick={() => triggerPrint("pdf")}
          >
            <Download size={16} />
            {l("حفظ PDF", "Save PDF", "Enregistrer PDF")}
          </button>
          <button
            className="ws-icon-btn"
            disabled={!!missing || !paginationReady}
            onClick={() => triggerPrint("print")}
            aria-label={l("طباعة", "Print", "Imprimer")}
          >
            <Printer />
          </button>
          <button
            ref={closeRef}
            className="ws-icon-btn"
            onClick={() => app.setPrintPreviewTarget(null)}
            aria-label={l("إغلاق المعاينة", "Close preview", "Fermer l’aperçu")}
          >
            <X />
          </button>
        </div>
      </div>
      <div className="pdf-document-tabs no-print">
        {Object.entries(titles)
          .filter(
            ([id]) =>
              auth.canViewAccounting ||
              ![
                "all_accounts_report",
                "outstanding_balances_report",
                "periodic_payment_report",
              ].includes(id),
          )
          .map(([id, labels]) => (
            <button
              key={id}
              aria-pressed={target.type === id}
              onClick={() =>
                app.setPrintPreviewTarget({
                  ...target,
                  type: id as PrintPreviewTarget["type"],
                })
              }
            >
              {l(...labels)}
            </button>
          ))}
      </div>
      {options && (
        <div className="pdf-options no-print">
          <label>
            <input
              type="checkbox"
              checked={sample}
              onChange={(e) => setSample(e.target.checked)}
            />
            {l("علامة نموذج توضيحي", "Sample label", "Mention spécimen")}
          </label>
          <label>
            <input
              type="checkbox"
              checked={copy}
              onChange={(e) => setCopy(e.target.checked)}
            />
            {l("علامة نسخة", "Copy label", "Mention copie")}
          </label>
          <label>
            <input
              type="checkbox"
              checked={settings.showDigitalStamp}
              onChange={(e) =>
                app.updateDocumentSettings({
                  showDigitalStamp: e.target.checked,
                })
              }
            />
            {l(
              "توقيع المؤسسة البصري",
              "Company visual signature",
              "Signature visuelle de l’entreprise",
            )}
          </label>
          <p>
            {l(
              "لحفظ الملف، اختر «حفظ كملف PDF» في نافذة الطباعة.",
              "Choose “Save as PDF” in the print dialog.",
              "Choisissez « Enregistrer au format PDF » dans la fenêtre d’impression.",
            )}
          </p>
        </div>
      )}
      <div className="pdf-sheets">
        {pages.map((page, index) => (
          <article
            className="invoice-page pdf-sheet"
            key={index}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <header className="pdf-brand-header">
              <img src="/admin/crm/assets/logo-horizontal.svg" alt="ELFAZNI SERVICES" />
              <div>
                <strong>
                  {l("الفزني للخدمات", "ELFAZNI SERVICES", "ELFAZNI SERVICES")}
                </strong>
                <span>
                  {settings.headquartersAr === "إسطنبول"
                    ? l(
                        "إسطنبول، تركيا",
                        "Istanbul, Türkiye",
                        "Istanbul, Turquie",
                      )
                    : settings.headquartersAr}
                </span>
                <a dir="ltr" href={`tel:${settings.phone}`}>
                  {settings.phone}
                </a>
                <a dir="ltr" href={`mailto:${settings.email}`}>
                  {settings.email}
                </a>
              </div>
            </header>
            <div className="pdf-service-ribbon">
              <span>
                {l(
                  "متابعة إدارية",
                  "Administrative assistance",
                  "Assistance administrative",
                )}
              </span>
              <span>
                {l("خدمات قنصلية", "Consular services", "Services consulaires")}
              </span>
              <span>
                {l("حجوزات السفر", "Travel bookings", "Réservations de voyage")}
              </span>
            </div>
            <div className="pdf-title-row">
              <div>
                <span className="pdf-overline">
                  ELFAZNI SERVICES /{" "}
                  {language === "fr"
                    ? title[2].toUpperCase()
                    : title[1].toUpperCase()}
                </span>
                <h1>{primaryTitle}</h1>
              </div>
              <div>
                <bdi>{reference}</bdi>
                {invoice && (isInvoice || isReceipt) && (
                  <span className={`pdf-status ${invoice.status}`}>
                    {status(invoice.status)}
                  </span>
                )}
                {(sample ||
                  ((isInvoice || isReceipt) && invoice?.isDemoRecord)) && (
                  <span className="pdf-sample">
                    SAMPLE / {l("نموذج", "Sample", "Spécimen")}
                  </span>
                )}
                {copy && (
                  <span className="pdf-sample">
                    COPY / {l("نسخة", "Copy", "Copie")}
                  </span>
                )}
              </div>
            </div>
            <section className="pdf-meta">
              <div>
                <small>{l("موجّه إلى", "PREPARED FOR", "DESTINATAIRE")}</small>
                <strong>
                  {isInvoice || isReceipt
                    ? invoice?.customerName
                    : target.type === "statement"
                      ? customer?.clientName
                      : l("إدارة المؤسسة", "Management", "Direction")}
                </strong>
                <span dir="ltr">
                  {isInvoice || isReceipt
                    ? invoice?.customerPhone
                    : target.type === "statement"
                      ? customer?.phoneNumber
                      : ""}
                </span>
                {invoice?.customerAddress && (isInvoice || isReceipt) && (
                  <span>{invoice.customerAddress}</span>
                )}
              </div>
              <div>
                <small>
                  {l(
                    "تفاصيل المستند",
                    "DOCUMENT DETAILS",
                    "DÉTAILS DU DOCUMENT",
                  )}
                </small>
                <span>
                  {l("التاريخ", "Date", "Date")}:{" "}
                  <bdi>
                    {isInvoice || isReceipt
                      ? invoice?.issueDate
                      : new Date().toLocaleDateString("en-CA")}
                  </bdi>
                </span>
                {isInvoice && invoice?.dueDate && (
                  <span>
                    {l("الاستحقاق", "Due date", "Échéance")}:{" "}
                    <bdi>{invoice.dueDate}</bdi>
                  </span>
                )}
                {report || target.type === "statement" ? (
                  <span>
                    {l("الفترة", "Period", "Période")}: {periodLabel}
                  </span>
                ) : (
                  <span>
                    {l("العملة", "Currency", "Devise")}: {invoice?.currency}
                  </span>
                )}
                {settings.taxId && (
                  <span>
                    {l("الرقم الضريبي", "Tax ID", "Identifiant fiscal")}:{" "}
                    {settings.taxId}
                  </span>
                )}
              </div>
            </section>
            <main className="pdf-content">
              {missing ? (
                <div className="pdf-empty">
                  {l(
                    "لا يوجد سجل متاح لهذا المستند. اختر فاتورة أو عميلًا أولًا.",
                    "No record available. Select an invoice or customer first.",
                    "Aucun enregistrement. Sélectionnez une facture ou un client.",
                  )}
                </div>
              ) : (
                <>
                  <table className="pdf-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        {headings.map((h, i) => (
                          <th key={i}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {page.map((r, i) => (
                        <tr key={r.id}>
                          <td>
                            {pages
                              .slice(0, index)
                              .reduce((sum, page) => sum + page.length, 0) +
                              i +
                              1}
                          </td>
                          {r.cells.map((cell, j) => (
                            <td key={j}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!rows.length && (
                    <p className="pdf-empty">
                      {l(
                        "لا توجد حركات مسجلة ضمن نطاق المستند.",
                        "No entries in this document range.",
                        "Aucune écriture pour cette période.",
                      )}
                    </p>
                  )}
                  {index === pages.length - 1 && summary}
                </>
              )}
              {index === pages.length - 1 && (
                <div className="pdf-signoff">
                  <div className="pdf-signoff-thanks">
                    <strong>
                      {l(
                        "شكرًا لاختياركم الفزني للخدمات.",
                        "Thank you for choosing ELFAZNI SERVICES.",
                        "Merci d’avoir choisi ELFAZNI SERVICES.",
                      )}
                    </strong>
                    <p>
                      {l(
                        "للمتابعة، يرجى ذكر مرجع المستند عند التواصل معنا.",
                        "Please quote your document reference when contacting our team.",
                        "Pour tout suivi, indiquez la référence du document à notre équipe.",
                      )}
                    </p>
                    <bdi className="pdf-signoff-contact">{settings.phone}</bdi>
                  </div>
                  {settings.showDigitalStamp && !report && (
                    <div className="pdf-stamp-group">
                      <div
                        className="pdf-visual-signature"
                        role="img"
                        aria-label={l(
                          "ختم مؤسسة الفزني للخدمات",
                          "ELFAZNI SERVICES company stamp",
                          "Cachet ELFAZNI SERVICES",
                        )}
                      >
                        <FazniOfficialSeal size={152} variant="ink" rotate />
                      </div>
                      <div className="pdf-stamp-caption">
                        <strong>
                          {l(
                            "ختم الفزني للخدمات",
                            "Company stamp",
                            "Cachet de l’entreprise",
                          )}
                        </strong>
                        <p>
                          {l(
                            "معكم من بداية الخدمة إلى اكتمالها.",
                            "With you, from the first step to completion.",
                            "À vos côtés, du début à la fin du service.",
                          )}
                        </p>
                        <span>ELFAZNI SERVICES</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </main>
            <footer className="pdf-footer">
              <div>
                <strong>ELFAZNI SERVICES</strong>
                <span>
                  {l(
                    "خدمات إدارية وقنصلية وحجوزات السفر",
                    "Administrative, consular & travel services",
                    "Services administratifs, consulaires et voyages",
                  )}
                </span>
              </div>
              <p>
                {l(
                  "خدمة مساعدة مستقلة ولا تمثل أي جهة حكومية.",
                  "Independent support service, not affiliated with a government entity.",
                  "Service indépendant, sans affiliation à une autorité publique.",
                )}
              </p>
              <span className="pdf-page-number">
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(pages.length).padStart(2, "0")}
              </span>
            </footer>
          </article>
        ))}
      </div>
    </div>,
    document.body,
  );
};
