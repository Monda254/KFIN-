import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import {
  verifyPassword,
  hashPassword,
  validatePasswordPolicy,
  checkPasswordHistory,
  generateTotpSecret,
  verifyTotpCode,
  generateBackupCodes,
  verifyBackupCode,
  signAccessToken,
  generateRefreshToken,
  hashToken,
  AuthorizationEngine,
  logSecurityEvent,
  generateApiKey,
  authenticate,
  type ClassificationLevel,
} from "@workspace/security";

const router: IRouter = Router();
const SIGNING_SECRET =
  process.env.JWT_SIGNING_SECRET ||
  "kfin_canonical_jwt_secret_development_minimum_32_chars!";

// Helper to fetch user's full security context (roles, permissions, clearance, org)
async function getUserSecurityContext(userId: string) {
  const client = await pool.connect();
  try {
    const { rows: userRows } = await client.query(
      `
      SELECT 
        u.id, u.email, u.badge_number, u.full_name, u.account_status,
        u.mfa_enabled, u.failed_login_attempts, u.locked_until,
        o.id as org_id, o.code as org_code, o.name as org_name,
        cl.level as clearance_level_num, cl.code as clearance_code
      FROM users u
      JOIN organizations o ON u.organization_id = o.id
      JOIN clearance_levels cl ON u.clearance_level_id = cl.id
      WHERE u.id = $1;
    `,
      [userId]
    );

    if (userRows.length === 0) return null;
    const user = userRows[0];

    // Fetch user's assigned roles
    const { rows: roleRows } = await client.query(
      `
      SELECT r.name 
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = $1;
    `,
      [userId]
    );
    const roles = roleRows.map((r) => r.name);

    // Fetch user's effective permissions from assigned roles
    const { rows: permRows } = await client.query(
      `
      SELECT DISTINCT p.code
      FROM user_roles ur
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ur.user_id = $1;
    `,
      [userId]
    );
    const permissions = permRows.map((p) => p.code);

    return {
      user,
      roles,
      permissions,
    };
  } finally {
    client.release();
  }
}

