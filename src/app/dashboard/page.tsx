export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ContentGenerator } from "@/components/dashboard/ContentGenerator";
import { getSettings } from "@/lib/actions/settings";
import { getDefaultModel } from "@/lib/actions/settings";
import { getCurrentUser } from "@/lib/get-current-user";
import { getEffectivePlan } from "@/lib/subscription";

export default async function DashboardPage() {
  const [settings, defaultModel, user] = await Promise.all([
    getSettings(),
    getDefaultModel(),
    getCurrentUser(),
  ]);

  return (
    <AppShell
      user={
        user
          ? { name: user.name, email: user.email, image: user.image }
          : null
      }
      plan={getEffectivePlan(user?.settings)}
    >
      <Suspense
        fallback={
          <div className="flex min-h-40 items-center justify-center text-sm text-muted">
            Loading generator...
          </div>
        }
      >
        <ContentGenerator
          defaultModel={defaultModel}
          planFeatures={settings.planFeatures}
        />
      </Suspense>
    </AppShell>
  );
}
