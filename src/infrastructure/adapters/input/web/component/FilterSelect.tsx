'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { ChevronDownIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import styles from '@/infrastructure/adapters/input/web/component/Ledger.module.css';

interface FilterSelectProps {
  /** Accessible name of the filter, for example "Bank entity". */
  readonly label: string;
  /** What the empty choice reads as: "All entities". */
  readonly allLabel: string;
  /** The picked value, or empty for all of them. */
  readonly value: string;
  readonly values: readonly string[];
  readonly onChange: (value: string) => void;
}

/**
 * One of the listing's value filters.
 *
 * A native `<select>` would carry the same choice, but its popup belongs to the browser:
 * square corners, its own colours, and nothing a stylesheet can reach. This one is drawn
 * here so it matches the rest of the screen — the same rounded panel as the column picker
 * and the form's suggestion lists — and it is pinned to `left: 0; right: 0` on the
 * trigger, so the list is exactly as wide as the control it hangs from.
 *
 * The state of the filter is legible before it is read: the placeholder sits in the muted
 * text colour while nothing is chosen, and the moment a value is picked it turns bright
 * and the border takes the brass line, the same way the date fields mark themselves.
 */
export function FilterSelect({ label, allLabel, value, values, onChange }: FilterSelectProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // A value from an old link that no longer exists in the collection is still offered, so
  // the list shows what is actually being filtered instead of hiding it.
  const options = value !== '' && !values.includes(value) ? [value, ...values] : values;
  // The empty choice is one more row of the list, at the top.
  const rows = ['', ...options];

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

  function choose(picked: string) {
    setOpen(false);
    setActive(-1);
    triggerRef.current?.focus();
    if (picked !== value) {
      onChange(picked);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape' && open) {
      event.stopPropagation();
      setOpen(false);
      setActive(-1);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(Math.max(rows.indexOf(value), 0));
        return;
      }
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => (current + step + rows.length) % rows.length);
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && open && active >= 0) {
      event.preventDefault();
      const picked = rows[active];
      if (picked !== undefined) {
        choose(picked);
      }
    }
  }

  const triggerClasses = [styles.filterSelect];
  if (value !== '') {
    triggerClasses.push(styles.filterSelectActive);
  }
  if (open) {
    triggerClasses.push(styles.filterSelectOpen);
  }

  return (
    <div className={styles.filterSelectField} ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        className={triggerClasses.join(' ')}
        onClick={() => {
          setOpen((current) => !current);
          setActive(Math.max(rows.indexOf(value), 0));
        }}
        onKeyDown={handleKeyDown}
      >
        <span className={value === '' ? styles.filterSelectPlaceholder : `${styles.filterSelectValue} mono`}>
          {value === '' ? allLabel : value}
        </span>
        <ChevronDownIcon size={12} />
      </button>

      {open && (
        <ul className={styles.filterSelectList} id={listId} role="listbox" aria-label={label}>
          {rows.map((row, index) => (
            <li
              key={row === '' ? '__all__' : row}
              role="option"
              aria-selected={row === value}
              className={[
                styles.filterSelectOption,
                row === '' ? styles.filterSelectOptionAll : 'mono',
                index === active ? styles.filterSelectOptionActive : '',
              ].join(' ')}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(row);
              }}
              onMouseEnter={() => setActive(index)}
            >
              {row === '' ? allLabel : row}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
