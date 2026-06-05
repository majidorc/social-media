export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { getSettings } from "@/lib/actions/settings";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <AppShell>
      <SettingsForm initialSettings={settings} />
    </AppShell>
  );
}
