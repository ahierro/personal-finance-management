import type { ErrorModel } from '@/domain/entity/ErrorModel';
import type { Translator } from '@/infrastructure/i18n/Translator';
import { NewMovementButton } from '@/infrastructure/adapters/input/web/component/NewMovementButton';
import styles from '@/infrastructure/adapters/input/web/component/Ledger.module.css';

/** Not a single movement has been recorded yet. */
export function LedgerEmpty({ translator }: { readonly translator: Translator }) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.placeholderMark} />
      <h2 className={styles.placeholderTitle}>{translator.t('state.empty.title')}</h2>
      <p className={styles.placeholderText}>{translator.t('state.empty.text')}</p>
      <div className={styles.placeholderActions}>
        <NewMovementButton />
      </div>
    </div>
  );
}

/** There is data, but none of it fits the current filter. */
export function LedgerNoResults({ translator }: { readonly translator: Translator }) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.placeholderMark} />
      <h2 className={styles.placeholderTitle}>{translator.t('state.no-results.title')}</h2>
      <p className={styles.placeholderText}>{translator.t('state.no-results.text')}</p>
    </div>
  );
}

/**
 * The query failed. When the problem is the connection, showing the environment variable
 * saves the trip to the server console.
 */
export function LedgerError({
  error,
  translator,
}: {
  readonly error: ErrorModel;
  readonly translator: Translator;
}) {
  const isConnectionProblem = error.httpCode >= 500;

  return (
    <div className={styles.placeholder}>
      <span className={styles.placeholderMark} />
      <h2 className={styles.placeholderTitle}>
        {isConnectionProblem ? translator.t('state.error.connection.title') : error.httpMessage}
      </h2>
      <p className={styles.placeholderText}>
        {isConnectionProblem ? translator.t('state.error.connection.text') : error.moreInformation}
      </p>
      {isConnectionProblem && <code className={`${styles.placeholderCode} mono`}>{error.moreInformation}</code>}
    </div>
  );
}
