import { MovementException } from '@/domain/exception/MovementException';

/** The incoming data breaks a domain rule. */
export class MovementValidationException extends MovementException {
  /** Field that caused the failure, or `null` when the rule spans several. */
  readonly field: string | null;

  constructor(messageKey: string, field: string | null = null, params: readonly string[] = []) {
    super(messageKey, params);
    this.name = 'MovementValidationException';
    this.field = field;
  }
}
