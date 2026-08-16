'use client';

import { useState } from 'react';

import type { ErrorModel } from '@/domain/entity/ErrorModel';
import { deleteMovement } from '@/infrastructure/adapters/input/web/action/MovementCommandActions';
import type { MovementView } from '@/infrastructure/adapters/input/web/view/MovementView';
import { Dialog } from '@/infrastructure/adapters/input/web/component/Dialog';
import { AlertIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import { useTranslation } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Dialog.module.css';

interface DeleteMovementDialogProps {
  readonly movement: MovementView;
  readonly onClose: () => void;
  readonly onDeleted: () => void;
}

export function DeleteMovementDialog({ movement, onClose, onDeleted }: DeleteMovementDialogProps) {
  const { t } = useTranslation();
  const [error, setError] = useState<ErrorModel | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const result = await deleteMovement(movement.id);
    setDeleting(false);
    if (result.ok) {
      onDeleted();
    } else {
      setError(result.error);
    }
  }

  return (
    <Dialog
      title={t('dialog.delete.title')}
      narrow
      onClose={onClose}
      footer={
        <>
          <button type="button" className={styles.buttonQuiet} onClick={onClose} disabled={deleting}>
            {t('action.cancel')}
          </button>
          <button type="button" className={styles.buttonDanger} onClick={handleDelete} disabled={deleting}>
            {deleting && <span className={styles.spinner} />}
            {t('action.delete-movement')}
          </button>
        </>
      }
    >
      {error !== null && (
        <div className={styles.banner} role="alert">
          <span className={styles.bannerIcon}>
            <AlertIcon size={15} />
          </span>
          <span>{error.moreInformation}</span>
        </div>
      )}

      <p className={styles.confirmText}>{t('dialog.delete.text')}</p>

      <div className={styles.confirmCard}>
        <div className={styles.confirmRow}>
          <span className={styles.confirmLabel}>{t('table.column.date')}</span>
          <span className={`${styles.confirmValue} mono`}>
            {movement.date} {movement.time}
          </span>
        </div>
        <div className={styles.confirmRow}>
          <span className={styles.confirmLabel}>{t('table.column.description')}</span>
          <span className={styles.confirmValue}>{movement.description}</span>
        </div>
        <div className={styles.confirmRow}>
          <span className={styles.confirmLabel}>{t('table.column.amount')}</span>
          <span
            className={`${styles.confirmValue} ${
              movement.negative ? styles.confirmAmountDebit : styles.confirmAmountCredit
            } mono`}
          >
            {movement.amountDisplay} {movement.currency}
          </span>
        </div>
      </div>
    </Dialog>
  );
}
