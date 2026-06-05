const MOCK_PREFIX = "enc:v1:";

/**
 * Mock encryption — base64 encodes the key with a prefix.
 * Replace with AES-256-GCM or a KMS-backed solution in production.
 */
export function encryptApiKey(plainText: string): string {
  if (!plainText.trim()) {
    throw new Error("API key cannot be empty");
  }

  const encoded = Buffer.from(plainText, "utf-8").toString("base64");
  return `${MOCK_PREFIX}${encoded}`;
}

export function decryptApiKey(encrypted: string): string {
  if (!encrypted.startsWith(MOCK_PREFIX)) {
    return encrypted;
  }

  const encoded = encrypted.slice(MOCK_PREFIX.length);
  return Buffer.from(encoded, "base64").toString("utf-8");
}

export function maskApiKey(plainText: string): string {
  if (plainText.length <= 8) {
    return "••••••••";
  }

  return `${plainText.slice(0, 4)}${"•".repeat(12)}${plainText.slice(-4)}`;
}
