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

export function truncatePlannerTitle(idea: string | null, maxLength = 42): string {
  const value = idea?.trim() || "Untitled post";

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}
