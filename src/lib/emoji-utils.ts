/**
 * emoji-utils.ts — Client-safe emoji sanitization utilities.
 * This file must NOT import any server-only modules (next-auth, prisma, googleapis, etc.)
 */

/**
 * safeEmoji — Guards against surrogate pair rendering glitches (\ud83d...).
 * Returns fallback if the string contains double-escaped unicode or lone surrogates.
 */
export function safeEmoji(icon: string, fallback = "📄"): string {
  if (!icon) return fallback;
  // Detect raw escaped surrogate sequences (double-escaped unicode in string form)
  if (/\\ud[89ab][0-9a-f]{2}/i.test(icon)) return fallback;
  // Detect lone surrogate code points that throw on encodeURIComponent
  try {
    encodeURIComponent(icon);
    return icon;
  } catch {
    return fallback;
  }
}

/**
 * safeJsonParse — Safe JSON.parse with typed fallback.
 * Prevents crashes when DB fields contain null, empty string, or malformed JSON.
 */
export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
