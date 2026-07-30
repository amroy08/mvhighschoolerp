# 08 – Security and Data Protection
## Marwari Vidyalaya School ERP

> **Status:** Phase 0 – Architecture  
> **Date:** 2026-07-30  
> **Baseline:** OWASP ASVS Level 2

---

## 1. Authentication Security

### 1.1 Password Requirements
- Minimum 12 characters.
- Must contain at least one uppercase, one lowercase, one digit, one special character.
- Hashed using **Argon2id** with parameters: memory 64 MB, iterations 3, parallelism 4.
- Bcrypt is NOT used (used in legacy system — upgrade all migrated passwords on first login).
- Passwords are never logged, never stored in plain text, never appear in audit logs.

### 1.2 Token Strategy
- **Access Token:** Short-lived JWT (15 minutes), stored in memory on the client.
- **Session Cookie:** HTTP-only, Secure, SameSite=Strict cookie containing the refresh token.
- **Refresh Token:** 7-day expiry. Stored hashed in database. Rotation on every use.
- **Revocation:** Refresh token is invalidated on logout and on password change.
- **Family invalidation:** If a refresh token is reused (replay attack), the entire token family for that user is invalidated.

### 1.3 Login Protection
- 5 consecutive failed login attempts → account locked for 30 minutes.
- After 10 total failures → account locked until admin reset.
- All lock events are logged in audit_logs.
- Rate limiting: maximum 10 login attempts per IP per minute.
- CAPTCHA integration point available (not activated in MVP).

### 1.4 MFA
- TOTP (Time-based One-Time Password) using authenticator apps (Google Authenticator, Authy).
- Mandatory for Platform Super Admin in production.
- Optional for all other roles.
- Backup codes: 8 codes generated at MFA setup, each usable once.
- TOTP secret encrypted at rest using AES-256-GCM.

---

## 2. Authorisation Security

### 2.1 Backend Enforcement
- Every API endpoint has an explicit `@RequirePermission(resource, action)` decorator.
- Endpoints without explicit permission decoration fail the build.
- The `PermissionGuard` validates the permission on every request — no caching of user requests beyond the token validity window.

### 2.2 Object-Level Access
- Student records: validated that the student belongs to the user's school and branch.
- Payment records: validated that the payment belongs to the user's school.
- Parent portal: validated that the guardian_id is linked to the requested student_id.
- Every query includes a `schoolId` and `branchId` filter where applicable.

### 2.3 IDOR Prevention
- UUIDs used for all primary keys (v4, not sequential integers).
- Every fetch is validated for school/branch ownership before returning data.
- Bulk endpoints (Excel export, report) validate each record in the result set belongs to the authorised scope.

---

## 3. Sensitive Data Protection

### 3.1 Aadhaar Number
- Stored encrypted using AES-256-GCM.
- Column: `aadhaar_encrypted TEXT` — stores the ciphertext.
- Column: `aadhaar_last4 VARCHAR(4)` — stores only the last 4 digits for display (never encrypted, always masked as XXXX-XXXX-7890).
- The encryption key is stored in an environment variable (`AADHAAR_ENCRYPTION_KEY`), never in the database.
- Key rotation procedure is documented in the operations runbook.
- Aadhaar values never appear in:
  - Application logs.
  - Audit log `before_values` or `after_values` fields.
  - Excel exports (only the last 4 digits if the user has permission).
  - Fee receipts.
  - Notification messages.
- Decryption is only performed in the server-side `StudentService.getAadhaarDecrypted()` method, which is called only by endpoints with `students:view_sensitive` permission.

### 3.2 Personal Data Masking
- Student mobile and email: masked as `98765XXXXX` and `r***@gmail.com` in list views.
- Full values shown only in detail view for users with `students:view` permission.
- Parent email: masked in analytics and report summaries.
- In API logs, request bodies are sanitised to remove: `password`, `aadhaarNumber`, `aadhaarEncrypted`, `totpSecret`.

### 3.3 Payment Secrets
- Razorpay keys (future): stored in environment variables, never in database.
- UPI reference numbers and bank account numbers in payment remarks: not logged at DEBUG level.

---

## 4. Input Validation and Output Encoding

### 4.1 Input Validation
- All API request bodies are validated via NestJS `class-validator` DTOs.
- Zod schemas (shared between frontend and backend) validate all form inputs before submission.
- SQL injection: prevented by Prisma parameterised queries (no raw SQL with user input except in approved reporting queries with explicit escaping).
- File uploads:
  - Allowed MIME types: `image/jpeg`, `image/png`, `application/pdf`.
  - Maximum size: 5 MB per file.
  - File name sanitised (no path traversal characters).
  - Files uploaded to S3 with a generated key (not using original file name).
  - MIME type validated server-side using `file-type` library (not just the Content-Type header).

### 4.2 Output Encoding
- All API responses use `class-transformer` with `@Expose()` — only explicitly exposed fields are returned.
- No field contains raw HTML from user input.
- Template rendering (receipts, emails) uses a template engine with auto-escaping.

---

## 5. Transport Security

- All production traffic served over HTTPS.
- HSTS header set with max-age of 1 year, including subdomains.
- TLS 1.2 minimum; TLS 1.3 preferred.
- No mixed content in any page.
- Development: HTTP acceptable. Production: HTTPS enforced by Nginx.

