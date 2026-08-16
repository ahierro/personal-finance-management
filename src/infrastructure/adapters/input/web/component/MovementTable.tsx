import type { MovementView } from '@/infrastructure/adapters/input/web/view/MovementView';
import type { Translator } from '@/infrastructure/i18n/Translator';
import { MovementRowActions } from '@/infrastructure/adapters/input/web/component/MovementRowActions';
import styles from '@/infrastructure/adapters/input/web/component/Ledger.module.css';

/** Floor width so even the smallest amount leaves a readable mark. */
const MINIMUM_BAR_WIDTH = 1.5;
/** The staggered draw is cut short before it turns into a wait. */
const MAXIMUM_DELAY_MS = 260;

/**
 * The table is built entirely on the server: it arrives as HTML, with nothing for the
 * browser to fetch or sort. Only the two buttons on each row are interactive.
 */
export function MovementTable({
  movements,
  translator,
}: {
  readonly movements: readonly MovementView[];
  readonly translator: Translator;
}) {
  const { t } = translator;

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th scope="col" className={`${styles.headCell} ${styles.colDate}`}>
            {t('table.column.date')}
          </th>
          <th scope="col" className={styles.headCell}>
            {t('table.column.description')}
          </th>
          <th scope="col" className={`${styles.headCell} ${styles.colReceipt}`}>
            {t('table.column.receipt')}
          </th>
          <th scope="col" className={`${styles.headCell} ${styles.colEntity}`}>
            {t('table.column.entity')}
          </th>
          <th
            scope="col"
            className={`${styles.headCell} ${styles.headCellRight} ${styles.colAmount}`}
            title={t('table.amount.bar-hint')}
          >
            {t('table.column.amount')}
          </th>
          <th scope="col" className={`${styles.headCell} ${styles.colActions}`}>
            <span className="visually-hidden">{t('table.column.actions')}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {movements.map((movement, index) => (
          <tr key={movement.id} className={styles.row}>
            <td className={`${styles.cell} ${styles.cellDate} mono`}>
              {movement.date}
              <span className={styles.cellTime}>{movement.time}</span>
            </td>
            <td className={`${styles.cell} ${styles.cellDescription}`} title={movement.description}>
              {movement.description}
            </td>
            <td className={`${styles.cell} mono`}>
              {movement.receiptId === '' ? (
                <span className={styles.cellEmpty}>{t('table.empty-value')}</span>
              ) : (
                movement.receiptId
              )}
            </td>
            <td className={`${styles.cell} mono`} title={movement.bankEntityId}>
              {movement.bankEntityId}
            </td>
            <td className={styles.cellAmount}>
              <span
                aria-hidden="true"
                className={`${styles.amountBar} ${
                  movement.negative ? styles.amountBarDebit : styles.amountBarCredit
                }`}
                style={
                  {
                    '--bar-width': `${Math.max(movement.magnitude * 100, MINIMUM_BAR_WIDTH)}%`,
                    animationDelay: `${Math.min(index * 6, MAXIMUM_DELAY_MS)}ms`,
                  } as React.CSSProperties
                }
              />
              <span
                className={`${styles.amountValue} ${
                  movement.negative ? styles.amountDebit : styles.amountCredit
                } mono`}
              >
                {movement.amountDisplay}
              </span>
              <span className={`${styles.amountCurrency} mono`}>{movement.currency}</span>
            </td>
            <td className={styles.cellActions}>
              <MovementRowActions movement={movement} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
