export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { ContentGenerator } from "@/components/dashboard/ContentGenerator";
import { getDefaultModel, getSettings } from "@/lib/actions/settings";

export default async function DashboardPage() {
  const [defaultModel, settings] = await Promise.all([
    getDefaultModel(),
    getSettings(),
  ]);

  return (
    <AppShell>
      <ContentGenerator
        defaultModel={defaultModel}
        availableModels={settings.availableModels}
      />
    </AppShell>
  );
}
