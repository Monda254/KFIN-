# Environment Configuration

KFIN distinguishes local, test, development, staging and production environments. The `.env.example` and `.env.test.example` files contain safe templates only.

## Rules

- Production credentials are never needed for local setup.
- Secrets are injected through approved environment or workspace secret tooling.
- Environment names and log levels are explicit.
- Configuration errors fail at startup rather than silently falling back.
- Development and test databases are isolated from production systems.
- Test fixtures are synthetic and must not contain real forensic, identity or institutional data.

The current API foundation requires `PORT`. `DATABASE_URL` is reserved for approved database-backed code and is not needed by the health-only Phase 0 route.