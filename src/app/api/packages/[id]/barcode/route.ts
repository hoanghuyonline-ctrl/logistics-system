import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasRole, withErrorHandler } from "@/lib/utils";
import type { NextRequest } from "next/server";

interface BwipRenderOptions {
  bcid: string;
  text: string;
  scale?: number;
  height?: number;
  includetext?: boolean;
  textxalign?: string;
}

interface BwipJs {
  toBuffer(opts: BwipRenderOptions): Promise<Buffer>;
  toSVG(opts: BwipRenderOptions): string;
}

// bwip-js does not export node types under bundler resolution;
// use dynamic require with an explicit interface instead.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bwipjs: BwipJs = require("bwip-js");

export const GET = withErrorHandler(async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/packages/[id]/barcode">,
) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, ["ADMIN", "WAREHOUSE_CN", "WAREHOUSE_VN"])) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;

  const pkg = await prisma.package.findUnique({
    where: { id },
    select: { barcode: true, packageCode: true },
  });

  if (!pkg) {
    return Response.json({ error: "Package not found" }, { status: 404 });
  }

  const text = pkg.barcode || pkg.packageCode;
  const format = req.nextUrl.searchParams.get("format");

  const opts: BwipRenderOptions = {
    bcid: "code128",
    text,
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: "center",
  };

  if (format === "svg") {
    const svg = bwipjs.toSVG(opts);
    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  const png = await bwipjs.toBuffer(opts);
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
});
