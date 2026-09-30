# KFIN — MULTI-FACTOR AUTHENTICATION (MFA) SPECIFICATION

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.2 — Identity, Authentication & Access Control  
**Status:** COMPLETE & AUTHORITATIVE  
**Date:** 2026-09-30  

---

## 1. Overview

Multi-Factor Authentication (MFA) is a mandatory control in KFIN for all administrative, laboratory, and high-clearance forensic roles. The implementation complies strictly with RFC 6238 (Time-Based One-Time Password Algorithm).

---

## 2. Enrollment & Activation Workflow

```text
       USER                         API SERVER                     DATABASE
        │                               │                              │
        │ 1. POST /api/auth/mfa/enroll  │                              │
        ├──────────────────────────────►│                              │
        │                               │ 2. Generate Base32 secret    │
        │                               │    & 10 backup codes         │
        │                               │    INSERT mfa_factors        │
        │                               │    (is_verified = false)     │
        │                               ├─────────────────────────────►│
        │ 3. Returns secret, otpauth:// │                              │
        │    & plaintext backup codes   │                              │
        │◄──────────────────────────────┤                              │
        │                               │                              │
        │ 4. Scan QR into Authenticator │                              │
        │    & submit 6-digit code      │                              │
        │    POST /api/auth/mfa/verify  │                              │
        ├──────────────────────────────►│                              │
        │                               │ 5. Verify TOTP code          │
        │                               │    UPDATE mfa_factors        │
        │                               │    (is_verified = true)      │
        │                               │    UPDATE users              │
        │                               │    (mfa_enabled = true)      │
        │                               ├─────────────────────────────►│
        │ 6. Confirmation (MFA ACTIVE)  │                              │
        │◄──────────────────────────────┤                              │
```

---

## 3. Cryptographic & Replay Defenses

1. **Secret Generation:** 20 bytes (160 bits) of cryptographic entropy generated via `crypto.randomBytes(20)` and encoded using canonical RFC 4648 Base32.
2. **Time Step & Hash:** 30-second interval using HMAC-SHA1.
3. **Replay Prevention:** KFIN records `mfa_factors.last_used_step`. If an attacker captures a valid TOTP code over the wire, replay attempts within the remaining window are blocked because the step is $\le last\_used\_step$.
4. **Drift Window:** Allowed window of $\pm 1$ step (30 seconds before/after) to accommodate mobile device clock skew.
5. **Backup Recovery Codes:** 10 single-use 10-character alphanumeric codes. Stored exclusively as SHA-256 hashes in `mfa_factors.backup_codes`. Once used, the code is purged permanently.
