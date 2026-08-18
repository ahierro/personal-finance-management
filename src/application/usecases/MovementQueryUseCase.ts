import type { Movement } from '@/domain/entity/Movement';
import type { MovementFilter } from '@/domain/entity/MovementFilter';
import type { MovementFilterOptions } from '@/domain/entity/MovementFilterOptions';
import type { MovementPage } from '@/domain/entity/MovementPage';
import type { MovementTotal } from '@/domain/entity/MovementTotal';
import type { PageRequest } from '@/domain/entity/PageRequest';

/** Read operations exposed by the application. */
export interface MovementQueryUseCase {
  getMovementById(id: string): Promise<Movement>;

  getMovementsPage(filter: MovementFilter, pageRequest: PageRequest): Promise<MovementPage>;

  /**
   * What the filtered movements add up to, one line per currency. It answers for the whole
   * filtered set, so it does not change as the pages are walked.
   */
  getTotalsByCurrency(filter: MovementFilter): Promise<readonly MovementTotal[]>;

  /** The values the entity and currency filters can offer, taken from the movements. */
  getFilterOptions(): Promise<MovementFilterOptions>;
}
