import { Suspense } from "react";
import Link from "next/link";
import { GoogleIdentityProvider } from "@/components/auth/GoogleIdentityProvider";
import { LoginCard } from "@/components/auth/LoginForm";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { APP_NAME } from "@/lib/constants";
import { Sparkles } from "lucide-react";

function isAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.NEXTAUTH_SECRET,
  );
}

export default function LoginPage() {
  const authConfigured = isAuthConfigured();
  const googleClientId = process.env.GOOGLE_CLIENT_ID ?? "";

  return (
    <GoogleIdentityProvider
      clientId={googleClientId}
      authConfigured={authConfigured}
      enableOneTap={false}
    >
      <div className="relative min-h-screen bg-background">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-3xl" />
        </div>

        <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{APP_NAME}</p>
              <p className="text-xs text-muted">Back to home</p>
            </div>
          </Link>
          <ThemeToggle />
        </header>

        <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-8 sm:py-12">
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
      </div>
    </GoogleIdentityProvider>
  );
}
