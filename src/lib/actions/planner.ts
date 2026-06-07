"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/get-current-user";
import {
  formatScheduledDate,
  getMonthBoundsUtc,
  parseDateInput,
} from "@/lib/planner-calendar";
import { prisma } from "@/lib/prisma";
import { parseGenerationOutputs } from "@/lib/workspace-history";
import { toScheduledWorkspaceItem } from "@/lib/workspace-planner";
import type { ScheduleWorkspaceResult, ScheduledWorkspaceItem } from "@/types";

const scheduleSchema = z.object({
  workspaceId: z.string().min(1),
  scheduledFor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date."),
});

export async function scheduleWorkspace(
  workspaceId: string,
  scheduledFor: string,
): Promise<ScheduleWorkspaceResult> {
  const parsed = scheduleSchema.safeParse({ workspaceId, scheduledFor });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid schedule payload.",
    };
  }

  try {
    const user = await requireCurrentUser();
    const scheduledDate = parseDateInput(parsed.data.scheduledFor);

    const existing = await prisma.contentWorkspace.findFirst({
      where: {
        id: parsed.data.workspaceId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, message: "Generation not found." };
    }

    await prisma.contentWorkspace.update({
      where: { id: existing.id },
      data: { scheduledFor: scheduledDate },
    });

    revalidatePath("/planner");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Scheduled for ${formatScheduledDate(scheduledDate)}.`,
      scheduledFor: scheduledDate.toISOString(),
    };
  } catch (error) {
    console.error("[scheduleWorkspace]", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to schedule post.",
    };
  }
}

export async function clearWorkspaceSchedule(
  workspaceId: string,
): Promise<ScheduleWorkspaceResult> {
  try {
    const user = await requireCurrentUser();

    const existing = await prisma.contentWorkspace.findFirst({
      where: {
        id: workspaceId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (!existing) {
      return { success: false, message: "Generation not found." };
    }

    await prisma.contentWorkspace.update({
      where: { id: existing.id },
      data: { scheduledFor: null },
    });

    revalidatePath("/planner");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Schedule removed.",
      scheduledFor: undefined,
    };
  } catch (error) {
    console.error("[clearWorkspaceSchedule]", error);
    return {
      success: false,
      message: "Failed to remove schedule.",
    };
  }
}

export async function getScheduledWorkspacesForMonth(
  year: number,
  month: number,
): Promise<ScheduledWorkspaceItem[]> {
  const user = await requireCurrentUser();

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid month selection.");
  }

  const { start, end } = getMonthBoundsUtc(year, month);

  const workspaces = await prisma.contentWorkspace.findMany({
    where: {
      userId: user.id,
      scheduledFor: {
        not: null,
        gte: start,
        lte: end,
      },
    },
    orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      idea: true,
      platforms: true,
      scheduledFor: true,
      outputs: true,
    },
  });

  return workspaces
    .filter(
      (workspace): workspace is typeof workspace & { scheduledFor: Date } =>
        workspace.scheduledFor !== null,
    )
    .map((workspace) =>
      toScheduledWorkspaceItem({
        ...workspace,
        scheduledFor: workspace.scheduledFor,
        outputs: parseGenerationOutputs(workspace.outputs),
      }),
    );
}
