# Security Policy

## 1. Scope & Responsibility

The Kenya Forensic Intelligence Network (KFIN) is a national-scale platform designed to handle forensic intelligence, sensitive evidence, and chain-of-custody data. Security and privacy by design are foundational engineering requirements.

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability or potential risk in this repository:

1. **Do NOT open a public issue.** Do not discuss vulnerabilities in public forums, pull requests, or issue trackers.
2. **Designated Reporting Channel:** Send an encrypted or secure report to the authorized security authority:
   - Security Contact: `TBD — governance appointment required`
   - Temporary Security Liaison: Phase Owner / Repository Maintainer (`security-tbd@kfin.gov.local` placeholder)
3. **Include in Report:**
   - Summary of the vulnerability and affected components
   - Clear steps to reproduce
   - Potential impact assessment
   - Suggested remediation or mitigating controls, if known

---

## 3. Secret Compromise & Rotation Protocol

If credentials, API tokens, private keys, or certificates are accidentally committed to this repository:

1. The secret is treated as **immediately compromised**.
2. Deleting the commit or removing the file is **insufficient**.
3. The credential must be rotated and revoked at the source immediately.
4. Repository history must be sanitized under the authorization of the Repository Maintainer following the Incident and Failure Handling process in the [KFIN Development Constitution](file:///c:/Users/User/Downloads/KFIN-Foundation-main/KFIN-Foundation-main/docs/governance/KFIN-DEVELOPMENT-CONSTITUTION.md#33-incident-and-failure-handling).

---

## 4. Development Security Baselines

- **Zero Real Data:** Real forensic cases, citizen records, or DNA profile strings are strictly prohibited in code, tests, and documentation.
- **Automated Scanning:** Every build runs automated secret detection (`pnpm run security:secrets`) and dependency vulnerability checks (`pnpm run security:dependencies`).
- **Least Privilege:** Services, database accounts, and application tokens must operate under strict least-privilege principles.
