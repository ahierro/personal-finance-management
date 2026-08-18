'use client';

import { useEffect, useRef, useState } from 'react';

import { formatPattern } from '@/infrastructure/i18n/Translator';
import { Calendar, fromIsoDate, parseTypedDate } from '@/infrastructure/adapters/input/web/component/Calendar';
import { CalendarIcon, CloseIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import { useTranslation } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Calendar.module.css';

interface DateFieldProps {
  /** Accessible name of the field, for example "Date from". */
  readonly label: string;
  /** Date as `YYYY-MM-DD`, or empty. */
  readonly value: string;
  readonly onChange: (isoDate: string) => void;
  /** Put on the text input, so a `<label htmlFor>` outside can point at it. */
  readonly id?: string;
  /** Stretches the box to the width of its container, for a form rather than a toolbar. */
  readonly fill?: boolean;
  /** The cross that empties the field. A required field has no use for it. */
  readonly clearable?: boolean;
}

/**
 * A date, written or picked.
 *
 * Whoever knows the date types it and is done; whoever is looking for it opens the
 * calendar. The typing is only read back when the field is left or Enter is pressed —
 * every keystroke would otherwise reload the ledger against half a date.
 */
export function DateField({ label, value, onChange, id, fill = false, clearable = true }: DateFieldProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pattern = t('format.date.pattern');
  const selected = fromIsoDate(value);
  const display = selected === null ? '' : formatPattern(pattern, selected);
  const [text, setText] = useState(display);

  // The field follows the value it is given: a pick on the calendar, the back button, or
  // the clear filters button all land here.
  useEffect(() => {
    setText(display);
  }, [display]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  /** Text that reads as a date is kept; anything else falls back to the date already held. */
  function commit() {
    const typed = text.trim();
    if (typed === '') {
      // An emptied field drops the filter; blanks left behind go with it.
      if (value === '') {
        setText('');
      } else {
        onChange('');
      }
      return;
    }
    const isoDate = parseTypedDate(typed, pattern);
    if (isoDate === null || isoDate === value) {
      setText(display);
      return;
    }
    onChange(isoDate);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
      setOpen(false);
      return;
    }
    // The way into the calendar without reaching for the mouse.
    if (event.key === 'ArrowDown' && !open) {
      event.preventDefault();
      setOpen(true);
    }
  }

  /**
   * Escape, wherever the focus is inside the field. It is caught here and not on the
   * document because the calendar stops it as it goes by whenever it has a panel of its
   * own to fold first, and a listener on the document would never hear about that.
   *
   * It is stopped here too: inside a dialog the same key closes the whole modal, and
   * dismissing a calendar should not take the half-filled form with it.
   */
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape') {
      return;
    }
    if (open) {
      event.stopPropagation();
      setOpen(false);
      inputRef.current?.focus();
      return;
    }
    if (text !== display) {
      event.stopPropagation();
      setText(display);
    }
  }

  const fieldClasses = [styles.field];
  if (fill) {
    fieldClasses.push(styles.fieldFill);
  }
  if (display !== '') {
    fieldClasses.push(styles.fieldActive);
  }
  if (open) {
    fieldClasses.push(styles.fieldOpen);
  }

  return (
    <div className={fieldClasses.join(' ')} ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={styles.calendarButton}
        aria-label={t('calendar.open', [label])}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <CalendarIcon />
      </button>

      <input
        id={id}
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={`${styles.input} mono`}
        aria-label={label}
        placeholder={t('calendar.placeholder')}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleInputKeyDown}
        onBlur={commit}
      />

      {clearable && display !== '' && (
        <button
          type="button"
          aria-label={t('filters.date.clear', [label])}
          className={styles.triggerClear}
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
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
              inputRef.current?.focus();
            }
          }}
          onClose={() => {
            setOpen(false);
            inputRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
