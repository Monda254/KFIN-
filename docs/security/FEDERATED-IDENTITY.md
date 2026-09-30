# KFIN — INSTITUTIONAL IDENTITY FEDERATION SPECIFICATION

**Program:** Kenya Forensic Intelligence Network (KFIN)  
**Implementation Phase:** Phase 1 — Core System Implementation  
**Sub-Phase:** 1.2 — Identity, Authentication & Access Control  
**Status:** COMPLETE & AUTHORITATIVE  
**Date:** 2026-09-30  

---

## 1. Overview & Trust Boundaries

KFIN is designed to interoperate with sovereign institutional identity providers across Kenyan law enforcement, the judiciary, and public health agencies (e.g., NPS IdP, Judiciary OIDC, DCI IdP).

External identity assertions cannot be blindly trusted:
1. **Trust Boundary Enforcement:** KFIN maintains an explicit registry of trusted identity providers (`TRUSTED_FEDERATION_PROVIDERS`). Assertions from unregistered issuers are rejected.
2. **Audience Restriction:** Federated tokens must target the explicit audience `kfin-federation`.
3. **No Automatic Administrator Elevation:** An external token claiming `admin` privileges is mapped strictly according to KFIN institutional governance agreements. External claims cannot bypass KFIN clearance or separation-of-duties rules.

---

## 2. Federated Claims Mapping Workflow

```text
EXTERNAL IDENTITY PROVIDER             KFIN FEDERATION MAPPER              KFIN AUTHORIZATION
         │                                       │                                  │
         │ 1. Token (OIDC / SAML Claim)          │                                  │
         ├──────────────────────────────────────►│                                  │
         │                                       │ 2. Validate Issuer & Audience    │
         │                                       │ 3. Check Expiry                  │
         │                                       │ 4. Map Institutional Code        │
         │                                       │    to KFIN Organization          │
         │                                       │ 5. Map Allowed Roles             │
         │                                       │    & Clearance Tier              │
         │                                       ├─────────────────────────────────►│
         │                                       │                                  │ 6. Evaluate access
         │                                       │                                  │    via Central Engine
```

---

## 3. Trusted IdP Registry Baseline

| Provider Name | Trusted Issuer URL | Audience Target | Mapped Institution | Default Clearance | Default Role |
| :--- | :--- | :--- | :--- | :---: | :--- |
| National Police Service IdP | `https://idp.nps.go.ke` | `kfin-federation` | `NPS-HQ` | `INTERNAL` (2) | `INSTITUTIONAL_OFFICER` |
| Judiciary / ODPP IdP | `https://idp.judiciary.go.ke` | `kfin-federation` | `ODPP-HQ` | `RESTRICTED` (3) | `CASE_MANAGER` |
| DCI Forensic IdP | `https://idp.dci.go.ke` | `kfin-federation` | `DCI-HQ` | `RESTRICTED` (3) | `INVESTIGATOR` |
