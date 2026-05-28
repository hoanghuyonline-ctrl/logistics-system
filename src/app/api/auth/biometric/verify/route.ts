import { NextRequest, NextResponse } from "next/server";
import {
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encode } from "next-auth/jwt";

const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const ORIGIN =
  process.env.WEBAUTHN_ORIGIN ??
  (process.env.NODE_ENV === "production"
    ? `https://${RP_ID}`
    : "http://localhost:3000");

/**
 * POST /api/auth/biometric/verify
 *
 * Body (registration):  { mode: "register", response: RegistrationResponseJSON }
 * Body (authentication): { mode: "authenticate", response: AuthenticationResponseJSON }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, response } = body as {
      mode: string;
      response: RegistrationResponseJSON | AuthenticationResponseJSON;
    };

    // Read challenge & userId from httpOnly cookies set by /options
    const expectedChallenge = req.cookies.get("webauthn_challenge")?.value;
    const cookieUserId = req.cookies.get("webauthn_user_id")?.value;

    if (!expectedChallenge || !cookieUserId) {
      return NextResponse.json(
        { error: "Challenge expired or missing. Please try again." },
        { status: 400 }
      );
    }

    // --- REGISTER ---
    if (mode === "register") {
      // Require an active session to register a passkey
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { error: "You must be signed in to register a passkey." },
          { status: 401 }
        );
      }

      const verification = await verifyRegistrationResponse({
        response: response as RegistrationResponseJSON,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return NextResponse.json(
          { error: "Registration verification failed." },
          { status: 400 }
        );
      }

      const {
        credential,
        credentialDeviceType,
        credentialBackedUp,
      } = verification.registrationInfo;

      // Persist the new passkey
      await prisma.authenticator.create({
        data: {
          userId: cookieUserId,
          credentialID: credential.id,
          credentialPublicKey: Buffer.from(credential.publicKey),
          counter: BigInt(credential.counter),
          credentialDeviceType,
          credentialBackedUp,
          transports: credential.transports
            ? JSON.stringify(credential.transports)
            : null,
        },
      });

      const res = NextResponse.json({ verified: true });
      clearChallengeCookies(res);
      return res;
    }

    // --- AUTHENTICATE ---
    if (mode === "authenticate") {
      const user = await prisma.user.findUnique({
        where: { id: cookieUserId },
        include: { authenticators: true },
      });

      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: "User not found or deactivated." },
          { status: 404 }
        );
      }

      const authResponse = response as AuthenticationResponseJSON;
      const authenticator = user.authenticators.find(
        (a) => a.credentialID === authResponse.id
      );

      if (!authenticator) {
        return NextResponse.json(
          { error: "Passkey not found for this account." },
          { status: 400 }
        );
      }

      const verification = await verifyAuthenticationResponse({
        response: authResponse,
        expectedChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: authenticator.credentialID,
          publicKey: authenticator.credentialPublicKey,
          counter: Number(authenticator.counter),
          transports: authenticator.transports
            ? (JSON.parse(
                authenticator.transports
              ) as AuthenticatorTransport[])
            : undefined,
        },
      });

      if (!verification.verified) {
        return NextResponse.json(
          { error: "Authentication verification failed." },
          { status: 400 }
        );
      }

      // Update counter to prevent replay attacks
      await prisma.authenticator.update({
        where: { id: authenticator.id },
        data: { counter: BigInt(verification.authenticationInfo.newCounter) },
      });

      // Issue a NextAuth JWT session token so the client can call signIn
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

      const res = NextResponse.json({
        verified: true,
        role: user.role,
        // Return the encoded token so the client can set it via next-auth
        sessionToken: token,
      });
      clearChallengeCookies(res);

      // Set the NextAuth session cookie directly
      const isProduction = process.env.NODE_ENV === "production";
      const cookieName = isProduction
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token";

      res.cookies.set(cookieName, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        maxAge: 24 * 60 * 60,
        path: "/",
      });

      return res;
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    console.error("[biometric/verify] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function clearChallengeCookies(res: NextResponse) {
  res.cookies.set("webauthn_challenge", "", { maxAge: 0, path: "/" });
  res.cookies.set("webauthn_user_id", "", { maxAge: 0, path: "/" });
}
