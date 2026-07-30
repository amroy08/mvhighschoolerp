# 02 – Business Requirements
## Marwari Vidyalaya School ERP – Student Fee Management and Analytics System

> **Status:** Phase 0 – Discovery  
> **Date:** 2026-07-30  
> **Version:** 1.0

---

## 1. Business Context

Marwari Vidyalaya High School (MVHS) is a private school in Mumbai, India, operating Pre-Primary, Primary and Secondary divisions, covering Nursery to Grade 10. The school seeks to replace its existing fee management portal with a secure, scalable, modern School ERP that provides accurate fee tracking, analytics, and a controlled migration path from the legacy system.

The system must conform to Indian school operational norms including:
- Currency in Indian Rupees (INR)
- Timezone: Asia/Kolkata (IST, UTC+5:30)
- Academic year format: YYYY-YY (e.g., 2025-26)
- Document language: English
- UPI, NEFT, RTGS, IMPS, cheque and demand draft as payment modes

---

## 2. Stakeholder Map

| Stakeholder | Role in System | Primary Needs |
|-------------|---------------|---------------|
| School Management | Principal/Management user | Analytics dashboard, outstanding summary |
| School Admin | School Admin | Full admin access, configuration |
| Branch Admin | Branch Admin | Branch-scoped administration |
| Accounts Team | Accounts Administrator | Fee structures, collections, reports |
| Cashier | Cashier | Collect fees, print receipts |
| Admission Staff | Admission Operator | Create and update admissions |
| Class Teachers | Pre-Primary/Primary/Secondary Operator | Section-scoped student view |
| Internal Auditor | Auditor | Read-only financial and audit access |
| Parents | Parent | View child dues, download receipts |
| Platform Admin | Platform Super Admin | System configuration, all schools |

---

## 3. Functional Requirements

### 3.1 Authentication and Session Management

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | Secure login with email and password | P0 |
| AUTH-02 | Argon2id password hashing | P0 |
| AUTH-03 | HTTP-only, SameSite=Strict cookie for session token | P0 |
| AUTH-04 | Short-lived access token, rotating refresh token | P0 |
| AUTH-05 | Session revocation on logout | P0 |
| AUTH-06 | Login lockout after 5 failed attempts | P0 |
| AUTH-07 | Rate limiting on auth endpoints | P0 |
| AUTH-08 | Optional TOTP MFA, mandatory for Platform Super Admin | P1 |
| AUTH-09 | Audit log on every login, logout, and failed attempt | P0 |
| AUTH-10 | Academic year selector persisted in user context | P0 |

### 3.2 Role and Permission Management

| ID | Requirement | Priority |
|----|-------------|----------|
| RBAC-01 | 12 defined roles with configurable action permissions | P0 |
| RBAC-02 | Action-based permissions: view, create, update, approve, collect, print, export, reverse, refund, configure, manage-users | P0 |
| RBAC-03 | Role-permission assignments configurable by Super Admin | P0 |
| RBAC-04 | User-scope assignments: school, branch, department, grade | P0 |
| RBAC-05 | Backend enforcement of every permission check | P0 |
| RBAC-06 | Frontend navigation visibility based on permissions | P0 |
| RBAC-07 | Approval limits per role for concessions and waivers | P1 |

### 3.3 School and Academic Masters

| ID | Requirement | Priority |
|----|-------------|----------|
| MASTER-01 | Organisation profile with logo, contact, branding | P0 |
| MASTER-02 | School profile and settings | P0 |
| MASTER-03 | Branch master with address and contact | P0 |
| MASTER-04 | Academic year create, set current, view history | P0 |
| MASTER-05 | Financial year separate from academic year | P0 |
| MASTER-06 | Department/Division master (Pre-Primary, Primary, Secondary) | P0 |
| MASTER-07 | Grade/Class master with division assignment | P0 |
| MASTER-08 | Section master with capacity | P0 |
| MASTER-09 | Grade-section mapping configurable per year | P0 |
| MASTER-10 | Admission category master | P0 |
| MASTER-11 | Student status master | P0 |
| MASTER-12 | Receipt numbering configuration per branch/year | P0 |
| MASTER-13 | Payment mode master | P0 |

### 3.4 Student Management

