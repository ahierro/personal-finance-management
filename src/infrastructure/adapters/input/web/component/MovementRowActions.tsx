'use client';

import type { MovementView } from '@/infrastructure/adapters/input/web/view/MovementView';
import { EditIcon, TrashIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import { useLedger } from '@/infrastructure/adapters/input/web/component/MovementLedgerProvider';
import { useTranslation } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Ledger.module.css';

/** The two buttons on each row. The row itself is painted by the server. */
export function MovementRowActions({ movement }: { readonly movement: MovementView }) {
  const { t } = useTranslation();
  const { openEdit, openDelete } = useLedger();

  return (
    <span className={styles.rowActions}>
      <button
        type="button"
        className={styles.iconButton}
        aria-label={t('table.row.edit', [movement.date, movement.description])}
        onClick={() => openEdit(movement)}
      >
        <EditIcon />
      </button>
      <button
        type="button"
        className={`${styles.iconButton} ${styles.iconButtonDanger}`}
        aria-label={t('table.row.delete', [movement.date, movement.description])}
        onClick={() => openDelete(movement)}
      >
        <TrashIcon />
      </button>
    </span>
  );
}
