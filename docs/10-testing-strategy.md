# 10 – Testing Strategy
## Marwari Vidyalaya School ERP

> **Status:** Phase 0 – Architecture  
> **Date:** 2026-07-30

---

## 1. Testing Philosophy

- No phase is marked complete unless the specified tests pass.
- Tests run against a real PostgreSQL database (not an in-memory mock).
- All monetary assertion tests use `Decimal` comparison, not floating-point equality.
- Security tests are part of the standard test suite, not a separate phase gate.
- Test data uses only synthetic values (see seed data rules).

---

## 2. Test Levels

| Level | Tool | Location | Runs In CI |
|-------|------|----------|-----------|
| Unit tests | Jest | `apps/api/src/**/*.spec.ts` | Yes |
| Integration tests | Jest + PostgreSQL test DB | `tests/integration/**/*.test.ts` | Yes |
| E2E (API) | Jest + Supertest | `tests/e2e/api/**/*.test.ts` | Yes |
| E2E (UI) | Playwright | `tests/e2e/ui/**/*.spec.ts` | Yes |
| Load tests | k6 | `tests/load/**/*.js` | Optional / scheduled |

---

## 3. Unit Tests

### 3.1 Fee Calculation Tests

```
FeeEngineService.calculateOutstanding
  ✓ Returns zero outstanding for a fully paid student
  ✓ Returns correct outstanding when concession is applied
  ✓ Returns correct outstanding after partial payment
  ✓ Late fee is added to outstanding after grace period
  ✓ Waived charges are excluded from outstanding
  ✓ Cancelled charges are excluded from outstanding
  ✓ Reversals correctly restore outstanding
  ✓ Floating-point edge case: ₹100 / 3 instalments rounds correctly

FeeEngineService.calculateConcession
  ✓ Percentage concession rounds to 2 decimal places (ROUND_HALF_UP)
  ✓ Fixed concession cannot exceed original amount
  ✓ Concession makes net_due zero when amount equals original

PaymentAllocationService.allocate
  ✓ FIFO allocation clears oldest charge first
  ✓ Partial payment partially clears one charge
  ✓ Payment exactly matching outstanding allocates completely
  ✓ Payment exceeding outstanding is rejected
  ✓ Manual allocation total must equal payment amount
  ✓ Multiple charges: allocation order is by due_date ASC then created_at ASC
```

### 3.2 Receipt Sequence Tests

```
ReceiptSequenceService.generateReceiptNumber
  ✓ First receipt for branch generates 000001
  ✓ Sequential calls generate 000002, 000003 without gaps
  ✓ Concurrent receipt generation does not produce duplicates
  ✓ Format is MVHS/YYYY-YY/BR01/000001
  ✓ Different branches have independent sequences
  ✓ Different financial years have independent sequences
```

### 3.3 Promotion Tests

```
PromotionService.previewPromotion
  ✓ Returns list of students eligible for promotion
  ✓ Flags students with outstanding balances with warnings
  ✓ Identifies students who have already been promoted this year

PromotionService.executePromotion
  ✓ Closes previous enrolment with end_date set
  ✓ Creates new enrolment with correct grade and section
  ✓ Arrears are created as new fee_charges in new year
  ✓ Old payment history is preserved
  ✓ Rolled-back promotion removes new enrolment and arrear charges
```

---

## 4. Integration Tests

All integration tests run against a dedicated `mvhs_test` PostgreSQL database that is reset before each test file.

### 4.1 Payment Workflow

```
POST /api/v1/payments (Cash)
  ✓ Creates payment record with status POSTED
  ✓ Generates exactly one receipt with a unique sequential number
  ✓ Allocates payment against oldest outstanding charge
  ✓ Updates fee_charge paid_amount and outstanding_amount
  ✓ Creates audit_log entry with correct action and user
  ✓ Returns 400 if payment amount exceeds outstanding
  ✓ Two concurrent payments do not generate duplicate receipt numbers

POST /api/v1/payments (UPI)
  ✓ Creates payment with status PENDING_VERIFICATION when UTR is not verified
  ✓ Does not update student outstanding until posted
  ✓ PATCH /verify changes status to POSTED and generates receipt

POST /api/v1/payments (Cheque)
  ✓ Creates payment with status CHEQUE_PENDING
  ✓ Does not update student outstanding
  ✓ PATCH /clear generates receipt
  ✓ PATCH /bounce restores outstanding and voids receipt
```

