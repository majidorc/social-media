"use client";

import { Suspense } from "react";
import { GoogleSignInButton } from "@/components/auth/LoginForm";
import { Modal } from "@/components/ui/Modal";
import { Sparkles } from "lucide-react";

interface LandingAuthModalProps {
  open: boolean;
  onClose: () => void;
  authConfigured: boolean;
}

export function LandingAuthModal({
  open,
  onClose,
  authConfigured,
}: LandingAuthModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Welcome to AI Social"
      description="Sign in with Google to start creating multi-platform content."
      className="max-w-md"
    >
      <div className="flex flex-col items-center py-2 text-center sm:py-4">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/30 to-violet-500/10 text-violet-400">
          <Sparkles className="h-7 w-7" />
        </div>

        <Suspense
          fallback={
            <div className="h-11 w-full animate-pulse rounded-xl bg-card-muted" />
          }
        >
          <div className="w-full">
            <GoogleSignInButton authConfigured={authConfigured} />
          </div>
        </Suspense>

        <p className="mt-4 text-xs leading-relaxed text-muted">
          Google is the only sign-in option. Your API keys and content stay tied
          to your account.
        </p>
      </div>
    </Modal>
  );
}
