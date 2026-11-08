import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useCopy } from "../../i18n/useCopy";
import { CRMDialog } from "../common/CRMDialog";
import { SupportedCurrency } from "../../types";
import {
  contactBookId,
  manualDebtBalance,
  recordManualPayment,
} from "../../utils/contactBook";
import {
  toMinorUnits,
  fromMinorUnits,
  formatMinorMoney,
} from "../../utils/invoiceCalculations";
import { DebtDirection, ManualDebt } from "../../types/contactBook";
export function useContactFinanceAccess() {
  const { user, canViewAccounting } = useAuth();
  return (
    canViewAccounting &&
    (["super_admin", "admin", "accountant"].includes(user?.role || "") ||
      !!user?.canEditFinances)
  );
}
const today = () => new Date().toLocaleDateString("en-CA");
export const ManualDebtForm: React.FC<{
  contactId?: string;
  onClose: () => void;
}> = ({ contactId = "", onClose }) => {
  const { contactBook, setContactBook } = useApp(),
    { l } = useCopy(),
    allowed = useContactFinanceAccess();
  const [id, setId] = useState(contactId),
    [title, setTitle] = useState(""),
    [direction, setDirection] = useState<DebtDirection>("receivable"),
    [amount, setAmount] = useState(""),
    [currency, setCurrency] = useState<SupportedCurrency>("TRY"),
    [date, setDate] = useState(today),
    [due, setDue] = useState(""),
    [notes, setNotes] = useState(""),
    [reminder, setReminder] = useState(""),
    [error, setError] = useState("");
  if (!allowed) return null;
  return (
    <CRMDialog
      title={l(
        "تسجيل دين مستقل",
        "Record a standalone debt",
        "Enregistrer une dette indépendante",
      )}
      name="ManualDebtForm"
      onClose={onClose}
    >
      <form
        className="crm-book-form"
        onSubmit={(e) => {
          e.preventDefault();
          const minor = toMinorUnits(Number(amount));
          if (
            !title.trim() ||
            !contactBook.contacts.some((c) => c.id === id) ||
            !Number.isSafeInteger(minor) ||
            minor <= 0
          ) {
            setError(
              l(
                "اختر جهة اتصال وأدخل مبلغًا صالحًا.",
                "Choose a contact and enter a valid amount.",
                "Choisissez un contact et un montant valide.",
              ),
            );
            return;
          }
          const now = new Date().toISOString(),
            debtId = contactBookId();
          setContactBook((b) => ({
            ...b,
            manualDebts: [
              ...b.manualDebts,
              {
                id: debtId,
                contactId: id,
                direction,
                title: title.trim(),
                currency,
                amountMinor: minor,
                date,
                dueDate: due,
                notes: notes.trim(),
                payments: [],
                createdAt: now,
              },
            ],
            reminders: reminder
              ? [
                  ...b.reminders,
                  {
                    id: contactBookId(),
                    contactId: id,
                    debtId,
                    title: title.trim(),
                    dueAt: new Date(reminder).toISOString(),
                    createdAt: now,
                  },
                ]
              : b.reminders,
          }));
          onClose();
        }}
      >
        <p className="crm-book-hint">
          {l(
            "دين قديم أو شخصي، مستقل عن الخدمات والفواتير.",
            "An old or personal debt, separate from services and invoices.",
            "Une dette ancienne ou personnelle, distincte des services et factures.",
          )}
        </p>
        <label>
          {l("جهة الاتصال", "Contact", "Contact")}
          <select aria-label={l("جهة الاتصال", "Contact", "Contact")} required value={id} onChange={(e) => setId(e.target.value)}>
            <option value="">
              {l("اختر جهة اتصال", "Choose a contact", "Choisir un contact")}
            </option>
            {contactBook.contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.phone}
              </option>
            ))}
          </select>
        </label>
        <label>
          {l("اتجاه الدين", "Debt direction", "Sens de la dette")}
          <select value={direction} onChange={(event) => setDirection(event.target.value as DebtDirection)}>
            <option value="receivable">{l("لي عليه — أعطيته مالًا", "They owe me — I lent money", "À recevoir — j’ai prêté de l’argent")}</option>
            <option value="payable">{l("عليّ له — أخذت منه مالًا", "I owe them — I borrowed money", "À payer — j’ai emprunté de l’argent")}</option>
          </select>
        </label>
        <label>
          {l("وصف الدين", "Debt description", "Description de la dette")}
          <input
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <div className="crm-book-form-row">
          <label>
            {l("المبلغ", "Amount", "Montant")}
            <input
              required
              type="number"
              min="0.01"
              max="1000000000000"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label>
            {l("العملة", "Currency", "Devise")}
            <select aria-label={l("العملة", "Currency", "Devise")}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as SupportedCurrency)}
            >
              {["TRY", "USD", "EUR", "MAD"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="crm-book-form-row">
          <label>
            {l("تاريخ الدين", "Debt date", "Date de la dette")}
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label>
            {l(
              "تاريخ الاستحقاق (اختياري)",
              "Due date (optional)",
              "Échéance (facultative)",
            )}
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </label>
        </div>
        <label>
          {l(
            "تذكير بالسداد (اختياري)",
            "Payment reminder (optional)",
            "Rappel de paiement (facultatif)",
          )}
          <input
            type="datetime-local"
            value={reminder}
            onChange={(e) => setReminder(e.target.value)}
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
        {error && <p role="alert">{error}</p>}
        <div className="crm-book-form-actions">
          <button type="button" className="ws-secondary-btn" onClick={onClose}>
            {l("إلغاء", "Cancel", "Annuler")}
          </button>
          <button className="ws-primary-btn" type="submit">
            {l("حفظ الدين", "Save debt", "Enregistrer la dette")}
          </button>
        </div>
      </form>
    </CRMDialog>
  );
};
export const ManualDebtPaymentForm: React.FC<{
  debt: ManualDebt;
  onClose: () => void;
}> = ({ debt, onClose }) => {
  const { setContactBook, contactBook } = useApp(),
    { l } = useCopy(),
    allowed = useContactFinanceAccess();
  const balance = manualDebtBalance(
    contactBook.manualDebts.find((d) => d.id === debt.id) || debt,
  );
  const [amount, setAmount] = useState(String(fromMinorUnits(balance))),
    [note, setNote] = useState(""),
    [error, setError] = useState("");
  if (!allowed) return null;
  return (
    <CRMDialog
      name="ManualDebtPaymentForm"
      title={l("تسجيل تسديد", "Record payment", "Enregistrer un paiement")}
      onClose={onClose}
    >
      <form
        className="crm-book-form"
        onSubmit={(e) => {
          e.preventDefault();
          const n = toMinorUnits(Number(amount));
          if (!Number.isSafeInteger(n) || n <= 0 || n > balance) {
            setError(
              l(
                "المبلغ يجب أن يكون أكبر من صفر ولا يتجاوز المتبقي.",
                "The amount must be positive and cannot exceed the balance.",
                "Le montant doit être positif et ne pas dépasser le solde.",
              ),
            );
            return;
          }
          setContactBook((b) =>
            recordManualPayment(b, debt.id, n, note.trim()),
          );
          onClose();
        }}
      >
        <p>{debt.title}</p>
        <div className="crm-book-payment-balance">
          {l("المتبقي", "Remaining", "Solde")}{" "}
          <strong>{formatMinorMoney(balance, debt.currency, true)}</strong>
        </div>
        <label>
          {l("المبلغ المسدد", "Payment amount", "Montant payé")}
          <input
            required
            type="number"
            min="0.01"
            max={fromMinorUnits(balance)}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label>
          {l("ملاحظة التسديد", "Payment note", "Note de paiement")}
          <input
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <p className="crm-book-hint">
          {l(
            "تسديد كامل المبلغ يصفّر المتبقي ويحتفظ بسجل الدين والدفعات.",
            "Paying the full balance clears it and retains the debt and payment history.",
            "Le paiement intégral met le solde à zéro et conserve l’historique.",
          )}
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="crm-book-form-actions">
          <button type="button" className="ws-secondary-btn" onClick={onClose}>
            {l("إلغاء", "Cancel", "Annuler")}
          </button>
          <button type="submit" className="ws-primary-btn">
            {l("تأكيد التسديد", "Confirm payment", "Confirmer le paiement")}
          </button>
        </div>
      </form>
    </CRMDialog>
  );
};
