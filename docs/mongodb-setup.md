# MongoDB Setup Guide for BankSphere

## 1. MongoDB Atlas Cluster
1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Replica Set Cluster (M10+ for production or M0 Shared for development/testing). Replica sets are mandatory to support multi-document ACID transactions.

## 2. Network Access & Database Users
1. Under **Security > Network Access**, add your server IP or `0.0.0.0/0` (for cloud development).
2. Under **Security > Database Access**, create a user with `readWriteAnyDatabase` privileges.

## 3. Database Indexes
BankSphere automatically ensures schema compound indexes on startup:
- `customers`: `firebaseUid`, `customerNumber`
- `accounts`: `accountNumber`, `customerId`
- `transactions`: `transactionNumber`, `idempotencyKey` (unique), `sourceAccountId`, `destinationAccountId`
- `ledgerEntries`: `transactionId`, `accountId`
- `auditLogs`: `actorUserId`, `createdAt`
