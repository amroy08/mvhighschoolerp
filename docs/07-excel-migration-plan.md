# 07 – Excel Migration Plan
## Marwari Vidyalaya School ERP

> **Status:** Phase 0 – Architecture  
> **Date:** 2026-07-30  
> **Version:** 1.0

---

## 1. Overview

The school will export data from the existing MySQL-based Vantage ERP as Excel files. The new system provides a controlled **Import Centre** to migrate this data safely, with full validation, duplicate detection, and rollback capability.

**Migration principle:** Data integrity above speed. Every imported row must be traceable. Invalid rows must never be silently discarded.

---

## 2. Import Types and Priority

| Priority | Import Type | Source Table(s) | Notes |
|----------|------------|-----------------|-------|
| P0 | Academic Years | academic_years | Import before everything else |
| P0 | Grades and Sections | classes, sections | Import after academic years |
| P0 | Students | students | Core entity |
| P0 | Guardians and Links | parents, students.parentId | Linked to students |
| P0 | Enrolment History | student_enrollment_history, students | Current and historical enrolments |
| P1 | Fee Structures | fee_structures + JSON components | Requires grades and academic years |
| P1 | Student Fee Assignments | student_fees | Requires students and fee structures |
| P1 | Opening Balances | Computed from outstanding in old system | As arrear fee charges |
| P1 | Payment History | fee_payments | Historical payments |
| P1 | Payment Allocations | fee_payment_allocations | Linked to payments |
| P1 | Receipt References | fee_payments.receiptNumber | For receipt number continuity |
| P2 | Student Documents | File metadata only | Actual files migrated separately |

---

## 3. Import Workflow

```
1.  Admin selects import type from Import Centre
2.  System provides downloadable Excel template with column headers and notes
3.  Admin exports data from old system, maps to template
4.  Admin uploads .xlsx file (max 20MB)
5.  Admin selects target Academic Year and Branch
6.  Admin maps source columns to target fields (if not using template)
7.  System previews first 10 rows
8.  Admin confirms and starts validation
9.  System validates all rows asynchronously (BullMQ job)
10. System displays validation report:
    - Total rows
    - Valid rows
    - Warning rows (importable but with caveats)
    - Error rows (blocked from import)
    - Duplicate rows (detected, skipped or flagged)
11. Admin downloads error report as Excel
12. Admin corrects errors in source file and re-uploads if needed
13. Admin confirms import of valid rows
14. System imports valid rows in a controlled database transaction (batches of 100)
15. System stores import_batch record with counts and status
16. Admin can view import history and download error report at any time
```

---

## 4. Student Import Template

| Column | Required | Notes |
|--------|----------|-------|
| legacy_id | Yes | Old system student ID (used for deduplication) |
| admission_number | Yes | Old admission number |
| gr_number | Yes | GR number |
| first_name | Yes | |
| middle_name | No | |
| last_name | Yes | |
| date_of_birth | Yes | DD/MM/YYYY format |
| gender | Yes | MALE / FEMALE / OTHER |
| blood_group | No | A+, B+, etc. |
| current_status | Yes | ACTIVE / PASSED_OUT / WITHDRAWN / TRANSFERRED |
| mobile | No | Student's own mobile |
| email | No | Student's email |
| address_line1 | No | |
| address_city | No | |
| address_state | No | |
| address_pincode | No | |
| remarks | No | |
| academic_year | Yes | YYYY-YY format, e.g., 2025-26 |
| grade_name | Yes | E.g., "Grade 5" or "Class 5" |
| section_name | Yes | E.g., "A" or "B" |
| roll_number | No | |
| admission_type | Yes | NEW / EXISTING |

---

## 5. Guardian Import Template

| Column | Required | Notes |
|--------|----------|-------|
| student_legacy_id | Yes | Links to student |
| student_gr_number | No | Alternative link key |
| relationship | Yes | FATHER / MOTHER / GUARDIAN |
| first_name | Yes | |
| last_name | No | |
| mobile | Yes | 10-digit Indian mobile |
| alternate_mobile | No | |
| email | No | |
| occupation | No | |
| is_primary_contact | Yes | TRUE / FALSE |

---

## 6. Fee Payment Import Template

| Column | Required | Notes |
|--------|----------|-------|
| legacy_payment_id | Yes | Old system payment ID |
| student_legacy_id | Yes | Old system student ID |
| student_gr_number | No | Alternative |
| payment_date | Yes | DD/MM/YYYY |
| amount_received | Yes | INR with 2 decimal places |
| payment_mode | Yes | CASH / UPI / NEFT / RTGS / CHEQUE / DD / OTHER |
| transaction_reference | No | Required for non-cash modes |
| bank_name | No | |
| receipt_number | Yes | Old receipt number (stored as legacy_receipt_number) |
| academic_year | Yes | YYYY-YY |
| remarks | No | |

