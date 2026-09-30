import type { AuthorizationDecision } from "../types";

export interface AuditRecordInput {
  actorId?: string;
  actorIpAddress: string;
  action: string;
  entityType: string;
  entityId: string;
  outcome: "SUCCESS" | "DENIED" | "FAILURE";
  reason?: string;
  metadata?: Record<string, unknown>;
}

export function sanitizeAuditMetadata(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveKeys = [
    "password",
    "password_hash",
    "passwordHash",
    "secret",
    "totpSecret",
    "apiKey",
    "api_key",
    "token",
    "refreshToken",
    "accessToken",
    "str_alleles",
    "alleles",
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      sanitized[key] = "[REDACTED_SECURITY_DATA]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeAuditMetadata(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export async function logSecurityEvent(
  dbClient: { query: (text: string, params: any[]) => Promise<any> },
  input: AuditRecordInput
): Promise<string> {
  const cleanMetadata = input.metadata
    ? sanitizeAuditMetadata(input.metadata)
    : {};

  const res = await dbClient.query(
    `
    INSERT INTO audit_events (
      actor_id,
      actor_ip_address,
      action,
      entity_type,
      entity_id,
      outcome,
      reason,
      metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id;
  `,
    [
      input.actorId ?? null,
      input.actorIpAddress,
      input.action,
      input.entityType,
      input.entityId,
      input.outcome,
      input.reason ?? null,
      JSON.stringify(cleanMetadata),
    ]
  );

  return res.rows[0]?.id;
}

export async function logAuthorizationDecision(
  dbClient: { query: (text: string, params: any[]) => Promise<any> },
  decision: AuthorizationDecision,
  ipAddress: string
): Promise<string> {
  return logSecurityEvent(dbClient, {
    actorId: decision.auditPayload.actorId,
    actorIpAddress: ipAddress,
    action: decision.auditPayload.action,
    entityType: decision.auditPayload.entityType,
    entityId: decision.auditPayload.entityId,
    outcome: decision.auditPayload.outcome,
    reason: decision.auditPayload.reason,
    metadata: decision.auditPayload.metadata,
  });
}
