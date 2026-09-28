# Definition of Done

A change may be accepted only when all applicable items below are true:

- Scope is authorized by the current phase and sub-phase.
- The implementation is consistent with the authoritative architecture.
- Requirements, decisions and deviations are traceable.
- Inputs and outputs are validated at system boundaries.
- Tests prove the changed behavior and are not fabricated or disabled.
- Formatting, linting where configured, type checking and build checks pass.
- Secret and dependency security checks pass, or an explicit risk is recorded.
- Logs and errors do not expose sensitive information.
- Documentation, setup instructions and limitations are updated.
- The change is reproducible from a clean authorized environment.
- No real forensic or personal data was introduced.
- The completion report states actual checks and unresolved issues.

The phase gate remains **FAIL** when any mandatory acceptance criterion is unmet, even if the application starts.