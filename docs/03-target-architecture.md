# 03 – Target Architecture
## Marwari Vidyalaya School ERP

> **Status:** Phase 0 – Architecture  
> **Date:** 2026-07-30  
> **Version:** 1.0

---

## 1. Architectural Style

**Modular Monolith** organised as a **Turborepo monorepo**.

The system is a single deployable unit internally structured into domain modules with strict boundaries. This supports:
- Local development simplicity.
- Future extraction of modules to microservices without rewriting core fee logic.
- Single deployment artifact per environment.

---

## 2. System Context Diagram

```mermaid
C4Context
  title System Context – MVHS School ERP

  Person(cashier, "Cashier / Admin", "Records fees, prints receipts")
  Person(parent, "Parent", "Views dues, downloads receipts")
  Person(mgmt, "Management", "Views analytics dashboard")

  System(erp, "MVHS School ERP", "Fee management, student records, analytics, imports")

  System_Ext(email, "Email Provider (SMTP)", "Nodemailer / SES")
  System_Ext(sms, "SMS Gateway", "Future – Msg91 / Twilio")
  System_Ext(storage, "S3-Compatible Storage", "MinIO local / AWS S3 production")
  System_Ext(bank, "Bank / UPI / Payment Apps", "External – operator verifies manually")

  Rel(cashier, erp, "Collects fees, manages students")
  Rel(parent, erp, "Views ledger, downloads receipts")
  Rel(mgmt, erp, "Views dashboards and reports")
  Rel(erp, email, "Sends fee receipts and reminders")
  Rel(erp, sms, "Sends SMS reminders (future)")
  Rel(erp, storage, "Stores documents and receipts")
  Rel(bank, cashier, "Parent pays externally")
  Rel(cashier, erp, "Enters verified payment details")
```

---

## 3. Application Component Diagram

```mermaid
graph TB
  subgraph Browser["Browser / Client"]
    WEB["Next.js App Router\nTypeScript + Tailwind CSS\nshadcn/ui + React Hook Form\nZod + TanStack Query\nRecharts"]
  end

  subgraph API["NestJS API (apps/api)"]
    AUTH["AuthModule"]
    USER["UserModule\nRolePermissionModule"]
    ORG["OrganisationModule\nBranchModule"]
    ACAD["AcademicYearModule\nGradeSectionModule\nDepartmentModule"]
    STU["StudentModule\nGuardianModule\nAdmissionModule\nDocumentModule\nEnrolmentModule"]
    FEE["FeeHeadModule\nFeeStructureModule\nFeeAssignmentModule\nFeeChargeModule"]
    COL["PaymentModule\nAllocationModule\nReceiptModule\nConcessionModule"]
    LEDGER["OutstandingModule\nRefundReversalModule"]
    PROMO["PromotionModule"]
    RPT["ReportModule\nAnalyticsModule"]
    IMP["ImportExportModule"]
    NOTIF["NotificationModule"]
    AUDIT["AuditLogModule"]
    SETTINGS["SettingsModule\nHealthModule"]
  end

  subgraph Infra["Infrastructure"]
    PG["PostgreSQL 16"]
    REDIS["Redis (queues, rate limit, sessions)"]
    S3["S3-Compatible Storage (MinIO dev / AWS S3 prod)"]
    QUEUE["BullMQ Job Queue"]
  end

  WEB -- "HTTPS REST /api/v1/" --> API
  API --> PG
  API --> REDIS
  API --> S3
  API --> QUEUE
  QUEUE --> NOTIF
```

---

## 4. Repository Structure