// -----------------------------------------------------------------------------
// 1. POST /api/auth/login
// -----------------------------------------------------------------------------
router.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password, totpCode, backupCode } = req.body ?? {};
  const ipAddress = req.ip || req.socket.remoteAddress || "127.0.0.1";

  if (!email || !password) {
    res.status(400).json({
      error: "INVALID_REQUEST",
      message: "Both email and password are required.",
    });
    return;
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `
      SELECT 
        u.id, u.email, u.badge_number, u.full_name, u.password_hash,
        u.account_status, u.mfa_enabled, u.failed_login_attempts, u.locked_until
      FROM users u
      WHERE u.email = $1;
    `,
      [email.trim().toLowerCase()]
    );

    // Prevent user enumeration: timing-safe dummy evaluation if user not found
    if (rows.length === 0) {
      await verifyPassword(
        password,
        "kfin_scrypt$16384$8$1$0123456789abcdef0123456789abcdef$0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
      );
      await logSecurityEvent(client, {
        actorIpAddress: ipAddress,
        action: "AUTH_FAILED",
        entityType: "users",
        entityId: "UNKNOWN",
        outcome: "DENIED",
        reason: "INVALID_CREDENTIALS: User not found (generic rejection)",
      });
      res.status(401).json({
        error: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      });
      return;
    }

    const user = rows[0];

    // Check account lockout status
    if (user.account_status === "LOCKED") {
      const now = new Date();
      if (user.locked_until && new Date(user.locked_until) > now) {
        await logSecurityEvent(client, {
          actorId: user.id,
          actorIpAddress: ipAddress,
          action: "AUTH_FAILED",
          entityType: "users",
          entityId: user.id,
          outcome: "DENIED",
          reason: "ACCOUNT_LOCKED: Attempt to authenticate locked account",
        });
        res.status(423).json({
          error: "ACCOUNT_LOCKED",
          message: "Account is temporarily locked due to repeated failed logins. Please try again later.",
          lockedUntil: user.locked_until,
        });
        return;
      } else {
        // Lock expired: automatically transition back to ACTIVE
        await client.query(
          "UPDATE users SET account_status = 'ACTIVE', failed_login_attempts = 0, locked_until = NULL WHERE id = $1;",
          [user.id]
        );
        user.account_status = "ACTIVE";
      }
    }

    // Check other non-active statuses
    if (user.account_status !== "ACTIVE") {
      await logSecurityEvent(client, {
        actorId: user.id,
        actorIpAddress: ipAddress,
        action: "AUTH_FAILED",
        entityType: "users",
        entityId: user.id,
        outcome: "DENIED",
        reason: `ACCOUNT_${user.account_status}: Account status prohibits login`,
      });
      res.status(403).json({
        error: `ACCOUNT_${user.account_status}`,
        message: `Account is '${user.account_status}'. Access denied.`,
      });
      return;
    }

    // Verify Password
    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      const newFailed = user.failed_login_attempts + 1;
      let isNowLocked = false;
      let lockExpiry: Date | null = null;

      if (newFailed >= 5) {
        isNowLocked = true;
        lockExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
        await client.query(
          "UPDATE users SET failed_login_attempts = $1, account_status = 'LOCKED', locked_until = $2 WHERE id = $3;",
          [newFailed, lockExpiry, user.id]
        );
        await logSecurityEvent(client, {
          actorId: user.id,
          actorIpAddress: ipAddress,
          action: "ACCOUNT_LOCK",
          entityType: "users",
          entityId: user.id,
          outcome: "DENIED",
          reason: "Excessive failed authentications reached threshold (5)",
        });
      } else {
        await client.query(
          "UPDATE users SET failed_login_attempts = $1 WHERE id = $2;",
          [newFailed, user.id]
        );
      }

      await logSecurityEvent(client, {
        actorId: user.id,
        actorIpAddress: ipAddress,
        action: "AUTH_FAILED",
        entityType: "users",
        entityId: user.id,
        outcome: "DENIED",
        reason: `INVALID_CREDENTIALS: Password mismatch (attempt ${newFailed})`,
      });

      res.status(401).json({
        error: isNowLocked ? "ACCOUNT_LOCKED" : "INVALID_CREDENTIALS",
        message: isNowLocked
          ? "Account locked due to 5 consecutive failed attempts. Locked for 15 minutes."
          : "Invalid email or password.",
      });
      return;
    }

    // Password is valid - reset failed attempts
    await client.query(
      "UPDATE users SET failed_login_attempts = 0 WHERE id = $1;",
      [user.id]
    );

    // Check Multi-Factor Authentication (MFA)
    if (user.mfa_enabled) {
      const { rows: mfaRows } = await client.query(
        "SELECT secret, backup_codes, last_used_step FROM mfa_factors WHERE user_id = $1;",
        [user.id]
      );

      if (mfaRows.length > 0) {
        const mfa = mfaRows[0];

        // If no code provided, challenge for MFA
        if (!totpCode && !backupCode) {
          res.status(200).json({
            mfaRequired: true,
            userId: user.id,
            message: "MFA challenge required. Please provide totpCode or backupCode.",
          });
          return;
        }

        let mfaSuccess = false;

        if (totpCode) {
          const mfaResult = verifyTotpCode(mfa.secret, totpCode, {
            lastUsedStep: Number(mfa.last_used_step || 0),
          });

          if (!mfaResult.valid) {
            await logSecurityEvent(client, {
              actorId: user.id,
              actorIpAddress: ipAddress,
              action: "MFA_FAILED",
              entityType: "users",
              entityId: user.id,
              outcome: "DENIED",
              reason: `MFA_FAILED: ${mfaResult.error}`,
            });
            res.status(401).json({
              error: "MFA_FAILED",
              message: mfaResult.error || "Invalid or replayed TOTP code.",
            });
            return;
          }

          // Update last used step for replay defense
          await client.query(
            "UPDATE mfa_factors SET last_used_step = $1 WHERE user_id = $2;",
            [mfaResult.step, user.id]
          );
          mfaSuccess = true;
        } else if (backupCode) {
          const backupCodesArray = (mfa.backup_codes as string[]) || [];
          const backupResult = verifyBackupCode(backupCode, backupCodesArray);

          if (!backupResult.valid) {
            await logSecurityEvent(client, {
              actorId: user.id,
              actorIpAddress: ipAddress,
              action: "MFA_FAILED",
              entityType: "users",
              entityId: user.id,
              outcome: "DENIED",
              reason: "MFA_FAILED: Invalid backup recovery code",
            });
            res.status(401).json({
              error: "MFA_FAILED",
              message: "Invalid or already-consumed backup code.",
            });
            return;
          }

          // Invalidate used backup code
          await client.query(
            "UPDATE mfa_factors SET backup_codes = $1 WHERE user_id = $2;",
            [JSON.stringify(backupResult.remainingHashedCodes), user.id]
          );
          mfaSuccess = true;
        }

        if (mfaSuccess) {
          await logSecurityEvent(client, {
            actorId: user.id,
            actorIpAddress: ipAddress,
            action: "MFA_VERIFY",
            entityType: "users",
            entityId: user.id,
            outcome: "SUCCESS",
            reason: "Multi-factor authentication successfully verified",
          });
        }
      }
    }

    // Fetch full security context (clearance, roles, permissions)
    const context = await getUserSecurityContext(user.id);
    if (!context) {
      res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to load security profile" });
      return;
    }

    // Generate tokens
    const { token: accessToken, jti, expiresAt } = signAccessToken(
      {
        sub: user.id,
        email: user.email,
        badge: user.badge_number,
        name: user.full_name,
        orgId: context.user.org_id,
        orgCode: context.user.org_code,
        clearanceLevel: context.user.clearance_level_num,
        clearanceCode: context.user.clearance_code as ClassificationLevel,
        roles: context.roles,
        permissions: context.permissions,
        mfaAuthenticated: Boolean(user.mfa_enabled),
      },
      SIGNING_SECRET
    );

    const { token: refreshToken, hash: refreshHash } = generateRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days

    // Persist session
    await client.query(
      `
      INSERT INTO user_sessions (
        user_id, refresh_token_hash, ip_address, user_agent, is_revoked, expires_at
      ) VALUES ($1, $2, $3, $4, false, $5);
    `,
      [user.id, refreshHash, ipAddress, req.headers["user-agent"] || null, refreshExpiresAt]
    );

    // Update last login
    await client.query("UPDATE users SET last_login_at = NOW() WHERE id = $1;", [user.id]);

    // Audit login
    await logSecurityEvent(client, {
      actorId: user.id,
      actorIpAddress: ipAddress,
      action: "AUTH_LOGIN",
      entityType: "users",
      entityId: user.id,
      outcome: "SUCCESS",
      reason: "Successful credential authentication",
      metadata: {
        sessionId: jti,
        orgCode: context.user.org_code,
        clearanceCode: context.user.clearance_code,
      },
    });

    res.json({
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: 900,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        badgeNumber: user.badge_number,
        fullName: user.full_name,
        organization: {
          id: context.user.org_id,
          code: context.user.org_code,
          name: context.user.org_name,
        },
        clearance: {
          level: context.user.clearance_level_num,
          code: context.user.clearance_code,
        },
        roles: context.roles,
        permissions: context.permissions,
        mfaEnabled: user.mfa_enabled,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  } finally {
    client.release();
  }
});

