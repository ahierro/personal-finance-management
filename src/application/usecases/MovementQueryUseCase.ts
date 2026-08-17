import type { Movement } from '@/domain/entity/Movement';
import type { MovementFilter } from '@/domain/entity/MovementFilter';
import type { MovementFilterOptions } from '@/domain/entity/MovementFilterOptions';
import type { MovementPage } from '@/domain/entity/MovementPage';
import type { PageRequest } from '@/domain/entity/PageRequest';

/** Read operations exposed by the application. */
export interface MovementQueryUseCase {
  getMovementById(id: string): Promise<Movement>;

  getMovementsPage(filter: MovementFilter, pageRequest: PageRequest): Promise<MovementPage>;

  /** The values the entity and currency filters can offer, taken from the movements. */
  getFilterOptions(): Promise<MovementFilterOptions>;
}
