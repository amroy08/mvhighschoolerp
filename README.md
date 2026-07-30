# Marwari Vidyalaya High School ERP

**MVHS School ERP** is a secure, scalable, modular School ERP system designed for Marwari Vidyalaya High School, Mumbai. It covers Student Management, Fee Management, Receipts, Reports, and School Fee Analytics.

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend | NestJS 10, TypeScript, PostgreSQL 16, Prisma ORM |
| Cache/Queue | Redis 7, BullMQ |
| Storage | S3-compatible (MinIO in development, AWS S3 in production) |
| Monorepo | Turborepo + pnpm |

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker and Docker Compose
- PostgreSQL 16 (provided by Docker Compose)
- Redis 7 (provided by Docker Compose)

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-org/mvhighschoolerp.git
cd mvhighschoolerp
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env and fill in the required values
```

### 4. Start infrastructure services

```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

This starts:
- PostgreSQL 16 on port 5432
- Redis 7 on port 6379
- MinIO (S3) on port 9000 (console on 9001)

### 5. Run database migrations

```bash
cd apps/api
npx prisma migrate deploy
```

### 6. Seed development data

```bash
cd apps/api
npx prisma db seed
```

### 7. Start the development servers

```bash
# From the repo root
pnpm dev
```

This starts:
- API server: http://localhost:4000
- Web frontend: http://localhost:3000
- Swagger UI: http://localhost:4000/api/docs

---

## Test Accounts

| Role | Email | Password |
|------|-------|---------|
| Platform Super Admin | superadmin@mvhighschool.edu.in | TestPass@001 |
| School Admin | admin@mvhighschool.edu.in | TestPass@002 |
| Branch Admin | branch.admin@mvhighschool.edu.in | TestPass@003 |
| Accounts Admin | accounts@mvhighschool.edu.in | TestPass@004 |
| Cashier | cashier@mvhighschool.edu.in | TestPass@005 |
| Admission Operator | admission@mvhighschool.edu.in | TestPass@006 |
| Pre-Primary Operator | preprimary@mvhighschool.edu.in | TestPass@007 |
| Primary Operator | primary@mvhighschool.edu.in | TestPass@008 |
| Secondary Operator | secondary@mvhighschool.edu.in | TestPass@009 |
| Auditor | auditor@mvhighschool.edu.in | TestPass@010 |
| Principal/Management | principal@mvhighschool.edu.in | TestPass@011 |
| Parent | parent001@example.com | TestPass@012 |

All passwords are for development/testing only. Change them before any production deployment.

---

## Running Tests

```bash
# Unit tests
pnpm test

# Unit tests with coverage
pnpm test:cov

# TypeScript type check
pnpm typecheck

# Linting
pnpm lint

# All checks (CI)
pnpm test:ci
```

---

## Documentation

All architecture and business documentation is in the `docs/` directory:

| Document | Description |
|----------|-------------|
| [01-current-system-analysis.md](docs/01-current-system-analysis.md) | Analysis of the existing Vantage ERP |
| [02-business-requirements.md](docs/02-business-requirements.md) | Functional and non-functional requirements |
| [03-target-architecture.md](docs/03-target-architecture.md) | Architecture diagrams and technology stack |
| [04-database-erd.md](docs/04-database-erd.md) | Database entity relationship diagrams |
| [05-role-permission-matrix.md](docs/05-role-permission-matrix.md) | RBAC matrix for all 12 roles |
| [06-fee-engine-rules.md](docs/06-fee-engine-rules.md) | Fee calculation, allocation, and receipt rules |
| [07-excel-migration-plan.md](docs/07-excel-migration-plan.md) | Legacy data migration plan |
| [08-security-and-data-protection.md](docs/08-security-and-data-protection.md) | Security controls and OWASP compliance |
| [09-reporting-and-analytics.md](docs/09-reporting-and-analytics.md) | Report definitions and analytics design |
| [10-testing-strategy.md](docs/10-testing-strategy.md) | Testing approach and critical acceptance tests |
| [11-implementation-roadmap.md](docs/11-implementation-roadmap.md) | Phase-by-phase implementation plan |
| [12-risk-register.md](docs/12-risk-register.md) | Project risk register |
| [13-assumptions-and-decisions.md](docs/13-assumptions-and-decisions.md) | Design decisions and assumptions |

---

## Project Structure

```
MVHIGHSCHOOLERP/
├── apps/
│   ├── web/          # Next.js 15 frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── shared-types/ # Shared TypeScript types and DTOs
│   ├── validation/   # Shared Zod schemas
│   ├── ui/           # Shared UI components
│   └── config/       # Shared configurations
├── docs/             # Architecture documentation
├── infrastructure/   # Docker Compose and Nginx configs
├── scripts/          # Development and utility scripts
├── tests/            # Integration and E2E tests
└── .env.example
```

---

## Implementation Phase

Current phase: **Phase 0 (Architecture and Discovery) → Phase 1 (Foundation)**

See [task.md](task.md) for current task status and [walkthrough.md](walkthrough.md) for completed work summary.

---

## Security Notice

- Never commit `.env` files to Git.
- The `.env.example` file contains placeholder values only.
- Aadhaar numbers are encrypted at the column level.
- All financial records are immutable once posted.
- See [docs/08-security-and-data-protection.md](docs/08-security-and-data-protection.md) for full security documentation.

---

## License

Private and proprietary. All rights reserved by Marwari Vidyalaya High School.
