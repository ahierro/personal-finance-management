import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';

import type { MovementQueryUseCase } from '@/application/usecases/MovementQueryUseCase';
import { MovementFilter } from '@/domain/entity/MovementFilter';
import { PageRequest } from '@/domain/entity/PageRequest';
import {
  movementControllerAdvice,
  type MovementControllerAdvice,
} from '@/infrastructure/adapters/input/advice/MovementControllerAdvice';
import { ApplicationConfiguration } from '@/infrastructure/config/ApplicationConfiguration';
import { LocaleResolver } from '@/infrastructure/i18n/LocaleResolver';

/**
 * Reads on `/api/movements`.
 *
 * GET /api/movements?description=&from=&to=&page=&size=
 * GET /api/movements/{id}
 */
export class MovementQueryController {
  constructor(
    private readonly movementQueryUseCase: MovementQueryUseCase,
    private readonly advice: MovementControllerAdvice,
  ) {}

  async getMovementsPage(request: NextRequest): Promise<NextResponse> {
    const { translator } = await LocaleResolver.load();
    try {
      const params = request.nextUrl.searchParams;
      const filter = MovementFilter.fromRaw({
        description: params.get('description'),
        from: params.get('from'),
        to: params.get('to'),
      });
      const pageRequest = PageRequest.fromRaw(params.get('page'), params.get('size'));
      const movementPage = await this.movementQueryUseCase.getMovementsPage(filter, pageRequest);
      return NextResponse.json(movementPage);
    } catch (error) {
      return this.advice.toResponse(error, translator);
    }
  }

  async getMovementById(id: string): Promise<NextResponse> {
    const { translator } = await LocaleResolver.load();
    try {
      const movement = await this.movementQueryUseCase.getMovementById(id);
      return NextResponse.json(movement);
    } catch (error) {
      return this.advice.toResponse(error, translator);
    }
  }
}

export const movementQueryController = new MovementQueryController(
  ApplicationConfiguration.movementQueryUseCase,
  movementControllerAdvice,
);
