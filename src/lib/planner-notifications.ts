import { scheduledDateKey } from "@/lib/planner-calendar";
import { getPlannerItemDisplayTitle } from "@/lib/workspace-planner";
import type { ScheduledWorkspaceItem } from "@/types";

const STORAGE_PREFIX = "planner-notified";

export type PlannerNotificationPermission = NotificationPermission | "unsupported";

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getPlannerNotificationPermission(): PlannerNotificationPermission {
  if (!isBrowserNotificationSupported()) {
    return "unsupported";
  }

  return Notification.permission;
}

export async function requestPlannerNotificationPermission(): Promise<PlannerNotificationPermission> {
  if (!isBrowserNotificationSupported()) {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  return Notification.requestPermission();
}

function buildNotificationTag(suffix: string): string {
  return `planner-${suffix}`;
}

export function notifyPostScheduled(
  title: string,
  scheduledForLabel: string,
): void {
  if (!isBrowserNotificationSupported() || Notification.permission !== "granted") {
    return;
  }

  try {
    const notification = new Notification("Post scheduled", {
      body: `${title} — ${scheduledForLabel}`,
      tag: buildNotificationTag(`scheduled-${Date.now()}`),
      icon: "/favicon.ico",
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = "/planner";
      notification.close();
    };
  } catch {
    // Ignore notification failures (e.g. blocked by browser policy).
  }
}

export function notifyTodaysScheduledPosts(items: ScheduledWorkspaceItem[]): void {
  if (
    items.length === 0 ||
    !isBrowserNotificationSupported() ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  if (items.length === 1) {
    const item = items[0];
    const title = getPlannerItemDisplayTitle(item, 60);

    try {
      const notification = new Notification("Post due today", {
        body: `${title} — ${item.platforms.length} platform${item.platforms.length === 1 ? "" : "s"}`,
        tag: buildNotificationTag(`due-${item.id}`),
        icon: "/favicon.ico",
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = "/planner";
        notification.close();
      };
    } catch {
      // Ignore.
    }

    return;
  }

  try {
    const notification = new Notification("Posts due today", {
      body: `You have ${items.length} scheduled posts ready to publish today.`,
      tag: buildNotificationTag(`due-summary-${items.length}`),
      icon: "/favicon.ico",
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = "/planner";
      notification.close();
    };
  } catch {
    // Ignore.
  }
}

export function wasDailyReminderSent(dateKey: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(`${STORAGE_PREFIX}:day:${dateKey}`) === "1";
}

export function markDailyReminderSent(dateKey: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(`${STORAGE_PREFIX}:day:${dateKey}`, "1");
}

export function filterPostsDueOnDate(
  items: ScheduledWorkspaceItem[],
  dateKey: string,
): ScheduledWorkspaceItem[] {
  return items.filter((item) => scheduledDateKey(item.scheduledFor) === dateKey);
}
