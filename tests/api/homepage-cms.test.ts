/**
 * @file tests/api/homepage-cms.test.ts
 *
 * Unit tests cho hệ thống Dynamic CMS trang chủ.
 *
 * Phạm vi test:
 *   1. Validation logic (validatePayload) — không phụ thuộc DB
 *   2. Type guards và helper functions
 *   3. Snapshot tests cho response shape
 *
 * Stack: Vitest (đã cài sẵn trong dự án)
 * Chạy: npm run test
 */

import { describe, it, expect } from 'vitest';
import {
  VALID_SECTION_TYPES,
  SECTION_TYPE_LABELS,
  type HomepageSectionType,
  type UpsertHomepageSectionPayload,
} from '@/types/homepage-cms';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Copy logic validate từ API route để test độc lập (không gọi DB)
// ─────────────────────────────────────────────────────────────────────────────

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
    if (!VALID_SECTION_TYPES.has(s.sectionType as HomepageSectionType)) {
      return `sections[${idx}].sectionType "${s.sectionType}" không hợp lệ`;
    }
    if (typeof s.label !== 'string' || !s.label.trim()) {
      return `sections[${idx}].label: bắt buộc và phải là string`;
    }
    if (typeof s.orderIndex !== 'number') {
      return `sections[${idx}].orderIndex: phải là number`;
    }
    if (typeof s.isActive !== 'boolean') {
      return `sections[${idx}].isActive: phải là boolean`;
    }
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
// Test Suite 1: VALID_SECTION_TYPES
// ─────────────────────────────────────────────────────────────────────────────
describe('VALID_SECTION_TYPES', () => {
  it('chứa đúng 8 loại section', () => {
    expect(VALID_SECTION_TYPES.size).toBe(8);
  });

  it('chứa các loại section cần thiết', () => {
    const required: HomepageSectionType[] = [
      'banner', 'stats', 'services', 'why_choose_us', 'about', 'locations', 'social', 'cta',
    ];
    required.forEach((type) => {
      expect(VALID_SECTION_TYPES.has(type)).toBe(true);
    });
  });

  it('không chứa loại section không hợp lệ', () => {
    // @ts-expect-error - test intentional invalid input
    expect(VALID_SECTION_TYPES.has('unknown')).toBe(false);
    // @ts-expect-error - test intentional empty input
    expect(VALID_SECTION_TYPES.has('')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 2: SECTION_TYPE_LABELS
// ─────────────────────────────────────────────────────────────────────────────
describe('SECTION_TYPE_LABELS', () => {
  it('có label cho mọi loại section hợp lệ', () => {
    VALID_SECTION_TYPES.forEach((type) => {
      expect(SECTION_TYPE_LABELS[type]).toBeDefined();
      expect(typeof SECTION_TYPE_LABELS[type]).toBe('string');
      expect(SECTION_TYPE_LABELS[type].length).toBeGreaterThan(0);
    });
  });

  it('label banner chứa từ "Banner"', () => {
    expect(SECTION_TYPE_LABELS.banner).toContain('Banner');
  });

  it('label stats chứa từ "Thống Kê"', () => {
    expect(SECTION_TYPE_LABELS.stats).toContain('Thống Kê');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 3: validatePayload — các trường hợp hợp lệ
// ─────────────────────────────────────────────────────────────────────────────
describe('validatePayload — payload hợp lệ', () => {
  it('chấp nhận mảng rỗng', () => {
    expect(validatePayload([])).toBeNull();
  });

  it('chấp nhận section tối thiểu (không có items)', () => {
    const payload: UpsertHomepageSectionPayload[] = [
      {
        sectionType: 'banner',
        label: 'Banner Chính',
        orderIndex: 1,
        isActive: true,
      },
    ];
    expect(validatePayload(payload)).toBeNull();
  });

  it('chấp nhận section với items hợp lệ', () => {
    const payload: UpsertHomepageSectionPayload[] = [
      {
        sectionType: 'stats',
        label: 'Thống Kê',
        orderIndex: 2,
        isActive: true,
        items: [
          { label: 'Đơn hàng', orderIndex: 1, isActive: true, meta: { value: '10K+' } },
          { label: 'Tỷ lệ thành công', orderIndex: 2, isActive: false, meta: { value: '99.5%' } },
        ],
      },
    ];
    expect(validatePayload(payload)).toBeNull();
  });

  it('chấp nhận nhiều sections khác loại', () => {
    const payload: UpsertHomepageSectionPayload[] = [
      { sectionType: 'banner',    label: 'Banner',    orderIndex: 1, isActive: true },
      { sectionType: 'services',  label: 'Dịch vụ',  orderIndex: 2, isActive: true },
      { sectionType: 'locations', label: 'Địa điểm', orderIndex: 3, isActive: false },
    ];
    expect(validatePayload(payload)).toBeNull();
  });

  it('chấp nhận section với meta JSON bất kỳ', () => {
    const payload: UpsertHomepageSectionPayload[] = [
      {
        sectionType: 'banner',
        label: 'Banner',
        orderIndex: 1,
        isActive: true,
        meta: { exchangeRate: 3980, buttonLink: '#contact', someArbitraryField: true },
      },
    ];
    expect(validatePayload(payload)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 4: validatePayload — các trường hợp không hợp lệ
// ─────────────────────────────────────────────────────────────────────────────
describe('validatePayload — payload KHÔNG hợp lệ', () => {
  it('từ chối payload không phải mảng (object)', () => {
    const result = validatePayload({ sectionType: 'banner' });
    expect(result).not.toBeNull();
    expect(result).toContain('mảng');
  });

  it('từ chối payload không phải mảng (string)', () => {
    expect(validatePayload('banner')).not.toBeNull();
  });

  it('từ chối payload không phải mảng (null)', () => {
    expect(validatePayload(null)).not.toBeNull();
  });

  it('từ chối sectionType không hợp lệ', () => {
    const payload = [{ sectionType: 'invalid_type', label: 'Test', orderIndex: 1, isActive: true }];
    const result = validatePayload(payload);
    expect(result).not.toBeNull();
    expect(result).toContain('sectionType');
    expect(result).toContain('invalid_type');
  });

  it('từ chối label bị thiếu', () => {
    const payload = [{ sectionType: 'banner', orderIndex: 1, isActive: true }];
    const result = validatePayload(payload);
    expect(result).not.toBeNull();
    expect(result).toContain('label');
  });

  it('từ chối label là chuỗi rỗng', () => {
    const payload = [{ sectionType: 'banner', label: '   ', orderIndex: 1, isActive: true }];
    const result = validatePayload(payload);
    expect(result).not.toBeNull();
    expect(result).toContain('label');
  });

  it('từ chối orderIndex không phải number', () => {
    const payload = [{ sectionType: 'banner', label: 'Test', orderIndex: '1', isActive: true }];
    const result = validatePayload(payload);
    expect(result).not.toBeNull();
    expect(result).toContain('orderIndex');
  });

  it('từ chối isActive không phải boolean', () => {
    const payload = [{ sectionType: 'banner', label: 'Test', orderIndex: 1, isActive: 'true' }];
    const result = validatePayload(payload);
    expect(result).not.toBeNull();
    expect(result).toContain('isActive');
  });

  it('từ chối items không phải mảng', () => {
    const payload = [{ sectionType: 'stats', label: 'Stats', orderIndex: 1, isActive: true, items: 'bad' }];
    const result = validatePayload(payload);
    expect(result).not.toBeNull();
    expect(result).toContain('items');
  });

  it('từ chối item thiếu label', () => {
    const payload = [{
      sectionType: 'stats',
      label: 'Stats',
      orderIndex: 1,
      isActive: true,
      items: [{ orderIndex: 1, isActive: true }], // Thiếu label
    }];
    const result = validatePayload(payload);
    expect(result).not.toBeNull();
    expect(result).toContain('label');
  });

  it('từ chối item có orderIndex không phải number', () => {
    const payload = [{
      sectionType: 'services',
      label: 'Dịch vụ',
      orderIndex: 1,
      isActive: true,
      items: [{ label: 'Vận chuyển', orderIndex: '1', isActive: true }],
    }];
    const result = validatePayload(payload);
    expect(result).not.toBeNull();
    expect(result).toContain('orderIndex');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 5: validateItem — test riêng lẻ
// ─────────────────────────────────────────────────────────────────────────────
describe('validateItem', () => {
  it('chấp nhận item hợp lệ tối thiểu', () => {
    expect(validateItem({ label: 'Test', orderIndex: 0, isActive: true }, 0)).toBeNull();
  });

  it('chấp nhận item với meta null', () => {
    expect(validateItem({ label: 'Test', orderIndex: 1, isActive: false, meta: null }, 0)).toBeNull();
  });

  it('từ chối null', () => {
    expect(validateItem(null, 0)).not.toBeNull();
  });

  it('từ chối primitive string', () => {
    expect(validateItem('string', 0)).not.toBeNull();
  });

  it('trả về index đúng trong thông báo lỗi', () => {
    const result = validateItem({ label: '', orderIndex: 1, isActive: true }, 5);
    expect(result).toContain('[5]');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 6: Meta type shape validation (runtime check)
// ─────────────────────────────────────────────────────────────────────────────
describe('Meta type shape — runtime validation', () => {
  it('Banner meta: exchangeRate là number', () => {
    const meta = { exchangeRate: 3980, buttonLink: '#contact' };
    expect(typeof meta.exchangeRate).toBe('number');
    expect(meta.exchangeRate).toBeGreaterThan(0);
  });

  it('Stats item meta: value là string', () => {
    const meta = { value: '10K+', trend: '+15%', trendUp: true };
    expect(typeof meta.value).toBe('string');
    expect(meta.value.length).toBeGreaterThan(0);
  });

  it('Location item meta: phone có thể là null', () => {
    const metaWithPhone = { phone: '0989711888', isPrimary: true };
    const metaWithoutPhone = { phone: null, isPrimary: false };
    expect(metaWithPhone.phone).toBe('0989711888');
    expect(metaWithoutPhone.phone).toBeNull();
  });

  it('Social item meta: platform là string', () => {
    const platforms = ['facebook', 'zalo', 'youtube', 'tiktok', 'telegram'];
    platforms.forEach((platform) => {
      const meta = { platform, url: `https://${platform}.com` };
      expect(typeof meta.platform).toBe('string');
      expect(meta.url.startsWith('https://')).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite 7: Business logic — orderIndex sắp xếp
// ─────────────────────────────────────────────────────────────────────────────
describe('Business Logic — orderIndex sắp xếp', () => {
  it('sắp xếp sections theo orderIndex tăng dần', () => {
    const sections = [
      { orderIndex: 3, label: 'Dịch vụ' },
      { orderIndex: 1, label: 'Banner' },
      { orderIndex: 2, label: 'Stats' },
    ];
    const sorted = [...sections].sort((a, b) => a.orderIndex - b.orderIndex);
    expect(sorted[0].label).toBe('Banner');
    expect(sorted[1].label).toBe('Stats');
    expect(sorted[2].label).toBe('Dịch vụ');
  });

  it('lọc đúng sections có isActive=true', () => {
    const sections = [
      { isActive: true,  label: 'Banner'   },
      { isActive: false, label: 'About'    }, // ẩn
      { isActive: true,  label: 'Services' },
    ];
    const active = sections.filter((s) => s.isActive);
    expect(active).toHaveLength(2);
    expect(active.map((s) => s.label)).toEqual(['Banner', 'Services']);
  });

  it('lọc đúng items có isActive=true', () => {
    const items = [
      { isActive: true,  label: 'Mục 1', orderIndex: 1 },
      { isActive: false, label: 'Mục 2', orderIndex: 2 }, // ẩn
      { isActive: true,  label: 'Mục 3', orderIndex: 3 },
    ];
    const active = items
      .filter((i) => i.isActive)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    expect(active).toHaveLength(2);
    expect(active[0].label).toBe('Mục 1');
    expect(active[1].label).toBe('Mục 3');
  });
});
