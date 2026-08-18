'use client';

import { useState } from 'react';

import type { ErrorModel } from '@/domain/entity/ErrorModel';
import { createMovement, editMovement } from '@/infrastructure/adapters/input/web/action/MovementCommandActions';
import type { MovementFormInput } from '@/infrastructure/adapters/input/web/view/MovementFormInput';
import type { MovementView } from '@/infrastructure/adapters/input/web/view/MovementView';
import { DateField } from '@/infrastructure/adapters/input/web/component/DateField';
import { Dialog } from '@/infrastructure/adapters/input/web/component/Dialog';
import { AlertIcon } from '@/infrastructure/adapters/input/web/component/Icon';
import { SuggestField } from '@/infrastructure/adapters/input/web/component/SuggestField';
import { TimeField } from '@/infrastructure/adapters/input/web/component/TimeField';
import { useTranslation } from '@/infrastructure/adapters/input/web/component/TranslationProvider';
import styles from '@/infrastructure/adapters/input/web/component/Dialog.module.css';

const FORM_ID = 'movement-form';

function nowForInput(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * The form holds `2026-08-14T09:41` in one string and edits it with two controls: the
 * ledger's own calendar for the date and a clock field for the time. The halves are split
 * on the way in and joined on the way out, so what the command receives keeps the shape
 * the validator expects.
 */
function dateOf(dateTime: string): string {
  return /^\d{4}-\d{2}-\d{2}/.exec(dateTime)?.[0] ?? '';
}

function timeOf(dateTime: string): string {
  return /T(\d{2}:\d{2})/.exec(dateTime)?.[1] ?? '';
}

/**
 * An empty date empties the whole value, so the movement is turned away for having no date
 * instead of being filed on a day nobody chose. An empty clock is read as midnight, which
 * is what a date with no time given means.
 */
function joinDateTime(date: string, time: string): string {
  return date === '' ? '' : `${date}T${time === '' ? '00:00' : time}`;
}

/**
 * A new movement only arrives with a currency already filled in when the ledger leaves no
 * room for doubt — that is, when every movement in it uses the same one. With two or more
 * in play there is nothing to infer, and guessing would quietly file the movement under
 * the wrong currency, so the field is left for whoever is loading it.
 */
function defaultCurrency(currencies: readonly string[]): string {
  return currencies.length === 1 ? (currencies[0] ?? '') : '';
}

function initialState(movement: MovementView | null, currencies: readonly string[]): MovementFormInput {
  if (movement === null) {
    return {
      dateTime: nowForInput(),
      description: '',
      currency: defaultCurrency(currencies),
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
  /**
   * The bank entities and currencies already in use, the same lists the filter combos
   * offer. They are suggestions, not a closed set: a value the ledger has never seen is
   * typed straight into the field, and shows up in both places from then on.
   */
  readonly entities: readonly string[];
  readonly currencies: readonly string[];
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export function MovementDialog({ movement, entities, currencies, onClose, onSaved }: MovementDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<MovementFormInput>(() => initialState(movement, currencies));
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
          <label className={styles.label} htmlFor="field-date">
            {t('field.date-time')}
          </label>
          {/* The same calendar the filter bar uses, so a date is picked the same way on
              both screens; the clock keeps its own field beside it. */}
          <div className={styles.dateTimeRow}>
            <DateField
              id="field-date"
              fill
              clearable={false}
              label={t('field.date-time')}
              value={dateOf(form.dateTime)}
              onChange={(isoDate) => set('dateTime', joinDateTime(isoDate, timeOf(form.dateTime)))}
            />
            <TimeField
              id="field-time"
              fill
              label={t('field.time')}
              value={timeOf(form.dateTime)}
              onChange={(time) => set('dateTime', joinDateTime(dateOf(form.dateTime), time))}
            />
          </div>
          {fieldError('dateTime') !== null && <span className={styles.fieldError}>{fieldError('dateTime')}</span>}
        </div>

        <div className={`${styles.field} ${styles.spanCurrency}`}>
          <label className={styles.label} htmlFor="field-currency">
            {t('field.currency')}
          </label>
          <SuggestField
            id="field-currency"
            value={form.currency}
            suggestions={currencies}
            maxLength={10}
            invalid={fieldError('currency') !== null}
            inputClassName="mono"
            onChange={(value) => set('currency', value.toUpperCase())}
          />
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
          <SuggestField
            id="field-bank-entity"
            value={form.bankEntityId}
            suggestions={entities}
            maxLength={100}
            placeholder={t('field.bank-entity.placeholder')}
            invalid={fieldError('bankEntityId') !== null}
            inputClassName="mono"
            onChange={(value) => set('bankEntityId', value)}
          />
          {fieldError('bankEntityId') === null ? (
            entities.length > 0 && <span className={styles.hint}>{t('field.bank-entity.hint')}</span>
          ) : (
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
