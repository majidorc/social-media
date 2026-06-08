import type { Plan, UserSettings, WatermarkPosition } from "@prisma/client";
import { getPlanFeatures, type PlanFeatures } from "@/lib/plans";
import { DEFAULT_WATERMARK_POSITION } from "@/lib/watermark-position";

type SettingsWithPlan = Pick<
  UserSettings,
  "plan" | "planExpiresAt"
>;

export function getEffectivePlan(settings: SettingsWithPlan | null | undefined): Plan {
  if (!settings) {
    return "FREE";
  }

  if (
    settings.plan !== "FREE" &&
    settings.planExpiresAt &&
    settings.planExpiresAt < new Date()
  ) {
    return "FREE";
  }

  return settings.plan;
}

export function resolveUserPlanFeatures(
  settings: SettingsWithPlan | null | undefined,
): PlanFeatures {
  return getPlanFeatures(getEffectivePlan(settings));
}

export function canUsePlanner(settings: SettingsWithPlan | null | undefined): boolean {
  return resolveUserPlanFeatures(settings).canUsePlanner;
}

export function canCustomizeWatermarkPosition(
  settings: SettingsWithPlan | null | undefined,
): boolean {
  return resolveUserPlanFeatures(settings).canCustomizeWatermarkPosition;
}

export function getMaxPlatforms(settings: SettingsWithPlan | null | undefined): number {
  return resolveUserPlanFeatures(settings).maxPlatforms;
}

export function getMaxBrandProfiles(settings: SettingsWithPlan | null | undefined): number {
  return resolveUserPlanFeatures(settings).maxBrandProfiles;
}

export function getHistoryCutoffDate(
  settings: SettingsWithPlan | null | undefined,
): Date | null {
  const { historyDaysLimit } = resolveUserPlanFeatures(settings);

  if (historyDaysLimit === null) {
    return null;
  }

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - historyDaysLimit);
  return cutoff;
}

export function isWatermarkPositionAllowed(
  settings: SettingsWithPlan | null | undefined,
  position: WatermarkPosition,
): boolean {
  const { allowedWatermarkPositions } = resolveUserPlanFeatures(settings);
  return allowedWatermarkPositions.includes(position);
}

export function resolveAllowedWatermarkPosition(
  settings: SettingsWithPlan | null | undefined,
  position: WatermarkPosition,
): WatermarkPosition {
  if (isWatermarkPositionAllowed(settings, position)) {
    return position;
  }

  return DEFAULT_WATERMARK_POSITION;
}

export function getUpgradeMessage(requiredPlan: Plan): string {
  switch (requiredPlan) {
    case "AGENCY":
      return "Upgrade to Agency to unlock multi-brand profiles.";
    case "PRO":
      return "Upgrade to Pro to unlock this feature.";
    default:
      return "Upgrade your plan to unlock this feature.";
  }
}
