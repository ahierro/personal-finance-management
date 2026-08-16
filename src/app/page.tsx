import { movementPageViewAdapter } from '@/infrastructure/adapters/input/web/view/MovementPageViewAdapter';
import type { RawSearchParams } from '@/infrastructure/adapters/input/web/view/MovementSearchParams';
import { LocaleResolver } from '@/infrastructure/i18n/LocaleResolver';
import {
  LedgerEmpty,
  LedgerError,
  LedgerNoResults,
} from '@/infrastructure/adapters/input/web/component/LedgerPlaceholder';
import { LanguagePicker } from '@/infrastructure/adapters/input/web/component/LanguagePicker';
import { MovementFilters } from '@/infrastructure/adapters/input/web/component/MovementFilters';
import { MovementLedgerProvider } from '@/infrastructure/adapters/input/web/component/MovementLedgerProvider';
import { MovementTable } from '@/infrastructure/adapters/input/web/component/MovementTable';
import { NewMovementButton } from '@/infrastructure/adapters/input/web/component/NewMovementButton';
import { PaginationBar } from '@/infrastructure/adapters/input/web/component/PaginationBar';
import { TranslationProvider } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Ledger.module.css';

// Every visit queries MongoDB with the filters from the URL: nothing is cached.
export const dynamic = 'force-dynamic';

export default async function LedgerPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const { locale, messages, translator } = await LocaleResolver.load();
  const result = await movementPageViewAdapter.load(await searchParams, translator);
  const hasFilters = result.filters.q !== '' || result.filters.from !== '' || result.filters.to !== '';

  return (
    <TranslationProvider locale={locale} messages={messages}>
      <MovementLedgerProvider>
        <div className={styles.shell}>
          <header className={styles.masthead}>
            <div className={styles.wordmark}>
              <span className={styles.wordmarkTick} aria-hidden="true" />
              <h1 className={styles.wordmarkTitle}>{translator.t('app.name')}</h1>
              <span className={styles.wordmarkSub}>{translator.t('app.tagline')}</span>
            </div>
            <span className={styles.mastheadSpacer} />
            <LanguagePicker />
            <NewMovementButton />
          </header>

          <MovementFilters
            filters={result.filters}
            size={result.size}
            totalElements={result.ok ? result.page.totalElements : null}
          />

          <div className={styles.tableScroll}>
            {!result.ok ? (
              <LedgerError error={result.error} translator={translator} />
            ) : result.page.movements.length > 0 ? (
              <MovementTable movements={result.page.movements} translator={translator} />
            ) : hasFilters ? (
              <LedgerNoResults translator={translator} />
            ) : (
              <LedgerEmpty translator={translator} />
            )}
          </div>

          {result.ok && <PaginationBar page={result.page} filters={result.filters} />}
        </div>
      </MovementLedgerProvider>
    </TranslationProvider>
  );
}
