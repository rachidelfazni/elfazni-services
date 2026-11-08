import { useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import dictionary from "./interface-copy.json";
const copy: Record<string, string[]> = dictionary;
export function translateInterface(
  text: string,
  language: "ar" | "en" | "fr",
): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (language === "ar")
    return (copy[normalized]?.[2] ?? text)
      .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "")
      .trim();
  const invoiceSaved = normalized.match(
    /^تم حفظ مسودة الفاتورة \((.+)\) بنجاح\.$/,
  );
  const invoiceIssued = normalized.match(
    /^تم إصدار واعتماد الفاتورة \((.+)\) بنجاح!$/,
  );
  const invoiceApproved = normalized.match(
    /^تم اعتماد وإصدار الفاتورة (.+) بنجاح\.$/,
  );
  if (invoiceSaved)
    return language === "fr"
      ? `Brouillon ${invoiceSaved[1]} enregistré.`
      : `Draft ${invoiceSaved[1]} saved.`;
  if (invoiceIssued || invoiceApproved) {
    const id = (invoiceIssued || invoiceApproved)![1];
    return language === "fr" ? `Facture ${id} émise.` : `Invoice ${id} issued.`;
  }
  const translated = copy[normalized]?.[language === "fr" ? 1 : 0];
  return translated === undefined ? text : translated;
}
export function useUITranslation() {
  const { language, setLanguage, isRTL } = useLanguage();
  const ui = useCallback(
    (text: string) => translateInterface(text, language),
    [language],
  );
  return { ui, language, setLanguage, isRTL };
}
