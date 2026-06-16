import type { Role } from "@prisma/client";
import { requireCurrentUser } from "@/lib/get-current-user";
import { prisma } from "@/lib/prisma";

export const OWNER_ADMIN_EMAIL = "o0dr.orc0o@gmail.com";

export class AdminForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "AdminForbiddenError";
  }
}

export function isOwnerAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  return email.trim().toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase();
}

export async function ensureOwnerAdminRole(
  userId: string,
  email: string | null | undefined,
): Promise<void> {
  if (!isOwnerAdminEmail(email)) {
    return;
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "ADMIN" },
    });
  } catch (error) {
    console.error("[admin] Failed to assign owner admin role:", error);
  }
}

export function isAdminRole(role: Role | null | undefined): boolean {
  return role === "ADMIN";
}

export async function requireAdminUser() {
  const user = await requireCurrentUser();

  if (!isAdminRole(user.role)) {
    throw new AdminForbiddenError();
  }

  return user;
}

interface AdminTargetUser {
  id: string;
  email: string | null;
}

export function assertAdminCanModifyTarget(
  adminId: string,
  target: AdminTargetUser,
  action: "delete" | "ban" | "deactivate" | "change",
): void {
  if (target.id === adminId) {
    throw new Error(`You cannot ${action} your own account.`);
  }

  if (isOwnerAdminEmail(target.email)) {
    throw new Error("The owner admin account is protected.");
  }
}
