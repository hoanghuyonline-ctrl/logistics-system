/**
 * @file src/app/api/admin/homepage/sections/route.ts
 *
 * ADMIN API: PUT /api/admin/homepage/sections
 *
 * Mục đích:
 *   Cập nhật toàn bộ cấu trúc trang chủ từ Admin Panel.
 *   Một lần gọi duy nhất để đồng bộ tất cả sections + items.
 *
 * Yêu cầu:
 *   • Chỉ ADMIN mới được gọi (kiểm tra session).
 *   • Validate toàn bộ payload trước khi ghi DB.
 *   • Sử dụng Prisma transaction để đảm bảo tính toàn vẹn:
 *       - Upsert section (tạo mới nếu chưa có, update nếu đã có)
 *       - Upsert từng item trong section
 *       - Xóa items không còn trong payload (đã bị Admin xóa)
 *
 * Ưu điểm thiết kế "upsert + delete diff":
 *   • Không xóa toàn bộ DB rồi insert lại (mất history, mất ID)
 *   • An toàn khi mạng bị ngắt giữa chừng (transaction rollback)
 *   • Admin có thể xóa từng mục riêng lẻ mà không mất section
 */
export const dynamic = 'force-dynamic';

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  getCurrentUser,
  hasRole,
  jsonResponse,
  errorResponse,
  withErrorHandler,
} from '@/lib/utils';
import type {
  UpsertHomepageSectionPayload,
  UpsertHomepageItemPayload,
} from '@/types/homepage-cms';
import { VALID_SECTION_TYPES } from '@/types/homepage-cms';

