# 04 – Database ERD
## Marwari Vidyalaya School ERP

> **Status:** Phase 0 – Architecture  
> **Date:** 2026-07-30  
> **Database:** PostgreSQL 16

---

## 1. Design Principles

- All primary keys are UUID v4.
- All monetary amounts use `DECIMAL(15,2)` — never `FLOAT` or `REAL`.
- All dates use `TIMESTAMPTZ` (timestamp with time zone) stored in UTC.
- Application layer formats to IST for display.
- Soft deletion is used only where the record must remain referenceable from financial records (e.g., fee heads, grades). Financial records (payments, receipts, audit logs) are never soft-deleted.
- `created_at`, `updated_at`, `created_by_id`, `updated_by_id` on every mutable entity.
- Foreign key constraints enforced at database level.
- `legacy_id VARCHAR(100)` on every entity that will receive migrated data.

---

## 2. Entity Relationship Diagram (Core)

```mermaid
erDiagram
  organisations {
    uuid id PK
    varchar name
    varchar slug UK
    text address
    varchar phone
    varchar email
    varchar website
    varchar logo_key
    boolean is_active
    timestamp created_at
    timestamp updated_at
  }

  schools {
    uuid id PK
    uuid organisation_id FK
    varchar name
    varchar short_code UK
    text address
    varchar phone
    varchar email
    varchar logo_key
    varchar affiliation_board
    varchar principal_name
    boolean is_active
    varchar legacy_id
    timestamp created_at
    timestamp updated_at
  }

  branches {
    uuid id PK
    uuid school_id FK
    varchar name
    varchar code UK
    text address
    varchar phone
    varchar email
    boolean is_active
    varchar legacy_id
    timestamp created_at
    timestamp updated_at
  }

  academic_years {
    uuid id PK
    uuid school_id FK
    varchar name
    date start_date
    date end_date
    boolean is_current
    varchar legacy_id
    timestamp created_at
    timestamp updated_at
  }

  financial_years {
    uuid id PK
    uuid school_id FK
    varchar name
    date start_date
    date end_date
    boolean is_current
    timestamp created_at
    timestamp updated_at
  }

  departments {
    uuid id PK
    uuid school_id FK
    varchar name
    varchar code
    int sort_order
    boolean is_active
    timestamp created_at
    timestamp updated_at
  }

  grades {
    uuid id PK
    uuid school_id FK
    uuid department_id FK
    varchar name
    int numeric_value
    int sort_order
    boolean is_active
    varchar legacy_id
    timestamp created_at
    timestamp updated_at
  }

  sections {
    uuid id PK
    uuid grade_id FK
    uuid school_id FK
    varchar name
    int capacity
    boolean is_active
    varchar legacy_id
    timestamp created_at
    timestamp updated_at
  }

  organisations ||--o{ schools : "has"
  schools ||--o{ branches : "has"
  schools ||--o{ academic_years : "has"
  schools ||--o{ financial_years : "has"
  schools ||--o{ departments : "has"
  schools ||--o{ grades : "has"
  departments ||--o{ grades : "belongs to"
  grades ||--o{ sections : "has"
```

---

## 3. Entity Relationship Diagram (Students and Enrolments)

```mermaid
erDiagram
  students {
    uuid id PK
    uuid school_id FK
    varchar student_id UK
    varchar gr_number UK
    varchar admission_number UK
    varchar legacy_id
    varchar first_name
    varchar middle_name
    varchar last_name
    varchar full_name
    date date_of_birth
    varchar gender
    varchar blood_group
    varchar religion
    varchar category
    varchar current_status
    varchar mobile
    varchar email
    text address_line1
    varchar address_city
    varchar address_state
    varchar address_pincode
    text aadhaar_encrypted
    varchar aadhaar_last4
    varchar profile_photo_key
    text remarks
    uuid created_by_id FK
    uuid updated_by_id FK
    timestamp created_at
    timestamp updated_at
  }

  guardians {
    uuid id PK
    uuid school_id FK
    varchar relationship_to_student
    varchar first_name
    varchar last_name
    varchar mobile
    varchar alternate_mobile
    varchar email
    varchar occupation
    text address
    boolean is_emergency_contact
    boolean has_portal_access
    varchar user_id FK
    varchar legacy_id
    timestamp created_at
    timestamp updated_at
  }

  student_guardians {
    uuid id PK
    uuid student_id FK
    uuid guardian_id FK
    varchar relationship
    boolean is_primary
    timestamp created_at
  }

  student_enrolments {
    uuid id PK
    uuid student_id FK
    uuid school_id FK
    uuid branch_id FK
    uuid academic_year_id FK
    uuid department_id FK
    uuid grade_id FK
    uuid section_id FK
    varchar roll_number
    varchar admission_type
    varchar status
    uuid promotion_batch_id FK
    date start_date
    date end_date
    uuid created_by_id FK
    varchar legacy_id
    timestamp created_at
    timestamp updated_at
  }

  student_documents {
    uuid id PK
    uuid student_id FK
    uuid document_type_id FK
    varchar file_key
    varchar original_name
    bigint file_size
    varchar mime_type
    varchar verification_status
    uuid verified_by_id FK
    date verified_date
    boolean is_active
    timestamp created_at
    timestamp updated_at
  }

  document_types {
    uuid id PK
    uuid school_id FK
    varchar name
    varchar code
    boolean is_required
    boolean is_sensitive
    timestamp created_at
    timestamp updated_at
  }

  students ||--o{ student_guardians : "has"
  guardians ||--o{ student_guardians : "linked"
  students ||--o{ student_enrolments : "enrolled in"
  students ||--o{ student_documents : "has"
  document_types ||--o{ student_documents : "typed as"
```

