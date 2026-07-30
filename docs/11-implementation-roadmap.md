# 11 – Implementation Roadmap
## Marwari Vidyalaya School ERP

> **Status:** Phase 0 – Architecture  
> **Date:** 2026-07-30

---

## Phase 0 – Discovery and Architecture ✅ IN PROGRESS

**Duration:** 1–2 days  
**Goal:** Complete all R&D documentation before writing any application code.

### Deliverables
- [x] docs/01-current-system-analysis.md
- [x] docs/02-business-requirements.md
- [x] docs/03-target-architecture.md
- [x] docs/04-database-erd.md
- [x] docs/05-role-permission-matrix.md
- [x] docs/06-fee-engine-rules.md
- [x] docs/07-excel-migration-plan.md
- [x] docs/08-security-and-data-protection.md
- [x] docs/09-reporting-and-analytics.md
- [x] docs/10-testing-strategy.md
- [x] docs/11-implementation-roadmap.md (this file)
- [x] docs/12-risk-register.md
- [x] docs/13-assumptions-and-decisions.md
- [x] task.md
- [x] walkthrough.md
- [x] README.md
- [x] .env.example

---

## Phase 1 – Foundation and Masters 🔄 CURRENT

**Duration:** 3–5 days  
**Goal:** Build the core infrastructure, authentication, and master data modules. Every displayed value must come from the database through the API.

### 1.1 Monorepo Setup
- Turborepo + pnpm workspace.
- apps/web (Next.js 15), apps/api (NestJS 10).
- packages/shared-types, packages/validation, packages/config.
- ESLint + Prettier + TypeScript strict mode across all packages.

### 1.2 Infrastructure
- Docker Compose: PostgreSQL 16, Redis 7, MinIO.
- Environment variable configuration.
- Prisma setup with PostgreSQL provider.
- Initial database migration.
- Seed script with synthetic data.

### 1.3 Authentication Foundation
- AuthModule: login, logout, refresh token, session revocation.
- JWT with HTTP-only cookies.
- Argon2id password hashing.
- Login lockout after 5 failures.
- Rate limiting on auth endpoints.
- JWT guard and decorator.

### 1.4 User and Role System
- Users with CRUD and status management.
- Roles (12 defined roles, seeded).
- Permissions (action-based, seeded).
- Role-permission assignments.
- User-role assignments.
- User-scope assignments (branch, department, grade).
- PermissionGuard implementation.
- Backend enforcement of all permission checks.

### 1.5 Organisation and Academic Masters
- Organisation → School → Branch hierarchy.
- Academic Year master with current-year flag.
- Financial Year master.
- Department master (Pre-Primary, Primary, Secondary).
- Grade master with department assignment.
- Section master with capacity.
- Grade-section mapping.

### 1.6 Fee Head Master
- Fee heads with code, category, refundable flag.
- Seed 15 standard fee heads.

### 1.7 Audit Infrastructure
- AuditLog module.
- AuditLogService.log() called on every mutating operation.
- Append-only table (no UPDATE or DELETE at application level).

### 1.8 Application Shell (Frontend)
- Next.js App Router with authenticated layout.
- Sidebar navigation (role-aware menus).
- Top header with school logo, academic year selector, user menu.
- Breadcrumb component.
- Loading, empty, and error states.
- Working login page with redirect to dashboard.
- Dashboard shell (KPI placeholders from real seed data).

### 1.9 Swagger Setup
- @nestjs/swagger configured.
- All Phase 1 endpoints documented.

### Phase 1 Completion Gate
- npm run typecheck passes.
- npm run lint passes.
- All Phase 1 unit and integration tests pass.
- Database migrates cleanly from empty.
- Seed script runs successfully.
- Login works with all test accounts.
- Role-based navigation shows/hides correctly.
- Dashboard displays real data from seed.
- Swagger UI accessible at /api/docs.

---

## Phase 2 – Student and Admission Module

**Duration:** 4–6 days  
**Goal:** Full student lifecycle management.

### Deliverables
- Student CRUD with all fields.
- GR number and admission number generation.
- Guardian management (father, mother, legal guardian).
- Student-guardian linking with primary contact selection.
- Student document upload and management.
- Enrolment model (separate from student).
- Admission workflow (new → under review → enrolled / rejected).
- Admission to student conversion.
- Student search (name, GR, admission number, parent mobile, grade, section).
- Student list with filters.
- Student status lifecycle.
- Excel student import (basic — validates and imports).
- Aadhaar encryption and masking.
- Phase 2 tests.

---

## Phase 3 – Fee Engine

**Duration:** 5–7 days  
**Goal:** Complete fee structure, assignment, and charge generation.

