import { NextRequest, NextResponse } from "next/server";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/types";
import { prisma } from "@/lib/prisma";
import { encode } from "next-auth/jwt";

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
      response?: AuthenticationResponseJSON;
    };

    if (!action) {
      return NextResponse.json(
        { error: "Missing action in request body" },
        { status: 400 }
      );
    }

    // --- GENERATE AUTHENTICATION OPTIONS ---
    if (action === "options") {
      if (!email) {
        return NextResponse.json(
          { error: "Email or phone is required to generate login options" },
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

      if (user.authenticators.length === 0 && user.credentials.length === 0) {
        return NextResponse.json(
          { error: "Tài khoản của bạn chưa được liên kết với bất kỳ khóa sinh trắc học nào." },
          { status: 400 }
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

    // --- VERIFY AUTHENTICATION RESPONSE ---
    if (action === "verify") {
      if (!response) {
        return NextResponse.json(
          { error: "Authentication response payload is required" },
          { status: 400 }
        );
      }

      const expectedChallenge = req.cookies.get("webauthn_challenge")?.value;
      const cookieUserId = req.cookies.get("webauthn_user_id")?.value;

      if (!expectedChallenge || !cookieUserId) {
        return NextResponse.json(
          { error: "Thử thách xác thực đã hết hạn hoặc không hợp lệ. Vui lòng thử lại." },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: cookieUserId },
        include: { authenticators: true, credentials: true },
      });

      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: "Người dùng không tồn tại hoặc đã bị khóa." },
          { status: 404 }
        );
      }

      const authenticator = user.authenticators.find(
        (a) => a.credentialID === response.id
      );
      const credential = user.credentials.find(
        (c) => c.credentialID === response.id
      );

      if (!authenticator && !credential) {
        return NextResponse.json(
          { error: "Không tìm thấy khóa xác thực khớp với tài khoản." },
          { status: 400 }
        );
      }

      const matchedKey = authenticator || credential;
      if (!matchedKey) {
        return NextResponse.json(
          { error: "Lỗi kết nối khóa bảo mật." },
          { status: 500 }
        );
      }

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        authenticator: {
          credentialID: matchedKey.credentialID,
          credentialPublicKey: new Uint8Array(matchedKey.credentialPublicKey),
          counter: Number(matchedKey.counter),
          transports: matchedKey.transports
            ? (JSON.parse(matchedKey.transports) as AuthenticatorTransport[])
            : undefined,
        },
      });

      if (!verification.verified) {
        return NextResponse.json(
          { error: "Xác thực chữ ký sinh trắc học thất bại." },
          { status: 400 }
        );
      }

      // Update counter
      if (authenticator) {
        await prisma.authenticator.update({
          where: { id: authenticator.id },
          data: { counter: BigInt(verification.authenticationInfo.newCounter) },
        });
      } else if (credential) {
        await prisma.credential.update({
          where: { id: credential.id },
          data: { counter: BigInt(verification.authenticationInfo.newCounter) },
        });
      }

      // Encode JWT session token
      const secret = process.env.NEXTAUTH_SECRET!;
      const token = await encode({
        token: {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        },
        secret,
        maxAge: 24 * 60 * 60,
      });

      const isProduction = process.env.NODE_ENV === "production";
      const cookieName = isProduction
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token";

      const res = NextResponse.json({
        verified: true,
        role: user.role,
      });
      
      res.cookies.set("webauthn_challenge", "", { maxAge: 0, path: "/" });
      res.cookies.set("webauthn_user_id", "", { maxAge: 0, path: "/" });

      // Direct NextAuth session cookie issuance for instant passwordless entry
      res.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 24 * 60 * 60,
        path: "/",
      });

      return res;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[webauthn/login] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Lỗi máy chủ hệ thống sinh trắc học." },
      { status: 500 }
    );
  }
}
