import { MovementCommandValidator as validate, MovementConstraints } from '@/domain/command/MovementCommandValidator';

/**
 * Changes to apply to an existing movement.
 * Missing fields are left untouched; `receiptId: null` clears it.
 */
export interface MovementEditCommand {
  readonly dateTime?: Date;
  readonly description?: string;
  readonly currency?: string;
  readonly amount?: string;
  readonly receiptId?: string | null;
  readonly bankEntityId?: string;
}

export const MovementEditCommand = {
  /** Validates and normalises raw input, keeping track of which fields were sent. */
  from(raw: unknown): MovementEditCommand {
    const body = validate.asRecord(raw);
    const command: {
      dateTime?: Date;
      description?: string;
      currency?: string;
      amount?: string;
      receiptId?: string | null;
      bankEntityId?: string;
    } = {};

    if ('dateTime' in body) {
      command.dateTime = validate.dateTime(body.dateTime);
    }
    if ('description' in body) {
      command.description = validate.requiredText(body.description, 'description', MovementConstraints.DESCRIPTION_MAX);
    }
    if ('currency' in body) {
      command.currency = validate.currency(body.currency);
    }
    if ('amount' in body) {
      command.amount = validate.amount(body.amount);
    }
    if ('receiptId' in body) {
      command.receiptId = validate.optionalText(body.receiptId, 'receiptId', MovementConstraints.RECEIPT_ID_MAX);
    }
    if ('bankEntityId' in body) {
      command.bankEntityId = validate.requiredText(
        body.bankEntityId,
        'bankEntityId',
        MovementConstraints.BANK_ENTITY_ID_MAX,
      );
    }

    return command;
  },
};
