# KFIN Evidence Integrity & Verification Specification

## 1. Physical vs Digital Integrity Models

### 1.1 Physical Integrity
Physical evidence integrity relies on tamper-evident packaging, barcode/RFID seals, and condition logs. Any seal rupture or tamper indication updates `sealStatus` to `BROKEN` or `TAMPER_SUSPECTED` and logs an exception record in `custody_exceptions`.

### 1.2 Digital Evidence Integrity
Digital exhibits (e.g., E01 forensic disk images, bodycam video captures, mobile extraction reports) record cryptographic digest metadata:
- **Algorithm:** Default `SHA-256` (or `SHA-512`).
- **`integrityHash`:** Fixed 64-character hexadecimal digest calculated upon acquisition.

## 2. Cryptographic Hash Verification Procedure
When verifying digital evidence:
1. Examiner/System submits `observedHash`.
2. System compares `observedHash` against stored `integrityHash`.
3. An immutable `evidence_integrity_verifications` record is written capturing `verifiedById`, `verifiedAt`, `algorithm`, `expectedHash`, `observedHash`, and `result` (`MATCH` or `MISMATCH`).
4. If `result == "MISMATCH"`, evidence status automatically transitions to `EXCEPTION` to prevent unverified digital exhibits from entering judicial proceedings.
