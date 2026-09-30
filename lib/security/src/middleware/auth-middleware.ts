import { verifyAccessToken } from "../crypto/tokens";
import { verifyApiKey } from "../crypto/service-keys";
import { AuthorizationEngine } from "../authorization/engine";
import { logAuthorizationDecision } from "../audit/audit-logger";
import type { Subject, Resource, AccessContext, ClassificationLevel } from "../types";

export interface KfinRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: Subject;
  correlationId?: string;
  ip?: string;
  body?: any;
  socket?: { remoteAddress?: string };
}

export interface KfinResponse {
  status: (code: number) => KfinResponse;
  json: (data: any) => void;
}

export type KfinNext = (err?: any) => void;

export function authenticate(
  signingSecret: string,
  dbPool?: { query: (text: string, params: any[]) => Promise<any> }
) {
  return async (req: KfinRequest, res: KfinResponse, next: KfinNext): Promise<void> => {
    const rawAuth = req.headers.authorization;
    const authHeader = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;
    const rawApiKey = req.headers["x-api-key"];
    const apiKeyHeader = Array.isArray(rawApiKey) ? rawApiKey[0] : rawApiKey;
    const rawCorrId = req.headers["x-correlation-id"];
    const correlationId = (Array.isArray(rawCorrId) ? rawCorrId[0] : rawCorrId) || crypto.randomUUID();
    req.correlationId = correlationId;

    // 1. API Key Authentication (Service-to-Service)
    if (apiKeyHeader && !authHeader) {
      if (!dbPool) {
        res.status(500).json({
          error: "DATABASE_UNAVAILABLE",
          message: "Database connection pool required for API key authentication",
        });
        return;
      }

      try {
        const parts = apiKeyHeader.split("_");
        if (parts.length < 4 || parts[0] !== "kfin" || parts[1] !== "sec") {
          res.status(401).json({ error: "INVALID_API_KEY", message: "Malformed service API key" });
          return;
        }

        const prefix = parts[2];
        const { rows } = await dbPool.query(
          `
          SELECT s.*, o.code as org_code, cl.level as clearance_level_num, cl.code as clearance_code
          FROM service_identities s
          JOIN organizations o ON s.organization_id = o.id
          JOIN clearance_levels cl ON s.clearance_level_id = cl.id
          WHERE s.api_key_prefix = $1 AND s.is_active = true;
        `,
          [prefix]
        );

        if (rows.length === 0) {
          res.status(401).json({ error: "INVALID_API_KEY", message: "Unrecognized service identity" });
          return;
        }

        const service = rows[0];
        const isValid = verifyApiKey(apiKeyHeader, service.api_key_hash);
        if (!isValid) {
          res.status(401).json({ error: "INVALID_API_KEY", message: "Invalid service API key secret" });
          return;
        }

        req.user = {
          userId: service.id,
          email: `${service.service_name}@service.kfin.internal`,
          badgeNumber: `SVC-${service.api_key_prefix}`,
          fullName: service.service_name,
          organizationId: service.organization_id,
          organizationCode: service.org_code,
          clearanceLevel: service.clearance_level_num,
          clearanceCode: service.clearance_code as ClassificationLevel,
          accountStatus: "ACTIVE",
          roles: ["SERVICE_IDENTITY"],
          permissions: service.allowed_scopes ?? [],
          isServiceIdentity: true,
          serviceName: service.service_name,
        };

        next();
        return;
      } catch (err: any) {
        res.status(500).json({ error: "AUTH_ERROR", message: err.message });
        return;
      }
    }

    // 2. Bearer Token Authentication (Human Personnel)
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Missing or malformed Authorization header" });
      return;
    }

    const token = authHeader.substring(7).trim();

    try {
      const claims = verifyAccessToken(token, signingSecret);

      // Check for real-time revocation in database if pool is provided
      if (dbPool) {
        const { rows: userRows } = await dbPool.query(
          "SELECT account_status FROM users WHERE id = $1;",
          [claims.sub]
        );

        if (userRows.length === 0 || userRows[0].account_status !== "ACTIVE") {
          const status = userRows[0]?.account_status || "REVOKED";
          res.status(403).json({
            error: "ACCOUNT_INACTIVE",
            message: `Account is '${status}' - access revoked immediately.`,
          });
          return;
        }
      }

      req.user = {
        userId: claims.sub,
        email: claims.email,
        badgeNumber: claims.badge,
        fullName: claims.name,
        organizationId: claims.orgId,
        organizationCode: claims.orgCode,
        clearanceLevel: claims.clearanceLevel,
        clearanceCode: claims.clearanceCode,
        accountStatus: "ACTIVE",
        roles: claims.roles,
        permissions: claims.permissions,
        isServiceIdentity: claims.isService ?? false,
      };

      next();
    } catch (err: any) {
      res.status(401).json({ error: "INVALID_TOKEN", message: err.message });
    }
  };
}

export function authorize(
  action: string,
  resourceExtractor: (req: KfinRequest) => Resource,
  dbPool?: { query: (text: string, params: any[]) => Promise<any> }
) {
  return async (req: KfinRequest, res: KfinResponse, next: KfinNext): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: "UNAUTHENTICATED",
        message: "Authentication required prior to authorization",
      });
      return;
    }

    const resource = resourceExtractor(req);
    const rawPurpose = req.headers["x-kfin-purpose"];
    const purpose = (Array.isArray(rawPurpose) ? rawPurpose[0] : rawPurpose) || req.body?.purpose;
    const rawTicket = req.headers["x-kfin-break-glass-ticket"];
    const breakGlassTicket = Array.isArray(rawTicket) ? rawTicket[0] : rawTicket;
    const rawJust = req.headers["x-kfin-break-glass-justification"];
    const breakGlassJustification = Array.isArray(rawJust) ? rawJust[0] : rawJust;

    const subject: Subject = {
      ...req.user,
      breakGlassActive: Boolean(breakGlassTicket && breakGlassJustification),
      breakGlassRef: breakGlassTicket,
    };

    const context: AccessContext = {
      action,
      purpose,
      ipAddress: req.ip || req.socket?.remoteAddress || "127.0.0.1",
      correlationId: req.correlationId || crypto.randomUUID(),
      justification: breakGlassJustification,
    };

    const decision = AuthorizationEngine.evaluate(subject, resource, context);

    // Audit the decision asynchronously
    if (dbPool) {
      logAuthorizationDecision(dbPool, decision, context.ipAddress).catch((err) => {
        console.error("Failed to persist authorization audit record:", err.message);
      });
    }

    if (decision.decision === "ALLOW") {
      next();
    } else {
      res.status(403).json({
        error: "ACCESS_DENIED",
        reasonCode: decision.reasonCode,
        message: decision.explanation,
        evaluatedAt: decision.evaluatedAt,
      });
    }
  };
}
