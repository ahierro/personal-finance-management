'use client';

import { createContext, useContext, useMemo } from 'react';

import type { Locale } from '@/infrastructure/i18n/Locale';
import { createTranslator, type Messages, type Translator } from '@/infrastructure/i18n/Translator';

const TranslationContext = createContext<Translator | null>(null);

/**
 * Hands the message bundle to the interactive parts of the screen.
 *
 * The server reads the `.properties` file and passes the resolved bundle down once, in
 * the render payload. Client components read it from here, so a dialog opens already
 * translated with no request of its own.
 */
export function TranslationProvider({
  locale,
  messages,
  children,
}: {
  readonly locale: Locale;
  readonly messages: Messages;
  readonly children: React.ReactNode;
}) {
  const translator = useMemo(() => createTranslator(locale, messages), [locale, messages]);
  return <TranslationContext.Provider value={translator}>{children}</TranslationContext.Provider>;
}

export function useTranslation(): Translator {
  const translator = useContext(TranslationContext);
  if (translator === null) {
    throw new Error('useTranslation must be used inside TranslationProvider');
  }
  return translator;
}
