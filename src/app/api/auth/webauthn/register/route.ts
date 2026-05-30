import { NextRequest, NextResponse } from "next/server";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { prisma } from "@/lib/prisma";

const RP_NAME = "Bắc Trung Hải Logistics";
const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const ORIGIN =
  process.env.WEBAUTHN_ORIGIN ??
  (process.env.NODE_ENV === "production"
    ? `https://${RP_ID}`
    : "http://localhost:3000");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, response } = body as {
      action: "options" | "verify";
      email?: string;
      response?: RegistrationResponseJSON;
    };

    if (!action) {
      return NextResponse.json(
        { error: "Missing action in request body" },
        { status: 400 }
      );
    }

    // --- GENERATE REGISTRATION OPTIONS ---
    if (action === "options") {
      if (!email) {
        return NextResponse.json(
          { error: "Email or phone is required to generate registration options" },
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
        return NextResponse.json({ error: "User not found or inactive" }, { status: 404 });
      }

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
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
        },
        excludeCredentials,
      });

      const res = NextResponse.json({ options, userId: user.id });
      res.cookies.set("webauthn_challenge", options.challenge, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 300,
        path: "/",
      });
      res.cookies.set("webauthn_user_id", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 300,
        path: "/",
      });
      return res;
    }

    // --- VERIFY REGISTRATION RESPONSE ---
    if (action === "verify") {
      if (!response) {
        return NextResponse.json(
          { error: "Registration response payload is required" },
          { status: 400 }
        );
      }

      const expectedChallenge = req.cookies.get("webauthn_challenge")?.value;
      const cookieUserId = req.cookies.get("webauthn_user_id")?.value;

      if (!expectedChallenge || !cookieUserId) {
        return NextResponse.json(
          { error: "Thử thách đăng ký sinh trắc học đã hết hạn hoặc không hợp lệ. Vui lòng thử lại." },
          { status: 400 }
        );
      }

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return NextResponse.json(
          { error: "Xác thực chữ ký đăng ký sinh trắc học thất bại." },
          { status: 400 }
        );
      }

      const {
        credentialID,
        credentialPublicKey,
        counter,
        credentialDeviceType,
        credentialBackedUp,
      } = verification.registrationInfo;

      await prisma.authenticator.create({
        data: {
          userId: cookieUserId,
          credentialID,
          credentialPublicKey: Buffer.from(credentialPublicKey),
          counter: BigInt(counter),
          credentialDeviceType,
          credentialBackedUp,
          transports: response.response?.transports
            ? JSON.stringify(response.response?.transports)
            : null,
        },
      });

      const res = NextResponse.json({ verified: true });
      res.cookies.set("webauthn_challenge", "", { maxAge: 0, path: "/" });
      res.cookies.set("webauthn_user_id", "", { maxAge: 0, path: "/" });
      return res;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[webauthn/register] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Lỗi máy chủ nội bộ khi đăng ký thiết bị sinh trắc học." },
      { status: 500 }
    );
  }
}
