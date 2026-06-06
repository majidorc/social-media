function normalizeAppUrl(url: string | undefined): string {
  return (url ?? "http://localhost:3000").replace(/\/$/, "");
}

const appUrl = normalizeAppUrl(process.env.NEXTAUTH_URL);

export const useSecureCookies = appUrl.startsWith("https://");

/** Bumped from default next-auth cookie to invalidate pre-JWT session tokens. */
export const sessionTokenCookieName = `${
  useSecureCookies ? "__Secure-" : ""
}aihub.session-token`;

export const legacySessionCookieNames = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
] as const;

export function getSessionCookieNames(): string[] {
  return [sessionTokenCookieName, ...legacySessionCookieNames];
}

export function hasAnySessionCookie(
  getCookie: (name: string) => string | undefined,
): boolean {
  return getSessionCookieNames().some((name) => Boolean(getCookie(name)));
}

export function clearSessionCookies(response: {
  cookies: {
    delete: (name: string) => void;
  };
}) {
  for (const name of getSessionCookieNames()) {
    response.cookies.delete(name);
  }
}
