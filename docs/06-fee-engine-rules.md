# 06 – Fee Engine Rules
## Marwari Vidyalaya School ERP

> **Status:** Phase 0 – Architecture  
> **Date:** 2026-07-30  
> **Version:** 1.0

---

## 1. Monetary Precision Rule

**Absolute Rule:** All fee arithmetic must use PostgreSQL `DECIMAL(15,2)` or the `decimal.js` library on the server. JavaScript's native `number` type must never be used for fee calculations.

All amounts are stored as Indian Rupees with two decimal places. The application does not use paisa as a unit internally (though the database stores `DECIMAL(15,2)` which naturally supports paisa precision).

---

## 2. Fee Structure Hierarchy

A fee structure is resolved in this order, most specific to least specific:

```
Student-level override (authorised adjustment)
  → Grade + Admission Category + Student Type (new / existing)
    → Grade + Division
      → Division only
        → Branch-wide
          → School-wide
```

**Assumption A01:** If a student has both a grade-level and a division-level structure defined, the grade-level structure takes precedence.

---

## 3. Student Types

| Code | Description |
|------|-------------|
| `NEW` | Student admitted in the current academic year for the first time |
| `EXISTING` | Student promoted from a previous academic year |
| `REJOINING` | Student who previously left and has re-enrolled |

The system determines the type automatically based on whether a previous enrolment exists for the same school.

---

## 4. Fee Frequency Codes

| Code | Description | Demand Generation |
|------|-------------|-----------------|
| `ONE_TIME` | Single payment (e.g., Admission Fee) | Once at enrolment |
| `MONTHLY` | 12 demands per year | On the 1st of each month |
| `QUARTERLY` | 4 demands per year | April, July, October, January |
| `TERMLY` | 3 demands per year | April, August, November |
| `ANNUAL` | 1 demand per year | On enrolment or year start |
| `CUSTOM` | Instalment schedule defined separately | Per instalment dates |

---

## 5. Fee Head Categories

| Category | Examples | Refundable Default |
|----------|----------|-------------------|
| `ADMISSION` | Admission Fee | No |
| `TUITION` | Tuition Fee, Monthly Fee, Term Fee | No |
| `MAINTENANCE` | Development Fee, Building Fund | No |
| `EXAMINATION` | Exam Fee, Assessment Fee | No |
| `ACTIVITY` | Activity Fee, Lab Fee, Computer Fee | No |
| `LIBRARY` | Library Fee | No |
| `TRANSPORT` | Transport Fee | No |
| `LATE_FEE` | Late Payment Charge | No |
| `ARREAR` | Previous Year Balance | No |
| `OTHER` | Miscellaneous | Configurable |

---

## 6. Fee Structure Snapshot Rule (Critical)

**Business Rule BR-01:** When a fee structure is assigned to a student, the system creates a `student_fee_assignments` record containing:
- A reference to the `fee_structure_id`.
- A `structure_snapshot` JSON column containing the complete structure and all line amounts at the time of assignment.

**If the Fee Structure Master is modified after assignment:**
- The `fee_structure_lines` table is updated.
- The `student_fee_assignment.structure_snapshot` is NOT updated.
- The `fee_charges` already generated from this assignment are NOT updated.

**To apply a new structure to a student:**
- The Accounts Administrator must explicitly create a new assignment (with approval if required).
- The old charges must be adjusted via a concession or adjustment record.
- A full audit trail must record who changed what and why.

---

## 7. Fee Charge Generation

When a `student_fee_assignment` is created:

1. For each line in the snapshot:
   - Determine the charge dates based on frequency.
   - Create one `fee_charges` record per period.
   - Set `original_amount` = line amount.
   - Set `net_due` = `original_amount` - `concession_amount`.
   - Set `outstanding_amount` = `net_due`.
   - Set `status` = `UPCOMING` (if due date is in the future) or `DUE` (if today or past).

2. For `ONE_TIME` fees: create a single charge dated at enrolment date.

3. For `ANNUAL` fees: create a single charge dated at the first day of the academic year.

4. For `MONTHLY` fees: create 12 charges, one per month, dated on the configured due day of each month (default: 10th).

---

## 8. Outstanding Calculation

```
Outstanding(student, academicYear) =
  SUM(net_due from fee_charges WHERE status NOT IN (WAIVED, CANCELLED))
  - SUM(allocated_amount from payment_allocations WHERE payment.status = POSTED)
  + SUM(late_fee_amount from fee_charges WHERE status IN (OVERDUE, DUE))
```

**This is always calculated from database records.** It is never stored as a flat column on the student record.

---

## 9. Old Balance / Opening Balance Rule

Opening balances from a prior year or prior system must be imported as `fee_charges` with:

| Field | Value |
|-------|-------|
| `fee_head_id` | Points to a `ARREAR` category fee head |
| `status` | `DUE` |
| `source_year` | The academic year the balance originated from |
| `import_batch_id` | References the `import_batches` record |
| `original_amount` | The arrear amount |
| `net_due` | Same as original (no concession applied at import time) |
| `due_date` | First day of the new academic year |

**Opening balance must never be a flat column on the student record.** All historical balances must be traceable to a source academic year and import batch.

---

## 10. Concession Types

