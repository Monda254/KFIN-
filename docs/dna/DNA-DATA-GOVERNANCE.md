# KFIN DNA Data Governance Specification

## 1. Governance Principles
- **No Consumer / Genealogy DNA:** KFIN strictly prohibits non-forensic consumer DNA uploads, genetic genealogy searches, or phenotype prediction models.
- **Zero Real Citizen Data in Test Environments:** Synthetic test fixtures are strictly enforced across all test environments.
- **Controlled Expungement:** Statutory profile expungement is protected by Legal Hold checks (`DnaLegalHoldViolationError`) to ensure court preservation orders override automated retentions.
- **Non-Destructive Versioning:** Profile corrections increment the version number while preserving historical version records.
