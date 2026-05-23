import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicPaths = ["/", "/login", "/register", "/shop", "/api/auth", "/api/health", "/api/public/products", "/api/telegram/webhook", "/api/messenger/webhook", "/api/zalo/webhook", "/api/tracking", "/api/webhooks/bank-transfer", "/api/leads/capture", "/api/uploads"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Allow Zalo domain verifier files
  if (pathname.startsWith("/zalo_verifier") && pathname.endsWith(".html")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/settings/exchange-rate")) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = token.role as string;

  if (pathname.startsWith("/admin") && role !== "ADMIN" && role !== "ACCOUNTANT") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/warehouse/china") && role !== "WAREHOUSE_CN" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/warehouse/vietnam") && role !== "WAREHOUSE_VN" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/scanner") && role !== "ADMIN" && role !== "WAREHOUSE_CN" && role !== "WAREHOUSE_VN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|.*\\.jpg$|.*\\.jpeg$|.*\\.png$|.*\\.svg$|.*\\.webp$|.*\\.ico$).*)"],
};
