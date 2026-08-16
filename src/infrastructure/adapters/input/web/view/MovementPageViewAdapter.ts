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
import type { FiltersView, MovementPageResult } from '@/infrastructure/adapters/input/web/view/MovementView';
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
    };
    const size = toPageSize(firstParam(rawSearchParams[SearchParam.size]));

    try {
      const filter = MovementFilter.fromRaw({
        description: filters.q,
        from: filters.from,
        to: filters.to,
      });
      const page = toPageNumber(firstParam(rawSearchParams[SearchParam.page]));

      let movementPage = await this.movementQueryUseCase.getMovementsPage(filter, PageRequest.of(page, size));

      // Deleting the last record of the last page would leave an empty screen: in that
      // case the last page that does have content is fetched instead.
      if (movementPage.content.length === 0 && movementPage.totalPages > 0 && page >= movementPage.totalPages) {
        movementPage = await this.movementQueryUseCase.getMovementsPage(
          filter,
          PageRequest.of(movementPage.totalPages - 1, size),
        );
      }

      return { ok: true, filters, size, page: new MovementViewMapper(translator).toPageView(movementPage) };
    } catch (error) {
      return { ok: false, filters, size, error: this.advice.toErrorModel(error, translator) };
    }
  }
}

export const movementPageViewAdapter = new MovementPageViewAdapter(
  ApplicationConfiguration.movementQueryUseCase,
  movementControllerAdvice,
);
