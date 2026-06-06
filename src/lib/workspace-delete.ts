import { prisma } from "@/lib/prisma";

export async function deleteWorkspaceForUser(
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const workspace = await prisma.contentWorkspace.findFirst({
    where: {
      id: workspaceId,
      userId,
    },
    select: { id: true },
  });

  if (!workspace) {
    return false;
  }

  // Generated images live on provider URLs or inline data in JSON — no app blob storage.
  await prisma.contentWorkspace.delete({
    where: { id: workspace.id },
  });

  return true;
}

export async function deleteAllWorkspacesForUser(userId: string): Promise<number> {
  const result = await prisma.contentWorkspace.deleteMany({
    where: { userId },
  });

  return result.count;
}
