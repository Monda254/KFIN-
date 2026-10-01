# KFIN Evidence Derivatives & Sample Lineage Specification

## 1. Derivative Model Overview
In forensic examinations, primary exhibits are frequently subdivided or extracted into derived samples (e.g., blood stain exhibit -> DNA extraction tube -> PCR amplification product).

KFIN models sample lineage through the `evidence_derivatives` table:

```text
  Primary Exhibit (EVD-DCIHQ-2026-001)
             │
             ├── Derived Sample A (EVD-DCIHQ-2026-001A - DNA Extract)
             │        │
             │        └── Derived Sample A1 (EVD-DCIHQ-2026-001A1 - Amplicon)
             │
             └── Derived Sample B (EVD-DCIHQ-2026-001B - Serology Slide)
```

## 2. Lineage Metadata Captured
- **`parentEvidenceId`**: Primary exhibit UUID.
- **`derivedEvidenceId`**: Child sample UUID.
- **`derivativeType`**: `SUBDIVISION` | `EXTRACTED_SAMPLE` | `TEST_DERIVATIVE` | `DIGITAL_COPY`.
- **`amountUsed`**: Volumetric/weight consumption (e.g., `0.5 mL`, `20 mg`).
- **`remainingAmount`**: Quantity remaining in primary exhibit container.
- **`purpose`**: Mandatory analytical justification.
