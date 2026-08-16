import type { Locale } from '@/infrastructure/i18n/Locale';

export type Messages = Readonly<Record<string, string>>;

/**
 * Resolves message keys against a bundle. It runs on the server and, once the bundle
 * travels inside the rendered payload, on the client too, so both sides produce the
 * exact same text and nothing has to be re-fetched in the browser.
 */
export interface Translator {
  readonly locale: Locale;
  /** Returns the message for `key`, replacing `{0}`, `{1}`, ... with `params`. */
  t(key: string, params?: readonly (string | number)[]): string;
}

export function createTranslator(locale: Locale, messages: Messages): Translator {
  return {
    locale,
    t(key, params = []) {
      // A missing key surfaces as the key itself: visible while developing, harmless in use.
      const template = messages[key] ?? key;
      return template.replace(/\{(\d+)\}/g, (match, index: string) => {
        const value = params[Number(index)];
        return value === undefined ? match : String(value);
      });
    },
  };
}

/** Formats a date with the pattern from the bundle. Tokens: `yyyy`, `MM`, `dd`, `HH`, `mm`. */
export function formatPattern(pattern: string, date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  const tokens: Record<string, string> = {
    yyyy: String(date.getFullYear()),
    MM: pad(date.getMonth() + 1),
    dd: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
  };
  return pattern.replace(/yyyy|MM|dd|HH|mm/g, (token) => tokens[token] ?? token);
}

function groupDigits(digits: string, groupSeparator: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
}

/**
 * Formats an exact decimal held as text, never converting it to a number. A thirteen
 * digit amount comes out exactly as it was stored.
 */
export function formatDecimal(amount: string, groupSeparator: string, decimalSeparator: string): string {
  const negative = amount.startsWith('-');
  const absolute = negative ? amount.slice(1) : amount;
  const [integerPart, decimalPart] = absolute.split('.');
  const grouped = groupDigits(integerPart ?? '0', groupSeparator);
  const decimals = ((decimalPart ?? '') + '00').slice(0, Math.max(2, (decimalPart ?? '').length));
  // U+2212 minus sign: same width as the digits in a monospaced face, unlike a hyphen.
  return `${negative ? '−' : ''}${grouped}${decimalSeparator}${decimals}`;
}

export function formatInteger(value: number, groupSeparator: string): string {
  return groupDigits(String(value), groupSeparator);
}
