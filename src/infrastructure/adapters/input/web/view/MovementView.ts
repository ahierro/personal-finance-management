import type { ErrorModel } from '@/domain/entity/ErrorModel';

/**
 * A movement ready to paint: serializable types only, because it crosses the React
 * server-to-client boundary. Dates arrive already formatted so the HTML the server
 * produces and the HTML the browser hydrates always match.
 */
export interface MovementView {
  readonly id: string;
  /** Formatted with the current locale's date pattern. */
  readonly date: string;
  /** Formatted with the current locale's time pattern. */
  readonly time: string;
  /** `2026-08-14T09:41`, the shape a `<input type="datetime-local">` expects. */
  readonly dateTimeInput: string;
  readonly description: string;
  readonly currency: string;
  /** Exact value for re-editing, with a dot as the decimal mark: `-1234.56`. */
  readonly amount: string;
  /** Value formatted for reading: `-1.234,56`. */
  readonly amountDisplay: string;
  readonly negative: boolean;
  /** 0 to 1: this amount against the largest one of its currency on this page. */
  readonly magnitude: number;
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
 * `filters` and `size` travel on both branches: even when the query fails, the filter bar
 * has to stay on screen so whatever broke it can be corrected.
 */
export type MovementPageResult =
  | { readonly ok: true; readonly filters: FiltersView; readonly size: number; readonly page: MovementPageView }
  | { readonly ok: false; readonly filters: FiltersView; readonly size: number; readonly error: ErrorModel };
