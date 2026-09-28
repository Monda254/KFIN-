# Database Migrations

This directory is reserved for version-controlled, reproducible SQL migration files.

---

## Migration Governance (Section 18)

1. **No Manual Schema Edits:** Production and staging schemas must never be modified manually. All schema modifications must occur via tested, reviewable migrations.
2. **Review & Rollback:** Every migration must be accompanied by an assessment of data impact, lock duration, and rollback strategy.
3. **Phase 0 Status:** No business or operational domain migrations exist in Phase 0.
