# KFIN — IDENTITY ARCHITECTURE & LIFECYCLE SPECIFICATION

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.2 — Identity, Authentication & Access Control  
**Status:** COMPLETE & AUTHORITATIVE  
**Date:** 2026-09-30  
**Security Boundary:** Multi-Institutional National Forensic Information System  

---

## 1. Executive Summary

The Kenya Forensic Intelligence Network (KFIN) is a national forensic data platform handling biological exhibits, STR DNA profiles, criminal case files, and court disclosures across independent constitutional and statutory institutions (e.g., Directorate of Criminal Investigations, National Public Health Reference Laboratories, National Police Service, and Office of the Director of Public Prosecutions).

In this environment, identity cannot be reduced to a simple username/password database row. KFIN strictly separates:
1. **Human Identity:** The physical person operating the system, identified by service/badge number, legal name, and cryptographic hash of national identity credentials.
2. **KFIN Account:** The system-level account state through which interactions occur.
3. **Organization:** The statutory agency with which the identity is affiliated.
4. **Role:** The functional responsibility assigned to the user (e.g., `INVESTIGATOR`, `LAB_ANALYST`, `AUDITOR`).
5. **Permission:** Atomic actions permitted (e.g., `case:create`, `dna:search`).
6. **Security Clearance:** The classification ceiling up to which the user may view data (Levels 1–5: `PUBLIC` to `HIGHLY_RESTRICTED`).
7. **Scope:** The jurisdictional or organizational boundary within which actions are authorized.
8. **Purpose:** The explicit authorized justification for sensitive queries.

---

## 2. Identity Model vs Account Concepts

```text
┌────────────────────────────────────────────────────────────────────────┐
│                              HUMAN ACTOR                               │
│            (National ID Hash, Badge Number, Legal Full Name)           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                              KFIN ACCOUNT                              │
│       (Lifecycle State, Credentials, Lockout Counters, MFA Factor)     │
└─────────┬─────────────────────────┼──────────────────────────┬─────────┘
          │                         │                          │
          ▼                         ▼                          ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   ORGANIZATION   │      │   CLEARANCE TIER │      │ FUNCTIONAL ROLES │
│  (e.g., DCI-HQ,  │      │ (Levels 1 to 5)  │      │  (Investigator,  │
│    NPHL-LAB)     │      │                  │      │   Analyst, etc.) │
└──────────────────┘      └──────────────────┘      └─────────┬────────┘
                                                              │
                                                              ▼
                                                    ┌──────────────────┐
                                                    │    PERMISSIONS   │
                                                    │ (Atomic actions) │
                                                    └──────────────────┘
```

These concepts are maintained in distinct normalized relational tables in PostgreSQL:
* `users`
* `organizations`
* `clearance_levels`
* `roles`
* `user_roles`
* `permissions`
* `role_permissions`
* `user_sessions`
* `mfa_factors`
* `service_identities`
* `password_histories`

---

## 3. Account Lifecycle State Machine

KFIN enforces an explicit 6-state lifecycle for all human accounts:

```text
                 Institutional Sponsorship
                            │
                            ▼
                      ┌───────────┐
                      │  PENDING  │  (Awaiting identity verification & MFA setup)
                      └─────┬─────┘
                            │ Activation by Security Admin + MFA Verified
                            ▼
                      ┌───────────┐
       ┌─────────────►│  ACTIVE   │◄────────────┐
       │              └─────┬─────┘             │
       │                    │                   │
Administrative              │ 5 Failed Logins   │ Admin Unlock /
Reactivation                ▼                   │ Auto-expiry (15m)
       │              ┌───────────┐             │
       │              │  LOCKED   │─────────────┘
       │              └─────┬─────┘
       │                    │
       │ Suspicious         │ Administrative Action
       │ Activity           ▼
       │              ┌───────────┐
       ├──────────────│ SUSPENDED │
       │              └─────┬─────┘
       │                    │
       │ Permanent          │ Separation of Service / Offboarding
       │ Disablement        ▼
       │              ┌───────────┐
       └──────────────│ DISABLED  │
                      └─────┬─────┘
                            │ Disciplinary / Statutory Revocation
                            ▼
                      ┌───────────┐
                      │  REVOKED  │  (Terminal, immutable audit tombstone)
                      └───────────┘
```

### State Semantics:
1. `PENDING`: Initial state upon provisioning. Login is disabled until identity verification, clearance assignment, and MFA factor enrollment are completed.
2. `ACTIVE`: Fully verified account permitted to authenticate and perform operations authorized by policies.
3. `LOCKED`: Temporary lockout triggered automatically after 5 consecutive failed authentication attempts. Automatically unlocks after 15 minutes or via Security Administrator intervention.
4. `SUSPENDED`: Intermediary freeze triggered by security incident investigation or extended administrative leave. All active sessions are terminated immediately.
5. `DISABLED`: Controlled offboarding state when an officer transitions out of active forensic duties.
6. `REVOKED`: Terminal state for compromised or dismissed identities. Credentials, tokens, and active sessions are permanently invalidated. Revoked records are never deleted from the database to protect forensic audit trails.

---

## 4. Controlled Account Provisioning & Anti-Enumeration

* **No Public Self-Registration:** KFIN does not provide open registration. Account creation requires institutional sponsorship by an authorized agency administrator (`SECURITY_ADMINISTRATOR`).
* **Uniqueness Constraints:** Uniqueness is enforced at the database level on `email`, `badge_number`, and `national_id_hash`.
* **Zero Shared Accounts:** Generic accounts such as `admin@dci.go.ke` or `lab@nphl.go.ke` are strictly forbidden. Every human actor must possess an individual, identifiable credential.
* **Enumeration Resistance:** All authentication and password-reset endpoints return timing-safe generic error responses (`INVALID_CREDENTIALS`). The system does not reveal whether an email address exists in the system.
