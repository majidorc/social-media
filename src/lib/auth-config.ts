export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.NEXTAUTH_SECRET,
  );
}

export function getGoogleClientId(): string {
  return process.env.GOOGLE_CLIENT_ID ?? "";
}
