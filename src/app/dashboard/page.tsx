export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { ContentGenerator } from "@/components/dashboard/ContentGenerator";
import { getDefaultModel } from "@/lib/actions/settings";

export default async function DashboardPage() {
  const defaultModel = await getDefaultModel();

  return (
    <AppShell>
      <ContentGenerator defaultModel={defaultModel} />
    </AppShell>
  );
}
