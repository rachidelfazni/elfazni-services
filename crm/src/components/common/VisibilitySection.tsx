import React, { useEffect, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useCopy } from "../../i18n/useCopy";
const prefix = (userId: string) => `elfazni:sections:v1:${userId}:`;
export function showAllSections(userId: string) {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix(userId)))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    /* Visibility remains usable when browser storage is unavailable. */
  }
  window.dispatchEvent(new Event("elfazni:sections-reset"));
}
export const VisibilitySection: React.FC<{
  sectionId: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ sectionId, title, children, className = "" }) => {
  const { user } = useAuth(),
    { l } = useCopy(),
    contentId = useId();
  const key = prefix(user?.id || "guest") + sectionId;
  const read = () => {
    try {
      return localStorage.getItem(key) === "hidden";
    } catch {
      return false;
    }
  };
  const [hidden, setHidden] = useState(read);
  useEffect(() => {
    setHidden(read());
    const reset = () => setHidden(false);
    window.addEventListener("elfazni:sections-reset", reset);
    return () => window.removeEventListener("elfazni:sections-reset", reset);
  }, [key]);
  const action = hidden
    ? l("إظهار القسم", "Show section", "Afficher la section")
    : l("إخفاء القسم", "Hide section", "Masquer la section");
  return (
    <section
      className={`section-visibility ${hidden ? "is-hidden" : ""} ${className}`}
      id={`section-${sectionId}`}
      data-visibility-section={sectionId}
    >
      <div className="section-visibility-bar no-print">
        <span>{title}</span>
        <button
          type="button"
          onClick={() => {
            const next = !hidden;
            setHidden(next);
            try {
              localStorage.setItem(key, next ? "hidden" : "visible");
            } catch {
              /* Local display still changes. */
            }
          }}
          aria-controls={contentId}
          aria-expanded={!hidden}
          aria-label={`${action}: ${title}`}
          title={action}
        >
          {hidden ? <Eye size={18} /> : <EyeOff size={18} />}
          <span>
            {hidden
              ? l("إظهار", "Show", "Afficher")
              : l("إخفاء", "Hide", "Masquer")}
          </span>
        </button>
      </div>
      <div
        id={contentId}
        className="section-visibility-content"
        hidden={hidden}
      >
        {children}
      </div>
    </section>
  );
};
