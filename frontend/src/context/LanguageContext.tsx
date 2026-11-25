"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppLang, EN_PHRASE_MAP, UI_STRINGS, VI_PURE_MAP } from "@/i18n/translations";

interface LanguageContextType {
  lang: AppLang;
  setLang: (next: AppLang) => void;
  toggleLang: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "rwa_platform_lang";

interface CompiledRule {
  src: string;
  dst: string;
  regex: RegExp | null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compileRules(pairs: Array<[string, string]>): CompiledRule[] {
  const sorted = [...pairs].sort((a, b) => b[0].length - a[0].length);
  return sorted.map(([src, dst]) => {
    // Với từ đơn ngắn chỉ gồm chữ cái (ASCII hoặc tiếng Việt ngắn <= 6 ký tự), kiểm tra ranh giới từ để không cắt giữa chừng từ khác
    const isShortPureAsciiWord = /^[A-Za-z]{2,12}$/.test(src);
    const isVeryShortWord = src.length <= 4 && !/[\s/:.()[\]]/.test(src);
    if (isShortPureAsciiWord) {
      return {
        src,
        dst,
        regex: new RegExp(`\\b${escapeRegExp(src)}\\b`, "g"),
      };
    }
    if (isVeryShortWord) {
      return {
        src,
        dst,
        regex: new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(src)}(?![\\p{L}\\p{N}])`, "gu"),
      };
    }
    return { src, dst, regex: null };
  });
}

const COMPILED_EN_RULES = compileRules(EN_PHRASE_MAP);
const COMPILED_VI_RULES = compileRules(VI_PURE_MAP);

const SKIP_TAGS = new Set(["CODE", "PRE", "SCRIPT", "STYLE", "TEXTAREA", "NOSCRIPT", "SVG"]);

function shouldSkipText(raw: string): boolean {
  const s = raw.trim();
  if (!s) return true;
  if (/^0x[0-9a-fA-F]{6,}/.test(s)) return true;
  if (/^Qm[1-9A-HJ-NP-Za-km-z]{8,}/.test(s)) return true;
  if (/^[\d.,$%+\-/:@#\s()]+$/.test(s)) return true;
  return false;
}

function translateString(raw: string, lang: AppLang): string {
  if (shouldSkipText(raw)) return raw;
  const rules = lang === "en" ? COMPILED_EN_RULES : COMPILED_VI_RULES;
  let out = raw;
  for (const rule of rules) {
    if (!out.includes(rule.src)) continue;
    if (rule.regex) {
      out = out.replace(rule.regex, rule.dst);
    } else {
      out = out.split(rule.src).join(rule.dst);
    }
  }
  return out;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLang>("vi");
  const origTextMapRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const origPlaceholderMapRef = useRef<WeakMap<HTMLElement, string>>(new WeakMap());
  const origTitleMapRef = useRef<WeakMap<HTMLElement, string>>(new WeakMap());
  const isApplyingRef = useRef<boolean>(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "vi" || saved === "en") {
        setLangState(saved);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const setLang = useCallback((next: AppLang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "vi" ? "en" : "vi");
  }, [lang, setLang]);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const entry = UI_STRINGS[key];
      if (entry) return entry[lang];
      return fallback ?? key;
    },
    [lang]
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.title =
      lang === "en"
        ? "RWA Registry — Fractional Real Estate Ownership"
        : "Cổng Bất Động Sản RWA — Đầu tư & Sở hữu Bất động sản Số hóa";

    const origTexts = origTextMapRef.current;
    const origPlaceholders = origPlaceholderMapRef.current;
    const origTitles = origTitleMapRef.current;

    const isInsideSkipped = (node: Node | null): boolean => {
      let cur = node?.parentElement || null;
      while (cur) {
        if (SKIP_TAGS.has(cur.tagName) || cur.getAttribute("data-no-i18n") === "true") {
          return true;
        }
        cur = cur.parentElement;
      }
      return false;
    };

    const applyToSubtree = (root: Node) => {
      if (isApplyingRef.current) return;
      isApplyingRef.current = true;
      try {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let node: Node | null = walker.nextNode();
        while (node) {
          const textNode = node as Text;
          if (!isInsideSkipped(textNode)) {
            const currentVal = textNode.nodeValue || "";
            if (!origTexts.has(textNode)) {
              origTexts.set(textNode, currentVal);
            }
            const baseText = origTexts.get(textNode) || "";
            const nextVal = translateString(baseText, lang);
            if (currentVal !== nextVal) {
              textNode.nodeValue = nextVal;
            }
          }
          node = walker.nextNode();
        }

        if (root instanceof HTMLElement || root === document.body) {
          const scope = root as HTMLElement;
          const inputs = scope.querySelectorAll<HTMLElement>("input[placeholder], textarea[placeholder]");
          inputs.forEach((el) => {
            if (el.getAttribute("data-no-i18n") === "true") return;
            const curPh = el.getAttribute("placeholder") || "";
            if (!origPlaceholders.has(el)) {
              origPlaceholders.set(el, curPh);
            }
            const basePh = origPlaceholders.get(el) || "";
            const nextPh = translateString(basePh, lang);
            if (curPh !== nextPh) {
              el.setAttribute("placeholder", nextPh);
            }
          });

          const titledEls = scope.querySelectorAll<HTMLElement>("[title]");
          titledEls.forEach((el) => {
            if (el.getAttribute("data-no-i18n") === "true") return;
            const curTitle = el.getAttribute("title") || "";
            if (!origTitles.has(el)) {
              origTitles.set(el, curTitle);
            }
            const baseTitle = origTitles.get(el) || "";
            const nextTitle = translateString(baseTitle, lang);
            if (curTitle !== nextTitle) {
              el.setAttribute("title", nextTitle);
            }
          });
        }
      } finally {
        isApplyingRef.current = false;
      }
    };

    applyToSubtree(document.body);

    let rafId: number | null = null;
    const observer = new MutationObserver((mutations) => {
      if (isApplyingRef.current) return;
      for (const m of mutations) {
        if (m.type === "characterData" && m.target instanceof Text) {
          origTexts.set(m.target, m.target.nodeValue || "");
        }
      }
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        applyToSubtree(document.body);
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
