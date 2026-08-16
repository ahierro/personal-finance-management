import { MovementCommandValidator as validate, MovementConstraints } from '@/domain/command/MovementCommandValidator';

/** Data needed to register a new bank movement. */
export interface MovementCreateCommand {
  readonly dateTime: Date;
  readonly description: string;
  readonly currency: string;
  /** Exact decimal held as text; stored as Decimal128. */
  readonly amount: string;
  readonly receiptId: string | null;
  readonly bankEntityId: string;
}

export const MovementCreateCommand = {
  /** Validates and normalises raw input (a JSON body or a form) against the domain rules. */
  from(raw: unknown): MovementCreateCommand {
    const body = validate.asRecord(raw);
    return {
      dateTime: validate.dateTime(body.dateTime),
      description: validate.requiredText(body.description, 'description', MovementConstraints.DESCRIPTION_MAX),
      currency: validate.currency(body.currency),
      amount: validate.amount(body.amount),
      receiptId: validate.optionalText(body.receiptId, 'receiptId', MovementConstraints.RECEIPT_ID_MAX),
      bankEntityId: validate.requiredText(body.bankEntityId, 'bankEntityId', MovementConstraints.BANK_ENTITY_ID_MAX),
    };
  },
};
