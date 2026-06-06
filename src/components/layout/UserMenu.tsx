"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import Image from "next/image";

interface UserMenuProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export function UserMenu({ name, email, image }: UserMenuProps) {
  return (
    <div className="border-t border-zinc-800 p-4">
      <div className="mb-3 flex items-center gap-3 rounded-xl bg-zinc-900/80 p-3">
        {image ? (
          <Image
            src={image}
            alt={name ?? "User avatar"}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600/20 text-sm font-semibold text-violet-300">
            {(name ?? email ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-100">
            {name ?? "Signed in"}
          </p>
          {email ? (
            <p className="truncate text-xs text-zinc-500">{email}</p>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}
