# KFIN — SESSION MANAGEMENT & TOKEN SECURITY SPECIFICATION

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.2 — Identity, Authentication & Access Control  
**Status:** COMPLETE & AUTHORITATIVE  
**Date:** 2026-09-30  

---

## 1. Session Architecture

KFIN uses a hybrid stateless/stateful session model designed for high-throughput forensic microservices without sacrificing instantaneous security revocation:

1. **Access Tokens (Stateless JWT):**
   * **Algorithm:** HMAC-SHA256 (`HS256`).
   * **Lifetime:** 15 minutes (900 seconds).
   * **Claims:** Subject ID (`sub`), email, badge number, legal name, organization ID, organization code, clearance level, clearance code, roles array, permissions array, MFA flag, unique JWT ID (`jti`), issuer (`iss = kfin-identity-authority`), audience (`aud = kfin-api`), issued-at (`iat`), and expiration (`exp`).
   * **Verification:** Constant-time cryptographic signature verification without database queries for low latency.

2. **Refresh Tokens (Stateful Opaque):**
   * **Entropy:** 256 bits of cryptographically secure random bytes via `crypto.randomBytes(32)`.
   * **Lifetime:** 7 days.
   * **Storage:** Only the SHA-256 hash digest is stored in `user_sessions`. Plaintext refresh tokens are never written to disk or logs.
   * **Rotation:** Single-use rotation on every refresh call.

---

## 2. Token Theft Detection & Immediate Revocation

```text
┌─────────────────────────────────────────────────────────────┐
│                      ROTATION TIMELINE                      │
├─────────────────────────────────────────────────────────────┤
│ 1. User logs in        ──► Issues Refresh Token A           │
│ 2. Refresh called      ──► Token A marked REVOKED           │
│                            Issues Refresh Token B           │
│ 3. Attacker uses A     ──► Token A is already REVOKED!      │
│                            ALARM: SUSPECTED TOKEN THEFT     │
│                            Action: Revoke Token B & all     │
│                            active sessions for user         │
│                            Append SESSION_REVOKE to audit   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Account Suspension & Rapid Containment

When an account transitions to `SUSPENDED`, `LOCKED`, `DISABLED`, or `REVOKED`:
1. All active sessions in `user_sessions` are updated: `UPDATE user_sessions SET is_revoked = true WHERE user_id = $1`.
2. The authentication middleware verifies the user's `account_status` in real time during sensitive operations and token refresh cycles.
3. Terminated users cannot refresh their access token or initiate new operations.