---

## 4. Entity Relationship Diagram (Fee Engine)

```mermaid
erDiagram
  fee_heads {
    uuid id PK
    uuid school_id FK
    varchar name
    varchar code UK
    varchar category
    boolean is_refundable
    boolean is_optional
    int sort_order
    boolean is_active
    varchar legacy_id
    timestamp created_at
    timestamp updated_at
  }

  fee_structures {
    uuid id PK
    uuid school_id FK
    uuid branch_id FK
    uuid academic_year_id FK
    uuid department_id FK
    uuid grade_id FK
    varchar admission_category
    varchar student_type
    varchar name
    date effective_from
    boolean is_active
    uuid created_by_id FK
    varchar legacy_id
    timestamp created_at
    timestamp updated_at
  }

  fee_structure_lines {
    uuid id PK
    uuid fee_structure_id FK
    uuid fee_head_id FK
    decimal amount
    varchar frequency
    varchar due_date_rule
    int instalment_number
    boolean is_mandatory
    varchar applicable_period
    int sort_order
    timestamp created_at
    timestamp updated_at
  }

  student_fee_assignments {
    uuid id PK
    uuid student_id FK
    uuid enrolment_id FK
    uuid fee_structure_id FK
    uuid academic_year_id FK
    json structure_snapshot
    uuid assigned_by_id FK
    date assigned_date
    varchar legacy_id
    timestamp created_at
    timestamp updated_at
  }

  fee_charges {
    uuid id PK
    uuid student_id FK
    uuid enrolment_id FK
    uuid assignment_id FK
    uuid fee_head_id FK
    uuid academic_year_id FK
    date due_date
    decimal original_amount
    decimal concession_amount
    decimal late_fee_amount
    decimal adjustment_amount
    decimal net_due
    decimal paid_amount
    decimal outstanding_amount
    varchar status
    varchar source_year
    varchar import_batch_id
    varchar legacy_id
    timestamp created_at
    timestamp updated_at
  }

  concessions {
    uuid id PK
    uuid student_id FK
    uuid fee_charge_id FK
    uuid concession_type_id FK
    varchar basis
    decimal amount
    decimal percentage
    text reason
    varchar document_key
    varchar approval_status
    uuid requested_by_id FK
    uuid approved_by_id FK
    timestamp approved_at
    timestamp created_at
    timestamp updated_at
  }

  fee_structures ||--o{ fee_structure_lines : "has lines"
  fee_heads ||--o{ fee_structure_lines : "referenced by"
  students ||--o{ student_fee_assignments : "assigned"
  fee_structures ||--o{ student_fee_assignments : "assigned from"
  student_fee_assignments ||--o{ fee_charges : "generates"
  fee_heads ||--o{ fee_charges : "charges by"
  fee_charges ||--o{ concessions : "receives"
```

---

## 5. Entity Relationship Diagram (Payments and Receipts)

