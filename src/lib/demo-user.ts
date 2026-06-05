import { prisma } from "@/lib/prisma";
import { DEMO_USER_EMAIL } from "@/lib/constants";

/**
 * Returns a demo user for development until auth is implemented.
 */
export async function getDemoUser() {
  return prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    create: {
      email: DEMO_USER_EMAIL,
      name: "Demo User",
      settings: {
        create: {},
      },
    },
    update: {},
    include: {
      settings: true,
      apiKeys: true,
    },
  });
}
