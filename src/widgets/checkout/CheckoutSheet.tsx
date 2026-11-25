import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiCheck,
  FiChevronDown,
  FiMapPin,
  FiPlus,
  FiX,
} from "react-icons/fi";
import { checkoutStore } from "@shared/stores/checkoutStore";
import { cartStore } from "@shared/stores/cartStore";
import { accountStore } from "@shared/stores/accountStore";
import { addressStore } from "@shared/stores/addressStore";
import { deliveryStore } from "@shared/stores/deliveryStore";
import {
  DELIVERY_KIND_LABELS,
  formatDeliveryAmount,
  formatDeliveryEta,
} from "@shared/lib/delivery";
import styles from "./CheckoutSheet.module.scss";
import { useCallback, useState } from "react";
import { CdekPickup, type PickupPoint } from "../CdekPickup/CdekPickup";
import { formatAddress } from "@shared/lib/address";
import type { DeliveryAddress } from "@shared/stores/addressStore";

const PAYMENT_METHODS = [
  { id: "balance", label: "Официальный баланс", available: true },
  { id: "stars", label: "Telegram Stars", available: false },
];

function CheckoutSheet() {
  const navigate = useNavigate();

  const handleSelect = useCallback((point: PickupPoint) => {
    deliveryStore.selectPoint({
      code: point.code,
      name: point.name,
      address: point.address,
      city: point.city,
      cityCode: point.cityCode,
      type: point.type,
    });
  }, []);

  const handleCityChange = useCallback(
    (city: { code: number; city: string }) => {
      deliveryStore.setCity(city.city, city.code);
    },
    [],
  );

  const close = () => checkoutStore.close();

  const goToShop = () => {
    close();
    navigate("/");
  };

  return (
    <AnimatePresence>
      {checkoutStore.open && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            className={styles.sheet}
            initial={{ y: "100%", scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: "100%", scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.handle} />
            <button
              className={styles.close}
              onClick={close}
              aria-label="Закрыть"
            >
              <FiX size={18} />
            </button>

            {checkoutStore.step === "success" && checkoutStore.order ? (
              <div className={styles.success}>
                <div className={styles.successIcon}>
                  <FiCheck size={26} />
                </div>
                <h2 className={styles.title}>Заказ оплачен</h2>
                <p className={styles.successText}>
                  Заказ №{checkoutStore.order.orderNumber} на сумму{" "}
                  {checkoutStore.order.total.toLocaleString("ru-RU")} ₽ успешно
                  оплачен. Продавцы уже обрабатывают его.
                </p>
                <button className={styles.submitBtn} onClick={goToShop}>
                  К покупкам
                  <FiArrowRight size={16} />
                </button>
              </div>
            ) : checkoutStore.step === "processing" ? (
              <div className={styles.processing}>
                <div className={styles.spinner} />
                <h2 className={styles.title}>Оформляем заказ</h2>
                <p className={styles.processingText}>
                  Создаём заказ и готовим платёж… это займёт пару секунд
                </p>
              </div>
            ) : (
              <div className={styles.form}>
                <h2 className={styles.title}>Оформление заказа</h2>

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Способ доставки</span>
                  <div className={styles.deliveryOptions}>
                    {deliveryStore.options.map((option) => {
                      const active = option.kind === deliveryStore.selectedKind;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={
                            active
                              ? styles.deliveryOptionActive
                              : styles.deliveryOption
                          }
                          onClick={() => deliveryStore.selectKind(option.kind)}
                        >
                          <span className={styles.deliveryOptionMain}>
                            <span className={styles.deliveryOptionTitle}>
                              {option.title ??
                                DELIVERY_KIND_LABELS[option.kind]}
                            </span>
                            <span className={styles.deliveryOptionEta}>
                              {formatDeliveryEta(option)}
                            </span>
                          </span>
                          <span className={styles.deliveryOptionPrice}>
                            {option.price === 0
                              ? "Бесплатно"
                              : formatDeliveryAmount(
                                  option.price,
                                  option.currency,
                                )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {deliveryStore.loading && (
                    <p className={styles.deliveryHint}>
                      Рассчитываем доставку…
                    </p>
                  )}
                  {!deliveryStore.loading && deliveryStore.isFallback && (
                    <p className={styles.deliveryWarn}>
                      СДЭК недоступен — стоимость предварительная.
                    </p>
                  )}
                </div>

                {deliveryStore.needsPoint && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>
                      {deliveryStore.selectedKind === "postamat"
                        ? "Постамат"
                        : "Пункт выдачи"}
                    </span>
                    <CdekPickup
                      onSelect={handleSelect}
                      onCityChange={handleCityChange}
                    />
                  </div>
                )}

                {deliveryStore.needsPoint && (
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Адрес пункта</span>
                    <div className={styles.inputWrap}>
                      <FiMapPin size={16} className={styles.inputIcon} />
                      <input
                        className={styles.input}
                        placeholder="Выберите пункт выдачи выше"
                        value={deliveryStore.pointAddress}
                        readOnly
                      />
                    </div>
                  </div>
                )}

                <AddressSelector />

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Оплата</span>
                  <div className={styles.chips}>
                    {PAYMENT_METHODS.map((p) => (
                      <div key={p.id} className={styles.chipWrap}>
                        {!p.available && (
                          <span className={styles.soon}>скоро</span>
                        )}
                        <button
                          type="button"
                          disabled={!p.available}
                          className={
                            checkoutStore.paymentMethod === p.id && p.available
                              ? styles.chipActive
                              : styles.chip
                          }
                          onClick={() => {
                            if (p.available) {
                              checkoutStore.paymentMethod = p.id;
                            }
                          }}
                        >
                          {p.label}
                        </button>
                      </div>
                    ))}
                  </div>
                  {checkoutStore.paymentMethod === "balance" && (
                    <p className={styles.payHint}>
                      Доступно на балансе:{" "}
                      {accountStore.balance.toLocaleString("ru-RU")} ₽
                    </p>
                  )}
                  <p className={styles.payHint}>
                    Заказы оплачиваются только с баланса. Пополнить баланс можно
                    через ЮKassa.
                  </p>
                  <button
                    type="button"
                    className={styles.ghostBtn}
                    onClick={() => {
                      close();
                      navigate("/balance");
                    }}
                  >
                    Пополнить баланс
                    <FiArrowRight size={16} />
                  </button>
                </label>

                <div className={styles.summary}>
                  <div className={styles.summaryRow}>
                    <span>Товары</span>
                    <span>{cartStore.subtotal.toLocaleString("ru-RU")} ₽</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Доставка</span>
                    <span>
                      {checkoutStore.deliveryPrice === 0
                        ? "Бесплатно"
                        : formatDeliveryAmount(checkoutStore.deliveryPrice)}
                      {deliveryStore.isFallback && !checkoutStore.order && (
                        <span className={styles.summaryEstimate}>
                          {" "}
                          · предварительно
                        </span>
                      )}
                    </span>
                  </div>
                  <div
                    className={`${styles.summaryRow} ${styles.summaryTotal}`}
                  >
                    <span>Итого</span>
                    <span>{checkoutStore.total.toLocaleString("ru-RU")} ₽</span>
                  </div>
                </div>

                {checkoutStore.error && (
                  <p className={styles.error}>{checkoutStore.error}</p>
                )}

                <button
                  className={styles.submitBtn}
                  onClick={() => void checkoutStore.submit()}
                >
                  Оформить и оплатить
                  <FiArrowRight size={16} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function AddressCard({ address, active, onClick }: {
  address: DeliveryAddress;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? styles.addressOptionActive : styles.addressOption}
      onClick={onClick}
    >
      <span className={styles.addressOptionRadio}>
        {active && <span className={styles.addressOptionDot} />}
      </span>
      <span className={styles.addressOptionText}>{formatAddress(address)}</span>
    </button>
  );
}

function AddressSelector() {
  const navigate = useNavigate();
  const addresses = addressStore.addresses;
  const selected = checkoutStore.selectedAddress;
  const [expanded, setExpanded] = useState(false);

  if (addresses.length === 0) {
    return (
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Адрес доставки</span>
        <div className={styles.addressEmpty}>
          <FiMapPin size={18} />
          <span>
            {addressStore.loading ? "Загрузка адресов…" : "Адрес не выбран"}
          </span>
        </div>
        {!addressStore.loading && (
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={() => {
              navigate("/addresses");
            }}
          >
            <FiPlus size={16} /> Добавить адрес
          </button>
        )}
      </div>
    );
  }

  if (addresses.length === 1) {
    return (
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Адрес доставки</span>
        <AddressCard address={addresses[0]!} active />
      </div>
    );
  }

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>Адрес доставки</span>
      <button
        type="button"
        className={styles.addressToggle}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={styles.addressToggleText}>
          {selected ? formatAddress(selected) : "Выберите адрес"}
        </span>
        <FiChevronDown
          size={16}
          className={expanded ? styles.addressToggleIconOpen : styles.addressToggleIcon}
        />
      </button>
      {expanded && (
        <div className={styles.addressOptions}>
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              active={address.id === selected?.id}
              onClick={() => {
                checkoutStore.selectAddress(address.id);
                setExpanded(false);
                if (address.city) {
                  deliveryStore.setCity(address.city);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default observer(CheckoutSheet);
