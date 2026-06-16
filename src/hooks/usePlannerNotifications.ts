"use client";

import {
  filterPostsDueOnDate,
  getPlannerNotificationPermission,
  isBrowserNotificationSupported,
  markDailyReminderSent,
  notifyTodaysScheduledPosts,
  requestPlannerNotificationPermission,
  wasDailyReminderSent,
  type PlannerNotificationPermission,
} from "@/lib/planner-notifications";
import { getTodayUtcDateKey } from "@/lib/planner-calendar";
import type { ScheduledWorkspaceItem } from "@/types";
import { useCallback, useEffect, useState } from "react";

interface UsePlannerNotificationsOptions {
  /** When provided, checks these items for today's due posts. */
  items?: ScheduledWorkspaceItem[];
  /** When true, fetches today's posts from the API (dashboard / app shell). */
  fetchToday?: boolean;
}

export function usePlannerNotifications({
  items,
  fetchToday = false,
}: UsePlannerNotificationsOptions = {}) {
  const [permission, setPermission] = useState<PlannerNotificationPermission>(
    "default",
  );
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    setPermission(getPlannerNotificationPermission());
  }, []);

  const sendTodaysReminders = useCallback(
    (sourceItems: ScheduledWorkspaceItem[]) => {
      const todayKey = getTodayUtcDateKey();

      if (wasDailyReminderSent(todayKey)) {
        return;
      }

      const dueToday = filterPostsDueOnDate(sourceItems, todayKey);

      if (dueToday.length === 0) {
        return;
      }

      notifyTodaysScheduledPosts(dueToday);
      markDailyReminderSent(todayKey);
    },
    [],
  );

  useEffect(() => {
    if (permission !== "granted") {
      return;
    }

    if (items !== undefined) {
      sendTodaysReminders(items);
      return;
    }

    if (!fetchToday) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch("/api/planner/today", {
          credentials: "same-origin",
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { items: ScheduledWorkspaceItem[] };
        sendTodaysReminders(data.items ?? []);
      } catch {
        // Non-blocking background reminder.
      }
    })();
  }, [fetchToday, items, permission, sendTodaysReminders]);

  const enableNotifications = useCallback(async () => {
    setIsRequesting(true);

    try {
      const result = await requestPlannerNotificationPermission();
      setPermission(result);

      if (result === "granted") {
        if (items) {
          sendTodaysReminders(items);
        } else if (fetchToday) {
          const response = await fetch("/api/planner/today", {
            credentials: "same-origin",
          });

          if (response.ok) {
            const data = (await response.json()) as {
              items: ScheduledWorkspaceItem[];
            };
            sendTodaysReminders(data.items ?? []);
          }
        }
      }

      return result;
    } finally {
      setIsRequesting(false);
    }
  }, [fetchToday, items, sendTodaysReminders]);

  return {
    supported: isBrowserNotificationSupported(),
    permission,
    isRequesting,
    enableNotifications,
  };
}
