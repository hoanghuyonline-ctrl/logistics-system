import { describe, it, expect } from "vitest";
import { scoreMatch } from "@/lib/support-knowledge";

describe("scoreMatch", () => {
  const title = "Giờ làm việc";
  const content = "Bắc Trung Hải Logistics làm việc từ Thứ 2 đến Thứ 7, 8:00 - 17:30.";
  const category = "Thông tin chung";

  it("returns positive score when query matches title", () => {
    const score = scoreMatch("giờ làm việc", title, content, category);
    expect(score).toBeGreaterThan(0);
  });

  it("returns higher score for title match than content-only match", () => {
    const titleScore = scoreMatch("làm việc", title, content, category);
    const contentOnly = scoreMatch("17:30", "Unrelated title", content, "Other");
    expect(titleScore).toBeGreaterThan(contentOnly);
  });

  it("is case-insensitive", () => {
    const lower = scoreMatch("giờ làm việc", title, content, category);
    const upper = scoreMatch("GIỜ LÀM VIỆC", title, content, category);
    expect(lower).toBe(upper);
  });

  it("returns 0 for unrelated query", () => {
    const score = scoreMatch("bitcoin crypto", title, content, category);
    expect(score).toBe(0);
  });

  it("returns 0 for very short single-character query", () => {
    const score = scoreMatch("a", title, content, category);
    expect(score).toBe(0);
  });

  it("matches category keywords", () => {
    const score = scoreMatch("thông tin", title, content, category);
    expect(score).toBeGreaterThan(0);
  });

  it("scores exact title substring match highest", () => {
    const exactMatch = scoreMatch("Giờ làm việc", title, content, category);
    const partialMatch = scoreMatch("làm", title, content, category);
    expect(exactMatch).toBeGreaterThan(partialMatch);
  });

  it("matches shipping fee content", () => {
    const feeContent = "Tổng chi phí = (Giá CNY × Tỷ giá) + Phí dịch vụ";
    const score = scoreMatch("phí vận chuyển", "Cách tính phí vận chuyển", feeContent, "Chính sách & phí");
    expect(score).toBeGreaterThan(0);
  });

  it("matches order creation guide", () => {
    const guideContent = "Đăng nhập → Tạo đơn hàng → Dán link sản phẩm";
    const score = scoreMatch("tạo đơn hàng", "Cách tạo đơn hàng", guideContent, "Hướng dẫn sử dụng");
    expect(score).toBeGreaterThan(0);
  });
});