---

## 7. Opening Balance Import Template

| Column | Required | Notes |
|--------|----------|-------|
| student_legacy_id | Yes | |
| student_gr_number | No | Alternative |
| source_academic_year | Yes | YYYY-YY — the year the balance originated from |
| balance_amount | Yes | INR decimal |
| description | No | |

---

## 8. Duplicate Detection Rules

| Import Type | Deduplication Keys |
|------------|-------------------|
| Students | `legacy_id`, then `gr_number`, then `admission_number`, then `first_name + date_of_birth + mobile` |
| Guardians | `student_legacy_id + relationship` |
| Fee Payments | `legacy_payment_id`, then `receipt_number`, then `transaction_reference + amount + date` |
| Opening Balances | `student_legacy_id + source_academic_year` |

If a duplicate is detected:
- The row is flagged with status `DUPLICATE`.
- The existing matched record's ID is shown.
- The admin can choose to skip or force-update (force-update requires explicit confirmation and creates an audit log).

---

## 9. Validation Rules

### Student Validation

| Rule | Action on Failure |
|------|-----------------|
| `date_of_birth` is a valid date | Error |
| `date_of_birth` is not in the future | Error |
| `mobile` is 10 digits if provided | Error |
| `gender` is valid code | Error |
| `grade_name` exists in the system | Error |
| `section_name` exists for the grade | Error |
| `academic_year` exists in the system | Error |
| `gr_number` is unique across students | Error (or duplicate detection) |
| `admission_number` is unique | Error (or duplicate detection) |

### Payment Validation

| Rule | Action on Failure |
|------|-----------------|
| `amount_received` > 0 | Error |
| `payment_date` is a valid date | Error |
| `payment_date` is not in the future | Warning |
| `payment_mode` is a valid code | Error |
| `transaction_reference` provided for non-cash modes | Error |
| `student_legacy_id` matches an existing student | Error |
| `receipt_number` is unique | Warning (stored as legacy_receipt_number) |

---

## 10. Import Error Report Format

The error report is a downloadable Excel file with these columns:

| Column | Description |
|--------|-------------|
| row_number | Original row in the uploaded file |
| field | Which field caused the error |
| source_value | The value that was in the source file |
| error_type | REQUIRED_MISSING, INVALID_FORMAT, DUPLICATE, REFERENCE_NOT_FOUND, etc. |
| suggested_correction | System suggestion for fixing the error |
| import_status | ERROR, WARNING, DUPLICATE |

---

## 11. Import Safety Controls

1. **Environment lock:** Import is blocked in read-only mode if a production lock is enabled.
2. **Batch size:** Records are imported in batches of 100 in a single database transaction per batch.
3. **Rollback on batch failure:** If any record in a batch fails during insert (e.g., database constraint), the entire batch is rolled back.
4. **Batch history:** Each import run creates an `import_batches` record with status, counts, and timestamps.
5. **Row traceability:** Each imported record stores `legacy_id` and the `import_batch_id` that created it.
6. **Rollback window:** Before any dependent financial transactions are created, the admin can roll back an import batch (deletes all records created by that batch).
7. **No silent discard:** Every row is accounted for — valid, warning, error, or duplicate.

---

## 12. Post-Migration Verification Checklist

After each import batch is completed, the admin should verify:

- [ ] Total student count matches the expected count from the old system.
- [ ] Sample 10 student records spot-checked for field accuracy.
- [ ] Guardian-student links are correctly established.
- [ ] Payment totals by academic year match old system reports.
- [ ] Opening balance totals by grade match old system outstanding reports.
- [ ] Receipt numbers are preserved in the `legacy_receipt_number` field.
- [ ] No duplicate GR numbers exist after import.
- [ ] Audit log shows all import batches with the admin user who ran them.

---

## 13. File Migration (Documents)

Student documents (photographs, certificates) stored in the old system's local `uploads/` directory must be migrated to the new S3-compatible storage separately.

Steps:
1. Export the old uploads directory as a ZIP archive.
2. Run the `scripts/migrate-documents.ts` script which:
   - Reads the student document file path records from the import batch.
   - Uploads each file to the new S3 bucket.
   - Updates the `student_documents` table with the new `file_key`.
3. Verify a sample of document URLs are accessible.

---

*End of Document 07*