| ID | Requirement | Priority |
|----|-------------|----------|
| STU-01 | Student record with all fields defined in section 8 of PRD | P0 |
| STU-02 | System-generated student ID | P0 |
| STU-03 | GR number assignment | P0 |
| STU-04 | Admission number assignment | P0 |
| STU-05 | Student status lifecycle: Active, Passed Out, Alumni, Withdrawn, Transferred, Inactive | P0 |
| STU-06 | Aadhaar stored encrypted, masked in UI, excluded from exports | P0 |
| STU-07 | Multiple guardians: father, mother, legal guardian | P0 |
| STU-08 | Primary contact selection from linked guardians | P0 |
| STU-09 | Student document management with verification workflow | P1 |
| STU-10 | Separate Enrolment record per student per academic year | P0 |
| STU-11 | Student search by name, GR, admission number, parent mobile, grade, section | P0 |
| STU-12 | Student list with grade, section, status filters | P0 |
| STU-13 | Excel import of student master | P1 |
| STU-14 | Profile photo upload | P1 |

### 3.5 Fee Structure Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| FEE-01 | Fee structure configurable by school, branch, year, division, grade, admission category | P0 |
| FEE-02 | Separate structures for new vs. existing students | P0 |
| FEE-03 | Normalised fee structure lines with fee head, amount, frequency, due date rule | P0 |
| FEE-04 | Fee structure versioning — historical assignment not retroactively modified | P0 |
| FEE-05 | Student fee assignment creates a snapshot of the structure | P0 |
| FEE-06 | Fee charges generated per student per head per period | P0 |
| FEE-07 | Opening/old balance as auditable fee charge with import batch reference | P0 |
| FEE-08 | Concession with type, amount or percentage, reason, approval workflow | P0 |
| FEE-09 | Scholarship with similar workflow | P1 |
| FEE-10 | Sibling discount and staff-child discount types | P1 |
| FEE-11 | Late fee rule configurable per fee head | P1 |
| FEE-12 | All monetary values stored as integer paise or PostgreSQL Decimal | P0 |
| FEE-13 | Fee instalment schedule | P1 |

### 3.6 Fee Collection

| ID | Requirement | Priority |
|----|-------------|----------|
| COL-01 | Student search before collection | P0 |
| COL-02 | Display student summary: outstanding, history, charges | P0 |
| COL-03 | Operator selects fee heads being paid | P0 |
| COL-04 | Record payment date, amount, mode, reference, bank, remarks | P0 |
| COL-05 | All payment modes: Cash, UPI, NEFT, RTGS, IMPS, Bank Transfer, Cheque, DD, Debit Card, Credit Card, Other | P0 |
| COL-06 | Mode-specific reference validation (UPI UTR required, cheque details required) | P0 |
| COL-07 | Duplicate transaction reference warning for non-cash modes | P0 |
| COL-08 | Payment status: Draft, Pending Verification, Verified, Posted, Cheque Pending, Cheque Cleared, Cheque Bounced, Reversed | P0 |
| COL-09 | Cash payment: post immediately | P0 |
| COL-10 | UPI/bank payment: verify then post | P0 |
| COL-11 | Cheque payment: pending → cleared → receipt, or bounced → restore outstanding | P0 |
| COL-12 | Full and partial payment support | P0 |
| COL-13 | Automatic oldest-outstanding-first allocation | P0 |
| COL-14 | Manual fee-head allocation with permission | P1 |
| COL-15 | Payment proof upload | P1 |
| COL-16 | Backdated payment with authorised permission | P1 |
| COL-17 | Daily cashier collection summary | P1 |
| COL-18 | Entire payment posting in one database transaction | P0 |
| COL-19 | Rollback on any step failure | P0 |
| COL-20 | No amount greater than outstanding unless advance-payment feature is enabled | P0 |

### 3.7 Receipt Module

| ID | Requirement | Priority |
|----|-------------|----------|
| RCP-01 | Immutable receipt generated on every posted payment | P0 |
| RCP-02 | Sequential receipt number per branch/financial year | P0 |
| RCP-03 | Format: MVHS/YYYY-YY/BR01/000001 | P0 |
| RCP-04 | Server-side concurrent-safe sequence generation | P0 |
| RCP-05 | Receipt contains all fields listed in section 12 of PRD | P0 |
| RCP-06 | Browser print view | P0 |
| RCP-07 | A4 PDF download | P0 |
| RCP-08 | Receipt reprint | P0 |
| RCP-09 | QR code linking to receipt verification page | P1 |
| RCP-10 | Receipt correction via reversal workflow only | P0 |
| RCP-11 | Void flag on cancelled receipts, never physically deleted | P0 |
| RCP-12 | Compact thermal-print layout | P2 |

### 3.8 Outstandings and Ledger

