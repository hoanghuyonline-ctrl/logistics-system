"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { createElement } from "react";
import type { Locale } from "./types";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./types";
import vi from "./vi";
import en from "./en";
import zh from "./zh";

export { DEFAULT_LOCALE, SUPPORTED_LOCALES, LOCALE_LABELS } from "./types";
export type { Locale } from "./types";

const dictionaries: Record<Locale, Record<string, string>> = { vi, en, zh };

const STORAGE_KEY = "vnl-locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    // Priority: saved preference > browser language > fallback to Vietnamese
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored && SUPPORTED_LOCALES.includes(stored)) {
      setLocaleState(stored);
      return;
    }

    const browserLang = navigator.language?.slice(0, 2).toLowerCase();
    const matched = SUPPORTED_LOCALES.find((l) => l === browserLang);
    if (matched) {
      setLocaleState(matched);
      return;
    }

    // Default: Vietnamese
    setLocaleState(DEFAULT_LOCALE);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      return dictionaries[locale]?.[key]
        ?? dictionaries.en[key]
        ?? fallback
        ?? key;
    },
    [locale],
  );

  return createElement(
    I18nContext.Provider,
    { value: { locale, setLocale, t } },
    children,
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
