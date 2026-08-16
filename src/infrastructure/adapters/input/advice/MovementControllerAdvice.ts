import 'server-only';
import { NextResponse } from 'next/server';

import { ErrorModel } from '@/domain/entity/ErrorModel';
import { MovementException } from '@/domain/exception/MovementException';
import { MovementNotFoundException } from '@/domain/exception/MovementNotFoundException';
import { MovementValidationException } from '@/domain/exception/MovementValidationException';
import type { Translator } from '@/infrastructure/i18n/Translator';

/**
 * Turns domain failures into responses for the outside world, in the reader's language.
 * Used by the REST controllers and by the server actions behind the interface.
 *
 * The domain throws message keys; the sentence is composed here. When the failure points
 * at a field, that field's label is passed as `{0}` and the exception's own values follow.
 */
export class MovementControllerAdvice {
  private describe(exception: MovementException, field: string | null, translator: Translator): string {
    const params = field === null ? exception.params : [translator.t(`field.label.${field}`), ...exception.params];
    return translator.t(exception.messageKey, params);
  }

  toErrorModel(error: unknown, translator: Translator): ErrorModel {
    if (error instanceof MovementNotFoundException) {
      return ErrorModel.of(404, translator.t('error.title.not-found'), this.describe(error, null, translator));
    }
    if (error instanceof MovementValidationException) {
      return ErrorModel.of(
        400,
        translator.t('error.title.validation'),
        this.describe(error, error.field, translator),
        error.field,
      );
    }
    if (error instanceof MovementException) {
      return ErrorModel.of(400, translator.t('error.title.bad-request'), this.describe(error, null, translator));
    }

    // Anything that is not a business failure is logged in full and answered generically.
    console.error('[movements] unexpected error', error);
    const detail = error instanceof Error ? error.message : translator.t('error.unknown');
    return ErrorModel.of(500, translator.t('error.title.internal'), detail);
  }

  toResponse(error: unknown, translator: Translator): NextResponse<ErrorModel> {
    const errorModel = this.toErrorModel(error, translator);
    return NextResponse.json(errorModel, { status: errorModel.httpCode });
  }
}

export const movementControllerAdvice = new MovementControllerAdvice();
