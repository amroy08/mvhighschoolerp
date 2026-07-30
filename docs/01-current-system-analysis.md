# 01 – Current System Analysis
## Marwari Vidyalaya School ERP – Source System Review

> **Status:** Phase 0 – Discovery  
> **Reviewed:** 2026-07-30  
> **Analyst:** Principal Software Architect

---

## 1. System Identification

The existing application is **Vantage ERP – Academic Core**, a web-based school management system.

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express 5 + TypeScript |
| ORM | Prisma 6.x |
| Database | MySQL 8 (schema: `school_erp`) |
| Auth | JWT (access + refresh tokens), `bcryptjs` |
| File Storage | Local filesystem (`uploads/`, `private_uploads/`) |
| Email | Nodemailer |
| Push | Firebase Admin SDK |
| PDF | PDFKit |
| Excel | SheetJS (`xlsx`) |

The system reached **Phase 2.7** of an earlier development cycle (per `UAT_HANDOVER_PHASE_2.md`).

---

## 2. Existing Module Inventory

### 2.1 Authentication and Users

- Email + password login for all roles.
- JWT access token + refresh token rotation.
- Seven hardcoded roles: `super_admin`, `admin`, `principal`, `teacher`, `clerk`, `parent`, `student`.
- Role check done in middleware using a `Role` enum from the database.
- No explicit permission table — permissions are inferred from role.
- No MFA implementation.
- No session revocation beyond token expiry.
- No login-lockout or rate-limiting middleware observed in source.

### 2.2 Organisation and Academic Structure

- Single **School** entity (`school_settings` table).
- **AcademicYear** scoped to school; boolean `isCurrent` flag.
- **Class** (Grade 1–10 + Nursery/JKG/SKG) with `numericValue`.
- **Section** with `capacity` (default 40), linked to class and optional class teacher.
- No Branch concept — entire deployment is one school or branch.
- No Department or Division concept (Pre-Primary / Primary / Secondary grouping).
- No financial year separate from academic year.

### 2.3 Student Module

- Student record contains: admission number, roll number, name, DOB, gender, blood group, religion, category, address (4 fields), Aadhaar, medical notes, emergency contact.
- Documents stored as file paths on disk.
- **Critical Gap:** Aadhaar stored as plain text in the database — no encryption, no masking.
- Student is directly linked to current Class + Section (no separate Enrolment record).
- `StudentEnrollmentHistory` table added in Phase 2.3 to track historical class changes.

### 2.4 Guardian / Parent Module

- Single `Parent` record with father name, mother name, annual income.
- Only one phone number per parent record.
- No separate Guardian entity — mother/father stored as flat columns.
- No legal guardian or alternate contact support.

### 2.5 Admission Module

- `Admission` model with extended fields added in Phase 2.7.
- Application status: new, under_review, enrolled, rejected.
- Converts to `Student` record on enrolment.

### 2.6 Fee Module

#### FeeStructure
- One record per class + academic year combination.
- Components stored as `Json` column — not normalised to individual fee-head rows.
- Amount stored as `Float` — **critical monetary precision bug**.

#### StudentFee
- Links a student to a fee structure.
- Has a `customAmount Float` — single override, not line-item.

#### FeePayment
- Amount stored as `Float` — **critical monetary precision bug**.
- Receipt number is unique per payment.
- No payment-mode-specific validation (UPI reference, cheque number, etc.).
- No duplicate transaction reference check.
- No payment-verification workflow — payments are posted immediately.
- No cheque-pending or cheque-bounced workflow.
- No reversal or refund workflow.

#### FeePaymentAllocation
- Added in Phase 2.4 to track line-item allocation.
- `allocatedAmount Float` — same floating-point bug.
- Component name stored as snapshot string.

### 2.7 Receipt Module

- Receipt number is unique per payment.
- No sequential numbering by branch/financial year.
- No immutability guarantee (no void flag on receipt).
- No QR code for receipt verification.
- Receipt printed as browser PDF.

### 2.8 Reports Module

- Analytics dashboard shows: total students, attendance rate, fee collection, pending dues, academic pass rate, active staff.
- Charts: attendance trend (line), fee collection mix (bar), grade distribution (pie), enrolment distribution (bar).
- No grade-wise outstanding report.
- No cashier daily closing report.
- No payment-mode breakdown report.
- No ageing bucket analysis.

### 2.9 Student Promotion

- `StudentEnrollmentHistory` table supports history tracking.
- No promotion workflow (batch promote, dry run, validate, confirm).
- Manual class/section update via the student edit form.
- No arrear carry-forward logic.

---

## 3. Technology Gaps vs. Target Architecture

