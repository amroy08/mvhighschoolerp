# 09 – Reporting and Analytics
## Marwari Vidyalaya School ERP

> **Status:** Phase 0 – Architecture  
> **Date:** 2026-07-30

---

## 1. Reporting Philosophy

- All report data comes from server-side aggregated queries, not from downloading full datasets to the browser.
- Reports are paginated server-side. Default page size: 50 rows.
- Filters are applied in the database WHERE clause.
- Exports (Excel, PDF) are generated on the server and streamed to the client.
- Report access is logged in the audit trail for sensitive reports (e.g., full student ledger, top defaulters).

---

## 2. Operational Reports

### 2.1 Daily Collection Report
**Purpose:** End-of-day summary of all payments collected.

**Filters:** Date, Branch, Cashier, Payment Mode

**Columns:** Receipt Number, Student Name, GR Number, Grade, Section, Amount, Payment Mode, Transaction Reference, Received By, Time

**Aggregates:** Total by Payment Mode, Grand Total

### 2.2 Cash Collection Report
**Purpose:** Cash-specific collection summary for cashier reconciliation.

**Columns:** Same as Daily Collection but pre-filtered for Cash mode.

### 2.3 Payment Mode Summary Report
**Purpose:** Break down collection by payment mode.

**Columns:** Payment Mode, Count, Total Amount, Percentage of Total

### 2.4 Receipt Register
**Purpose:** Complete register of all receipts with status.

**Filters:** Date range, Branch, Status (Active / Void)

**Columns:** Receipt Number, Date, Student, Grade, Amount, Mode, Status, Issued By

### 2.5 Cancelled/Void Receipt Report
**Purpose:** Audit all voided receipts.

**Columns:** Original Receipt, Void Date, Voided By, Reason, Replacement Receipt (if any)

### 2.6 Student Ledger Report
**Purpose:** Full financial history for one student.

**Filters:** Student, Academic Year, Date Range, Fee Head

**Rows:** Opening Balance, each Charge (with due date), Concessions, Payments (with allocations), Late Fees, Reversals, Closing Balance

### 2.7 Grade-wise Outstanding Report
**Purpose:** Total outstanding per grade.

**Filters:** Academic Year, Branch, Division

**Columns:** Grade, Total Students, Total Demand, Total Collected, Total Outstanding, Collection %

### 2.8 Section-wise Outstanding Report
**Purpose:** Outstanding per section for class teacher use.

**Columns:** Grade, Section, Total Students, Total Outstanding, Count with Outstanding

### 2.9 Student-wise Outstanding Report
**Purpose:** All students with outstanding balance.

**Filters:** Academic Year, Grade, Section, Minimum Outstanding Amount

**Columns:** Student Name, GR Number, Grade, Section, Guardian Mobile, Total Demand, Total Paid, Total Outstanding

### 2.10 Fee Head-wise Outstanding Report
**Purpose:** How much is outstanding per fee head.

**Columns:** Fee Head, Total Demand, Total Collected, Total Outstanding

### 2.11 Outstanding Ageing Report
**Purpose:** Classify outstanding by how old it is.

**Buckets:** Not Yet Due, 1–30 Days, 31–60 Days, 61–90 Days, 91–180 Days, More Than 180 Days

**Columns:** Student, Grade, Total Outstanding, Amount per bucket

### 2.12 Concession Report
**Purpose:** All concessions granted with approval details.

**Filters:** Type, Status, Academic Year, Grade

**Columns:** Student, Concession Type, Fee Head, Amount/Percentage, Approved By, Approval Date

### 2.13 Scholarship Report
Similar to Concession Report but filtered to scholarship types only.

### 2.14 Late Fee Report
**Purpose:** Late fees charged and collected.

**Columns:** Student, Grade, Fee Head, Due Date, Late Fee Charged, Late Fee Collected

### 2.15 Refund and Reversal Report
**Purpose:** All reversals and refunds with reasons.

**Columns:** Student, Original Receipt, Reversal Date, Amount, Reason, Approved By

### 2.16 New Admission Collection Report
**Purpose:** Fees collected specifically from new admissions.

**Filters:** Academic Year, Grade, Admission Date Range

**Columns:** Student, Admission Date, Grade, Admission Fee, Total Collected, Outstanding

### 2.17 Old Balance Recovery Report
**Purpose:** Track how much of opening balances have been recovered.

**Columns:** Student, Grade, Source Year, Original Balance, Recovered, Remaining

### 2.18 Cashier Closing Report
**Purpose:** Day-end report for each cashier.

**Columns:** Date, Cashier Name, Cash Total, UPI Total, NEFT Total, Other Total, Grand Total, Receipts Count

### 2.19 Import Error Report
**Purpose:** Errors from any import batch.

**Columns:** Row Number, Field, Source Value, Error Type, Suggested Correction

### 2.20 Promotion Report
**Purpose:** Summary of a promotion batch.

**Columns:** Student, From Grade, To Grade, Action (Promoted/Retained/Transferred), Arrear Carried Forward

### 2.21 Inactive/Old Student Report
**Purpose:** Students with status other than Active.

**Filters:** Status, Grade, Year Range

---

## 3. Analytics Dashboard

