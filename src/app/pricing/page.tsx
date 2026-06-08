export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { PricingSection } from "@/components/marketing/PricingSection";
import { isAdminRole } from "@/lib/admin";
import { getCurrentUser } from "@/lib/get-current-user";
import { getEffectivePlan } from "@/lib/subscription";
import Link from "next/link";

export default async function PricingPage() {
  const user = await getCurrentUser();

  if (user) {
    return (
      <AppShell
        user={{
          name: user.name,
          email: user.email,
          image: user.image,
        }}
        plan={getEffectivePlan(user.settings)}
        isAdmin={isAdminRole(user.role)}
      >
        <header className="mb-8 space-y-2">
          <p className="text-sm font-medium text-accent-text">Billing</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Choose your plan
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Upgrade securely with Stripe. You keep your own API keys — plans unlock
            premium workflow features.
          </p>
        </header>
        <PricingSection />
      </AppShell>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-accent-text hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </header>
      <PricingSection />
    </div>
  );
}
