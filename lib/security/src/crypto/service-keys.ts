import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function generateApiKey(customPrefix?: string): {
  apiKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const prefix = (customPrefix ?? randomBytes(4).toString("hex")).slice(0, 8);
  const secret = randomBytes(32).toString("hex");
  const apiKey = `kfin_sec_${prefix}_${secret}`;
  const keyHash = hashApiKey(apiKey);

  return {
    apiKey,
    keyPrefix: prefix,
    keyHash,
  };
}

export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

export function verifyApiKey(apiKey: string, storedHash: string): boolean {
  if (!apiKey || !storedHash) return false;

  const candidateHash = hashApiKey(apiKey);
  const candidateBuf = Buffer.from(candidateHash);
  const storedBuf = Buffer.from(storedHash);

  if (candidateBuf.length !== storedBuf.length) {
    return false;
  }

  return timingSafeEqual(candidateBuf, storedBuf);
}
