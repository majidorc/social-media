"use client";

import { useGoogleIdentity } from "@/components/auth/GoogleIdentityProvider";
import { Alert } from "@/components/ui/Alert";

export function LandingAuthAlert() {
  const { signInError } = useGoogleIdentity();

  if (!signInError) {
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
      <Alert variant="error">{signInError}</Alert>
    </div>
  );
}
