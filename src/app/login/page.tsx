import { Suspense } from "react";
import { LoginCard } from "@/components/auth/LoginForm";

function isAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.NEXTAUTH_SECRET,
  );
}

export default function LoginPage() {
  const authConfigured = isAuthConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 sm:py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">
            Loading sign-in...
          </div>
        }
      >
        <LoginCard authConfigured={authConfigured} />
      </Suspense>
    </div>
  );
}
