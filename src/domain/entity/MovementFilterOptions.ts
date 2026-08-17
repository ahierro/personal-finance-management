/**
 * The values the listing can actually be filtered by, read from the movements themselves.
 *
 * Nothing here is a fixed catalogue: a bank entity or a currency exists as an option
 * because some movement carries it, so the combos can never offer a value that would
 * return an empty page. Both lists come sorted alphabetically.
 */
export interface MovementFilterOptions {
  readonly bankEntityIds: readonly string[];
  readonly currencies: readonly string[];
}

export const MovementFilterOptions = {
  empty(): MovementFilterOptions {
    return { bankEntityIds: [], currencies: [] };
  },
};
