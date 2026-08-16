'use client';

import { useEffect, useRef } from 'react';

import { CloseIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import { useTranslation } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Dialog.module.css';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly narrow?: boolean;
  readonly onClose: () => void;
  readonly children: React.ReactNode;
  readonly footer: React.ReactNode;
}

/** Modal with trapped focus, Escape to close, and the focus handed back on the way out. */
export function Dialog({ title, subtitle, narrow, onClose, children, footer }: DialogProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus starts on the first field of the content, not on the close cross. A dialog
    // with no fields, such as a confirmation, falls back to the first safe control.
    const content = panelRef.current?.querySelector(`.${styles.body}`);
    const firstField = content?.querySelector<HTMLElement>(FOCUSABLE);
    (firstField ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus();

    return () => {
      document.body.style.overflow = overflow;
      // After saving, the row is rendered again and the button that opened the dialog may
      // be gone: the focus only goes back if that element is still in the document.
      if (previouslyFocused.current?.isConnected === true) {
        previouslyFocused.current.focus();
      }
    };
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const focusables = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    if (focusables.length === 0) {
      return;
    }
    const first = focusables[0] as HTMLElement;
    const last = focusables[focusables.length - 1] as HTMLElement;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={narrow ? `${styles.panel} ${styles.panelNarrow}` : styles.panel}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.head}>
          <div className={styles.headText}>
            <h2 className={styles.title}>{title}</h2>
            {subtitle !== undefined && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.closeButton} aria-label={t('action.close')} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        <div className={styles.foot}>{footer}</div>
      </div>
    </div>
  );
}
