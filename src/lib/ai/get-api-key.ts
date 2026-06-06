import type { AiProvider } from "@prisma/client";
import { requireCurrentUser } from "@/lib/get-current-user";
import { decryptApiKey } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";

export class MissingApiKeyError extends Error {
  constructor(public provider: AiProvider) {
    super(`API key not configured for ${provider}`);
    this.name = "MissingApiKeyError";
  }
}

export async function getProviderApiKey(
  provider: AiProvider,
): Promise<string> {
  const user = await requireCurrentUser();

  const record = await prisma.apiKey.findUnique({
    where: {
      userId_provider: {
        userId: user.id,
        provider,
      },
    },
  });

  if (!record) {
    throw new MissingApiKeyError(provider);
  }

  return decryptApiKey(record.encryptedKey);
}
