import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const status: {
    status: string;
    timestamp: string;
    database: string;
    version: string;
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    database: "ok",
    version: process.env.npm_package_version || "0.1.0",
  };

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
  } catch {
    status.status = "degraded";
    status.database = "unreachable";
    return NextResponse.json(status, { status: 503 });
  }

  return NextResponse.json(status);
}
