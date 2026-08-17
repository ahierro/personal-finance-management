'use client';

import { useEffect, useRef, useState } from 'react';

import { LEDGER_COLUMNS } from '@/infrastructure/adapters/input/web/view/LedgerColumns';
import { useColumnPreferences } from '@/infrastructure/adapters/input/web/component/ColumnPreferencesProvider';
import { FunnelIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import { useTranslation } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Ledger.module.css';

/**
 * Funnel button that drops a list of checkboxes, one per column.
 *
 * Unticking one takes the column off the table; the last one standing cannot be unticked,
 * so the listing never ends up with nothing to show. The choice is remembered in this
 * browser, which is why the button carries a mark when it is not on the defaults.
 */
export function ColumnPicker() {
  const { t } = useTranslation();
  const { isVisible, toggle, reset, hidden, isDefault } = useColumnPreferences();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const onlyOneLeft = hidden.length >= LEDGER_COLUMNS.length - 1;

  return (
    <div className={styles.columnPicker} ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`${styles.ghostButton} ${styles.columnButton} ${open ? styles.columnButtonOpen : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t('columns.button')}
        title={t('columns.button')}
        onClick={() => setOpen((current) => !current)}
      >
        <FunnelIcon />
        <span className={styles.columnButtonText}>{t('columns.button')}</span>
        {hidden.length > 0 && <span className={styles.columnButtonMark} aria-hidden="true" />}
      </button>

      {open && (
        <div className={styles.columnPopover} role="dialog" aria-label={t('columns.title')}>
          <p className={styles.columnPopoverTitle}>{t('columns.title')}</p>

          <ul className={styles.columnList}>
            {LEDGER_COLUMNS.map((column) => {
              const checked = isVisible(column.id);
              // Unticking the last one is refused rather than hidden away, so the box is
              // still readable — it just cannot be the one that empties the table.
              const locked = checked && onlyOneLeft;
              return (
                <li key={column.id}>
                  <label className={`${styles.columnOption} ${locked ? styles.columnOptionLocked : ''}`}>
                    <input
                      type="checkbox"
                      className={styles.columnCheckbox}
                      checked={checked}
                      disabled={locked}
                      onChange={() => toggle(column.id)}
                    />
                    <span>{t(column.labelKey)}</span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className={styles.columnPopoverFoot}>
            <span className={styles.columnHint}>{t('columns.hint')}</span>
            <button type="button" className={styles.columnReset} disabled={isDefault} onClick={reset}>
              {t('columns.reset')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
