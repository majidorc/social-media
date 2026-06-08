"use client";

import { useGoogleIdentity } from "@/components/auth/GoogleIdentityProvider";
import { landingPrimaryCtaClassName } from "@/components/marketing/landing-cta-styles";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface GetStartedButtonProps {
  className?: string;
}

export function GetStartedButton({ className }: GetStartedButtonProps) {
  const { signInWithGoogle, authConfigured, isSigningIn } = useGoogleIdentity();

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      disabled={!authConfigured || isSigningIn}
      className={cn(landingPrimaryCtaClassName, className)}
    >
      {isSigningIn ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Signing in...
        </>
      ) : (
        "Get Started"
      )}
    </button>
  );
}
