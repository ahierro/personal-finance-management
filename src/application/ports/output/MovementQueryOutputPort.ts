import type { Movement } from '@/domain/entity/Movement';
import type { MovementFilter } from '@/domain/entity/MovementFilter';
import type { MovementPage } from '@/domain/entity/MovementPage';
import type { PageRequest } from '@/domain/entity/PageRequest';

/** Persistence contract for the read operations. */
export interface MovementQueryOutputPort {
  getById(id: string): Promise<Movement>;

  /** Filtering and slicing are resolved in the database, never in memory. */
  getPage(filter: MovementFilter, pageRequest: PageRequest): Promise<MovementPage>;
}
