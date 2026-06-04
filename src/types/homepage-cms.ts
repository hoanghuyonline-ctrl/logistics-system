/**
 * @file src/types/homepage-cms.ts
 *
 * Định nghĩa kiểu TypeScript cho hệ thống Dynamic CMS trang chủ.
 *
 * Kiến trúc 2 lớp:
 *   • HomepageSectionType  — enum các loại section được hỗ trợ
 *   • HomepageSectionDto   — dữ liệu section trả về từ API (bao gồm items)
 *   • HomepageItemDto      — dữ liệu từng mục con trong section
 *   • Meta types           — kiểu dữ liệu trường `meta` theo từng loại section
 */

// ─────────────────────────────────────────────────────────────────────────────
// Enum loại section
// ─────────────────────────────────────────────────────────────────────────────

/** Các loại section được hỗ trợ trong Dynamic CMS */
export type HomepageSectionType =
  | 'banner'      // Banner chính (title, subtitle, ảnh nền, tỷ giá, CTA)
  | 'stats'       // Thống kê nổi bật (10K+ đơn, 99.5%, v.v.)
  | 'services'    // Dịch vụ nổi bật (grid card)
  | 'about'       // Giới thiệu công ty
  | 'locations'   // Địa điểm & kho bãi
  | 'social'      // Mạng xã hội
  | 'cta';        // Call-to-action cuối trang

// ─────────────────────────────────────────────────────────────────────────────
// Meta types — dữ liệu JSON đặc thù theo từng loại
// ─────────────────────────────────────────────────────────────────────────────

/** Meta cho section loại 'banner' */
export interface BannerSectionMeta {
  /** Tỷ giá CNY→VND hiện tại (ví dụ: 3980) — hiển thị trên trang chủ */
  exchangeRate?: number;
  /** Văn bản nút CTA chính */
  buttonText?: string;
  /** Đường dẫn nút CTA (hash hoặc URL đầy đủ) */
  buttonLink?: string;
  /** Tiêu đề card phụ bên phải hero */
  cardTitle?: string;
  /** Mô tả card phụ */
  cardDesc?: string;
  /** URL ảnh nền banner (để trống → dùng ảnh mặc định) */
  bgImageUrl?: string;
}

/** Meta cho section loại 'stats' */
export interface StatsSectionMeta {
  /** Hiển thị chỉ số trend hay không */
  showTrend?: boolean;
}

/** Meta cho item trong section 'stats' */
export interface StatsItemMeta {
  /** Giá trị hiển thị lớn (ví dụ: "10K+", "99.5%", "5-7") */
  value: string;
  /** Đơn vị đi kèm value (ví dụ: "ngày", "%") */
  unit?: string;
  /** Chỉ số xu hướng (ví dụ: "+15%", "ổn định") */
  trend?: string;
  /** true = tăng (màu xanh), false = giảm (màu đỏ) */
  trendUp?: boolean;
}

/** Meta cho section loại 'services' */
export interface ServicesSectionMeta {
  /** Số cột trên desktop (mặc định: 4) */
  columns?: number;
}

/** Meta cho item trong section 'services' */
export interface ServicesItemMeta {
  /** Làm nổi bật card (border màu, shadow đậm hơn) */
  highlight?: boolean;
  /** Nhãn badge (ví dụ: "Phổ biến", "Hot", "Mới") */
  badge?: string;
}

/** Meta cho section loại 'about' */
export interface AboutSectionMeta {
  /** URL ảnh minh họa bên phải */
  imageUrl?: string;
}

/** Meta cho item trong section 'locations' */
export interface LocationItemMeta {
  /** Số điện thoại liên hệ */
  phone?: string | null;
  /** Link Google Maps */
  mapUrl?: string;
  /** true = địa điểm chính/trụ sở (hiển thị badge "Trụ sở chính") */
  isPrimary?: boolean;
}

/** Meta cho item trong section 'social' */
export interface SocialItemMeta {
  /** Tên nền tảng ('facebook' | 'zalo' | 'youtube' | 'tiktok' | 'telegram') */
  platform: string;
  /** URL đầy đủ đến trang mạng xã hội */
  url: string;
}

/** Meta cho section loại 'social' */
export interface SocialSectionMeta {
  /** Hiển thị trong Footer */
  showInFooter?: boolean;
  /** Hiển thị trong Floating CTA button */
  showInFloatingCTA?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// DTO (Data Transfer Object) — shape trả về từ API
// ─────────────────────────────────────────────────────────────────────────────

/** Dữ liệu một mục con trong section, đã được fetch từ DB */
export interface HomepageItemDto {
  id: string;
  sectionId: string;
  label: string;
  content: string | null;
  icon: string | null;
  imageUrl: string | null;
  orderIndex: number;
  isActive: boolean;
  /** Dữ liệu JSON đặc thù, cast sang kiểu tương ứng ở component */
  meta: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

/** Dữ liệu một section trang chủ, bao gồm danh sách items đã sắp xếp */
export interface HomepageSectionDto {
  id: string;
  sectionType: HomepageSectionType;
  label: string;
  orderIndex: number;
  isActive: boolean;
  title: string | null;
  subtitle: string | null;
  /** Dữ liệu JSON đặc thù của section */
  meta: Record<string, unknown> | null;
  /** Items đã lọc isActive=true và sắp xếp theo orderIndex (trong GET public) */
  items: HomepageItemDto[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Request body types — dùng trong PUT /api/admin/homepage/sections
// ─────────────────────────────────────────────────────────────────────────────

/** Body của một item khi Admin gửi lên để upsert */
export interface UpsertHomepageItemPayload {
  id?: string;           // Có → UPDATE, không có → CREATE
  label: string;
  content?: string | null;
  icon?: string | null;
  imageUrl?: string | null;
  orderIndex: number;
  isActive: boolean;
  meta?: Record<string, unknown> | null;
}

/** Body của một section khi Admin gửi lên để upsert */
export interface UpsertHomepageSectionPayload {
  id?: string;           // Có → UPDATE, không có → CREATE
  sectionType: HomepageSectionType;
  label: string;
  orderIndex: number;
  isActive: boolean;
  title?: string | null;
  subtitle?: string | null;
  meta?: Record<string, unknown> | null;
  /** Danh sách items của section này */
  items?: UpsertHomepageItemPayload[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Hằng số cấu hình
// ─────────────────────────────────────────────────────────────────────────────

/** Các loại section hợp lệ — dùng để validate đầu vào từ Admin */
export const VALID_SECTION_TYPES = new Set<HomepageSectionType>([
  'banner', 'stats', 'services', 'about', 'locations', 'social', 'cta',
]);

/** Label hiển thị cho từng loại section trong Admin UI */
export const SECTION_TYPE_LABELS: Record<HomepageSectionType, string> = {
  banner:    '🖼️ Banner Chính',
  stats:     '📊 Thống Kê',
  services:  '⚙️ Dịch Vụ',
  about:     'ℹ️ Giới Thiệu',
  locations: '📍 Địa Điểm',
  social:    '🌐 Mạng Xã Hội',
  cta:       '📣 Kêu Gọi Hành Động',
};
