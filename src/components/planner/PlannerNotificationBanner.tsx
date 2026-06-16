"use client";

import { usePlannerNotifications } from "@/hooks/usePlannerNotifications";
import { Button } from "@/components/ui/Button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import type { ScheduledWorkspaceItem } from "@/types";

interface PlannerNotificationBannerProps {
  items: ScheduledWorkspaceItem[];
}

export function PlannerNotificationBanner({ items }: PlannerNotificationBannerProps) {
  const { supported, permission, isRequesting, enableNotifications } =
    usePlannerNotifications({ items });

  if (!supported || permission === "granted") {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-violet-500/25 bg-accent-soft/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600/15 text-violet-700 dark:text-violet-300">
          {permission === "denied" ? (
            <BellOff className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {permission === "denied"
              ? "Browser notifications are blocked"
              : "Get reminded when posts are due"}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">
            {permission === "denied"
              ? "Enable notifications in your browser settings to receive publish-day reminders."
              : "Turn on notifications to get alerts for posts scheduled today and confirmation when you schedule new content."}
          </p>
        </div>
      </div>

      {permission === "default" ? (
        <Button
          type="button"
          size="sm"
          disabled={isRequesting}
          onClick={() => void enableNotifications()}
          className="w-full shrink-0 sm:w-auto"
        >
          {isRequesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          Enable notifications
        </Button>
      ) : null}
    </div>
  );
}
