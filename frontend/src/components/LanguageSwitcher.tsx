import { useState } from "react";
import { useTranslation, type Language } from "../i18n";

const LANGUAGE_OPTIONS: { code: Language; labelKey: string }[] = [
  { code: "en", labelKey: "lang.english" },
  { code: "fi", labelKey: "lang.finnish" },
  { code: "sv", labelKey: "lang.swedish" },
];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentLabel =
    LANGUAGE_OPTIONS.find((o) => o.code === language)?.code.toUpperCase() ??
    language.toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 bg-white/90 shadow-sm hover:bg-gray-50 text-gray-600"
        aria-label={t("lang.label")}
      >
        <span className="flex items-center justify-center w-4 h-4">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3c4.97 0 9 3.582 9 8s-4.03 8-9 8-9-3.582-9-8 4.03-8 9-8z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 11h18M12 3c2.5 2.5 3.75 5.167 3.75 8S14.5 16.5 12 19c-2.5-2.5-3.75-5.167-3.75-8S9.5 5.5 12 3z"
            />
          </svg>
        </span>
        <span className="w-px h-4 bg-gray-300" />
        <span className="text-xs font-semibold tracking-wide">
          {currentLabel}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => {
                setLanguage(option.code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-3 py-1.5 text-xs sm:text-sm text-left hover:bg-gray-50 ${
                language === option.code
                  ? "font-semibold text-blue-600"
                  : "text-gray-700"
              }`}
            >
              <span>{t(option.labelKey)}</span>
              {language === option.code && (
                <span className="text-blue-500 text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


