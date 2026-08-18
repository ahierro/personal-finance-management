import 'server-only';

import type { MovementQueryUseCase } from '@/application/usecases/MovementQueryUseCase';
import { MovementFilter } from '@/domain/entity/MovementFilter';
import { PageRequest } from '@/domain/entity/PageRequest';
import {
  movementControllerAdvice,
  type MovementControllerAdvice,
} from '@/infrastructure/adapters/input/advice/MovementControllerAdvice';
import {
  firstParam,
  SearchParam,
  toPageNumber,
  toPageSize,
  type RawSearchParams,
} from '@/infrastructure/adapters/input/web/view/MovementSearchParams';
import type {
  FilterOptionsView,
  FiltersView,
  MovementPageResult,
} from '@/infrastructure/adapters/input/web/view/MovementView';
import { MovementViewMapper } from '@/infrastructure/adapters/input/web/view/MovementViewMapper';
import { ApplicationConfiguration } from '@/infrastructure/config/ApplicationConfiguration';
import type { Translator } from '@/infrastructure/i18n/Translator';

/**
 * Input adapter for the server render: it translates the URL into a domain request, runs
 * the use case, and hands back something React components can paint.
 */
export class MovementPageViewAdapter {
  constructor(
    private readonly movementQueryUseCase: MovementQueryUseCase,
    private readonly advice: MovementControllerAdvice,
  ) {}

  async load(rawSearchParams: RawSearchParams, translator: Translator): Promise<MovementPageResult> {
    const filters: FiltersView = {
      q: firstParam(rawSearchParams[SearchParam.q]),
      from: firstParam(rawSearchParams[SearchParam.from]),
      to: firstParam(rawSearchParams[SearchParam.to]),
      entity: firstParam(rawSearchParams[SearchParam.entity]),
      currency: firstParam(rawSearchParams[SearchParam.currency]),
    };
    const size = toPageSize(firstParam(rawSearchParams[SearchParam.size]));
    let options: FilterOptionsView = { entities: [], currencies: [] };

    try {
      const filter = MovementFilter.fromRaw({
        description: filters.q,
        from: filters.from,
        to: filters.to,
        bankEntityId: filters.entity,
        currency: filters.currency,
      });
      const page = toPageNumber(firstParam(rawSearchParams[SearchParam.page]));

      // The combos list every value in the collection, not only the ones surviving the
      // current filters: narrowing them as you pick would take away the option you just
      // used and leave no way back. The totals, on the contrary, answer for exactly what
      // the filters match. The three queries go out at once.
      const [movementPageResult, filterOptions, totals] = await Promise.all([
        this.movementQueryUseCase.getMovementsPage(filter, PageRequest.of(page, size)),
        this.movementQueryUseCase.getFilterOptions(),
        this.movementQueryUseCase.getTotalsByCurrency(filter),
      ]);
      options = { entities: filterOptions.bankEntityIds, currencies: filterOptions.currencies };

      let movementPage = movementPageResult;

      // Deleting the last record of the last page would leave an empty screen: in that
      // case the last page that does have content is fetched instead.
      if (movementPage.content.length === 0 && movementPage.totalPages > 0 && page >= movementPage.totalPages) {
        movementPage = await this.movementQueryUseCase.getMovementsPage(
          filter,
          PageRequest.of(movementPage.totalPages - 1, size),
        );
      }

      const mapper = new MovementViewMapper(translator);
      return {
        ok: true,
        filters,
        options,
        size,
        page: mapper.toPageView(movementPage),
        totals: mapper.toTotalsView(totals),
      };
    } catch (error) {
      return { ok: false, filters, options, size, error: this.advice.toErrorModel(error, translator) };
    }
  }
}

export const movementPageViewAdapter = new MovementPageViewAdapter(
  ApplicationConfiguration.movementQueryUseCase,
  movementControllerAdvice,
);
