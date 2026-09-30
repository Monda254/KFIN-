import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { MfaVerificationResult } from "../types";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(base32Str: string): Buffer {
  const cleaned = base32Str.toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const val = BASE32_ALPHABET.indexOf(char);
    if (val === -1) {
      throw new Error(`Invalid Base32 character: ${char}`);
    }

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function generateTotpSecret(byteLength = 20): string {
  const bytes = randomBytes(byteLength);
  return base32Encode(bytes);
}

export function generateTotpCode(
  secretBase32: string,
  timestampMs = Date.now(),
  stepSeconds = 30,
  digits = 6
): { code: string; step: number } {
  const key = base32Decode(secretBase32);
  const step = Math.floor(timestampMs / 1000 / stepSeconds);

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(step));

  const hmac = createHmac("sha1", key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation (RFC 4226)
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const modulus = 10 ** digits;
  const otp = binary % modulus;
  const code = otp.toString().padStart(digits, "0");

  return { code, step };
}

export function verifyTotpCode(
  secretBase32: string,
  candidateCode: string,
  options: {
    window?: number;
    lastUsedStep?: number;
    timestampMs?: number;
    stepSeconds?: number;
    digits?: number;
  } = {}
): MfaVerificationResult {
  const {
    window = 1,
    lastUsedStep = 0,
    timestampMs = Date.now(),
    stepSeconds = 30,
    digits = 6,
  } = options;

  const sanitizedCode = candidateCode.trim().replace(/\s/g, "");
  if (sanitizedCode.length !== digits || !/^\d+$/.test(sanitizedCode)) {
    return { valid: false, error: "Code must be 6 numeric digits" };
  }

  const currentStep = Math.floor(timestampMs / 1000 / stepSeconds);

  for (let errorOffset = -window; errorOffset <= window; errorOffset++) {
    const checkStep = currentStep + errorOffset;
    if (checkStep <= lastUsedStep) {
      // Replay prevention: do not allow code at or prior to last used step
      continue;
    }

    const { code } = generateTotpCode(
      secretBase32,
      checkStep * stepSeconds * 1000,
      stepSeconds,
      digits
    );

    const bufA = Buffer.from(code);
    const bufB = Buffer.from(sanitizedCode);

    if (bufA.length === bufB.length && timingSafeEqual(bufA, bufB)) {
      return { valid: true, step: checkStep };
    }
  }

  return { valid: false, error: "Invalid or expired verification code" };
}

export function generateBackupCodes(count = 10): {
  plaintext: string[];
  hashed: string[];
} {
  const plaintext: string[] = [];
  const hashed: string[] = [];

  for (let i = 0; i < count; i++) {
    const raw = randomBytes(5).toString("hex").toUpperCase();
    const formatted = `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
    const hash = createHash("sha256").update(formatted).digest("hex");

    plaintext.push(formatted);
    hashed.push(hash);
  }

  return { plaintext, hashed };
}

export function verifyBackupCode(
  candidateCode: string,
  hashedCodes: string[]
): { valid: boolean; remainingHashedCodes: string[] } {
  const sanitized = candidateCode.trim().toUpperCase();
  const candidateHash = createHash("sha256").update(sanitized).digest("hex");
  const candidateBuf = Buffer.from(candidateHash);

  for (let i = 0; i < hashedCodes.length; i++) {
    const storedBuf = Buffer.from(hashedCodes[i]);
    if (
      candidateBuf.length === storedBuf.length &&
      timingSafeEqual(candidateBuf, storedBuf)
    ) {
      const remaining = [...hashedCodes];
      remaining.splice(i, 1);
      return { valid: true, remainingHashedCodes: remaining };
    }
  }

  return { valid: false, remainingHashedCodes: hashedCodes };
}
