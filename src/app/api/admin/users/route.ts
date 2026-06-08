import { NextResponse } from "next/server";
import { z } from "zod";
import type { Plan, Role } from "@prisma/client";
import { AdminForbiddenError, requireAdminUser } from "@/lib/admin";
import { getEffectivePlan } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";
import type { AdminUpdateUserResponse, AdminUsersResponse } from "@/types";

const updateUserSchema = z
  .object({
    userId: z.string().min(1),
    role: z.enum(["USER", "ADMIN"]).optional(),
    plan: z.enum(["FREE", "PRO", "AGENCY"]).optional(),
  })
  .refine((value) => value.role !== undefined || value.plan !== undefined, {
    message: "Provide a role or plan to update.",
  });

function toAdminUserRecord(user: {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  createdAt: Date;
  settings: { plan: Plan; planExpiresAt: Date | null } | null;
}) {
  const plan = getEffectivePlan(user.settings);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan,
    createdAt: user.createdAt.toISOString(),
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

    if (parsed.data.role !== undefined) {
      await prisma.user.update({
        where: { id: parsed.data.userId },
        data: { role: parsed.data.role },
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
        parsed.data.userId === admin.id
          ? "Your account was updated."
          : "User updated successfully.",
      user: toAdminUserRecord(updated),
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AdminForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("[PATCH /api/admin/users]", error);
    return NextResponse.json(
      { error: "Failed to update user." },
      { status: 500 },
    );
  }
}
