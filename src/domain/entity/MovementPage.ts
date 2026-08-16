import type { Movement } from '@/domain/entity/Movement';

/** Slice of movements returned by the repository, with the total needed to paginate. */
export interface MovementPage {
  readonly content: readonly Movement[];
  /** Total number of pages available for the applied filter. */
  readonly totalPages: number;
  /** Total number of movements matching the filter. */
  readonly totalElements: number;
  /** Number of the returned page, starting at 0. */
  readonly number: number;
  /** Requested page size. */
  readonly size: number;
}

export const MovementPage = {
  of(content: readonly Movement[], totalElements: number, page: number, size: number): MovementPage {
    return {
      content,
      totalPages: size > 0 ? Math.ceil(totalElements / size) : 0,
      totalElements,
      number: page,
      size,
    };
  },
};
