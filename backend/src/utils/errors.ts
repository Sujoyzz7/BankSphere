export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  ACCOUNT_FROZEN = 'ACCOUNT_FROZEN',
  ACCOUNT_CLOSED = 'ACCOUNT_CLOSED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
  INVALID_BENEFICIARY = 'INVALID_BENEFICIARY',
  DUPLICATE_REQUEST = 'DUPLICATE_REQUEST',
  TRANSACTION_CONFLICT = 'TRANSACTION_CONFLICT',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  MFA_REQUIRED = 'MFA_REQUIRED',
  KYC_REQUIRED = 'KYC_REQUIRED',
  LOAN_NOT_ELIGIBLE = 'LOAN_NOT_ELIGIBLE',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, ErrorCode.FORBIDDEN);
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;
  constructor(message: string = 'Validation failed', errors: Record<string, string[]> = {}) {
    super(message, 400, ErrorCode.VALIDATION_ERROR);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, ErrorCode.NOT_FOUND);
  }
}

export class AccountNotFoundError extends NotFoundError {
  constructor(message: string = 'Account not found') {
    super(message);
    Object.setPrototypeOf(this, AccountNotFoundError.prototype);
  }
}

export class InsufficientBalanceError extends AppError {
  constructor(message: string = 'Insufficient balance') {
    super(message, 400, ErrorCode.INSUFFICIENT_BALANCE);
  }
}

export class DuplicateRequestError extends AppError {
  constructor(message: string = 'Duplicate request detected') {
    super(message, 409, ErrorCode.DUPLICATE_REQUEST);
  }
}

export class TransactionConflictError extends AppError {
  constructor(message: string = 'Transaction conflict - please try again') {
    super(message, 409, ErrorCode.TRANSACTION_CONFLICT);
  }
}

export class AccountFrozenError extends AppError {
  constructor(message: string = 'Account is frozen') {
    super(message, 400, ErrorCode.ACCOUNT_FROZEN);
  }
}

export class AccountClosedError extends AppError {
  constructor(message: string = 'Account is closed') {
    super(message, 400, ErrorCode.ACCOUNT_CLOSED);
  }
}

export class LimitExceededError extends AppError {
  constructor(message: string = 'Transaction limit exceeded') {
    super(message, 400, ErrorCode.LIMIT_EXCEEDED);
  }
}

export class KycRequiredError extends AppError {
  constructor(message: string = 'KYC verification required') {
    super(message, 400, ErrorCode.KYC_REQUIRED);
  }
}

export class MaintenanceModeError extends AppError {
  constructor(message: string = 'System is under maintenance') {
    super(message, 503, ErrorCode.MAINTENANCE_MODE);
  }
}