// ─────────────────────────────────────────────────────────────────────────────
// Prisma JSON Helper
// Prisma v7 yêu cầu Prisma.JsonNull (không phải null thuần) cho trường JSONB nullable.
// Hàm này chuyển đổi: null/undefined → Prisma.JsonNull, object → InputJsonValue
// ─────────────────────────────────────────────────────────────────────────────
function toJsonValue(
  val: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (val === null || val === undefined) return Prisma.JsonNull;
  return val as Prisma.InputJsonValue;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Kiểm tra một item payload có hợp lệ không.
 * Trả về chuỗi lỗi nếu không hợp lệ, null nếu hợp lệ.
 */
function validateItem(item: unknown, index: number): string | null {
  if (typeof item !== 'object' || item === null) {
    return `items[${index}]: phải là object`;
  }
  const i = item as Record<string, unknown>;

  if (typeof i.label !== 'string' || !i.label.trim()) {
    return `items[${index}].label: bắt buộc và phải là string`;
  }
  if (typeof i.orderIndex !== 'number') {
    return `items[${index}].orderIndex: phải là number`;
  }
  if (typeof i.isActive !== 'boolean') {
    return `items[${index}].isActive: phải là boolean`;
  }
  return null;
}

/**
 * Kiểm tra toàn bộ payload sections từ Admin.
 * Trả về chuỗi lỗi đầu tiên gặp phải, null nếu hợp lệ.
 */
function validatePayload(body: unknown): string | null {
  if (!Array.isArray(body)) {
    return 'Payload phải là mảng UpsertHomepageSectionPayload[]';
  }

  for (let idx = 0; idx < body.length; idx++) {
    const sec = body[idx];

    if (typeof sec !== 'object' || sec === null) {
      return `sections[${idx}]: phải là object`;
    }

    const s = sec as Record<string, unknown>;

    // Validate sectionType
    if (!VALID_SECTION_TYPES.has(s.sectionType as never)) {
      return `sections[${idx}].sectionType "${s.sectionType}" không hợp lệ. Chỉ chấp nhận: ${[...VALID_SECTION_TYPES].join(', ')}`;
    }

    // Validate label
    if (typeof s.label !== 'string' || !s.label.trim()) {
      return `sections[${idx}].label: bắt buộc và phải là string`;
    }

    // Validate orderIndex
    if (typeof s.orderIndex !== 'number') {
      return `sections[${idx}].orderIndex: phải là number`;
    }

    // Validate isActive
    if (typeof s.isActive !== 'boolean') {
      return `sections[${idx}].isActive: phải là boolean`;
    }

    // Validate items nếu có
    if (s.items !== undefined && s.items !== null) {
      if (!Array.isArray(s.items)) {
        return `sections[${idx}].items: phải là mảng hoặc null`;
      }
      for (let itemIdx = 0; itemIdx < (s.items as unknown[]).length; itemIdx++) {
        const itemErr = validateItem((s.items as unknown[])[itemIdx], itemIdx);
        if (itemErr) return `sections[${idx}] → ${itemErr}`;
      }
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/homepage/sections
// ─────────────────────────────────────────────────────────────────────────────
export const PUT = withErrorHandler(async function PUT(request: Request) {
  // 1. Kiểm tra xác thực — chỉ ADMIN
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ['ADMIN'])) {
    return errorResponse('Forbidden: Chỉ Admin mới có quyền cập nhật trang chủ', 403);
  }

  // 2. Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Request body không phải JSON hợp lệ', 400);
  }

  // 3. Validate toàn bộ payload
  const validationError = validatePayload(body);
  if (validationError) {
    return errorResponse(`Dữ liệu không hợp lệ: ${validationError}`, 400);
  }

  const sections = body as UpsertHomepageSectionPayload[];

  // 4. Lấy danh sách ID sections hiện tại trong DB (để biết cái nào cần xóa)
  const existingSectionIds = new Set(
    (await prisma.homepageSection.findMany({ select: { id: true } })).map((s) => s.id),
  );

  // 5. Thực hiện trong một transaction duy nhất
  await prisma.$transaction(async (tx) => {
    // Tập hợp ID sections mà Admin gửi lên (để diff xóa)
    const incomingSectionIds = new Set<string>();

    for (const sectionPayload of sections) {
      // ── Upsert section ────────────────────────────────────────────────
      const sectionData = {
        sectionType: sectionPayload.sectionType,
        label:       sectionPayload.label,
        orderIndex:  sectionPayload.orderIndex,
        isActive:    sectionPayload.isActive,
        title:       sectionPayload.title ?? null,
        subtitle:    sectionPayload.subtitle ?? null,
        // Prisma v7: dùng Prisma.JsonNull thay vì null thuần cho trường JSONB nullable
        meta:        toJsonValue(sectionPayload.meta),
      };

      let sectionId: string;

      if (sectionPayload.id && existingSectionIds.has(sectionPayload.id)) {
        // Section đã tồn tại → UPDATE
        await tx.homepageSection.update({
          where: { id: sectionPayload.id },
          data: sectionData,
        });
        sectionId = sectionPayload.id;
      } else {
        // Section mới → CREATE (sử dụng id từ payload nếu có, không tự sinh UUID)
        const created = await tx.homepageSection.create({
          data: {
            ...(sectionPayload.id ? { id: sectionPayload.id } : {}),
            ...sectionData,
          },
        });
        sectionId = created.id;
      }

      incomingSectionIds.add(sectionId);

      // ── Xử lý items của section này ───────────────────────────────────
      if (sectionPayload.items && sectionPayload.items.length > 0) {
        // Lấy ID items hiện tại của section này
        const existingItems = await tx.homepageItem.findMany({
          where: { sectionId },
          select: { id: true },
        });
        const existingItemIds = new Set(existingItems.map((i) => i.id));

        // Tập hợp ID items Admin gửi lên
        const incomingItemIds = new Set<string>();

        for (const itemPayload of sectionPayload.items as UpsertHomepageItemPayload[]) {
          const itemData = {
            sectionId,
            label:      itemPayload.label,
            content:    itemPayload.content ?? null,
            icon:       itemPayload.icon ?? null,
            imageUrl:   itemPayload.imageUrl ?? null,
            orderIndex: itemPayload.orderIndex,
            isActive:   itemPayload.isActive,
            // Prisma v7: dùng Prisma.JsonNull thay vì null thuần cho trường JSONB nullable
            meta:       toJsonValue(itemPayload.meta),
          };

          if (itemPayload.id && existingItemIds.has(itemPayload.id)) {
            // Item đã tồn tại → UPDATE
            await tx.homepageItem.update({
              where: { id: itemPayload.id },
              data: itemData,
            });
            incomingItemIds.add(itemPayload.id);
          } else {
            // Item mới → CREATE
            const createdItem = await tx.homepageItem.create({
              data: {
                ...(itemPayload.id ? { id: itemPayload.id } : {}),
                ...itemData,
              },
            });
            incomingItemIds.add(createdItem.id);
          }
        }

        // Xóa items không còn trong payload của section này
        const itemIdsToDelete = [...existingItemIds].filter(
          (id) => !incomingItemIds.has(id),
        );
        if (itemIdsToDelete.length > 0) {
          await tx.homepageItem.deleteMany({
            where: { id: { in: itemIdsToDelete } },
          });
        }
      }
    }

    // ── Xóa sections không còn trong payload ─────────────────────────────
    // (Cascade sẽ tự xóa items con)
    const sectionIdsToDelete = [...existingSectionIds].filter(
      (id) => !incomingSectionIds.has(id),
    );
    if (sectionIdsToDelete.length > 0) {
      await tx.homepageSection.deleteMany({
        where: { id: { in: sectionIdsToDelete } },
      });
    }
  });

  // 6. Log audit (tùy chọn)
  console.info(
    `[CMS] Admin ${user.email ?? user.id} đã cập nhật trang chủ: ${sections.length} sections`,
  );

  return jsonResponse({
    success: true,
    message: `Đã lưu cấu hình trang chủ thành công! (${sections.length} sections)`,
    updatedBy: user.email,
    updatedAt: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/homepage/sections — Lấy toàn bộ (bao gồm isActive=false)
// ─────────────────────────────────────────────────────────────────────────────
export const GET = withErrorHandler(async function GET() {
  // Chỉ Admin mới được đọc toàn bộ (kể cả sections bị ẩn)
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ['ADMIN'])) {
    return errorResponse('Forbidden', 403);
  }

  const sections = await prisma.homepageSection.findMany({
    orderBy: { orderIndex: 'asc' },
    include: {
      // Lấy tất cả items (không lọc isActive) để Admin thấy cả mục đang ẩn
      items: {
        orderBy: { orderIndex: 'asc' },
      },
    },
  });

  return jsonResponse(sections);
});
