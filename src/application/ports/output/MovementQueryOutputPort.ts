import type { Movement } from '@/domain/entity/Movement';
import type { MovementFilter } from '@/domain/entity/MovementFilter';
import type { MovementFilterOptions } from '@/domain/entity/MovementFilterOptions';
import type { MovementPage } from '@/domain/entity/MovementPage';
import type { MovementTotal } from '@/domain/entity/MovementTotal';
import type { PageRequest } from '@/domain/entity/PageRequest';

/** Persistence contract for the read operations. */
export interface MovementQueryOutputPort {
  getById(id: string): Promise<Movement>;

  /** Filtering and slicing are resolved in the database, never in memory. */
  getPage(filter: MovementFilter, pageRequest: PageRequest): Promise<MovementPage>;

  /** One total per currency over everything the filter matches, sorted by currency. */
  getTotalsByCurrency(filter: MovementFilter): Promise<readonly MovementTotal[]>;

  /** The distinct entities and currencies present in the collection, sorted. */
  getFilterOptions(): Promise<MovementFilterOptions>;
}
