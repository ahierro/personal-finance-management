import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/domain/entity/PageRequest';

/**
 * Names of the listing's URL parameters. The URL is the state of the screen: filters,
 * page and size live there, so reloading, sharing the link or hitting the back button
 * all show the same thing.
 */
export const SearchParam = {
  q: 'q',
  from: 'from',
  to: 'to',
  entity: 'entity',
  currency: 'currency',
  page: 'page',
  size: 'size',
} as const;

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** A parameter repeated in the URL arrives as an array; the first value wins. */
export function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

/** The page in the URL starts at 1; the domain counts from 0. */
export function toPageNumber(raw: string): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 1 ? parsed - 1 : 0;
}

/** Only the sizes the picker offers are accepted; anything else falls back to the default. */
export function toPageSize(raw: string): number {
  const parsed = Number(raw);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}

export interface LedgerHrefState {
  readonly q: string;
  readonly from: string;
  readonly to: string;
  readonly entity: string;
  readonly currency: string;
  readonly page: number;
  readonly size: number;
}

/** Builds the listing link, leaving out whatever is already the default, to keep the URL clean. */
export function buildLedgerHref(state: LedgerHrefState): string {
  const params = new URLSearchParams();
  if (state.q !== '') {
    params.set(SearchParam.q, state.q);
  }
  if (state.from !== '') {
    params.set(SearchParam.from, state.from);
  }
  if (state.to !== '') {
    params.set(SearchParam.to, state.to);
  }
  if (state.entity !== '') {
    params.set(SearchParam.entity, state.entity);
  }
  if (state.currency !== '') {
    params.set(SearchParam.currency, state.currency);
  }
  if (state.page > 1) {
    params.set(SearchParam.page, String(state.page));
  }
  if (state.size !== DEFAULT_PAGE_SIZE) {
    params.set(SearchParam.size, String(state.size));
  }
  const query = params.toString();
  return query === '' ? '/' : `/?${query}`;
}
