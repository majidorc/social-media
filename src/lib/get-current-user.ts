import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isUserAccessBlocked,
  UserAccessBlockedError,
} from "@/lib/user-status";

export { UserAccessBlockedError };

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

  if (isUserAccessBlocked(user.status)) {
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
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      settings: true,
      apiKeys: true,
    },
  });

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (isUserAccessBlocked(user.status)) {
    throw new UserAccessBlockedError(user.status);
  }

  if (user.settings) {
    return user;
  }

  const settings = await prisma.userSettings.create({
    data: { userId: user.id },
  });

  return { ...user, settings };
}
