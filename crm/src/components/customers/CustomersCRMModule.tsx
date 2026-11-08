import React, { useState, useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { useCopy } from "../../i18n/useCopy";
import { ContactWorkspace } from "../contacts/ContactWorkspace";
import { TransactionCustomerProfiles } from "./TransactionCustomerProfiles";
export const CustomersCRMModule: React.FC = () => {
  const { l } = useCopy(),
    { selectedContactId } = useApp();
  const [tab, setTab] = useState("contacts");
  useEffect(() => {
    if (selectedContactId) setTab("contacts");
  }, [selectedContactId]);
  return (
    <div className="crm-customer-workspace">
      <div className="ws-tabs crm-customer-tabs">
        {[
          [
            "contacts",
            l(
              "جهات الاتصال والمتابعة",
              "Contacts & follow-ups",
              "Contacts et suivi",
            ),
          ],
          [
            "transactions",
            l(
              "ملفات عملاء المعاملات",
              "Transaction customer profiles",
              "Profils clients des dossiers",
            ),
          ],
        ].map(([id, title]) => (
          <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
            {title}
          </button>
        ))}
      </div>
      {tab === "contacts" ? (
        <ContactWorkspace />
      ) : (
        <TransactionCustomerProfiles />
      )}
    </div>
  );
};
