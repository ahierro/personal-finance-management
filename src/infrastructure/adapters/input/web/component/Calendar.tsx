'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { ChevronLeftIcon, ChevronRightIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import { useTranslation } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Calendar.module.css';

const pad = (value: number): string => String(value).padStart(2, '0');

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function fromIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/** 42 cells: six full weeks, so the grid keeps its height when the month changes. */
function buildGrid(visibleMonth: Date): Date[] {
  const firstOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  // The week starts on Monday, as local bank statements do.
  const offset = (firstOfMonth.getDay() + 6) % 7;
  const start = addDays(firstOfMonth, -offset);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

interface CalendarProps {
  /** Selected date as `YYYY-MM-DD`, or empty. */
  readonly value: string;
  readonly onSelect: (isoDate: string) => void;
  readonly onClose: () => void;
}

export function Calendar({ value, onSelect, onClose }: CalendarProps) {
  const { t } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const selected = fromIsoDate(value);
  const [visibleMonth, setVisibleMonth] = useState<Date>(
    () => new Date((selected ?? today).getFullYear(), (selected ?? today).getMonth(), 1),
  );
  const [focusedDate, setFocusedDate] = useState<Date>(() => selected ?? today);
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldFocusRef = useRef(false);

  const days = useMemo(() => buildGrid(visibleMonth), [visibleMonth]);
  const todayIso = toIsoDate(today);
  const focusedIso = toIsoDate(focusedDate);

  // After moving with the keyboard the focus has to follow to the new day's button,
  // which may belong to a different month and therefore be a different node.
  useEffect(() => {
    if (!shouldFocusRef.current) {
      return;
    }
    shouldFocusRef.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${focusedIso}"]`)?.focus();
  }, [focusedIso]);

  function moveFocus(next: Date) {
    shouldFocusRef.current = true;
    setFocusedDate(next);
    if (next.getMonth() !== visibleMonth.getMonth() || next.getFullYear() !== visibleMonth.getFullYear()) {
      setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const move = moves[event.key];
    if (move !== undefined) {
      event.preventDefault();
      moveFocus(addDays(focusedDate, move));
      return;
    }
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      moveFocus(addDays(focusedDate, event.key === 'PageUp' ? -28 : 28));
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const dayOfWeek = (focusedDate.getDay() + 6) % 7;
      moveFocus(addDays(focusedDate, event.key === 'Home' ? -dayOfWeek : 6 - dayOfWeek));
    }
  }

  const monthLabel = `${t(`calendar.month.${visibleMonth.getMonth() + 1}`)} ${visibleMonth.getFullYear()}`;

  return (
    <div className={styles.popover} role="dialog" aria-label={t('calendar.label')} onKeyDown={handleKeyDown}>
      <div className={styles.popoverHead}>
        <span className={styles.monthLabel}>{monthLabel}</span>
        <div className={styles.monthNav}>
          <button
            type="button"
            className={styles.navButton}
            aria-label={t('calendar.previous-month')}
            onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            className={styles.navButton}
            aria-label={t('calendar.next-month')}
            onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      <div className={styles.weekHead} aria-hidden="true">
        {[1, 2, 3, 4, 5, 6, 7].map((weekday) => (
          <span key={weekday} className={`${styles.weekDay} mono`}>
            {t(`calendar.weekday.${weekday}`)}
          </span>
        ))}
      </div>

      <div className={styles.grid} ref={gridRef} role="grid">
        {days.map((day) => {
          const iso = toIsoDate(day);
          const isSelected = iso === value;
          const classes = [styles.day, 'mono'];
          if (day.getMonth() !== visibleMonth.getMonth()) {
            classes.push(styles.dayOutside);
          }
          if (iso === todayIso && !isSelected) {
            classes.push(styles.dayToday);
          }
          if (isSelected) {
            classes.push(styles.daySelected);
          }
          return (
            <button
              key={iso}
              type="button"
              data-iso={iso}
              className={classes.join(' ')}
              tabIndex={iso === focusedIso ? 0 : -1}
              aria-pressed={isSelected}
              aria-current={iso === todayIso ? 'date' : undefined}
              onClick={() => onSelect(iso)}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>

      <div className={styles.popoverFoot}>
        <button type="button" className={styles.footButton} onClick={() => onSelect(todayIso)}>
          {t('calendar.today')}
        </button>
        <button
          type="button"
          className={styles.footButton}
          onClick={() => {
            onSelect('');
            onClose();
          }}
        >
          {t('calendar.clear')}
        </button>
      </div>
    </div>
  );
}
