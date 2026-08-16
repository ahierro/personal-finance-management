import type { ErrorModel } from '@/domain/entity/ErrorModel';

/** What the browser form sends: plain text, no domain types. */
export interface MovementFormInput {
  /** `2026-08-14T09:41`, straight out of the date and time input. */
  readonly dateTime: string;
  readonly description: string;
  readonly currency: string;
  readonly amount: string;
  readonly receiptId: string;
  readonly bankEntityId: string;
}

/** Result of a server action, ready to show the error next to the field that failed. */
export type MovementActionResult = { readonly ok: true } | { readonly ok: false; readonly error: ErrorModel };
