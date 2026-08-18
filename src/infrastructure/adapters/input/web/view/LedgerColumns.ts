/**
 * The columns of the listing, in the order they are rendered.
 *
 * This is the single list the three sides of the table agree on: the server draws the
 * header and the cells from it, the picker builds one checkbox per entry, and the widths
 * travel to CSS as custom properties named after the id. Adding a column means adding it
 * here and rendering its cell in `MovementTable`.
 */

export type LedgerColumnId = 'date' | 'description' | 'receipt' | 'entity' | 'amount';

export interface LedgerColumn {
  readonly id: LedgerColumnId;
  /** Message key of the header label, shared with the picker's checkbox. */
  readonly labelKey: string;
  readonly defaultWidth: number;
  /** Floor for the drag: below this the content is no longer readable. */
  readonly minWidth: number;
  readonly maxWidth: number;
}

export const LEDGER_COLUMNS: readonly LedgerColumn[] = [
  // Wide enough for a full date; the time is kept in the database but never rendered.
  { id: 'date', labelKey: 'table.column.date', defaultWidth: 124, minWidth: 96, maxWidth: 420 },
  { id: 'description', labelKey: 'table.column.description', defaultWidth: 340, minWidth: 120, maxWidth: 900 },
  { id: 'receipt', labelKey: 'table.column.receipt', defaultWidth: 132, minWidth: 80, maxWidth: 420 },
  { id: 'entity', labelKey: 'table.column.entity', defaultWidth: 152, minWidth: 80, maxWidth: 420 },
  { id: 'amount', labelKey: 'table.column.amount', defaultWidth: 208, minWidth: 120, maxWidth: 520 },
];

/** The row-actions column: never hidden, never dragged, but part of the table's width. */
export const ACTIONS_COLUMN_WIDTH = 86;

/** The CSS custom property that carries a column's width to the stylesheet. */
export function columnWidthVariable(id: LedgerColumnId): string {
  return `--col-${id}-width`;
}

/**
 * How wide the table's columns come out in total. The masthead, the filter bar and the
 * footer are held to this width so the whole screen lines up with the centred table
 * instead of spreading to the edges around it.
 */
export function totalColumnsWidth(
  hidden: readonly LedgerColumnId[],
  widths: Readonly<Partial<Record<LedgerColumnId, number>>>,
): number {
  const columns = LEDGER_COLUMNS.filter((column) => !hidden.includes(column.id)).reduce(
    (total, column) => total + (widths[column.id] ?? column.defaultWidth),
    0,
  );
  return columns + ACTIONS_COLUMN_WIDTH;
}

export function findColumn(id: LedgerColumnId): LedgerColumn | undefined {
  return LEDGER_COLUMNS.find((column) => column.id === id);
}

/** Keeps a dragged width inside the column's own bounds. */
export function clampWidth(id: LedgerColumnId, width: number): number {
  const column = findColumn(id);
  if (column === undefined) {
    return width;
  }
  return Math.min(Math.max(Math.round(width), column.minWidth), column.maxWidth);
}
