import { describe, it, expect } from "vitest";
import { parseSections } from "@/lib/knowledge-import";

describe("parseSections", () => {
  it("splits by # headings", () => {
    const text = `# Giờ làm việc
Công ty làm việc từ 8:00 đến 17:30.

# Cách nạp tiền
Khách hàng có thể nạp tiền bằng chuyển khoản.`;

    const sections = parseSections(text);
    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe("Giờ làm việc");
    expect(sections[0].content).toContain("8:00");
    expect(sections[1].title).toBe("Cách nạp tiền");
    expect(sections[1].content).toContain("chuyển khoản");
  });

  it("splits by ## headings", () => {
    const text = `## Chính sách đổi trả
Hàng hóa có thể đổi trả trong 7 ngày.

## Phí vận chuyển
Phí tính theo cân nặng.`;

    const sections = parseSections(text);
    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe("Chính sách đổi trả");
    expect(sections[1].title).toBe("Phí vận chuyển");
  });

  it("splits by colon-ending lines", () => {
    const text = `Giờ làm việc:
Từ Thứ 2 đến Thứ 7, 8:00 - 17:30.

Cách tạo đơn hàng:
Đăng nhập, nhấn Tạo đơn, dán link sản phẩm.`;

    const sections = parseSections(text);
    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe("Giờ làm việc");
    expect(sections[1].title).toBe("Cách tạo đơn hàng");
  });

  it("ignores sections with empty content", () => {
    const text = `# Empty section

# Real section
Some real content here.`;

    const sections = parseSections(text);
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe("Real section");
  });

  it("returns empty array for text without headings", () => {
    const text = "Just some plain text without any headings or structure.";
    const sections = parseSections(text);
    expect(sections).toHaveLength(0);
  });

  it("ignores short colon lines (< 4 chars before colon)", () => {
    const text = `# Title
Content here.
VD:
More content.`;

    const sections = parseSections(text);
    expect(sections).toHaveLength(1);
    expect(sections[0].content).toContain("VD:");
  });

  it("handles mixed heading styles", () => {
    const text = `# First heading
Content one.

Giờ hoạt động:
Content two.

## Third heading
Content three.`;

    const sections = parseSections(text);
    expect(sections).toHaveLength(3);
    expect(sections[0].title).toBe("First heading");
    expect(sections[1].title).toBe("Giờ hoạt động");
    expect(sections[2].title).toBe("Third heading");
  });

  it("preserves multi-line content", () => {
    const text = `# Thông tin liên hệ
Hotline: 0123456789
Email: info@example.com
Website: https://example.com`;

    const sections = parseSections(text);
    expect(sections).toHaveLength(1);
    expect(sections[0].content).toContain("Hotline");
    expect(sections[0].content).toContain("Email");
    expect(sections[0].content).toContain("Website");
  });
});