### 3.1 Management KPI Cards

| KPI | Formula | Update Frequency |
|-----|---------|-----------------|
| Total Students | COUNT(enrolments WHERE status = ACTIVE) | Real-time |
| Active Students | COUNT(students WHERE status = ACTIVE) | Real-time |
| New Admissions | COUNT(enrolments WHERE admission_type = NEW AND academic_year = current) | Real-time |
| Total Fee Demand | SUM(fee_charges.net_due) | Daily materialized view |
| Total Collected | SUM(payments.amount WHERE status = POSTED) | Real-time |
| Total Outstanding | Total Demand - Total Collected | Derived |
| Collection Percentage | (Total Collected / Total Demand) * 100 | Derived |
| Overdue Amount | SUM(fee_charges.outstanding WHERE status = OVERDUE) | Daily |
| Defaulter Count | COUNT(DISTINCT students WHERE outstanding > 0 AND oldest due > 30 days) | Daily |
| Current Month Collection | SUM for current calendar month | Real-time |
| Previous Month Collection | SUM for previous calendar month | Cached daily |
| Concession Amount | SUM(concessions.amount WHERE approved) | Daily |

### 3.2 Charts

| Chart | Type | X Axis | Y Axis / Metric |
|-------|------|---------|----------------|
| Monthly Collection Trend | Line | Month | Amount Collected |
| Demand vs Collection | Grouped Bar | Month | Demand, Collected |
| Grade-wise Collection | Horizontal Bar | Grade | Amount Collected |
| Grade-wise Outstanding | Horizontal Bar | Grade | Amount Outstanding |
| Section-wise Collection Rate | Heat Map | Grade x Section | Collection % |
| Fee Head Contribution | Pie | Fee Head | Total Demand % |
| Payment Mode Distribution | Donut | Mode | Amount |
| Outstanding Ageing | Stacked Bar | Bucket | Amount |
| Top Outstanding Grades | Ranked List | Grade | Total Outstanding |
| Top Defaulters | Table with drill-down | Student | Outstanding Amount |
| New Admission Trend | Line | Month | Count |
| Year-over-Year Collection | Multi-Line | Month | Amount per Year |
| Concession Trend | Line | Month | Concession Amount |
| Arrear Recovery Trend | Bar | Month | Recovery Amount |
| Collection by Cashier | Bar | Cashier | Amount |
| Day-of-Week Pattern | Bar | Day | Average Collection |

### 3.3 Drill-Down Hierarchy

```
School Summary
  → Branch Summary
    → Division Summary (Pre-Primary / Primary / Secondary)
      → Grade Summary
        → Section Summary
          → Student Ledger (with permission)
```

Navigation uses URL-based state so drill-down levels are shareable.

---

## 4. Database Views for Analytics

The following optimised PostgreSQL views are created and maintained:

### v_student_outstanding
```sql
CREATE MATERIALIZED VIEW v_student_outstanding AS
SELECT
  s.id AS student_id,
  s.full_name,
  s.gr_number,
  e.grade_id,
  e.section_id,
  e.academic_year_id,
  SUM(fc.net_due) AS total_demand,
  SUM(fc.paid_amount) AS total_paid,
  SUM(fc.outstanding_amount) AS total_outstanding,
  MIN(fc.due_date) FILTER (WHERE fc.outstanding_amount > 0) AS oldest_due_date
FROM students s
JOIN student_enrolments e ON e.student_id = s.id
JOIN fee_charges fc ON fc.enrolment_id = e.id
WHERE fc.status NOT IN ('WAIVED', 'CANCELLED')
GROUP BY s.id, s.full_name, s.gr_number, e.grade_id, e.section_id, e.academic_year_id;

REFRESH MATERIALIZED VIEW CONCURRENTLY v_student_outstanding;
-- Refreshed every 5 minutes via BullMQ cron job
```

### v_grade_collection_summary
Aggregates total demand, collected, outstanding per grade per academic year.

### v_monthly_collection
Monthly collection totals by payment mode and academic year.

### v_fee_head_summary
Fee head-wise demand and collection by academic year and branch.

---

## 5. Export Formats

| Format | Library | Notes |
|--------|---------|-------|
| Excel (.xlsx) | ExcelJS | Column headers, frozen first row, auto-width |
| PDF | PDFKit | School letterhead, date-stamped footer |
| Print (browser) | CSS print media query | Minimal styling, no navigation |
| CSV | Built-in Node.js | For large datasets when Excel is too slow |

---

## 6. Report Scheduling (Future Phase)

- Scheduled MIS reports delivered via email on a configurable schedule.
- Daily collection report auto-emailed to Principal and School Admin.
- Weekly outstanding summary auto-emailed to Accounts Admin.
- Monthly analytics summary emailed to Management.

---

## 7. Power BI Integration Readiness

The system is designed to support future Power BI or similar BI tool integration:

1. A dedicated read-only PostgreSQL user (`bi_reader`) is provisioned with access only to reporting views.
2. All analytics views use denormalised data with descriptive column names.
3. The `v_` prefix distinguishes reporting views from application tables.
4. Materialized views are refreshed on a schedule to avoid BI tool queries hitting live transactional data.

---

*End of Document 09*