### 4.2 RBAC Tests

```
Authentication
  ✓ Login with valid credentials returns access token cookie
  ✓ Login with invalid credentials returns 401
  ✓ Account locked after 5 failed attempts
  ✓ Locked account returns 403 with ACCOUNT_LOCKED code

Authorisation
  ✓ Cashier can collect fees (POST /payments)
  ✓ Cashier cannot reverse payments (DELETE/void)
  ✓ Cashier cannot view payments not collected by them
  ✓ Primary Operator cannot view Secondary students
  ✓ Pre-Primary Operator cannot view Primary students
  ✓ Auditor can view payments (GET) but not create (POST)
  ✓ Parent can view own child's ledger
  ✓ Parent cannot view another student's ledger
  ✓ Request without token returns 401
  ✓ Request with expired token returns 401
  ✓ Request with valid token but wrong permission returns 403
```

### 4.3 Excel Import Tests

```
POST /api/v1/imports/students
  ✓ Valid student file imports all rows
  ✓ Invalid GR number format returns error for that row
  ✓ Duplicate GR number detected and flagged
  ✓ Missing required field returns row-level error
  ✓ Import batch record created with correct counts
  ✓ Failed rows do not block valid rows
  ✓ Import roll-back deletes all created records
```

### 4.4 Concurrent Payment Test

```
Concurrent Receipt Generation
  Given: Student with ₹10,000 outstanding
  When: Two cashiers simultaneously submit payments of ₹5,000 each
  Then:
    ✓ Both payments are posted successfully
    ✓ Receipt numbers are unique and sequential
    ✓ Total allocated amount equals ₹10,000 (no double allocation)
    ✓ Outstanding is correctly updated to ₹0
```

---

## 5. End-to-End Acceptance Tests (Critical Scenarios)

### Test 1: New Grade 5 Admission Fee Structure
```
Scenario: A new Grade 5 student receives the new-admission fee structure
Given: Fee structures exist for Grade 5 (NEW) and Grade 5 (EXISTING)
When: A new student is enrolled in Grade 5
Then:
  - The NEW fee structure is assigned
  - The fee charges reflect the NEW amounts
  - Changing the EXISTING fee structure afterwards has no effect on the new student
```

### Test 2: Fee Structure Immutability
```
Scenario: Changing master does not alter assigned historical fees
Given: Student A is assigned Fee Structure FS-001 with Tuition Fee = ₹5,000/month
When: An admin updates FS-001 Tuition Fee to ₹5,500/month
Then:
  - Student A's existing fee charges still show ₹5,000/month
  - Student A's structure_snapshot still shows ₹5,000/month
  - Student B enrolled after the change shows ₹5,500/month
```

### Test 3: Cash Payment Receipt
```
Scenario: Parent pays ₹10,000 cash and receives exactly one receipt
Given: Student has ₹10,000 outstanding
When: Cashier records ₹10,000 cash payment
Then:
  - Exactly one payment record with status POSTED
  - Exactly one receipt with a unique sequential number
  - Outstanding amount is zero
  - Audit log records the transaction
```

### Test 4: Duplicate Webhook Protection
```
Scenario: Duplicate online webhook does not create second payment (future)
Given: A payment gateway event has already been processed
When: The same event is received again (retry)
Then:
  - No duplicate payment is created
  - No duplicate receipt is generated
  - Response returns 200 with idempotency acknowledgement
```

### Test 5: Concurrent Receipt Number Safety
```
Scenario: Two cashiers cannot generate the same receipt number
Given: Ten cashiers simultaneously post payments
When: All payments are processed concurrently
Then:
  - All receipt numbers are unique
  - All receipt numbers are sequential with no gaps
  - No database deadlock or error
```

### Test 6: Posted Payment Cannot Be Deleted
```
Scenario: A posted payment cannot be deleted
Given: A payment has been posted with status POSTED
When: Any user attempts to call DELETE /api/v1/payments/{id}
Then:
  - 405 Method Not Allowed (endpoint does not exist)
  - OR 403 Forbidden (permission denied)
  - The payment record remains in the database
```

