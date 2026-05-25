import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "./prisma";
import { uploadFileToStorage } from "./storage";

const VN_PHONE_REGEX = /^(?:\+84|0)\d{9,10}$/;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const identifier = credentials.email.trim();
        const isPhone = VN_PHONE_REGEX.test(identifier);

        const user = isPhone
          ? await prisma.user.findUnique({ where: { phone: identifier } })
          : await prisma.user.findUnique({ where: { email: identifier } });

        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        const existing = await prisma.user.findUnique({
          where: { email },
        });

        if (existing) {
          if (!existing.isActive) return false;
          // Update avatar if missing and Google provides one
          if (!existing.avatarUrl && user.image) {
            saveGoogleAvatar(user.image, existing.id).catch((err) =>
              console.warn("[auth/google] Avatar save failed (existing user):", err),
            );
          }
          return true;
        }

        const randomPassword = await bcrypt.hash(
          crypto.randomBytes(32).toString("hex"),
          10,
        );
        const newUser = await prisma.user.create({
          data: {
            email,
            fullName: user.name || email.split("@")[0],
            password: randomPassword,
            role: "CUSTOMER",
          },
        });

        // Save Google avatar for new user
        if (user.image) {
          saveGoogleAvatar(user.image, newUser.id).catch((err) =>
            console.warn("[auth/google] Avatar save failed (new user):", err),
          );
        }
        return true;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === "credentials") {
        token.id = user.id;
        token.role = (user as unknown as Record<string, unknown>).role as string;
      }

      if (account?.provider === "google" && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

async function saveGoogleAvatar(imageUrl: string, userId: string): Promise<void> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Failed to fetch avatar: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = res.headers.get("content-type")?.includes("png") ? "png" : "jpg";
  const fileName = `${userId}.${ext}`;

  const savedUrl = await uploadFileToStorage(buffer, fileName, "avatars");

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: savedUrl },
  });
  console.log(`[auth/google] Avatar saved for user=${userId} url=${savedUrl}`);
}
