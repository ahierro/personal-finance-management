'use client';

import { useRef, useState } from 'react';

import { clampWidth, findColumn, type LedgerColumnId } from '@/infrastructure/adapters/input/web/view/LedgerColumns';
import { useColumnPreferences } from '@/infrastructure/adapters/input/web/component/ColumnPreferencesProvider';
import { useTranslation } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Ledger.module.css';

/** How much one arrow key moves the edge, for resizing without a mouse. */
const KEYBOARD_STEP = 16;

interface ColumnResizeHandleProps {
  readonly column: LedgerColumnId;
  /** The column's header label, so the handle can name what it resizes. */
  readonly label: string;
}

/**
 * The grip on the right edge of a header cell.
 *
 * The drag starts from the width the column actually has on screen, not from the stored
 * one, so the first pull of a column still at its default does not make it jump. Pointer
 * capture keeps the events coming while the cursor runs ahead of the edge or leaves the
 * window altogether.
 */
export function ColumnResizeHandle({ column, label }: ColumnResizeHandleProps) {
  const { t } = useTranslation();
  const { widths, setWidth } = useColumnPreferences();
  const [dragging, setDragging] = useState(false);
  // The drag lives in a ref, not in state: the first `pointermove` can arrive before a
  // state update has been applied, and a move read against a stale `false` would be
  // thrown away. The state below only drives how the grip looks.
  const origin = useRef<{ x: number; width: number } | null>(null);

  function currentWidth(handle: HTMLElement): number {
    const cell = handle.closest('th');
    return cell?.getBoundingClientRect().width ?? findColumn(column)?.defaultWidth ?? 0;
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    // Only the primary button drags; a right click should not start a resize.
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    const handle = event.currentTarget;
    origin.current = { x: event.clientX, width: currentWidth(handle) };
    setDragging(true);
    // Set last: the drag is already armed, so a browser that refuses the capture still
    // resizes while the pointer is over the grip.
    handle.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const start = origin.current;
    if (start === null) {
      return;
    }
    setWidth(column, start.width + (event.clientX - start.x));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (origin.current === null) {
      return;
    }
    origin.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.key === 'ArrowLeft' ? -KEYBOARD_STEP : event.key === 'ArrowRight' ? KEYBOARD_STEP : 0;
    if (step === 0) {
      return;
    }
    event.preventDefault();
    const base = widths[column] ?? currentWidth(event.currentTarget);
    setWidth(column, base + step);
  }

  const definition = findColumn(column);
  const width = widths[column] ?? definition?.defaultWidth;

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={t('columns.resize', [label])}
      aria-valuenow={width === undefined ? undefined : clampWidth(column, width)}
      aria-valuemin={definition?.minWidth}
      aria-valuemax={definition?.maxWidth}
      tabIndex={0}
      className={`${styles.resizeHandle} ${dragging ? styles.resizeHandleActive : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      onDoubleClick={() => {
        if (definition !== undefined) {
          setWidth(column, definition.defaultWidth);
        }
      }}
    >
      <span className={styles.resizeHandleLine} aria-hidden="true" />
    </div>
  );
}
