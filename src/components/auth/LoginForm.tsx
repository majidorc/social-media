"use client";

import { APP_NAME } from "@/lib/constants";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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

function normalizeCallbackUrl(raw: string | null): string {
  if (!raw) {
    return "/dashboard";
  }

  if (raw.startsWith("/")) {
    return raw;
  }

  try {
    return new URL(raw).pathname || "/dashboard";
  } catch {
    return "/dashboard";
  }
}

function getAuthErrorMessage(errorCode: string | null): string | null {
  if (!errorCode || IGNORED_AUTH_ERRORS.has(errorCode)) {
    return null;
  }

  return AUTH_ERROR_MESSAGES[errorCode] ?? AUTH_ERROR_MESSAGES.Default;
}

async function postGoogleSignIn(callbackUrl: string) {
  const csrfResponse = await fetch("/api/auth/csrf", { credentials: "same-origin" });
  if (!csrfResponse.ok) {
    throw new Error("Could not start sign-in.");
  }

  const { csrfToken } = (await csrfResponse.json()) as { csrfToken?: string };
  if (!csrfToken) {
    throw new Error("Could not start sign-in.");
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/auth/signin/google";

  for (const [name, value] of Object.entries({ csrfToken, callbackUrl })) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

interface GoogleSignInButtonProps {
  authConfigured: boolean;
}

export function GoogleSignInButton({ authConfigured }: GoogleSignInButtonProps) {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const callbackUrl = normalizeCallbackUrl(searchParams.get("callbackUrl"));

  const handleSignIn = async () => {
    if (!authConfigured) {
      return;
    }

    setActionError(null);
    setIsLoading(true);

    try {
      await postGoogleSignIn(callbackUrl);
    } catch {
      setActionError(AUTH_ERROR_MESSAGES.OAuthSignin);
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={isLoading || !authConfigured}
        className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card-muted px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-card disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        Continue with Google
      </button>
      {actionError ? (
        <p className="mt-3 text-center text-sm text-red-300">{actionError}</p>
      ) : null}
    </>
  );
}

interface LoginCardProps {
  authConfigured: boolean;
}

export function LoginCard({ authConfigured }: LoginCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/10 sm:p-8 dark:shadow-violet-950/20">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-400">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Sign in to {APP_NAME}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Use your Google account to access the content generator and settings.
        </p>
      </div>

      {!authConfigured ? (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Google sign-in is not configured on the server. Set{" "}
            <code className="text-amber-100">GOOGLE_CLIENT_ID</code>,{" "}
            <code className="text-amber-100">GOOGLE_CLIENT_SECRET</code>, and{" "}
            <code className="text-amber-100">NEXTAUTH_SECRET</code>, then
            redeploy.
          </p>
        </div>
      ) : null}

      {authError ? (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{authError}</p>
        </div>
      ) : null}

      <GoogleSignInButton authConfigured={authConfigured} />

      <p className="mt-6 text-center text-xs leading-relaxed text-muted">
        Google is the only sign-in option. Your API keys and generated content
        stay tied to your account.
      </p>
    </div>
  );
}