| Area | Current State | Target State |
|------|-------------|-------------|
| Database | MySQL, `Float` money | PostgreSQL, `Decimal` / integer paise |
| Framework | Express monolith | NestJS modular monolith |
| Frontend | React/Vite SPA | Next.js App Router |
| Auth | Basic JWT, no MFA | Argon2id, HTTP-only cookies, MFA, session mgmt |
| RBAC | 7 hardcoded roles | 12 roles + action-based permissions matrix |
| Branch | None | Multi-branch, scoped per record |
| Fee engine | JSON components, Float | Normalised lines, Decimal, snapshot on assign |
| Payment workflow | Immediate post | Draft → Verify → Post → Receipt |
| Cheque workflow | None | Pending → Cleared/Bounced |
| Reversal | None | Full reversal workflow with audit |
| Receipt seq | UUID-based unique | Sequential MVHS/YYYY-YY/BR01/000001 |
| Outstanding | Derived from customAmount | Derived from charges minus allocations minus reversals |
| Excel import | Partial (student only) | Full migration centre with validation |
| Audit log | ActivityLog per student only | Central audit_logs table for all entities |
| Storage | Local disk | S3-compatible object storage |
| Docker | None | Full Docker Compose dev environment |
| Tests | None found | Unit, integration, E2E (Playwright) |
| API versioning | None | Versioned /api/v1/ |
| OpenAPI/Swagger | None | Full Swagger documentation |
| Promotion | Manual edit | Batch promotion workflow |

---

## 4. Critical Security Issues in Existing System

| Severity | Issue |
|----------|-------|
| CRITICAL | Aadhaar stored as plain text in `students.aadhaarNumber` |
| CRITICAL | Fee amounts stored as `Float` — monetary rounding errors |
| HIGH | JWT secrets fall back to hardcoded values in code |
| HIGH | No login rate limiting or lockout |
| HIGH | No CSRF protection on state-changing endpoints |
| HIGH | bcryptjs used — target is Argon2id |
| HIGH | Delete actions exposed on financial records |
| HIGH | No audit log for financial mutations |
| MEDIUM | Files served from `uploads/` without access control |
| MEDIUM | No Content Security Policy headers |
| MEDIUM | No duplicate transaction reference validation |
| LOW | No receipt immutability guarantee |

---

## 5. Data Quality Issues in Existing System

| Issue | Impact |
|-------|--------|
| `Float` for all money columns | Rounding errors accumulate over time |
| `Json` for fee components | Cannot query, index, or report per fee head |
| No opening-balance audit trail | Cannot determine how old balance was set |
| No receipt sequence protection | Concurrent requests can produce duplicate numbers |
| Parent mobile stored only on father | Mother/guardian contact unreachable in reports |
| No GR number field | School uses GR as primary identifier |

---

## 6. Missing Features vs. Stated Requirements

| Required Feature | Status |
|-----------------|--------|
| GR number on student | Missing |
| Separate Enrolment model | Missing |
| Division (Pre-Primary/Primary/Secondary) | Missing |
| Branch master | Missing |
| Fee head master (normalised) | Missing |
| Fee charge per student per head | Missing |
| Opening balance as auditable charge | Missing |
| Payment verification workflow | Missing |
| Cheque pending/cleared/bounced | Missing |
| Reversal and refund workflow | Missing |
| Receipt sequential numbering | Missing |
| Receipt immutability | Missing |
| QR receipt verification | Missing |
| Concession and scholarship with approval | Missing |
| Outstanding ageing report | Missing |
| Cashier daily closing | Missing |
| Bank reconciliation | Missing |
| Promotion batch workflow | Missing |
| Excel import centre | Missing (partial student import only) |
| Audit log (all entities) | Missing |
| Docker Compose dev environment | Missing |
| Swagger / OpenAPI | Missing |
| Automated tests | Missing |
| MFA for admin | Missing |
| Session revocation | Missing |
| Argon2id password hashing | Missing |
| S3-compatible document storage | Missing |

---

## 7. What the New System Will Preserve

1. The visual design language from the screenshots (clean sidebar, card-based metrics, blue primary palette, breadcrumbs) — the new system will improve upon it.
2. The domain model concepts (Class, Section, AcademicYear, Student, Parent, FeeStructure, FeePayment, Admission) provide a field-level reference.
3. Synthetic seed data patterns (ADM-YYYY-NNNN format, 900000XXXX phone pattern) will be adopted.
4. The academic year format YYYY-YY (e.g., 2026-27) will be preserved.
5. The academic year selector in the header is a good UX pattern and will be retained.

---

## 8. Migration Path

The school will export data from the existing MySQL database as Excel files. The new system will provide a controlled import centre (see `docs/07-excel-migration-plan.md`).

| Source Table | Priority | New Target Entity |
|-------------|----------|------------------|
| students | P0 | students + student_enrolments |
| parents | P0 | guardians + student_guardians |
| fee_payments | P0 | payments + payment_allocations + receipts |
| student_fees | P1 | student_fee_assignments |
| fee_structures | P1 | fee_structures + fee_structure_lines |
| fee_payment_allocations | P1 | payment_allocations |
| student_enrollment_history | P1 | student_enrolments |
| admissions | P2 | admissions |
| academic_years | P0 | academic_years |
| classes | P0 | grades |
| sections | P0 | sections |

---

*End of Document 01*
