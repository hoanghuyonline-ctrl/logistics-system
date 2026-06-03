import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n/types";
import vi from "@/lib/i18n/vi";
import en from "@/lib/i18n/en";
import zh from "@/lib/i18n/zh";
import { prisma } from "@/lib/prisma";
import type { HomePageBlock, BannerBlock, AboutBlock } from "@/types/page";

import {
  LandingNavbar,
  LandingHero,
  LandingServices,
  LandingHowItWorks,
  LandingOrderTracking,
  LandingCTA,
  LandingFooter,
  LandingTrust,
  LandingLeadForm,
  LandingFloatingCTA,
  LandingMobileBar,
} from "@/components/landing";

// ─────────────────────────────────────────────────────────────────────────────
// Dictionaries mapping for Server-Side Translations
// ─────────────────────────────────────────────────────────────────────────────
const dictionaries: Record<Locale, Record<string, string>> = { vi, en, zh };

function getT(locale: Locale) {
  return (key: string, fallback?: string): string => {
    return dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? fallback ?? key;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CMS Config loader — reads homepage_blocks from SystemConfig via Prisma
// Safe fallback: returns [] on any DB/parse error — page never crashes
// ─────────────────────────────────────────────────────────────────────────────
async function getHomepageCmsConfig(): Promise<HomePageBlock[]> {
  try {
    const record = await prisma.systemConfig.findUnique({
      where: { key: "homepage_blocks" },
    });
    if (!record?.value) return [];
    const parsed = JSON.parse(record.value) as HomePageBlock[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CMS-driven About Section (Server Component)
// Renders between LandingTrust and LandingHowItWorks when Admin has configured
// a visible about block. Returns null if not configured or isVisible=false.
// ─────────────────────────────────────────────────────────────────────────────
function CmsAboutSection({ block }: { block: AboutBlock }) {
  if (!block.isVisible || (!block.content && !block.title)) return null;

  return (
    <section id="cms-about" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="space-y-5">
            {block.title && (
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                {block.title}
              </h2>
            )}
            {block.content && (
              <p className="text-slate-600 leading-relaxed text-base md:text-lg whitespace-pre-line">
                {block.content}
              </p>
            )}
          </div>
          {block.imageUrl && (
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-100 h-72 md:h-96">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.imageUrl}
                alt={block.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Stats Component — pure Server Component
// ─────────────────────────────────────────────────────────────────────────────
function LandingStatsServer({ locale }: { locale: Locale }) {
  const t = getT(locale);

  const stats = [
    { value: "10K+", label: t("landing.ordersDelivered") },
    { value: "99.5%", label: t("landing.deliveryRate") },
    { value: "5-7", label: t("landing.daysAverage") },
    { value: "24/7", label: t("landing.support") },
  ];

  return (
    <section className="border-y border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="animate-fade-up grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`text-center ${
                i < stats.length - 1 ? "lg:border-r lg:border-slate-200" : ""
              }`}
            >
              <p className="text-3xl font-bold" style={{ color: "var(--brand-navy)" }}>
                {s.value}
              </p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// SVG Icons for Locations
function LocationPinIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Locations Component — pure Server Component
// ─────────────────────────────────────────────────────────────────────────────
function LandingLocationsServer({ locale }: { locale: Locale }) {
  const t = getT(locale);

  const locations = [
    { name: t("landing.headOffice"),     address: t("landing.headOfficeAddr"),   phone: "0989 711 888" },
    { name: t("landing.chinaWarehouse"), address: t("landing.chinaWarehouseAddr"), phone: "19162296663" },
    { name: t("landing.bacNinhOffice"),  address: t("landing.bacNinhOfficeAddr"), phone: null },
    { name: t("landing.hanoiWarehouse"), address: t("landing.hanoiWarehouseAddr"), phone: null },
  ];

  return (
    <section className="py-20 lg:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="animate-fade-up text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
            {t("landing.ourLocations")}
          </h2>
          <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">
            {t("landing.ourLocationsDesc")}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locations.map((loc) => (
            <div
              key={loc.name}
              className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                  <LocationPinIcon />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold mb-1.5" style={{ color: "var(--brand-navy)" }}>
                    {loc.name}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{loc.address}</p>
                  {loc.phone && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                      <PhoneIcon />
                      {loc.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Locale detection helper
// ─────────────────────────────────────────────────────────────────────────────
async function getLocale(searchParams: Promise<{ lang?: string }>) {
  try {
    const resolvedParams = await searchParams;
    if (resolvedParams.lang && ["vi", "en", "zh"].includes(resolvedParams.lang)) {
      return resolvedParams.lang as Locale;
    }
  } catch { /* ignore */ }

  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("vnl-locale")?.value;
    if (cookieLocale && ["vi", "en", "zh"].includes(cookieLocale)) {
      return cookieLocale as Locale;
    }
  } catch { /* ignore */ }

  return "vi" as Locale;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Main Homepage — Async Server Component
//
// CMS Integration (zero-impact design):
//   • Fetches homepage_blocks from SystemConfig via Prisma in parallel with locale
//   • banner block (isVisible=true) → cmsTitle / cmsSubtitle / cmsImageUrl
//     passed directly as PROPS into LandingHero — replaces the hardcoded
//     headline text *inside* the same Hero component (no duplicate section)
//   • about block  (isVisible=true) → CmsAboutSection between Trust & HowItWorks
//   • DB empty / error → all blocks undefined → LandingHero falls back to
//     its own hardcoded defaults — page renders exactly as before
// ─────────────────────────────────────────────────────────────────────────────
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const [locale, cmsBlocks] = await Promise.all([
    getLocale(searchParams),
    getHomepageCmsConfig(),
  ]);

  // Extract typed blocks (undefined when not configured in Admin)
  const bannerBlock = cmsBlocks.find((b) => b.type === "banner") as BannerBlock | undefined;
  const aboutBlock  = cmsBlocks.find((b) => b.type === "about")  as AboutBlock  | undefined;

  // Only pass CMS overrides when the block exists AND is visible
  const activeBanner = bannerBlock?.isVisible ? bannerBlock : undefined;

  return (
    <div className="min-h-screen bg-white pb-14 sm:pb-0">
      <LandingNavbar />

      {/*
        CMS data injected directly into LandingHero via props.
        When activeBanner is undefined, LandingHero renders its
        own hardcoded defaults — visually identical to pre-CMS state.
      */}
      <LandingHero
        cmsTitle={activeBanner?.title}
        cmsSubtitle={activeBanner?.subtitle}
        cmsImageUrl={activeBanner?.imageUrl}
        cmsDescription={activeBanner?.description}
        cmsCardTitle={activeBanner?.cardTitle}
        cmsCardDesc={activeBanner?.cardDesc}
      />

      <LandingStatsServer locale={locale} />
      <LandingServices />
      <LandingTrust />

      {/* CMS About section — null if not configured or isVisible=false */}
      {aboutBlock && <CmsAboutSection block={aboutBlock} />}

      <LandingHowItWorks />
      <LandingOrderTracking />
      <LandingLeadForm />
      <LandingLocationsServer locale={locale} />
      <LandingCTA />
      <LandingFooter />
      <LandingFloatingCTA />
      <LandingMobileBar />
    </div>
  );
}
