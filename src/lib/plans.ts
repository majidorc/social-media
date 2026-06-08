import type { Plan, WatermarkPosition } from "@prisma/client";
import type { BillingInterval } from "@prisma/client";
import { DEFAULT_WATERMARK_POSITION } from "@/lib/watermark-position";
import {
  AGENCY_ANNUAL_PRICE_USD,
  AGENCY_MONTHLY_PRICE_USD,
  PRO_ANNUAL_PRICE_USD,
  PRO_MONTHLY_PRICE_USD,
} from "@/lib/billing-refund";

export type { Plan };
export type { BillingInterval };

export interface PlanDefinition {
  id: Plan;
  name: string;
  priceLabel: string;
  priceSubtext: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export interface PlanFeatures {
  plan: Plan;
  maxPlatforms: number;
  canUsePlanner: boolean;
  canCustomizeWatermarkPosition: boolean;
  allowedWatermarkPositions: WatermarkPosition[];
  maxBrandProfiles: number;
  historyDaysLimit: number | null;
}

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: "FREE",
    name: "Free",
    priceLabel: "$0",
    priceSubtext: "forever",
    description: "Try the studio with your own API keys.",
    features: [
      "Single-platform text generation",
      "Basic AI image generation",
      "Default watermark placement",
      "3-day generation history",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    priceLabel: "$19",
    priceSubtext: "per month",
    description: "For creators shipping content every week.",
    features: [
      "Dynamic multi-platform output",
      "Custom watermark positioning",
      "Full content planner calendar",
      "Unlimited generation history",
    ],
    highlighted: true,
  },
  {
    id: "AGENCY",
    name: "Agency",
    priceLabel: "$49",
    priceSubtext: "per month",
    description: "Manage multiple brands from one workspace.",
    features: [
      "Everything in Pro",
      "Multi-brand context profiles",
      "Switch between client companies",
      "Priority roadmap access",
    ],
  },
];

const FREE_WATERMARK_POSITIONS: WatermarkPosition[] = [DEFAULT_WATERMARK_POSITION];

const PRO_WATERMARK_POSITIONS: WatermarkPosition[] = [
  "TOP_LEFT",
  "TOP_RIGHT",
  "BOTTOM_LEFT",
  "BOTTOM_RIGHT",
  "CENTER",
];

export const PLAN_FEATURES: Record<Plan, Omit<PlanFeatures, "plan">> = {
  FREE: {
    maxPlatforms: 1,
    canUsePlanner: false,
    canCustomizeWatermarkPosition: false,
    allowedWatermarkPositions: FREE_WATERMARK_POSITIONS,
    maxBrandProfiles: 1,
    historyDaysLimit: 3,
  },
  PRO: {
    maxPlatforms: 6,
    canUsePlanner: true,
    canCustomizeWatermarkPosition: true,
    allowedWatermarkPositions: PRO_WATERMARK_POSITIONS,
    maxBrandProfiles: 1,
    historyDaysLimit: null,
  },
  AGENCY: {
    maxPlatforms: 6,
    canUsePlanner: true,
    canCustomizeWatermarkPosition: true,
    allowedWatermarkPositions: PRO_WATERMARK_POSITIONS,
    maxBrandProfiles: 10,
    historyDaysLimit: null,
  },
};

export function getPlanFeatures(plan: Plan): PlanFeatures {
  return {
    plan,
    ...PLAN_FEATURES[plan],
  };
}

export function getMinimumPlanForFeature(
  feature: keyof Omit<PlanFeatures, "plan" | "allowedWatermarkPositions" | "historyDaysLimit">,
): Plan {
  if (feature === "maxBrandProfiles") {
    return "AGENCY";
  }

  if (feature === "canUsePlanner" || feature === "canCustomizeWatermarkPosition") {
    return "PRO";
  }

  return "FREE";
}

export function getPlanLabel(plan: Plan): string {
  return PLAN_DEFINITIONS.find((item) => item.id === plan)?.name ?? plan;
}

export interface PlanDisplayPricing {
  priceLabel: string;
  priceSubtext: string;
}

export function getPlanDisplayPricing(
  planId: Extract<Plan, "PRO" | "AGENCY">,
  billingInterval: BillingInterval,
): PlanDisplayPricing {
  if (billingInterval === "ANNUAL") {
    const amount = planId === "PRO" ? PRO_ANNUAL_PRICE_USD : AGENCY_ANNUAL_PRICE_USD;
    return {
      priceLabel: `$${amount}`,
      priceSubtext: "per year",
    };
  }

  const amount =
    planId === "PRO" ? PRO_MONTHLY_PRICE_USD : AGENCY_MONTHLY_PRICE_USD;

  return {
    priceLabel: `$${amount}`,
    priceSubtext: "per month",
  };
}
