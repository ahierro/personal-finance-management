'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState, useTransition } from 'react';

import type { MovementView } from '@/infrastructure/adapters/input/web/view/MovementView';
import { DeleteMovementDialog } from '@/infrastructure/adapters/input/web/component/DeleteMovementDialog';
import { MovementDialog } from '@/infrastructure/adapters/input/web/component/MovementDialog';

type OpenDialog =
  | { readonly kind: 'none' }
  | { readonly kind: 'create' }
  | { readonly kind: 'edit'; readonly movement: MovementView }
  | { readonly kind: 'delete'; readonly movement: MovementView };

interface LedgerContextValue {
  readonly openCreate: () => void;
  readonly openEdit: (movement: MovementView) => void;
  readonly openDelete: (movement: MovementView) => void;
  /** Changes the listing URL; the server returns the new page. */
  readonly navigate: (href: string, replace?: boolean) => void;
  /** `true` while the server puts the requested page together. */
  readonly navigating: boolean;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

export function useLedger(): LedgerContextValue {
  const value = useContext(LedgerContext);
  if (value === null) {
    throw new Error('useLedger must be used inside MovementLedgerProvider');
  }
  return value;
}

/**
 * Island of interactivity around the server-rendered table.
 *
 * The dialogs are mounted once here rather than once per row, and every navigation goes
 * through the same place so the loading indicator has a single source of truth.
 */
export function MovementLedgerProvider({ children }: { readonly children: React.ReactNode }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<OpenDialog>({ kind: 'none' });
  const [navigating, startTransition] = useTransition();

  const navigate = useCallback(
    (href: string, replace = false) => {
      startTransition(() => {
        if (replace) {
          router.replace(href, { scroll: false });
        } else {
          router.push(href, { scroll: false });
        }
      });
    },
    [router],
  );

  const close = useCallback(() => setDialog({ kind: 'none' }), []);

  const refreshAndClose = useCallback(() => {
    setDialog({ kind: 'none' });
    startTransition(() => router.refresh());
  }, [router]);

  const value = useMemo<LedgerContextValue>(
    () => ({
      openCreate: () => setDialog({ kind: 'create' }),
      openEdit: (movement) => setDialog({ kind: 'edit', movement }),
      openDelete: (movement) => setDialog({ kind: 'delete', movement }),
      navigate,
      navigating,
    }),
    [navigate, navigating],
  );

  return (
    <LedgerContext.Provider value={value}>
      {children}

      {dialog.kind === 'create' && <MovementDialog movement={null} onClose={close} onSaved={refreshAndClose} />}
      {dialog.kind === 'edit' && (
        <MovementDialog movement={dialog.movement} onClose={close} onSaved={refreshAndClose} />
      )}
      {dialog.kind === 'delete' && (
        <DeleteMovementDialog movement={dialog.movement} onClose={close} onDeleted={refreshAndClose} />
      )}
    </LedgerContext.Provider>
  );
}
