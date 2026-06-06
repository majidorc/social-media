export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { ContentGenerator } from "@/components/dashboard/ContentGenerator";
import { getDefaultModel, getSettings } from "@/lib/actions/settings";
import { getCurrentUser } from "@/lib/get-current-user";

export default async function DashboardPage() {
  const [defaultModel, settings, user] = await Promise.all([
    getDefaultModel(),
    getSettings(),
    getCurrentUser(),
  ]);

  return (
    <AppShell
      user={
        user
          ? { name: user.name, email: user.email, image: user.image }
          : null
      }
    >
      <ContentGenerator
        defaultModel={defaultModel}
        availableModels={settings.availableModels}
        availableImageModels={settings.availableImageModels}
      />
    </AppShell>
  );
}
