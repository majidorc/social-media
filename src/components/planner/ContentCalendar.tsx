"use client";

import { PlatformBadges } from "@/components/planner/PlatformBadges";
import { ScheduledPostModal } from "@/components/planner/ScheduledPostModal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  getCalendarCells,
  scheduledDateKey,
} from "@/lib/planner-calendar";
import { getPlannerItemDisplayTitle } from "@/lib/workspace-planner";
import type { PlannerMonthResponse, ScheduledWorkspaceItem } from "@/types";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ContentCalendarProps {
  initialYear: number;
  initialMonth: number;
  initialItems: ScheduledWorkspaceItem[];
}

export function ContentCalendar({
  initialYear,
  initialMonth,
  initialItems,
}: ContentCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [items, setItems] = useState(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ScheduledWorkspaceItem | null>(
    null,
  );

  const monthLabel = useMemo(
    () =>
      new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
    [month, year],
  );

  const loadMonth = useCallback(async (targetYear: number, targetMonth: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/planner?year=${targetYear}&month=${targetMonth}`,
        { credentials: "same-origin" },
      );
      const data = (await response.json()) as PlannerMonthResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load calendar.");
      }

      setItems(data.items);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load calendar.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (year === initialYear && month === initialMonth) {
      setItems(initialItems);
      return;
    }

    void loadMonth(year, month);
  }, [initialItems, initialMonth, initialYear, loadMonth, month, year]);

  const itemsByDay = useMemo(() => {
    const grouped = new Map<string, ScheduledWorkspaceItem[]>();

    for (const item of items) {
      const key = scheduledDateKey(item.scheduledFor);
      const existing = grouped.get(key) ?? [];
      existing.push(item);
      grouped.set(key, existing);
    }

    return grouped;
  }, [items]);

  const cells = useMemo(() => getCalendarCells(year, month), [month, year]);

  const goToPreviousMonth = () => {
    if (month === 1) {
      setYear((value) => value - 1);
      setMonth(12);
      return;
    }

    setMonth((value) => value - 1);
  };

  const goToNextMonth = () => {
    if (month === 12) {
      setYear((value) => value + 1);
      setMonth(1);
      return;
    }

    setMonth((value) => value + 1);
  };

  const goToToday = () => {
    setYear(today.getUTCFullYear());
    setMonth(today.getUTCMonth() + 1);
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-card shadow-sm shadow-black/5 dark:shadow-black/20">
        <div className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-sm font-medium text-accent-text">Editorial calendar</p>
            <h2 className="text-xl font-semibold text-foreground">{monthLabel}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Previous month"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Next month"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error ? (
          <div className="border-b border-border px-4 py-3 text-sm text-red-300 sm:px-5">
            {error}
          </div>
        ) : null}

        <div className="relative p-3 sm:p-4">
          {isLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-card/70 backdrop-blur-[1px]">
              <Loader2 className="h-6 w-6 animate-spin text-accent-text" />
            </div>
          ) : null}

          <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="px-1 py-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted sm:text-xs"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {cells.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-24 rounded-xl border border-transparent bg-transparent sm:min-h-28"
                  />
                );
              }

              const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayItems = itemsByDay.get(dateKey) ?? [];
              const isToday =
                today.getUTCFullYear() === year &&
                today.getUTCMonth() + 1 === month &&
                today.getUTCDate() === day;

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "min-h-24 rounded-xl border bg-card-muted p-1.5 sm:min-h-28 sm:p-2",
                    isToday
                      ? "border-violet-500/40 ring-1 ring-violet-500/20"
                      : "border-border",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                        isToday
                          ? "bg-violet-600 text-white"
                          : "text-foreground",
                      )}
                    >
                      {day}
                    </span>
                    {dayItems.length > 0 ? (
                      <span className="text-[10px] font-medium text-muted">
                        {dayItems.length}
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    {dayItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedItem(item)}
                        className="w-full rounded-lg border border-border bg-card px-1.5 py-1.5 text-left transition-colors hover:border-violet-500/30 hover:bg-accent-soft/40 sm:px-2"
                      >
                        <span
                          className="block max-w-full truncate text-xs font-medium text-foreground"
                          title={getPlannerItemDisplayTitle(item, 80)}
                        >
                          {getPlannerItemDisplayTitle(item, 20)}
                        </span>
                        <PlatformBadges
                          platforms={item.platforms}
                          className="mt-1"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <ScheduledPostModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
