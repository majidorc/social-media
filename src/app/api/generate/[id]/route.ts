import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/get-current-user";
import { prisma } from "@/lib/prisma";
import {
  deleteAllWorkspacesForUser,
  deleteWorkspaceForUser,
} from "@/lib/workspace-delete";
import { toWorkspaceDetail } from "@/lib/workspace-history";
import type {
  ClearHistoryResponse,
  DeleteWorkspaceResponse,
  WorkspaceDetailResponse,
} from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;

    const workspace = await prisma.contentWorkspace.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Generation not found." }, { status: 404 });
    }

    const response: WorkspaceDetailResponse = {
      workspace: toWorkspaceDetail(workspace),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[GET /api/generate/[id]]", error);
    return NextResponse.json(
      { error: "Failed to load generation." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;

    const deleted = await deleteWorkspaceForUser(id, user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Generation not found." }, { status: 404 });
    }

    const response: DeleteWorkspaceResponse = {
      success: true,
      deletedId: id,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[DELETE /api/generate/[id]]", error);
    return NextResponse.json(
      { error: "Failed to delete generation." },
      { status: 500 },
    );
  }
}
