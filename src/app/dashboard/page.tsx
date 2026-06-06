export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { ContentGenerator } from "@/components/dashboard/ContentGenerator";
import { getDefaultModel } from "@/lib/actions/settings";
import { getCurrentUser } from "@/lib/get-current-user";

export default async function DashboardPage() {
  const [defaultModel, user] = await Promise.all([
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
    >
      <ContentGenerator defaultModel={defaultModel} />
    </AppShell>
  );
}
