import { ContactBook, ManualDebt } from "../types/contactBook";
export const emptyContactBook = (): ContactBook => ({
  contacts: [],
  activities: [],
  manualDebts: [],
  reminders: [],
});
export const normalizeContactPhone = (phone: string) =>
  phone.replace(/\D/g, "").replace(/^00/, "");
export function safeContactLink(value: string): string | undefined {
  try {
    const link = new URL(value);
    if (['https:', 'http:'].includes(link.protocol) && !link.username && !link.password) return link.href;
  } catch {}
  return undefined;
}

export const debtDirection = (debt: ManualDebt) => debt.direction || "receivable";
export const manualDebtBalance = (debt: ManualDebt) =>
  Math.max(
    0,
    debt.amountMinor - debt.payments.reduce((s, p) => s + p.amountMinor, 0),
  );
export const contactBookId = () => crypto.randomUUID();
export function recordManualPayment(
  book: ContactBook,
  debtId: string,
  amountMinor: number,
  note: string,
  at = new Date().toISOString(),
): ContactBook {
  const debt = book.manualDebts.find((d) => d.id === debtId);
  if (
    !debt ||
    !Number.isSafeInteger(amountMinor) ||
    amountMinor <= 0 ||
    amountMinor > manualDebtBalance(debt)
  )
    return book;
  const cleared = amountMinor === manualDebtBalance(debt);
  return {
    ...book,
    manualDebts: book.manualDebts.map((d) =>
      d.id === debtId
        ? {
            ...d,
            payments: [
              ...d.payments,
              { id: contactBookId(), amountMinor, paidAt: at, note },
            ],
          }
        : d,
    ),
    reminders: book.reminders.map((r) =>
      r.debtId === debtId && cleared && !r.completedAt
        ? { ...r, completedAt: at }
        : r,
    ),
  };
}
export function validContactBook(value: unknown): value is ContactBook {
  if (!value || typeof value !== "object") return false;
  const b = value as ContactBook;
  if (
    ![b.contacts, b.activities, b.manualDebts, b.reminders].every(Array.isArray)
  )
    return false;
  const text = (v: unknown) => typeof v === "string" && v.length <= 20000;
  const date = (v: unknown) =>
    text(v) && Number.isFinite(Date.parse(v as string));
  const unique = (list: { id: string }[]) =>
    list.every((x) => x && text(x.id) && x.id.length > 0) &&
    new Set(list.map((x) => x.id)).size === list.length;
  if (![b.contacts, b.activities, b.manualDebts, b.reminders].every(unique))
    return false;
  if (
    !b.contacts.every(
      (c) =>
        [c.name, c.phone, c.email, c.notes, c.latestAgreement].every(text) &&
        c.name.trim() &&
        ["lead", "customer"].includes(c.status) &&
        Number.isInteger(c.rating) &&
        c.rating >= 0 &&
        c.rating <= 5 &&
        [c.alternatePhone, c.address, c.city].every((value) => value === undefined || text(value)) &&
        (c.social === undefined || (c.social && typeof c.social === 'object' && !Array.isArray(c.social) &&
          Object.entries(c.social).every(([key, value]) =>
            ['instagram', 'facebook', 'linkedin'].includes(key) &&
            typeof value === 'string' && value.length <= 500 && Boolean(safeContactLink(value))
          ))) &&
        (c.starred === undefined || typeof c.starred === "boolean") &&
        (c.photo === undefined || (typeof c.photo === "string" && c.photo.length <= 180000 &&
          /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(c.photo))) &&
        date(c.createdAt) &&
        date(c.updatedAt) &&
        (c.linkedCustomerId === undefined || text(c.linkedCustomerId)),
    )
  )
    return false;
  const contacts = new Set(b.contacts.map((c) => c.id));
  if (
    !b.activities.every(
      (a) =>
        contacts.has(a.contactId) &&
        [
          "call",
          "message",
          "meeting",
          "agreement",
          "historical",
          "note",
        ].includes(a.kind) &&
        text(a.text) &&
        date(a.occurredAt) &&
        date(a.createdAt),
    )
  )
    return false;
  if (
    !b.manualDebts.every(
      (d) =>
        contacts.has(d.contactId) &&
        text(d.title) &&
        (d.direction === undefined || ["receivable", "payable"].includes(d.direction)) &&
        text(d.notes) &&
        ["TRY", "USD", "EUR", "MAD"].includes(d.currency) &&
        Number.isSafeInteger(d.amountMinor) &&
        d.amountMinor > 0 &&
        date(d.date) &&
        (!d.dueDate || date(d.dueDate)) &&
        date(d.createdAt) &&
        Array.isArray(d.payments) &&
        unique(d.payments) &&
        d.payments.every(
          (p) =>
            Number.isSafeInteger(p.amountMinor) &&
            p.amountMinor > 0 &&
            date(p.paidAt) &&
            text(p.note),
        ) &&
        d.payments.reduce((s, p) => s + p.amountMinor, 0) <= d.amountMinor,
    )
  )
    return false;
  return b.reminders.every(
    (r) =>
      contacts.has(r.contactId) &&
      text(r.title) &&
      date(r.dueAt) &&
      date(r.createdAt) &&
      (!r.completedAt || date(r.completedAt)) &&
      (!r.debtId ||
        b.manualDebts.some(
          (d) => d.id === r.debtId && d.contactId === r.contactId,
        )),
  );
}
export function exportContactCSV(
  filename: string,
  rows: (string | number)[][],
) {
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
  a.download = filename + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
