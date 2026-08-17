'use client';

import {
  columnWidthVariable,
  LEDGER_COLUMNS,
} from '@/infrastructure/adapters/input/web/view/LedgerColumns';
import { useColumnPreferences } from '@/infrastructure/adapters/input/web/component/ColumnPreferencesProvider';
import styles from '@/infrastructure/adapters/input/web/component/Ledger.module.css';

/**
 * The scrolling box around the table, and the one element that carries the column
 * preferences into CSS.
 *
 * Widths arrive as custom properties (`--col-date-width`) and the hidden columns as a
 * space-separated list in `data-hidden-columns`, which the stylesheet reads with `~=`.
 * Going through CSS is what lets the table itself stay a server component: its cells are
 * tagged with `data-column` and this element decides what happens to them.
 */
export function LedgerTableViewport({ children }: { readonly children: React.ReactNode }) {
  const { hidden, widths } = useColumnPreferences();

  const style: React.CSSProperties = {};
  for (const column of LEDGER_COLUMNS) {
    const width = widths[column.id];
    if (width !== undefined) {
      (style as Record<string, string>)[columnWidthVariable(column.id)] = `${width}px`;
    }
  }

  return (
    <div
      className={styles.tableScroll}
      style={style}
      data-hidden-columns={hidden.length > 0 ? hidden.join(' ') : undefined}
    >
      {children}
    </div>
  );
}
