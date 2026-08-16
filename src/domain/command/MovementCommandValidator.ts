import { MovementValidationException } from '@/domain/exception/MovementValidationException';

/** Field constraints, shared by the create and the edit command. */
export const MovementConstraints = {
  DESCRIPTION_MAX: 500,
  CURRENCY_MAX: 10,
  RECEIPT_ID_MAX: 100,
  BANK_ENTITY_ID_MAX: 100,
  /** Decimal with no thousands separator: up to 20 integer and 6 fraction digits, well inside Decimal128. */
  AMOUNT_PATTERN: /^-?\d{1,20}(?:\.\d{1,6})?$/,
} as const;

function asRecord(raw: unknown): Record<string, unknown> {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new MovementValidationException('error.body.not-object');
  }
  return raw as Record<string, unknown>;
}

/** Required text: trimmed, not empty, within the maximum length. */
function requiredText(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new MovementValidationException('error.field.required', field);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new MovementValidationException('error.field.too-long', field, [String(max)]);
  }
  return trimmed;
}

/** Optional text: `null` or empty clears the value. */
function optionalText(value: unknown, field: string, max: number): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new MovementValidationException('error.field.not-text', field);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length > max) {
    throw new MovementValidationException('error.field.too-long', field, [String(max)]);
  }
  return trimmed;
}

function dateTime(value: unknown): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new MovementValidationException('error.date-time.invalid', 'dateTime');
    }
    return value;
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new MovementValidationException('error.field.required', 'dateTime');
  }
  // `2026-08-16T14:30` (what a datetime-local input produces) is read in the server's
  // time zone; an ISO string carrying an offset or `Z` keeps the instant it brings.
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new MovementValidationException('error.date-time.invalid', 'dateTime');
  }
  return parsed;
}

function currency(value: unknown): string {
  const text = requiredText(value, 'currency', MovementConstraints.CURRENCY_MAX);
  if (/\s/.test(text)) {
    throw new MovementValidationException('error.currency.no-spaces', 'currency');
  }
  return text.toUpperCase();
}

/**
 * Normalises the amount to an exact decimal held as text. A comma or a dot is accepted
 * as the decimal mark, but a thousands separator is not: `1.234,56` is ambiguous and is
 * rejected instead of guessed.
 */
function amount(value: unknown): string {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new MovementValidationException('error.amount.invalid', 'amount');
    }
    return amount(value.toString());
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new MovementValidationException('error.field.required', 'amount');
  }
  const normalized = value.trim().replace(',', '.');
  if (!MovementConstraints.AMOUNT_PATTERN.test(normalized)) {
    throw new MovementValidationException('error.amount.invalid', 'amount');
  }
  return normalized;
}

export const MovementCommandValidator = {
  asRecord,
  requiredText,
  optionalText,
  dateTime,
  currency,
  amount,
};
