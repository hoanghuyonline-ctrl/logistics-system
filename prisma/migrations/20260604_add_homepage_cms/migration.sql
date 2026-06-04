-- ============================================================
-- Migration: Tạo bảng Dynamic CMS cho trang chủ
-- Mục đích: Cho phép Admin chỉnh sửa nội dung trang chủ
--           (text, icon, thứ tự, tỷ giá, link) mà không cần
--           can thiệp vào code nguồn.
-- Tác giả  : Bắc Trung Hải Logistics System
-- Ngày     : 2026-06-04
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Bảng 1: homepage_sections
--   Lưu các khối cấp cao (section) trên trang chủ.
--   Ví dụ: banner, stats, services, about, locations, social, cta
--
--   Cột đặc biệt:
--     • order_index  → Thứ tự hiển thị (ASC). Admin kéo thả để sắp xếp.
--     • is_active    → false = ẩn hoàn toàn khỏi trang chủ (không xóa).
--     • meta (JSONB) → Dữ liệu đặc thù theo loại section:
--         banner  : { exchangeRate: 3980, buttonLink: "#contact", bgColor: "#..." }
--         stats   : { showTrend: true }
--         social  : { platforms: ["facebook", "zalo", "youtube"] }
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "homepage_sections" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "sectionType"  TEXT        NOT NULL,
  "label"        TEXT        NOT NULL,
  "orderIndex"   INTEGER     NOT NULL DEFAULT 0,
  "isActive"     BOOLEAN     NOT NULL DEFAULT true,
  "title"        TEXT,
  "subtitle"     TEXT,
  -- JSONB cho phép query trực tiếp các trường con (ví dụ: meta->>'exchangeRate')
  "meta"         JSONB,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "homepage_sections_pkey" PRIMARY KEY ("id")
);

-- Index tối ưu truy vấn theo loại + trạng thái (dùng trong GET /api/homepage)
CREATE INDEX IF NOT EXISTS "homepage_sections_sectionType_isActive_idx"
  ON "homepage_sections"("sectionType", "isActive");

-- Index theo thứ tự sắp xếp
CREATE INDEX IF NOT EXISTS "homepage_sections_orderIndex_idx"
  ON "homepage_sections"("orderIndex");

-- ────────────────────────────────────────────────────────────
-- Bảng 2: homepage_items
--   Lưu các mục con bên trong một section.
--   Ví dụ: từng dịch vụ (services section), từng địa điểm (locations),
--   từng stat (stats section), từng link mạng xã hội (social section).
--
--   Cột đặc biệt:
--     • order_index  → Thứ tự trong section. Admin sắp xếp độc lập.
--     • is_active    → Ẩn mục mà không xóa (Admin tắt tạm thời).
--     • meta (JSONB) → Dữ liệu đặc thù theo loại section cha:
--         services  : { highlight: true, badge: "Hot" }
--         locations : { phone: "0989711888", mapUrl: "https://...", isPrimary: true }
--         stats     : { value: "10K+", trend: "+12%", trendUp: true }
--         social    : { platform: "facebook", url: "https://facebook.com/..." }
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "homepage_items" (
  "id"         TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "sectionId"  TEXT        NOT NULL,
  "label"      TEXT        NOT NULL,
  "content"    TEXT,
  "icon"       TEXT,
  "imageUrl"   TEXT,
  "orderIndex" INTEGER     NOT NULL DEFAULT 0,
  "isActive"   BOOLEAN     NOT NULL DEFAULT true,
  "meta"       JSONB,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "homepage_items_pkey" PRIMARY KEY ("id"),

  -- Khi xóa section cha → tự động xóa toàn bộ items con (CASCADE)
  CONSTRAINT "homepage_items_sectionId_fkey"
    FOREIGN KEY ("sectionId")
    REFERENCES "homepage_sections"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- Index tối ưu truy vấn items theo section + thứ tự
CREATE INDEX IF NOT EXISTS "homepage_items_sectionId_orderIndex_idx"
  ON "homepage_items"("sectionId", "orderIndex");

-- ────────────────────────────────────────────────────────────
-- Trigger: Tự động cập nhật updatedAt khi có thay đổi
-- (Prisma tự xử lý updatedAt, nhưng trigger DB đảm bảo an toàn
--  khi có truy vấn SQL thô từ migration seeds)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Áp dụng trigger cho homepage_sections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_homepage_sections_updated_at'
  ) THEN
    CREATE TRIGGER set_homepage_sections_updated_at
      BEFORE UPDATE ON "homepage_sections"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Áp dụng trigger cho homepage_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_homepage_items_updated_at'
  ) THEN
    CREATE TRIGGER set_homepage_items_updated_at
      BEFORE UPDATE ON "homepage_items"
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- Dữ liệu mẫu (Seed) — Cấu hình mặc định khi hệ thống khởi động lần đầu.
-- Admin có thể thay đổi toàn bộ sau khi deploy.
-- INSERT ... ON CONFLICT DO NOTHING để idempotent (chạy lại an toàn).
-- ────────────────────────────────────────────────────────────
INSERT INTO "homepage_sections"
  ("id", "sectionType", "label", "orderIndex", "isActive", "title", "subtitle", "meta")
