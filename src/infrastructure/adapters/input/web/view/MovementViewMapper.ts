import 'server-only';

import type { Movement } from '@/domain/entity/Movement';
import type { MovementPage } from '@/domain/entity/MovementPage';
import type { MovementTotal } from '@/domain/entity/MovementTotal';
import type {
  CurrencyTotalView,
  MovementPageView,
  MovementView,
} from '@/infrastructure/adapters/input/web/view/MovementView';
import { formatDecimal, formatInteger, formatPattern, type Translator } from '@/infrastructure/i18n/Translator';

const pad = (value: number): string => String(value).padStart(2, '0');

/** Turns domain movements into rows, formatted for the language of the current request. */
export class MovementViewMapper {
  constructor(private readonly translator: Translator) {}

  toView(movement: Movement): MovementView {
    const dateTime = movement.dateTime;
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
      receiptId: movement.receiptId ?? '',
      bankEntityId: movement.bankEntityId,
    };
  }

  toTotalsView(totals: readonly MovementTotal[]): CurrencyTotalView[] {
    const group = this.translator.t('format.number.group');
    return totals.map((total) => ({
      currency: total.currency,
      amountDisplay: formatDecimal(total.amount, group, this.translator.t('format.number.decimal')),
      countDisplay: formatInteger(total.count, group),
      negative: total.amount.startsWith('-'),
    }));
  }

  toPageView(movementPage: MovementPage): MovementPageView {
    const movements = movementPage.content.map((movement) => this.toView(movement));
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