```
MVHIGHSCHOOLERP/
├── apps/
│   ├── web/                        # Next.js 15 frontend
│   │   ├── app/                    # App Router pages and layouts
│   │   │   ├── (auth)/             # Login, forgot password
│   │   │   ├── (erp)/              # Authenticated ERP shell
│   │   │   │   ├── dashboard/
│   │   │   │   ├── students/
│   │   │   │   ├── admissions/
│   │   │   │   ├── fee-collection/
│   │   │   │   ├── ledger/
│   │   │   │   ├── outstandings/
│   │   │   │   ├── fee-structures/
│   │   │   │   ├── concessions/
│   │   │   │   ├── promotions/
│   │   │   │   ├── reports/
│   │   │   │   ├── analytics/
│   │   │   │   ├── imports/
│   │   │   │   ├── notifications/
│   │   │   │   ├── masters/
│   │   │   │   ├── users/
│   │   │   │   ├── audit-logs/
│   │   │   │   └── settings/
│   │   ├── components/             # Shared UI components
│   │   ├── lib/                    # API client, utils, hooks
│   │   ├── public/
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── api/                        # NestJS backend
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── modules/            # Domain modules
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── roles/
│       │   │   ├── organisations/
│       │   │   ├── branches/
│       │   │   ├── academic-years/
│       │   │   ├── departments/
│       │   │   ├── grades/
│       │   │   ├── sections/
│       │   │   ├── students/
│       │   │   ├── guardians/
│       │   │   ├── admissions/
│       │   │   ├── documents/
│       │   │   ├── enrolments/
│       │   │   ├── fee-heads/
│       │   │   ├── fee-structures/
│       │   │   ├── fee-assignments/
│       │   │   ├── fee-charges/
│       │   │   ├── concessions/
│       │   │   ├── payments/
│       │   │   ├── receipts/
│       │   │   ├── outstandings/
│       │   │   ├── promotions/
│       │   │   ├── reports/
│       │   │   ├── analytics/
│       │   │   ├── imports/
│       │   │   ├── notifications/
│       │   │   ├── audit-logs/
│       │   │   └── settings/
│       │   ├── common/             # Guards, decorators, filters
│       │   ├── prisma/             # Prisma service
│       │   └── config/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed/
│       └── package.json
│
├── packages/
│   ├── ui/                         # Shared shadcn/ui components
│   ├── shared-types/               # DTOs and type definitions
│   ├── validation/                 # Zod schemas shared between FE and BE
│   ├── config/                     # Shared ESLint, TypeScript configs
│   └── eslint-config/
│
├── docs/                           # Architecture and business documents
├── infrastructure/
│   ├── docker-compose.yml          # PostgreSQL, Redis, MinIO
│   ├── docker-compose.prod.yml
│   └── nginx/
├── scripts/
│   ├── setup-dev.sh
│   └── seed-dev.sh
├── tests/
│   ├── e2e/                        # Playwright tests
│   └── load/
├── .env.example
├── turbo.json
├── package.json
└── README.md
```

---

## 5. Technology Stack

### 5.1 Frontend (apps/web)

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15 (App Router) | Framework, SSR, routing |
| TypeScript | 5.x strict | Type safety |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | latest | Accessible component library |
| React Hook Form | 7.x | Form management |
| Zod | 3.x | Schema validation (shared with BE) |
| TanStack Query | 5.x | Server-state caching |
| Recharts | 2.x | Charts and analytics |
| next-themes | latest | Dark/light mode |
| date-fns-tz | latest | IST timezone handling |
| lucide-react | latest | Icons |

### 5.2 Backend (apps/api)

| Technology | Version | Purpose |
|-----------|---------|---------|
| NestJS | 10.x | Modular framework |
| TypeScript | 5.x strict | Type safety |
| Prisma | 5.x | ORM and migrations |
| PostgreSQL | 16 | Primary database |
| Redis | 7.x | Sessions, rate limiting, queues |
| BullMQ | 5.x | Background jobs |
| Passport.js | latest | Auth strategies |
| argon2 | latest | Password hashing |
| @nestjs/swagger | latest | OpenAPI documentation |
| class-validator | latest | DTO validation |
| class-transformer | latest | DTO serialisation |
| winston | latest | Structured logging |
| helmet | latest | Security headers |
| nestjs-throttler | latest | Rate limiting |
| @aws-sdk/client-s3 | latest | S3 uploads |
| ExcelJS | latest | Excel generation and parsing |
| PDFKit | latest | PDF generation |
| nodemailer | latest | Email |

