'use client';

import { useEffect, useState } from 'react';

import { buildLedgerHref } from '@/infrastructure/adapters/input/web/view/MovementSearchParams';
import type { FilterOptionsView, FiltersView } from '@/infrastructure/adapters/input/web/view/MovementView';
import { formatInteger } from '@/infrastructure/i18n/Translator';
import { ColumnPicker } from '@/infrastructure/adapters/input/web/component/ColumnPicker';
import { DateField } from '@/infrastructure/adapters/input/web/component/DateField';
import { FilterSelect } from '@/infrastructure/adapters/input/web/component/FilterSelect';
import { CloseIcon, SearchIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import { useLedger } from '@/infrastructure/adapters/input/web/component/MovementLedgerProvider';
import { useTranslation } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Ledger.module.css';

/** Grace period after the last keystroke before asking the server for a new page. */
const DEBOUNCE_MS = 320;

interface MovementFiltersProps {
  readonly filters: FiltersView;
  readonly options: FilterOptionsView;
  readonly size: number;
  readonly totalElements: number | null;
}

export function MovementFilters({ filters, options, size, totalElements }: MovementFiltersProps) {
  const { t } = useTranslation();
  const { navigate, navigating } = useLedger();
  const [text, setText] = useState(filters.q);

  // Any filter change sends the listing back to page one: staying on page 7 of a result
  // that now has 2 pages would show an empty screen.
  function apply(changes: Partial<FiltersView>) {
    navigate(buildLedgerHref({ ...filters, ...changes, page: 1, size }), true);
  }

  useEffect(() => {
    if (text === filters.q) {
      return;
    }
    const timer = setTimeout(() => {
      navigate(buildLedgerHref({ ...filters, q: text, page: 1, size }), true);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // `filters` only changes once the server has returned the page with the text applied.
  }, [text, filters, size, navigate]);

  // When the navigation comes from elsewhere (back button, clear filters), the input follows the URL.
  useEffect(() => {
    setText(filters.q);
  }, [filters.q]);

  const hasFilters =
    filters.q !== '' ||
    filters.from !== '' ||
    filters.to !== '' ||
    filters.entity !== '' ||
    filters.currency !== '';

  function countLabel(total: number): string {
    const suffix = hasFilters ? '.filtered' : '';
    return t(`filters.count.${total === 1 ? 'one' : 'many'}${suffix}`, [
      formatInteger(total, t('format.number.group')),
    ]);
  }

  return (
    <div className={styles.filterBar}>
      {/* Outside the centred row on purpose: the loading thread runs the full width. */}
      {navigating && (
        <div className={styles.progress}>
          <div className={styles.progressBeam} />
        </div>
      )}

      <div className={styles.barInner}>
        <div className={styles.search}>
          <span className={styles.searchIcon}>
            <SearchIcon />
          </span>
          <input
            type="search"
            className={styles.searchInput}
            value={text}
            placeholder={t('filters.search.placeholder')}
            aria-label={t('filters.search.label')}
            onChange={(event) => setText(event.target.value)}
          />
          {text !== '' && (
            <button
              type="button"
              className={styles.searchClear}
              aria-label={t('filters.search.clear')}
              onClick={() => setText('')}
            >
              <CloseIcon size={12} />
            </button>
          )}
        </div>

        <span className={styles.filterDivider} />

        <span className={styles.filterLabel}>{t('filters.from')}</span>
        <DateField label={t('filters.date-from.label')} value={filters.from} onChange={(value) => apply({ from: value })} />

        <span className={styles.filterLabel}>{t('filters.to')}</span>
        <DateField label={t('filters.date-to.label')} value={filters.to} onChange={(value) => apply({ to: value })} />

        <span className={styles.filterDivider} />

        <FilterSelect
          label={t('filters.entity.label')}
          allLabel={t('filters.entity.all')}
          value={filters.entity}
          values={options.entities}
          onChange={(value) => apply({ entity: value })}
        />

        <FilterSelect
          label={t('filters.currency.label')}
          allLabel={t('filters.currency.all')}
          value={filters.currency}
          values={options.currencies}
          onChange={(value) => apply({ currency: value })}
        />

        {hasFilters && (
          <button
            type="button"
            className={styles.ghostButton}
            onClick={() =>
              navigate(buildLedgerHref({ q: '', from: '', to: '', entity: '', currency: '', page: 1, size }), true)
            }
          >
            {t('action.clear-filters')}
          </button>
        )}

        {/* Count and column picker travel together: on a narrow bar they wrap onto the
            next line as one right-aligned group instead of the button dropping away on
            its own. */}
        <div className={styles.filterTrail}>
          {totalElements !== null && <span className={styles.filterCount}>{countLabel(totalElements)}</span>}
          <ColumnPicker />
        </div>
      </div>
    </div>
  );
}
