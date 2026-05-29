import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";
import { prisma } from "@/lib/prisma";
import { jsonResponse, errorResponse, withErrorHandler } from "@/lib/utils";

const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const ORIGIN =
  process.env.WEBAUTHN_ORIGIN ??
  (process.env.NODE_ENV === "production"
    ? `https://${RP_ID}`
    : "http://localhost:3000");

/**
 * POST /api/auth/biometric/register
 * Verifies WebAuthn registration response on the server side and persists the credential key.
 */
export const POST = withErrorHandler(async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { response, name } = body as { response: RegistrationResponseJSON; name?: string };

    const expectedChallenge = req.cookies.get("webauthn_challenge")?.value;
    const cookieUserId = req.cookies.get("webauthn_user_id")?.value;

    if (!expectedChallenge || !cookieUserId) {
      return errorResponse("Thử thách đăng ký đã hết hạn hoặc không hợp lệ. Vui lòng thử lại.", 400);
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return errorResponse("Xác thực chữ ký đăng ký sinh trắc học thất bại.", 400);
    }

    const {
      credentialID,
      credentialPublicKey,
      counter,
      credentialDeviceType,
      credentialBackedUp,
    } = verification.registrationInfo;

    // Save the credential public key under the new Credential model
    await prisma.credential.create({
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
        name: name || "Khóa Thiết Bị",
      },
    });

    const res = NextResponse.json({ verified: true });
    // Clean up challenge cookies
    res.cookies.set("webauthn_challenge", "", { maxAge: 0, path: "/" });
    res.cookies.set("webauthn_user_id", "", { maxAge: 0, path: "/" });
    return res;
  } catch (err) {
    console.error("[biometric/register] Error:", err);
    return errorResponse("Lỗi máy chủ nội bộ khi đăng ký khóa sinh trắc học.", 500);
  }
});
