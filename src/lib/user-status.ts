import type { UserStatus } from "@prisma/client";

export class UserAccessBlockedError extends Error {
  constructor(
    public readonly status: UserStatus,
    message?: string,
  ) {
    super(
      message ??
        (status === "BANNED"
          ? "This account has been banned."
          : "This account has been deactivated."),
    );
    this.name = "UserAccessBlockedError";
  }
}

export function isUserAccessBlocked(status: UserStatus): boolean {
  return status === "BANNED" || status === "DEACTIVATED";
}

export function getUserStatusLabel(status: UserStatus): string {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "DEACTIVATED":
      return "Deactivated";
    case "BANNED":
      return "Banned";
    default:
      return status;
  }
}

export const USER_STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "DEACTIVATED", label: "Deactivated" },
  { value: "BANNED", label: "Banned" },
];
