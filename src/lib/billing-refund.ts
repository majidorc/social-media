import type { BillingInterval, Plan } from "@prisma/client";

/** Average days per billing month used for fair proration. */
export const DAYS_IN_BILLING_MONTH = 30.416;

export const PRO_MONTHLY_PRICE_USD = 19;
export const AGENCY_MONTHLY_PRICE_USD = 49;
export const PRO_ANNUAL_PRICE_USD = 190;
export const AGENCY_ANNUAL_PRICE_USD = 490;

const PAID_PLANS = new Set<Plan>(["PRO", "AGENCY"]);

export function isPaidPlan(plan: Plan): plan is Extract<Plan, "PRO" | "AGENCY"> {
  return PAID_PLANS.has(plan);
}

export function getMonthlyPriceUsd(plan: Extract<Plan, "PRO" | "AGENCY">): number {
  return plan === "PRO" ? PRO_MONTHLY_PRICE_USD : AGENCY_MONTHLY_PRICE_USD;
}

export function getAnnualPriceUsd(plan: Extract<Plan, "PRO" | "AGENCY">): number {
  return plan === "PRO" ? PRO_ANNUAL_PRICE_USD : AGENCY_ANNUAL_PRICE_USD;
}

/** Full monthly daily rate — used for annual early-cancel anti-exploitation math. */
export function getStandardDailyRateUsd(
  plan: Extract<Plan, "PRO" | "AGENCY">,
): number {
  return getMonthlyPriceUsd(plan) / DAYS_IN_BILLING_MONTH;
}

export function calculateDaysUsedSinceActivation(
  activationUnixSeconds: number,
  nowUnixSeconds = Math.floor(Date.now() / 1000),
): number {
  const elapsedSeconds = Math.max(0, nowUnixSeconds - activationUnixSeconds);
  return Math.ceil(elapsedSeconds / 86_400);
}

export interface FairRefundInput {
  plan: Extract<Plan, "PRO" | "AGENCY">;
  billingInterval: BillingInterval;
  daysUsed: number;
  amountPaidCents: number;
}

/**
 * Fair refund matrix:
 * - Monthly: refund unused portion at the standard monthly daily rate.
 * - Annual early cancel: charge days used at the FULL monthly daily rate (not the
 *   discounted annual rate), then refund the remainder of what was paid.
 */
export function calculateFairRefundCents(input: FairRefundInput): number {
  const dailyRateUsd = getStandardDailyRateUsd(input.plan);
  const amountToChargeCents = Math.round(input.daysUsed * dailyRateUsd * 100);

  const nominalPaidCents =
    input.billingInterval === "ANNUAL"
      ? getAnnualPriceUsd(input.plan) * 100
      : getMonthlyPriceUsd(input.plan) * 100;

  const paidCents =
    input.amountPaidCents > 0 ? input.amountPaidCents : nominalPaidCents;

  return Math.max(0, paidCents - amountToChargeCents);
}
