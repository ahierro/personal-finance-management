/** Uniform error body for the input adapters. */
export interface ErrorModel {
  readonly httpCode: number;
  readonly httpMessage: string;
  readonly moreInformation: string;
  /** Field that caused the validation failure, when there is one. */
  readonly field?: string;
}

export const ErrorModel = {
  of(httpCode: number, httpMessage: string, moreInformation: string, field?: string | null): ErrorModel {
    return field ? { httpCode, httpMessage, moreInformation, field } : { httpCode, httpMessage, moreInformation };
  },
};