VALUES
  -- Banner chính: tỷ giá 3980 lưu trong meta để Admin chỉnh không cần code
  (
    'sec-banner-001', 'banner', 'Banner Chính', 1, true,
    'BẮC TRUNG HẢI LOGISTICS',
    'Giải pháp vận tải toàn diện, uy tín hàng đầu',
    '{"exchangeRate": 3980, "buttonText": "Liên hệ ngay", "buttonLink": "#contact", "cardTitle": "Bắc Trung Hải Logistics", "cardDesc": "Vận tải hiệu quả, an toàn tối đa", "bgImageUrl": ""}'::jsonb
  ),
  -- Thống kê
  (
    'sec-stats-001', 'stats', 'Thống Kê Nổi Bật', 2, true,
    NULL, NULL,
    '{"showTrend": false}'::jsonb
  ),
  -- Dịch vụ
  (
    'sec-services-001', 'services', 'Dịch Vụ Nổi Bật', 3, true,
    'Dịch Vụ Nổi Bật', 'Hệ thống dịch vụ logistics toàn diện',
    '{"columns": 4}'::jsonb
  ),
  -- Giới thiệu
  (
    'sec-about-001', 'about', 'Về Chúng Tôi', 4, true,
    'Về Chúng Tôi',
    'Đối tác logistics tin cậy của bạn',
    '{"imageUrl": "https://images.unsplash.com/photo-1578575437130-527eed3abbec"}'::jsonb
  ),
  -- Địa điểm
  (
    'sec-locations-001', 'locations', 'Địa Điểm & Kho Bãi', 5, true,
    'Hệ Thống Kho Bãi Toàn Quốc',
    'Mạng lưới kho bãi phủ rộng từ Trung Quốc đến Việt Nam',
    NULL
  ),
  -- Mạng xã hội
  (
    'sec-social-001', 'social', 'Mạng Xã Hội', 6, true,
    NULL, NULL,
    '{"showInFooter": true, "showInFloatingCTA": true}'::jsonb
  )
ON CONFLICT ("id") DO NOTHING;

-- Seed items cho section Stats
INSERT INTO "homepage_items"
  ("id", "sectionId", "label", "content", "icon", "orderIndex", "isActive", "meta")
VALUES
  ('item-stat-001', 'sec-stats-001', 'Đơn Hàng Đã Xử Lý', 'Tổng đơn hàng thành công', '📦', 1, true, '{"value": "10K+", "trend": "+15%", "trendUp": true}'::jsonb),
  ('item-stat-002', 'sec-stats-001', 'Tỷ Lệ Giao Thành Công', 'Cam kết chất lượng cao nhất', '✅', 2, true, '{"value": "99.5%", "trend": "ổn định", "trendUp": true}'::jsonb),
  ('item-stat-003', 'sec-stats-001', 'Thời Gian Vận Chuyển', 'Trung bình từ Trung Quốc về Việt Nam', '⚡', 3, true, '{"value": "5-7", "unit": "ngày", "trendUp": true}'::jsonb),
  ('item-stat-004', 'sec-stats-001', 'Hỗ Trợ Khách Hàng', 'Đội ngũ tư vấn luôn sẵn sàng', '🎧', 4, true, '{"value": "24/7", "trendUp": true}'::jsonb)
