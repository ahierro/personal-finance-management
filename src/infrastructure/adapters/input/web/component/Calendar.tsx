'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import { useTranslation } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Calendar.module.css';

const pad = (value: number): string => String(value).padStart(2, '0');

/** Years the year panel shows at once: four columns by three rows. */
const YEARS_PER_PAGE = 12;

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

/** Splits a run of digits such as `17082026` by the width the pattern gives each field. */
function splitByPattern(digits: string, order: readonly string[]): string[] {
  let cursor = 0;
  return order.map((token) => {
    const width = token === 'yyyy' ? 4 : 2;
    const slice = digits.slice(cursor, cursor + width);
    cursor += width;
    return slice;
  });
}

/**
 * Reads a hand typed date against the bundle's pattern, so `dd/MM/yyyy` and `MM/dd/yyyy`
 * each take the numbers in their own order. The separator is free — `/`, `-`, `.` and a
 * space all do — a single digit stands for a padded one, and eight digits in a row with no
 * separator at all are read as well, which is how a number pad types a date fastest.
 *
 * Returns the date as `YYYY-MM-DD`, or `null` when the text is not one.
 */
export function parseTypedDate(text: string, pattern: string): string | null {
  const order = pattern.match(/dd|MM|yyyy/g);
  const digitGroups = text.match(/\d+/g);
  if (order === null || order.length !== 3 || digitGroups === null) {
    return null;
  }
  const runTogether = digitGroups.length === 1 ? (digitGroups[0] ?? '') : '';
  const parts =
    digitGroups.length === 3 ? digitGroups : runTogether.length === 8 ? splitByPattern(runTogether, order) : null;
  if (parts === null) {
    return null;
  }
  const fields = new Map(order.map((token, index) => [token, parts[index] ?? '']));
  const yearText = fields.get('yyyy') ?? '';
  // Two digits are read as this century: `24` is 2024, the way a statement writes it.
  const year = yearText.length <= 2 ? 2000 + Number(yearText) : Number(yearText);
  const month = Number(fields.get('MM'));
  const day = Number(fields.get('dd'));
  const date = new Date(year, month - 1, day);
  // Turns away the days a month does not have: the 31st of February would otherwise roll
  // over quietly into March and file the movement under a date nobody typed.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return toIsoDate(date);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

/**
 * Same day of the month, `months` later. The 31st stepped back a month lands on the 28th
 * or the 30th rather than spilling into the next one, which is what `setMonth` would do.
 */
function shiftMonthsKeepingDay(date: Date, months: number): Date {
  const month = date.getMonth() + months;
  const lastDayOfTarget = new Date(date.getFullYear(), month + 1, 0).getDate();
  return new Date(date.getFullYear(), month, Math.min(date.getDate(), lastDayOfTarget));
}

/** First year of the page holding `year`, so paging always lands on the same blocks. */
function yearPageStart(year: number): number {
  return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}

/** 42 cells: six full weeks, so the grid keeps its height when the month changes. */
function buildGrid(visibleMonth: Date): Date[] {
  const firstOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  // The week starts on Monday, as local bank statements do.
  const offset = (firstOfMonth.getDay() + 6) % 7;
  const start = addDays(firstOfMonth, -offset);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

/**
 * Which of the three panels is on screen. They are steps of the same walk — days zoom out
 * to months and months to years — so a date far from today is three clicks away instead of
 * as many taps on the arrow as there are months in between.
 */
type View = 'days' | 'months' | 'years';

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
  const [view, setView] = useState<View>('days');
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldFocusRef = useRef(false);

  const days = useMemo(() => buildGrid(visibleMonth), [visibleMonth]);
  const todayIso = toIsoDate(today);
  const focusedIso = toIsoDate(focusedDate);
  const visibleYear = visibleMonth.getFullYear();
  const firstYearOnPage = yearPageStart(visibleYear);

  // After moving with the keyboard the focus has to follow to the new day's button,
  // which may belong to a different month and therefore be a different node. Coming back
  // from the month panel it is a different node too, hence the view in the dependencies.
  useEffect(() => {
    if (!shouldFocusRef.current) {
      return;
    }
    shouldFocusRef.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-iso="${focusedIso}"]`)?.focus();
  }, [focusedIso, view]);

  function moveFocus(next: Date) {
    shouldFocusRef.current = true;
    setFocusedDate(next);
    if (next.getMonth() !== visibleMonth.getMonth() || next.getFullYear() !== visibleMonth.getFullYear()) {
      setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  }

  /** The arrows read as "one step back" in every panel; only the size of the step changes. */
  function page(direction: -1 | 1) {
    if (view === 'days') {
      setVisibleMonth(addMonths(visibleMonth, direction));
      return;
    }
    const years = view === 'months' ? direction : direction * YEARS_PER_PAGE;
    setVisibleMonth(new Date(visibleYear + years, visibleMonth.getMonth(), 1));
  }

  function chooseMonth(month: number) {
    // The day of the month is kept, so the grid opens with the focus where the eye already
    // was rather than back on the first; a 31st landing on a shorter month gives way.
    const lastDayOfMonth = new Date(visibleYear, month + 1, 0).getDate();
    setVisibleMonth(new Date(visibleYear, month, 1));
    setFocusedDate(new Date(visibleYear, month, Math.min(focusedDate.getDate(), lastDayOfMonth)));
    shouldFocusRef.current = true;
    setView('days');
  }

  /**
   * The month and year panels take the focus as they open, by way of the cell that is
   * already on. Coming back the other way there is no such cell to move to, so the focus
   * is handed to the day grid; left where it was it would fall to the body and the next
   * Escape would have nothing listening.
   */
  function changeView(next: View) {
    shouldFocusRef.current = next === 'days';
    setView(next);
  }

  function chooseYear(year: number) {
    setVisibleMonth(new Date(year, visibleMonth.getMonth(), 1));
    setView('months');
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && view !== 'days') {
      // Stopped here so the field keeps the popover open: the way out of the month and
      // year panels is the day grid, not a closed calendar.
      event.stopPropagation();
      changeView('days');
      return;
    }
    if (view !== 'days') {
      return;
    }
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    const move = moves[event.key];
    if (move !== undefined) {
      event.preventDefault();
      moveFocus(addDays(focusedDate, move));
      return;
    }
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      const step = event.key === 'PageUp' ? -1 : 1;
      // Shift turns the month jump into a year jump, as the ARIA date picker pattern does.
      moveFocus(shiftMonthsKeepingDay(focusedDate, event.shiftKey ? step * 12 : step));
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const dayOfWeek = (focusedDate.getDay() + 6) % 7;
      moveFocus(addDays(focusedDate, event.key === 'Home' ? -dayOfWeek : 6 - dayOfWeek));
    }
  }

  const titles: Record<View, string> = {
    days: `${t(`calendar.month.${visibleMonth.getMonth() + 1}`)} ${visibleYear}`,
    months: String(visibleYear),
    years: `${firstYearOnPage}–${firstYearOnPage + YEARS_PER_PAGE - 1}`,
  };
  const titleActions: Record<View, { readonly next: View; readonly label: string }> = {
    days: { next: 'months', label: t('calendar.choose-month') },
    months: { next: 'years', label: t('calendar.choose-year') },
    years: { next: 'days', label: t('calendar.back-to-days') },
  };
  const navLabels: Record<View, readonly [string, string]> = {
    days: [t('calendar.previous-month'), t('calendar.next-month')],
    months: [t('calendar.previous-year'), t('calendar.next-year')],
    years: [t('calendar.previous-years'), t('calendar.next-years')],
  };

  return (
    <div className={styles.popover} role="dialog" aria-label={t('calendar.label')} onKeyDown={handleKeyDown}>
      <div className={styles.popoverHead}>
        <button
          type="button"
          className={styles.titleButton}
          aria-label={`${titles[view]} — ${titleActions[view].label}`}
          onClick={() => changeView(titleActions[view].next)}
        >
          <span className={styles.monthLabel}>{titles[view]}</span>
          <span className={view === 'days' ? styles.titleChevron : `${styles.titleChevron} ${styles.titleChevronUp}`}>
            <ChevronDownIcon size={12} />
          </span>
        </button>
        <div className={styles.monthNav}>
          <button type="button" className={styles.navButton} aria-label={navLabels[view][0]} onClick={() => page(-1)}>
            <ChevronLeftIcon />
          </button>
          <button type="button" className={styles.navButton} aria-label={navLabels[view][1]} onClick={() => page(1)}>
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {/* Fixed height across the three panels: switching between them must not make the
          popover — and with it the arrows and the footer — jump under the pointer. */}
      <div className={styles.body}>
        {view === 'days' && (
          <>
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
          </>
        )}

        {view === 'months' && (
          <div className={styles.monthPanel} role="group" aria-label={t('calendar.choose-month')}>
            {Array.from({ length: 12 }, (_, month) => {
              const isSelected = selected !== null && selected.getFullYear() === visibleYear && selected.getMonth() === month;
              const isCurrent = today.getFullYear() === visibleYear && today.getMonth() === month;
              const classes = [styles.panelCell];
              if (isCurrent && !isSelected) {
                classes.push(styles.panelCellToday);
              }
              if (isSelected) {
                classes.push(styles.panelCellSelected);
              }
              return (
                <button
                  key={month}
                  type="button"
                  className={classes.join(' ')}
                  aria-pressed={isSelected}
                  autoFocus={month === visibleMonth.getMonth()}
                  onClick={() => chooseMonth(month)}
                >
                  {t(`calendar.month.short.${month + 1}`)}
                </button>
              );
            })}
          </div>
        )}

        {view === 'years' && (
          <div className={styles.yearPanel} role="group" aria-label={t('calendar.choose-year')}>
            {Array.from({ length: YEARS_PER_PAGE }, (_, index) => {
              const year = firstYearOnPage + index;
              const isSelected = selected !== null && selected.getFullYear() === year;
              const classes = [styles.panelCell, 'mono'];
              if (today.getFullYear() === year && !isSelected) {
                classes.push(styles.panelCellToday);
              }
              if (isSelected) {
                classes.push(styles.panelCellSelected);
              }
              return (
                <button
                  key={year}
                  type="button"
                  className={classes.join(' ')}
                  aria-pressed={isSelected}
                  autoFocus={year === visibleYear}
                  onClick={() => chooseYear(year)}
                >
                  {year}
                </button>
              );
            })}
          </div>
        )}
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
