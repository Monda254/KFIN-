import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { AccessTokenClaims } from "../types";

export function base64UrlEncode(input: string | Buffer): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function base64UrlDecode(input: string): string {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

export function signAccessToken(
  claims: Omit<AccessTokenClaims, "iss" | "aud" | "iat" | "exp" | "jti"> & {
    jti?: string;
    expiresInSeconds?: number;
  },
  signingSecret: string
): { token: string; jti: string; expiresAt: Date } {
  if (!signingSecret || signingSecret.length < 32) {
    throw new Error("Signing secret must be at least 32 characters in length");
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = claims.expiresInSeconds ?? 900; // 15 minutes default
  const exp = now + expiresIn;
  const jti = claims.jti ?? randomBytes(16).toString("hex");

  const fullClaims: AccessTokenClaims = {
    ...claims,
    iss: "kfin-identity-authority",
    aud: "kfin-api",
    jti,
    iat: now,
    exp,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullClaims));

  const dataToSign = `${encodedHeader}.${encodedPayload}`;
  const hmac = createHmac("sha256", signingSecret);
  hmac.update(dataToSign);
  const signature = base64UrlEncode(hmac.digest());

  return {
    token: `${dataToSign}.${signature}`,
    jti,
    expiresAt: new Date(exp * 1000),
  };
}

export function verifyAccessToken(
  token: string,
  signingSecret: string
): AccessTokenClaims {
  if (!token || typeof token !== "string") {
    throw new Error("Access token must be a non-empty string");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed JWT token");
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const hmac = createHmac("sha256", signingSecret);
  hmac.update(dataToSign);
  const expectedSignature = base64UrlEncode(hmac.digest());

  const sigBufA = Buffer.from(signature);
  const sigBufB = Buffer.from(expectedSignature);

  if (sigBufA.length !== sigBufB.length || !timingSafeEqual(sigBufA, sigBufB)) {
    throw new Error("Invalid token signature");
  }

  const payloadJson = base64UrlDecode(encodedPayload);
  const claims = JSON.parse(payloadJson) as AccessTokenClaims;

  const now = Math.floor(Date.now() / 1000);
  if (claims.exp <= now) {
    throw new Error("Token has expired");
  }

  if (claims.iss !== "kfin-identity-authority") {
    throw new Error(`Untrusted token issuer: ${claims.iss}`);
  }

  if (claims.aud !== "kfin-api") {
    throw new Error(`Untrusted token audience: ${claims.aud}`);
  }

  return claims;
}

export function generateRefreshToken(): {
  token: string;
  hash: string;
} {
  const token = randomBytes(32).toString("hex");
  const hash = hashToken(token);
  return { token, hash };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
