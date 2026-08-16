import { MovementValidationException } from '@/domain/exception/MovementValidationException';

/** Page sizes the application offers. */
export const PAGE_SIZE_OPTIONS = [5, 25, 50, 100, 200] as const;
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

/** Slice of results asked of the repository. `page` starts at 0. */
export interface PageRequest {
  readonly page: number;
  readonly size: number;
}

export const PageRequest = {
  of(page: number, size: number): PageRequest {
    if (!Number.isInteger(page) || page < 0) {
      throw new MovementValidationException('error.page.invalid', 'page');
    }
    if (!Number.isInteger(size) || size < 1 || size > MAX_PAGE_SIZE) {
      throw new MovementValidationException('error.size.invalid', 'size', [String(MAX_PAGE_SIZE)]);
    }
    return { page, size };
  },

  /** Turns raw query-string values into a page request, applying the defaults. */
  fromRaw(page: string | null | undefined, size: string | null | undefined): PageRequest {
    const parsedPage = page === null || page === undefined || page === '' ? 0 : Number(page);
    const parsedSize = size === null || size === undefined || size === '' ? DEFAULT_PAGE_SIZE : Number(size);
    return PageRequest.of(parsedPage, parsedSize);
  },
};
