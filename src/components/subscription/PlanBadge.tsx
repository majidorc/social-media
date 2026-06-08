import { getPlanLabel } from "@/lib/plans";
import type { Plan } from "@/types";
import { cn } from "@/lib/utils";

interface PlanBadgeProps {
  plan: Plan;
  className?: string;
}

const PLAN_STYLES: Record<Plan, string> = {
  FREE: "border-border bg-card-muted text-muted",
  PRO: "border-violet-500/30 bg-accent-soft text-accent-text",
  AGENCY: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300",
};

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        PLAN_STYLES[plan],
        className,
      )}
    >
      {getPlanLabel(plan)}
    </span>
  );
}
