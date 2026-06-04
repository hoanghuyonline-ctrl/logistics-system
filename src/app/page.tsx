/**
 * src/app/page.tsx — Trang chủ Bắc Trung Hải Logistics
 *
 * Server Component: fetch dữ liệu CMS trực tiếp qua Prisma (không gọi HTTP /api/homepage)
 * để tránh network round-trip không cần thiết (Next.js best practice).
 *
 * Render động theo sectionType:
 *   banner        → CmsBannerSection  (hero lớn + tỷ giá từ meta.exchangeRate)
 *   stats         → CmsStatsSection   (4 chỉ số nổi bật)
 *   services      → CmsServicesSection (grid card dịch vụ)
 *   why_choose_us → CmsWhyChooseUs    (benefits grid với icon/text động)
 *   about         → CmsAboutSection   (2 cột: text + ảnh)
 *   locations     → CmsLocationsSection (địa điểm + kho bãi)
 *
 * Fallback: khi DB rỗng → render các component hardcode LandingXxx đã có.
 */

import { cookies } from 'next/headers';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import type { Locale } from '@/lib/i18n/types';
import type {
  HomepageSectionDto,
  HomepageItemDto,
  BannerSectionMeta,
  StatsItemMeta,
  ServicesItemMeta,
  LocationItemMeta,
  WhyChooseUsItemMeta,
} from '@/types/homepage-cms';

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
} from '@/components/landing';

// ─────────────────────────────────────────────────────────────────────────────
// Data fetching — Prisma trực tiếp (Server Component)
// ─────────────────────────────────────────────────────────────────────────────
async function getCmsSections(): Promise<HomepageSectionDto[]> {
  try {
    const rows = await prisma.homepageSection.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
      include: {
        items: { where: { isActive: true }, orderBy: { orderIndex: 'asc' } },
      },
    });
    if (!rows.length) return [];
    // Serialize Prisma objects → plain DTO (Dates → ISO strings)
    return rows.map((s) => ({
      id: s.id,
      sectionType: s.sectionType as HomepageSectionDto['sectionType'],
      label: s.label,
      orderIndex: s.orderIndex,
      isActive: s.isActive,
      title: s.title,
      subtitle: s.subtitle,
      meta: (s.meta as Record<string, unknown> | null) ?? null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      items: s.items.map((i) => ({
        id: i.id,
        sectionId: i.sectionId,
        label: i.label,
        content: i.content,
        icon: i.icon,
        imageUrl: i.imageUrl,
        orderIndex: i.orderIndex,
        isActive: i.isActive,
        meta: (i.meta as Record<string, unknown> | null) ?? null,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
      })),
    }));
  } catch {
    return [];
  }
}

async function getLocale(searchParams: Promise<{ lang?: string }>) {
  try {
    const p = await searchParams;
    if (p.lang && ['vi', 'en', 'zh'].includes(p.lang)) return p.lang as Locale;
  } catch { /* ignore */ }
  try {
    const c = await cookies();
    const v = c.get('vnl-locale')?.value;
    if (v && ['vi', 'en', 'zh'].includes(v)) return v as Locale;
  } catch { /* ignore */ }
  return 'vi' as Locale;
}

// ─────────────────────────────────────────────────────────────────────────────
// CMS Sub-Components (Server Components — không cần 'use client')
// ─────────────────────────────────────────────────────────────────────────────

