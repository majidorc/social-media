"use client";

import { usePlannerNotifications } from "@/hooks/usePlannerNotifications";

/** Background watcher — fires today's publish reminders when permission is granted. */
export function PlannerNotificationWatcher() {
  usePlannerNotifications({ fetchToday: true });
  return null;
}
