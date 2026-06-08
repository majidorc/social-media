"use client";

import { CheckoutButton } from "@/components/subscription/CheckoutButton";
import { getPlanLabel } from "@/lib/plans";
import type { CheckoutPlanType, Plan } from "@/types";
import { Crown, Sparkles } from "lucide-react";

interface UpgradeBannerProps {
  title: string;
  description: string;
  requiredPlan: Plan;
  className?: string;
}

function toCheckoutPlanType(plan: Plan): CheckoutPlanType | null {
  if (plan === "PRO" || plan === "AGENCY") {
    return plan;
  }

  return null;
}

export function UpgradeBanner({
  title,
  description,
  requiredPlan,
  className,
}: UpgradeBannerProps) {
  const checkoutPlan = toCheckoutPlanType(requiredPlan);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-accent-soft via-card to-card p-6 sm:p-8 ${className ?? ""}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-violet-600/10 blur-2xl" />

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-card px-3 py-1 text-xs font-medium text-accent-text">
            <Crown className="h-3.5 w-3.5" />
            {getPlanLabel(requiredPlan)} plan required
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted">{description}</p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:min-w-[12rem] sm:items-end">
          {checkoutPlan ? (
            <CheckoutButton
              planType={checkoutPlan}
              className="h-10 bg-violet-600 px-4 text-white hover:bg-violet-500"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade to {getPlanLabel(requiredPlan)}
            </CheckoutButton>
          ) : null}
          <p className="text-xs text-muted">Secure checkout powered by Stripe.</p>
        </div>
      </div>
    </div>
  );
}
