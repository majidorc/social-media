import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import {
  sessionTokenCookieName,
  useSecureCookies,
} from "@/lib/auth-cookies";
import { ensureOwnerAdminRole } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function normalizeAppUrl(url: string | undefined): string {
  return (url ?? "http://localhost:3000").replace(/\/$/, "");
}

// Trailing slashes break Google OAuth: ...com//api/auth/callback/google
if (process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = normalizeAppUrl(process.env.NEXTAUTH_URL);
}

export const appUrl = normalizeAppUrl(process.env.NEXTAUTH_URL);

const nextAuthSecret = process.env.NEXTAUTH_SECRET?.trim() ?? "";

if (!nextAuthSecret) {
  console.error(
    "[auth] NEXTAUTH_SECRET is missing. Sessions cannot be encrypted.",
  );
} else if (nextAuthSecret.length < 32) {
  console.warn(
    "[auth] NEXTAUTH_SECRET should be at least 32 characters. Generate one with: openssl rand -base64 32",
  );
}

async function ensureUserSettings(userId: string) {
  try {
    await prisma.userSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  } catch (error) {
    console.error("[auth] Failed to bootstrap user settings:", error);
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/",
    error: "/login",
  },
  session: {
    // JWT avoids fragile database Session writes during OAuth callback.
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: sessionTokenCookieName,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
  debug: process.env.NEXTAUTH_DEBUG === "true",
  logger: {
    error(code, metadata) {
      console.error("[next-auth][error]", code, metadata);
    },
    warn(code) {
      console.warn("[next-auth][warn]", code);
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return false;
      }

      if (user.id) {
        await ensureUserSettings(user.id);
        await ensureOwnerAdminRole(user.id, user.email);
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        const target = new URL(url);
        if (target.origin === baseUrl) {
          return url;
        }
      } catch {
        // Ignore malformed callback URLs.
      }

      return `${baseUrl}/dashboard`;
    },
  },
  events: {
    createUser: async ({ user }) => {
      if (user.id) {
        await ensureUserSettings(user.id);
        await ensureOwnerAdminRole(user.id, user.email);
      }
    },
    linkAccount: async ({ user }) => {
      if (user.id) {
        await ensureUserSettings(user.id);
        await ensureOwnerAdminRole(user.id, user.email);
      }
    },
  },
  secret: nextAuthSecret || undefined,
};
