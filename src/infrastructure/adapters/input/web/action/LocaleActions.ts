'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { DEFAULT_LOCALE, isSupportedLocale, LOCALE_COOKIE } from '@/infrastructure/i18n/Locale';

/** A year: long enough that the choice sticks, short enough to expire on an abandoned browser. */
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/**
 * Stores the chosen language and asks the server to render the screen again.
 * Everything visible is produced on the server, so switching language is a re-render,
 * not a second copy of the interface shipped to the browser.
 */
export async function changeLocale(locale: string): Promise<void> {
  (await cookies()).set(LOCALE_COOKIE, isSupportedLocale(locale) ? locale : DEFAULT_LOCALE, {
    maxAge: ONE_YEAR_IN_SECONDS,
    path: '/',
    sameSite: 'lax',
  });
  revalidatePath('/');
}
