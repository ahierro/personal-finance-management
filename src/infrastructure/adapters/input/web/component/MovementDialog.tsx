'use client';

import { useState } from 'react';

import type { ErrorModel } from '@/domain/entity/ErrorModel';
import { createMovement, editMovement } from '@/infrastructure/adapters/input/web/action/MovementCommandActions';
import type { MovementFormInput } from '@/infrastructure/adapters/input/web/view/MovementFormInput';
import type { MovementView } from '@/infrastructure/adapters/input/web/view/MovementView';
import { Dialog } from '@/infrastructure/adapters/input/web/component/Dialog';
import { AlertIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import { useTranslation } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Dialog.module.css';

const FORM_ID = 'movement-form';

/** Suggested currencies; the field accepts any code. */
const CURRENCIES = ['ARS', 'USD', 'EUR', 'BRL', 'UYU'] as const;

function nowForInput(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function initialState(movement: MovementView | null): MovementFormInput {
  if (movement === null) {
    return {
      dateTime: nowForInput(),
      description: '',
      currency: 'ARS',
      amount: '',
      receiptId: '',
      bankEntityId: '',
    };
  }
  return {
    dateTime: movement.dateTimeInput,
    description: movement.description,
    currency: movement.currency,
    amount: movement.amount,
    receiptId: movement.receiptId,
    bankEntityId: movement.bankEntityId,
  };
}

interface MovementDialogProps {
  /** `null` to create; a movement to edit it. */
  readonly movement: MovementView | null;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export function MovementDialog({ movement, onClose, onSaved }: MovementDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<MovementFormInput>(() => initialState(movement));
  const [error, setError] = useState<ErrorModel | null>(null);
  const [saving, setSaving] = useState(false);

  const editing = movement !== null;

  function set<K extends keyof MovementFormInput>(field: K, value: MovementFormInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const result = editing ? await editMovement(movement.id, form) : await createMovement(form);
    setSaving(false);
    if (result.ok) {
      onSaved();
    } else {
      setError(result.error);
    }
  }

  /** A field's error shows right under that field; anything else goes to the banner on top. */
  const fieldError = (field: string): string | null =>
    error !== null && error.field === field ? error.moreInformation : null;
  const generalError = error !== null && error.field === undefined ? error : null;

  const inputClass = (field: string) =>
    fieldError(field) === null ? styles.input : `${styles.input} ${styles.inputError}`;

  return (
    <Dialog
      title={editing ? t('dialog.edit.title') : t('dialog.create.title')}
      subtitle={editing ? t('dialog.edit.subtitle', [movement.id]) : undefined}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={styles.buttonQuiet} onClick={onClose} disabled={saving}>
            {t('action.cancel')}
          </button>
          <button type="submit" form={FORM_ID} className={styles.buttonPrimary} disabled={saving}>
            {saving && <span className={styles.spinner} />}
            {editing ? t('action.save-changes') : t('action.save-movement')}
          </button>
        </>
      }
    >
      {generalError !== null && (
        <div className={styles.banner} role="alert">
          <span className={styles.bannerIcon}>
            <AlertIcon size={15} />
          </span>
          <span>{generalError.moreInformation}</span>
        </div>
      )}

      <form id={FORM_ID} className={styles.grid} onSubmit={handleSubmit} noValidate>
        <div className={`${styles.field} ${styles.spanDateTime}`}>
          <label className={styles.label} htmlFor="field-date-time">
            {t('field.date-time')}
          </label>
          <input
            id="field-date-time"
            type="datetime-local"
            className={`${inputClass('dateTime')} mono`}
            value={form.dateTime}
            onChange={(event) => set('dateTime', event.target.value)}
          />
          {fieldError('dateTime') !== null && <span className={styles.fieldError}>{fieldError('dateTime')}</span>}
        </div>

        <div className={`${styles.field} ${styles.spanCurrency}`}>
          <label className={styles.label} htmlFor="field-currency">
            {t('field.currency')}
          </label>
          <input
            id="field-currency"
            list="currency-suggestions"
            className={`${inputClass('currency')} mono`}
            value={form.currency}
            maxLength={10}
            autoComplete="off"
            onChange={(event) => set('currency', event.target.value.toUpperCase())}
          />
          <datalist id="currency-suggestions">
            {CURRENCIES.map((currency) => (
              <option key={currency} value={currency} />
            ))}
          </datalist>
          {fieldError('currency') !== null && <span className={styles.fieldError}>{fieldError('currency')}</span>}
        </div>

        <div className={`${styles.field} ${styles.spanAmount}`}>
          <label className={styles.label} htmlFor="field-amount">
            {t('field.amount')}
          </label>
          <input
            id="field-amount"
            inputMode="decimal"
            placeholder={t('field.amount.placeholder')}
            className={`${inputClass('amount')} ${styles.inputAmount} mono`}
            value={form.amount}
            autoComplete="off"
            onChange={(event) => set('amount', event.target.value)}
          />
          {fieldError('amount') === null ? (
            <span className={styles.hint}>{t('field.amount.hint')}</span>
          ) : (
            <span className={styles.fieldError}>{fieldError('amount')}</span>
          )}
        </div>

        <div className={`${styles.field} ${styles.spanFull}`}>
          <label className={styles.label} htmlFor="field-description">
            {t('field.description')}
          </label>
          <input
            id="field-description"
            type="text"
            className={inputClass('description')}
            value={form.description}
            maxLength={500}
            placeholder={t('field.description.placeholder')}
            onChange={(event) => set('description', event.target.value)}
          />
          {fieldError('description') !== null && <span className={styles.fieldError}>{fieldError('description')}</span>}
        </div>

        <div className={`${styles.field} ${styles.spanHalf}`}>
          <label className={styles.label} htmlFor="field-bank-entity">
            {t('field.bank-entity')}
          </label>
          <input
            id="field-bank-entity"
            type="text"
            className={`${inputClass('bankEntityId')} mono`}
            value={form.bankEntityId}
            maxLength={100}
            placeholder={t('field.bank-entity.placeholder')}
            autoComplete="off"
            onChange={(event) => set('bankEntityId', event.target.value)}
          />
          {fieldError('bankEntityId') !== null && (
            <span className={styles.fieldError}>{fieldError('bankEntityId')}</span>
          )}
        </div>

        <div className={`${styles.field} ${styles.spanHalf}`}>
          <label className={styles.label} htmlFor="field-receipt">
            {t('field.receipt')}
            <span className={styles.labelOptional}>{t('field.optional')}</span>
          </label>
          <input
            id="field-receipt"
            type="text"
            className={`${inputClass('receiptId')} mono`}
            value={form.receiptId}
            maxLength={100}
            placeholder={t('field.receipt.placeholder')}
            autoComplete="off"
            onChange={(event) => set('receiptId', event.target.value)}
          />
          {fieldError('receiptId') !== null && <span className={styles.fieldError}>{fieldError('receiptId')}</span>}
        </div>
      </form>
    </Dialog>
  );
}
