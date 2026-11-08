import { useUITranslation } from '../../i18n/useUITranslation';
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Users,
  FileSpreadsheet,
  Settings,
  ArrowRight,
  Trash2,
  DollarSign,
  Receipt,
  Archive,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Calendar,
  Building2,
  Plane,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';
import {
  DocumentClassification,
  Invoice,
  InvoiceStatus,
  SUPPORTED_CURRENCIES,
  SupportedCurrency,
} from '../../types';
import {
  buildCustomerStatement,
  calculateInvoiceLine,
  formatMinorMoney,
  fromMinorUnits,
  getCustomerKey,
  recalculateInvoiceTotals,
  toMinorUnits,
} from '../../utils/invoiceCalculations';
import { createZipBlob, renderInvoiceStandaloneHtml } from '../../utils/zipExporter';
import { exportToCSV, generateWhatsAppLink } from '../../utils/formatters';
import { FazniOfficialSeal } from '../common/FazniLogo';

interface EditableLineDraft {
  id: string;
  sourceTransactionId?: string | null;
  sourceType?: 'consulate' | 'flight' | 'custom';
  serviceReference?: string;
  labelAr: string;
  labelEn: string;
  quantity: number;
  unitPriceMajor: number;
  discountMajor: number;
  taxRatePercent: number;
}