---

## 6. Security Headers (via Helmet)

| Header | Value |
|--------|-------|
| Content-Security-Policy | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; frame-ancestors 'none'` |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` |
| X-Frame-Options | `DENY` |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` |

---

## 7. File Upload Security

1. Extension whitelist enforced: `.jpg`, `.jpeg`, `.png`, `.pdf`.
2. MIME type verified server-side using `file-type`.
3. File stored in S3 with a UUID-based key, not the original filename.
4. No direct public URL — all file downloads go through a signed URL endpoint that checks the user's permission.
5. Maximum file size: 5 MB (configurable in settings).
6. Malware scanning: integration point available (ClamAV or S3 event + Lambda in production).

---

## 8. CSRF Protection

- SameSite=Strict cookie prevents CSRF for session-based requests.
- REST API additionally validates the `Origin` header against the allowed origin list.
- The `X-Requested-With: XMLHttpRequest` header is validated on state-changing endpoints.

---

## 9. Rate Limiting

| Endpoint | Limit |
|----------|-------|
| POST /api/v1/auth/login | 10 per minute per IP |
| POST /api/v1/auth/refresh | 30 per minute per user |
| POST /api/v1/payments | 60 per minute per user |
| GET /api/v1/* | 300 per minute per user |
| POST /api/v1/imports/* | 5 per hour per user |

Redis-backed rate limiting via `nestjs-throttler`.

---

## 10. Audit Logging

### 10.1 Audit Events Logged

| Module | Events |
|--------|--------|
| Auth | Login, logout, failed login, password change, MFA enable/disable, account lock |
| Users | Create, update, role change, deactivate |
| Students | Create, update, status change, Aadhaar access |
| Fee Structures | Create, update, delete (soft), assign to student |
| Payments | Create, verify, post, reverse, bounced |
| Receipts | Print, void, reprint |
| Concessions | Create, approve, reject |
| Promotions | Batch create, execute, rollback |
| Imports | Upload, validate, execute, rollback |
| Settings | Any configuration change |

### 10.2 Audit Log Fields

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "user_email": "user@school.edu.in",
  "role_name": "accounts_administrator",
  "school_id": "uuid",
  "branch_id": "uuid",
  "action": "PAYMENT_POSTED",
  "module": "payments",
  "record_id": "uuid",
  "before_values": {},
  "after_values": {},
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "reason": "Fee collected at counter",
  "approval_reference": null,
  "created_at": "2026-07-30T09:15:00+05:30"
}
```

### 10.3 Audit Log Protection
- `audit_logs` table: the application database role has INSERT permission only. No UPDATE, DELETE.
- Audit logs are retained for a minimum of 7 years (configurable).
- Audit logs cannot be accessed by any role except Auditor, Accounts Admin (own actions), and Super Admin.

---

## 11. Data Retention and Privacy

| Data Type | Retention Period | Notes |
|-----------|-----------------|-------|
| Student records | 7 years after leaving | Soft delete; hard delete on legal request |
| Payment and receipt records | 10 years | Never deleted; status changes only |
| Audit logs | 7 years | Immutable |
| Login logs | 90 days | Auto-purged by scheduled job |
| Import history | 3 years | Retained for traceability |
| Session tokens | 7 days (refresh token expiry) | Auto-expired |
| Notification logs | 1 year | Auto-purged |

### Data Access Requests
A parent or guardian may request:
1. A copy of all personal data held for their child (Subject Access Request).
2. Correction of inaccurate data.
3. Deletion of personal data (subject to legal retention requirements).

These requests are handled via the Support module and audited.

---

## 12. Secrets Management

| Secret | Storage |
|--------|---------|
| Database credentials | `.env` file, not in Git |
| JWT secret (access + refresh) | `.env` file |
| Aadhaar encryption key | `.env` file |
| S3 credentials | `.env` file |
| SMTP credentials | `.env` file |
| TOTP encryption key | `.env` file |
| Redis password | `.env` file |

**Git policy:** `.env` is listed in `.gitignore`. The repository contains only `.env.example` with placeholder values. A pre-commit hook (using `detect-secrets`) prevents accidental secret commits.

**Production:** Environment variables are injected via Docker Compose secrets or a secret manager (AWS Secrets Manager / HashiCorp Vault) in production.

---

## 13. Backup and Recovery

### Backup Schedule
| Database | Frequency | Retention |
|----------|-----------|-----------|
| PostgreSQL | Daily full backup, WAL archiving | 30 days |
| S3 documents | Versioned (30-day version history) | 365 days |

### Recovery Procedure
1. Restore PostgreSQL from the latest backup.
2. Apply WAL segments up to the point of failure.
3. Verify database checksum.
4. Run smoke test suite.
5. Verify receipt sequence numbers are intact.
6. Audit log of restore is created manually.

### Backup Verification
- Weekly automated restore to a test environment.
- Alert fired if the backup job fails.
- Backup health dashboard visible to Super Admin.

---

## 14. Dependency Scanning

- `npm audit` run in CI on every pull request.
- Critical vulnerabilities block the build.
- High vulnerabilities raise a warning.
- Dependabot or Renovate configured for automated dependency updates.

---

*End of Document 08*