// -----------------------------------------------------------------------------
// 2. POST /api/auth/refresh (Single-use token rotation)
// -----------------------------------------------------------------------------
router.post("/auth/refresh", async (req: Request, res: Response) => {
  const { refreshToken } = req.body ?? {};
  const ipAddress = req.ip || req.socket.remoteAddress || "127.0.0.1";

  if (!refreshToken || typeof refreshToken !== "string") {
    res.status(400).json({ error: "INVALID_REQUEST", message: "Refresh token is required" });
    return;
  }

  const client = await pool.connect();
  try {
    const tokenHash = hashToken(refreshToken);
    const { rows } = await client.query(
      `
      SELECT s.*, u.account_status
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.refresh_token_hash = $1;
    `,
      [tokenHash]
    );

    if (rows.length === 0) {
      res.status(401).json({ error: "INVALID_TOKEN", message: "Invalid or unrecognized refresh token" });
      return;
    }

    const session = rows[0];

    // Session revocation check
    if (session.is_revoked) {
      // Possible token reuse attack detected: invalidate all sessions for this user!
      await client.query("UPDATE user_sessions SET is_revoked = true WHERE user_id = $1;", [session.user_id]);
      await logSecurityEvent(client, {
        actorId: session.user_id,
        actorIpAddress: ipAddress,
        action: "SESSION_REVOKE",
        entityType: "user_sessions",
        entityId: session.id,
        outcome: "DENIED",
        reason: "SUSPECTED_TOKEN_REUSE: Revoked refresh token submitted, all user sessions invalidated.",
      });
      res.status(401).json({ error: "SESSION_COMPROMISED", message: "Session was revoked. All active sessions invalidated." });
      return;
    }

    // Expiry check
    if (new Date(session.expires_at) < new Date()) {
      res.status(401).json({ error: "TOKEN_EXPIRED", message: "Refresh token has expired. Please login again." });
      return;
    }

    // Account status check
    if (session.account_status !== "ACTIVE") {
      res.status(403).json({ error: "ACCOUNT_INACTIVE", message: `Account is '${session.account_status}'. Access denied.` });
      return;
    }

    // Invalidate current refresh token (rotation)
    await client.query("UPDATE user_sessions SET is_revoked = true WHERE id = $1;", [session.id]);

    // Fetch updated user security context
    const context = await getUserSecurityContext(session.user_id);
    if (!context) {
      res.status(500).json({ error: "INTERNAL_ERROR", message: "Failed to reload user context" });
      return;
    }

    // Generate new tokens
    const { token: newAccessToken, jti, expiresAt } = signAccessToken(
      {
        sub: context.user.id,
        email: context.user.email,
        badge: context.user.badge_number,
        name: context.user.full_name,
        orgId: context.user.org_id,
        orgCode: context.user.org_code,
        clearanceLevel: context.user.clearance_level_num,
        clearanceCode: context.user.clearance_code as ClassificationLevel,
        roles: context.roles,
        permissions: context.permissions,
        mfaAuthenticated: Boolean(context.user.mfa_enabled),
      },
      SIGNING_SECRET
    );

    const { token: newRefreshToken, hash: newRefreshHash } = generateRefreshToken();
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    // Persist rotated session
    await client.query(
      `
      INSERT INTO user_sessions (
        user_id, refresh_token_hash, ip_address, user_agent, is_revoked, expires_at
      ) VALUES ($1, $2, $3, $4, false, $5);
    `,
      [context.user.id, newRefreshHash, ipAddress, req.headers["user-agent"] || null, refreshExpiresAt]
    );

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      tokenType: "Bearer",
      expiresIn: 900,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  } finally {
    client.release();
  }
});