export const InvoicesModule: React.FC = () => {
  const { ui } = useUITranslation();
  const {
    invoices,
    consulateAppointments,
    flightBookings,
    customerProfiles,
    invoicedTransactionsMap,
    documentSettings,
    updateDocumentSettings,
    invoiceSubView,
    setInvoiceSubView,
    activeInvoiceId,
    setActiveInvoiceId,
    selectedCustomerIdForStatement,
    setSelectedCustomerIdForStatement,
    preselectedTransactionsForInvoice,
    setPreselectedTransactionsForInvoice,
    setPrintPreviewTarget,
    createOrSaveInvoice,
    issueDraftInvoice,
    recordInvoicePayment,
    addInvoiceCreditNote,
    voidInvoice,
    systemLists,
  } = useApp();

  const { user, canViewAccounting, canEditOperations } = useAuth();
  const actorName = user?.username || 'elfazni.admin';

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ============================================================================
  // 1. INVOICE LIST STATE & FILTERS
  // ============================================================================
  const [listSearch, setListSearch] = useState('');
  const [listStatusFilter, setListStatusFilter] = useState<string>('all');
  const [listCurrencyFilter, setListCurrencyFilter] = useState<string>('all');
  const [listCustomerFilter, setListCustomerFilter] = useState<string>('all');
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [showBulkZipConfirm, setShowBulkZipConfirm] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (listCustomerFilter !== 'all' && inv.customerId !== listCustomerFilter) return false;
      if (listStatusFilter !== 'all' && inv.status !== listStatusFilter) return false;
      if (listCurrencyFilter !== 'all' && inv.currency !== listCurrencyFilter) return false;
      if (listSearch.trim()) {
        const q = listSearch.trim().toLowerCase();
        const match =
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          inv.customerPhone.toLowerCase().includes(q) ||
          inv.lines.some(
            (l) =>
              l.labelAr.toLowerCase().includes(q) ||
              (l.serviceReference && l.serviceReference.toLowerCase().includes(q))
          );
        if (!match) return false;
      }
      return true;
    });
  }, [invoices, listCustomerFilter, listStatusFilter, listCurrencyFilter, listSearch]);

  // ============================================================================
  // 2. INVOICE EDITOR STATE (Create / Edit Draft)
  // ============================================================================
  const editingInvoiceObj = useMemo(() => {
    if (!activeInvoiceId) return null;
    return invoices.find((i) => i.id === activeInvoiceId) || null;
  }, [activeInvoiceId, invoices]);

  const [editorCustomerKey, setEditorCustomerKey] = useState<string>('');
  const [editorCustomerName, setEditorCustomerName] = useState<string>('');
  const [editorCustomerPhone, setEditorCustomerPhone] = useState<string>('');
  const [editorCustomerAddress, setEditorCustomerAddress] = useState<string>('');
  const [editorCustomerTaxId, setEditorCustomerTaxId] = useState<string>('');
  const [editorClassification, setEditorClassification] = useState<DocumentClassification>(
    documentSettings.defaultDocumentClassification || 'invoice'
  );
  const [editorCurrency, setEditorCurrency] = useState<SupportedCurrency>('TRY');
  const [editorIssueDate, setEditorIssueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [editorServiceDate, setEditorServiceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [editorDueDate, setEditorDueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [editorDocDiscountMajor, setEditorDocDiscountMajor] = useState<number>(0);
  const [editorInitialPaidMajor, setEditorInitialPaidMajor] = useState<number>(0);
  const [editorPaymentMethod, setEditorPaymentMethod] = useState<string>('تحويل بنكي / Virement');
  const [editorNotes, setEditorNotes] = useState<string>('');
  const [editorIsDemo, setEditorIsDemo] = useState<boolean>(false);
  const [editorLines, setEditorLines] = useState<EditableLineDraft[]>([]);

  // Populate editor when opening from preselected transactions or editing a draft
  useEffect(() => {
    if (invoiceSubView !== 'invoice_editor') return;

    if (editingInvoiceObj && editingInvoiceObj.status === 'draft') {
      setEditorCustomerKey(editingInvoiceObj.customerId);
      setEditorCustomerName(editingInvoiceObj.customerName);
      setEditorCustomerPhone(editingInvoiceObj.customerPhone);
      setEditorCustomerAddress(editingInvoiceObj.customerAddress || '');
      setEditorCustomerTaxId(editingInvoiceObj.customerTaxId || '');
      setEditorClassification(editingInvoiceObj.documentClassification);
      setEditorCurrency(editingInvoiceObj.currency);
      setEditorIssueDate(editingInvoiceObj.issueDate);
      setEditorServiceDate(editingInvoiceObj.serviceDate || editingInvoiceObj.issueDate);
      setEditorDueDate(editingInvoiceObj.dueDate || editingInvoiceObj.issueDate);
      setEditorDocDiscountMajor(fromMinorUnits(editingInvoiceObj.documentDiscountMinor));
      setEditorNotes(editingInvoiceObj.notes || '');
      setEditorIsDemo(Boolean(editingInvoiceObj.isDemoRecord));
      setEditorLines(
        editingInvoiceObj.lines.map((l) => ({
          id: l.id,
          sourceTransactionId: l.sourceTransactionId,
          sourceType: l.sourceType || 'custom',
          serviceReference: l.serviceReference || '',
          labelAr: l.labelAr,
          labelEn: l.labelEn || '',
          quantity: l.quantity,
          unitPriceMajor: fromMinorUnits(l.unitPriceMinor),
          discountMajor: fromMinorUnits(l.discountMinor),
          taxRatePercent: Math.round(l.taxRate * 100),
        }))
      );
      return;
    }

    if (preselectedTransactionsForInvoice.length > 0) {
      const builtLines: EditableLineDraft[] = [];
      let custName = '';
      let custPhone = '';
      let curr: SupportedCurrency = 'TRY';
      let initialPaidSum = 0;

      preselectedTransactionsForInvoice.forEach((entry, idx) => {
        if (entry.type === 'consulate') {
          const rec = consulateAppointments.find((c) => c.id === entry.id);
          if (rec) {
            custName = rec.clientName;
            custPhone = rec.phoneNumber;
            curr = rec.currency;
            initialPaidSum += rec.paidAmount;
            const typeText =
              rec.appointmentType === 'أخرى' && rec.customAppointmentType
                ? rec.customAppointmentType
                : rec.appointmentType;
            builtLines.push({
              id: `draft-line-${Date.now()}-${idx}`,
              sourceTransactionId: rec.id,
              sourceType: 'consulate',
              serviceReference: rec.id.toUpperCase(),
              labelAr: `خدمة مواعيد القنصلية: ${typeText}`,
              labelEn: `Consulate Service: ${typeText}`,
              quantity: 1,
              unitPriceMajor: rec.price,
              discountMajor: 0,
              taxRatePercent: Math.round((documentSettings.defaultTaxRate || 0) * 100),
            });
          }
        } else {
          const rec = flightBookings.find((f) => f.id === entry.id);
          if (rec) {
            custName = rec.clientName;
            custPhone = rec.phoneNumber;
            curr = rec.currency;
            initialPaidSum += rec.paidAmount;
            builtLines.push({
              id: `draft-line-${Date.now()}-${idx}`,
              sourceTransactionId: rec.id,
              sourceType: 'flight',
              serviceReference: `PNR: ${rec.pnr}`,
              labelAr: `حجز تذكرة طيران (${rec.pnr}) — ${rec.airlineAndRoute}`,
              labelEn: `Flight Ticket (${rec.pnr}) — ${rec.airlineAndRoute}`,
              quantity: 1,
              unitPriceMajor: rec.sellingPrice,
              discountMajor: 0,
              taxRatePercent: Math.round((documentSettings.defaultTaxRate || 0) * 100),
            });
          }
        }
      });

      const key = getCustomerKey(custName, custPhone);
      setEditorCustomerKey(key);
      setEditorCustomerName(custName);
      setEditorCustomerPhone(custPhone);
      setEditorCurrency(curr);
      setEditorInitialPaidMajor(initialPaidSum);
      setEditorLines(builtLines);
      setPreselectedTransactionsForInvoice([]);
      return;
    }

    // Default blank draft if no lines exist yet
    if (editorLines.length === 0) {
      setEditorLines([
        {
          id: `draft-line-${Date.now()}`,
          sourceTransactionId: null,
          sourceType: 'custom',
          serviceReference: '',
          labelAr: '',
          labelEn: '',
          quantity: 1,
          unitPriceMajor: 0,
          discountMajor: 0,
          taxRatePercent: Math.round((documentSettings.defaultTaxRate || 0) * 100),
        },
      ]);
    }
  }, [invoiceSubView, editingInvoiceObj, preselectedTransactionsForInvoice]);

  // Eligible uninvoiced CRM transactions for the currently selected customer in Editor
  const eligibleCustomerTransactions = useMemo(() => {
    if (!editorCustomerName.trim()) return [];
    const targetKey = editorCustomerKey || getCustomerKey(editorCustomerName, editorCustomerPhone);
    const alreadyInEditorIds = new Set(
      editorLines.map((l) => l.sourceTransactionId).filter(Boolean) as string[]
    );

    const list: {
      id: string;
      type: 'consulate' | 'flight';
      title: string;
      reference: string;
      date: string;
      amount: number;
      paidAmount: number;
      currency: SupportedCurrency;
    }[] = [];

    consulateAppointments.forEach((c) => {
      const key = getCustomerKey(c.clientName, c.phoneNumber);
      if (key !== targetKey) return;
      if (invoicedTransactionsMap.has(c.id)) return;
      if (alreadyInEditorIds.has(c.id)) return;
      const typeText =
        c.appointmentType === 'أخرى' && c.customAppointmentType
          ? c.customAppointmentType
          : c.appointmentType;
      list.push({
        id: c.id,
        type: 'consulate',
        title: `موعد قنصلية: ${typeText}`,
        reference: c.id.toUpperCase(),
        date: c.submissionDate,
        amount: c.price,
        paidAmount: c.paidAmount,
        currency: c.currency,
      });
    });

    flightBookings.forEach((f) => {
      const key = getCustomerKey(f.clientName, f.phoneNumber);
      if (key !== targetKey) return;
      if (invoicedTransactionsMap.has(f.id)) return;
      if (alreadyInEditorIds.has(f.id)) return;
      list.push({
        id: f.id,
        type: 'flight',
        title: `تذكرة طيران (${f.pnr}): ${f.airlineAndRoute}`,
        reference: `PNR: ${f.pnr}`,
        date: f.bookingDate,
        amount: f.sellingPrice,
        paidAmount: f.paidAmount,
        currency: f.currency,
      });
    });

    return list;
  }, [
    editorCustomerKey,
    editorCustomerName,
    editorCustomerPhone,
    editorLines,
    consulateAppointments,
    flightBookings,
    invoicedTransactionsMap,
  ]);

  // Live preview totals inside Editor
  const editorPreviewTotals = useMemo(() => {
    const computedLines = editorLines.map((l, idx) =>
      calculateInvoiceLine({
        id: l.id,
        invoiceId: 'preview',
        sourceTransactionId: l.sourceTransactionId,
        sourceType: l.sourceType,
        serviceReference: l.serviceReference,
        labelAr: l.labelAr || 'خدمة',
        labelEn: l.labelEn,
        quantity: l.quantity,
        unitPriceMinor: toMinorUnits(l.unitPriceMajor),
        discountMinor: toMinorUnits(l.discountMajor),
        taxRate: (Number(l.taxRatePercent) || 0) / 100,
        sortOrder: idx + 1,
      })
    );

    const mockPayments =
      editorInitialPaidMajor > 0
        ? [
            {
              id: 'init-pay',
              invoiceId: 'preview',
              amountMinor: toMinorUnits(editorInitialPaidMajor),
              currency: editorCurrency,
              method: editorPaymentMethod,
              receivedAt: editorIssueDate,
              recordedBy: actorName,
              status: 'cleared' as const,
            },
          ]
        : [];

    return recalculateInvoiceTotals(
      computedLines,
      editingInvoiceObj ? editingInvoiceObj.payments : mockPayments,
      editingInvoiceObj ? editingInvoiceObj.creditNotes : [],
      toMinorUnits(editorDocDiscountMajor),
      'issued'
    );
  }, [
    editorLines,
    editorInitialPaidMajor,
    editorCurrency,
    editorPaymentMethod,
    editorIssueDate,
    editorDocDiscountMajor,
    editingInvoiceObj,
    actorName,
  ]);

  const handleSelectExistingCustomerInEditor = (custId: string) => {
    const found = customerProfiles.find((c) => c.customerId === custId);
    if (!found) return;
    setEditorCustomerKey(found.customerId);
    setEditorCustomerName(found.clientName);
    setEditorCustomerPhone(found.phoneNumber);
    if (found.currencies.length > 0) {
      setEditorCurrency(found.currencies[0]);
    }
  };

  const handleAppendEligibleTransactionToEditor = (tx: (typeof eligibleCustomerTransactions)[0]) => {
    // Remove empty placeholder line if first line is blank
    const cleaned = editorLines.filter((l) => l.labelAr.trim() !== '' || l.unitPriceMajor > 0);
    if (cleaned.length === 0) {
      setEditorCurrency(tx.currency);
    } else if (tx.currency !== editorCurrency) {
      setFeedback({
        type: 'error',
        text: `لا يمكن خلط عملات مختلفة في نفس الفاتورة. عملة الفاتورة الحالية (${editorCurrency}) بينما المعاملة المختارة بعملة (${tx.currency}).`,
      });
      return;
    }

    setEditorLines([
      ...cleaned,
      {
        id: `line-${Date.now()}`,
        sourceTransactionId: tx.id,
        sourceType: tx.type,
        serviceReference: tx.reference,
        labelAr: tx.title,
        labelEn: '',
        quantity: 1,
        unitPriceMajor: tx.amount,
        discountMajor: 0,
        taxRatePercent: Math.round((documentSettings.defaultTaxRate || 0) * 100),
      },
    ]);
    setEditorInitialPaidMajor((prev) => prev + tx.paidAmount);
  };

  const handleSaveOrIssueFromEditor = (issueImmediately: boolean) => {
    const validLines = editorLines.filter((l) => l.labelAr.trim() !== '');
    if (validLines.length === 0) {
      setFeedback({ type: 'error', text: 'يرجى إدخال وصف لبند واحد على الأقل في الفاتورة.' });
      return;
    }

    const res = createOrSaveInvoice({
      id: editingInvoiceObj?.id,
      customerName: editorCustomerName,
      customerPhone: editorCustomerPhone,
      customerAddress: editorCustomerAddress,
      customerTaxId: editorCustomerTaxId,
      documentClassification: editorClassification,
      currency: editorCurrency,
      issueDate: editorIssueDate,
      serviceDate: editorServiceDate,
      dueDate: editorDueDate,
      lines: validLines.map((l) => ({
        id: l.id,
        sourceTransactionId: l.sourceTransactionId || null,
        sourceType: l.sourceType || 'custom',
        serviceReference: l.serviceReference,
        labelAr: l.labelAr.trim(),
        labelEn: l.labelEn.trim(),
        quantity: l.quantity,
        unitPriceMinor: toMinorUnits(l.unitPriceMajor),
        discountMinor: toMinorUnits(l.discountMajor),
        taxRate: (Number(l.taxRatePercent) || 0) / 100,
      })),
      documentDiscountMinor: toMinorUnits(editorDocDiscountMajor),
      initialPayments:
        !editingInvoiceObj && editorInitialPaidMajor > 0
          ? [
              {
                amountMinor: toMinorUnits(editorInitialPaidMajor),
                currency: editorCurrency,
                method: editorPaymentMethod,
                receivedAt: editorIssueDate,
                externalReference: `INIT-${Date.now().toString().slice(-4)}`,
                recordedBy: actorName,
                status: 'cleared',
                notes: 'دفعة مسجلة عند إصدار الفاتورة',
              },
            ]
          : [],
      notes: editorNotes,
      issueImmediately,
      actor: actorName,
      isDemoRecord: editorIsDemo,
    });

    if (!res.success) {
      setFeedback({ type: 'error', text: res.message });
      return;
    }

    setFeedback({ type: 'success', text: res.message });
    if (res.invoice) {
      setActiveInvoiceId(res.invoice.id);
      setInvoiceSubView('invoice_detail');
    }
  };

  // QA Helper: Generate a Demo 10-line or 100-line sample in the editor for stress testing A4 print
  const handlePopulateDemoQA = (lineCount: 10 | 100) => {
    setEditorCustomerName('عميل اختبار جودة الطباعة (DEMO QA CLIENT)');
    setEditorCustomerPhone('+905520000000');
    setEditorCustomerAddress('إسطنبول — نموذج اختباري غير حقيقي للمعاينة فقط');
    setEditorCurrency('TRY');
    setEditorIsDemo(true);
    const demoLines: EditableLineDraft[] = Array.from({ length: lineCount }).map((_, idx) => ({
      id: `demo-line-${idx + 1}`,
      sourceTransactionId: null,
      sourceType: 'custom',
      serviceReference: `DEMO-${String(idx + 1).padStart(3, '0')}`,
      labelAr: `بند اختباري رقم ${idx + 1} — خدمة تسيير مواعيد وحجوزات (DEMO SAMPLE ITEM)`,
      labelEn: `QA Test Service Line Item #${idx + 1}`,
      quantity: 1,
      unitPriceMajor: 250,
      discountMajor: idx % 5 === 0 ? 25 : 0,
      taxRatePercent: 0,
    }));
    setEditorLines(demoLines);
    setFeedback({
      type: 'success',
      text: `تم توليد ${lineCount} بنداً تجريبياً مدموغاً بوسم DEMO QA لاختبار الطباعة متعددة الصفحات A4.`,
    });
  };

  // ============================================================================
  // 3. INVOICE DETAIL ACTIONS (Record Payment, Credit Note, Void)
  // ============================================================================
  const [newPaymentAmountMajor, setNewPaymentAmountMajor] = useState<number>(0);
  const [newPaymentMethod, setNewPaymentMethod] = useState<string>('تحويل بنكي / Virement');
  const [newPaymentDate, setNewPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [newPaymentRef, setNewPaymentRef] = useState<string>('');

  const [creditNoteReason, setCreditNoteReason] = useState<string>('');
  const [creditNoteAmountMajor, setCreditNoteAmountMajor] = useState<number>(0);
  const [voidReasonInput, setVoidReasonInput] = useState<string>('');

  // ============================================================================
  // 4. CUSTOMER ACCOUNT STATEMENT STATE
  // ============================================================================
  const activeStatementCustomer = useMemo(() => {
    if (selectedCustomerIdForStatement) {
      const found = customerProfiles.find((c) => c.customerId === selectedCustomerIdForStatement);
      if (found) return found;
    }
    return customerProfiles[0] || null;
  }, [selectedCustomerIdForStatement, customerProfiles]);

  const [stmtCurrency, setStmtCurrency] = useState<SupportedCurrency>('TRY');
  const [stmtFromDate, setStmtFromDate] = useState<string>('');
  const [stmtToDate, setStmtToDate] = useState<string>('');
  const [stmtIncludeInvoices, setStmtIncludeInvoices] = useState<boolean>(true);
  const [stmtIncludeUninvoiced, setStmtIncludeUninvoiced] = useState<boolean>(true);
  const [stmtIncludePayments, setStmtIncludePayments] = useState<boolean>(true);
  const [stmtIncludeCredits, setStmtIncludeCredits] = useState<boolean>(true);

  useEffect(() => {
    if (activeStatementCustomer && activeStatementCustomer.currencies.length > 0) {
      if (!activeStatementCustomer.currencies.includes(stmtCurrency)) {
        setStmtCurrency(activeStatementCustomer.currencies[0]);
      }
    }
  }, [activeStatementCustomer, stmtCurrency]);

  const liveStatementResult = useMemo(() => {
    if (!activeStatementCustomer) return null;
    return buildCustomerStatement(activeStatementCustomer, stmtCurrency, {
      fromDate: stmtFromDate,
      toDate: stmtToDate,
      includeInvoices: stmtIncludeInvoices,
      includeUninvoicedServices: stmtIncludeUninvoiced,
      includePayments: stmtIncludePayments,
      includeCredits: stmtIncludeCredits,
    });
  }, [
    activeStatementCustomer,
    stmtCurrency,
    stmtFromDate,
    stmtToDate,
    stmtIncludeInvoices,
    stmtIncludeUninvoiced,
    stmtIncludePayments,
    stmtIncludeCredits,
  ]);

  // ============================================================================
  // 5. BULK ZIP EXPORT HANDLER
  // ============================================================================
  const handleConfirmBulkZipDownload = () => {
    const selectedObjs = invoices.filter((i) => selectedInvoiceIds.includes(i.id));
    if (selectedObjs.length === 0) return;

    const files = selectedObjs.map((inv) => {
      const safeNum = inv.invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
      return {
        filename: `ELFAZNI_Invoice_${safeNum}.html`,
        content: renderInvoiceStandaloneHtml(inv, documentSettings),
      };
    });

    const manifest = {
      exportedBy: actorName,
      exportedAt: new Date().toISOString(),
      invoiceCount: selectedObjs.length,
      invoices: selectedObjs.map((i) => ({
        invoiceNumber: i.invoiceNumber,
        customerName: i.customerName,
        currency: i.currency,
        total: fromMinorUnits(i.totalMinor),
        balanceDue: fromMinorUnits(i.balanceDueMinor),
      })),
    };

    files.push({
      filename: 'ELFAZNI_Export_Manifest.json',
      content: JSON.stringify(manifest, null, 2),
    });

    const zipBlob = createZipBlob(files);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ELFAZNI_Invoices_Archive_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowBulkZipConfirm(false);
    setFeedback({
      type: 'success',
      text: `تم تصدير أرشيف ZIP يحتوي على (${selectedObjs.length}) فاتورة منفصلة بنجاح.`,
    });
  };

  const renderStatusPill = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />{ui("مدفوعة بالكامل")}</span>
        );
      case 'partially_paid':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
            <Clock className="w-3.5 h-3.5" />{ui("مدفوعة جزئياً")}</span>
        );
      case 'void':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700">
            <XCircle className="w-3.5 h-3.5" />{ui("ملغاة (VOID)")}</span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
            <FileText className="w-3.5 h-3.5" />{ui("مسودة")}</span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#004AA5]">
            <ShieldCheck className="w-3.5 h-3.5" />{ui("صادرة ومعتمدة")}</span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Top Header & Sub-Navigation */}
      <div className="bg-white rounded-2xl p-5 border border-[#D7E7F7] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#0B2E57] text-[#CC9048] flex items-center justify-center shrink-0 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-[#0B2E57]">{ui("الفواتير وكشوف الحساب والطباعة الرسمية")}</h2>
                <span className="text-xs text-[#5E7086] font-semibold">{ui("• الفزني سيرفيسز (ELFAZNI SERVICES)")}</span>
              </div>
              <p className="text-xs text-[#5E7086] mt-0.5">{ui("فصل محاسبي دقيق بين (1) الفاتورة الفردية للعميل، (2) كشف حساب العميل الشامل، و(3) التقرير المالي المجمع لجميع الحسابات.")}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveInvoiceId(null);
                setPreselectedTransactionsForInvoice([]);
                setEditorLines([
                  {
                    id: `line-${Date.now()}`,
                    sourceTransactionId: null,
                    sourceType: 'custom',
                    serviceReference: '',
                    labelAr: '',
                    labelEn: '',
                    quantity: 1,
                    unitPriceMajor: 0,
                    discountMajor: 0,
                    taxRatePercent: Math.round((documentSettings.defaultTaxRate || 0) * 100),
                  },
                ]);
                setInvoiceSubView('invoice_editor');
              }}
              className="px-4 py-2 rounded-xl bg-[#004AA5] hover:bg-[#0B2E57] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{ui("إنشاء فاتورة جديدة")}</span>
            </button>

            {canViewAccounting && (
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#eaf4ff] text-[#0B2E57] border border-[#D7E7F7] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-[#004AA5]" />
                <span>{ui("إعدادات الفواتير والطباعة")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-view Segmented Control */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#F8FAFC] rounded-xl border border-[#D7E7F7]">
          <button
            type="button"
            onClick={() => setInvoiceSubView('invoices_list')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              invoiceSubView === 'invoices_list' || invoiceSubView === 'invoice_detail'
                ? 'bg-[#0B2E57] text-white shadow-xs'
                : 'text-[#5E7086] hover:text-[#0B2E57]'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{ui("سجل الفواتير (")}{invoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setInvoiceSubView('customers_directory')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              invoiceSubView === 'customers_directory'
                ? 'bg-[#0B2E57] text-white shadow-xs'
                : 'text-[#5E7086] hover:text-[#0B2E57]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{ui("ملفات العملاء والفوترة (")}{customerProfiles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setInvoiceSubView('customer_statement')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              invoiceSubView === 'customer_statement'
                ? 'bg-[#0B2E57] text-white shadow-xs'
                : 'text-[#5E7086] hover:text-[#0B2E57]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{ui("كشف حساب عميل (Statement)")}</span>
          </button>

          <button
            type="button"
            onClick={() => setInvoiceSubView('invoice_editor')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
              invoiceSubView === 'invoice_editor'
                ? 'bg-[#0B2E57] text-white shadow-xs'
                : 'text-[#5E7086] hover:text-[#0B2E57]'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{ui("محرر الفاتورة")}</span>
          </button>

          {canViewAccounting && (
            <button
              type="button"
              onClick={() => setInvoiceSubView('all_accounts_report')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                invoiceSubView === 'all_accounts_report'
                  ? 'bg-[#0B2E57] text-white shadow-xs'
                  : 'text-[#5E7086] hover:text-[#0B2E57]'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{ui("تقرير جميع الحسابات")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{ui(feedback.text)}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline cursor-pointer"
          >{ui("إغلاق")}</button>
        </div>
      )}

      {/* ========================================================================
          SUB-VIEW A: INVOICES LIST (قائمة الفواتير)
         ======================================================================== */}
      {invoiceSubView === 'invoices_list' && (
        <div className="space-y-4">
          {/* Filters & Bulk Actions Bar */}
          <div className="bg-white rounded-2xl p-4 border border-[#D7E7F7] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
              <div className="relative">
                <Search className="w-4 h-4 text-[#5E7086] absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder={ui("بحث برقم الفاتورة، اسم العميل، الهاتف...")}
                  className="w-full pr-9 pl-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#D7E7F7] text-xs font-semibold text-[#0B2E57] focus:bg-white focus:border-[#004AA5] focus:outline-none"
                />
              </div>

              <select
                value={listCustomerFilter}
                onChange={(e) => setListCustomerFilter(e.target.value)}
                className="bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 text-xs font-bold text-[#0B2E57] focus:outline-none"
              >
                <option value="all">{ui("كل العملاء (")}{customerProfiles.length})</option>
                {customerProfiles.map((c) => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.clientName}
                  </option>
                ))}
              </select>

              <select
                value={listStatusFilter}
                onChange={(e) => setListStatusFilter(e.target.value)}
                className="bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 text-xs font-bold text-[#0B2E57] focus:outline-none"
              >
                <option value="all">{ui("كل الحالات")}</option>
                <option value="draft">{ui("مسودة (Draft)")}</option>
                <option value="issued">{ui("صادرة (Issued)")}</option>
                <option value="partially_paid">{ui("مدفوعة جزئياً (Partial)")}</option>
                <option value="paid">{ui("مدفوعة بالكامل (Paid)")}</option>
                <option value="void">{ui("ملغاة (Void)")}</option>
              </select>

              <select
                value={listCurrencyFilter}
                onChange={(e) => setListCurrencyFilter(e.target.value)}
                className="bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 text-xs font-bold text-[#0B2E57] focus:outline-none"
              >
                <option value="all">{ui("كل العملات")}</option>
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            {canViewAccounting && selectedInvoiceIds.length > 0 && (
              <button
                type="button"
                onClick={() => setShowBulkZipConfirm(true)}
                className="px-3.5 py-2 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Archive className="w-4 h-4 text-[#CC9048]" />
                <span>{ui("تصدير الفواتير المحددة (")}{selectedInvoiceIds.length} {ui(") كملف ZIP")}</span>
              </button>
            )}
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-2xl border border-[#D7E7F7] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#0B2E57] text-white font-bold">
                    <th className="py-3 px-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedInvoiceIds.length === filteredInvoices.length) {
                            setSelectedInvoiceIds([]);
                          } else {
                            setSelectedInvoiceIds(filteredInvoices.map((i) => i.id));
                          }
                        }}
                        className="text-white cursor-pointer"
                      >
                        {selectedInvoiceIds.length > 0 &&
                        selectedInvoiceIds.length === filteredInvoices.length ? (
                          <CheckSquare className="w-4 h-4 text-[#CC9048]" />
                        ) : (
                          <Square className="w-4 h-4 opacity-70" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-3">{ui("رقم الفاتورة")}</th>
                    <th className="py-3 px-3">{ui("العميل")}</th>
                    <th className="py-3 px-3">{ui("تاريخ الإصدار")}</th>
                    <th className="py-3 px-3">{ui("البنود والخدمات")}</th>
                    <th className="py-3 px-3 text-left">{ui("الإجمالي")}</th>
                    <th className="py-3 px-3 text-left">{ui("المدفوع")}</th>
                    <th className="py-3 px-3 text-left">{ui("المتبقي المستحق")}</th>
                    <th className="py-3 px-3">{ui("الحالة")}</th>
                    <th className="py-3 px-3 text-center">{ui("الإجراءات")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7E7F7]">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-[#5E7086]">{ui("لا توجد فواتير مطابقة لخيارات البحث الحالية.")}</td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const isChecked = selectedInvoiceIds.includes(inv.id);
                      const whatsappUrl =
                        inv.balanceDueMinor > 0 && inv.customerPhone
                          ? generateWhatsAppLink(
                              inv.customerPhone,
                              inv.customerName,
                              fromMinorUnits(inv.balanceDueMinor),
                              `فاتورة رقم ${inv.invoiceNumber}`,
                              inv.currency
                            )
                          : null;

                      return (
                        <tr
                          key={inv.id}
                          className={`hover:bg-[#eaf4ff]/50 transition ${
                            inv.status === 'void' ? 'opacity-60 bg-slate-50' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoiceIds((prev) =>
                                  prev.includes(inv.id)
                                    ? prev.filter((id) => id !== inv.id)
                                    : [...prev, inv.id]
                                );
                              }}
                              className="cursor-pointer text-[#004AA5]"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-3 font-mono font-black text-[#0B2E57]" dir="ltr">
                            {inv.invoiceNumber}
                            {inv.isDemoRecord && (
                              <span className="ml-1.5 text-[10px] text-rose-600 font-bold">
                                [DEMO]
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-[#0B2E57]">{inv.customerName}</div>
                            <div className="text-[11px] font-mono text-[#5E7086]" dir="ltr">
                              {inv.customerPhone}
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-[#5E7086]" dir="ltr">
                            {inv.issueDate}
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            <div className="truncate font-semibold text-[#0B2E57]">
                              {inv.lines.map((l) => l.labelAr).join(' + ')}
                            </div>
                            <div className="text-[11px] text-[#5E7086]">
                              {inv.lines.length} {ui("بند • عملة")}{inv.currency}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-left font-mono font-black text-[#0B2E57]" dir="ltr">
                            {formatMinorMoney(inv.totalMinor, inv.currency)}
                          </td>
                          <td className="py-3 px-3 text-left font-mono font-bold text-emerald-700" dir="ltr">
                            {formatMinorMoney(inv.paidMinor, inv.currency)}
                          </td>
                          <td
                            className={`py-3 px-3 text-left font-mono font-black ${
                              inv.balanceDueMinor > 0 ? 'text-rose-700' : 'text-slate-500'
                            }`}
                            dir="ltr"
                          >
                            {formatMinorMoney(inv.balanceDueMinor, inv.currency)}
                          </td>
                          <td className="py-3 px-3">{renderStatusPill(inv.status)}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveInvoiceId(inv.id);
                                  setInvoiceSubView('invoice_detail');
                                }}
                                title={ui("عرض تفاصيل الفاتورة والدفعات")}
                                className="px-2.5 py-1.5 rounded-lg bg-[#eaf4ff] hover:bg-[#004AA5] text-[#0B2E57] hover:text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{ui("عرض")}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setPrintPreviewTarget({
                                    type: 'invoice',
                                    invoiceId: inv.id,
                                    isDemoMode: inv.isDemoRecord,
                                  })
                                }
                                title={ui("معاينة الطباعة القياسية A4 / تنزيل PDF")}
                                className="px-2.5 py-1.5 rounded-lg bg-[#0B2E57] hover:bg-[#004AA5] text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>{ui("طباعة / PDF")}</span>
                              </button>

                              {whatsappUrl && (
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={ui("مشاركة مطالبة السداد عبر واتساب مع الحسابات البنكية")}
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          SUB-VIEW B: CUSTOMERS BILLING DIRECTORY (ملفات العملاء والفوترة)
         ======================================================================== */}
      {invoiceSubView === 'customers_directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customerProfiles.map((cust) => (
            <div
              key={cust.customerId}
              className="bg-white rounded-2xl border border-[#D7E7F7] p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#004AA5]/60 transition"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-[#0B2E57]">{cust.clientName}</h3>
                    <p className="text-xs font-mono text-[#5E7086]" dir="ltr">
                      {cust.phoneNumber || 'بدون رقم هاتف'}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-[#5E7086]" dir="ltr">
                    {cust.customerId}
                  </span>
                </div>

                <div className="text-xs text-[#5E7086] flex items-center gap-2 pt-1">
                  <span>{ui("قنصلية:")}<b>{cust.consulateRecords.length}</b></span>
                  <span>·</span>
                  <span>{ui("طيران:")}<b>{cust.flightRecords.length}</b></span>
                  <span>·</span>
                  <span>{ui("فواتير:")}<b>{cust.invoices.length}</b></span>
                </div>

                {/* Per-currency summary */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  {cust.currencies.map((curr) => {
                    const t = cust.totalsByCurrency[curr];
                    return (
                      <div
                        key={curr}
                        className="flex items-center justify-between text-xs bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#D7E7F7]"
                      >
                        <span className="font-bold text-[#0B2E57]">
                          {curr}
                        </span>
                        <div className="flex items-center gap-3 font-mono text-[11px]" dir="ltr">
                          <span className="text-[#5E7086]">
                            Total: {formatMinorMoney(t.billedMinor, curr)}
                          </span>
                          <span
                            className={`font-black ${
                              t.outstandingMinor > 0 ? 'text-rose-700' : 'text-emerald-700'
                            }`}
                          >
                            Due: {formatMinorMoney(t.outstandingMinor, curr)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Required 3 Main Customer Billing Actions */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setActiveInvoiceId(null);
                    handleSelectExistingCustomerInEditor(cust.customerId);
                    setEditorLines([
                      {
                        id: `line-${Date.now()}`,
                        sourceTransactionId: null,
                        sourceType: 'custom',
                        serviceReference: '',
                        labelAr: '',
                        labelEn: '',
                        quantity: 1,
                        unitPriceMajor: 0,
                        discountMajor: 0,
                        taxRatePercent: Math.round((documentSettings.defaultTaxRate || 0) * 100),
                      },
                    ]);
                    setInvoiceSubView('invoice_editor');
                  }}
                  className="py-2 px-2 rounded-xl bg-[#004AA5] hover:bg-[#0B2E57] text-white text-[11px] font-bold transition text-center cursor-pointer"
                >{ui("إنشاء فاتورة")}</button>

                <button
                  type="button"
                  onClick={() => {
                    setListCustomerFilter(cust.customerId);
                    setInvoiceSubView('invoices_list');
                  }}
                  className="py-2 px-2 rounded-xl bg-[#eaf4ff] hover:bg-[#004AA5] text-[#0B2E57] hover:text-white text-[11px] font-bold transition text-center cursor-pointer"
                >{ui("فواتير العميل (")}{cust.invoices.length})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomerIdForStatement(cust.customerId);
                    setInvoiceSubView('customer_statement');
                  }}
                  className="py-2 px-2 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white text-[11px] font-bold transition text-center cursor-pointer"
                >{ui("طباعة كشف الحساب")}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================
          SUB-VIEW C: INVOICE EDITOR (محرر الفواتير وإنشاء فاتورة لعميل محدد)
         ======================================================================== */}
      {invoiceSubView === 'invoice_editor' && (
        <div className="bg-white rounded-2xl border border-[#D7E7F7] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D7E7F7] pb-4">
            <div>
              <h3 className="text-base font-black text-[#0B2E57]">
                {editingInvoiceObj
                  ? `تعديل مسودة الفاتورة (${editingInvoiceObj.invoiceNumber})`
                  : ui("إعداد وإصدار فاتورة لعميل محدد")}
              </h3>
              <p className="text-xs text-[#5E7086]">{ui("اختر العميل، ثم أضف معاملاته غير المفوترة تلقائياً أو أدخل بنود الخدمة يدوياً")}</p>
            </div>

            <details className="ws-demo-options">
              <summary>{ui('أدوات المعاينة التجريبية')}</summary>
              <div className="flex flex-wrap items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => handlePopulateDemoQA(10)}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{ui("تجربة 10 بنود (DEMO QA)")}</span>
              </button>
              <button
                type="button"
                onClick={() => handlePopulateDemoQA(100)}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{ui("تجربة 100 بند (A4 Multi-Page QA)")}</span>
              </button>
              </div>
            </details>
          </div>

          {/* Step 1: Select Customer & Document Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0B2E57] mb-1">{ui("اختيار عميل مسجل في النظام")}</label>
              <select
                value={editorCustomerKey}
                onChange={(e) => handleSelectExistingCustomerInEditor(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 text-xs font-bold text-[#0B2E57] focus:outline-none"
              >
                <option value="">{ui("-- اختر من قائمة العملاء أو اكتب بالأسفل --")}</option>
                {customerProfiles.map((c) => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.clientName} ({c.phoneNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B2E57] mb-1">{ui("اسم العميل (إلزامي) *")}</label>
              <input
                type="text"
                value={editorCustomerName}
                onChange={(e) => setEditorCustomerName(e.target.value)}
                placeholder={ui("الاسم الكامل للعميل...")}
                className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 text-xs font-bold text-[#0B2E57] focus:bg-white focus:border-[#004AA5] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B2E57] mb-1">{ui("رقم الهاتف / واتساب")}</label>
              <input
                type="text"
                dir="ltr"
                value={editorCustomerPhone}
                onChange={(e) => setEditorCustomerPhone(e.target.value)}
                placeholder="+905..."
                className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0B2E57] focus:bg-white focus:border-[#004AA5] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B2E57] mb-1">{ui("تصنيف المستند (Document Classification)")}</label>
              <select
                value={editorClassification}
                onChange={(e) => setEditorClassification(e.target.value as DocumentClassification)}
                className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 text-xs font-bold text-[#0B2E57] focus:outline-none"
              >
                <option value="invoice">{ui("فاتورة خدمات (Invoice)")}</option>
                <option value="pro_forma">{ui("فاتورة أولية / عرض سعر (Pro Forma)")}</option>
                <option value="payment_receipt">{ui("إيصال دفع واستلام (Payment Receipt)")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B2E57] mb-1">{ui("عملة الفاتورة (Currency)")}</label>
              <select
                value={editorCurrency}
                onChange={(e) => setEditorCurrency(e.target.value as SupportedCurrency)}
                className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 text-xs font-bold text-[#0B2E57] focus:outline-none"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {ui(c.label)} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#0B2E57] mb-1">{ui("تاريخ الإصدار")}</label>
                <input
                  type="date"
                  value={editorIssueDate}
                  onChange={(e) => setEditorIssueDate(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-[#0B2E57]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B2E57] mb-1">{ui("تاريخ الاستحقاق")}</label>
                <input
                  type="date"
                  value={editorDueDate}
                  onChange={(e) => setEditorDueDate(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-[#0B2E57]"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Eligible Uninvoiced CRM Transactions for this Customer */}
          {eligibleCustomerTransactions.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#eaf4ff]/70 border border-[#004AA5]/30 space-y-2.5">
              <div className="text-xs font-black text-[#0B2E57]">{ui("معاملات مسجلة لهذا العميل غير مفوترة بعد (انقر لإدراجها في الفاتورة ومنع الفوترة المزدوجة):")}</div>
              <div className="flex flex-wrap gap-2">
                {eligibleCustomerTransactions.map((tx) => (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => handleAppendEligibleTransactionToEditor(tx)}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-[#004AA5] text-[#0B2E57] hover:text-white border border-[#D7E7F7] text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#004AA5]" />
                    <span>{tx.title}</span>
                    <span className="font-mono text-[11px] opacity-80" dir="ltr">
                      ({tx.amount} {tx.currency})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Editable Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[#0B2E57]">{ui("بنود الفاتورة وتفاصيل التسعير (")}{editorLines.length} {ui("بند)")}</h4>
              <button
                type="button"
                onClick={() =>
                  setEditorLines([
                    ...editorLines,
                    {
                      id: `line-${Date.now()}`,
                      sourceTransactionId: null,
                      sourceType: 'custom',
                      serviceReference: '',
                      labelAr: '',
                      labelEn: '',
                      quantity: 1,
                      unitPriceMajor: 0,
                      discountMajor: 0,
                      taxRatePercent: Math.round((documentSettings.defaultTaxRate || 0) * 100),
                    },
                  ])
                }
                className="px-3 py-1.5 rounded-xl bg-[#eaf4ff] hover:bg-[#004AA5] text-[#0B2E57] hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{ui("إضافة بند جديد")}</span>
              </button>
            </div>

            <div className="border border-[#D7E7F7] rounded-2xl overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] text-[#0B2E57] border-b border-[#D7E7F7] font-bold">
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">{ui("بيان الخدمة (عربي / إنجليزي اختياري)")}</th>
                    <th className="py-2.5 px-3 w-28">{ui("المرجع / PNR")}</th>
                    <th className="py-2.5 px-3 w-20 text-center">{ui("الكمية")}</th>
                    <th className="py-2.5 px-3 w-28">{ui("سعر الوحدة")}</th>
                    <th className="py-2.5 px-3 w-24">{ui("الخصم")}</th>
                    <th className="py-2.5 px-3 w-20">{ui("الضريبة %")}</th>
                    <th className="py-2.5 px-3 w-28 text-left">{ui("صافي البند")}</th>
                    <th className="py-2.5 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7E7F7]">
                  {editorLines.map((line, index) => {
                    const computed = calculateInvoiceLine({
                      id: line.id,
                      invoiceId: 'preview',
                      labelAr: line.labelAr,
                      quantity: line.quantity,
                      unitPriceMinor: toMinorUnits(line.unitPriceMajor),
                      discountMinor: toMinorUnits(line.discountMajor),
                      taxRate: (Number(line.taxRatePercent) || 0) / 100,
                      sortOrder: index + 1,
                    });

                    return (
                      <tr key={line.id}>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-[#5E7086]">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-3 space-y-1">
                          <input
                            type="text"
                            value={line.labelAr}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditorLines((prev) =>
                                prev.map((l) => (l.id === line.id ? { ...l, labelAr: val } : l))
                              );
                            }}
                            placeholder={ui("وصف الخدمة بالعربية...")}
                            className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0B2E57]"
                          />
                          <input
                            type="text"
                            dir="ltr"
                            value={line.labelEn}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditorLines((prev) =>
                                prev.map((l) => (l.id === line.id ? { ...l, labelEn: val } : l))
                              );
                            }}
                            placeholder="Optional English description..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-[#5E7086]"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            dir="ltr"
                            value={line.serviceReference || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditorLines((prev) =>
                                prev.map((l) =>
                                  l.id === line.id ? { ...l, serviceReference: val } : l
                                )
                              );
                            }}
                            placeholder="PNR / Ref"
                            className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-lg px-2 py-1.5 text-xs font-mono text-center"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min={1}
                            dir="ltr"
                            value={line.quantity}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value) || 1);
                              setEditorLines((prev) =>
                                prev.map((l) => (l.id === line.id ? { ...l, quantity: val } : l))
                              );
                            }}
                            className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-center"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            dir="ltr"
                            value={line.unitPriceMajor}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setEditorLines((prev) =>
                                prev.map((l) =>
                                  l.id === line.id ? { ...l, unitPriceMajor: val } : l
                                )
                              );
                            }}
                            className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-lg px-2 py-1.5 text-xs font-mono font-bold"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            dir="ltr"
                            value={line.discountMajor}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setEditorLines((prev) =>
                                prev.map((l) =>
                                  l.id === line.id ? { ...l, discountMajor: val } : l
                                )
                              );
                            }}
                            className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-lg px-2 py-1.5 text-xs font-mono"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            dir="ltr"
                            value={line.taxRatePercent}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setEditorLines((prev) =>
                                prev.map((l) =>
                                  l.id === line.id ? { ...l, taxRatePercent: val } : l
                                )
                              );
                            }}
                            className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-lg px-2 py-1.5 text-xs font-mono text-center"
                          />
                        </td>
                        <td
                          className="py-2.5 px-3 text-left font-mono font-black text-[#0B2E57]"
                          dir="ltr"
                        >
                          {formatMinorMoney(computed.totalMinor, editorCurrency)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          {editorLines.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditorLines((prev) => prev.filter((l) => l.id !== line.id))
                              }
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 4: Payment & Canonical Summary Preview */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
            <div className="md:col-span-7 space-y-3">
              {!editingInvoiceObj && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F8FAFC] border border-[#D7E7F7]">
                  <div>
                    <label className="block text-xs font-bold text-[#0B2E57] mb-1">{ui("المبلغ المدفوع مقدماً عند الإصدار (")}{editorCurrency})
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      dir="ltr"
                      value={editorInitialPaidMajor}
                      onChange={(e) =>
                        setEditorInitialPaidMajor(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="w-full bg-white border border-[#D7E7F7] rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#0B2E57] mb-1">{ui("طريقة الدفع")}</label>
                    <select
                      value={editorPaymentMethod}
                      onChange={(e) => setEditorPaymentMethod(e.target.value)}
                      className="w-full bg-white border border-[#D7E7F7] rounded-xl px-3 py-2 text-xs font-bold text-[#0B2E57]"
                    >
                      {systemLists.paymentMethods.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#0B2E57] mb-1">{ui("ملاحظات الفاتورة وشروط السداد")}</label>
                <textarea
                  rows={2}
                  value={editorNotes}
                  onChange={(e) => setEditorNotes(e.target.value)}
                  placeholder={ui("أضف أي ملاحظات تظهر للعميل أسفل الفاتورة...")}
                  className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl p-3 text-xs text-[#0B2E57]"
                />
              </div>
            </div>

            <div className="md:col-span-5 p-4 rounded-2xl bg-[#eaf4ff]/70 border border-[#004AA5]/30 space-y-2.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#5E7086] font-semibold">{ui("المجموع قبل الضريبة:")}</span>
                <span className="font-mono font-bold text-[#0B2E57]" dir="ltr">
                  {formatMinorMoney(editorPreviewTotals.subtotalMinor, editorCurrency)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#5E7086] font-semibold">{ui("خصم إضافي على الفاتورة:")}</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  dir="ltr"
                  value={editorDocDiscountMajor}
                  onChange={(e) =>
                    setEditorDocDiscountMajor(Math.max(0, Number(e.target.value) || 0))
                  }
                  className="w-28 bg-white border border-[#D7E7F7] rounded-lg px-2 py-1 text-xs font-mono text-left"
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#5E7086] font-semibold">{ui("إجمالي الضرائب:")}</span>
                <span className="font-mono font-bold text-[#0B2E57]" dir="ltr">
                  {formatMinorMoney(editorPreviewTotals.taxTotalMinor, editorCurrency)}
                </span>
              </div>
              <div className="border-t border-[#0B2E57]/20 pt-2 flex justify-between text-sm font-black text-[#0B2E57]">
                <span>{ui("الإجمالي الكلي للفاتورة:")}</span>
                <span className="font-mono" dir="ltr">
                  {formatMinorMoney(editorPreviewTotals.totalMinor, editorCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-emerald-700 font-bold">
                <span>{ui("المبلغ المدفوع:")}</span>
                <span className="font-mono" dir="ltr">
                  {formatMinorMoney(editorPreviewTotals.paidMinor, editorCurrency)}
                </span>
              </div>
              <div className="border-t-2 border-[#0B2E57] pt-2 flex justify-between text-sm font-black">
                <span>{ui("الرصيد المتبقي المستحق:")}</span>
                <span
                  className={`font-mono ${
                    editorPreviewTotals.balanceDueMinor > 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                  dir="ltr"
                >
                  {formatMinorMoney(editorPreviewTotals.balanceDueMinor, editorCurrency)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => handleSaveOrIssueFromEditor(false)}
                  className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-[#0B2E57] border border-[#D7E7F7] text-xs font-bold transition cursor-pointer"
                >{ui("حفظ كمسودة (Draft)")}</button>
                <button
                  type="button"
                  onClick={() => handleSaveOrIssueFromEditor(true)}
                  className="py-2.5 px-3 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white text-xs font-black transition cursor-pointer shadow-sm"
                >{ui("إصدار واعتماد الفاتورة")}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          SUB-VIEW D: INVOICE DETAIL & AUDIT TRAIL (تفاصيل الفاتورة والدفعات)
         ======================================================================== */}
      {invoiceSubView === 'invoice_detail' && editingInvoiceObj && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-[#D7E7F7] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setInvoiceSubView('invoices_list')}
                className="p-2 rounded-xl bg-[#F8FAFC] hover:bg-[#eaf4ff] text-[#0B2E57] border border-[#D7E7F7] cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-black text-[#0B2E57]" dir="ltr">
                    #{editingInvoiceObj.invoiceNumber}
                  </h3>
                  {renderStatusPill(editingInvoiceObj.status)}
                </div>
                <p className="text-xs text-[#5E7086]">{ui("العميل:")}<b>{editingInvoiceObj.customerName}</b>{ui("• تاريخ الإصدار:")}{' '}
                  <span className="font-mono" dir="ltr">
                    {editingInvoiceObj.issueDate}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {editingInvoiceObj.status === 'draft' && (
                <>
                  <button
                    type="button"
                    onClick={() => setInvoiceSubView('invoice_editor')}
                    className="px-3.5 py-2 rounded-xl bg-[#eaf4ff] text-[#0B2E57] text-xs font-bold cursor-pointer"
                  >{ui("تعديل المسودة")}</button>
                  <button
                    type="button"
                    onClick={() => {
                      const res = issueDraftInvoice(editingInvoiceObj.id, actorName);
                      setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >{ui("اعتماد وإصدار الفاتورة رسمياً")}</button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerIdForStatement(editingInvoiceObj.customerId);
                  setInvoiceSubView('customer_statement');
                }}
                className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] hover:bg-[#eaf4ff] text-[#0B2E57] border border-[#D7E7F7] text-xs font-bold cursor-pointer"
              >{ui("كشف حساب هذا العميل")}</button>

              <button
                type="button"
                onClick={() =>
                  setPrintPreviewTarget({
                    type: 'invoice',
                    invoiceId: editingInvoiceObj.id,
                    isDemoMode: editingInvoiceObj.isDemoRecord,
                  })
                }
                className="px-4 py-2 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-[#CC9048]" />
                <span>{ui("معاينة الطباعة A4 / تنزيل PDF")}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Right 7 Cols: Line items & Audit History */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-white rounded-2xl border border-[#D7E7F7] p-5 space-y-3">
                <h4 className="text-sm font-black text-[#0B2E57]">{ui("بنود الفاتورة المعتمدة")}</h4>
                <div className="border border-[#D7E7F7] rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-[#0B2E57] text-white font-bold">
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">{ui("الخدمة")}</th>
                        <th className="py-2 px-3 text-center">{ui("الكمية")}</th>
                        <th className="py-2 px-3 text-left">{ui("السعر")}</th>
                        <th className="py-2 px-3 text-left">{ui("الإجمالي")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D7E7F7]">
                      {editingInvoiceObj.lines.map((l, i) => (
                        <tr key={l.id}>
                          <td className="py-2.5 px-3 font-mono">{i + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-[#0B2E57]">
                            {l.labelAr}
                            {l.serviceReference && (
                              <span className="mr-2 font-mono text-[11px] text-[#004AA5]" dir="ltr">
                                [{l.serviceReference}]
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono" dir="ltr">
                            {l.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono" dir="ltr">
                            {formatMinorMoney(l.unitPriceMinor, editingInvoiceObj.currency)}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono font-black" dir="ltr">
                            {formatMinorMoney(l.totalMinor, editingInvoiceObj.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Trail */}
              <div className="bg-white rounded-2xl border border-[#D7E7F7] p-5 space-y-3">
                <h4 className="text-sm font-black text-[#0B2E57]">{ui("سجل التدقيق والعمليات (Immutable Audit Trail)")}</h4>
                <div className="space-y-2">
                  {editingInvoiceObj.auditEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 rounded-xl bg-[#F8FAFC] border border-[#D7E7F7] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#0B2E57]">{evt.details}</span>
                        <span className="text-[#5E7086] mr-2">{ui("بواسطة @")}{evt.actor}</span>
                      </div>
                      <span className="font-mono text-[11px] text-[#5E7086]" dir="ltr">
                        {new Date(evt.timestamp).toLocaleString('en-GB')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Left 5 Cols: Record Payment, Add Credit Note, Void Invoice */}
            <div className="lg:col-span-5 space-y-5">
              {/* Summary Card */}
              <div className="bg-[#eaf4ff]/70 rounded-2xl border border-[#004AA5]/30 p-5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#5E7086] font-bold">{ui("إجمالي الفاتورة:")}</span>
                  <span className="font-mono font-black text-sm text-[#0B2E57]" dir="ltr">
                    {formatMinorMoney(editingInvoiceObj.totalMinor, editingInvoiceObj.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>{ui("إجمالي المقبوضات:")}</span>
                  <span className="font-mono" dir="ltr">
                    {formatMinorMoney(editingInvoiceObj.paidMinor, editingInvoiceObj.currency)}
                  </span>
                </div>
                {editingInvoiceObj.creditedMinor > 0 && (
                  <div className="flex justify-between text-amber-800 font-bold">
                    <span>{ui("إجمالي الإشعارات الدائنة:")}</span>
                    <span className="font-mono" dir="ltr">
                      -{formatMinorMoney(editingInvoiceObj.creditedMinor, editingInvoiceObj.currency)}
                    </span>
                  </div>
                )}
                <div className="border-t-2 border-[#0B2E57] pt-2 flex justify-between text-sm font-black">
                  <span>{ui("المتبقي المستحق:")}</span>
                  <span
                    className={`font-mono ${
                      editingInvoiceObj.balanceDueMinor > 0 ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                    dir="ltr"
                  >
                    {formatMinorMoney(editingInvoiceObj.balanceDueMinor, editingInvoiceObj.currency)}
                  </span>
                </div>

                {/* Official Stamp & Signatory Verification on Invoice Detail */}
                <div className="mt-3 pt-3 border-t border-[#004AA5]/25 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-[#0B2E57]">{ui("الختم والاعتماد الرسمي للمؤسسة")}</div>
                    <p className="text-[11px] text-[#5E7086] mt-0.5">{ui("معتمد للطباعة والتنزيل بصيغة PDF (A4)")}</p>
                  </div>
                  <FazniOfficialSeal size={95} rotate={true} />
                </div>
              </div>

              {/* Record New Payment Box */}
              {editingInvoiceObj.status !== 'void' && editingInvoiceObj.balanceDueMinor > 0 && (
                <div className="bg-white rounded-2xl border border-[#D7E7F7] p-5 space-y-3">
                  <h4 className="text-xs font-black text-[#0B2E57]">{ui("تسجيل دفعة جديدة على الفاتورة (")}{editingInvoiceObj.currency})
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-[#5E7086] mb-1">{ui("المبلغ المستلم")}</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        dir="ltr"
                        value={newPaymentAmountMajor || ''}
                        onChange={(e) => setNewPaymentAmountMajor(Number(e.target.value) || 0)}
                        placeholder={String(fromMinorUnits(editingInvoiceObj.balanceDueMinor))}
                        className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5E7086] mb-1">{ui("طريقة الدفع")}</label>
                      <select
                        value={newPaymentMethod}
                        onChange={(e) => setNewPaymentMethod(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-2.5 py-1.5 text-xs font-bold"
                      >
                        {systemLists.paymentMethods.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5E7086] mb-1">{ui("تاريخ الاستلام")}</label>
                      <input
                        type="date"
                        value={newPaymentDate}
                        onChange={(e) => setNewPaymentDate(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5E7086] mb-1">{ui("رقم الإيصال المرجعي")}</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={newPaymentRef}
                        onChange={(e) => setNewPaymentRef(e.target.value)}
                        placeholder="RCPT-..."
                        className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const res = recordInvoicePayment(
                          editingInvoiceObj.id,
                          {
                            amountMinor: toMinorUnits(
                              newPaymentAmountMajor || fromMinorUnits(editingInvoiceObj.balanceDueMinor)
                            ),
                            method: newPaymentMethod,
                            receivedAt: newPaymentDate,
                            externalReference: newPaymentRef,
                          },
                          actorName
                        );
                        setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
                        setNewPaymentAmountMajor(0);
                      }}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                    >{ui("تأكيد تسجيل الدفعة")}</button>
                  </div>
                </div>
              )}

              {/* Credit Note / Adjustment Box */}
              {canViewAccounting &&
                editingInvoiceObj.status !== 'void' &&
                editingInvoiceObj.status !== 'draft' &&
                editingInvoiceObj.balanceDueMinor > 0 && (
                  <div className="bg-white rounded-2xl border border-[#D7E7F7] p-5 space-y-3">
                    <h4 className="text-xs font-black text-amber-900">{ui("إصدار إشعار دائن / تسوية محاسبية (Credit Note)")}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        value={creditNoteReason}
                        onChange={(e) => setCreditNoteReason(e.target.value)}
                        placeholder={ui("سبب التسوية أو الخصم اللاحق...")}
                        className="bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-1.5 text-xs font-semibold"
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        dir="ltr"
                        value={creditNoteAmountMajor || ''}
                        onChange={(e) => setCreditNoteAmountMajor(Number(e.target.value) || 0)}
                        placeholder={`المبلغ (${editingInvoiceObj.currency})`}
                        className="bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const res = addInvoiceCreditNote(
                          editingInvoiceObj.id,
                          {
                            reason: creditNoteReason,
                            amountMinor: toMinorUnits(creditNoteAmountMajor),
                            issuedAt: new Date().toISOString().slice(0, 10),
                          },
                          actorName
                        );
                        setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
                        if (res.success) {
                          setCreditNoteReason('');
                          setCreditNoteAmountMajor(0);
                        }
                      }}
                      className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
                    >{ui("اعتماد الإشعار الدائن")}</button>
                  </div>
                )}

              {/* Void Invoice Box */}
              {canViewAccounting && editingInvoiceObj.status !== 'void' && (
                <div className="bg-rose-50/50 rounded-2xl border border-rose-200 p-4 space-y-2.5">
                  <h4 className="text-xs font-black text-rose-900">{ui("إلغاء الفاتورة رسمياً مع حفظ الأثر (Void Invoice)")}</h4>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voidReasonInput}
                      onChange={(e) => setVoidReasonInput(e.target.value)}
                      placeholder={ui("اكتب سبب الإلغاء لتوثيقه في سجل التدقيق...")}
                      className="flex-1 bg-white border border-rose-200 rounded-xl px-3 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const res = voidInvoice(editingInvoiceObj.id, voidReasonInput, actorName);
                        setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
                        if (res.success) setVoidReasonInput('');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer shrink-0"
                    >{ui("إلغاء (Void)")}</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          SUB-VIEW E: CUSTOMER ACCOUNT STATEMENT (كشف حساب عميل)
         ======================================================================== */}
      {invoiceSubView === 'customer_statement' && (
        <div className="space-y-5">
          {/* Statement Filter Controls */}
          <div className="bg-white rounded-2xl border border-[#D7E7F7] p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D7E7F7] pb-3">
              <div>
                <h3 className="text-base font-black text-[#0B2E57]">{ui("كشف حساب عميل مفصل (Customer Account Statement)")}</h3>
                <p className="text-xs text-[#5E7086]">{ui("يعرض الرصيد الافتتاحي، حركات المدين والدائن، والرصيد التراكمي والختامي لعميل واحد محدد (وليس فاتورة جديدة).")}</p>
              </div>

              {activeStatementCustomer && (
                <button
                  type="button"
                  onClick={() =>
                    setPrintPreviewTarget({
                      type: 'statement',
                      customerId: activeStatementCustomer.customerId,
                      currency: stmtCurrency,
                      fromDate: stmtFromDate,
                      toDate: stmtToDate,
                    })
                  }
                  className="px-4 py-2.5 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
                >
                  <Printer className="w-4 h-4 text-[#CC9048]" />
                  <span>{ui("معاينة وطباعة كشف الحساب A4 / PDF")}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0B2E57] mb-1">{ui("العميل")}</label>
                <select
                  value={activeStatementCustomer?.customerId || ''}
                  onChange={(e) => setSelectedCustomerIdForStatement(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 text-xs font-bold text-[#0B2E57]"
                >
                  {customerProfiles.map((c) => (
                    <option key={c.customerId} value={c.customerId}>
                      {c.clientName} ({c.phoneNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B2E57] mb-1">{ui("العملة")}</label>
                <select
                  value={stmtCurrency}
                  onChange={(e) => setStmtCurrency(e.target.value as SupportedCurrency)}
                  className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 text-xs font-bold text-[#0B2E57]"
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {ui(c.label)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B2E57] mb-1">{ui("من تاريخ (اختياري — لحساب الرصيد الافتتاحي)")}</label>
                <input
                  type="date"
                  value={stmtFromDate}
                  onChange={(e) => setStmtFromDate(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0B2E57]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B2E57] mb-1">{ui("إلى تاريخ (اختياري)")}</label>
                <div className="flex gap-1.5">
                  <input
                    type="date"
                    value={stmtToDate}
                    onChange={(e) => setStmtToDate(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#0B2E57]"
                  />
                  {(stmtFromDate || stmtToDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStmtFromDate('');
                        setStmtToDate('');
                      }}
                      title={ui("عرض كل التواريخ")}
                      className="px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                    >{ui("الكل")}</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Live Statement Preview */}
          {liveStatementResult && (
            <div className="bg-white rounded-2xl border border-[#D7E7F7] p-5 shadow-xs space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#D7E7F7]">
                  <div className="text-xs font-bold text-[#5E7086]">{ui("الرصيد الافتتاحي (Opening)")}</div>
                  <div className="text-base font-mono font-black text-[#0B2E57] mt-1" dir="ltr">
                    {formatMinorMoney(liveStatementResult.openingBalanceMinor, stmtCurrency)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-[#D7E7F7]">
                  <div className="text-xs font-bold text-[#5E7086]">{ui("إجمالي المدين للفترة (Debit)")}</div>
                  <div className="text-base font-mono font-black text-[#0B2E57] mt-1" dir="ltr">
                    {formatMinorMoney(liveStatementResult.periodDebitMinor, stmtCurrency)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-800">{ui("إجمالي الدائن / المدفوع (Credit)")}</div>
                  <div className="text-base font-mono font-black text-emerald-700 mt-1" dir="ltr">
                    {formatMinorMoney(liveStatementResult.periodCreditMinor, stmtCurrency)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#eaf4ff] border-2 border-[#0B2E57]">
                  <div className="text-xs font-black text-[#0B2E57]">{ui("الرصيد الختامي المستحق (Closing)")}</div>
                  <div
                    className={`text-base font-mono font-black mt-1 ${
                      liveStatementResult.closingBalanceMinor > 0 ? 'text-rose-700' : 'text-emerald-700'
                    }`}
                    dir="ltr"
                  >
                    {formatMinorMoney(liveStatementResult.closingBalanceMinor, stmtCurrency)}
                  </div>
                </div>
              </div>

              <div className="border border-[#D7E7F7] rounded-xl overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-[#0B2E57] text-white font-bold">
                      <th className="py-2.5 px-3">{ui("التاريخ")}</th>
                      <th className="py-2.5 px-3">{ui("رقم المرجع")}</th>
                      <th className="py-2.5 px-3">{ui("نوع الحركة")}</th>
                      <th className="py-2.5 px-3">{ui("البيان والتفاصيل")}</th>
                      <th className="py-2.5 px-3 text-left">{ui("مدين (Debit)")}</th>
                      <th className="py-2.5 px-3 text-left">{ui("دائن (Credit)")}</th>
                      <th className="py-2.5 px-3 text-left">{ui("الرصيد التراكمي")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D7E7F7]">
                    <tr className="bg-[#F8FAFC] font-bold text-[#5E7086]">
                      <td className="py-2.5 px-3 font-mono" dir="ltr">
                        {stmtFromDate || '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono" dir="ltr">{ui("OPENING")}</td>
                      <td className="py-2.5 px-3">{ui("رصيد افتتاحي")}</td>
                      <td className="py-2.5 px-3">{ui("الرصيد السابق قبل الفترة المحددة")}</td>
                      <td className="py-2.5 px-3 text-left font-mono" dir="ltr">—</td>
                      <td className="py-2.5 px-3 text-left font-mono" dir="ltr">—</td>
                      <td className="py-2.5 px-3 text-left font-mono font-black text-[#0B2E57]" dir="ltr">
                        {formatMinorMoney(liveStatementResult.openingBalanceMinor, stmtCurrency)}
                      </td>
                    </tr>

                    {liveStatementResult.entries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#5E7086]">{ui("لا توجد حركات مسجلة لهذا العميل بعملة (")}{stmtCurrency} {ui(") في هذه الفترة.")}</td>
                      </tr>
                    ) : (
                      liveStatementResult.entries.map((e) => (
                        <tr key={e.id} className="hover:bg-[#eaf4ff]/30">
                          <td className="py-2.5 px-3 font-mono" dir="ltr">
                            {e.date}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#004AA5]" dir="ltr">
                            {e.referenceNumber}
                          </td>
                          <td className="py-2.5 px-3 font-semibold">{e.entryTypeLabelAr}</td>
                          <td className="py-2.5 px-3 font-bold text-[#0B2E57]">{e.description}</td>
                          <td className="py-2.5 px-3 text-left font-mono font-bold" dir="ltr">
                            {e.debitMinor > 0 ? formatMinorMoney(e.debitMinor, stmtCurrency) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono font-bold text-emerald-700" dir="ltr">
                            {e.creditMinor > 0 ? formatMinorMoney(e.creditMinor, stmtCurrency) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono font-black text-[#0B2E57]" dir="ltr">
                            {formatMinorMoney(e.runningBalanceMinor, stmtCurrency)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Official Stamp & Signatory Verification Footer on Live Statement */}
              <div className="pt-4 border-t border-[#D7E7F7] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#F8FAFC] p-4 rounded-xl">
                <div className="text-right">
                  <div className="text-xs font-black text-[#0B2E57]">{ui("مصادقة واعتماد كشف الحساب — الفزني للخدمات إسطنبول (ELFAZNI SERVICES ISTANBUL)")}</div>
                  <p className="text-[11px] text-[#5E7086] mt-0.5">{ui("يظهر هذا الختم الرسمي تلقائياً عند طباعة كشف الحساب بصيغة A4 أو حفظه كملف PDF.")}</p>
                </div>
                <FazniOfficialSeal size={95} rotate={true} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================
          SUB-VIEW F: ALL-CUSTOMER FINANCIAL REPORT (تقرير جميع الحسابات)
         ======================================================================== */}
      {invoiceSubView === 'all_accounts_report' && canViewAccounting && (
        <div className="bg-white rounded-2xl border border-[#D7E7F7] p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D7E7F7] pb-4">
            <div>
              <h3 className="text-base font-black text-[#0B2E57]">{ui("التقرير المالي الشامل لجميع حسابات العملاء (All-Accounts Consolidated Report)")}</h3>
              <p className="text-xs text-[#5E7086]">{ui("تقرير محاسبي مجمع حسب العملة ولكل عميل على حدة — مخصص للإدارة والمحاسبة فقط.")}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const headers = [
                    'معرف العميل',
                    'اسم العميل',
                    'الهاتف',
                    'العملة',
                    'إجمالي المفوتر',
                    'إجمالي المدفوع',
                    'الإشعارات الدائنة',
                    'الرصيد المتبقي المستحق',
                  ];
                  const rows: (string | number)[][] = [];
                  customerProfiles.forEach((c) => {
                    c.currencies.forEach((curr) => {
                      const t = c.totalsByCurrency[curr];
                      rows.push([
                        c.customerId,
                        c.clientName,
                        c.phoneNumber,
                        curr,
                        fromMinorUnits(t.billedMinor),
                        fromMinorUnits(t.paidMinor),
                        fromMinorUnits(t.creditedMinor),
                        fromMinorUnits(t.outstandingMinor),
                      ]);
                    });
                  });
                  exportToCSV('ELFAZNI_All_Accounts_Financial_Report', headers, rows);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{ui("تصدير CSV / Excel")}</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintPreviewTarget({ type: 'all_accounts_report' })}
                className="px-4 py-2 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#CC9048]" />
                <span>{ui("طباعة التقرير الشامل A4 / PDF")}</span>
              </button>
            </div>
          </div>

          <div className="border border-[#D7E7F7] rounded-xl overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-[#0B2E57] text-white font-bold">
                  <th className="py-3 px-3">{ui("العميل")}</th>
                  <th className="py-3 px-3">{ui("الهاتف")}</th>
                  <th className="py-3 px-3 text-center">{ui("العملة")}</th>
                  <th className="py-3 px-3 text-left">{ui("إجمالي المفوتر")}</th>
                  <th className="py-3 px-3 text-left">{ui("إجمالي المقبوض")}</th>
                  <th className="py-3 px-3 text-left">{ui("إشعارات دائنة")}</th>
                  <th className="py-3 px-3 text-left">{ui("الرصيد المتبقي")}</th>
                  <th className="py-3 px-3 text-center">{ui("إجراءات سريعة")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D7E7F7]">
                {customerProfiles.flatMap((cust) =>
                  cust.currencies.map((curr) => {
                    const t = cust.totalsByCurrency[curr];
                    return (
                      <tr key={`${cust.customerId}-${curr}`} className="hover:bg-[#eaf4ff]/40">
                        <td className="py-2.5 px-3 font-bold text-[#0B2E57]">{cust.clientName}</td>
                        <td className="py-2.5 px-3 font-mono text-[#5E7086]" dir="ltr">
                          {cust.phoneNumber}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-[#004AA5]" dir="ltr">
                          {curr}
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono font-bold" dir="ltr">
                          {formatMinorMoney(t.billedMinor, curr)}
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono font-bold text-emerald-700" dir="ltr">
                          {formatMinorMoney(t.paidMinor, curr)}
                        </td>
                        <td className="py-2.5 px-3 text-left font-mono text-amber-800" dir="ltr">
                          {t.creditedMinor > 0 ? formatMinorMoney(t.creditedMinor, curr) : '—'}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-left font-mono font-black ${
                            t.outstandingMinor > 0 ? 'text-rose-700' : 'text-slate-500'
                          }`}
                          dir="ltr"
                        >
                          {formatMinorMoney(t.outstandingMinor, curr)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomerIdForStatement(cust.customerId);
                              setStmtCurrency(curr);
                              setInvoiceSubView('customer_statement');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#eaf4ff] hover:bg-[#004AA5] text-[#0B2E57] hover:text-white text-[11px] font-bold transition cursor-pointer"
                          >{ui("كشف الحساب")}</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL 1: BULK ZIP CONFIRMATION DIALOG
         ======================================================================== */}
      {showBulkZipConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#D7E7F7] shadow-2xl space-y-4">
            <h3 className="text-base font-black text-[#0B2E57]">{ui("تأكيد تصدير أرشيف الفواتير المحددة (ZIP)")}</h3>
            <p className="text-xs text-[#5E7086] leading-relaxed">{ui("سيتم إنشاء ملف مضغوط")}<b>.ZIP</b>{ui("يحتوي على")}<b>({selectedInvoiceIds.length})</b>{ui("فاتورة مستقلة بصيغة A4 قابلة للطباعة مع ملف بيان مرجعي (Manifest)، دون دمج فواتير العملاء في فاتورة واحدة.")}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkZipConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-xs font-bold text-[#5E7086] cursor-pointer"
              >{ui("إلغاء")}</button>
              <button
                type="button"
                onClick={handleConfirmBulkZipDownload}
                className="px-4 py-2 rounded-xl bg-[#0B2E57] hover:bg-[#004AA5] text-white text-xs font-black cursor-pointer"
              >{ui("تأكيد وتنزيل الأرشيف (.ZIP)")}</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL 2: DOCUMENT & BRAND IDENTITY SETTINGS
         ======================================================================== */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-[#D7E7F7] shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#D7E7F7] pb-3">
              <h3 className="text-base font-black text-[#0B2E57]">{ui("إعدادات المستندات والهوية الرسمية للطباعة")}</h3>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-xs font-bold text-[#5E7086] hover:text-[#0B2E57] cursor-pointer"
              >{ui("إغلاق")}</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-[#0B2E57] mb-1">{ui("الاسم التجاري (عربي)")}</label>
                <input
                  type="text"
                  value={documentSettings.tradingNameAr}
                  onChange={(e) => updateDocumentSettings({ tradingNameAr: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#0B2E57] mb-1">{ui("الاسم القانوني / البديل")}</label>
                <input
                  type="text"
                  value={documentSettings.legalEntityName}
                  onChange={(e) => updateDocumentSettings({ legalEntityName: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#0B2E57] mb-1">{ui("الرقم الضريبي (اختياري — يترك فارغاً إن لم يتوفر)")}</label>
                <input
                  type="text"
                  dir="ltr"
                  value={documentSettings.taxId || ''}
                  onChange={(e) => updateDocumentSettings({ taxId: e.target.value })}
                  placeholder="Optional Tax ID"
                  className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-[#0B2E57] mb-1">{ui("بادئة ترقيم الفواتير (Invoice Prefix)")}</label>
                <input
                  type="text"
                  dir="ltr"
                  value={documentSettings.invoicePrefix}
                  onChange={(e) => updateDocumentSettings({ invoicePrefix: e.target.value })}
                  className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-[#0B2E57] mb-1">{ui("نمط الشعار المعتمد")}</label>
                <select
                  value={documentSettings.logoVariant}
                  onChange={(e) =>
                    updateDocumentSettings({ logoVariant: e.target.value as 'horizontal' | 'vertical' })
                  }
                  className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 font-bold"
                >
                  <option value="horizontal">{ui("شعار أفقي (logo-horizontal.svg)")}</option>
                  <option value="vertical">{ui("شعار عمودي (logo-vertical.svg)")}</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-[#0B2E57] mb-1">{ui("التصنيف الافتراضي للمستند")}</label>
                <select
                  value={documentSettings.defaultDocumentClassification}
                  onChange={(e) =>
                    updateDocumentSettings({
                      defaultDocumentClassification: e.target.value as DocumentClassification,
                    })
                  }
                  className="w-full bg-[#F8FAFC] border border-[#D7E7F7] rounded-xl px-3 py-2 font-bold"
                >
                  <option value="invoice">{ui("فاتورة خدمات (Invoice)")}</option>
                  <option value="pro_forma">{ui("فاتورة أولية (Pro Forma)")}</option>
                  <option value="payment_receipt">{ui("إيصال دفع (Payment Receipt)")}</option>
                </select>
              </div>
            </div>

            {/* Official Digital Stamp Control & Preview in DocumentSettings */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#D7E7F7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2.5 flex-1">
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <div className="text-xs font-black text-[#0B2E57]">{ui("الختم الرقمي الرسمي للمؤسسة (Official Digital Stamp — PDF & Print)")}</div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      documentSettings.showDigitalStamp !== false
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {documentSettings.showDigitalStamp !== false ? ui("مفعل (Active)") : ui("مخفي (Hidden)")}
                  </span>
                </div>
                <p className="text-[11px] text-[#5E7086] leading-relaxed">{ui("يُدرج الختم الرقمي الشفاف لمؤسسة الفزني للخدمات (ELFAZNI SERVICES) تلقائياً في زاوية المستند أو بجانب التوقيع المعتمد دون تغطية أي بيانات أو أرقام مالية.")}</p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-xl border border-[#D7E7F7] shadow-2xs">
                    <input
                      type="checkbox"
                      checked={documentSettings.showDigitalStamp !== false}
                      onChange={(e) =>
                        updateDocumentSettings({ showDigitalStamp: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#0B2E57] rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-[#0B2E57]">{ui("إظهار الختم الرقمي على الفواتير والمطبوعات")}</span>
                  </label>

                  {documentSettings.showDigitalStamp !== false && (
                    <select
                      value={documentSettings.digitalStampPosition || 'signature'}
                      onChange={(e) =>
                        updateDocumentSettings({
                          digitalStampPosition: e.target.value as 'signature' | 'bottom_corner',
                        })
                      }
                      className="bg-white border border-[#D7E7F7] rounded-xl px-3 py-1.5 text-xs font-bold text-[#0B2E57]"
                    >
                      <option value="signature">{ui("الموقع: بجانب التوقيع المعتمد (Next to Signature)")}</option>
                      <option value="bottom_corner">{ui("الموقع: زاوية المستند السفلية (Bottom Corner)")}</option>
                    </select>
                  )}
                </div>
              </div>

              <div
                className={`transition-opacity duration-200 ${
                  documentSettings.showDigitalStamp !== false ? 'opacity-100' : 'opacity-25 grayscale'
                }`}
              >
                <FazniOfficialSeal size={130} variant="badge" rotate={true} />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#D7E7F7]">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#0B2E57] text-white text-xs font-black cursor-pointer"
              >{ui("حفظ وإغلاق")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
