import type { MovementCreateCommand } from '@/domain/command/MovementCreateCommand';
import type { MovementEditCommand } from '@/domain/command/MovementEditCommand';
import type { Movement } from '@/domain/entity/Movement';

/** Write operations exposed by the application. */
export interface MovementCommandUseCase {
  createMovement(movementCreateCommand: MovementCreateCommand): Promise<Movement>;

  updateMovement(movementEditCommand: MovementEditCommand, id: string): Promise<Movement>;

  deleteMovement(id: string): Promise<void>;
}
