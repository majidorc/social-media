"use client";

import { PlanBadge } from "@/components/subscription/PlanBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import { getPlanLabel } from "@/lib/plans";
import { getUserStatusLabel, USER_STATUS_OPTIONS } from "@/lib/user-status";
import { cn } from "@/lib/utils";
import type {
  AdminUserRecord,
  AdminUsersResponse,
  Plan,
  Role,
  UserStatus,
} from "@/types";
import { Ban, Loader2, Shield, Trash2, UserCheck, UserX } from "lucide-react";
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
          deletedUserId?: string;
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
      <div className="flex min-h-48 items-center justify-center rounded-2xl border border-border bg-card px-6 py-10 text-sm text-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading users...
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" className="rounded-2xl">
        {error}
      </Alert>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-card-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Date Joined
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Current Role
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">Plan</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => {
                const isUpdating = isPending && pendingUserId === user.id;
                const locked = isRowLocked(user);

                return (
                  <tr key={user.id} className="bg-card/60">
                    <td className="px-4 py-4 align-top">
                      <p className="min-w-[8rem] font-medium text-foreground">
                        {user.name ?? "Unnamed user"}
                      </p>
                      {user.isProtected ? (
                        <p className="mt-1 text-[11px] text-muted">Protected owner</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="min-w-[10rem] text-sm text-muted">
                        {user.email ?? "No email"}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top text-muted">
                      {formatJoinedDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          statusBadgeClassName(user.status),
                        )}
                      >
                        {getUserStatusLabel(user.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          user.role === "ADMIN"
                            ? "border-violet-500/30 bg-accent-soft text-accent-text"
                            : "border-border bg-card-muted text-muted",
                        )}
                      >
                        {user.role === "ADMIN" ? (
                          <Shield className="h-3 w-3" aria-hidden="true" />
                        ) : null}
                        {user.role === "ADMIN" ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <PlanBadge plan={user.plan} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex min-w-[18rem] flex-col gap-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Select
                            label="Role"
                            value={user.role}
                            disabled={isUpdating || locked}
                            onChange={(event) =>
                              updateUser(user.id, {
                                role: event.target.value as Role,
                              })
                            }
                            options={ROLE_OPTIONS.map((option) => ({
                              value: option.value,
                              label: option.label,
                            }))}
                          />
                          <Select
                            label="Plan"
                            value={user.plan}
                            disabled={isUpdating}
                            onChange={(event) =>
                              updateUser(user.id, {
                                plan: event.target.value as Plan,
                              })
                            }
                            options={PLAN_OPTIONS.map((option) => ({
                              value: option.value,
                              label: getPlanLabel(option.value),
                            }))}
                          />
                        </div>

                        <Select
                          label="Account status"
                          value={user.status}
                          disabled={isUpdating || locked}
                          onChange={(event) =>
                            updateUser(user.id, {
                              status: event.target.value as UserStatus,
                            })
                          }
                          options={USER_STATUS_OPTIONS.map((option) => ({
                            value: option.value,
                            label: option.label,
                          }))}
                        />

                        <div className="flex flex-wrap gap-2">
                          {user.status !== "ACTIVE" && !locked ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={isUpdating}
                              onClick={() =>
                                updateUser(user.id, { status: "ACTIVE" })
                              }
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              Reactivate
                            </Button>
                          ) : null}

                          {user.status === "ACTIVE" && !locked ? (
                            <>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateUser(user.id, { status: "DEACTIVATED" })
                                }
                              >
                                <UserX className="h-3.5 w-3.5" />
                                Deactivate
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() =>
                                  updateUser(user.id, { status: "BANNED" })
                                }
                              >
                                <Ban className="h-3.5 w-3.5" />
                                Ban
                              </Button>
                            </>
                          ) : null}

                          {!locked ? (
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              disabled={isUpdating}
                              onClick={() => deleteUser(user)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </Button>
                          ) : null}
                        </div>

                        {isUpdating ? (
                          <p className="flex items-center gap-1 text-xs text-muted">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Saving...
                          </p>
                        ) : null}
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
