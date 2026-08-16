import 'server-only';

import { MovementCommandInputPort } from '@/application/ports/input/MovementCommandInputPort';
import { MovementQueryInputPort } from '@/application/ports/input/MovementQueryInputPort';
import type { MovementCommandOutputPort } from '@/application/ports/output/MovementCommandOutputPort';
import type { MovementQueryOutputPort } from '@/application/ports/output/MovementQueryOutputPort';
import type { MovementCommandUseCase } from '@/application/usecases/MovementCommandUseCase';
import type { MovementQueryUseCase } from '@/application/usecases/MovementQueryUseCase';
import { MovementCommandOutputAdapter } from '@/infrastructure/adapters/output/MovementCommandOutputAdapter';
import { MovementQueryOutputAdapter } from '@/infrastructure/adapters/output/MovementQueryOutputAdapter';
import { MovementDboMapper } from '@/infrastructure/adapters/output/mapper/MovementDboMapper';
import { MovementMongoRepository } from '@/infrastructure/adapters/output/repository/MovementMongoRepository';

/**
 * Composition root: the only place where a concrete technology is chosen.
 *
 * Swap the output adapters here and neither the domain nor the use cases notice; it is
 * the counterpart of the Spring container in the reference project.
 */
const movementMongoRepository = new MovementMongoRepository();
const movementDboMapper = new MovementDboMapper();

const movementQueryOutputPort: MovementQueryOutputPort = new MovementQueryOutputAdapter(
  movementMongoRepository,
  movementDboMapper,
);
const movementCommandOutputPort: MovementCommandOutputPort = new MovementCommandOutputAdapter(
  movementMongoRepository,
  movementDboMapper,
);

const movementQueryUseCase: MovementQueryUseCase = new MovementQueryInputPort(movementQueryOutputPort);
const movementCommandUseCase: MovementCommandUseCase = new MovementCommandInputPort(
  movementCommandOutputPort,
  movementQueryOutputPort,
);

export const ApplicationConfiguration = {
  movementQueryUseCase,
  movementCommandUseCase,
};
