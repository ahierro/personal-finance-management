'use client';

import { Fragment, type ReactNode } from 'react';

import { PAGE_SIZE_OPTIONS } from '@/domain/entity/PageRequest';
import { buildLedgerHref } from '@/infrastructure/adapters/input/web/view/MovementSearchParams';
import type { FiltersView, MovementPageView } from '@/infrastructure/adapters/input/web/view/MovementView';
import { formatInteger } from '@/infrastructure/i18n/Translator';
import { ChevronLeftIcon, ChevronRightIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import { useLedger } from '@/infrastructure/adapters/input/web/component/MovementLedgerProvider';
import { useTranslation } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Ledger.module.css';

/**
 * Fills a message template with React nodes instead of plain text, so the numbers inside
 * the range can be styled without cutting the sentence up in the code. Translators keep
 * a whole sentence to work with and are free to move the placeholders around.
 */
function interpolate(template: string, values: readonly ReactNode[]): ReactNode[] {
  return template.split(/(\{\d+\})/g).map((part, index) => {
    const placeholder = /^\{(\d+)\}$/.exec(part);
    return <Fragment key={index}>{placeholder ? values[Number(placeholder[1])] : part}</Fragment>;
  });
}

/** First, last, the current one with a neighbour on each side, and an ellipsis in between. */
function visiblePages(current: number, total: number): Array<number | 'gap'> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const pages: Array<number | 'gap'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) {
    pages.push('gap');
  }
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  if (end < total - 1) {
    pages.push('gap');
  }
  pages.push(total);
  return pages;
}

interface PaginationBarProps {
  readonly page: MovementPageView;
  readonly filters: FiltersView;
}

/**
 * All the pagination is resolved in MongoDB: each button changes the URL and the server
 * returns only the records belonging to that page.
 */
export function PaginationBar({ page, filters }: PaginationBarProps) {
  const { t } = useTranslation();
  const { navigate, navigating } = useLedger();
  const totalPages = Math.max(page.totalPages, 1);
  const group = t('format.number.group');

  const goTo = (target: number) => navigate(buildLedgerHref({ ...filters, page: target, size: page.size }));

  return (
    <div className={styles.footBar}>
      <div className={styles.barInner}>
        <span className={styles.footRange}>
          {page.totalElements === 0
            ? t('pagination.empty')
            : interpolate(
                t('pagination.range'),
                [page.firstRecord, page.lastRecord, page.totalElements].map((value, index) => (
                  <span key={index} className={`${styles.footRangeStrong} mono`}>
                    {formatInteger(value, group)}
                  </span>
                )),
              )}
        </span>

        <span className={styles.footSpacer} />

        <div className={styles.sizeField}>
          <label className={styles.sizeLabel} htmlFor="page-size-select">
            {t('pagination.page-size')}
          </label>
          <select
            id="page-size-select"
            className={`${styles.select} mono`}
            // The label is hidden on small screens, so the accessible name lives here.
            aria-label={t('pagination.page-size.label')}
            value={page.size}
            onChange={(event) =>
              navigate(buildLedgerHref({ ...filters, page: 1, size: Number(event.target.value) }), true)
            }
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <nav className={styles.pager} aria-label={t('pagination.label')}>
          <button
            type="button"
            className={styles.pageButton}
            aria-label={t('pagination.previous')}
            disabled={page.page <= 1 || navigating}
            onClick={() => goTo(page.page - 1)}
          >
            <ChevronLeftIcon />
          </button>

          {visiblePages(page.page, totalPages).map((entry, index) =>
            entry === 'gap' ? (
              <span key={`gap-${index}`} className={styles.pageGap}>
                ···
              </span>
            ) : (
              <button
                key={entry}
                type="button"
                className={
                  entry === page.page
                    ? `${styles.pageButton} ${styles.pageButtonActive} mono`
                    : `${styles.pageButton} mono`
                }
                aria-label={t('pagination.page', [entry])}
                aria-current={entry === page.page ? 'page' : undefined}
                disabled={navigating}
                onClick={() => goTo(entry)}
              >
                {entry}
              </button>
            ),
          )}

          <button
            type="button"
            className={styles.pageButton}
            aria-label={t('pagination.next')}
            disabled={page.page >= totalPages || navigating}
            onClick={() => goTo(page.page + 1)}
          >
            <ChevronRightIcon />
          </button>
        </nav>
      </div>
    </div>
  );
}
