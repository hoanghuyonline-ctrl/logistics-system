import { prisma } from "@/lib/prisma";

let cachedDomain: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

/**
 * Returns the configured APP_DOMAIN from SystemConfig (DB) → process.env fallback.
 * Caches for 30 seconds to avoid repeated DB lookups on every request.
 * Always returns a domain WITHOUT trailing slash.
 */
export async function getAppDomain(): Promise<string> {
  const now = Date.now();
  if (cachedDomain !== null && now - cachedAt < CACHE_TTL_MS) {
    return cachedDomain;
  }

  const row = await prisma.systemConfig
    .findUnique({ where: { key: "APP_DOMAIN" } })
    .catch(() => null);

  const raw =
    row?.value ||
    process.env.APP_DOMAIN ||
    process.env.NEXTAUTH_URL ||
    "";

  cachedDomain = raw.trim().replace(/\/+$/, "");
  cachedAt = now;
  return cachedDomain;
}

/** Force-clear the cached domain (call after admin saves a new value). */
export function resetDomainCache(): void {
  cachedDomain = null;
  cachedAt = 0;
}

/**
 * Build a full public URL for an asset stored in the database.
 *
 * Handles backward compatibility:
 *  - If `value` already starts with http:// or https:// → return as-is
 *  - If `value` is a relative path (e.g. "packages/img.jpg") → prepend APP_DOMAIN
 *  - If `value` starts with "/" (e.g. "/api/uploads/...") → prepend APP_DOMAIN
 *  - null/undefined/empty → return empty string
 */
export async function buildAssetUrl(value: string | null | undefined): Promise<string> {
  if (!value) return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const domain = await getAppDomain();
  if (!domain) {
    if (trimmed.startsWith("/")) return trimmed;
    return `/${trimmed}`;
  }

  const separator = trimmed.startsWith("/") ? "" : "/";
  return `${domain}${separator}${trimmed}`;
}

/**
 * Synchronous version for contexts where the domain is already known.
 * Same backward-compat logic as buildAssetUrl but takes the domain as param.
 */
export function buildAssetUrlSync(value: string | null | undefined, domain: string): string {
  if (!value) return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (!domain) {
    if (trimmed.startsWith("/")) return trimmed;
    return `/${trimmed}`;
  }

  const separator = trimmed.startsWith("/") ? "" : "/";
  return `${domain}${separator}${trimmed}`;
}

/**
 * Extract the relative path from an asset URL.
 * Used when storing new uploads — strips the domain prefix so DB stores only relative paths.
 *
 * - Already relative (no http) → return as-is
 * - Absolute URL matching known patterns → strip to relative
 */
export function toRelativePath(url: string): string {
  if (!url) return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  let rel: string;
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    rel = trimmed.replace(/^\/+/, "");
  } else {
    try {
      const parsed = new URL(trimmed);
      rel = parsed.pathname.replace(/^\/+/, "");
    } catch {
      rel = trimmed;
    }
  }

  return rel.replace(/^api\/uploads\//, "");
}

/**
 * Extract the storage key from a DB-stored path for deletion.
 * Handles: "api/uploads/packages/img.jpg" → "packages/img.jpg"
 *          "/api/uploads/packages/img.jpg" → "packages/img.jpg"
 *          "packages/img.jpg" → "packages/img.jpg"
 */
export function extractStorageKey(dbPath: string): string {
  return toRelativePath(dbPath);
}
