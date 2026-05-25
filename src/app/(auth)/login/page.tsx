"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n, SUPPORTED_LOCALES, LOCALE_LABELS } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) setAuthError(err);
  }, []);

  const displayError =
    error ||
    (authError === "OAuthAccountNotLinked"
      ? t("auth.googleAccountLinked")
      : authError === "AccessDenied"
        ? t("auth.googleAccessDenied")
        : authError
          ? t("auth.googleError")
          : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(t("auth.invalidCredentials"));
      setLoading(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const callback = params.get("callbackUrl");

    if (callback) {
      router.push(callback);
      return;
    }

    const res = await fetch("/api/auth/me");
    const user = await res.json();
    const role = user?.role;

    if (role === "ADMIN" || role === "ACCOUNTANT") {
      router.push("/admin/dashboard");
    } else if (role === "WAREHOUSE_CN") {
      router.push("/warehouse/china/dashboard");
    } else if (role === "WAREHOUSE_VN") {
      router.push("/warehouse/vietnam/dashboard");
    } else {
      router.push("/dashboard");
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(window.location.search);
      const callback = params.get("callbackUrl") || "/dashboard";
      await signIn("google", { callbackUrl: callback });
    } catch {
      setError(t("auth.googleError"));
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">VN</span>
          </div>
          <span className="text-xl font-bold text-white">{t("common.appName")}</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4 whitespace-pre-line">
            {t("auth.loginBranding")}
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed whitespace-pre-line">
            {t("auth.loginBrandingDesc")}
          </p>
        </div>
        <p className="text-blue-200 text-sm">{t("common.copyright")}</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold">VN</span>
            </div>
            <span className="text-lg font-bold text-slate-900">{t("common.appName")}</span>
          </div>

          {/* Language selector */}
          <div className="flex justify-end mb-4">
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-600 focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {SUPPORTED_LOCALES.map((l) => (
                <option key={l} value={l}>{LOCALE_LABELS[l]}</option>
              ))}
            </select>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t("auth.welcomeBack")}</h1>
          <p className="text-sm text-slate-500 mb-8">{t("auth.signInSubtitle")}</p>

          {displayError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm border border-red-100">
              <span>⚠️</span>
              <span>{displayError}</span>
            </div>
          )}

          {/* Google sign-in button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 transition-colors shadow-sm text-sm font-medium text-slate-700 mb-4"
          >
            {googleLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                {t("auth.googleSigningIn")}
              </span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {t("auth.googleSignIn")}
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">{t("auth.orDivider")}</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("auth.emailOrPhoneLabel")}</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={t("auth.emailOrPhonePlaceholder")}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{t("auth.passwordLabel")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder={t("auth.passwordPlaceholder")}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t("auth.signingIn")}
                </span>
              ) : t("common.signIn")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {t("auth.noAccount")}{" "}
            <Link href="/register" className="text-blue-600 font-medium hover:text-blue-700">
              {t("auth.createOne")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
