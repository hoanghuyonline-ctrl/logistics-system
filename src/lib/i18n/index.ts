"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useSyncExternalStore,
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
const COOKIE_NAME = "vnl-locale";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${expires};samesite=lax`;
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored && SUPPORTED_LOCALES.includes(stored)) return stored;
  const fromCookie = getCookie(COOKIE_NAME) as Locale | null;
  if (fromCookie && SUPPORTED_LOCALES.includes(fromCookie)) return fromCookie;
  return DEFAULT_LOCALE;
}

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

const subscribeNoop = () => () => {};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const initialLocale = useSyncExternalStore(subscribeNoop, getInitialLocale, () => DEFAULT_LOCALE);
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
    setCookie(COOKIE_NAME, l);
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
