import { MovementException } from '@/domain/exception/MovementException';

/** The requested movement does not exist in the repository. */
export class MovementNotFoundException extends MovementException {
  readonly id: string;

  constructor(id: string) {
    super('error.movement.not-found', [id]);
    this.name = 'MovementNotFoundException';
    this.id = id;
  }
}
