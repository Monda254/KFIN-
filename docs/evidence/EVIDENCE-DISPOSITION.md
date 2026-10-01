# KFIN Evidence Disposition & Governance Specification

## 1. Overview
Evidence disposition represents the end of active evidence handling (e.g., return to owner, destruction, permanent archiving). In compliance with KFIN Data Governance rules, evidence destruction is never a soft or hard SQL `DELETE`.

## 2. Disposition Record Requirements
- **`dispositionType`**: `RETURNED` | `TRANSFERRED_OUT` | `RETAINED` | `ARCHIVED` | `DESTROYED`.
- **`approvedById`**: Judicial authority or senior commander approving disposal.
- **`executedById`**: Officer performing disposal operation.
- **`witnessById`**: Mandatory witness officer for hazardous or contraband destruction.
- **`authorizationReference`**: Court destruction warrant or statutory order reference.
- **`disposalMethod`**: Controlled method (e.g., `INCINERATION`, `CHEMICAL_NEUTRALIZATION`, `RETURN_TO_OWNER`).

## 3. Legal Hold Protection
If `isLegalHold == true`, any attempt to execute disposition is blocked instantly by the domain aggregate and API layer with a `LegalHoldViolationError`.
