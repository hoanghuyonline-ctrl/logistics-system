import { NextRequest, NextResponse } from "next/server";
import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
} from "@simplewebauthn/server";
import { prisma } from "@/lib/prisma";

const RP_NAME = "Bắc Trung Hải Logistics";
const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";

/**
 * POST /api/auth/biometric/options
 *
 * Body (registration):  { mode: "register", email: string }
 * Body (authentication): { mode: "authenticate", email: string }
 *
 * Returns a challenge options object that the browser WebAuthn API consumes.
 * The generated challenge is stored in a short-lived cookie so /verify can
 * compare it without a database round-trip.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, email } = body as { mode: string; email: string };

    if (!mode || !email) {
      return NextResponse.json(
        { error: "Missing required fields: mode and email" },
        { status: 400 }
      );
    }

    const VN_PHONE_REGEX = /^(?:\+84|0)\d{9,10}$/;
    const isPhone = VN_PHONE_REGEX.test(email.trim());

    const user = isPhone
      ? await prisma.user.findUnique({
          where: { phone: email.trim() },
          include: { authenticators: true, credentials: true },
        })
      : await prisma.user.findUnique({
          where: { email: email.trim() },
          include: { authenticators: true, credentials: true },
        });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (mode === "register") {
      const excludeCredentials = [
        ...user.authenticators.map((a) => ({
          id: a.credentialID,
          transports: a.transports
            ? (JSON.parse(a.transports) as AuthenticatorTransport[])
            : undefined,
        })),
        ...user.credentials.map((c) => ({
          id: c.credentialID,
          transports: c.transports
            ? (JSON.parse(c.transports) as AuthenticatorTransport[])
            : undefined,
        })),
      ];

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userName: user.email || user.phone || user.id,
        userDisplayName: user.fullName || user.email || user.phone || "Người dùng Bắc Trung Hải",
        attestationType: "none",
        // [CROSS-PLATFORM FIX] See /api/auth/webauthn/register for rationale.
        // authenticatorAttachment:"platform" + userVerification:"required" + timeout:60000
        // fixes Samsung/Android Cốc Cốc fingerprint popup (prevents Timeout).
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          residentKey: "preferred",
          userVerification: "required",
        },
        timeout: 60000,
        excludeCredentials,
      });

      const response = NextResponse.json({ options, userId: user.id });
      response.cookies.set("webauthn_challenge", options.challenge, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 300, // 5 minutes
        path: "/",
      });
      response.cookies.set("webauthn_user_id", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 300,
        path: "/",
      });
      return response;
    }

    if (mode === "authenticate") {
      if (user.authenticators.length === 0 && user.credentials.length === 0) {
        return NextResponse.json(
          { error: "No passkeys registered for this account" },
          { status: 404 }
        );
      }

      const allowCredentials = [
        ...user.authenticators.map((a) => ({
          id: a.credentialID,
          transports: a.transports
            ? (JSON.parse(a.transports) as AuthenticatorTransport[])
            : undefined,
        })),
        ...user.credentials.map((c) => ({
          id: c.credentialID,
          transports: c.transports
            ? (JSON.parse(c.transports) as AuthenticatorTransport[])
            : undefined,
        })),
      ];

      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        userVerification: "preferred",
        allowCredentials,
      });

      const response = NextResponse.json({ options, userId: user.id });
      response.cookies.set("webauthn_challenge", options.challenge, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 300,
        path: "/",
      });
      response.cookies.set("webauthn_user_id", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 300,
        path: "/",
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err: any) {
    console.error("[biometric/options] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Không thể khởi tạo tùy chọn xác thực. Hãy đảm bảo thiết bị của bạn đã bật khóa bảo mật (vân tay, khuôn mặt hoặc mã PIN)." },
      { status: 400 }
    );
  }
}
