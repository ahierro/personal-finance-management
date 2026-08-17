'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { ChevronDownIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import styles from '@/infrastructure/adapters/input/web/component/Dialog.module.css';

interface SuggestFieldProps {
  readonly id: string;
  readonly value: string;
  readonly suggestions: readonly string[];
  readonly placeholder?: string;
  readonly maxLength?: number;
  readonly invalid?: boolean;
  /** Applied to the input on top of the field styles, for the monospaced fields. */
  readonly inputClassName?: string;
  /** Runs on every keystroke and on every pick; use it to upper-case or trim. */
  readonly onChange: (value: string) => void;
}

/**
 * Text field with a list of known values hanging off it.
 *
 * A native `<datalist>` would do the same job in three lines, but the browser draws that
 * popup itself and no stylesheet reaches it: it cannot be made to match the width of its
 * field or to line up with its edges. So the list is drawn here, absolutely positioned
 * against the field with `left: 0; right: 0`, which is what pins it to exactly the same
 * two edges however wide the dialog gets.
 *
 * The typed value is never constrained to the list. The suggestions narrow down as you
 * type, and anything with no match at all simply leaves the list closed.
 */
export function SuggestField({
  id,
  value,
  suggestions,
  placeholder,
  maxLength,
  invalid = false,
  inputClassName = '',
  onChange,
}: SuggestFieldProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  // Which option the keyboard is on. -1 means the typed text itself is what is selected.
  const [active, setActive] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = value.trim().toLowerCase();
  // While the field holds exactly one of the values, the whole list is offered again:
  // having picked BBVA-0170 should not hide the other entities behind it.
  const matches =
    trimmed === '' || suggestions.some((suggestion) => suggestion.toLowerCase() === trimmed)
      ? suggestions
      : suggestions.filter((suggestion) => suggestion.toLowerCase().includes(trimmed));

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

  function choose(suggestion: string) {
    onChange(suggestion);
    setOpen(false);
    setActive(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && open) {
      // Stopped here so the dialog itself does not close along with the list.
      event.stopPropagation();
      setOpen(false);
      setActive(-1);
      return;
    }
    if (matches.length === 0) {
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(event.key === 'ArrowDown' ? 0 : matches.length - 1);
        return;
      }
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => (current + step + matches.length) % matches.length);
      return;
    }
    if (event.key === 'Enter' && open && active >= 0) {
      // Only swallowed when it is picking from the list; otherwise it submits the form.
      event.preventDefault();
      const picked = matches[active];
      if (picked !== undefined) {
        choose(picked);
      }
    }
  }

  const inputClasses = [styles.input, styles.suggestInput, inputClassName];
  if (invalid) {
    inputClasses.push(styles.inputError);
  }

  return (
    <div className={styles.suggestField} ref={containerRef}>
      <input
        id={id}
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        className={inputClasses.join(' ')}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        // The mouse opens the list: that is the point of the field carrying one.
        onMouseDown={() => setOpen(suggestions.length > 0)}
        onKeyDown={handleKeyDown}
      />

      {suggestions.length > 0 && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className={styles.suggestToggle}
          onMouseDown={(event) => {
            // Keeps the focus in the field, so the caret does not jump away on a click.
            event.preventDefault();
            setOpen((current) => !current);
            inputRef.current?.focus();
          }}
        >
          <ChevronDownIcon size={12} />
        </button>
      )}

      {open && matches.length > 0 && (
        <ul className={styles.suggestList} id={listId} role="listbox">
          {matches.map((suggestion, index) => (
            <li
              key={suggestion}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={suggestion.toLowerCase() === trimmed}
              className={`${styles.suggestOption} ${index === active ? styles.suggestOptionActive : ''} mono`}
              // `mousedown` rather than `click`: the blur that a click starts would take
              // the list off screen before the pick ever landed.
              onMouseDown={(event) => {
                event.preventDefault();
                choose(suggestion);
              }}
              onMouseEnter={() => setActive(index)}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
