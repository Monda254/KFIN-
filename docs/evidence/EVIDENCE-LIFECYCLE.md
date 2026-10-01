# KFIN Evidence Lifecycle Specification

## 1. Lifecycle Overview
Forensic evidence in KFIN follows a strictly enforced topological lifecycle from initial scene collection to final disposition or archiving.

```text
  COLLECTED ──► PACKAGED ──► SEALED ──► TRANSFERRED ──► RECEIVED
                                                             │
  ARCHIVED ◄── DISPOSED ◄── RETRIEVED ◄── EXAMINED ◄── STORED
                                 │
                             EXCEPTION
```

## 2. Lifecycle Stages

### 2.1 Collection & Registration (`COLLECTED`)
- Exhibit is recovered from a crime scene, hospital, morgue, or search location.
- Collector records collector identity, timestamp, location description, and initial condition.
- A unique KFIN evidence reference is generated (`EVD-DCIHQ-2026-XXXXX`).

### 2.2 Packaging & Sealing (`PACKAGED` & `SEALED`)
- Exhibit is enclosed in approved tamper-evident packaging (e.g., paper evidence bag, glass vial, Faraday bag).
- A tamper-evident seal is applied, recording seal number, seal type, and applying officer.

### 2.3 Custody Transfer (`TRANSFERRED` & `RECEIVED`)
- Handshake transfer between officers or organizations (e.g., Police to Forensic Lab).
- Initiating officer registers transfer reason, destination, and receiving officer.
- Receiving officer inspects seal and condition before accepting custody into `RECEIVED` state.

### 2.4 Vault Storage (`STORED` & `RETRIEVED`)
- Exhibit is logged into a controlled storage vault location.
- Retrieval for court appearance, laboratory examination, or inspection generates an explicit checkout event (`RETRIEVED`).

### 2.5 Laboratory Examination (`EXAMINED`)
- Authorized examiner performs forensic procedures (e.g., DNA extraction, fingerprint lifting).
- Controlled seal breaking occurs with explicit break reason and authorization reference.

### 2.6 Custody Exception (`EXCEPTION`)
- Triggered automatically by broken seals during transfer, hash mismatch, missing items, or physical damage.
- Holds normal processing until formal investigation and resolution notes are logged.

### 2.7 Disposition & Archiving (`DISPOSED` & `ARCHIVED`)
- Controlled destruction, court return, or long-term archiving upon case conclusion.
- Enforces strict verification against Legal Hold status before execution.
