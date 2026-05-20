export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const nextAuth = NextAuth(authOptions);

async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ nextauth: string[] }> },
) {
  const resolvedParams = await ctx.params;
  return nextAuth(req, { params: resolvedParams });
}

export { handler as GET, handler as POST };
