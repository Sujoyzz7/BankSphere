# BankSphere - Full-Stack Banking Management Platform

BankSphere is a digital banking platform built with Node.js, Express, TypeScript, MongoDB Atlas, Next.js 14, and Firebase Authentication.

## Key Features

### Customer Portal
- **Dashboard**: Total balance, recent transactions, spending charts, and quick actions.
- **Accounts**: Savings, Current, and Fixed Deposit account management.
- **Transfers & Beneficiaries**: Instant transfers with double-entry ledger verification and idempotency protection.
- **Fixed Deposits**: FD calculator, automated compound interest computation, and maturity payouts.
- **Loan Portfolio**: Loan EMI calculator, application workflow, and schedule repayment tracking.
- **Card Management**: Mock credit and debit card controls (limits, freeze/unfreeze).
- **Security Center**: Password updates, 2FA settings, and recent session monitoring.
- **KYC Verification**: Identity document upload (NID/Passport) and status tracking.
- **Account Statements**: On-demand CSV and official PDF statement export.
- **Support System**: Customer ticketing system and real-time support messaging.

### Staff & Admin Portal
- **Executive Dashboard**: System reserves, transaction metrics, and automated risk engine flags.
- **Customer Directory**: Customer profiles, KYC verification status, and freeze/unfreeze controls.
- **Account Directory**: System-wide account balances and status operations.
- **Transactions & Risk Engine**: Transaction history monitoring and risk scoring.
- **KYC Compliance**: Identity document verification and approval workflow.
- **Loan Portfolio & Approvals**: Loan review, credit approval, and disbursement triggers.
- **Immutable Audit Logs**: Comprehensive security and administrative operation tracking.

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, TanStack Query.
- **Backend**: Node.js, Express, TypeScript, Mongoose, Pino Logger, Zod.
- **Database**: MongoDB Atlas with multi-document ACID transactions.
- **Authentication**: Firebase Authentication & Firebase Admin SDK.
- **File Storage**: Firebase Cloud Storage.

## Quick Start & Installation

```bash
# 1. Install workspace dependencies
npm install

# 2. Build backend and frontend
npm run build

# 3. Run unit and integration test suite
npm test
```

## Running Development Environment

```bash
# Start backend (Port 5000)
cd backend && npm run dev

# Start frontend (Port 3000)
cd frontend && npm run dev
```

## Security & Integrity Architecture

1. **Integer Minor Units**: All monetary values are handled in minor units (e.g. ৳100.50 = 10050 minor units).
2. **Double-Entry Ledger**: Every money movement creates immutable debit and credit entries.
3. **Idempotency Protection**: Enforced via unique `idempotencyKey` indexes at the database level.
4. **Server-Side Verification**: Authentication and financial mutations are strictly enforced by the Express backend.
