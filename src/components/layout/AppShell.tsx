"use client";

import { SidebarContent } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { APP_NAME } from "@/lib/constants";
import { notifyNewGenerationRequest } from "@/lib/generation-history-events";
import type { Plan } from "@/types";
import { cn } from "@/lib/utils";
import { Menu, Plus, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null;
  plan?: Plan;
  isAdmin?: boolean;
}

export function AppShell({
  children,
  user,
  plan = "FREE",
  isAdmin = false,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const handleNewRequest = () => {
    notifyNewGenerationRequest();
    if (pathname.startsWith("/dashboard")) {
      router.replace("/dashboard");
    } else {
      router.push("/dashboard");
    }
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-border bg-sidebar/95 px-3 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card-muted text-foreground"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{APP_NAME}</p>
          <p className="truncate text-xs text-muted">AI content studio</p>
        </div>
        <ThemeToggle compact />
        <button
          type="button"
          aria-label="New generation"
          onClick={handleNewRequest}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white transition-colors hover:bg-violet-500"
        >
          <Plus className="h-5 w-5" />
        </button>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu backdrop"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={cn(
              "absolute inset-y-0 left-0 flex w-[min(100vw-3rem,18rem)] flex-col border-r border-border bg-sidebar shadow-2xl",
            )}
          >
            <SidebarContent
              user={user}
              plan={plan}
              isAdmin={isAdmin}
              showCloseButton
              onClose={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      ) : null}

      <div className="lg:flex lg:min-h-screen">
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex">
          <SidebarContent user={user} plan={plan} isAdmin={isAdmin} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
