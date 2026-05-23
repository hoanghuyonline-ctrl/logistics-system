export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  md: "text/markdown",
  txt: "text/plain",
};

const DOWNLOAD_EXTENSIONS = new Set(["md", "txt", "pdf", "zip", "xlsx", "csv"]);

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/uploads/[...path]">,
) {
  const { path: segments } = await ctx.params;
  const filePath = path.join(UPLOADS_ROOT, ...segments);

  // Prevent directory traversal
  if (!filePath.startsWith(UPLOADS_ROOT)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await stat(filePath);
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const buffer = await readFile(filePath);
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  const fileName = segments[segments.length - 1];
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  if (DOWNLOAD_EXTENSIONS.has(ext)) {
    headers["Content-Disposition"] = `attachment; filename="${fileName}"`;
  }

  return new NextResponse(buffer, { status: 200, headers });
}
