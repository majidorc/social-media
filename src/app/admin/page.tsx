export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AppShell } from "@/components/layout/AppShell";
import { isAdminRole } from "@/lib/admin";
import { getCurrentUser } from "@/lib/get-current-user";
import { getEffectivePlan } from "@/lib/subscription";
import { Shield } from "lucide-react";

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || !isAdminRole(user.role)) {
    redirect("/dashboard");
  }

  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
      }}
      plan={getEffectivePlan(user.settings)}
      isAdmin
    >
      <div className="space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-accent-soft px-3 py-1 text-xs font-medium text-accent-text">
            <Shield className="h-3.5 w-3.5" />
            Admin panel
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            User management
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Review registered accounts, adjust subscription plans, and manage admin
            access. Changes apply immediately.
          </p>
        </header>

        <AdminUsersTable />
      </div>
    </AppShell>
  );
}