| Type | Description | Approval Required |
|------|-------------|-----------------|
| `MERIT_SCHOLARSHIP` | Academic merit discount | School Admin or above |
| `SIBLING_DISCOUNT` | Discount for second or more children | Branch Admin or above |
| `STAFF_CHILD` | Discount for children of school staff | School Admin |
| `NEED_BASED` | Financial hardship-based waiver | School Admin or above |
| `MANAGEMENT_WAIVER` | Management-discretionary waiver | School Admin or above |
| `GOVERNMENT_SCHEME` | Government scholarship or reduction | School Admin or above |
| `OTHER` | Other configured types | Configurable |

### Concession Computation

If concession is `PERCENTAGE`: 
```
concession_amount = ROUND(original_amount * percentage / 100, 2)
```

If concession is `FIXED`:
```
concession_amount = fixed_amount
```

```
net_due = original_amount - concession_amount
```

Concession cannot exceed `original_amount`. Validation must reject any concession that would make `net_due` negative.

---

## 11. Late Fee Rules

| Rule | Description |
|------|-------------|
| Grace period | Number of days after due date before late fee applies (configurable per fee head) |
| Flat late fee | A fixed INR amount charged after grace period |
| Percentage late fee | A percentage of outstanding per day or per month |
| Maximum late fee | Cap on total late fee per charge |
| Late fee applies to | Configurable: all fee heads, or specific heads only |

Late fee is added to the `late_fee_amount` column on `fee_charges`. It does not create a separate charge row (this simplifies the ledger, though the late fee is shown separately in the receipt).

---

## 12. Payment Allocation Rules

### Automatic Allocation (FIFO)

When a payment is received:
1. Sort all outstanding `fee_charges` for the student by `due_date ASC, created_at ASC`.
2. Allocate the payment amount against charges in sequence.
3. For each charge: `allocated_amount = MIN(remaining_payment, outstanding_amount)`.
4. Continue until payment is fully allocated or all charges are settled.

### Manual Allocation

If the Accounts Administrator has `payments:manual_allocate` permission, they can override the allocation before posting. The total allocated amount must equal the payment amount.

### Payment Cannot Exceed Outstanding

```
total_outstanding = SUM(outstanding_amount) for all ACTIVE fee_charges
IF amount_received > total_outstanding AND advance_payment NOT enabled:
  REJECT with PAYMENT_EXCEEDS_OUTSTANDING
```

---

## 13. Cheque Bounce Workflow

When a cheque payment is marked as `CHEQUE_BOUNCED`:

1. The payment status changes to `CHEQUE_BOUNCED`.
2. All `payment_allocations` for this payment are reversed.
3. All affected `fee_charges` have their `paid_amount` reduced and `outstanding_amount` restored.
4. The original receipt is voided (is_void = true).
5. An audit log entry records the bounce.
6. A cheque bounce charge may be applied (if configured as a fee head).
7. The student receives a notification.

---

## 14. Reversal Workflow

To correct a posted payment:

1. The Accounts Administrator requests a reversal with a reason.
2. If `amount_reversed > approval_limit` for the role, School Admin approval is required.
3. On approval:
   a. The original payment status changes to `REVERSED`.
   b. All payment allocations are reversed.
   c. All affected fee charges are restored.
   d. The original receipt is voided.
   e. If a correction payment is required, a new payment and receipt are created.
   f. All steps are in one database transaction.
4. The audit log records: original payment, reversal reason, approved by, timestamp.

---

## 15. Receipt Number Sequence Algorithm

```sql
-- Using PostgreSQL advisory lock to prevent concurrent duplicate generation
SELECT pg_try_advisory_xact_lock(hashtext('receipt_seq_' || branch_id || '_' || financial_year_id));

-- If lock acquired:
UPDATE receipt_sequences
SET last_sequence = last_sequence + 1
WHERE branch_id = ? AND financial_year_id = ?
RETURNING last_sequence, prefix;

-- Format: MVHS/2026-27/BR01/000001
receipt_number = prefix || '/' || LPAD(last_sequence::text, 6, '0')
```

The advisory lock ensures that concurrent payment postings cannot generate the same receipt number.

---

## 16. Refund Rules

Refunds apply only to refundable fee heads (e.g., security deposit, if applicable).

1. Refund request is created with amount and reason.
2. Approval is required from School Admin or above.
3. On approval:
   a. A `refunds` record is created.
   b. The affected `fee_charges` record has `paid_amount` reduced.
   c. The original receipt is not voided — the refund is a separate transaction.
   d. A refund acknowledgement is generated (not a fee receipt).
4. Refund amount cannot exceed the paid amount for refundable heads.

---

## 17. Promotion Arrear Carry-Forward

When a student is promoted to the next academic year:

1. Calculate `total_outstanding` for the current year = sum of all outstanding fee charges.
2. If `total_outstanding > 0`:
   a. Create a new `fee_charges` record in the new academic year.
   b. `fee_head_id` = the configured "Arrear" fee head.
   c. `original_amount` = `total_outstanding`.
   d. `source_year` = the current academic year ID.
   e. `status` = `DUE`.
3. The old fee charges remain in the old academic year scope — they are NOT deleted or modified.

---

*End of Document 06*
