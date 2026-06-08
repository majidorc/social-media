export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { ContentCalendar } from "@/components/planner/ContentCalendar";
import { UpgradeBanner } from "@/components/subscription/UpgradeBanner";
import { getScheduledWorkspacesForMonth } from "@/lib/actions/planner";
import { isAdminRole } from "@/lib/admin";
import { getCurrentUser } from "@/lib/get-current-user";
import { canUsePlanner, getEffectivePlan } from "@/lib/subscription";

export default async function PlannerPage() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const user = await getCurrentUser();
  const plannerEnabled = canUsePlanner(user?.settings);

  const items = plannerEnabled
    ? await getScheduledWorkspacesForMonth(year, month)
    : [];

  return (
    <AppShell
      user={
        user
          ? { name: user.name, email: user.email, image: user.image }
          : null
      }
      plan={getEffectivePlan(user?.settings)}
      isAdmin={isAdminRole(user?.role)}
    >
      <div className="space-y-4 sm:space-y-6">
        <header className="space-y-1.5 sm:space-y-2">
          <p className="text-sm font-medium text-accent-text">Content Planner</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Editorial calendar
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Review scheduled posts by date. Schedule content from the dashboard
            after a successful generation, then manage your publishing timeline
            here.
          </p>
        </header>

        {!plannerEnabled ? (
          <UpgradeBanner
            title="Unlock the content planner"
            description="Upgrade to Pro to schedule posts on a visual editorial calendar, track publishing dates, and manage your content pipeline from one place."
            requiredPlan="PRO"
          />
        ) : (
          <ContentCalendar
            initialYear={year}
            initialMonth={month}
            initialItems={items}
          />
        )}
      </div>
    </AppShell>
  );
}
