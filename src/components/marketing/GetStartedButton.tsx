"use client";

import { GoogleSignInButton } from "@/components/auth/LoginForm";
import { landingHeroCtaClassName } from "@/components/marketing/landing-cta-styles";
import { cn } from "@/lib/utils";

interface GetStartedButtonProps {
  authConfigured: boolean;
  label?: string;
  className?: string;
}

export function GetStartedButton({
  authConfigured,
  label = "Get Started Free with Google",
  className,
}: GetStartedButtonProps) {
  return (
    <div className={cn("w-full max-w-sm", className)}>
      <GoogleSignInButton
        authConfigured={authConfigured}
        label={label}
        className={landingHeroCtaClassName}
      />
    </div>
  );
}
