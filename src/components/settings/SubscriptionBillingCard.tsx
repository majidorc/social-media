"use client";

import { startCheckout } from "@/lib/start-checkout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PlanBadge } from "@/components/subscription/PlanBadge";
import { PLAN_DEFINITIONS } from "@/lib/plans";
import { cn } from "@/lib/utils";
import type {
  BillingInterval,
  CheckoutPlanType,
  MarketingBillingInterval,
  Plan,
} from "@/types";
import {
  CalendarClock,
  CalendarPlus,
  ExternalLink,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface SubscriptionBillingCardProps {
  plan: Plan;
  billingInterval: BillingInterval | null;
  planActivatedAt: string | null;
  planExpiresAt: string | null;
  hasStripeCustomer: boolean;
  onNotice: (message: string) => void;
  onError: (message: string | null) => void;
}

interface PlanChangeAction {
  id: string;
  label: string;
  planType: CheckoutPlanType;
  billingInterval: MarketingBillingInterval;
  variant?: "primary" | "secondary";
}

function formatLocalizedDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function resolveEffectiveInterval(
  plan: Plan,
  billingInterval: BillingInterval | null,
): MarketingBillingInterval {
  if (billingInterval === "ANNUAL" || billingInterval === "MONTHLY") {
    return billingInterval;
  }

  return "MONTHLY";
}

function getPlanChangeActions(
  plan: Plan,
  billingInterval: BillingInterval | null,
): PlanChangeAction[] {
  const interval = resolveEffectiveInterval(plan, billingInterval);

  if (plan === "PRO" && interval === "MONTHLY") {
    return [
      {
        id: "pro-to-agency-monthly",
        label: "Upgrade to Agency",
        planType: "AGENCY",
        billingInterval: "MONTHLY",
        variant: "primary",
      },
      {
        id: "pro-monthly-to-annual",
        label: "Switch to Annual (Save 2 Months!)",
        planType: "PRO",
        billingInterval: "ANNUAL",
        variant: "secondary",
      },
    ];
  }

  if (plan === "PRO" && interval === "ANNUAL") {
    return [
      {
        id: "pro-to-agency-annual",
        label: "Upgrade to Agency Annual",
        planType: "AGENCY",
        billingInterval: "ANNUAL",
        variant: "primary",
      },
      {
        id: "pro-annual-to-monthly",
        label: "Switch to Monthly Billing",
        planType: "PRO",
        billingInterval: "MONTHLY",
        variant: "secondary",
      },
    ];
  }

  if (plan === "AGENCY" && interval === "MONTHLY") {
    return [
      {
        id: "agency-to-pro-monthly",
        label: "Downgrade to Pro",
        planType: "PRO",
        billingInterval: "MONTHLY",
        variant: "secondary",
      },
      {
        id: "agency-monthly-to-annual",
        label: "Switch to Annual (Save 2 Months!)",
        planType: "AGENCY",
        billingInterval: "ANNUAL",
        variant: "primary",
      },
    ];
  }

  if (plan === "AGENCY" && interval === "ANNUAL") {
    return [
      {
        id: "agency-to-pro-annual",
        label: "Downgrade to Pro Annual",
        planType: "PRO",
        billingInterval: "ANNUAL",
        variant: "secondary",
      },
      {
        id: "agency-annual-to-monthly",
        label: "Switch to Monthly Billing",
        planType: "AGENCY",
        billingInterval: "MONTHLY",
        variant: "secondary",
      },
    ];
  }

  return [];
}

export function SubscriptionBillingCard({
  plan,
  billingInterval,
  planActivatedAt,
  planExpiresAt,
  hasStripeCustomer,
  onNotice,
  onError,
}: SubscriptionBillingCardProps) {
  const router = useRouter();
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRestoringPlan, setIsRestoringPlan] = useState(false);

  const planDefinition = PLAN_DEFINITIONS.find((item) => item.id === plan);
  const isPaidPlan = plan === "PRO" || plan === "AGENCY";
  const isAnnual = billingInterval === "ANNUAL";
  const planChangeActions = useMemo(
    () => getPlanChangeActions(plan, billingInterval),
    [plan, billingInterval],
  );

  const handlePlanChange = async (action: PlanChangeAction) => {
    setPendingActionId(action.id);
    onError(null);
    onNotice("");

    try {
      const result = await startCheckout(action.planType, action.billingInterval);

      if (result.updated) {
        onNotice(
          result.message ??
            "Your subscription was updated. Stripe applied proration automatically.",
        );
        router.refresh();
        return;
      }
    } catch (changeError) {
      onError(
        changeError instanceof Error
          ? changeError.message
          : "Failed to update subscription.",
      );
    } finally {
      setPendingActionId(null);
    }
  };

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm(
      "Cancel your subscription and receive an instant fair prorated refund to your card?",
    );

    if (!confirmed) {
      return;
    }

    setIsCancelling(true);
    onError(null);
    onNotice("");

    try {
      const response = await fetch("/api/checkout/cancel", { method: "POST" });
      const result = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to cancel subscription.");
      }

      onNotice(
        result.message ??
          "Subscription cancelled. Your prorated refund has been sent to your card.",
      );
      router.refresh();
    } catch (cancelError) {
      onError(
        cancelError instanceof Error
          ? cancelError.message
          : "Failed to cancel subscription.",
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRestoreSubscription = async () => {
    setIsRestoringPlan(true);
    onError(null);
    onNotice("");

    try {
      const response = await fetch("/api/checkout/restore", { method: "POST" });
      const result = (await response.json()) as {
        success?: boolean;
        plan?: string;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.error ?? "Failed to restore subscription.");
      }

      onNotice(
        result.plan
          ? `Your ${result.plan} plan has been restored.`
          : "Subscription restored.",
      );
      router.refresh();
    } catch (restoreError) {
      onError(
        restoreError instanceof Error
          ? restoreError.message
          : "Failed to restore subscription.",
      );
    } finally {
      setIsRestoringPlan(false);
    }
  };

  return (
    <Card
      title="Subscription & Billing Plan"
      description="Upgrade, downgrade, switch billing cycles, or cancel with fair prorated refunds."
      className={cn(
        isPaidPlan &&
          "border-violet-500/25 bg-gradient-to-br from-accent-soft/40 via-card to-card",
      )}
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card-muted/80 p-4">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-accent-text" />
              <p className="text-sm font-semibold text-foreground">Current plan</p>
              <PlanBadge plan={plan} className="px-3 py-1 text-xs" />
              {isPaidPlan && isAnnual ? (
                <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Saved 2 Months!
                </span>
              ) : null}
              {isPaidPlan && billingInterval ? (
                <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium text-muted">
                  {billingInterval === "ANNUAL" ? "Annual billing" : "Monthly billing"}
                </span>
              ) : null}
            </div>

            {planDefinition ? (
              <p className="max-w-xl text-sm leading-relaxed text-muted">
                {planDefinition.description}
              </p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {isPaidPlan && planActivatedAt ? (
                <div className="inline-flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
                  <CalendarPlus className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" />
                  <div>
                    <p className="font-medium">Activated</p>
                    <p className="text-muted">{formatLocalizedDate(planActivatedAt)}</p>
                  </div>
                </div>
              ) : null}

              {isPaidPlan && planExpiresAt ? (
                <div className="inline-flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" />
                  <div>
                    <p className="font-medium">
                      {isAnnual ? "Renews on" : "Next renewal"}
                    </p>
                    <p className="text-muted">{formatLocalizedDate(planExpiresAt)}</p>
                  </div>
                </div>
              ) : null}
            </div>

            {isPaidPlan && !planExpiresAt ? (
              <p className="text-xs text-muted">
                Renewal date will appear after your subscription syncs with Stripe.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:items-stretch">
            {plan === "FREE" ? (
              <>
                <Link
                  href="/#pricing"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white transition-all hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/25 sm:w-auto sm:self-start"
                >
                  <ExternalLink className="h-4 w-4" />
                  Upgrade Plan
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isRestoringPlan}
                  onClick={() => void handleRestoreSubscription()}
                  className="w-full sm:w-auto sm:self-start"
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isRestoringPlan && "animate-spin")}
                  />
                  Restore subscription
                </Button>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {planChangeActions.map((action) => (
                    <Button
                      key={action.id}
                      type="button"
                      variant={action.variant ?? "secondary"}
                      size="sm"
                      disabled={
                        Boolean(pendingActionId) ||
                        isCancelling ||
                        !hasStripeCustomer
                      }
                      onClick={() => void handlePlanChange(action)}
                      className="w-full sm:w-auto"
                    >
                      {pendingActionId === action.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating plan...
                        </>
                      ) : (
                        action.label
                      )}
                    </Button>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={isCancelling || !hasStripeCustomer || Boolean(pendingActionId)}
                  onClick={() => void handleCancelSubscription()}
                  className="w-full sm:w-auto sm:self-start"
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing refund...
                    </>
                  ) : (
                    "Cancel Subscription"
                  )}
                </Button>

                {!hasStripeCustomer ? (
                  <p className="text-xs text-muted">
                    Plan changes unavailable until Stripe sync completes. Try
                    restoring your subscription first.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>

        {planDefinition ? (
          <ul className="grid gap-2 sm:grid-cols-2">
            {planDefinition.features.map((feature) => (
              <li
                key={feature}
                className="rounded-lg border border-border/70 bg-card-muted/60 px-3 py-2 text-sm text-foreground"
              >
                {feature}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Card>
  );
}
