import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { prisma } from "@/lib/prisma";

const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const ORIGIN =
  process.env.WEBAUTHN_ORIGIN ??
  (process.env.NODE_ENV === "production"
    ? `https://${RP_ID}`
    : "http://localhost:3000");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { response } = body as { response: RegistrationResponseJSON };

    const expectedChallenge = req.cookies.get("webauthn_challenge")?.value;
    const cookieUserId = req.cookies.get("webauthn_user_id")?.value;

    if (!expectedChallenge || !cookieUserId) {
      return NextResponse.json(
        { error: "Thử thách đăng ký đã hết hạn hoặc không hợp lệ. Vui lòng thử lại." },
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

    // Save the authenticator public key under this user account
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
    // Clean up short-lived challenge cookies
    res.cookies.set("webauthn_challenge", "", { maxAge: 0, path: "/" });
    res.cookies.set("webauthn_user_id", "", { maxAge: 0, path: "/" });
    return res;
  } catch (err) {
    console.error("[passkey/register] Error:", err);
    return NextResponse.json(
      { error: "Lỗi máy chủ nội bộ khi đăng ký passkey." },
      { status: 500 }
    );
  }
}
