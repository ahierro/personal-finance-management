import 'server-only';
import { cookies } from 'next/headers';

import { DEFAULT_LOCALE, isSupportedLocale, LOCALE_COOKIE, type Locale } from '@/infrastructure/i18n/Locale';
import { MessageSource } from '@/infrastructure/i18n/MessageSource';
import { createTranslator, type Messages, type Translator } from '@/infrastructure/i18n/Translator';

/**
 * Decides which language a request is answered in.
 *
 * Only the cookie is consulted. The browser's `Accept-Language` is deliberately ignored
 * so that a first visit always opens in Spanish, whatever the browser is set to.
 */
export const LocaleResolver = {
  async resolve(): Promise<Locale> {
    const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
    return isSupportedLocale(chosen) ? chosen : DEFAULT_LOCALE;
  },

  /** Locale, bundle and translator for the current request. */
  async load(): Promise<{ locale: Locale; messages: Messages; translator: Translator }> {
    const locale = await LocaleResolver.resolve();
    const messages = MessageSource.getMessages(locale);
    return { locale, messages, translator: createTranslator(locale, messages) };
  },
};
