import { signIn } from "next-auth/react";

export function normalizeAuthCallbackUrl(raw: string | null): string {
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

export async function completeGoogleCredentialSignIn(
  credential: string,
  callbackUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  const result = await signIn("google", {
    credential,
    redirect: false,
    callbackUrl,
  });

  if (result?.error) {
    return { ok: false, error: result.error };
  }

  return { ok: Boolean(result?.ok) };
}

export async function completeGooglePopupSignIn(
  code: string,
  callbackUrl: string,
): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch("/api/auth/google/code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  const data = (await response.json()) as {
    idToken?: string;
    error?: string;
  };

  if (!response.ok || !data.idToken) {
    return { ok: false, error: data.error ?? "Google sign-in failed." };
  }

  return completeGoogleCredentialSignIn(data.idToken, callbackUrl);
}