// -----------------------------------------------------------------------------
// 3. POST /api/auth/logout
// -----------------------------------------------------------------------------
router.post("/auth/logout", async (req: Request, res: Response) => {
  const { refreshToken } = req.body ?? {};
  const ipAddress = req.ip || req.socket.remoteAddress || "127.0.0.1";

  if (refreshToken) {
    const client = await pool.connect();
    try {
      const hash = hashToken(refreshToken);
      const { rows } = await client.query(
        "UPDATE user_sessions SET is_revoked = true WHERE refresh_token_hash = $1 RETURNING user_id, id;",
        [hash]
      );
      if (rows.length > 0) {
        await logSecurityEvent(client, {
          actorId: rows[0].user_id,
          actorIpAddress: ipAddress,
          action: "AUTH_LOGOUT",
          entityType: "user_sessions",
          entityId: rows[0].id,
          outcome: "SUCCESS",
          reason: "User logged out successfully",
        });
      }
    } finally {
      client.release();
    }
  }

  res.json({ status: "SUCCESS", message: "Logged out successfully" });
});

// -----------------------------------------------------------------------------
// 4. GET /api/auth/me (Authenticated Profile)
// -----------------------------------------------------------------------------
router.get("/auth/me", authenticate(SIGNING_SECRET, pool as any), async (req: any, res: Response) => {
  const user = req.user;
  res.json({
    user,
    authenticated: true,
  });
});