/** Banner hero lớn — đọc tỷ giá từ meta.exchangeRate */
function CmsBannerSection({ section }: { section: HomepageSectionDto }) {
  const meta = section.meta as BannerSectionMeta | null;
  const rate = meta?.exchangeRate ?? 3980;
  const buttonText = meta?.buttonText ?? 'Liên hệ ngay';
  const buttonLink = meta?.buttonLink ?? '#contact';
  const cardTitle  = meta?.cardTitle  ?? 'Bắc Trung Hải Logistics';
  const cardDesc   = meta?.cardDesc   ?? 'Vận tải hiệu quả, an toàn tối đa';

  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.15),transparent_60%)]" />
      {meta?.bgImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={meta.bgImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity" />
      )}

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-28 lg:pt-32 lg:pb-40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left — headline + CTA */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tỷ giá badge — dữ liệu từ DB, Admin sửa không cần code */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border border-orange-500/30 bg-orange-950/20 text-orange-400">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              Tỷ giá CNY→VND hôm nay:{' '}
              <span className="font-bold text-orange-300">
                {rate.toLocaleString('vi-VN')} ₫
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
              {section.title ?? 'Giải pháp vận tải toàn diện'}
              <br />
              <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 bg-clip-text text-transparent">
                {section.subtitle ?? 'Kết nối giao thương, nâng tầm logistics'}
              </span>
            </h1>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href={buttonLink}
                className="inline-flex items-center px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-600/20 hover:-translate-y-0.5 transition-all duration-200 text-sm"
              >
                {buttonText}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-7 py-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-200 font-bold rounded-xl hover:-translate-y-0.5 transition-all duration-200 text-sm"
              >
                Đăng nhập hệ thống
              </Link>
            </div>
          </div>

          {/* Right — card phụ */}
          <div className="hidden lg:col-span-4 lg:flex justify-center">
            <div className="relative w-72 h-72 rounded-3xl border border-slate-800 bg-slate-900/30 p-8 shadow-2xl flex flex-col justify-between overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent" />
              <div className="flex justify-between items-start">
                <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.59 2.5a6 6 0 0 0-5.84 7.38h4.8" />
                  </svg>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-orange-500/60 border border-orange-500/30 px-2.5 py-1 rounded-full">Active</span>
              </div>
              <div className="space-y-2">
                <h4 className="text-slate-400 text-xs font-semibold tracking-wide uppercase">{cardTitle}</h4>
                <p className="text-white font-extrabold text-lg leading-tight">{cardDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Thống kê số liệu — items từ DB */
function CmsStatsSection({ section }: { section: HomepageSectionDto }) {
  return (
    <section className="border-y border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {section.items.map((item, i) => {
            const m = item.meta as StatsItemMeta | null;
            return (
              <div key={item.id} className={`text-center ${i < section.items.length - 1 ? 'lg:border-r lg:border-slate-200' : ''}`}>
                <div className="text-3xl font-bold text-indigo-700">{m?.value ?? item.label}</div>
                {m?.unit && <div className="text-sm text-indigo-400 font-medium">{m.unit}</div>}
                <p className="text-sm text-slate-500 mt-1">{item.content ?? item.label}</p>
                {m?.trend && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${m.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {m.trend}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Dịch vụ nổi bật — grid card tối màu */
function CmsServicesSection({ section }: { section: HomepageSectionDto }) {
  const cols = section.items.length <= 2 ? 'lg:grid-cols-2' : section.items.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';

  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5 blur-3xl bg-blue-500" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        {(section.title || section.subtitle) && (
          <div className="text-center mb-16 space-y-4">
            {section.title && <h2 className="text-3xl lg:text-5xl font-extrabold text-white tracking-tight">{section.title}</h2>}
            {section.subtitle && <p className="text-slate-400 max-w-2xl mx-auto text-lg">{section.subtitle}</p>}
          </div>
        )}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${cols} gap-8`}>
          {section.items.map((item) => {
            const m = item.meta as ServicesItemMeta | null;
            return (
              <div key={item.id} className={`relative group rounded-3xl p-8 bg-slate-950 border transition-all duration-300 hover:-translate-y-1.5 shadow-xl ${m?.highlight ? 'border-orange-500/40' : 'border-slate-800/80 hover:border-orange-500/40'}`}>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-600 to-amber-500 rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                {m?.badge && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {m.badge}
                  </span>
                )}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-2xl">
                  {item.icon ?? '⚙️'}
                </div>
                <h3 className="text-lg font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">{item.label}</h3>
                {item.content && <p className="text-sm text-slate-400 leading-relaxed">{item.content}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Lý do chọn chúng tôi — benefits grid với icon + văn bản động */
const COLOR_MAP: Record<string, { bg: string; fg: string }> = {
  blue:    { bg: 'bg-blue-50',    fg: 'text-blue-600'    },
  emerald: { bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  amber:   { bg: 'bg-amber-50',   fg: 'text-amber-600'   },
  purple:  { bg: 'bg-purple-50',  fg: 'text-purple-600'  },
  orange:  { bg: 'bg-orange-50',  fg: 'text-orange-600'  },
  indigo:  { bg: 'bg-indigo-50',  fg: 'text-indigo-600'  },
};

function CmsWhyChooseUsSection({ section }: { section: HomepageSectionDto }) {
  const colors = ['blue', 'emerald', 'amber', 'purple', 'orange', 'indigo'];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {(section.title || section.subtitle) && (
          <div className="text-center mb-10">
            {section.title && <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">{section.title}</h2>}
            {section.subtitle && <p className="mt-2 text-sm text-slate-500">{section.subtitle}</p>}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {section.items.map((item, idx) => {
            const m = item.meta as WhyChooseUsItemMeta | null;
            const colorKey = m?.color ?? colors[idx % colors.length];
            const { bg, fg } = COLOR_MAP[colorKey] ?? COLOR_MAP.blue;
            return (
              <div key={item.id} className="rounded-xl border border-slate-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-3 text-xl ${bg} ${fg}`}>
                  {item.icon ?? '✅'}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{item.label}</h3>
                {item.content && <p className="text-xs text-slate-500 leading-relaxed">{item.content}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Giới thiệu công ty — 2 cột text + ảnh */
function CmsAboutSection({ section }: { section: HomepageSectionDto }) {
  const imageUrl = (section.meta as { imageUrl?: string } | null)?.imageUrl;
  return (
    <section className="py-16 md:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="space-y-5">
            {section.title && <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">{section.title}</h2>}
            {section.subtitle && <p className="text-slate-600 leading-relaxed text-base md:text-lg whitespace-pre-line">{section.subtitle}</p>}
            {section.items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <span className="text-xl shrink-0 mt-0.5">{item.icon ?? '✓'}</span>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{item.label}</p>
                  {item.content && <p className="text-slate-500 text-sm mt-0.5">{item.content}</p>}
                </div>
              </div>
            ))}
          </div>
          {imageUrl && (
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-100 h-72 md:h-96">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={section.title ?? ''} className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** Địa điểm & kho bãi */
function CmsLocationsSection({ section }: { section: HomepageSectionDto }) {
  return (
    <section className="py-20 lg:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {(section.title || section.subtitle) && (
          <div className="text-center mb-14">
            {section.title && <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">{section.title}</h2>}
            {section.subtitle && <p className="mt-3 text-lg text-slate-500 max-w-2xl mx-auto">{section.subtitle}</p>}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {section.items.map((item) => {
            const m = item.meta as LocationItemMeta | null;
            return (
              <div key={item.id} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-300">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600 text-lg shrink-0 mt-0.5">
                    {item.icon ?? '📍'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-indigo-900">{item.label}</h3>
                      {m?.isPrimary && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">Trụ sở chính</span>
                      )}
                    </div>
                    {item.content && <p className="text-sm text-slate-500 leading-relaxed mt-1">{item.content}</p>}
                    {m?.phone && (
                      <a href={`tel:${m.phone}`} className="mt-2 flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                        📞 {m.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dispatcher — map sectionType → Component
// ─────────────────────────────────────────────────────────────────────────────
function renderSection(section: HomepageSectionDto) {
  switch (section.sectionType) {
    case 'banner':        return <CmsBannerSection        key={section.id} section={section} />;
    case 'stats':         return <CmsStatsSection         key={section.id} section={section} />;
    case 'services':      return <CmsServicesSection      key={section.id} section={section} />;
    case 'why_choose_us': return <CmsWhyChooseUsSection   key={section.id} section={section} />;
    case 'about':         return <CmsAboutSection         key={section.id} section={section} />;
    case 'locations':     return <CmsLocationsSection     key={section.id} section={section} />;
    default:              return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const [cmsSections] = await Promise.all([
    getCmsSections(),
    getLocale(searchParams), // locale dùng nếu cần sau
  ]);

  // Nếu CMS đã có dữ liệu → render hoàn toàn từ DB
  if (cmsSections.length > 0) {
    return (
      <div className="min-h-screen bg-white pb-14 sm:pb-0">
        <LandingNavbar />
        {cmsSections.map(renderSection)}
        <LandingHowItWorks />
        <LandingOrderTracking />
        <LandingLeadForm />
        <LandingCTA />
        <LandingFooter />
        <LandingFloatingCTA />
        <LandingMobileBar />
      </div>
    );
  }

  // Fallback: DB chưa có dữ liệu CMS → render hardcode components cũ
  return (
    <div className="min-h-screen bg-white pb-14 sm:pb-0">
      <LandingNavbar />
      <LandingHero />
      <LandingTrust />
      <LandingServices />
      <LandingHowItWorks />
      <LandingOrderTracking />
      <LandingLeadForm />
      <LandingCTA />
      <LandingFooter />
      <LandingFloatingCTA />
      <LandingMobileBar />
    </div>
  );
}
