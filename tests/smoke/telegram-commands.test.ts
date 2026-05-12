import { describe, it, expect } from "vitest";

/**
 * Tests for Telegram bot command routing logic.
 * These mirror the exact matching conditions in
 * src/app/api/telegram/webhook/route.ts POST handler.
 */

function classifyMessage(text: string): string {
  const trimmed = text.trim();

  if (
    trimmed === "/start" ||
    trimmed.startsWith("/start@") ||
    trimmed.startsWith("/start ")
  ) {
    return "start";
  }
  if (
    trimmed === "/help" ||
    trimmed.startsWith("/help@") ||
    trimmed.startsWith("/help ")
  ) {
    return "help";
  }
  if (
    trimmed === "/status" ||
    trimmed.startsWith("/status@") ||
    trimmed.startsWith("/status ")
  ) {
    return "status";
  }
  if (trimmed.startsWith("/")) {
    return "unknown_command";
  }
  if (/\d/.test(trimmed) && !/\s/.test(trimmed)) {
    return "order_lookup";
  }
  return "invalid_text";
}

describe("Telegram command routing", () => {
  it("/start variants route to start handler", () => {
    expect(classifyMessage("/start")).toBe("start");
    expect(classifyMessage("/start@bactrunghai_bot")).toBe("start");
    expect(classifyMessage("/start payload")).toBe("start");
    expect(classifyMessage("  /start  ")).toBe("start");
  });

  it("/help variants route to help handler", () => {
    expect(classifyMessage("/help")).toBe("help");
    expect(classifyMessage("/help@bactrunghai_bot")).toBe("help");
    expect(classifyMessage("/help something")).toBe("help");
  });

  it("/status variants route to status handler", () => {
    expect(classifyMessage("/status")).toBe("status");
    expect(classifyMessage("/status@bactrunghai_bot")).toBe("status");
    expect(classifyMessage("/status extra")).toBe("status");
  });

  it("unknown slash commands route to unknown handler", () => {
    expect(classifyMessage("/abc")).toBe("unknown_command");
    expect(classifyMessage("/test")).toBe("unknown_command");
    expect(classifyMessage("/menu")).toBe("unknown_command");
    expect(classifyMessage("/settings@bot")).toBe("unknown_command");
  });

  it("order-code-like text routes to order lookup", () => {
    expect(classifyMessage("BTH123456")).toBe("order_lookup");
    expect(classifyMessage("ORD-20260505-K1L2")).toBe("order_lookup");
    expect(classifyMessage("ABC123")).toBe("order_lookup");
    expect(classifyMessage("12345")).toBe("order_lookup");
  });

  it("non-order text routes to invalid text guidance", () => {
    expect(classifyMessage("hello")).toBe("invalid_text");
    expect(classifyMessage("xin chào")).toBe("invalid_text");
    expect(classifyMessage("tra cứu đơn")).toBe("invalid_text");
    expect(classifyMessage("abc")).toBe("invalid_text");
  });
});
