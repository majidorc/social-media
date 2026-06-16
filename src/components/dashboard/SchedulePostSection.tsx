"use client";

import {
  clearWorkspaceSchedule,
  scheduleWorkspace,
} from "@/lib/actions/planner";
import { formatScheduledDate, toDateInputValue } from "@/lib/planner-calendar";
import { notifyPostScheduled } from "@/lib/planner-notifications";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toast } from "@/components/ui/Toast";
import { CalendarClock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

interface SchedulePostSectionProps {
  workspaceId: string | null;
  scheduledFor: string | null;
  onScheduledChange?: (scheduledFor: string | null) => void;
  canSchedule?: boolean;
}

export function SchedulePostSection({
  workspaceId,
  scheduledFor,
  onScheduledChange,
  canSchedule = true,
}: SchedulePostSectionProps) {
  const [dateValue, setDateValue] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (scheduledFor) {
      setDateValue(toDateInputValue(new Date(scheduledFor)));
      return;
    }

    setDateValue("");
  }, [scheduledFor]);

  const showToast = (message: string, variant: "success" | "error") => {
    setToastVariant(variant);
    setToastMessage(message);
  };

  const handleConfirmSchedule = () => {
    if (!workspaceId) {
      showToast("Save a generation before scheduling.", "error");
      return;
    }

    if (!dateValue) {
      showToast("Choose a date to schedule this post.", "error");
      return;
    }

    startTransition(async () => {
      const result = await scheduleWorkspace(workspaceId, dateValue);

      if (!result.success) {
        showToast(result.message, "error");
        return;
      }

      onScheduledChange?.(result.scheduledFor ?? null);
      showToast(result.message, "success");

      if (result.scheduledFor) {
        notifyPostScheduled(
          "Your content",
          formatScheduledDate(result.scheduledFor),
        );
      }
    });
  };

  const handleClearSchedule = () => {
    if (!workspaceId) {
      return;
    }

    startTransition(async () => {
      const result = await clearWorkspaceSchedule(workspaceId);

      if (!result.success) {
        showToast(result.message, "error");
        return;
      }

      setDateValue("");
      onScheduledChange?.(null);
      showToast(result.message, "success");
    });
  };

  if (!canSchedule) {
    return (
      <section className="rounded-xl border border-border bg-card-muted p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Content planner is a Pro feature
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Upgrade to Pro to schedule posts and manage them on your editorial
              calendar.
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-flex text-xs font-medium text-accent-text underline underline-offset-2"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-xl border border-violet-500/20 bg-accent-soft/40 p-4">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Schedule post</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Pick a publish date for this generation. It will appear on your
              editorial calendar in Planner.
            </p>
            {scheduledFor ? (
              <p className="mt-2 text-xs font-medium text-accent-text">
                Currently scheduled for {formatScheduledDate(scheduledFor)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Publish date"
              type="date"
              value={dateValue}
              min={toDateInputValue(new Date())}
              onChange={(event) => setDateValue(event.target.value)}
              hint="Select the day this content should go live."
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              onClick={handleConfirmSchedule}
              disabled={isPending || !workspaceId}
              className="sm:min-w-[10rem]"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CalendarClock className="h-4 w-4" />
              )}
              Confirm schedule
            </Button>
            {scheduledFor ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handleClearSchedule}
                disabled={isPending}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <Toast
        message={toastMessage}
        variant={toastVariant}
        onDismiss={() => setToastMessage(null)}
      />
    </>
  );
}
