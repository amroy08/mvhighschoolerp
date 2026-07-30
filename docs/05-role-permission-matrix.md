# 05 – Role-Permission Matrix
## Marwari Vidyalaya School ERP

> **Status:** Phase 0 – Architecture  
> **Date:** 2026-07-30  
> **Version:** 1.0

---

## 1. Roles

| # | Role | Scope | Description |
|---|------|-------|-------------|
| 1 | Platform Super Admin | All organisations | Complete system access. Only assignable by other Super Admins. |
| 2 | School Admin | Assigned school | Complete access within their school. |
| 3 | Branch Admin | Assigned branch | Access limited to their branch. |
| 4 | Accounts Administrator | Assigned branch | Fee structures, collections, adjustments, refunds, reports. |
| 5 | Cashier | Assigned branch | Collect offline fees, print receipts, view own collection records. |
| 6 | Admission Operator | Assigned branch | Create and update admissions. No financial transaction access. |
| 7 | Pre-Primary Operator | Pre-Primary grades only | Student management for Pre-Primary division only. |
| 8 | Primary Operator | Primary grades only | Student management for Primary division only. |
| 9 | Secondary Operator | Secondary grades only | Student management for Secondary division only. |
| 10 | Auditor | Assigned school | Read-only financial records, reports, and audit logs. |
| 11 | Principal / Management | Assigned school | Read-only analytics dashboard and summary reports. |
| 12 | Parent | Own children only | View dues, payment history, download receipts for own children. |

---

## 2. Actions

| Action | Description |
|--------|-------------|
| `view` | Read the record |
| `create` | Create a new record |
| `update` | Modify an existing record |
| `approve` | Approve a pending request (concession, waiver, reversal) |
| `collect` | Post a fee payment |
| `print` | Print or download a receipt |
| `export` | Export data to Excel or PDF |
| `reverse` | Initiate a payment reversal |
| `refund` | Process a refund |
| `configure` | Modify master/configuration data |
| `manage-users` | Create, update, assign roles to users |

---

## 3. Permission Matrix

Key: ✅ = Allowed | ⚠️ = Partial or requires approval | ❌ = Not allowed

### 3.1 Authentication and User Management

| Resource / Action | Super Admin | School Admin | Branch Admin | Accounts Admin | Cashier | Admission Op | PP Op | Prim Op | Sec Op | Auditor | Principal | Parent |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Users – view | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Users – create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Users – update | ✅ | ✅ | ⚠️ own branch | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Users – manage-users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Roles – configure | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Audit Logs – view | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

### 3.2 School and Academic Masters

| Resource / Action | Super Admin | School Admin | Branch Admin | Accounts Admin | Cashier | Admission Op | PP Op | Prim Op | Sec Op | Auditor | Principal | Parent |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Organisation – configure | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| School – configure | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Branch – configure | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Academic Year – configure | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Department – configure | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Grade – configure | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Section – configure | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.3 Students

| Resource / Action | Super Admin | School Admin | Branch Admin | Accounts Admin | Cashier | Admission Op | PP Op | Prim Op | Sec Op | Auditor | Principal | Parent |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Students – view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ PP only | ⚠️ Prim only | ⚠️ Sec only | ✅ | ✅ | ⚠️ Own children |
| Students – create | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ⚠️ PP only | ⚠️ Prim only | ⚠️ Sec only | ❌ | ❌ | ❌ |
| Students – update | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ⚠️ PP only | ⚠️ Prim only | ⚠️ Sec only | ❌ | ❌ | ❌ |
| Student – view Aadhaar | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Student – export | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ⚠️ PP only | ⚠️ Prim only | ⚠️ Sec only | ✅ | ✅ | ❌ |
| Guardians – view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ PP students | ⚠️ Prim students | ⚠️ Sec students | ✅ | ✅ | ⚠️ Own |
| Guardians – create/update | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ⚠️ PP only | ⚠️ Prim only | ⚠️ Sec only | ❌ | ❌ | ❌ |

### 3.4 Admissions

