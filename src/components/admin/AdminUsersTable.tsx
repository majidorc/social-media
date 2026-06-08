"use client";

import { PlanBadge } from "@/components/subscription/PlanBadge";
import { Alert } from "@/components/ui/Alert";
import { Select } from "@/components/ui/Select";
import { Toast } from "@/components/ui/Toast";
import { getPlanLabel } from "@/lib/plans";
import type { AdminUserRecord, AdminUsersResponse, Plan, Role } from "@/types";
import { Loader2, Shield } from "lucide-react";
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

export function AdminUsersTable() {
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

  const updateUser = (userId: string, patch: { role?: Role; plan?: Plan }) => {
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
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Current Role
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  Active Subscription Plan
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => {
                const isUpdating = isPending && pendingUserId === user.id;

                return (
                  <tr key={user.id} className="bg-card/60">
                    <td className="px-4 py-4 align-top">
                      <p className="min-w-[8rem] font-medium text-foreground">
                        {user.name ?? "Unnamed user"}
                      </p>
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
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          user.role === "ADMIN"
                            ? "border-violet-500/30 bg-accent-soft text-accent-text"
                            : "border-border bg-card-muted text-muted"
                        }`}
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
                      <div className="flex min-w-[16rem] flex-col gap-3 sm:min-w-[20rem] sm:flex-row">
                        <Select
                          label="Role"
                          value={user.role}
                          disabled={isUpdating}
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
                      {isUpdating ? (
                        <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Saving...
                        </p>
                      ) : null}
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
