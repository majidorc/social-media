import type { Prisma } from "@prisma/client";
import {
  resolveHistoryItemTitle,
  truncateHistoryTitle,
} from "@/lib/history-display";
import type { GenerationOutputs } from "@/types";
import type { ScheduledWorkspaceItem } from "@/types";

type ScheduledWorkspaceRecord = {
  id: string;
  idea: string | null;
  platforms: ScheduledWorkspaceItem["platforms"];
  scheduledFor: Date;
  outputs: GenerationOutputs;
};

export function toScheduledWorkspaceItem(
  workspace: ScheduledWorkspaceRecord,
): ScheduledWorkspaceItem {
  return {
    id: workspace.id,
    idea: workspace.idea,
    platforms: workspace.platforms,
    scheduledFor: workspace.scheduledFor.toISOString(),
    outputs: workspace.outputs,
  };
}

type PlannerTitleSource = {
  idea: string | null;
  outputs: GenerationOutputs;
};

export function getPlannerItemDisplayTitle(
  item: PlannerTitleSource,
  maxLength = 42,
): string {
  return truncateHistoryTitle(
    resolveHistoryItemTitle(item.idea, item.outputs as unknown as Prisma.JsonValue),
    maxLength,
  );
}

/** @deprecated Use getPlannerItemDisplayTitle instead. */
export function truncatePlannerTitle(idea: string | null, maxLength = 42): string {
  const value = idea?.trim() || "Untitled Generation";

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

export function hasPlannerVideoScript(outputs: GenerationOutputs): boolean {
  return Boolean(
    outputs.video?.script?.trim() || outputs.video?.voiceoverCopy?.trim(),
  );
}