| Resource / Action | Super Admin | School Admin | Branch Admin | Accounts Admin | Cashier | Admission Op | PP Op | Prim Op | Sec Op | Auditor | Principal | Parent |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Admissions – view | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ⚠️ PP | ⚠️ Prim | ⚠️ Sec | ✅ | ✅ | ❌ |
| Admissions – create | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ⚠️ PP | ⚠️ Prim | ⚠️ Sec | ❌ | ❌ | ❌ |
| Admissions – update | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ⚠️ PP | ⚠️ Prim | ⚠️ Sec | ❌ | ❌ | ❌ |
| Admissions – approve/enrol | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.5 Fee Structures and Masters

| Resource / Action | Super Admin | School Admin | Branch Admin | Accounts Admin | Cashier | Admission Op | PP Op | Prim Op | Sec Op | Auditor | Principal | Parent |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Fee Heads – configure | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Fee Structures – view | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Fee Structures – configure | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Fee Assignments – view | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ⚠️ Own children |
| Fee Assignments – create | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Concessions – view | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ⚠️ Own children |
| Concessions – create | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Concessions – approve | ✅ | ✅ | ❌ | ⚠️ Within limit | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 3.6 Fee Collection

| Resource / Action | Super Admin | School Admin | Branch Admin | Accounts Admin | Cashier | Admission Op | PP Op | Prim Op | Sec Op | Auditor | Principal | Parent |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Payments – view | ✅ | ✅ | ✅ | ✅ | ⚠️ Own session | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ⚠️ Own children |
| Payments – collect | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Payments – verify | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Payments – reverse | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Payments – delete | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Payments – backdated entry | ✅ | ✅ | ❌ | ⚠️ With approval | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Receipts – print | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ Own children |
| Receipts – void | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Refunds – initiate | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Refunds – approve | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cashier Closing – view | ✅ | ✅ | ✅ | ✅ | ⚠️ Own | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |

### 3.7 Reports and Analytics

| Resource / Action | Super Admin | School Admin | Branch Admin | Accounts Admin | Cashier | Admission Op | PP Op | Prim Op | Sec Op | Auditor | Principal | Parent |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Analytics Dashboard – view | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Reports – view all | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Reports – export | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Student Ledger – view | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ⚠️ Own children |
| Top Defaulters – drill down | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ⚠️ Summary only | ❌ |

### 3.8 Promotions and Imports

| Resource / Action | Super Admin | School Admin | Branch Admin | Accounts Admin | Cashier | Admission Op | PP Op | Prim Op | Sec Op | Auditor | Principal | Parent |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Promotion – view/preview | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Promotion – execute | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Imports – upload and execute | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Imports – view history | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Settings – configure | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Division-Based Access Control

Pre-Primary, Primary, and Secondary Operator roles are scoped to a Division and the Grades within it.

The scope is stored in `user_scopes`:

```
scope_type = 'DEPARTMENT'
scope_id   = <uuid of Pre-Primary department>
```

The backend checks:

1. Does the user have the `students:view` permission?
2. Does the user have a scope for the requested student's department?
3. If the user has no department scope, they have access to all departments in their branch.

---

## 5. Object-Level Access Rule

**Payments:** A Cashier can only view payments they personally collected (collected_by_id = current user). An Accounts Administrator can view all payments in their branch.

**Student Aadhaar:** Only Super Admin and School Admin roles with an explicit `students:view_sensitive` permission can see the decrypted Aadhaar number. All other roles see `XXXX-XXXX-XXXX` (masked).

**Parent Portal:** A Parent user can only access students where a `student_guardians` record exists linking their guardian_id to the student_id.

---

## 6. Backend Implementation

Every NestJS controller endpoint is decorated with:

```typescript
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermission('payments', 'collect')
@RequireScope('BRANCH')
```

The `PermissionGuard`:
1. Loads the user's roles.
2. Loads role permissions from a Redis-cached permission map.
3. Checks the required permission.
4. If the endpoint requires a scope, validates the requested resource falls within the user's scope.
5. Returns `403 Forbidden` with code `UNAUTHORISED_BRANCH_ACCESS` if the check fails.

**Critical rule:** The frontend may hide navigation items based on permissions, but the backend **always** enforces the same checks independently. Frontend-only permission enforcement is treated as a security defect.

---

*End of Document 05*
