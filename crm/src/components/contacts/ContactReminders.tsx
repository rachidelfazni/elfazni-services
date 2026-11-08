import React, { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useCopy } from "../../i18n/useCopy";
import { formatDateTime } from "../../utils/formatters";
import { useContactFinanceAccess } from "./ContactFinanceForms";
export function usePendingContactReminders(onlyDue = false) {
  const { contactBook } = useApp(),
    { canViewAccounting } = useAuth();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  return contactBook.reminders
    .filter(
      (r) =>
        !r.completedAt &&
        (!r.debtId || canViewAccounting) &&
        (!onlyDue || new Date(r.dueAt).getTime() <= now),
    )
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}
export const ContactStorageNotice = () => {
  const { contactBookStorageError } = useApp(),
    { l } = useCopy();
  return contactBookStorageError ? (
    <div role="alert" className="crm-book-error">
      {l(
        "تعذّر حفظ سجل جهات الاتصال في هذا المتصفح أو قراءة بياناته. صدّر نسخة احتياطية قبل إغلاق الصفحة ولا تمسح بيانات المتصفح.",
        "Contact storage could not be saved or read. Export a backup before closing this page and keep browser data.",
        "Impossible de lire ou enregistrer les contacts. Exportez une sauvegarde avant de fermer cette page et conservez les données du navigateur.",
      )}
    </div>
  ) : null;
};
export const ContactRemindersPanel: React.FC<{
  onlyDue?: boolean;
  onOpenContact?: () => void;
}> = ({ onlyDue = false, onOpenContact }) => {
  const { contactBook, setContactBook, setSelectedContactId, setActiveTab } =
      useApp(),
    { canEditOperations, canViewAccounting } = useAuth(),
    finance = useContactFinanceAccess(),
    { l } = useCopy();
  const reminders = usePendingContactReminders(onlyDue);
  return (
    <section className="crm-contact-reminders">
      <h3>
        <Bell size={18} />
        {l(
          "تذكيرات جهات الاتصال والديون المستقلة",
          "Contact & standalone debt reminders",
          "Rappels des contacts et dettes indépendantes",
        )}{" "}
        <span>{reminders.length}</span>
      </h3>
      {!reminders.length ? (
        <p className="crm-book-hint">
          {l(
            "لا توجد تذكيرات معلّقة.",
            "No pending reminders.",
            "Aucun rappel en attente.",
          )}
        </p>
      ) : (
        reminders.map((r) => {
          const c = contactBook.contacts.find((c) => c.id === r.contactId);
          return (
            <div
              key={r.id}
              className={
                new Date(r.dueAt).getTime() <= Date.now() ? "is-due" : ""
              }
            >
              <button
                onClick={() => {
                  setSelectedContactId(r.contactId);
                  setActiveTab("customers");
                  onOpenContact?.();
                }}
              >
                <strong>
                  {c?.name} · {r.title}
                </strong>
                <small>
                  {formatDateTime(r.dueAt)} ·{" "}
                  {r.debtId
                    ? l("دين مستقل", "Standalone debt", "Dette indépendante")
                    : l(
                        "متابعة اتصال",
                        "Contact follow-up",
                        "Suivi de contact",
                      )}
                </small>
              </button>
              {(r.debtId ? finance : canEditOperations || finance) && (
                <button
                  className="ws-secondary-btn"
                  onClick={() =>
                    setContactBook((b) => ({
                      ...b,
                      reminders: b.reminders.map((x) =>
                        x.id === r.id
                          ? { ...x, completedAt: new Date().toISOString() }
                          : x,
                      ),
                    }))
                  }
                >
                  <Check size={15} />
                  {l("تمت المتابعة", "Done", "Terminé")}
                </button>
              )}
            </div>
          );
        })
      )}
    </section>
  );
};
