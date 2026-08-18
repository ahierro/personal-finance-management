'use client';

import { useEffect, useRef, useState } from 'react';

import { ClockIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import { useTranslation } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Calendar.module.css';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 60 }, (_, minute) => minute);

const pad = (value: number): string => String(value).padStart(2, '0');

/**
 * Reads a hand typed time. `9`, `9:5`, `9.30`, `930` and `2315` all land where they read
 * as if they should; anything outside a real clock comes back as `null`.
 */
export function parseTypedTime(text: string): string | null {
  const digitGroups = text.match(/\d+/g);
  if (digitGroups === null) {
    return null;
  }
  let hours: number;
  let minutes: number;
  if (digitGroups.length >= 2) {
    hours = Number(digitGroups[0]);
    minutes = Number(digitGroups[1]);
  } else {
    const run = digitGroups[0] ?? '';
    if (run.length <= 2) {
      hours = Number(run);
      minutes = 0;
    } else if (run.length === 3) {
      hours = Number(run.slice(0, 1));
      minutes = Number(run.slice(1));
    } else if (run.length === 4) {
      hours = Number(run.slice(0, 2));
      minutes = Number(run.slice(2));
    } else {
      return null;
    }
  }
  if (hours > 23 || minutes > 59) {
    return null;
  }
  return `${pad(hours)}:${pad(minutes)}`;
}

function partsOf(value: string): { readonly hours: number; readonly minutes: number } {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  return match === null
    ? { hours: 0, minutes: 0 }
    : { hours: Number(match[1]), minutes: Number(match[2]) };
}

interface TimeFieldProps {
  /** Accessible name of the field, for example "Time". */
  readonly label: string;
  /** Time as `HH:mm`, or empty. */
  readonly value: string;
  readonly onChange: (time: string) => void;
  /** Put on the text input, so a `<label htmlFor>` outside can point at it. */
  readonly id?: string;
  /** Stretches the box to the width of its container, for a form rather than a toolbar. */
  readonly fill?: boolean;
}

/**
 * A time, written or picked.
 *
 * The browser draws its own dropdown for `<input type="time">` and no stylesheet reaches
 * it: next to the calendar it arrives in the operating system's colours instead of the
 * ledger's. So the two columns are drawn here, in the same popover, with the same figures
 * and the same brass on the value that is currently set.
 */
export function TimeField({ label, value, onChange, id, fill = false }: TimeFieldProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  const { hours, minutes } = partsOf(value);

  // The field follows the value it is given, whoever changed it.
  useEffect(() => {
    setText(value);
  }, [value]);

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

  // Both columns open showing what is already set, centred rather than scrolled to the
  // top: 23:15 is otherwise forty rows below the first thing the eye lands on. The scroll
  // is set on the column itself, never through `scrollIntoView`, which would drag the
  // dialog behind it.
  useEffect(() => {
    if (!open) {
      return;
    }
    for (const column of [hoursRef.current, minutesRef.current]) {
      const selected = column?.querySelector<HTMLElement>('[data-selected="true"]');
      if (column !== null && column !== undefined && selected != null) {
        column.scrollTop = selected.offsetTop - column.clientHeight / 2 + selected.offsetHeight / 2;
      }
    }
  }, [open]);

  /** Text that reads as a time is kept; anything else falls back to the time already held. */
  function commit() {
    const typed = text.trim();
    if (typed === '') {
      if (value === '') {
        setText('');
      } else {
        onChange('');
      }
      return;
    }
    const time = parseTypedTime(typed);
    if (time === null || time === value) {
      setText(value);
      return;
    }
    onChange(time);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' && !open) {
      event.preventDefault();
      setOpen(true);
    }
  }

  /** Escape folds the popover away and is stopped there, so a dialog around it stays open. */
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
    if (text !== value) {
      event.stopPropagation();
      setText(value);
    }
  }

  const fieldClasses = [styles.field];
  if (fill) {
    fieldClasses.push(styles.fieldFill);
  }
  if (value !== '') {
    fieldClasses.push(styles.fieldActive);
  }
  if (open) {
    fieldClasses.push(styles.fieldOpen);
  }

  function column(
    label: string,
    values: readonly number[],
    selected: number,
    ref: React.RefObject<HTMLDivElement | null>,
    onPick: (value: number) => void,
  ) {
    return (
      <div className={styles.timeColumn}>
        <span className={styles.timeColumnHead}>{label}</span>
        <div className={styles.timeList} ref={ref} role="listbox" aria-label={label}>
          {values.map((entry) => {
            const isSelected = value !== '' && entry === selected;
            return (
              <button
                key={entry}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-selected={isSelected}
                className={isSelected ? `${styles.timeOption} ${styles.timeOptionSelected} mono` : `${styles.timeOption} mono`}
                onClick={() => onPick(entry)}
              >
                {pad(entry)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={fieldClasses.join(' ')} ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={styles.calendarButton}
        aria-label={t('time.open', [label])}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <ClockIcon />
      </button>

      <input
        id={id}
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        className={`${styles.input} ${styles.inputTime} mono`}
        aria-label={label}
        placeholder={t('time.placeholder')}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleInputKeyDown}
        onBlur={commit}
      />

      {open && (
        <div className={`${styles.popover} ${styles.popoverTime}`} role="dialog" aria-label={t('time.label')}>
          {/* Hours and minutes are picked one after the other, so unlike the calendar the
              popover stays open until it is dismissed: closing on the hour would hide the
              minutes the moment they are needed. */}
          <div className={styles.timePanels}>
            {column(t('time.hours'), HOURS, hours, hoursRef, (hour) => onChange(`${pad(hour)}:${pad(minutes)}`))}
            {column(t('time.minutes'), MINUTES, minutes, minutesRef, (minute) =>
              onChange(`${pad(hours)}:${pad(minute)}`),
            )}
          </div>

          <div className={styles.popoverFoot}>
            <button
              type="button"
              className={styles.footButton}
              onClick={() => {
                const now = new Date();
                onChange(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
              }}
            >
              {t('time.now')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
