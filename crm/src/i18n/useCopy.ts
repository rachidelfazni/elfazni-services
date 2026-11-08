import { useLanguage } from "../context/LanguageContext";
export function useCopy() {
  const { language, ...rest } = useLanguage();
  const l = (ar: string, en: string, fr: string) =>
    language === "ar" ? ar : language === "fr" ? fr : en;
  return { language, l, ...rest };
}
