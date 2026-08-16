export const SUPPORTED_LOCALES = ['es', 'en'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Spanish is the language the application opens with when nothing else is chosen. */
export const DEFAULT_LOCALE: Locale = 'es';

/** Name of the cookie that remembers the visitor's choice. */
export const LOCALE_COOKIE = 'locale';

export function isSupportedLocale(value: string | undefined | null): value is Locale {
  return value !== undefined && value !== null && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
