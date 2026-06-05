"use client";

import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { LayoutDashboard, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-zinc-800 bg-zinc-950/80 lg:fixed lg:inset-y-0 lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 border-b border-zinc-800 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-100">{APP_NAME}</p>
          <p className="text-xs text-zinc-500">Content creation studio</p>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-4 py-4 lg:flex-col lg:gap-1 lg:px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-violet-600/15 text-violet-300"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden border-t border-zinc-800 p-4 lg:block">
        <p className="rounded-xl bg-zinc-900/80 p-3 text-xs leading-relaxed text-zinc-500">
          Multi-platform generation with optional inputs. Configure API keys in
          Settings before going live.
        </p>
      </div>
    </aside>
  );
}