ON CONFLICT ("id") DO NOTHING;

-- Seed items cho section Dịch vụ
INSERT INTO "homepage_items"
  ("id", "sectionId", "label", "content", "icon", "orderIndex", "isActive", "meta")
VALUES
  ('item-svc-001', 'sec-services-001', 'Mua Hàng Trung Quốc', 'Đặt hàng Taobao, 1688, Tmall trọn gói - phí dịch vụ thấp, thanh toán an toàn', '🛒', 1, true, '{"highlight": false, "badge": ""}'::jsonb),
  ('item-svc-002', 'sec-services-001', 'Vận Chuyển Nhanh', 'Tuyến Việt - Trung với nhiều cung đường, 5-7 ngày về đến kho Hà Nội', '🚚', 2, true, '{"highlight": true, "badge": "Phổ biến"}'::jsonb),
  ('item-svc-003', 'sec-services-001', 'Kho Bãi Chuyên Nghiệp', 'Hệ thống kho Quảng Châu, Nam Ninh, Hà Nội với camera 24/7', '🏭', 3, true, '{"highlight": false, "badge": ""}'::jsonb),
  ('item-svc-004', 'sec-services-001', 'Thủ Tục Hải Quan', 'Hỗ trợ khai báo hải quan, giấy tờ xuất nhập khẩu chuyên nghiệp', '📋', 4, true, '{"highlight": false, "badge": ""}'::jsonb)
ON CONFLICT ("id") DO NOTHING;

-- Seed items cho section Địa điểm
INSERT INTO "homepage_items"
  ("id", "sectionId", "label", "content", "icon", "orderIndex", "isActive", "meta")
VALUES
  (
    'item-loc-001', 'sec-locations-001',
    'Trụ Sở Hà Nội (Văn Phòng Chính)',
    'Số 123, Đường Láng, Đống Đa, Hà Nội',
    '🏢', 1, true,
    '{"phone": "0989711888", "mapUrl": "", "isPrimary": true}'::jsonb
  ),
  (
    'item-loc-002', 'sec-locations-001',
    'Kho Trung Quốc (Quảng Châu)',
    'Guangzhou, Guangdong Province, China',
    '🇨🇳', 2, true,
    '{"phone": "19162296663", "mapUrl": "", "isPrimary": false}'::jsonb
  ),
  (
    'item-loc-003', 'sec-locations-001',
    'Văn Phòng Bắc Ninh',
    'KCN Tiên Sơn, Bắc Ninh',
    '📍', 3, true,
    '{"phone": null, "mapUrl": "", "isPrimary": false}'::jsonb
  ),
  (
    'item-loc-004', 'sec-locations-001',
    'Kho Hà Nội',
    'Long Biên, Hà Nội',
    '📦', 4, true,
    '{"phone": null, "mapUrl": "", "isPrimary": false}'::jsonb
  )
ON CONFLICT ("id") DO NOTHING;

-- Seed items cho section Mạng xã hội
INSERT INTO "homepage_items"
  ("id", "sectionId", "label", "content", "icon", "orderIndex", "isActive", "meta")
VALUES
  ('item-social-001', 'sec-social-001', 'Facebook', 'Trang Fanpage chính thức', '📘', 1, true, '{"platform": "facebook", "url": "https://facebook.com/bactrunghai"}'::jsonb),
  ('item-social-002', 'sec-social-001', 'Zalo', 'Chat trực tiếp qua Zalo', '💬', 2, true, '{"platform": "zalo", "url": "https://zalo.me/bactrunghai"}'::jsonb),
  ('item-social-003', 'sec-social-001', 'YouTube', 'Kênh video hướng dẫn', '▶️', 3, true, '{"platform": "youtube", "url": ""}'::jsonb)
ON CONFLICT ("id") DO NOTHING;
