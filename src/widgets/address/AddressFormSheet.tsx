import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { FiX } from 'react-icons/fi';
import {
  addressStore,
  LABEL_TEXT,
  type AddressLabel,
  type DeliveryAddress,
} from '@shared/stores/addressStore';
import { CdekPickup, type PickupPoint } from '@widgets/CdekPickup/CdekPickup';
import styles from './AddressFormSheet.module.scss';

const LABELS: AddressLabel[] = ['home', 'work', 'other'];

/** Убирает название города из начала адреса ПВЗ, чтобы не дублировать его. */
function shortAddress(address: string, city?: string): string {
  if (!city) return address;
  const index = address.toLowerCase().indexOf(city.toLowerCase());
  if (index < 0 || index > 12) return address;
  const rest = address
    .slice(index + city.length)
    .replace(/^[\s,]+/, '')
    .trim();
  return rest || address;
}

interface FormState {
  label: AddressLabel;
  recipientName: string;
  phone: string;
  region: string;
  city: string;
  street: string;
  house: string;
  apartment: string;
  entrance: string;
  floor: string;
  intercom: string;
  postalCode: string;
  comment: string;
  isDefault: boolean;
}

const EMPTY: FormState = {
  label: 'home',
  recipientName: '',
  phone: '',
  region: '',
  city: '',
  street: '',
  house: '',
  apartment: '',
  entrance: '',
  floor: '',
  intercom: '',
  postalCode: '',
  comment: '',
  isDefault: false,
};

function fromAddress(a: DeliveryAddress): FormState {
  return {
    label: a.label,
    recipientName: a.recipientName,
    phone: a.phone,
    region: a.region ?? '',
    city: a.city,
    street: a.street,
    house: a.house,
    apartment: a.apartment ?? '',
    entrance: a.entrance ?? '',
    floor: a.floor ?? '',
    intercom: a.intercom ?? '',
    postalCode: a.postalCode ?? '',
    comment: a.comment ?? '',
    isDefault: a.isDefault,
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: 'text' | 'tel' | 'numeric';
  required?: boolean;
  error?: boolean;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {required && <span className={styles.req}>*</span>}
      </span>
      <input
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

const PICKUP_COMMENT = /^СДЭК,\s*(.*)\s*\(код\s*([^)]+)\)$/;

function pickupFromAddress(a?: DeliveryAddress): PickupPoint | null {
  const match = a?.comment?.match(PICKUP_COMMENT);
  if (!match) return null;
  return {
    name: match[1],
    code: match[2],
    city: a?.city,
    address: a?.street,
  };
}

function AddressFormSheet() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [pickupPoint, setPickupPoint] = useState<PickupPoint | null>(null);

  const editingId = addressStore.editingId;

  useEffect(() => {
    if (!addressStore.formOpen) return;
    const editing = addressStore.editing;
    setForm(editing ? fromAddress(editing) : EMPTY);
    setPickupPoint(pickupFromAddress(editing));
    setTouched(false);
  }, [addressStore.formOpen, editingId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handlePickup = (point: PickupPoint) => {
    setPickupPoint(point);
    setForm((f) => ({
      ...f,
      city: point.city ?? f.city,
      street: shortAddress(point.address ?? point.name, point.city),
      house: '',
      comment: `СДЭК, ${point.name} (код ${point.code})`,
    }));
  };

  const invalid = {
    recipientName: !form.recipientName.trim(),
    phone: !form.phone.trim(),
    city: !form.city.trim(),
    street: !form.street.trim(),
  };
  const hasErrors = Object.values(invalid).some(Boolean);

  const submit = async () => {
    setTouched(true);
    if (hasErrors || addressStore.saving) return;
    await addressStore.save({
      label: form.label,
      recipientName: form.recipientName.trim(),
      phone: form.phone.trim(),
      region: form.region.trim() || undefined,
      city: form.city.trim(),
      street: form.street.trim(),
      house: form.house.trim(),
      apartment: form.apartment.trim() || undefined,
      entrance: form.entrance.trim() || undefined,
      floor: form.floor.trim() || undefined,
      intercom: form.intercom.trim() || undefined,
      postalCode: form.postalCode.trim() || undefined,
      comment: form.comment.trim() || undefined,
      isDefault: form.isDefault,
    });
  };

  return (
    <AnimatePresence>
      {addressStore.formOpen && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => addressStore.closeForm()}
          />
          <motion.div
            className={styles.sheet}
            initial={{ y: '100%', scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: '100%', scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.handle} />
            <button
              className={styles.close}
              onClick={() => addressStore.closeForm()}
              aria-label="Закрыть"
            >
              <FiX size={18} />
            </button>

            <h2 className={styles.title}>
              {editingId ? 'Изменить адрес' : 'Новый адрес'}
            </h2>

            <div className={styles.field}>
              <span className={styles.fieldLabel}>Название</span>
              <div className={styles.chips}>
                {LABELS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={styles.chipDisabled}
                    disabled
                  >
                    {LABEL_TEXT[label]}
                  </button>
                ))}
              </div>
              <p className={styles.soonNote}>Скоро откроется</p>
            </div>

            <Field
              label="Получатель"
              value={form.recipientName}
              onChange={(v) => set('recipientName', v)}
              placeholder="Имя и фамилия"
              required
              error={touched && invalid.recipientName}
            />
            <Field
              label="Телефон"
              value={form.phone}
              onChange={(v) => set('phone', v)}
              placeholder="+7 999 000-00-00"
              type="tel"
              inputMode="tel"
              required
              error={touched && invalid.phone}
            />

            <div className={styles.field}>
              <span className={styles.fieldLabel}>
                Пункт выдачи
                <span className={styles.req}>*</span>
              </span>
              <CdekPickup onSelect={handlePickup} showSelected={false} />

              {pickupPoint ? (
                <div className={styles.pickupCard}>
                  <span className={styles.pickupName}>{pickupPoint.name}</span>
                  {(pickupPoint.city || pickupPoint.address) && (
                    <span className={styles.pickupAddress}>
                      {pickupPoint.city && `${pickupPoint.city}, `}
                      {pickupPoint.address}
                    </span>
                  )}
                  <span className={styles.pickupCode}>
                    Код ПВЗ: {pickupPoint.code}
                  </span>
                </div>
              ) : editingId && form.city && form.street ? (
                <div className={styles.pickupCard}>
                  <span className={styles.pickupName}>Текущий адрес</span>
                  <span className={styles.pickupAddress}>
                    {form.city}, {form.street}
                  </span>
                </div>
              ) : null}

              {touched && (invalid.city || invalid.street) && (
                <p className={styles.fieldError}>Выберите пункт выдачи</p>
              )}
            </div>

            <button
              type="button"
              className={styles.defaultToggle}
              onClick={() => set('isDefault', !form.isDefault)}
            >
              <span
                className={`${styles.checkbox} ${form.isDefault ? styles.checkboxOn : ''}`}
              >
                {form.isDefault && <span className={styles.checkmark}>✓</span>}
              </span>
              <span>Сделать основным адресом</span>
            </button>

            {touched && hasErrors && (
              <p className={styles.error}>
                Укажите получателя, телефон и пункт выдачи.
              </p>
            )}

            {addressStore.error && (
              <p className={styles.error}>{addressStore.error}</p>
            )}

            <button
              className={styles.submitBtn}
              onClick={submit}
              disabled={addressStore.saving}
            >
              {addressStore.saving
                ? 'Сохранение…'
                : editingId
                  ? 'Сохранить'
                  : 'Добавить адрес'}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default observer(AddressFormSheet);
