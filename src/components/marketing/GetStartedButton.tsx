"use client";

import { GoogleSignInButton } from "@/components/auth/LoginForm";
import { cn } from "@/lib/utils";

interface GetStartedButtonProps {
  authConfigured: boolean;
  label?: string;
  className?: string;
  size?: "default" | "large";
}

export function GetStartedButton({
  authConfigured,
  label = "Get Started Free with Google",
  className,
  size = "default",
}: GetStartedButtonProps) {
  return (
    <div className={cn("w-full max-w-sm", className)}>
      <div
        className={cn(
          "[&_button]:border-violet-500/40 [&_button]:bg-gradient-to-r [&_button]:from-violet-600 [&_button]:to-violet-500 [&_button]:font-semibold [&_button]:text-white [&_button]:shadow-lg [&_button]:shadow-violet-500/20 [&_button]:hover:from-violet-500 [&_button]:hover:to-violet-400 [&_button]:hover:text-white",
          size === "large" && "[&_button]:px-6 [&_button]:py-4 [&_button]:text-base",
        )}
      >
        <GoogleSignInButton authConfigured={authConfigured} label={label} />
      </div>
    </div>
  );
}
