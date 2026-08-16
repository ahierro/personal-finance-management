import { MovementValidationException } from '@/domain/exception/MovementValidationException';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Search criteria for the listing.
 *
 * `from` and `to` arrive as dates without a time (`YYYY-MM-DD`) and are turned here into
 * the first and the last instant of that day in the server's time zone, so a movement
 * recorded at 23:50 on the `to` date still falls inside the range.
 */
export interface MovementFilter {
  /** Substring to look for in the description, ignoring case. */
  readonly description: string | null;
  readonly from: Date | null;
  readonly to: Date | null;
}

function parseDate(value: string, field: string, endOfDay: boolean): Date {
  const match = DATE_PATTERN.exec(value.trim());
  if (!match) {
    throw new MovementValidationException('error.date.format', field);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
  const isRealDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!isRealDate) {
    throw new MovementValidationException('error.date.not-real', field);
  }
  return date;
}

function nonEmpty(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export const MovementFilter = {
  empty(): MovementFilter {
    return { description: null, from: null, to: null };
  },

  /** Builds the filter from raw query-string values. All of them are optional. */
  fromRaw(raw: { description?: string | null; from?: string | null; to?: string | null }): MovementFilter {
    const rawFrom = nonEmpty(raw.from);
    const rawTo = nonEmpty(raw.to);
    const from = rawFrom === null ? null : parseDate(rawFrom, 'from', false);
    const to = rawTo === null ? null : parseDate(rawTo, 'to', true);

    if (from !== null && to !== null && from.getTime() > to.getTime()) {
      throw new MovementValidationException('error.date-range.inverted', 'from');
    }

    return { description: nonEmpty(raw.description), from, to };
  },
};
