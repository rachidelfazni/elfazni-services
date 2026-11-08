import React, { useState } from "react";
import { Copy, Share2, Check } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useCopy } from "../../i18n/useCopy";
import { BRAND_CONFIG } from "../../config/brandConfig";

export type BankI18n = (ar: string, en: string, fr: string) => string;

const ibanOf = (value: string) => value.replace(/\s/g, "");

/** Formats a TRY/USD IBAN list into a WhatsApp/e-mail-ready block. */
export function bankCopyText(
  l: BankI18n,
  holder: string,
  accounts: Array<{ currency: string; iban: string }>,
): string {
  const holderLabel = l(
    "صاحب الحساب",
    "Account Holder",
    "Titulaire du compte",
  );
  const ibanLabel = l("آيبان", "IBAN", "IBAN");
  const lines: string[] = ["ELFAZNI SERVICES", "", `${holderLabel}: ${holder}`];
  accounts.forEach((account) => {
    const accountLabel = l(
      `حساب ${account.currency}`,
      `${account.currency} Account`,
      `Compte ${account.currency}`,
    );
    lines.push("", `${accountLabel}:`, `${ibanLabel}: ${ibanOf(account.iban)}`);
  });
  return lines.join("\n");
}

/** Formats a single account: holder + currency + that account's own IBAN. */
export function bankAccountCopyText(
  l: BankI18n,
  holder: string,
  currency: string,
  iban: string,
): string {
  const holderLabel = l(
    "صاحب الحساب",
    "Account Holder",
    "Titulaire du compte",
  );
  const currencyLabel = l("العملة", "Currency", "Devise");
  const ibanLabel = l("آيبان", "IBAN", "IBAN");
  return [
    "ELFAZNI SERVICES",
    "",
    `${holderLabel}: ${holder}`,
    "",
    `${currencyLabel}: ${currency}`,
    `${ibanLabel}: ${ibanOf(iban)}`,
  ].join("\n");
}

export { ibanOf };

/**
 * Robust clipboard copy: prefers the async Clipboard API, but falls back to a
 * hidden textarea + execCommand when the API is denied (permissions, focus or
 * insecure context). Returns true only when the text is actually copied.
 */
export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export const BankDetailsShare: React.FC<{ compact?: boolean }> = ({
  compact = false,
}) => {
  const { documentSettings } = useApp(),
    { canViewAccounting } = useAuth(),
    { l } = useCopy();
  const [copied, setCopied] = useState(false),
    [fallback, setFallback] = useState(false);
  if (!canViewAccounting) return null;
  const holder =
    documentSettings.bankAccountHolder || BRAND_CONFIG.bankAccounts.accountHolder;
  const accounts = [
    {
      currency: "TRY",
      iban: documentSettings.ibanTRY || BRAND_CONFIG.bankAccounts.ibanTRY,
    },
    {
      currency: "USD",
      iban: documentSettings.ibanUSD || BRAND_CONFIG.bankAccounts.ibanUSD,
    },
  ];
  const text = bankCopyText(l, holder, accounts);
  const copy = async () => {
    setCopied(false);
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      setFallback(false);
    } else {
      setFallback(true);
    }
  };
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "ELFAZNI SERVICES", text });
      } else
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text)}`,
          "_blank",
          "noopener,noreferrer",
        );
    } catch (e) {
      if ((e as DOMException).name !== "AbortError") setFallback(true);
    }
  };
  return (
    <div className={`crm-bank-share ${compact ? "compact" : ""}`}>
      <button type="button" className="ws-secondary-btn" onClick={copy}>
        {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
        {l(
          "نسخ بيانات الحسابين",
          "Copy both bank accounts",
          "Copier les deux comptes",
        )}
      </button>
      {!compact && (
        <button type="button" className="ws-secondary-btn" onClick={share}>
          <Share2 size={16} />
          {l("مشاركة", "Share", "Partager")}
        </button>
      )}
      <span role="status">
        {copied
          ? l(
              "تم نسخ اسم المستفيد وحسابَي TRY وUSD.",
              "Holder name and TRY / USD accounts copied.",
              "Titulaire et comptes TRY / USD copiés.",
            )
          : ""}
      </span>
      {fallback && (
        <label className="crm-bank-fallback">
          {l(
            "تعذّر النسخ الآلي. حدّد النص وانسخه يدويًا.",
            "Clipboard unavailable. Select and copy the text.",
            "Presse-papiers indisponible. Sélectionnez et copiez le texte.",
          )}
          <textarea
            readOnly
            dir="ltr"
            value={text}
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      )}
    </div>
  );
};