| ID | Requirement | Priority |
|----|-------------|----------|
| LED-01 | Student financial ledger: opening balance, charges, payments, allocations, reversals, closing balance | P0 |
| LED-02 | Outstanding calculated from charges minus payments minus reversals plus late fees | P0 |
| LED-03 | Grade-wise and section-wise outstanding reports | P0 |
| LED-04 | Outstanding ageing buckets: Not Yet Due, 1-30, 31-60, 61-90, 91-180, 180+ days | P1 |
| LED-05 | No Edit or Delete on financial records — correction via reversal only | P0 |

### 3.9 Promotions and Year Rollover

| ID | Requirement | Priority |
|----|-------------|----------|
| PRO-01 | Grade-to-grade mapping for promotion | P0 |
| PRO-02 | Promotion preview and dry run | P0 |
| PRO-03 | Bulk and individual promotion | P0 |
| PRO-04 | Promotion actions: Promote, Retain, Transfer, Withdraw, Passed Out | P0 |
| PRO-05 | Promotion creates new enrolment and preserves old enrolment | P0 |
| PRO-06 | Arrear carry-forward as auditable charges | P0 |
| PRO-07 | Rollback before financial transactions begin | P0 |
| PRO-08 | Promotion batch ID and audit trail | P0 |

### 3.10 Reports

| ID | Requirement | Priority |
|----|-------------|----------|
| RPT-01 | All reports listed in section 18 of PRD | P1 |
| RPT-02 | Filters: school, branch, year, division, grade, section, date range, fee head, payment mode, student status, cashier | P1 |
| RPT-03 | Excel and PDF export for all reports | P1 |
| RPT-04 | Server-side pagination for large datasets | P1 |

### 3.11 Analytics Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| ANA-01 | All KPI cards listed in section 19 of PRD | P1 |
| ANA-02 | All charts listed in section 19 of PRD | P1 |
| ANA-03 | Drill-down: School → Branch → Division → Grade → Section → Student | P1 |
| ANA-04 | Optimised server-side queries — no full table download to browser | P1 |

### 3.12 Excel Import and Migration

| ID | Requirement | Priority |
|----|-------------|----------|
| IMP-01 | Import template download | P1 |
| IMP-02 | Upload and column mapping | P1 |
| IMP-03 | Preview and validation with error report | P1 |
| IMP-04 | Duplicate detection on all key fields | P1 |
| IMP-05 | Controlled batch import in database transaction | P1 |
| IMP-06 | Import batch history and rollback | P1 |
| IMP-07 | legacy_id fields on all migrated entities | P1 |

---

## 4. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Security | OWASP ASVS Level 2 minimum |
| Performance | API response under 300ms P95 for list endpoints with 1000+ students |
| Availability | 99.5% uptime during school hours (07:00–18:00 IST weekdays) |
| Data Integrity | Zero monetary rounding errors; all amounts in integer paise or Decimal |
| Audit | Complete immutable audit trail for all financial mutations |
| Scalability | Support up to 5000 students per branch without schema changes |
| Backup | Daily automated backup with verified restore procedure |
| Browser Support | Chrome, Firefox, Safari, Edge — latest two stable versions |
| Mobile | Responsive layout down to 375px width |
| Localisation | English; INR currency; DD/MM/YYYY date display; IST timezone |
| Privacy | Aadhaar and sensitive fields encrypted, masked, excluded from standard exports |

---

## 5. Business Rules

| ID | Rule |
|----|------|
| BR-01 | A student fee assignment snapshot is immutable once created; master changes do not affect historical assignments |
| BR-02 | A receipt cannot be edited; correction requires a reversal with reason and approval |
| BR-03 | A posted payment cannot be deleted |
| BR-04 | Duplicate UPI/NEFT/RTGS transaction references must be detected and warned |
| BR-05 | Receipt number must be unique, sequential, and concurrent-safe |
| BR-06 | Cash payment posts immediately; UPI/bank payment requires verification before posting |
| BR-07 | Cheque payment remains in Cheque Pending state until manually cleared |
| BR-08 | A cheque bounce must restore the student outstanding and preserve the full audit history |
| BR-09 | Outstanding is derived: sum(charges) - sum(concessions) + sum(late_fees) - sum(posted_payments) |
| BR-10 | Opening balance is a fee charge with source academic year reference, not a column on the student record |
| BR-11 | Promotion creates a new enrolment and closes the old enrolment; old payment history is never overwritten |
| BR-12 | An Auditor may view but not modify any financial record |
| BR-13 | A Primary Operator may not view Secondary students and vice versa |
| BR-14 | All monetary arithmetic must use integer paise or PostgreSQL Decimal arithmetic; JavaScript floating-point is prohibited |
| BR-15 | Aadhaar number must never appear in application logs, standard exports, or receipt documents |

---

*End of Document 02*
