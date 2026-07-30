# 13 – Assumptions and Decisions
## Marwari Vidyalaya School ERP

> **Status:** Phase 0 – Architecture  
> **Date:** 2026-07-30

---

## Assumptions

| ID | Area | Assumption | Impact if Wrong |
|----|------|-----------|----------------|
| A01 | Fee Structure | If both a grade-level and division-level fee structure exist, the grade-level structure takes precedence | Fee amounts could be wrong for some students |
| A02 | Academic Year | The school operates a single active academic year at a time (one `is_current = true` per school) | Multiple parallel academic years would need a different current-year model |
| A03 | Currency | All amounts are in Indian Rupees (INR) with 2 decimal places | Multi-currency not supported |
| A04 | Timezone | All timestamps stored in UTC, displayed in Asia/Kolkata (IST, UTC+5:30) | Date-related calculations would be incorrect in other timezones |
| A05 | Receipt Format | Receipt number format is MVHS/YYYY-YY/BR01/000001 — prefix MVHS will be configurable per school | Requires changing receipt_sequences.prefix if school has a different code |
| A06 | Grade Naming | Grade names follow the pattern "Grade 1", "Class 1", or the pre-primary names Nursery, Junior KG, Senior KG | Import validation will use flexible matching for grade names |
| A07 | Sections | Initial deployment has sections A and B per grade | Section management UI allows creating additional sections |
| A08 | Payment Modes | The 10 payment modes listed are exhaustive for MVP; additional modes require a settings change | New mode requires code change in current design |
| A09 | Fee Due Date | Monthly fees are due on the 10th of each month by default; this is configurable per fee structure | |
| A10 | Branch | Initial deployment has one Mumbai branch; multi-branch is schema-ready but not UI-tested until a second branch is added | |
| A11 | Promotion | Promotion is done once per year at the end of the academic year; not mid-year | Mid-year transfers use the Transfer action, not the batch promotion |
| A12 | Aadhaar | Collection of Aadhaar is optional; the school may not collect it for all students | Field is nullable. Encryption applies only when a value is provided |
| A13 | Email | Email is the primary notification channel for staff; SMS and WhatsApp are future phases | Missing phone numbers will not block MVP operation |
| A14 | Backup | School is responsible for off-site backup in the initial deployment | Production backup procedure is documented but implementation is environment-specific |
| A15 | Documents | Student documents are stored in S3-compatible storage (MinIO in development, AWS S3 in production) | Local disk storage fallback is available for emergency use only |
| A16 | Staff | The initial system does not manage teacher or staff payroll — only the users required to operate the ERP | HR and payroll are future modules |
| A17 | Parent Portal | Parent portal login is optional in Phase 1 — parents receive receipts via email in Phase 1 and get self-service access in Phase 8 | |
| A18 | Concession Approval | Concession approval limits are configured per role: Cashier = none, Accounts Admin = up to ₹5,000, Branch Admin = up to ₹20,000, School Admin = unlimited | Approval limits should be confirmed with the school before production |
| A19 | Cheque Grace Period | Cheque clearing is assumed to take 2–3 business days; receipts are generated only after manual clearing confirmation by an authorised user | |
| A20 | Old Balances | Opening balances imported from the old system represent the total outstanding as of the migration date; no partial-head breakdown is assumed to be available | |

---

## Design Decisions

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D01 | PostgreSQL over MySQL | Superior DECIMAL arithmetic, better constraints (CHECK, partial unique), UUID support, advisory locks for receipt sequences | MySQL (used in old system) — rejected due to FLOAT default and weaker constraint support |
| D02 | NestJS over Express | Module-based architecture enforces boundaries, built-in DI, first-class Swagger support, guard/decorator pattern for RBAC | Express (used in old system) — rejected due to lack of structure |
| D03 | Next.js App Router over React/Vite | Server components improve initial load, better SEO for public pages, integrated routing | React/Vite (used in old system) — rejected to avoid re-implementing routing and SSR manually |
| D04 | HTTP-only cookies over localStorage for tokens | Prevents XSS token theft; localStorage is vulnerable to XSS attacks | localStorage — rejected (security risk) |
| D05 | Argon2id over bcryptjs | Argon2id is the OWASP-recommended choice for password hashing as of 2024 | bcrypt (used in old system) — acceptable but not the current best practice |
| D06 | DECIMAL(15,2) over integer paise | More readable, standard for accounting systems, avoids division errors in display | Integer paise — very safe but requires divide-by-100 everywhere in display; DECIMAL chosen for readability |
| D07 | Snapshot on fee assignment | Immutability of student fees is a core business requirement; snapshot is the simplest way to achieve it | Audit log of changes — more complex to reconstruct historical state |
| D08 | BullMQ + Redis over direct async calls | Reliable retry, job scheduling, separation of notification concern | In-process EventEmitter — not reliable if server restarts between event and notification |
| D09 | shadcn/ui over a full component library | Unstyled components give full design control; Tailwind-native; accessible | MUI, Ant Design — too opinionated, harder to match school branding |
| D10 | Turborepo monorepo over separate repos | Shared types and validation between frontend and backend; single CI pipeline | Separate repos — risk of type drift between frontend and backend |
| D11 | Materialized views for analytics | Analytics queries on 3000+ students with full charge/payment history would be too slow for real-time calculation | Real-time calculation — acceptable for small schools, not for production load |
| D12 | No soft delete on financial records | Soft-deleted records can accidentally appear in totals if the filter is missed; financial records must never be deleted | Soft delete with is_deleted flag — rejected for financial records only |
| D13 | Separate Enrolment model from Student | A student may have multiple enrolments over multiple years; linking finances to the enrolment (not the student) makes year-scoped queries correct and promotion clean | Linking to student directly — the old system's approach, causes ambiguity in multi-year data |
| D14 | Offline-only payment collection in Phase 1 | The requirement explicitly prohibits online payment gateway in initial system; complexity and compliance risk of online payments deferred | Online payments — deferred to Phase 5 |
| D15 | Advisory lock for receipt sequences | Ensures sequential, gap-free, concurrent-safe receipt numbers without a separate sequence table scan | Database sequence — would work but is harder to reset per branch/year; advisory lock with a counter table is more transparent |

---

## Open Questions (Not Blocking Phase 1)

| ID | Question | Owner | Deadline |
|----|----------|-------|---------|
| OQ01 | What is the desired receipt number prefix? MVHS is assumed. | School Admin | Before Phase 4 |
| OQ02 | What are the exact concession approval limits per role? | School Management | Before Phase 3 |
| OQ03 | Which fee heads are currently in use and what are the exact amounts? | Accounts Team | Before Phase 3 |
| OQ04 | Should GR numbers follow a specific format? | School Admin | Before Phase 2 |
| OQ05 | Is there a need for multiple financial years to be active simultaneously? | Accounts Team | Before Phase 4 |
| OQ06 | What is the school's SMTP provider for email notifications? | IT/Admin | Before Phase 8 |
| OQ07 | Is the school registered under DPDP Act 2023 as a data fiduciary? | Management | Before Phase 9 |
| OQ08 | What are the specific late fee rules (grace period, amount, cap)? | Accounts Team | Before Phase 3 |
| OQ09 | Should the parent portal be accessible before full fee migration? | Management | Before Phase 8 |
| OQ10 | Does the school require a thermal receipt printer layout? | Admin | Before Phase 4 |

---

*End of Document 13*
