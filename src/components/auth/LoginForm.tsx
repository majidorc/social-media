"use client";

import { GetStartedButton } from "@/components/marketing/GetStartedButton";
import { useGoogleIdentity } from "@/components/auth/GoogleIdentityProvider";
import { Alert, AlertCode } from "@/components/ui/Alert";
import { APP_NAME } from "@/lib/constants";
import { AlertCircle, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "Sign-in is not configured correctly. Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXTAUTH_URL on the server.",
  AccessDenied: "Access was denied. Your Google account may not be allowed to sign in.",
  Verification: "The sign-in link expired or was already used. Try again.",
  OAuthSignin: "Could not start Google sign-in. Try again in a moment.",
  OAuthCallback:
    "Google approved sign-in, but the app could not finish your session. Check server logs or try again.",
  Callback:
    "Google approved sign-in, but the app could not finish your session. Check server logs or try again.",
  OAuthCreateAccount: "Could not create your account. Try again or contact support.",
  OAuthAccountNotLinked:
    "This Google account could not be linked to an existing user. Try another Google account or contact support.",
  Default: "Something went wrong during sign-in. Try again.",
};

/** NextAuth uses the provider id as a fallback error code on GET /api/auth/signin/google. */
const IGNORED_AUTH_ERRORS = new Set(["google"]);

function getAuthErrorMessage(errorCode: string | null): string | null {
  if (!errorCode || IGNORED_AUTH_ERRORS.has(errorCode)) {
    return null;
  }

  return AUTH_ERROR_MESSAGES[errorCode] ?? AUTH_ERROR_MESSAGES.Default;
}

interface LoginCardProps {
  authConfigured: boolean;
}

function LoginCardContent({ authConfigured }: LoginCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInError } = useGoogleIdentity();
  const errorCode = searchParams.get("error");
  const authError = getAuthErrorMessage(errorCode);

  useEffect(() => {
    if (!errorCode || IGNORED_AUTH_ERRORS.has(errorCode)) {
      if (errorCode === "google") {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("error");
        const query = params.toString();
        router.replace(query ? `/login?${query}` : "/login");
      }
      return;
    }

    void fetch("/api/auth/signout", {
      method: "POST",
      credentials: "same-origin",
    });
  }, [errorCode, router, searchParams]);

  return (
    <div className="w-full max-w-md rounded-2xl border border-violet-500/20 bg-card/90 p-6 shadow-xl shadow-violet-500/10 backdrop-blur sm:p-8">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/30 to-violet-500/10 text-violet-600 dark:text-violet-400">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Continue with Google to access your {APP_NAME} workspace.
        </p>
      </div>

      {!authConfigured ? (
        <Alert variant="warning" className="mb-4 flex items-start gap-3 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Google sign-in is not configured on the server. Set{" "}
            <AlertCode>GOOGLE_CLIENT_ID</AlertCode>,{" "}
            <AlertCode>GOOGLE_CLIENT_SECRET</AlertCode>, and{" "}
            <AlertCode>NEXTAUTH_SECRET</AlertCode>, then redeploy.
          </p>
        </Alert>
      ) : null}

      {authError ? (
        <Alert variant="error" className="mb-4 flex items-start gap-3 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{authError}</p>
        </Alert>
      ) : null}

      {signInError ? (
        <Alert variant="error" className="mb-4 flex items-start gap-3 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{signInError}</p>
        </Alert>
      ) : null}

      <GetStartedButton className="w-full" />

      <p className="mt-6 text-center text-xs leading-relaxed text-muted">
        Google is the only sign-in option. Your API keys and generated content stay
        tied to your account.
      </p>
    </div>
  );
}

export function LoginCard({ authConfigured }: LoginCardProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted">
          Loading sign-in...
        </div>
      }
    >
      <LoginCardContent authConfigured={authConfigured} />
    </Suspense>
  );
}
