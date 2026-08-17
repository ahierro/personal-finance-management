import type { MovementView } from '@/infrastructure/adapters/input/web/view/MovementView';
import type { Translator } from '@/infrastructure/i18n/Translator';
import type { LedgerColumnId } from '@/infrastructure/adapters/input/web/view/LedgerColumns';
import { ColumnResizeHandle } from '@/infrastructure/adapters/input/web/component/ColumnResizeHandle';
import { MovementRowActions } from '@/infrastructure/adapters/input/web/component/MovementRowActions';
import styles from '@/infrastructure/adapters/input/web/component/Ledger.module.css';

/** Where each column takes its width from. The rules themselves read the custom property. */
const WIDTH_CLASS: Record<LedgerColumnId, string | undefined> = {
  date: styles.colDate,
  description: styles.colDescription,
  receipt: styles.colReceipt,
  entity: styles.colEntity,
  amount: styles.colAmount,
};

/**
 * Header cell. `data-column` is what the stylesheet keys on to hide the whole column, and
 * the grip on the right edge is the only interactive part of the header.
 */
function HeadCell({
  column,
  label,
  className = '',
  title,
}: {
  readonly column: LedgerColumnId;
  readonly label: React.ReactNode;
  readonly className?: string;
  readonly title?: string;
}) {
  return (
    <th
      scope="col"
      data-column={column}
      className={`${styles.headCell} ${WIDTH_CLASS[column] ?? ''} ${className}`}
      title={title}
    >
      <span className={styles.headCellLabel}>{label}</span>
      <ColumnResizeHandle column={column} label={typeof label === 'string' ? label : column} />
    </th>
  );
}

/**
 * The table is built entirely on the server: it arrives as HTML, with nothing for the
 * browser to fetch or sort. Only the grips in the header and the two buttons on each row
 * are interactive; which columns are on screen and how wide they are is decided in CSS
 * from the preferences `LedgerTableViewport` puts on the scrolling box.
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
          <th className={`${styles.headCell} ${styles.colFiller}`} aria-hidden="true" />
          <HeadCell column="date" label={t('table.column.date')} />
          <HeadCell column="description" label={t('table.column.description')} />
          <HeadCell column="receipt" label={t('table.column.receipt')} />
          <HeadCell column="entity" label={t('table.column.entity')} />
          <HeadCell column="amount" label={t('table.column.amount')} className={styles.headCellRight} />
          <th scope="col" className={`${styles.headCell} ${styles.colActions}`}>
            <span className="visually-hidden">{t('table.column.actions')}</span>
          </th>
          <th className={`${styles.headCell} ${styles.colFiller}`} aria-hidden="true" />
        </tr>
      </thead>
      <tbody>
        {movements.map((movement) => (
          <tr key={movement.id} className={styles.row}>
            <td className={styles.cell} aria-hidden="true" />
            <td data-column="date" className={`${styles.cell} ${styles.cellDate} mono`}>
              {movement.date}
              <span className={styles.cellTime}>{movement.time}</span>
            </td>
            <td
              data-column="description"
              className={`${styles.cell} ${styles.cellDescription}`}
              title={movement.description}
            >
              {movement.description}
            </td>
            <td data-column="receipt" className={`${styles.cell} mono`}>
              {movement.receiptId === '' ? (
                <span className={styles.cellEmpty}>{t('table.empty-value')}</span>
              ) : (
                movement.receiptId
              )}
            </td>
            <td data-column="entity" className={`${styles.cell} mono`} title={movement.bankEntityId}>
              {movement.bankEntityId}
            </td>
            <td data-column="amount" className={styles.cellAmount}>
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
            <td className={styles.cell} aria-hidden="true" />
          </tr>
        ))}
      </tbody>
    </table>
  );
}