### Test 7: Reversal Audit Trail
```
Scenario: A reversal preserves the original payment
Given: Payment P1 with receipt R1 is posted
When: An authorised reversal is completed
Then:
  - P1 status = REVERSED
  - R1 is_void = true
  - reversal record links P1 to the reversal record
  - A new payment P2 and receipt R2 are created if correction is needed
  - All four records (P1, R1, P2, R2) exist in the database
  - Audit log has entries for the reversal request, approval, and execution
```

### Test 8: Promotion History Preservation
```
Scenario: Promotion preserves previous grade and payment history
Given: Student S1 is in Grade 4 with payment history for 2025-26
When: S1 is promoted to Grade 5 for 2026-27
Then:
  - Old enrolment for 2025-26 has status COMPLETED
  - New enrolment for 2026-27 has status ACTIVE
  - All 2025-26 payment records still exist and are linked to the old enrolment
  - S1's student record is NOT duplicated
```

### Test 9: Excel Import Rejected Rows
```
Scenario: Excel import shows rejected rows without silently losing data
Given: An import file with 100 rows, 10 of which have invalid GR numbers
When: Import is executed
Then:
  - 90 valid rows are imported
  - 10 error rows are recorded in import_rows with status ERROR
  - Import batch shows valid_rows = 90, failed_rows = 10
  - Admin can download the error report showing the 10 invalid rows
  - None of the 100 rows are silently discarded
```

### Test 10: Auditor Read-Only Access
```
Scenario: An Auditor can view but cannot modify financial transactions
Given: A user with the Auditor role
When:
  - GET /api/v1/payments → 200 OK
  - POST /api/v1/payments → 403 Forbidden
  - PATCH /api/v1/payments/{id}/verify → 403 Forbidden
  - GET /api/v1/audit-logs → 200 OK
Then: All assertions pass as described
```

### Test 11: Division-Based Access Control
```
Scenario: Primary Operator cannot view Secondary students
Given: User U1 has Primary Operator role, scoped to Primary department
When: U1 requests GET /api/v1/students?gradeId={secondary_grade_id}
Then:
  - 403 Forbidden with code UNAUTHORISED_BRANCH_ACCESS
  - OR empty result set (no data leak)
```

### Test 12: Analytics Totals Consistency
```
Scenario: Analytics totals match payment and outstanding reports
Given: 100 students with a mix of paid, partial, and unpaid status
When:
  - GET /api/v1/analytics/kpi → total_collected = X
  - GET /api/v1/reports/grade-outstanding → SUM(total_paid) = Y
Then:
  - X == Y (within rounding tolerance of ₹0.00)
  - total_outstanding in analytics == SUM(total_outstanding) in grade-outstanding report
```

---

## 6. Test Commands

```bash
# Run all unit tests
cd apps/api && npm run test

# Run unit tests with coverage
cd apps/api && npm run test:cov

# Run integration tests (requires test database)
npm run test:integration

# Run E2E API tests
npm run test:e2e:api

# Run Playwright E2E UI tests
npm run test:e2e:ui

# Run all tests in CI
npm run test:ci

# Check TypeScript
npm run typecheck

# Check linting
npm run lint
```

---

## 7. Test Data Rules

- All test data uses only synthetic values.
- Student names: `Test Student 001`, `Test Student 002`, etc.
- GR numbers: `GR-TEST-0001`, `GR-TEST-0002`.
- Phone numbers: `9000000001` to `9000000999`.
- UPI references: `TEST-UPI-0001`, `TEST-UPI-0002`.
- Receipt numbers use the TEST prefix: `MVHS/TEST-YEAR/BR00/000001`.
- Aadhaar values in tests: `1234-5678-9012` (clearly synthetic).
- No real student names, phone numbers, Aadhaar values, or bank references in any test fixture.

---

## 8. Phase Completion Gates

A phase is marked complete only when:

1. All unit tests in scope pass.
2. All integration tests in scope pass.
3. All critical acceptance scenarios for the phase pass.
4. TypeScript type check (`tsc --noEmit`) passes.
5. ESLint passes with zero errors.
6. Migrations run cleanly on a fresh database.
7. Seed script runs successfully on a fresh database.
8. No known P0 or P1 bugs remain unresolved.
9. A walkthrough document is updated with the phase summary.

---

*End of Document 10*
