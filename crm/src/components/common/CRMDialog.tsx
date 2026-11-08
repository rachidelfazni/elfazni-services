import React, { useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useCopy } from "../../i18n/useCopy";
export const CRMDialog: React.FC<{
  title: string;
  name: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, name, onClose, children }) => {
  const { l, isRTL } = useCopy(),
    ref = useRef<HTMLDivElement>(null),
    id = useId();
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const before = document.activeElement as HTMLElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current
      ?.querySelector<HTMLElement>("input,select,textarea,button")
      ?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current();
      if (e.key === "Tab") {
        const all = Array.from(
          ref.current?.querySelectorAll<HTMLElement>(
            "button:not([disabled]),input,select,textarea,a[href]",
          ) || [],
        ).filter((n) => n.getClientRects().length);
        const first = all[0],
          last = all[all.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      before?.focus();
    };
  }, []);
  return createPortal(
    <div className="crm-book-overlay" dir={isRTL ? "rtl" : "ltr"}>
      <div
        ref={ref}
        className="crm-book-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        data-crm-dialog={name}
      >
        <header>
          <h2 id={id}>{title}</h2>
          <button
            type="button"
            aria-label={l("إغلاق", "Close", "Fermer")}
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
};
