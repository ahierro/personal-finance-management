import type { Movement } from '@/domain/entity/Movement';

/** Persistence contract for the write operations. */
export interface MovementCommandOutputPort {
  create(movement: Movement): Promise<Movement>;

  update(movement: Movement): Promise<Movement>;

  deleteById(id: string): Promise<void>;
}