### Deliverables
- Fee Structure master with grade, division, academic year, admission category, student type scoping.
- Fee Structure Lines (normalised per fee head).
- Student Fee Assignment with structure snapshot.
- Fee Charge generation per student per period.
- Concession module with approval workflow.
- Opening balance import as auditable fee charges.
- Outstanding calculation derived from charges and payments.
- Fee assignment immutability rules.
- Late fee rule configuration.
- Fee instalment schedule.
- Phase 3 tests including monetary precision tests.

---

## Phase 4 – Fee Collection and Receipts

**Duration:** 5–7 days  
**Goal:** Complete offline fee collection, receipts, and ledger.

### Deliverables
- Student search for fee collection.
- Student outstanding summary display.
- Fee collection form with all payment modes.
- Mode-specific validation (UPI UTR, cheque details, etc.).
- Duplicate transaction reference detection.
- Payment status workflow (Cash → Posted, UPI → Verify → Post, Cheque → Pending → Clear/Bounce).
- Payment allocation (FIFO automatic, manual with permission).
- Sequential receipt number generation (concurrent-safe).
- Immutable receipt with all required fields.
- A4 PDF receipt download.
- Browser print receipt.
- Receipt reprint.
- Payment reversal workflow with approval.
- Cheque bounce workflow.
- Student financial ledger view.
- Cashier daily closing report.
- Phase 4 critical acceptance tests 3–7.

---

## Phase 5 – Online Payments (Future)

**Note:** This phase is intentionally deferred. The initial system is offline-only.

### When Ready
- Razorpay integration (initially test mode).
- Payment order creation.
- Webhook endpoint with signature validation.
- Idempotency key to prevent duplicate processing.
- Payment gateway events stored.
- Automatic reconciliation.

---

## Phase 6 – Reports and Analytics

**Duration:** 4–6 days  
**Goal:** All operational reports and analytics dashboard.

### Deliverables
- All 21 operational reports with filters, pagination, export.
- Analytics dashboard with all KPI cards.
- All charts using Recharts.
- Drill-down navigation.
- Materialised views for analytics queries.
- Excel and PDF export for all reports.
- Phase 6 tests including analytics consistency test.

---

## Phase 7 – Promotion and Year Rollover

**Duration:** 3–4 days  
**Goal:** Controlled batch promotion workflow.

### Deliverables
- Promotion preview with warnings.
- Dry run validation.
- Bulk and individual promotion.
- Promotion actions (Promote, Retain, Transfer, Withdraw, Passed Out).
- Arrear carry-forward as fee charges.
- Rollback before financial transactions.
- Promotion batch history.
- Phase 7 tests.

---

## Phase 8 – Parent Portal and Notifications

**Duration:** 4–5 days  
**Goal:** Parent self-service and automated reminders.

### Deliverables
- Parent portal login (scoped to own children).
- Parent dashboard: dues, payment history, receipts.
- Receipt download for parents.
- Fee reminder notifications (email / SMS).
- WhatsApp adapter interface.
- Notification template management.
- Fee due date reminders.
- Payment confirmation notifications.

---

## Phase 9 – Migration, Security Hardening, and UAT

**Duration:** 5–7 days  
**Goal:** Production-ready system with legacy data migrated.

### Deliverables
- Full Import Centre with all import types.
- Legacy Excel migration for all data types.
- Column mapping UI.
- Validation report and error download.
- Import batch rollback.
- Security audit (OWASP checklist).
- Performance testing (k6 load tests).
- Penetration testing checklist.
- Backup and restore verification.
- User acceptance testing with school staff.
- Production deployment configuration.
- Operations runbook.

---

## Rejected or Deferred Features

These features are in the roadmap but explicitly excluded from Phases 1–9:

- Attendance module.
- Examination and marks.
- Report cards.
- Timetable.
- Homework.
- Teacher management.
- Staff HR and payroll.
- Library, Transport, Inventory.
- Certificates and leaving certificates.
- Alumni module.
- Admission enquiry portal.
- Multi-language labels.
- Mobile application (Android/iOS).

---

## Technology Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo | Turborepo + pnpm | Best build performance, good DX |
| Frontend | Next.js 15 App Router | SSR support, good for forms and tables |
| Backend | NestJS 10 | Modular, decorator-based, good DI |
| Database | PostgreSQL 16 | Superior decimal arithmetic, better constraints |
| ORM | Prisma | Type-safe, good migration tooling |
| Auth | HTTP-only cookies + Argon2id | OWASP recommended approach |
| Money | DECIMAL(15,2) + decimal.js | Zero floating-point errors |
| Queue | BullMQ + Redis | Reliable job processing |
| Storage | S3-compatible (MinIO dev) | Separates files from database |
| Component library | shadcn/ui | Accessible, unstyled, Tailwind-compatible |
| Charts | Recharts | Maintained, good TypeScript support |

---

*End of Document 11*
