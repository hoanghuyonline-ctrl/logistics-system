import { describe, it, expect } from "vitest";
import { scoreMatch } from "@/lib/support-knowledge";

describe("scoreMatch", () => {
  const title = "Giờ làm việc";
  const content = "Bắc Trung Hải Logistics làm việc từ Thứ 2 đến Thứ 7, 8:00 - 17:30.";
  const category = "Thông tin chung";

  it("returns positive score when query matches title", () => {
    const result = scoreMatch("giờ làm việc", title, content, category);
    expect(result.score).toBeGreaterThan(0);
    expect(result.matchSource).toBe("title");
  });

  it("returns higher score for title match than content-only match", () => {
    const titleResult = scoreMatch("làm việc", title, content, category);
    const contentResult = scoreMatch("17:30", "Unrelated title", content, "Other");
    expect(titleResult.score).toBeGreaterThan(contentResult.score);
  });

  it("is case-insensitive", () => {
    const lower = scoreMatch("giờ làm việc", title, content, category);
    const upper = scoreMatch("GIỜ LÀM VIỆC", title, content, category);
    expect(lower.score).toBe(upper.score);
  });

  it("returns 0 for unrelated query", () => {
    const result = scoreMatch("bitcoin crypto", title, content, category);
    expect(result.score).toBe(0);
    expect(result.matchSource).toBe("none");
  });

  it("returns 0 for very short single-character query", () => {
    const result = scoreMatch("a", title, content, category);
    expect(result.score).toBe(0);
    expect(result.matchSource).toBe("none");
  });

  it("matches category keywords", () => {
    const result = scoreMatch("thông tin", title, content, category);
    expect(result.score).toBeGreaterThan(0);
  });

  it("scores exact title substring match highest", () => {
    const exactMatch = scoreMatch("Giờ làm việc", title, content, category);
    const partialMatch = scoreMatch("làm", title, content, category);
    expect(exactMatch.score).toBeGreaterThan(partialMatch.score);
  });

  it("matches shipping fee content", () => {
    const feeContent = "Tổng chi phí = (Giá CNY × Tỷ giá) + Phí dịch vụ";
    const result = scoreMatch("phí vận chuyển", "Cách tính phí vận chuyển", feeContent, "Chính sách & phí");
    expect(result.score).toBeGreaterThan(0);
  });

  it("matches order creation guide", () => {
    const guideContent = "Đăng nhập → Tạo đơn hàng → Dán link sản phẩm";
    const result = scoreMatch("tạo đơn hàng", "Cách tạo đơn hàng", guideContent, "Hướng dẫn sử dụng");
    expect(result.score).toBeGreaterThan(0);
  });

  it("prioritizes keywords over title when keywords match", () => {
    const withKw = scoreMatch("mấy giờ làm", title, content, category, "mấy giờ làm, thời gian mở cửa");
    const withoutKw = scoreMatch("mấy giờ làm", title, content, category);
    expect(withKw.score).toBeGreaterThan(withoutKw.score);
    expect(withKw.matchSource).toBe("keywords");
  });

  it("returns matchSource=keywords when keywords match", () => {
    const result = scoreMatch("thời gian mở cửa", "Giờ làm việc", content, category, "thời gian mở cửa, mấy giờ");
    expect(result.matchSource).toBe("keywords");
    expect(result.score).toBeGreaterThan(0);
  });

  it("ignores empty or short keywords", () => {
    const result = scoreMatch("a", title, content, category, "a, b");
    expect(result.score).toBe(0);
  });

  it("falls back to title when no keywords match", () => {
    const result = scoreMatch("giờ làm việc", title, content, category, "nạp tiền, thanh toán");
    expect(result.score).toBeGreaterThan(0);
    expect(result.matchSource).toBe("title");
  });
});
