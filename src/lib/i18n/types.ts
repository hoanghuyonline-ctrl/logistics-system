export type Locale = "vi" | "en" | "zh";

export const DEFAULT_LOCALE: Locale = "vi";
export const SUPPORTED_LOCALES: Locale[] = ["vi", "en", "zh"];

export const LOCALE_LABELS: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
  zh: "中文",
};
