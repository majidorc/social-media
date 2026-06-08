"use client";

import { landingPrimaryCtaClassName } from "@/components/marketing/landing-cta-styles";
import { cn } from "@/lib/utils";

interface GetStartedButtonProps {
  onClick: () => void;
  className?: string;
}

export function GetStartedButton({ onClick, className }: GetStartedButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(landingPrimaryCtaClassName, className)}
    >
      Get Started
    </button>
  );
}
