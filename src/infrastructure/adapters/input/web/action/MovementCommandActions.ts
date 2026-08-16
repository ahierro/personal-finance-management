'use server';

import { revalidatePath } from 'next/cache';

import { MovementCreateCommand } from '@/domain/command/MovementCreateCommand';
import { MovementEditCommand } from '@/domain/command/MovementEditCommand';
import { movementControllerAdvice } from '@/infrastructure/adapters/input/advice/MovementControllerAdvice';
import type {
  MovementActionResult,
  MovementFormInput,
} from '@/infrastructure/adapters/input/web/view/MovementFormInput';
import { ApplicationConfiguration } from '@/infrastructure/config/ApplicationConfiguration';
import { LocaleResolver } from '@/infrastructure/i18n/LocaleResolver';

/**
 * Input adapter for the interface: server actions are the counterpart of the REST
 * controllers, but React calls them directly without going through fetch. They return
 * the error instead of throwing it, so the form can show it next to the guilty field.
 */

export async function createMovement(input: MovementFormInput): Promise<MovementActionResult> {
  const { translator } = await LocaleResolver.load();
  try {
    const command = MovementCreateCommand.from(input);
    await ApplicationConfiguration.movementCommandUseCase.createMovement(command);
    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: movementControllerAdvice.toErrorModel(error, translator) };
  }
}

export async function editMovement(id: string, input: MovementFormInput): Promise<MovementActionResult> {
  const { translator } = await LocaleResolver.load();
  try {
    const command = MovementEditCommand.from(input);
    await ApplicationConfiguration.movementCommandUseCase.updateMovement(command, id);
    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: movementControllerAdvice.toErrorModel(error, translator) };
  }
}

export async function deleteMovement(id: string): Promise<MovementActionResult> {
  const { translator } = await LocaleResolver.load();
  try {
    await ApplicationConfiguration.movementCommandUseCase.deleteMovement(id);
    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: movementControllerAdvice.toErrorModel(error, translator) };
  }
}