// -----------------------------------------------------------------------------
// 5. POST /api/auth/mfa/enroll (Initiate TOTP)
// -----------------------------------------------------------------------------
router.post("/auth/mfa/enroll", authenticate(SIGNING_SECRET, pool as any), async (req: any, res: Response) => {
  const userId = req.user.userId;
  const client = await pool.connect();
  try {
    const secret = generateTotpSecret();
    const backupCodes = generateBackupCodes(10);

    await client.query(
      `
      INSERT INTO mfa_factors (user_id, factor_type, secret, is_verified, backup_codes)
      VALUES ($1, 'TOTP', $2, false, $3)
      ON CONFLICT (user_id) DO UPDATE SET secret = EXCLUDED.secret, is_verified = false, backup_codes = EXCLUDED.backup_codes;
    `,
      [userId, secret, JSON.stringify(backupCodes.hashed)]
    );

    const otpauthUrl = `otpauth://totp/KFIN:${encodeURIComponent(req.user.email)}?secret=${secret}&issuer=KFIN`;

    res.json({
      secret,
      otpauthUrl,
      backupCodes: backupCodes.plaintext,
      message: "Scan QR code with authenticator app and submit code to /api/auth/mfa/verify to activate.",
    });
  } finally {
    client.release();
  }
});

// -----------------------------------------------------------------------------
// 6. POST /api/auth/mfa/verify (Activate TOTP)
// -----------------------------------------------------------------------------
router.post("/auth/mfa/verify", authenticate(SIGNING_SECRET, pool as any), async (req: any, res: Response) => {
  const userId = req.user.userId;
  const { code } = req.body ?? {};
  const ipAddress = req.ip || req.socket.remoteAddress || "127.0.0.1";

  if (!code) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "Verification code is required" });
    return;
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT secret FROM mfa_factors WHERE user_id = $1;",
      [userId]
    );

    if (rows.length === 0) {
      res.status(400).json({ error: "MFA_NOT_INITIALIZED", message: "Call /api/auth/mfa/enroll first" });
      return;
    }

    const { secret } = rows[0];
    const result = verifyTotpCode(secret, code);

    if (!result.valid) {
      res.status(400).json({ error: "INVALID_CODE", message: "Code verification failed." });
      return;
    }

    await client.query("UPDATE mfa_factors SET is_verified = true, last_used_step = $1 WHERE user_id = $2;", [
      result.step,
      userId,
    ]);
    await client.query("UPDATE users SET mfa_enabled = true WHERE id = $1;", [userId]);

    await logSecurityEvent(client, {
      actorId: userId,
      actorIpAddress: ipAddress,
      action: "MFA_VERIFY",
      entityType: "mfa_factors",
      entityId: userId,
      outcome: "SUCCESS",
      reason: "TOTP factor verified and activated for user",
    });

    res.json({ status: "SUCCESS", message: "MFA activated successfully" });
  } finally {
    client.release();
  }
});

// -----------------------------------------------------------------------------
// 7. POST /api/auth/change-password
// -----------------------------------------------------------------------------
router.post("/auth/change-password", authenticate(SIGNING_SECRET, pool as any), async (req: any, res: Response) => {
  const userId = req.user.userId;
  const { currentPassword, newPassword } = req.body ?? {};
  const ipAddress = req.ip || req.socket.remoteAddress || "127.0.0.1";

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "INVALID_REQUEST", message: "Both current and new passwords required." });
    return;
  }

  const client = await pool.connect();
  try {
    const { rows: userRows } = await client.query(
      "SELECT password_hash FROM users WHERE id = $1;",
      [userId]
    );
    if (userRows.length === 0) {
      res.status(404).json({ error: "USER_NOT_FOUND" });
      return;
    }

    const isValidCurrent = await verifyPassword(currentPassword, userRows[0].password_hash);
    if (!isValidCurrent) {
      res.status(401).json({ error: "INVALID_CURRENT_PASSWORD", message: "Current password does not match." });
      return;
    }

    // Validate password policy
    const policyResult = validatePasswordPolicy(newPassword);
    if (!policyResult.valid) {
      res.status(400).json({ error: "PASSWORD_POLICY_VIOLATION", errors: policyResult.errors });
      return;
    }

    // Check history (last 5 passwords)
    const { rows: historyRows } = await client.query(
      "SELECT password_hash FROM password_histories WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5;",
      [userId]
    );
    const historyHashes = historyRows.map((h) => h.password_hash);
    const isReused = await checkPasswordHistory(newPassword, historyHashes);

    if (isReused) {
      res.status(400).json({
        error: "PASSWORD_REUSED",
        message: "Cannot reuse any of your last 5 previous passwords.",
      });
      return;
    }

    // Hash and update
    const newHash = await hashPassword(newPassword);
    await client.query("UPDATE users SET password_hash = $1 WHERE id = $2;", [newHash, userId]);

    // Record in history
    await client.query(
      "INSERT INTO password_histories (user_id, password_hash) VALUES ($1, $2);",
      [userId, newHash]
    );

    // Revoke all active sessions
    await client.query("UPDATE user_sessions SET is_revoked = true WHERE user_id = $1;", [userId]);

    await logSecurityEvent(client, {
      actorId: userId,
      actorIpAddress: ipAddress,
      action: "PERMISSION_CHANGE",
      entityType: "users",
      entityId: userId,
      outcome: "SUCCESS",
      reason: "User password updated; previous sessions revoked",
    });

    res.json({ status: "SUCCESS", message: "Password updated successfully. Please login again with new credentials." });
  } finally {
    client.release();
  }
});