```mermaid
erDiagram
  payments {
    uuid id PK
    uuid student_id FK
    uuid enrolment_id FK
    uuid school_id FK
    uuid branch_id FK
    uuid academic_year_id FK
    uuid financial_year_id FK
    date payment_date
    decimal amount_received
    varchar payment_mode
    varchar transaction_reference
    varchar bank_name
    varchar upi_app
    varchar cheque_number
    date cheque_date
    varchar proof_key
    text remarks
    varchar status
    uuid collected_by_id FK
    uuid verified_by_id FK
    timestamp verified_at
    text verification_remarks
    varchar legacy_id
    timestamp created_at
    timestamp updated_at
  }

  payment_allocations {
    uuid id PK
    uuid payment_id FK
    uuid fee_charge_id FK
    uuid student_id FK
    decimal allocated_amount
    varchar fee_head_snapshot_name
    timestamp created_at
  }

  receipts {
    uuid id PK
    uuid payment_id FK
    uuid student_id FK
    uuid school_id FK
    uuid branch_id FK
    varchar receipt_number UK
    uuid receipt_sequence_id FK
    date receipt_date
    decimal total_amount
    decimal balance_after
    json receipt_data_snapshot
    varchar pdf_key
    boolean is_void
    uuid voided_by_id FK
    timestamp voided_at
    text void_reason
    uuid replacement_payment_id FK
    varchar legacy_id
    timestamp created_at
    timestamp updated_at
  }

  receipt_sequences {
    uuid id PK
    uuid branch_id FK
    uuid financial_year_id FK
    varchar prefix
    int last_sequence
    timestamp updated_at
  }

  reversals {
    uuid id PK
    uuid original_payment_id FK
    uuid original_receipt_id FK
    uuid reversal_payment_id FK
    uuid reversal_receipt_id FK
    uuid student_id FK
    text reason
    varchar approval_status
    uuid requested_by_id FK
    uuid approved_by_id FK
    timestamp approved_at
    timestamp created_at
    timestamp updated_at
  }

  payments ||--o{ payment_allocations : "allocates to"
  payment_allocations }o--|| fee_charges : "reduces"
  payments ||--|| receipts : "generates"
  receipt_sequences ||--o{ receipts : "sequences"
  receipts ||--o{ reversals : "reversed by"
```

---

## 6. Entity Relationship Diagram (Users, Roles, Audit)

```mermaid
erDiagram
  users {
    uuid id PK
    uuid school_id FK
    varchar email UK
    varchar password_hash
    varchar name
    varchar phone
    varchar profile_photo_key
    boolean is_active
    int failed_login_count
    timestamp locked_until
    timestamp last_login_at
    varchar totp_secret_encrypted
    boolean is_mfa_enabled
    timestamp created_at
    timestamp updated_at
  }

  roles {
    uuid id PK
    uuid school_id FK
    varchar name UK
    varchar display_name
    boolean is_system_role
    timestamp created_at
    timestamp updated_at
  }

  permissions {
    uuid id PK
    varchar resource
    varchar action
    varchar description
    timestamp created_at
  }

  role_permissions {
    uuid id PK
    uuid role_id FK
    uuid permission_id FK
    timestamp created_at
  }

  user_roles {
    uuid id PK
    uuid user_id FK
    uuid role_id FK
    timestamp created_at
  }

  user_scopes {
    uuid id PK
    uuid user_id FK
    varchar scope_type
    uuid scope_id
    timestamp created_at
  }

  audit_logs {
    uuid id PK
    uuid user_id FK
    varchar user_email
    varchar role_name
    uuid school_id FK
    uuid branch_id FK
    varchar action
    varchar module
    varchar record_id
    jsonb before_values
    jsonb after_values
    varchar ip_address
    varchar user_agent
    text reason
    varchar approval_reference
    timestamp created_at
  }

  users ||--o{ user_roles : "has"
  roles ||--o{ user_roles : "assigned to"
  roles ||--o{ role_permissions : "has"
  permissions ||--o{ role_permissions : "in"
  users ||--o{ user_scopes : "scoped to"
  users ||--o{ audit_logs : "creates"
```

---

## 7. Entity Relationship Diagram (Imports and Promotion)

```mermaid
erDiagram
  import_batches {
    uuid id PK
    uuid school_id FK
    uuid branch_id FK
    uuid academic_year_id FK
    varchar import_type
    varchar file_name
    varchar file_key
    int total_rows
    int valid_rows
    int failed_rows
    varchar status
    uuid created_by_id FK
    timestamp completed_at
    timestamp created_at
    timestamp updated_at
  }

  import_rows {
    uuid id PK
    uuid batch_id FK
    int row_number
    jsonb source_data
    jsonb mapped_data
    varchar status
    jsonb errors
    uuid result_entity_id
    varchar result_entity_type
    timestamp created_at
    timestamp updated_at
  }

  promotion_batches {
    uuid id PK
    uuid school_id FK
    uuid branch_id FK
    uuid from_academic_year_id FK
    uuid to_academic_year_id FK
    varchar status
    uuid created_by_id FK
    timestamp completed_at
    timestamp created_at
    timestamp updated_at
  }

  promotion_batch_items {
    uuid id PK
    uuid batch_id FK
    uuid student_id FK
    uuid from_enrolment_id FK
    uuid to_enrolment_id FK
    varchar action
    text remarks
    decimal arrear_amount
    varchar status
    timestamp created_at
    timestamp updated_at
  }

  outbox_events {
    uuid id PK
    varchar event_type
    jsonb payload
    varchar status
    int retry_count
    timestamp process_after
    timestamp processed_at
    text error_message
    timestamp created_at
  }

  import_batches ||--o{ import_rows : "contains"
  promotion_batches ||--o{ promotion_batch_items : "contains"
```

