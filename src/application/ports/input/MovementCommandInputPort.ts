import type { MovementCommandOutputPort } from '@/application/ports/output/MovementCommandOutputPort';
import type { MovementQueryOutputPort } from '@/application/ports/output/MovementQueryOutputPort';
import type { MovementCommandUseCase } from '@/application/usecases/MovementCommandUseCase';
import type { MovementCreateCommand } from '@/domain/command/MovementCreateCommand';
import type { MovementEditCommand } from '@/domain/command/MovementEditCommand';
import { Movement } from '@/domain/entity/Movement';

/** Drives the writes: reads the current state, applies the domain, persists the result. */
export class MovementCommandInputPort implements MovementCommandUseCase {
  constructor(
    private readonly commandOutputPort: MovementCommandOutputPort,
    private readonly queryOutputPort: MovementQueryOutputPort,
  ) {}

  async createMovement(movementCreateCommand: MovementCreateCommand): Promise<Movement> {
    return this.commandOutputPort.create(Movement.requestToCreate(movementCreateCommand));
  }

  async updateMovement(movementEditCommand: MovementEditCommand, id: string): Promise<Movement> {
    const currentMovement = await this.queryOutputPort.getById(id);
    const movementToUpdate = Movement.applyEdit(currentMovement, movementEditCommand);
    return this.commandOutputPort.update(movementToUpdate);
  }

  async deleteMovement(id: string): Promise<void> {
    const currentMovement = await this.queryOutputPort.getById(id);
    await this.commandOutputPort.deleteById(currentMovement.id as string);
  }
}
