"use client";

import { useGoogleIdentity } from "@/components/auth/GoogleIdentityProvider";

export function LandingAuthAlert() {
  const { signInError } = useGoogleIdentity();

  if (!signInError) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
        {signInError}
      </div>
    </div>
  );
}
