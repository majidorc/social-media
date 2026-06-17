"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { getPlanLabel } from "@/lib/plans";
import { getUserStatusLabel } from "@/lib/user-status";
import { cn } from "@/lib/utils";
import type {
  AdminUserRecord,
  AdminUsersResponse,
  Plan,
  Role,
  UserStatus,
} from "@/types";
import { Ban, Loader2, Trash2, UserCheck, UserX } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "USER", label: "User" },
  { value: "ADMIN", label: "Admin" },
];

const PLAN_OPTIONS: { value: Plan; label: string }[] = [
  { value: "FREE", label: "Free" },
  { value: "PRO", label: "Pro" },
  { value: "AGENCY", label: "Agency" },
];

const compactSelectClassName =
  "h-8 min-w-[5.5rem] rounded-md border border-border bg-input px-2 text-xs text-foreground focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:cursor-not-allowed disabled:opacity-50";

function formatJoinedDate(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(isoDate));
}

function statusBadgeClassName(status: UserStatus): string {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    case "DEACTIVATED":
      return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200";
    case "BANNED":
      return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
    default:
      return "border-border bg-card-muted text-muted";
  }
}

interface AdminUsersTableProps {
  currentAdminId: string;
}

export function AdminUsersTable({ currentAdminId }: AdminUsersTableProps) {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error">("success");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = useCallback((message: string, variant: "success" | "error") => {
    setToastVariant(variant);
    setToastMessage(message);
  }, []);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/users", { credentials: "same-origin" });
      const data = (await response.json()) as AdminUsersResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load users.");
      }

      setUsers(data.users);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load users.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const updateUser = (
    userId: string,
    patch: { role?: Role; plan?: Plan; status?: UserStatus },
  ) => {
    setPendingUserId(userId);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ userId, ...patch }),
        });

        const data = (await response.json()) as {
          success?: boolean;
          message?: string;
          error?: string;
          user?: AdminUserRecord;
        };

        if (!response.ok || !data.success || !data.user) {
          throw new Error(data.error ?? data.message ?? "Failed to update user.");
        }

        setUsers((current) =>
          current.map((user) => (user.id === data.user!.id ? data.user! : user)),
        );
        showToast(data.message ?? "User updated.", "success");
      } catch (updateError) {
        showToast(
          updateError instanceof Error
            ? updateError.message
            : "Failed to update user.",
          "error",
        );
      } finally {
        setPendingUserId(null);
      }
    });
  };

  const deleteUser = (user: AdminUserRecord) => {
    const confirmed = window.confirm(
      `Permanently delete ${user.email ?? user.name ?? "this user"}? This removes their workspaces, API keys, and billing data. This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setPendingUserId(user.id);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/users", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ userId: user.id }),
        });

        const data = (await response.json()) as {
          success?: boolean;
          message?: string;
          error?: string;
        };

        if (!response.ok || !data.success) {
          throw new Error(data.error ?? data.message ?? "Failed to delete user.");
        }

        setUsers((current) => current.filter((item) => item.id !== user.id));
        showToast(data.message ?? "User deleted.", "success");
      } catch (deleteError) {
        showToast(
          deleteError instanceof Error
            ? deleteError.message
            : "Failed to delete user.",
          "error",
        );
      } finally {
        setPendingUserId(null);
      }
    });
  };

  const isRowLocked = (user: AdminUserRecord) =>
    user.isProtected || user.id === currentAdminId;

  if (isLoading) {
    return (
      <div className="flex min-h-32 items-center justify-center rounded-xl border border-border bg-card px-4 py-8 text-sm text-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" className="rounded-xl">
        {error}
      </Alert>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card-muted/80 text-left text-xs font-medium uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Role</th>
                <th className="px-3 py-2.5 font-medium">Plan</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => {
                const isUpdating = isPending && pendingUserId === user.id;
                const locked = isRowLocked(user);

                return (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-card-muted/40"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex min-w-[12rem] items-center gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="truncate font-medium text-foreground">
                              {user.name ?? "Unnamed user"}
                            </p>
                            {user.isProtected ? (
                              <span className="shrink-0 rounded-full border border-violet-500/25 bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent-text">
                                Owner
                              </span>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-muted">
                            {user.email ?? "No email"}
                          </p>
                        </div>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted/80">
                        Joined {formatJoinedDate(user.createdAt)}
                      </p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium",
                          statusBadgeClassName(user.status),
                        )}
                      >
                        {getUserStatusLabel(user.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        aria-label={`Role for ${user.email ?? user.name}`}
                        className={compactSelectClassName}
                        value={user.role}
                        disabled={isUpdating || locked}
                        onChange={(event) =>
                          updateUser(user.id, {
                            role: event.target.value as Role,
                          })
                        }
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5">
                      <select
                        aria-label={`Plan for ${user.email ?? user.name}`}
                        className={compactSelectClassName}
                        value={user.plan}
                        disabled={isUpdating}
                        onChange={(event) =>
                          updateUser(user.id, {
                            plan: event.target.value as Plan,
                          })
                        }
                      >
                        {PLAN_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {getPlanLabel(option.value)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-0.5">
                        {isUpdating ? (
                          <span className="inline-flex h-8 w-8 items-center justify-center text-muted">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          </span>
                        ) : locked ? (
                          <span className="text-xs text-muted">—</span>
                        ) : (
                          <>
                            {user.status !== "ACTIVE" ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-400"
                                title="Reactivate"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateUser(user.id, { status: "ACTIVE" })
                                }
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Deactivate"
                                  disabled={isUpdating}
                                  onClick={() =>
                                    updateUser(user.id, { status: "DEACTIVATED" })
                                  }
                                >
                                  <UserX className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Ban"
                                  disabled={isUpdating}
                                  onClick={() =>
                                    updateUser(user.id, { status: "BANNED" })
                                  }
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400"
                              title="Delete permanently"
                              disabled={isUpdating}
                              onClick={() => deleteUser(user)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted">
            No users registered yet.
          </div>
        ) : null}
      </div>

      <Toast
        message={toastMessage}
        variant={toastVariant}
        onDismiss={() => setToastMessage(null)}
      />
    </>
  );
}
