import type { MovementCreateCommand } from '@/domain/command/MovementCreateCommand';
import type { MovementEditCommand } from '@/domain/command/MovementEditCommand';

/**
 * Bank movement: the core model of the application.
 *
 * `amount` travels as an exact decimal string across the whole domain. MongoDB stores it
 * in Decimal128 and JavaScript's floating point never touches the value, so an amount
 * like 12345678.91 does not lose cents on its way to the database and back.
 */
export interface Movement {
  /** `null` while the movement has not been persisted. */
  readonly id: string | null;
  readonly dateTime: Date;
  readonly description: string;
  readonly currency: string;
  readonly amount: string;
  readonly receiptId: string | null;
  readonly bankEntityId: string;
}

export const Movement = {
  /** Builds the movement to persist out of a create request. */
  requestToCreate(command: MovementCreateCommand): Movement {
    return {
      id: null,
      dateTime: command.dateTime,
      description: command.description,
      currency: command.currency,
      amount: command.amount,
      receiptId: command.receiptId,
      bankEntityId: command.bankEntityId,
    };
  },

  /** Lays the changes over the current movement; the id is never touched. */
  applyEdit(current: Movement, command: MovementEditCommand): Movement {
    return {
      id: current.id,
      dateTime: command.dateTime ?? current.dateTime,
      description: command.description ?? current.description,
      currency: command.currency ?? current.currency,
      amount: command.amount ?? current.amount,
      receiptId: command.receiptId !== undefined ? command.receiptId : current.receiptId,
      bankEntityId: command.bankEntityId ?? current.bankEntityId,
    };
  },
};