---

## 8. Key Database Constraints and Indexes

### Unique Constraints
```sql
-- Receipt number uniqueness
UNIQUE (receipt_number) ON receipts

-- Receipt sequence per branch/financial year
UNIQUE (branch_id, financial_year_id) ON receipt_sequences

-- Duplicate transaction reference prevention
UNIQUE (school_id, payment_mode, transaction_reference) 
  ON payments WHERE payment_mode != 'CASH' AND transaction_reference IS NOT NULL

-- Student unique identifiers
UNIQUE (gr_number) ON students
UNIQUE (admission_number) ON students
UNIQUE (student_id) ON students

-- Fee charge per student per head per period
UNIQUE (enrolment_id, fee_head_id, applicable_period) ON fee_charges

-- Student fee assignment per enrolment
UNIQUE (enrolment_id, fee_structure_id) ON student_fee_assignments

-- One enrolment per student per academic year
UNIQUE (student_id, academic_year_id) ON student_enrolments

-- Academic year per school
UNIQUE (school_id, name) ON academic_years
```

### Critical Indexes
```sql
-- Student search
CREATE INDEX idx_students_gr ON students(gr_number);
CREATE INDEX idx_students_admission ON students(admission_number);
CREATE INDEX idx_students_status ON students(school_id, current_status);
CREATE INDEX idx_students_legacy ON students(legacy_id);

-- Fee charges outstanding lookup
CREATE INDEX idx_fee_charges_outstanding ON fee_charges(enrolment_id, status, due_date);
CREATE INDEX idx_fee_charges_student ON fee_charges(student_id, academic_year_id);

-- Payment lookup
CREATE INDEX idx_payments_student ON payments(student_id, payment_date);
CREATE INDEX idx_payments_status ON payments(school_id, status);
CREATE INDEX idx_payments_txn ON payments(transaction_reference) WHERE transaction_reference IS NOT NULL;

-- Audit log lookup
CREATE INDEX idx_audit_logs_record ON audit_logs(record_id, created_at);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at);

-- Receipts
CREATE INDEX idx_receipts_student ON receipts(student_id, receipt_date);
CREATE INDEX idx_receipts_number ON receipts(receipt_number);
```

### Check Constraints
```sql
-- Monetary amounts must not be negative
ALTER TABLE fee_charges ADD CONSTRAINT chk_amounts_positive CHECK (
  original_amount >= 0 AND
  concession_amount >= 0 AND
  late_fee_amount >= 0 AND
  paid_amount >= 0 AND
  outstanding_amount >= 0
);

ALTER TABLE payments ADD CONSTRAINT chk_payment_positive CHECK (amount_received > 0);
ALTER TABLE payment_allocations ADD CONSTRAINT chk_allocation_positive CHECK (allocated_amount > 0);

-- Payment mode validation
ALTER TABLE payments ADD CONSTRAINT chk_payment_mode CHECK (
  payment_mode IN ('CASH','UPI','NEFT','RTGS','IMPS','BANK_TRANSFER','CHEQUE','DD','DEBIT_CARD','CREDIT_CARD','OTHER')
);
```

---

## 9. Table-Level Notes

| Table | Notes |
|-------|-------|
| `audit_logs` | Append-only. No UPDATE or DELETE permissions granted to application role. |
| `receipts` | `is_void` can be set true but the record is never deleted. |
| `payments` | Status transitions: Draft → PendingVerification → Verified → Posted → ChequePending → ChequeCleared/ChequeBounced/Reversed. No DELETE. |
| `fee_charges` | Generated from assignment. Concession reduces net_due. Outstanding = net_due - paid_amount. |
| `student_fee_assignments` | `structure_snapshot` stores the full fee structure JSON at time of assignment. |
| `outbox_events` | Processed by BullMQ worker. Status: PENDING → PROCESSING → DONE / FAILED. |

---

*End of Document 04*
