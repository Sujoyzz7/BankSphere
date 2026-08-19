import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique transaction number.
 * Format: TXN-{YYYYMMDD}-{random}
 */
export function generateTransactionNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = uuidv4().slice(0, 8).toUpperCase();
  return `TXN-${dateStr}-${random}`;
}

/**
 * Generate a unique account number.
 * Format: ACC-{branchCode}-{sequential}-{check}
 */
export function generateAccountNumber(branchCode: string = '001'): string {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const base = `${branchCode}${timestamp}${random}`;
  // Simple checksum
  const check = base
    .split('')
    .reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 10;
  return `${base}${check}`;
}

/**
 * Generate a unique customer number.
 * Format: CUST-{YYYYMMDD}-{random}
 */
export function generateCustomerNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CUST-${dateStr}-${random}`;
}

/**
 * Generate a unique employee number.
 * Format: EMP-{random}
 */
export function generateEmployeeNumber(): string {
  const random = Math.floor(10000 + Math.random() * 90000);
  return `EMP-${random}`;
}

/**
 * Generate a unique card number (masked).
 * Returns last 4 digits masked format: ****-****-****-1234
 */
export function generateMaskedCardNumber(): string {
  const last4 = Math.floor(1000 + Math.random() * 9000);
  return `****-****-****-${last4}`;
}

/**
 * Generate an idempotency key from request context.
 */
export function generateIdempotencyKey(): string {
  return uuidv4();
}

/**
 * Mask a string, keeping only last N characters visible.
 */
export function maskString(str: string, visibleChars: number = 4): string {
  if (str.length <= visibleChars) return str;
  const masked = '*'.repeat(str.length - visibleChars);
  return masked + str.slice(-visibleChars);
}

/**
 * Mask an email address.
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const maskedLocal =
    local.charAt(0) + '*'.repeat(Math.max(0, local.length - 2)) + local.charAt(local.length - 1);
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask a phone number.
 */
export function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

/**
 * Get a date range for common periods.
 */
export function getDateRange(period: 'today' | 'week' | 'month' | 'quarter' | 'year'): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(start.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(start.getFullYear() - 1);
      break;
  }

  return { start, end };
}

/**
 * Paginate an array.
 */
export function paginate<T>(items: T[], page: number = 1, limit: number = 20): { data: T[]; total: number; page: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);
  return { data, total, page, totalPages };
}

/**
 * Sanitize a string for safe display.
 */
export function sanitize(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
