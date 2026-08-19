# BankSphere API Documentation

All API endpoints are prefixed with `/api/v1` and require `Authorization: Bearer <FIREBASE_ID_TOKEN>`.

## Core Endpoints

### Authentication & Profile
- `POST /api/v1/auth/register`: Create user profile and link Firebase UID.
- `GET /api/v1/auth/me`: Fetch authenticated user profile and roles.

### Accounts & Financial Services
- `GET /api/v1/accounts`: List accounts for current user.
- `POST /api/v1/transfers`: Execute transaction-safe fund transfer between accounts.
  - Body: `{ sourceAccountId, destinationAccountId, amountMinorUnits, description, idempotencyKey }`
- `POST /api/v1/deposits`: Simulate deposit into specified account.
- `POST /api/v1/withdrawals`: Execute account withdrawal with balance validation.

### Fixed Deposits & Loans
- `POST /api/v1/fixed-deposits`: Open fixed deposit with compound interest calculation.
- `POST /api/v1/loans/apply`: Apply for personal/business loan with EMI schedule generation.
- `POST /api/v1/loans/repay`: Submit loan installment repayment.

### Statements & Compliance
- `GET /api/v1/statements?accountId=...&format=CSV`: Export account statement in CSV/JSON format.
- `POST /api/v1/kyc/submit`: Upload customer identity documents.

### Staff & Admin Control
- `GET /api/v1/admin/customers`: List customer profiles and account statuses.
- `POST /api/v1/admin/customers/:id/freeze`: Freeze customer account.
- `GET /api/v1/admin/audit-logs`: Query immutable administrative audit trail.
