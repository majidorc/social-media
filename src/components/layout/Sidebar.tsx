"use client";

import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { HistoryPanel } from "@/components/layout/HistoryPanel";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { notifyNewGenerationRequest } from "@/lib/generation-history-events";
import { CalendarDays, LayoutDashboard, Plus, Settings, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planner", label: "Planner", icon: CalendarDays },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface SidebarContentProps {
  user?: SidebarUser | null;
  onNavigate?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export function SidebarContent({
  user,
  onNavigate,
  showCloseButton = false,
  onClose,
}: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNewRequest = () => {
    notifyNewGenerationRequest();
    if (pathname.startsWith("/dashboard")) {
      router.replace("/dashboard");
    } else {
      router.push("/dashboard");
    }
    onNavigate?.();
  };

  const navLinkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
      active
        ? "bg-accent-soft text-accent-text"
        : "text-muted hover:bg-card-muted hover:text-foreground",
    );

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {APP_NAME}
          </p>
          <p className="text-xs text-muted">Content creation studio</p>
        </div>
        {showCloseButton ? (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="rounded-lg p-2 text-muted transition-colors hover:bg-card-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="px-3 py-3">
        <button
          type="button"
          onClick={handleNewRequest}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 active:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          New generation
        </button>
      </div>

      <nav className="flex flex-col gap-1 px-3 pb-2">
        {navItems.slice(0, 2).map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={navLinkClass(active)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <Suspense
        fallback={
          <div className="border-t border-border px-3 py-4">
            <p className="px-3 text-xs text-muted">Loading history...</p>
          </div>
        }
      >
        <HistoryPanel onNavigate={onNavigate} />
      </Suspense>

      <nav className="flex flex-col gap-1 px-3 pb-3">
        {navItems.slice(2).map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={navLinkClass(active)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-border p-3">
        <ThemeToggle />
        {user ? (
          <UserMenu
            name={user.name}
            email={user.email}
            image={user.image}
          />
        ) : (
          <p className="rounded-xl bg-card-muted p-3 text-xs leading-relaxed text-muted">
            Multi-platform generation with optional inputs. Configure API keys
            in Settings before going live.
          </p>
        )}
      </div>
    </div>
  );
}
