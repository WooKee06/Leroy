import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  FiBox,
  FiBriefcase,
  FiHome,
  FiMapPin,
  FiPlus,
  FiSend,
  FiShoppingBag,
  FiStar,
  FiTag,
  FiTrash2,
  FiTruck,
  FiEdit2,
  FiClock,
} from 'react-icons/fi';
import PageContainer from '@shared/ui/PageContainer';
import PageHeader from '@shared/ui/PageHeader';
import {
  addressStore,
  DELIVERY_OPTIONS,
  LABEL_TEXT,
  type DeliveryAddress,
  type DeliveryKind,
} from '@shared/stores/addressStore';
import AddressFormSheet from '@widgets/address/AddressFormSheet';
import styles from './AddressesPage.module.scss';

const KIND_ICON: Record<DeliveryKind, React.ReactNode> = {
  pickup_point: <FiMapPin size={18} />,
  postamat: <FiBox size={18} />,
  courier: <FiTruck size={18} />,
  post: <FiSend size={18} />,
  store_pickup: <FiShoppingBag size={18} />,
};

const LABEL_ICON: Record<string, React.ReactNode> = {
  home: <FiHome size={13} />,
  work: <FiBriefcase size={13} />,
  other: <FiTag size={13} />,
};

function formatAddress(a: DeliveryAddress): string {
  const parts = [`${a.city}, ${a.street} ${a.house}`];
  if (a.apartment) parts.push(`кв./офис ${a.apartment}`);
  if (a.postalCode) parts.push(a.postalCode);
  return parts.join(', ');
}

function AddressesPage() {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    addressStore.load();
  }, []);

  return (
    <div className={`page-wrapper ${styles.page}`}>
      <PageContainer>
        <PageHeader title="Адреса доставки" />

        <p className={styles.subtitle}>
          Сохраните адреса, чтобы быстрее оформлять заказы. Для ПВЗ и постаматов
          точка выбирается при оформлении.
        </p>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Способы доставки</div>
          <div className={styles.options}>
            {DELIVERY_OPTIONS.map((option) => (
              <div key={option.id} className={styles.option}>
                <span className={styles.optionIcon}>
                  {KIND_ICON[option.kind]}
                </span>
                <div className={styles.optionMain}>
                  <span className={styles.optionTitle}>{option.title}</span>
                  <span className={styles.optionDesc}>{option.desc}</span>
                </div>
                <div className={styles.optionMeta}>
                  <span className={styles.optionPrice}>
                    {option.price === 0
                      ? 'Бесплатно'
                      : option.price === null
                        ? 'по тарифу'
                        : `${option.price.toLocaleString('ru-RU')} ₽`}
                  </span>
                  <span className={styles.optionEta}>
                    <FiClock size={12} />
                    {option.eta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Мои адреса</div>

          {addressStore.count === 0 ? (
            <div className={styles.empty}>
              <FiMapPin size={26} />
              <p className={styles.emptyTitle}>Пока нет адресов</p>
              <p className={styles.emptyText}>
                Добавьте первый адрес доставки
              </p>
            </div>
          ) : (
            <div className={styles.addresses}>
              {addressStore.addresses.map((a) => (
                <div key={a.id} className={styles.addressCard}>
                  <div className={styles.addressHead}>
                    <span className={styles.addressLabel}>
                      {LABEL_ICON[a.label]}
                      {LABEL_TEXT[a.label]}
                    </span>
                    {a.isDefault && (
                      <span className={styles.defaultBadge}>
                        <FiStar size={12} />
                        Основной
                      </span>
                    )}
                  </div>

                  <div className={styles.addressBody}>
                    <span className={styles.recipient}>
                      {a.recipientName}
                      {a.phone && (
                        <span className={styles.phone}> · {a.phone}</span>
                      )}
                    </span>
                    <span className={styles.addressLine}>{formatAddress(a)}</span>
                    {(a.entrance || a.floor || a.intercom || a.comment) && (
                      <span className={styles.addressExtra}>
                        {[
                          a.entrance && `подъезд ${a.entrance}`,
                          a.floor && `этаж ${a.floor}`,
                          a.intercom && `домофон ${a.intercom}`,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                        {a.comment ? ` · ${a.comment}` : ''}
                      </span>
                    )}
                  </div>

                  {pendingDelete === a.id ? (
                    <div className={styles.confirmRow}>
                      <span className={styles.confirmText}>Удалить адрес?</span>
                      <button
                        className={styles.confirmDelete}
                        onClick={() => {
                          addressStore.remove(a.id);
                          setPendingDelete(null);
                        }}
                      >
                        Удалить
                      </button>
                      <button
                        className={styles.confirmCancel}
                        onClick={() => setPendingDelete(null)}
                      >
                        Отмена
                      </button>
                    </div>
                  ) : (
                    <div className={styles.addressActions}>
                      {!a.isDefault && (
                        <button
                          className={styles.action}
                          onClick={() => addressStore.setDefault(a.id)}
                        >
                          <FiStar size={15} />
                          Сделать основным
                        </button>
                      )}
                      <button
                        className={styles.actionIcon}
                        onClick={() => addressStore.openForm(a.id)}
                        aria-label="Изменить"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        className={`${styles.actionIcon} ${styles.danger}`}
                        onClick={() => setPendingDelete(a.id)}
                        aria-label="Удалить"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            className={styles.addBtn}
            onClick={() => addressStore.openForm(null)}
          >
            <FiPlus size={18} />
            Добавить адрес
          </button>
        </div>
      </PageContainer>

      <AddressFormSheet />
    </div>
  );
}

export default observer(AddressesPage);
