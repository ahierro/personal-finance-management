/**
 * Business failure around bank movements.
 *
 * The domain carries a message *key*, never a sentence: which language the user reads
 * is decided at the edge, by the input adapter, not by the business rules.
 */
export class MovementException extends Error {
  readonly messageKey: string;
  readonly params: readonly string[];

  constructor(messageKey: string, params: readonly string[] = []) {
    super(params.length === 0 ? messageKey : `${messageKey} [${params.join(', ')}]`);
    this.name = 'MovementException';
    this.messageKey = messageKey;
    this.params = params;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
