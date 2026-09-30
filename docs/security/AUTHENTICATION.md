# KFIN — AUTHENTICATION ARCHITECTURE & CREDENTIAL SPECIFICATION

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.2 — Identity, Authentication & Access Control  
**Status:** COMPLETE & AUTHORITATIVE  
**Date:** 2026-09-30  

---

## 1. Authentication Overview

KFIN implements a multi-tier authentication architecture combining:
1. Strong password hashing using cryptographic `scrypt` with salting and timing-attack resistance.
2. Mandatory Multi-Factor Authentication (RFC 6238 TOTP) for privileged personnel and high-clearance access.
3. Cryptographic Bearer Tokens (JWT with HMAC-SHA256) for short-lived stateless API authorization (15-minute validity).
4. Opaque, cryptographically random refresh tokens stored as SHA-256 hashes with mandatory single-use rotation.
5. Real-time session revocation store verifying account status and session state on every sensitive action.

---

## 2. Password Security Policy

### Complexity Constraints:
* **Minimum Length:** 12 characters.
* **Maximum Length:** 128 characters (DoS mitigation).
* **Character Diversity:** At least one uppercase letter (`[A-Z]`), at least one lowercase letter (`[a-z]`), at least one decimal digit (`[0-9]`), and at least one non-alphanumeric symbol (`[^A-Za-z0-9]`).

### Storage & Hashing:
* Plaintext, MD5, SHA-1, and reversible encryption are strictly prohibited.
* Algorithm: `scrypt` key derivation function via Node.js native `crypto.scryptSync`.
* Parameters:
  * $N = 16384$ (CPU/memory cost parameter)
  * $r = 8$ (Block size parameter)
  * $p = 1$ (Parallelization parameter)
  * Salt: 16 bytes of cryptographically secure randomness via `crypto.randomBytes(16)`.
  * Key Length: 64 bytes.
* Serialized Format: `kfin_scrypt$16384$8$1$<salt_hex>$<hash_hex>`.
* Verification: Constant-time comparison via `crypto.timingSafeEqual`.

### Password History:
* KFIN retains a historical ledger in `password_histories`.
* Users are prohibited from reusing any of their previous 5 passwords upon credential reset or change.

---

## 3. Account Lockout & Brute-Force Resistance

* **Failure Threshold:** 5 consecutive failed login attempts.
* **Lockout Behavior:** The account status transitions to `LOCKED` with `locked_until = now() + 15 minutes`.
* **Audit Trail:** Every failed authentication generates an `AUTH_FAILED` event in `audit_events`. Reaching 5 attempts records an `ACCOUNT_LOCK` event.
* **Automatic Recovery:** Once 15 minutes elapse, subsequent valid authentication automatically clears the lockout and transitions the account back to `ACTIVE`.

---

## 4. Multi-Factor Authentication (MFA)

* **Protocol:** RFC 6238 Time-Based One-Time Password (TOTP).
* **Algorithm:** HMAC-SHA1 with 30-second time steps and 6-digit output.
* **Secret Generation:** 160-bit (20 bytes) cryptographically random Base32 encoded secret (`generateTotpSecret()`).
* **Drift Window:** $\pm 1$ step (30 seconds before/after) to account for clock skew.
* **Replay Protection:** KFIN persists `last_used_step` in `mfa_factors`. Submissions at or prior to the recorded step are rejected.
* **Backup Recovery Codes:** 10 single-use 10-character alphanumeric codes generated during enrollment. Stored as SHA-256 hashes in `mfa_factors.backup_codes`. Once used, the code is purged.

---

## 5. Token Architecture & Session Management

```text
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATION                      │
└───────────────┬─────────────────────────────▲───────────────┘
                │                             │
    1. Login    │ Credentials                 │ 4. Tokens
                │ (Email, Pwd, TOTP)          │ (Access JWT + Refresh)
                ▼                             │
┌─────────────────────────────────────────────┴───────────────┐
│                      KFIN AUTH SERVICE                      │
├─────────────────────────────────────────────────────────────┤
│ • Validates credentials (scrypt + timingSafeEqual)           │
│ • Validates TOTP code / backup code                         │
│ • Issues Access Token:                                      │
│     - Alg: HS256                                            │
│     - Lifetime: 15 minutes (900 seconds)                    │
│     - Claims: sub, badge, org, clearance, roles, permissions │
│ • Issues Refresh Token:                                     │
│     - 256-bit cryptographically random token                │
│     - Lifetime: 7 days                                      │
│     - Stores SHA-256 hash in user_sessions                  │
└─────────────────────────────────────────────────────────────┘
```

### Single-Use Refresh Token Rotation:
1. When the client calls `POST /api/auth/refresh`, the provided refresh token is hashed.
2. The session record in `user_sessions` is queried.
3. If the token was already marked `is_revoked = true`, KFIN flags a **suspected token theft** and immediately revokes all active sessions for that user.
4. If valid, the current session is marked revoked, and a completely new refresh token and access token are issued.
