/**
 * @file src/app/api/homepage/route.ts
 *
 * API CÔNG KHAI: GET /api/homepage
 *
 * Mục đích:
 *   Trả về cấu trúc JSON đầy đủ của trang chủ để Client-side
 *   (hoặc Server Component) render động. Không yêu cầu xác thực.
 *
 * Logic xử lý:
 *   1. Ưu tiên đọc từ bảng HomepageSection (hệ thống CMS mới).
 *   2. Fallback về SystemConfig key "homepage_blocks" (hệ thống cũ).
 *   3. Lọc isActive=true, sắp xếp theo orderIndex ASC.
 *   4. Mỗi section bao gồm items (đã lọc + sắp xếp) trong 1 query JOIN.
 *
 * Cache:
 *   force-dynamic — tắt cache để Admin update thấy ngay.
 *   Nếu trang chủ cần SSG cache, đổi thành revalidate = 60 (giây).
 *
 * Response shape: HomepageSectionDto[]
 */
export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { jsonResponse, errorResponse } from '@/lib/utils';
import type { HomepageSectionDto, HomepageItemDto } from '@/types/homepage-cms';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: map Prisma record → DTO (serializable, no Prisma-specific types)
// ─────────────────────────────────────────────────────────────────────────────
function mapItemToDto(item: {
  id: string;
  sectionId: string;
  label: string;
  content: string | null;
  icon: string | null;
  imageUrl: string | null;
  orderIndex: number;
  isActive: boolean;
  meta: unknown;
  createdAt: Date;
  updatedAt: Date;
}): HomepageItemDto {
  return {
    id: item.id,
    sectionId: item.sectionId,
    label: item.label,
    content: item.content,
    icon: item.icon,
    imageUrl: item.imageUrl,
    orderIndex: item.orderIndex,
    isActive: item.isActive,
    meta: (item.meta as Record<string, unknown> | null) ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function mapSectionToDto(section: {
  id: string;
  sectionType: string;
  label: string;
  orderIndex: number;
  isActive: boolean;
  title: string | null;
  subtitle: string | null;
  meta: unknown;
  createdAt: Date;
  updatedAt: Date;
  items: Parameters<typeof mapItemToDto>[0][];
}): HomepageSectionDto {
  return {
    id: section.id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sectionType: section.sectionType as any,
    label: section.label,
    orderIndex: section.orderIndex,
    isActive: section.isActive,
    title: section.title,
    subtitle: section.subtitle,
    meta: (section.meta as Record<string, unknown> | null) ?? null,
    items: section.items.map(mapItemToDto),
    createdAt: section.createdAt.toISOString(),
    updatedAt: section.updatedAt.toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/homepage — Công khai, không cần auth
// ─────────────────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    // 1. Thử đọc từ bảng HomepageSection (CMS mới)
    const sections = await prisma.homepageSection.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        orderIndex: 'asc',
      },
      include: {
        // Chỉ lấy items đang active, sắp xếp theo orderIndex
        items: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    // Nếu bảng mới có dữ liệu → trả về luôn
    if (sections.length > 0) {
      const dto: HomepageSectionDto[] = sections.map(mapSectionToDto);
      return jsonResponse({
        source: 'cms_sections', // Cho Client biết nguồn dữ liệu (debug)
        sections: dto,
      });
    }

    // 2. Fallback → SystemConfig (hệ thống cũ, tương thích ngược)
    const legacyRecord = await prisma.systemConfig.findUnique({
      where: { key: 'homepage_blocks' },
    });

    if (legacyRecord?.value) {
      try {
        const legacyBlocks = JSON.parse(legacyRecord.value);
        return jsonResponse({
          source: 'legacy_config', // Báo hiệu đang dùng dữ liệu cũ
          sections: legacyBlocks,
        });
      } catch {
        // JSON parse lỗi → trả về mảng rỗng, client dùng hardcode
      }
    }

    // 3. Không có gì trong DB → client dùng dữ liệu hardcode mặc định
    return jsonResponse({ source: 'default', sections: [] });
  } catch (err) {
    // Lỗi DB → không crash trang chủ, chỉ log và trả về mảng rỗng
    console.error('[GET /api/homepage] DB error:', err);
    return errorResponse('Không thể tải cấu hình trang chủ', 500);
  }
}
