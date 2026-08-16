'use client';

import { PlusIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import { useLedger } from '@/infrastructure/adapters/input/web/component/MovementLedgerProvider';
import { useTranslation } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Ledger.module.css';

export function NewMovementButton({ variant = 'primary' }: { readonly variant?: 'primary' | 'quiet' }) {
  const { t } = useTranslation();
  const { openCreate } = useLedger();

  return (
    <button
      type="button"
      className={variant === 'primary' ? styles.primaryButton : styles.ghostButton}
      onClick={openCreate}
    >
      <PlusIcon />
      {t('action.new-movement')}
    </button>
  );
}
