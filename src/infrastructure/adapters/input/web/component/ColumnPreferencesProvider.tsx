'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  clampWidth,
  LEDGER_COLUMNS,
  totalColumnsWidth,
  type LedgerColumnId,
} from '@/infrastructure/adapters/input/web/view/LedgerColumns';

/** Bumped if the stored shape ever changes, so an old entry is ignored instead of breaking. */
const STORAGE_KEY = 'ledger.columns.v1';

interface StoredPreferences {
  readonly hidden?: readonly string[];
  readonly widths?: Readonly<Record<string, number>>;
}

interface ColumnPreferencesValue {
  readonly hidden: readonly LedgerColumnId[];
  readonly widths: Readonly<Partial<Record<LedgerColumnId, number>>>;
  readonly isVisible: (id: LedgerColumnId) => boolean;
  readonly toggle: (id: LedgerColumnId) => void;
  readonly setWidth: (id: LedgerColumnId, width: number) => void;
  readonly reset: () => void;
  /** Total width of the visible columns, which the whole screen is aligned to. */
  readonly totalWidth: number;
  /** `true` once the stored preferences have been read, so nothing is saved over them. */
  readonly ready: boolean;
  readonly isDefault: boolean;
}

const ColumnPreferencesContext = createContext<ColumnPreferencesValue | null>(null);

export function useColumnPreferences(): ColumnPreferencesValue {
  const value = useContext(ColumnPreferencesContext);
  if (value === null) {
    throw new Error('useColumnPreferences must be used inside ColumnPreferencesProvider');
  }
  return value;
}

function isColumnId(value: string): value is LedgerColumnId {
  return LEDGER_COLUMNS.some((column) => column.id === value);
}

/** Reads the stored preferences, discarding anything that is not a column we still render. */
function read(): { hidden: LedgerColumnId[]; widths: Partial<Record<LedgerColumnId, number>> } | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed = JSON.parse(raw) as StoredPreferences;
    const hidden = (parsed.hidden ?? []).filter(isColumnId);
    const widths: Partial<Record<LedgerColumnId, number>> = {};
    for (const [id, width] of Object.entries(parsed.widths ?? {})) {
      if (isColumnId(id) && typeof width === 'number' && Number.isFinite(width)) {
        widths[id] = clampWidth(id, width);
      }
    }
    // Everything hidden would leave a table with no columns; treat it as nothing hidden.
    return { hidden: hidden.length === LEDGER_COLUMNS.length ? [] : hidden, widths };
  } catch {
    // A corrupt entry, or storage blocked by the browser: fall back to the defaults.
    return null;
  }
}

/**
 * Holds which columns are on screen and how wide they are.
 *
 * The preferences are a property of this browser, not of the data, so they live in
 * `localStorage` and never travel to the server: the table keeps arriving as
 * server-rendered HTML and only the widths and the `display` of the cells are decided
 * here. They are read after mount — reading storage while rendering would make the
 * server's HTML and the client's first render disagree.
 */
export function ColumnPreferencesProvider({ children }: { readonly children: React.ReactNode }) {
  const [hidden, setHidden] = useState<readonly LedgerColumnId[]>([]);
  const [widths, setWidths] = useState<Readonly<Partial<Record<LedgerColumnId, number>>>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = read();
    if (stored !== null) {
      setHidden(stored.hidden);
      setWidths(stored.widths);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ hidden, widths }));
    } catch {
      // Private mode or a full quota: the preferences simply do not outlive the session.
    }
  }, [hidden, widths, ready]);

  const toggle = useCallback((id: LedgerColumnId) => {
    setHidden((current) => {
      if (!current.includes(id)) {
        // The last visible column cannot be hidden: an empty table has nothing to show.
        return current.length >= LEDGER_COLUMNS.length - 1 ? current : [...current, id];
      }
      return current.filter((hiddenId) => hiddenId !== id);
    });
  }, []);

  const setWidth = useCallback((id: LedgerColumnId, width: number) => {
    setWidths((current) => ({ ...current, [id]: clampWidth(id, width) }));
  }, []);

  const reset = useCallback(() => {
    setHidden([]);
    setWidths({});
  }, []);

  const value = useMemo<ColumnPreferencesValue>(
    () => ({
      hidden,
      widths,
      isVisible: (id) => !hidden.includes(id),
      toggle,
      setWidth,
      reset,
      totalWidth: totalColumnsWidth(hidden, widths),
      ready,
      isDefault: hidden.length === 0 && Object.keys(widths).length === 0,
    }),
    [hidden, widths, toggle, setWidth, reset, ready],
  );

  return <ColumnPreferencesContext.Provider value={value}>{children}</ColumnPreferencesContext.Provider>;
}
