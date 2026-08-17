import type { MovementQueryOutputPort } from '@/application/ports/output/MovementQueryOutputPort';
import type { MovementQueryUseCase } from '@/application/usecases/MovementQueryUseCase';
import type { Movement } from '@/domain/entity/Movement';
import type { MovementFilter } from '@/domain/entity/MovementFilter';
import type { MovementFilterOptions } from '@/domain/entity/MovementFilterOptions';
import type { MovementPage } from '@/domain/entity/MovementPage';
import type { PageRequest } from '@/domain/entity/PageRequest';

/** Drives the reads by delegating to the persistence port. */
export class MovementQueryInputPort implements MovementQueryUseCase {
  constructor(private readonly queryOutputPort: MovementQueryOutputPort) {}

  async getMovementById(id: string): Promise<Movement> {
    return this.queryOutputPort.getById(id);
  }

  async getMovementsPage(filter: MovementFilter, pageRequest: PageRequest): Promise<MovementPage> {
    return this.queryOutputPort.getPage(filter, pageRequest);
  }

  async getFilterOptions(): Promise<MovementFilterOptions> {
    return this.queryOutputPort.getFilterOptions();
  }
}
