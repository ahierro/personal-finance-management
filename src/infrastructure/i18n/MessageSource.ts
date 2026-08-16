import 'server-only';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { DEFAULT_LOCALE, type Locale } from '@/infrastructure/i18n/Locale';
import { parseProperties } from '@/infrastructure/i18n/PropertiesParser';
import type { Messages } from '@/infrastructure/i18n/Translator';

const MESSAGES_DIRECTORY = path.join(process.cwd(), 'messages');

/**
 * Parsed bundles are kept for the life of the process. In development the cache is off,
 * so editing a `.properties` file shows up on the next reload instead of after a restart.
 */
const cache = new Map<Locale, Messages>();
const cacheEnabled = process.env.NODE_ENV === 'production';

function readBundle(locale: Locale): Messages {
  return parseProperties(readFileSync(path.join(MESSAGES_DIRECTORY, `${locale}.properties`), 'utf8'));
}

/**
 * Loads the `.properties` bundles, the same way Spring's MessageSource does in the
 * reference project. A translation missing from a bundle falls back to the default
 * language instead of leaving a raw key on screen.
 */
export const MessageSource = {
  getMessages(locale: Locale): Messages {
    const cached = cache.get(locale);
    if (cached !== undefined) {
      return cached;
    }

    const bundle =
      locale === DEFAULT_LOCALE
        ? readBundle(DEFAULT_LOCALE)
        : { ...readBundle(DEFAULT_LOCALE), ...readBundle(locale) };

    if (cacheEnabled) {
      cache.set(locale, bundle);
    }
    return bundle;
  },
};
