/**
 * What the movements matching a filter add up to, in one currency.
 *
 * Amounts of different currencies are never added together: the application holds no
 * exchange rate, and inventing one would turn a fact into an estimate. Each currency gets
 * its own total, and the sum covers the whole filtered set rather than the page on screen.
 */
export interface MovementTotal {
  readonly currency: string;
  /** Exact sum as a decimal string, in the same shape as the amounts it comes from. */
  readonly amount: string;
  /** How many movements went into the sum. */
  readonly count: number;
}