### 5.3 Infrastructure

| Service | Local Dev | Production |
|---------|-----------|------------|
| Database | PostgreSQL 16 (Docker) | PostgreSQL 16 (managed / VPS) |
| Cache/Queue | Redis 7 (Docker) | Redis 7 (managed / VPS) |
| Object Storage | MinIO (Docker) | AWS S3 or compatible |
| Web Server | Next.js dev server | Nginx + PM2 |

---

## 6. Module Architecture Pattern

Each NestJS module follows a consistent structure:

```
modules/payments/
├── payments.module.ts
├── payments.controller.ts      # REST handlers, permission guards
├── payments.service.ts         # Business logic
├── payments.repository.ts      # Prisma queries
├── dto/
│   ├── create-payment.dto.ts
│   ├── update-payment.dto.ts
│   └── payment-response.dto.ts
├── entities/
│   └── payment.entity.ts
└── payments.spec.ts
```

**Domain events:** The `PaymentPostedEvent` is emitted when a payment posts. `NotificationModule` and `ReceiptModule` subscribe to this event via the NestJS EventEmitter. The `AuditLogModule` subscribes to all mutating events.

**Transactional outbox:** For reliable async notifications, the outbox pattern is used: the notification record is written in the same Prisma transaction as the payment, then a BullMQ job picks it up.

---

## 7. API Standards

All REST endpoints are versioned under `/api/v1/`.

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Payment recorded successfully"
}
```

### Error Response
```json
{
  "success": false,
  "code": "PAYMENT_EXCEEDS_OUTSTANDING",
  "message": "The amount exceeds the allowed outstanding balance",
  "details": {}
}
```

### Standard Error Codes

- `STUDENT_NOT_FOUND`
- `ENROLMENT_NOT_FOUND`
- `FEE_STRUCTURE_NOT_ASSIGNED`
- `INVALID_PAYMENT_AMOUNT`
- `PAYMENT_EXCEEDS_OUTSTANDING`
- `DUPLICATE_TRANSACTION_REFERENCE`
- `RECEIPT_ALREADY_VOID`
- `UNAUTHORISED_BRANCH_ACCESS`
- `PROMOTION_ALREADY_COMPLETED`
- `IMPORT_VALIDATION_FAILED`
- `CONCURRENT_PAYMENT_CONFLICT`

---

## 8. Security Architecture

| Layer | Control |
|-------|---------|
| Transport | HTTPS enforced in production |
| Authentication | HTTP-only cookies, SameSite=Strict, short-lived tokens |
| Authorisation | Backend RBAC guard on every endpoint + object-level checks |
| Passwords | Argon2id |
| Sensitive data | Aadhaar encrypted at column level, masked in API responses |
| Input | class-validator DTOs on all inputs |
| Output | class-transformer with excludeExtraneousValues |
| Headers | Helmet (HSTS, CSP, X-Frame-Options, etc.) |
| Rate limiting | nestjs-throttler per IP and per user |
| File upload | Extension whitelist, MIME check, size limit, S3 quarantine |
| Secrets | Environment variables only, never committed to Git |
| Audit | Immutable audit_logs table, never soft-deleted |
| Errors | Generic error message to client; full detail in structured logs only |

---

## 9. Monetary Arithmetic Rules

- All fee amounts are stored in the database as **PostgreSQL `Decimal(15,2)`** type (mapped to Prisma `Decimal`).
- Optionally, amounts can be stored as integer paise (`BigInt` in Prisma) for zero-rounding guarantee.
- **Selected approach:** `Decimal(15,2)` for readability, with all arithmetic done in SQL or via `decimal.js` on the server.
- JavaScript `number` type is **never** used for fee arithmetic.
- All totals are calculated as `SUM()` in PostgreSQL, not in application code.
- Display formatting uses `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.

