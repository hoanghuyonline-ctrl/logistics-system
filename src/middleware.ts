import { NextRequest, NextResponse } from "next/server";

const SUPPORTED_LOCALES = ["vi", "en", "zh"];
const DEFAULT_LOCALE = "vi";
const COOKIE_NAME = "vnl-locale";

function parseAcceptLanguage(header: string): string | null {
  const langs = header
    .split(",")
    .map((part) => {
      const [lang, q] = part.trim().split(";q=");
      return { lang: lang.trim().split("-")[0].toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of langs) {
    if (SUPPORTED_LOCALES.includes(lang)) return lang;
  }
  return null;
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const existing = request.cookies.get(COOKIE_NAME)?.value;
  if (existing && SUPPORTED_LOCALES.includes(existing)) {
    return response;
  }

  const acceptLang = request.headers.get("accept-language");
  const detected = acceptLang ? parseAcceptLanguage(acceptLang) : null;
  const locale = detected ?? DEFAULT_LOCALE;

  response.cookies.set(COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
