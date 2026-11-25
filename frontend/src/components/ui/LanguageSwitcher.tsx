"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      data-no-i18n="true"
      className="inline-flex items-center rounded-xl border border-[#1B2A24]/15 bg-[#EAE5DA]/80 p-0.5 text-xs font-medium"
      title={
        lang === "vi"
          ? "Chuyển ngôn ngữ Tiếng Việt / English"
          : "Switch Language Vietnamese / English"
      }
    >
      <Globe className="w-3.5 h-3.5 text-[#1B2A24]/60 ml-1.5 mr-1 hidden sm:block" strokeWidth={1.75} />
      <button
        type="button"
        onClick={() => setLang("vi")}
        className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
          lang === "vi"
            ? "bg-[#1B2A24] text-[#F4F1EA] shadow-xs"
            : "text-[#141413]/60 hover:text-[#141413]"
        }`}
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
          lang === "en"
            ? "bg-[#1B2A24] text-[#F4F1EA] shadow-xs"
            : "text-[#141413]/60 hover:text-[#141413]"
        }`}
      >
        EN
      </button>
    </div>
  );
}
