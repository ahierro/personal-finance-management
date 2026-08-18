import type { ErrorModel } from '@/domain/entity/ErrorModel';

/**
 * A movement ready to paint: serializable types only, because it crosses the React
 * server-to-client boundary. Dates arrive already formatted so the HTML the server
 * produces and the HTML the browser hydrates always match.
 */
export interface MovementView {
  readonly id: string;
  /** Formatted with the current locale's date pattern. The listing shows this alone. */
  readonly date: string;
  /** Formatted with the current locale's time pattern, for the form and the confirmations. */
  readonly time: string;
  /** `2026-08-14T09:41`, the date and the time the form edits. */
  readonly dateTimeInput: string;
  readonly description: string;
  readonly currency: string;
  /** Exact value for re-editing, with a dot as the decimal mark: `-1234.56`. */
  readonly amount: string;
  /** Value formatted for reading: `-1.234,56`. */
  readonly amountDisplay: string;
  readonly negative: boolean;
  readonly receiptId: string;
  readonly bankEntityId: string;
}

/** Filter state as it stands in the URL. */
export interface FiltersView {
  readonly q: string;
  /** `YYYY-MM-DD` or empty. */
  readonly from: string;
  /** `YYYY-MM-DD` or empty. */
  readonly to: string;
  /** Bank entity picked in the combo, or empty for all of them. */
  readonly entity: string;
  /** Currency picked in the combo, or empty for all of them. */
  readonly currency: string;
}

/**
 * A currency total ready to paint. It covers every movement the filters match, not the
 * page on screen, so walking the pages leaves the figure where it is.
 */
export interface CurrencyTotalView {
  readonly currency: string;
  /** Value formatted for reading: `-1.234,56`. */
  readonly amountDisplay: string;
  /** How many movements were added up, already grouped for reading. */
  readonly countDisplay: string;
  readonly negative: boolean;
}

/** What the two combos offer, read from the collection on every render. */
export interface FilterOptionsView {
  readonly entities: readonly string[];
  readonly currencies: readonly string[];
}

export interface MovementPageView {
  readonly movements: readonly MovementView[];
  readonly totalElements: number;
  readonly totalPages: number;
  /** Current page starting at 1, which is what shows in the URL and in the footer. */
  readonly page: number;
  readonly size: number;
  /** Position of the first and the last record on screen, starting at 1. */
  readonly firstRecord: number;
  readonly lastRecord: number;
}

/**
 * `filters`, `size` and `options` travel on both branches: even when the query fails, the
 * filter bar has to stay on screen so whatever broke it can be corrected. When the
 * failure is the database itself the combos come back empty, which is the truth — there
 * is nothing to offer.
 */
export type MovementPageResult =
  | {
      readonly ok: true;
      readonly filters: FiltersView;
      readonly options: FilterOptionsView;
      readonly size: number;
      readonly page: MovementPageView;
      /** One entry per currency present in the filtered set; empty when nothing matches. */
      readonly totals: readonly CurrencyTotalView[];
    }
  | {
      readonly ok: false;
      readonly filters: FiltersView;
      readonly options: FilterOptionsView;
      readonly size: number;
      readonly error: ErrorModel;
    };
