import { useState, useRef, useEffect } from "react";
import { useTranslation, type Language } from "../i18n";

const OPTIONS: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fi", label: "Suomi" },
  { code: "sv", label: "Svenska" },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = OPTIONS.find((o) => o.code === language);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Language"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#E4E7EC] bg-white text-[#374151] text-sm font-medium hover:border-[#006B6B] hover:text-[#006B6B] transition-colors"
      >
        <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
          <path d="M3 12h18M12 3c2.5 3 4 6 4 9s-1.5 6-4 9M12 3c-2.5 3-4 6-4 9s1.5 6 4 9" strokeWidth="1.8" />
        </svg>
        <span>{current?.label ?? language.toUpperCase()}</span>
        <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white border border-[#E4E7EC] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.08)] py-1 z-50 animate-fadeIn">
          {OPTIONS.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => { setLanguage(opt.code); setOpen(false); }}
              className={`flex w-full items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                language === opt.code
                  ? "text-[#006B6B] font-semibold bg-[#F0F9F9]"
                  : "text-[#374151] hover:bg-[#F9FAFB]"
              }`}
            >
              {opt.label}
              {language === opt.code && (
                <svg className="w-3.5 h-3.5 text-[#006B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
