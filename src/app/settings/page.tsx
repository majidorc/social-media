export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { getSettings } from "@/lib/actions/settings";
import { getCurrentUser } from "@/lib/get-current-user";
import { getEffectivePlan } from "@/lib/subscription";

export default async function SettingsPage() {
  const [settings, user] = await Promise.all([
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
      plan={getEffectivePlan(user?.settings)}
    >
      <SettingsForm initialSettings={settings} />
    </AppShell>
  );
}
