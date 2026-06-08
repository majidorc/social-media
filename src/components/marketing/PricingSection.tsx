"use client";

import { CheckoutButton } from "@/components/subscription/CheckoutButton";
import { GetStartedButton } from "@/components/marketing/GetStartedButton";
import { PricingFaq } from "@/components/marketing/PricingFaq";
import { PLAN_DEFINITIONS, getPlanDisplayPricing } from "@/lib/plans";
import {
  annualDisclaimerClassName,
  compareAtPriceClassName,
  promoBadgeClassName,
} from "@/lib/ui-classes";
import { cn } from "@/lib/utils";
import type { CheckoutPlanType, MarketingBillingInterval } from "@/types";
import { Check, Layers } from "lucide-react";
import { useState } from "react";

function isCheckoutPlan(planId: string): planId is CheckoutPlanType {
  return planId === "PRO" || planId === "AGENCY";
}

interface PricingSectionProps {
  /** When true, Free tier shows current-plan state instead of Google sign-in. */
  isAuthenticated?: boolean;
}

export function PricingSection({ isAuthenticated = false }: PricingSectionProps) {
  const [billingInterval, setBillingInterval] =
    useState<MarketingBillingInterval>("MONTHLY");

  return (
    <section
      id="pricing"
      className="border-y border-border bg-card-muted/40 px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-accent-text">Pricing</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple plans that scale with you
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            Start free with your own API keys. Upgrade when you need multi-platform
            output, planner access, or multi-brand workflows.
          </p>
        </div>

        <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-3">
          <div className="inline-flex rounded-full border border-border bg-card p-1">
            <button
              type="button"
              onClick={() => setBillingInterval("MONTHLY")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                billingInterval === "MONTHLY"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-muted hover:text-foreground",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("ANNUAL")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                billingInterval === "ANNUAL"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-muted hover:text-foreground",
              )}
            >
              Annual
            </button>
          </div>
          {billingInterval === "ANNUAL" ? (
            <p className={annualDisclaimerClassName}>
              Enjoy 2 months free! Early annual cancellations are safely recalculated at the
              standard monthly rate, and remaining funds are instantly refunded.
            </p>
          ) : null}
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PLAN_DEFINITIONS.map((plan) => {
            const pricing =
              isCheckoutPlan(plan.id)
                ? getPlanDisplayPricing(plan.id, billingInterval)
                : { priceLabel: plan.priceLabel, priceSubtext: plan.priceSubtext };

            return (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-6 sm:p-7 ${
                  plan.highlighted
                    ? "border-violet-500/40 bg-gradient-to-b from-accent-soft/80 to-card shadow-xl shadow-violet-500/10"
                    : "border-border bg-card"
                }`}
              >
                {plan.highlighted ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </div>
                ) : null}

                {billingInterval === "ANNUAL" && isCheckoutPlan(plan.id) ? (
                  <div className={cn(promoBadgeClassName, "mb-3 w-fit")}>
                    2 months free
                  </div>
                ) : null}

                <div className="mb-5">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-accent-text" />
                    <h3 className="text-lg font-semibold text-foreground">
                      {plan.name}
                    </h3>
                  </div>
                  <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
                    {"compareAtLabel" in pricing && pricing.compareAtLabel ? (
                      <span
                        className={cn(compareAtPriceClassName, "pb-1 text-sm")}
                        aria-hidden
                      >
                        {pricing.compareAtLabel}
                      </span>
                    ) : null}
                    <span className="text-4xl font-bold text-foreground">
                      {pricing.priceLabel}
                    </span>
                    <span className="pb-1 text-sm text-muted">
                      {pricing.priceSubtext}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted">{plan.description}</p>
                </div>

                <ul className="mb-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-foreground"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCheckoutPlan(plan.id) ? (
                  <CheckoutButton
                    planType={plan.id}
                    billingInterval={billingInterval}
                    className={
                      plan.highlighted
                        ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-violet-400"
                        : "border border-border bg-card-muted text-foreground hover:bg-card"
                    }
                  >
                    Choose {plan.name}
                  </CheckoutButton>
                ) : isAuthenticated ? (
                  <div className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-card-muted px-4 py-3 text-sm font-medium text-muted">
                    Your current plan
                  </div>
                ) : (
                  <GetStartedButton className="w-full" />
                )}
              </article>
            );
          })}
        </div>

        <PricingFaq />
      </div>
    </section>
  );
}