---

## 10. Fee Collection Sequence Diagram

```mermaid
sequenceDiagram
  actor Cashier
  participant FE as Next.js Frontend
  participant API as NestJS API
  participant DB as PostgreSQL
  participant S3 as Object Storage

  Cashier->>FE: Search student
  FE->>API: GET /api/v1/students?q=...
  API->>DB: Query students + enrolments
  DB-->>API: Student list
  API-->>FE: Student summary with outstanding

  Cashier->>FE: Select fees and enter payment details
  FE->>API: POST /api/v1/payments (with payment proof if any)
  API->>API: Validate student, enrolment, amount, mode, reference
  API->>DB: Check duplicate transaction reference
  DB-->>API: No duplicate found

  API->>DB: BEGIN TRANSACTION
  API->>DB: Create payment record (status: Draft)
  API->>DB: Allocate against oldest outstanding charges
  API->>DB: Update charge paid/outstanding amounts
  API->>DB: Generate sequential receipt number (advisory lock)
  API->>DB: Create immutable receipt record
  API->>DB: Create audit_log entry
  API->>DB: Create outbox_event (receipt email)
  API->>DB: COMMIT TRANSACTION

  API->>S3: Upload payment proof if provided
  API-->>FE: Payment posted, receipt data

  FE->>FE: Display receipt for print
  Cashier->>FE: Print receipt
```

---

## 11. Student Promotion Sequence Diagram

```mermaid
sequenceDiagram
  actor Admin
  participant FE as Frontend
  participant API as NestJS API
  participant DB as PostgreSQL

  Admin->>FE: Open Promotion module, select academic year and grade
  FE->>API: GET /api/v1/promotions/preview?fromGrade=5&toYear=2026-27
  API->>DB: Query active enrolments for grade and year
  DB-->>API: Student list with outstanding amounts
  API-->>FE: Promotion preview with warnings

  Admin->>FE: Review, assign actions (Promote/Retain/Transfer/Withdraw)
  FE->>API: POST /api/v1/promotions/batch (dry-run: true)
  API->>API: Validate all actions, check constraints
  API-->>FE: Dry-run report: valid, warnings, errors

  Admin->>FE: Confirm promotion
  FE->>API: POST /api/v1/promotions/batch (dry-run: false)
  API->>DB: BEGIN TRANSACTION
  API->>DB: Create promotion_batch record
  loop For each student
    API->>DB: Close current enrolment (status: completed)
    API->>DB: Create new enrolment in next grade/year
    API->>DB: Carry forward valid arrears as new fee charges
    API->>DB: Create promotion_batch_item record
  end
  API->>DB: Update batch status: completed
  API->>DB: COMMIT TRANSACTION
  API-->>FE: Promotion complete with batch ID
```

---

## 12. Excel Migration Flow Diagram

```mermaid
flowchart TD
  A([Admin downloads template]) --> B[Fills template with legacy data]
  B --> C[Uploads .xlsx file]
  C --> D[Select academic year and branch]
  D --> E[Map source columns to target fields]
  E --> F[Preview first 10 rows]
  F --> G{Validate all rows}
  G -- Valid --> H[Show validation summary]
  G -- Errors found --> I[Show error report with row numbers]
  I --> J[Download rejected rows]
  J --> K[Fix errors and re-upload]
  K --> C
  H --> L[Admin confirms import]
  L --> M[Import valid rows in controlled batch]
  M --> N{All rows imported?}
  N -- Success --> O[Store batch ID and import log]
  N -- Partial failure --> P[Store batch with failed rows]
  P --> Q[Download failure report]
  O --> R([Import complete])
```

---

*End of Document 03*
