import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      settings: true,
      apiKeys: true,
    },
  });

  if (!user) {
    return null;
  }

  if (user.settings) {
    return user;
  }

  const settings = await prisma.userSettings.create({
    data: { userId: user.id },
  });

  return { ...user, settings };
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
