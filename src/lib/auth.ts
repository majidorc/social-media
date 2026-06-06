import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

function normalizeAppUrl(url: string | undefined): string {
  return (url ?? "http://localhost:3000").replace(/\/$/, "");
}

// Trailing slashes break Google OAuth: ...com//api/auth/callback/google
if (process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = normalizeAppUrl(process.env.NEXTAUTH_URL);
}

export const appUrl = normalizeAppUrl(process.env.NEXTAUTH_URL);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
  },
  debug: process.env.NEXTAUTH_DEBUG === "true",
  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "google") {
        return true;
      }

      return false;
    },
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
    },
  },
  events: {
    createUser: async ({ user }) => {
      if (!user.id) {
        return;
      }

      try {
        await prisma.userSettings.upsert({
          where: { userId: user.id },
          create: { userId: user.id },
          update: {},
        });
      } catch (error) {
        console.error("[auth] Failed to bootstrap user settings:", error);
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
