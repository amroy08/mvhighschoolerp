# 12 – Risk Register
## Marwari Vidyalaya School ERP

> **Status:** Phase 0 – Architecture  
> **Date:** 2026-07-30

---

## Risk Matrix

| Probability | Low | Medium | High |
|-------------|-----|--------|------|
| **High** | Monitor | Mitigate | Critical |
| **Medium** | Accept | Mitigate | Mitigate |
| **Low** | Accept | Monitor | Mitigate |

---

## Active Risks

| ID | Category | Risk | Probability | Impact | Rating | Mitigation |
|----|----------|------|------------|--------|--------|-----------|
| R01 | Technical | Floating-point rounding errors in fee calculations | High | Critical | Critical | Use PostgreSQL DECIMAL(15,2) and decimal.js. Unit tests for every rounding edge case. |
| R02 | Security | Aadhaar data leak through logs, exports, or API response | Medium | Critical | Critical | AES-256-GCM column encryption, masking in API responses, automated log sanitisation. |
| R03 | Data | Duplicate receipt numbers from concurrent posting | Medium | High | Mitigate | PostgreSQL advisory lock per branch/financial year sequence. Stress tests. |
| R04 | Migration | Legacy data loss or corruption during Excel import | Medium | High | Mitigate | Validation, batch rollback, error report, legacy_id tracing, post-migration checklist. |
| R05 | Security | Payment record deleted by privileged user | Medium | High | Mitigate | No DELETE endpoint. DB-level constraint. Audit log on any status change. RBAC tested. |
| R06 | Technical | Fee structure master change retroactively altering student history | Low | High | Mitigate | Snapshot stored at assignment time. Integration test verifying immutability. |
| R07 | Security | Weak JWT secret in production | Low | High | Mitigate | .env.example with placeholder only. Pre-commit hook with detect-secrets. |
| R08 | Operational | School staff unable to use new system | Medium | Medium | Mitigate | Role-based onboarding guide. UAT phase with school staff. Training documentation. |
| R09 | Technical | Prisma migration failure on production database | Low | High | Mitigate | Migrations tested on staging before production. Backup before every migration. |
| R10 | Performance | Slow analytics queries on large dataset (3000+ students) | Medium | Medium | Mitigate | Materialised views, indexes, server-side pagination. Load testing in Phase 9. |
| R11 | Migration | Old system data quality issues blocking migration | High | Medium | Mitigate | Import validation shows all errors. Import can run multiple times. Partial import supported. |
| R12 | Technical | Concurrent cheque bounce and another payment on same student | Low | High | Mitigate | Transaction-level locking. Outstanding recalculated inside transaction. |
| R13 | Compliance | School data not meeting DPDP Act 2023 requirements | Medium | High | Mitigate | Aadhaar handling per regulations. Data retention policy. Consent records. SAR workflow. |
| R14 | Technical | Email delivery failures for fee reminders | Medium | Low | Monitor | Email delivery logs. Retry logic. Fallback SMTP. Log all failures. |
| R15 | Security | S3-stored documents publicly accessible | Low | High | Mitigate | No public bucket. All access via signed URLs with short expiry (15 minutes). |
| R16 | Operational | Receipt printer incompatibility with thermal layout | Medium | Low | Monitor | Phase 2 — A4 print is MVP. Thermal layout is Phase 2+ with testing with school's printer. |
| R17 | Technical | Breaking changes in Next.js or NestJS major version during development | Low | Medium | Monitor | Pin minor versions. Review changelogs before upgrading. |
| R18 | Data | Parent mobile number changes not updated — reminders go to wrong number | Medium | Low | Monitor | Guardian record editable by authorised staff. Last-updated timestamp shown. |
| R19 | Security | Admin account brute-forced in production | Low | Critical | Mitigate | Login lockout, rate limiting, MFA mandatory for Super Admin, alert on lock events. |
| R20 | Operational | Year-end promotion run before all fees are collected | Medium | Medium | Mitigate | Promotion preview shows students with outstanding. Warning required to proceed. |

---

## Resolved Risks (Mitigated by Design)

| ID | Risk | Resolution |
|----|------|-----------|
| RR01 | Hardcoded JWT secret in code | All secrets via environment variables. detect-secrets pre-commit hook. |
| RR02 | Missing audit trail | Centralised audit_logs table with append-only access. All mutations logged. |
| RR03 | Unscoped multi-tenant data access | Every query includes schoolId and branchId. PermissionGuard validates scope. |
| RR04 | Student record deleted | No DELETE on students. Soft delete with status only. Financial records: no delete at all. |

---

*End of Document 12*
