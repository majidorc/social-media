import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/get-current-user";
import { prisma } from "@/lib/prisma";
import { toWorkspaceDetail } from "@/lib/workspace-history";
import type { WorkspaceDetailResponse } from "@/types";

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
