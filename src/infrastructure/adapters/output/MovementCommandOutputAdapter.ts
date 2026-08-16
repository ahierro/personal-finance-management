import 'server-only';

import type { MovementCommandOutputPort } from '@/application/ports/output/MovementCommandOutputPort';
import type { Movement } from '@/domain/entity/Movement';
import { MovementNotFoundException } from '@/domain/exception/MovementNotFoundException';
import type { MovementDboMapper } from '@/infrastructure/adapters/output/mapper/MovementDboMapper';
import type { MovementMongoRepository } from '@/infrastructure/adapters/output/repository/MovementMongoRepository';

/** Implements the write port against MongoDB. */
export class MovementCommandOutputAdapter implements MovementCommandOutputPort {
  constructor(
    private readonly movementMongoRepository: MovementMongoRepository,
    private readonly movementDboMapper: MovementDboMapper,
  ) {}

  async create(movement: Movement): Promise<Movement> {
    const document = this.movementDboMapper.toDbo(movement);
    const insertedId = await this.movementMongoRepository.insert(document);
    return { ...movement, id: insertedId.toHexString() };
  }

  async update(movement: Movement): Promise<Movement> {
    const id = movement.id;
    if (id === null) {
      throw new MovementNotFoundException('(no id)');
    }
    const objectId = this.movementMongoRepository.toObjectId(id);
    if (objectId === null) {
      throw new MovementNotFoundException(id);
    }
    const document = this.movementDboMapper.toDbo(movement);
    const replaced = await this.movementMongoRepository.replace(objectId, document);
    if (!replaced) {
      throw new MovementNotFoundException(id);
    }
    return movement;
  }

  async deleteById(id: string): Promise<void> {
    const objectId = this.movementMongoRepository.toObjectId(id);
    if (objectId === null) {
      throw new MovementNotFoundException(id);
    }
    const deleted = await this.movementMongoRepository.deleteById(objectId);
    if (!deleted) {
      throw new MovementNotFoundException(id);
    }
  }
}
