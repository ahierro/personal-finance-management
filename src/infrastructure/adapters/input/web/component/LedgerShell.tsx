'use client';

import { useColumnPreferences } from '@/infrastructure/adapters/input/web/component/ColumnPreferencesProvider';
import styles from '@/infrastructure/adapters/input/web/component/Ledger.module.css';

/**
 * The full-height frame, and the element that publishes how wide the table's columns
 * currently are.
 *
 * The masthead, the filter bar and the footer read `--ledger-width` to hold their content
 * to that same measure, so the screen reads as one centred column rather than as chrome
 * spread to the edges around a centred table. Their backgrounds and rules still run the
 * whole way across: only what is inside them is held in.
 */
export function LedgerShell({ children }: { readonly children: React.ReactNode }) {
  const { totalWidth } = useColumnPreferences();

  return (
    <div className={styles.shell} style={{ '--ledger-width': `${totalWidth}px` } as React.CSSProperties}>
      {children}
    </div>
  );
}
