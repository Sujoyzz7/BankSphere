# BankSphere System Architecture

```text
                    ┌─────────────────────┐
                    │      Next.js        │
                    │ Customer + Admin UI │
                    └──────────┬──────────┘
                               │
                               │ HTTPS / API
                               ▼
                    ┌─────────────────────┐
                    │   Node.js Backend   │
                    │ Express + TypeScript│
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐   ┌────────────┐  ┌────────────┐
       │  MongoDB   │   │  Firebase  │  │   External │
       │  Database  │   │ Auth/Store │  │  Services  │
       └────────────┘   └────────────┘  └────────────┘
```

## Core Technology Stack

- **Frontend**: Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Lucide Icons, TanStack Query.
- **Backend**: Node.js, Express.js, TypeScript, Mongoose, Pino logger, Zod validation, Helmet security.
- **Database**: MongoDB Atlas with multi-document ACID transactional protection (`session.withTransaction`).
- **Authentication**: Firebase Authentication with Admin SDK token verification (`verifyIdToken`).
- **File Storage**: Firebase Cloud Storage for KYC documents and statement artifacts.

## Financial Security Architecture

1. **Integer Minor Units**: All monetary values are processed as integers in minor units (e.g. 100.50 BDT = 10050 minor units) to avoid floating-point rounding errors.
2. **Double-Entry Ledger**: Every transaction writes immutable debit and credit ledger entries (`LedgerEntry`) satisfying `totalDebit == totalCredit`.
3. **Idempotency**: Money-moving requests enforce unique `idempotencyKey` values at the database layer.
4. **Concurrency Control**: Account updates occur within MongoDB session transactions preventing race conditions and negative balances.
