import {
  clearSessionCookies,
  hasAnySessionCookie,
  sessionTokenCookieName,
} from "@/lib/auth-cookies";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function withOptionalCookieCleanup(
  request: NextRequest,
  response: NextResponse,
  token: Awaited<ReturnType<typeof getToken>>,
) {
  if (
    !token &&
    hasAnySessionCookie((name) => request.cookies.get(name)?.value)
  ) {
    clearSessionCookies(response);
  }

  return response;
}

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: sessionTokenCookieName,
  });
  const isLoggedIn = Boolean(token);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/auth")) {
    return withOptionalCookieCleanup(
      request,
      NextResponse.next(),
      token,
    );
  }

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/planner") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/generate") ||
    pathname.startsWith("/api/planner") ||
    pathname.startsWith("/api/download-image") ||
    pathname.startsWith("/api/settings") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/api/checkout");

  if (isProtected && !isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return withOptionalCookieCleanup(
        request,
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        token,
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return withOptionalCookieCleanup(
      request,
      NextResponse.redirect(loginUrl),
      token,
    );
  }

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return withOptionalCookieCleanup(request, NextResponse.next(), token);
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard/:path*",
    "/planner/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/generate/:path*",
    "/api/planner",
    "/api/planner/:path*",
    "/api/download-image",
    "/api/settings/:path*",
    "/api/checkout",
    "/api/models",
    "/api/models/:path*",
  ],
};
