'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { changeLocale } from '@/infrastructure/adapters/input/web/action/LocaleActions';
import { SUPPORTED_LOCALES } from '@/infrastructure/i18n/Locale';
import { GlobeIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import { useTranslation } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Ledger.module.css';

/** Language combo. Picking one stores the choice and re-renders the screen on the server. */
export function LanguagePicker() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [switching, startTransition] = useTransition();

  return (
    <div className={styles.languageField}>
      <span className={styles.languageIcon}>
        <GlobeIcon />
      </span>
      <select
        className={styles.languageSelect}
        aria-label={t('language.label')}
        value={locale}
        disabled={switching}
        onChange={(event) => {
          const chosen = event.target.value;
          startTransition(async () => {
            await changeLocale(chosen);
            router.refresh();
          });
        }}
      >
        {SUPPORTED_LOCALES.map((supported) => (
          <option key={supported} value={supported}>
            {t(`language.${supported}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
