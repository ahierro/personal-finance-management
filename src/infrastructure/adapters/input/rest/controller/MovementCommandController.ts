import 'server-only';
import { NextResponse, type NextRequest } from 'next/server';

import type { MovementCommandUseCase } from '@/application/usecases/MovementCommandUseCase';
import { MovementCreateCommand } from '@/domain/command/MovementCreateCommand';
import { MovementEditCommand } from '@/domain/command/MovementEditCommand';
import { MovementValidationException } from '@/domain/exception/MovementValidationException';
import {
  movementControllerAdvice,
  type MovementControllerAdvice,
} from '@/infrastructure/adapters/input/advice/MovementControllerAdvice';
import { ApplicationConfiguration } from '@/infrastructure/config/ApplicationConfiguration';
import { LocaleResolver } from '@/infrastructure/i18n/LocaleResolver';

async function readJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new MovementValidationException('error.body.not-json');
  }
}

/**
 * Writes on `/api/movements`.
 *
 * POST   /api/movements
 * PATCH  /api/movements/{id}   (missing fields are left untouched)
 * DELETE /api/movements/{id}
 */
export class MovementCommandController {
  constructor(
    private readonly movementCommandUseCase: MovementCommandUseCase,
    private readonly advice: MovementControllerAdvice,
  ) {}

  async create(request: NextRequest): Promise<NextResponse> {
    const { translator } = await LocaleResolver.load();
    try {
      const command = MovementCreateCommand.from(await readJsonBody(request));
      const movement = await this.movementCommandUseCase.createMovement(command);
      return NextResponse.json(movement, { status: 201 });
    } catch (error) {
      return this.advice.toResponse(error, translator);
    }
  }

  async update(request: NextRequest, id: string): Promise<NextResponse> {
    const { translator } = await LocaleResolver.load();
    try {
      const command = MovementEditCommand.from(await readJsonBody(request));
      const movement = await this.movementCommandUseCase.updateMovement(command, id);
      return NextResponse.json(movement);
    } catch (error) {
      return this.advice.toResponse(error, translator);
    }
  }

  async delete(id: string): Promise<NextResponse> {
    const { translator } = await LocaleResolver.load();
    try {
      await this.movementCommandUseCase.deleteMovement(id);
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return this.advice.toResponse(error, translator);
    }
  }
}

export const movementCommandController = new MovementCommandController(
  ApplicationConfiguration.movementCommandUseCase,
  movementControllerAdvice,
);
