# KFIN Test Fixtures Foundation

**Scope:** Phase 0 — Development Foundation  
**Status:** Synthetic Baseline Fixtures  
**Policy:** Strict Synthetic Non-Sensitive Data Only  

---

## Absolute Rule: Zero Real Forensic Data

Under **no circumstances** may real forensic data, real DNA sequences/loci, citizen identification numbers, real case files, or actual law enforcement records be placed into this repository, its fixtures, or automated tests.

All test fixtures must be:
1. **100% Synthetic:** Artificially generated mock values.
2. **Non-Sensitive:** Safe for open development environments.
3. **Isolated:** Strictly separated by fixture category.

---

## Directory Structure

```text
tests/fixtures/
├── generic/            # Synthetically generated mock payloads and configs
│   └── sample-payload.json
├── security/           # Synthetic attack vectors and sanitization verification inputs
│   └── sanitization-cases.json
└── README.md
```
