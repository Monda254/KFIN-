# KFIN — SERVICE IDENTITIES & MACHINE-TO-MACHINE (M2M) SPECIFICATION

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.2 — Identity, Authentication & Access Control  
**Status:** COMPLETE & AUTHORITATIVE  
**Date:** 2026-09-30  

---

## 1. Overview & Architectural Boundaries

KFIN frequently interacts with external analytical instruments, automated laboratory information management systems (LIMS), and secure inter-agency connectors (e.g., automated DCI-to-NPHL specimen tracking).

Machine identities are strictly isolated from human accounts:
1. **Never Inherit Human Privileges:** A service identity cannot execute human-only actions (e.g., approving laboratory reports, altering user account statuses, or triggering emergency break-glass procedures).
2. **Explicit Organizational Ownership:** Every service identity is owned by an institutional organization (`organization_id`) and managed by an authorized administrator (`created_by_id`).
3. **Scoped Permissions:** Access is limited to explicit atomic scopes (e.g., `["lab:submit", "dna:submit", "evidence:read"]`).
4. **Clearance Bound:** A service identity is assigned a maximum clearance level and cannot access data classified higher than its assigned ceiling.

---

## 2. API Key Architecture

* **Format:** `kfin_sec_<prefix>_<secret>`
  * `prefix`: 8 hex characters used for fast database indexing and identification.
  * `secret`: 64 hex characters (256 bits of cryptographic entropy).
* **Storage:** Only the SHA-256 hash digest of the full API key is persisted in `service_identities.api_key_hash`.
* **Verification:** Evaluated via constant-time comparison (`crypto.timingSafeEqual`).

---

## 3. Lifecycle & Revocation

* **Active Flag:** `service_identities.is_active` controls validity. Toggling to `false` terminates access immediately.
* **Expiration:** Optional `expires_at` column enables time-bound integration testing or temporary vendor integrations.
* **Rotation Runbook:** Administrators can issue a secondary key, update the external service connector, and subsequently deactivate the old key without service interruption.