// -----------------------------------------------------------------------------
// 8. POST /api/security/authorize (Direct Policy Evaluation API)
// -----------------------------------------------------------------------------
router.post("/security/authorize", async (req: Request, res: Response) => {
  const { subject, resource, context } = req.body ?? {};

  if (!subject || !resource || !context) {
    res.status(400).json({
      error: "INVALID_PAYLOAD",
      message: "Authorization requires 'subject', 'resource', and 'context' objects.",
    });
    return;
  }

  const decision = AuthorizationEngine.evaluate(subject, resource, context);
  const client = await pool.connect();
  try {
    await logSecurityEvent(client, {
      actorId: decision.auditPayload.actorId,
      actorIpAddress: context.ipAddress || "127.0.0.1",
      action: decision.auditPayload.action,
      entityType: decision.auditPayload.entityType,
      entityId: decision.auditPayload.entityId,
      outcome: decision.auditPayload.outcome,
      reason: decision.auditPayload.reason,
      metadata: decision.auditPayload.metadata,
    });
  } catch (err: any) {
    console.error("Failed to persist audit event:", err.message);
  } finally {
    client.release();
  }

  res.json(decision);
});

// -----------------------------------------------------------------------------
// 9. POST /api/security/break-glass (Emergency Privilege Elevation)
// -----------------------------------------------------------------------------
router.post(
  "/security/break-glass",
  authenticate(SIGNING_SECRET, pool as any),
  async (req: any, res: Response) => {
    const user = req.user;
    const { incidentTicketRef, justification } = req.body ?? {};
    const ipAddress = req.ip || req.socket.remoteAddress || "127.0.0.1";

    if (!incidentTicketRef || !justification || justification.length < 20) {
      res.status(400).json({
        error: "INVALID_REQUEST",
        message: "Break-glass access requires a valid incidentTicketRef and detailed justification (minimum 20 characters).",
      });
      return;
    }

    const client = await pool.connect();
    try {
      const expiresAt = new Date(Date.now() + 2 * 3600 * 1000); // 2 hours max
      const { rows } = await client.query(
        `
        INSERT INTO break_glass_events (
          user_id, incident_ticket_ref, justification, expires_at, is_active
        ) VALUES ($1, $2, $3, $4, true)
        RETURNING id;
      `,
        [user.userId, incidentTicketRef, justification, expiresAt]
      );

      const eventId = rows[0]?.id;

      await logSecurityEvent(client, {
        actorId: user.userId,
        actorIpAddress: ipAddress,
        action: "BREAK_GLASS_ACTIVATE",
        entityType: "break_glass_events",
        entityId: eventId,
        outcome: "SUCCESS",
        reason: `EMERGENCY_BREAK_GLASS: Activated for incident ${incidentTicketRef}`,
        metadata: {
          justification,
          expiresAt: expiresAt.toISOString(),
        },
      });

      res.json({
        status: "BREAK_GLASS_ACTIVATED",
        eventId,
        incidentTicketRef,
        expiresAt: expiresAt.toISOString(),
        warning: "Break-glass activation is logged to the immutable national forensic audit ledger and requires mandatory post-incident judicial review.",
      });
    } finally {
      client.release();
    }
  }
);

export default router;
