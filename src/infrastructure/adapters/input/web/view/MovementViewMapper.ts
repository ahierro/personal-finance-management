import 'server-only';

import type { Movement } from '@/domain/entity/Movement';
import type { MovementPage } from '@/domain/entity/MovementPage';
import type { MovementPageView, MovementView } from '@/infrastructure/adapters/input/web/view/MovementView';
import { formatDecimal, formatPattern, type Translator } from '@/infrastructure/i18n/Translator';

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * Largest absolute amount per currency within the page. The magnitude bar compares pesos
 * with pesos and dollars with dollars; mixing them would read as a lie.
 */
function maximumsByCurrency(movements: readonly Movement[]): Map<string, number> {
  const maximums = new Map<string, number>();
  for (const movement of movements) {
    const absolute = Math.abs(Number(movement.amount));
    if (!Number.isFinite(absolute)) {
      continue;
    }
    if (absolute > (maximums.get(movement.currency) ?? 0)) {
      maximums.set(movement.currency, absolute);
    }
  }
  return maximums;
}

/** Turns domain movements into rows, formatted for the language of the current request. */
export class MovementViewMapper {
  constructor(private readonly translator: Translator) {}

  toView(movement: Movement, maximumForItsCurrency: number): MovementView {
    const dateTime = movement.dateTime;
    const absolute = Math.abs(Number(movement.amount));
    const inputValue =
      `${dateTime.getFullYear()}-${pad(dateTime.getMonth() + 1)}-${pad(dateTime.getDate())}` +
      `T${pad(dateTime.getHours())}:${pad(dateTime.getMinutes())}`;

    return {
      id: movement.id ?? '',
      date: formatPattern(this.translator.t('format.date.pattern'), dateTime),
      time: formatPattern(this.translator.t('format.time.pattern'), dateTime),
      dateTimeInput: inputValue,
      description: movement.description,
      currency: movement.currency,
      amount: movement.amount,
      amountDisplay: formatDecimal(
        movement.amount,
        this.translator.t('format.number.group'),
        this.translator.t('format.number.decimal'),
      ),
      negative: movement.amount.startsWith('-'),
      magnitude: maximumForItsCurrency > 0 && Number.isFinite(absolute) ? absolute / maximumForItsCurrency : 0,
      receiptId: movement.receiptId ?? '',
      bankEntityId: movement.bankEntityId,
    };
  }

  toPageView(movementPage: MovementPage): MovementPageView {
    const maximums = maximumsByCurrency(movementPage.content);
    const movements = movementPage.content.map((movement) =>
      this.toView(movement, maximums.get(movement.currency) ?? 0),
    );
    const firstRecord = movementPage.totalElements === 0 ? 0 : movementPage.number * movementPage.size + 1;

    return {
      movements,
      totalElements: movementPage.totalElements,
      totalPages: movementPage.totalPages,
      page: movementPage.number + 1,
      size: movementPage.size,
      firstRecord,
      lastRecord: firstRecord === 0 ? 0 : firstRecord + movements.length - 1,
    };
  }
}
