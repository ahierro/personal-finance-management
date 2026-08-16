import 'server-only';

import type { MovementQueryOutputPort } from '@/application/ports/output/MovementQueryOutputPort';
import type { Movement } from '@/domain/entity/Movement';
import type { MovementFilter } from '@/domain/entity/MovementFilter';
import { MovementPage } from '@/domain/entity/MovementPage';
import type { PageRequest } from '@/domain/entity/PageRequest';
import { MovementNotFoundException } from '@/domain/exception/MovementNotFoundException';
import type { MovementDboMapper } from '@/infrastructure/adapters/output/mapper/MovementDboMapper';
import type { MovementMongoRepository } from '@/infrastructure/adapters/output/repository/MovementMongoRepository';

/** Implements the read port against MongoDB. */
export class MovementQueryOutputAdapter implements MovementQueryOutputPort {
  constructor(
    private readonly movementMongoRepository: MovementMongoRepository,
    private readonly movementDboMapper: MovementDboMapper,
  ) {}

  async getById(id: string): Promise<Movement> {
    const objectId = this.movementMongoRepository.toObjectId(id);
    if (objectId === null) {
      throw new MovementNotFoundException(id);
    }
    const entity = await this.movementMongoRepository.findById(objectId);
    if (entity === null) {
      throw new MovementNotFoundException(id);
    }
    return this.movementDboMapper.toDomain(entity);
  }

  async getPage(filter: MovementFilter, pageRequest: PageRequest): Promise<MovementPage> {
    const dboFilter = this.movementDboMapper.toDboFilter(filter);
    const [entities, totalElements] = await Promise.all([
      this.movementMongoRepository.findPage(dboFilter, pageRequest),
      this.movementMongoRepository.count(dboFilter),
    ]);
    const movements = entities.map((entity) => this.movementDboMapper.toDomain(entity));
    return MovementPage.of(movements, totalElements, pageRequest.page, pageRequest.size);
  }
}
