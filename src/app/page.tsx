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

// Server-side translation helper matching client-side hook behavior
function getT(locale: Locale) {
  return (key: string, fallback?: string): string => {
    return dictionaries[locale]?.[key] ?? dictionaries.en[key] ?? fallback ?? key;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CMS Config loader — reads homepage_blocks from SystemConfig table via Prisma
// Returns parsed HomePageBlock[] or empty array on any error (safe fallback)
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
    // DB unavailable or JSON parse error → degrade gracefully, never throw
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CMS-driven Banner Section (Server Component, no props needed for icons)
//
// Renders only when Admin saved a visible banner block with a non-empty imageUrl.
// Placed BEFORE LandingHero so the existing hero is always preserved below it.
// Returns null if block is hidden or image missing → zero visual impact.
// ─────────────────────────────────────────────────────────────────────────────
function CmsBannerSection({ block }: { block: BannerBlock }) {
  if (!block.isVisible || !block.imageUrl) return null;

  return (
    <section
      id="cms-banner"
      className="relative h-[55vh] md:h-[70vh] flex items-center justify-center bg-slate-900 text-white overflow-hidden"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.imageUrl}
        alt={block.title}
        className="absolute inset-0 w-full h-full object-cover opacity-35"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/80" />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-5">
        {block.title && (
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            {block.title}
          </h2>
        )}
        {block.subtitle && (
          <p className="text-sm sm:text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
            {block.subtitle}
          </p>
        )}
        {block.buttonText && block.buttonLink && (
          <a
            href={block.buttonLink}
            className="inline-block bg-orange-600 hover:bg-orange-500 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-orange-600/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 text-sm"
          >
            {block.buttonText}
          </a>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CMS-driven About Section (Server Component)
//
// Renders only when Admin saved a visible about block with non-empty content.
// Inserted between LandingTrust and LandingHowItWorks.
// Returns null if block is hidden or has no content → zero visual impact.
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
// 1. Stats Component as a pure Server Component
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

// SVG Icons for Locations Server Component
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
// 2. Locations Component as a pure Server Component
// ─────────────────────────────────────────────────────────────────────────────
function LandingLocationsServer({ locale }: { locale: Locale }) {
  const t = getT(locale);

  const locations = [
    {
      name: t("landing.headOffice"),
      address: t("landing.headOfficeAddr"),
      phone: "0989 711 888",
    },
    {
      name: t("landing.chinaWarehouse"),
      address: t("landing.chinaWarehouseAddr"),
      phone: "19162296663",
    },
    {
      name: t("landing.bacNinhOffice"),
      address: t("landing.bacNinhOfficeAddr"),
      phone: null,
    },
    {
      name: t("landing.hanoiWarehouse"),
      address: t("landing.hanoiWarehouseAddr"),
      phone: null,
    },
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
// Helper to determine the locale asynchronously on the server
// ─────────────────────────────────────────────────────────────────────────────
async function getLocale(searchParams: Promise<{ lang?: string }>) {
  try {
    const resolvedParams = await searchParams;
    if (resolvedParams.lang && ["vi", "en", "zh"].includes(resolvedParams.lang)) {
      return resolvedParams.lang as Locale;
    }
  } catch {
    // Ignore error
  }

  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("vnl-locale")?.value;
    if (cookieLocale && ["vi", "en", "zh"].includes(cookieLocale)) {
      return cookieLocale as Locale;
    }
  } catch {
    // Ignore error
  }

  return "vi" as Locale;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Main Homepage — Async Server Component
//
// CMS Integration:
//   • Loads homepage_blocks from SystemConfig (key: 'homepage_blocks') via Prisma
//   • banner block visible + imageUrl → CmsBannerSection rendered BEFORE LandingHero
//   • about  block visible + content  → CmsAboutSection rendered between Trust and HowItWorks
//   • All existing components (LandingHero, LandingServices, etc.) always render
//   • On any DB error → cmsBlocks = [], all CMS sections return null → identical to pre-CMS
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

  // Extract typed blocks (undefined if Admin hasn't configured them yet)
  const bannerBlock = cmsBlocks.find((b) => b.type === "banner") as BannerBlock | undefined;
  const aboutBlock  = cmsBlocks.find((b) => b.type === "about")  as AboutBlock  | undefined;

  return (
    <div className="min-h-screen bg-white pb-14 sm:pb-0">
      <LandingNavbar />

      {/* CMS Banner — null if not configured or isVisible=false */}
      {bannerBlock && <CmsBannerSection block={bannerBlock} />}

      {/* Always-on original components (unchanged) */}
      <LandingHero />
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
