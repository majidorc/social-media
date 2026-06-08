"use client";

import { PlanBadge } from "@/components/subscription/PlanBadge";
import type { Plan } from "@/types";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  plan?: Plan;
}

export function UserMenu({ name, email, image, plan = "FREE" }: UserMenuProps) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-3 rounded-xl bg-card-muted p-3">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name ?? "User avatar"}
            width={36}
            height={36}
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-text">
            {(name ?? email ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <p className="min-w-0 truncate text-sm font-medium text-foreground">
              {name ?? "Signed in"}
            </p>
            <PlanBadge plan={plan} />
          </div>
          {email ? (
            <p className="truncate text-xs text-muted">{email}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-card-muted hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}
