import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { Role } from "@prisma/client";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user) return null;
  const user = session.user as { id: string; role: string; email?: string; name?: string };
  return user;
}

export function generateOrderCode(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${date}-${rand}`;
}

export function generatePackageCode(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PKG-${date}-${rand}`;
}

export function hasRole(userRole: string, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole as Role);
}

export function jsonResponse(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withErrorHandler<T extends (...args: any[]) => Promise<Response>>(handler: T): T {
  const wrapped = async (...args: Parameters<T>): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      const request = args[0] as Request;
      const pathname = new URL(request.url).pathname;
      console.error(`[API] ${request.method} ${pathname} failed:`, err);
      return errorResponse("Internal server error", 500);
    }
  };
  return wrapped as T;
}

export async function safeQuery<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    console.error("[prisma] safe query fallback:", err);
    return fallback;
  }
}

export function safeDecimal(val: unknown): number {
  if (val == null) return 0;
  const n = typeof val === "number" ? val : parseFloat(String(val));
  return isNaN(n) ? 0 : n;
}

export function formatVND(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
}

export function generateSalesCode(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SAL-${date}-${rand}`;
}

export function formatCNY(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(num);
}

/**
 * safeEmoji — Đảm bảo chuỗi emoji không bị surrogate pair bị cắt đứt (\ud83d...).
 * Nếu chuỗi bị double-escaped (ví dụ "\\ud83d\\udce6"), hàm sẽ trả về fallback thay vì vẽ ký tự rác.
 */
export function safeEmoji(icon: string, fallback = "📄"): string {
  if (!icon) return fallback;
  // Detect raw escaped surrogate sequences (double-escaped unicode)
  if (/\\ud[89ab][0-9a-f]{2}/i.test(icon)) return fallback;
  // Detect lone surrogate code points that would cause rendering glitches
  try {
    // encodeURIComponent throws on lone surrogates
    encodeURIComponent(icon);
    return icon;
  } catch {
    return fallback;
  }
}

/**
 * safeJsonParse — Phân tích chuỗi JSON an toàn, trả về fallback nếu parse lỗi.
 * Ngăn chặn lỗi khi dữ liệu từ DB trả về null hoặc chuỗi rỗng.
 */
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

