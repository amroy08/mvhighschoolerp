# MVHS ERP – Task List

## Phase 0 – Discovery and Architecture
- [x] Inspect existing ERP repository (Vantage ERP at /Users/amroy/Desktop/ERP)
- [x] Inspect all 16 screenshots
- [x] docs/01-current-system-analysis.md to docs/13-assumptions-and-decisions.md
- [x] .env.example, README.md, task.md, walkthrough.md

## Phase 1 – Foundation and Masters
- [x] Monorepo setup (Turborepo + pnpm)
- [x] PostgreSQL Prisma schema & migration (`20260730044523_init`)
- [x] AuthModule (Argon2id, JWT, lockout, cookies)
- [x] Seed script (deterministic synthetic data)
- [x] Next.js web app scaffold (apps/web)
- [x] Health & Auth API tests passed

## Phase 2 – Student and Admission Module
- [x] AES-256-GCM Encryption Service for Aadhaar (`EncryptionService`)
- [x] Student DTOs & atomic admission transaction
- [x] REST API (`/api/v1/students`) verified via `curl`
- [x] Web: Directory (`/students`), Profile (`/students/[id]`), Wizard (`/admissions`)

## Phase 3 – Fee Engine & Fee Structure Masters
- [x] Fee Structure Master DTOs
- [x] `FeeStructuresService.create` (Master setup with lines)
- [x] `FeeStructuresService.assignToStudent` with **Immutability Snapshot JSON** (`structureSnapshot`)
- [x] Automatic Fee Charge Generation algorithm (`DECIMAL(15,2)`)
- [x] REST API (`/api/v1/fee-structures`) verified via `curl` (11 charges generated totaling ₹24,000)
- [x] Web: Fee Structure Setup UI (`/fee-structures`)

## Phase 4 – Fee Collection and Receipts
- [x] Chronological Allocation Algorithm
- [x] PostgreSQL Advisory Lock (`pg_advisory_xact_lock`) for gap-free receipt numbers (`MVHS/2025-26/BR01/000001`)
- [x] `Receipt` creation with complete `receiptDataSnapshot` JSON
- [x] REST API (`/api/v1/payments/collect`, `/api/v1/payments/student/:id/ledger`) verified via `curl`
- [x] Web: Fee Collection Workspace (`/fee-collection`), Student Financial Ledger (`/ledger`)

## Phase 5 – Online Payments
- [x] (Deferred per prompt requirements)

## Phase 6 – Reports and Analytics
- [x] Daily Cashier Collection Report API (`GET /api/v1/reports/daily-collection`) verified via `curl`
- [x] Defaulters Report API (`GET /api/v1/reports/defaulters`) verified via `curl`
- [x] Grade-wise Summary API (`GET /api/v1/reports/grade-summary`) verified via `curl`
- [x] Web: Financial Reports Portal (`/reports`), Fee Analytics (`/analytics`)

## Phase 7 – Promotion and Year Rollover
- [x] Promotion Preview API (`GET /api/v1/promotions/preview`) verified via `curl`
- [x] Batch Student Promotion API (`POST /api/v1/promotions/batch`) verified via `curl`
- [x] **Arrear Carry-Over Logic**: Automatically created opening `ARREAR` charge (₹18,000) in new academic year with `sourceYear = '2025-26'` (Verified in PostgreSQL)
- [x] Web: Promotions Workspace (`/promotions`)

## Phase 8 – Parent Portal and Notifications
- [x] Outbox Notification Event Log API (`GET /api/v1/notifications`) verified via `curl`
- [x] Outbox Queue Processing Worker API (`POST /api/v1/notifications/process-queue`) verified via `curl`
- [x] Web: Notifications Monitor (`/notifications`)

## Phase 9 – Migration, Security, and UAT
- [x] Excel Data Migration Engine (`ImportsService` & `POST /api/v1/imports/excel`) verified via `curl` (1 row imported)
- [x] Security Audit Trail Explorer (`AuditLogsService` & `GET /api/v1/audit-logs`) verified via `curl` (all system actions tracked)
- [x] Web: Data Migration Workspace (`/imports`), Security Audit Log Explorer (`/audit-logs`)
- [x] TypeScript compilation passes 0 errors on API & Web
- [x] All 9 project phases completed!
