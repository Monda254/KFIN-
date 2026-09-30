# KFIN Database Implementation Gaps & Phased Deferrals Register

**Document ID:** KFIN-DB-GAPS-001  
**Phase:** 1.1 — Database & Persistence Implementation  
**Authoritative Status:** Active Engineering Baseline  
**Governed By:** KFIN Master Specification & Phase 1 Master Prompt  

---

## 1. Purpose

In compliance with Phase 1.1 Master Implementation Prompt Section 89, this register documents all entities, advanced structures, or secondary mechanisms intentionally deferred to later sub-phases or future major phases. 

Zero database tables are silently omitted.

---

## 2. Deferred Capabilities Register

| Gap ID | Planned Entity / Capability | Originating ERD Domain | Rationale for Deferral | Architectural Dependency | Planned Implementation Phase | Risk Analysis & Mitigation |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **GAP-001** | `graph_relationships` | Forensic Graph Intelligence | Graph relationship persistence requires complex property graph traversal engines. Relational foreign keys and participant mappings satisfy Phase 1 investigative links. | Phase 1 Canonical Entity Baseline | **Phase 5** (Advanced Analytics) | **Low:** Relational `case_participants` and `case_notes` fully capture all necessary forensic relationships for Phase 1. |
| **GAP-002** | `biometric_face_embeddings` | Biometric Indexing Core | Facial vector embeddings require specialized vector extension (`pgvector`) and high-dimensional indexing benchmarks. | Phase 1 DNA Core Stability | **Phase 4** (Multi-Biometric Integration) | **Low:** Phase 1 focus is strictly on Short Tandem Repeat (STR) DNA profile indexing and matching. |
| **GAP-003** | `national_id_federation_tokens` | External Identity Federation | Production integration tokens for IPRS / Maisha Namba are deferred until external agency network accreditation is approved. | Ministry Accreditation & Staging Sandbox | **Phase 3** (Institutional Interoperability) | **Low:** `users.national_id_hash` provides verifiable identity anchor without external runtime coupling. |
| **GAP-004** | `hsm_key_escrow_records` | Hardware Cryptography | Hardware Security Module (HSM) signing key tables are managed by dedicated physical HSM appliances in Phase 2. | Physical Hardware Infrastructure | **Phase 2** (Advanced Cryptography) | **Low:** Software-managed SHA-256 and pgcrypto provide mathematical integrity verification in Phase 1.1. |
| **GAP-005** | `court_exhibit_presentation_logs` | Judicial Interoperability | In-court digital exhibit projection tracking tables belong to the judicial station integration phase. | Judicial Portal Development | **Phase 2** (Court Management Module) | **Low:** `custody_transfers` with reason `COURT_PROCEEDING` fully satisfies legal chain of custody. |
| **GAP-006** | `cross_border_interpol_dna_exchanges` | International Interoperability | Interpol DNA gateway transaction logs require bilateral treaty approval. | International Treaty Accreditation | **Phase 3** (International Exchange) | **Low:** `data_disclosures` table provides generic legal disclosure tracking. |

---

## 3. Reconciliation & Summary

All 27 core and foundational entities mandated by the Final ERD and Canonical Domain Model for Phase 1 are **fully represented and implemented** in Sub-Phase 1.1 schema definitions. 

No core forensic entity has been omitted.
