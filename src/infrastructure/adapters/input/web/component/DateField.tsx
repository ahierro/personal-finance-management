'use client';

import { useEffect, useRef, useState } from 'react';

import { formatPattern } from '@/infrastructure/i18n/Translator';
import { Calendar, fromIsoDate } from '@/infrastructure/adapters/input/web/component/Calendar';
import { CalendarIcon, CloseIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import { useTranslation } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Calendar.module.css';

interface DateFieldProps {
  /** Accessible name of the field, for example "Date from". */
  readonly label: string;
  /** Date as `YYYY-MM-DD`, or empty. */
  readonly value: string;
  readonly onChange: (isoDate: string) => void;
}

export function DateField({ label, value, onChange }: DateFieldProps) {
  const { t } = useTranslation();
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

  const selected = fromIsoDate(value);
  const display = selected === null ? '' : formatPattern(t('format.date.pattern'), selected);
  const fieldClasses = [styles.field];
  if (display !== '') {
    fieldClasses.push(styles.fieldActive);
  }
  if (open) {
    fieldClasses.push(styles.fieldOpen);
  }

  return (
    <div className={fieldClasses.join(' ')} ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`${styles.trigger} mono`}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.triggerIcon}>
          <CalendarIcon />
        </span>
        {display === '' ? (
          <span className={styles.triggerPlaceholder}>{t('calendar.placeholder')}</span>
        ) : (
          <span className={styles.triggerValue}>{display}</span>
        )}
      </button>

      {display !== '' && (
        <button
          type="button"
          aria-label={t('filters.date.clear', [label])}
          className={styles.triggerClear}
          onClick={() => onChange('')}
        >
          <CloseIcon size={11} />
        </button>
      )}

      {open && (
        <Calendar
          value={value}
          onSelect={(isoDate) => {
            onChange(isoDate);
            if (isoDate !== '') {
              setOpen(false);
              triggerRef.current?.focus();
            }
          }}
          onClose={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
