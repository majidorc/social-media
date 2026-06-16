import { NextResponse } from "next/server";
import { z } from "zod";
import type { Plan, Role, UserStatus } from "@prisma/client";
import {
  AdminForbiddenError,
  assertAdminCanModifyTarget,
  isOwnerAdminEmail,
  requireAdminUser,
} from "@/lib/admin";
import { getEffectivePlan } from "@/lib/subscription";
import { getUserStatusLabel } from "@/lib/user-status";
import { prisma } from "@/lib/prisma";
import type {
  AdminDeleteUserResponse,
  AdminUpdateUserResponse,
  AdminUsersResponse,
} from "@/types";

const updateUserSchema = z
  .object({
    userId: z.string().min(1),
    role: z.enum(["USER", "ADMIN"]).optional(),
    plan: z.enum(["FREE", "PRO", "AGENCY"]).optional(),
    status: z.enum(["ACTIVE", "DEACTIVATED", "BANNED"]).optional(),
  })
  .refine(
    (value) =>
      value.role !== undefined ||
      value.plan !== undefined ||
      value.status !== undefined,
    { message: "Provide a role, plan, or status to update." },
  );

const deleteUserSchema = z.object({
  userId: z.string().min(1),
});

function toAdminUserRecord(user: {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  settings: { plan: Plan; planExpiresAt: Date | null } | null;
}) {
  const plan = getEffectivePlan(user.settings);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    plan,
    createdAt: user.createdAt.toISOString(),
    isProtected: isOwnerAdminEmail(user.email),
  };
}

export async function GET() {
  try {
    await requireAdminUser();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        settings: {
          select: {
            plan: true,
            planExpiresAt: true,
          },
        },
      },
    });

    const response: AdminUsersResponse = {
      users: users.map(toAdminUserRecord),
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AdminForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("[GET /api/admin/users]", error);
    return NextResponse.json(
      { error: "Failed to load users." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        settings: {
          select: {
            plan: true,
            planExpiresAt: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (parsed.data.role !== undefined && parsed.data.role !== existing.role) {
      assertAdminCanModifyTarget(admin.id, existing, "change");
      await prisma.user.update({
        where: { id: parsed.data.userId },
        data: { role: parsed.data.role },
      });
    }

    if (parsed.data.status !== undefined && parsed.data.status !== existing.status) {
      const action =
        parsed.data.status === "BANNED"
          ? "ban"
          : parsed.data.status === "DEACTIVATED"
            ? "deactivate"
            : "change";
      assertAdminCanModifyTarget(admin.id, existing, action);
      await prisma.user.update({
        where: { id: parsed.data.userId },
        data: { status: parsed.data.status },
      });
    }

    if (parsed.data.plan !== undefined) {
      await prisma.userSettings.upsert({
        where: { userId: parsed.data.userId },
        create: {
          userId: parsed.data.userId,
          plan: parsed.data.plan,
          planExpiresAt: null,
        },
        update: {
          plan: parsed.data.plan,
          planExpiresAt: null,
        },
      });
    }

    const updated = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        settings: {
          select: {
            plan: true,
            planExpiresAt: true,
          },
        },
      },
    });

    if (!updated) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const response: AdminUpdateUserResponse = {
      success: true,
      message:
        parsed.data.status !== undefined
          ? `User status set to ${getUserStatusLabel(parsed.data.status)}.`
          : parsed.data.userId === admin.id
            ? "Your account was updated."
            : "User updated successfully.",
      user: toAdminUserRecord(updated),
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AdminForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes("cannot")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("[PATCH /api/admin/users]", error);
    return NextResponse.json(
      { error: "Failed to update user." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdminUser();
    const body = await request.json();
    const parsed = deleteUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid delete payload.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    assertAdminCanModifyTarget(admin.id, existing, "delete");

    await prisma.user.delete({
      where: { id: parsed.data.userId },
    });

    const response: AdminDeleteUserResponse = {
      success: true,
      message: "User account and all related data were permanently deleted.",
      deletedUserId: parsed.data.userId,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AdminForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (error instanceof Error && error.message.includes("cannot")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("[DELETE /api/admin/users]", error);
    return NextResponse.json(
      { error: "Failed to delete user." },
      { status: 500 },
    );
  }
}
