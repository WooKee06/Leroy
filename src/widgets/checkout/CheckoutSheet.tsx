import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { beginCell } from "@ton/core";
import { FiArrowRight, FiCheck, FiX, FiMapPin, FiCopy } from "react-icons/fi";
import { checkoutStore } from "@shared/stores/checkoutStore";
import { cartStore } from "@shared/stores/cartStore";
import { accountStore } from "@shared/stores/accountStore";
import { deliveryStore } from "@shared/stores/deliveryStore";
import { tonWalletStore } from "@shared/stores/tonWalletStore";
import {
  DELIVERY_KIND_LABELS,
  formatDeliveryAmount,
  formatDeliveryEta,
} from "@shared/lib/delivery";
import { nanoToTon, shortenAddress, copyText } from "@shared/lib/ton";
import styles from "./CheckoutSheet.module.scss";
import { useCallback } from "react";
import { CdekPickup, type PickupPoint } from "../CdekPickup/CdekPickup";

const PAYMENT_METHODS = [
  { id: "balance", label: "Официальный баланс", available: true },
  { id: "stars", label: "Telegram Stars", available: false },
  { id: "ton", label: "TON (Telegram Wallet)", available: false },
];

function formatExpiry(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function CheckoutSheet() {
  const navigate = useNavigate();
  const [tonConnectUI] = useTonConnectUI();
  const session = checkoutStore.tonSession;

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

  const copyTonAddress = async () => {
    if (session?.quote.toAddress) {
      await copyText(session.quote.toAddress);
    }
  };

  const confirmTonPayment = async () => {
    if (!session) return;
    checkoutStore.tonConfirming = true;
    checkoutStore.error = "";
    try {
      const { quote } = session;
      const body = beginCell()
        .storeUint(0, 32)
        .storeStringTail(quote.memo)
        .endCell();
      const payload = body.toBoc().toString("base64");

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: quote.toAddress,
            amount: quote.tonAmountNano,
            payload,
          },
        ],
      });

      checkoutStore.beginTonWaiting();
      void checkoutStore.waitForTonResult();
    } catch (e) {
      checkoutStore.tonConfirming = false;
      const msg = e instanceof Error ? e.message : "Операция отменена";
      const lower = msg.toLowerCase();
      if (/reject|cancel|closed|denied|user/i.test(lower)) {
        await checkoutStore.cancelTonPayment();
      } else if (/not connected|connect/i.test(lower)) {
        checkoutStore.error =
          "Сначала подключите кошелёк в разделе «Настройки»";
      } else {
        checkoutStore.error = msg;
      }
    }
  };

  const checkAgain = () => {
    checkoutStore.tonWaiting = true;
    void checkoutStore.waitForTonResult();
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
            ) : checkoutStore.step === "ton-confirm" && session ? (
              <div className={styles.confirm}>
                <h2 className={styles.title}>Оплата в TON</h2>
                <p className={styles.confirmText}>
                  Подтвердите перевод в Telegram Wallet. Сумма зафиксирована по
                  текущему курсу и не изменится.
                </p>

                <div className={styles.payRow}>
                  <span className={styles.payLabel}>Сумма</span>
                  <span className={styles.payValue}>
                    {Number(
                      nanoToTon(session.quote.tonAmountNano),
                    ).toLocaleString("ru-RU", {
                      maximumFractionDigits: 9,
                    })}{" "}
                    TON
                    <span className={styles.paySub}>
                      ≈ {session.quote.totalRub.toLocaleString("ru-RU")} ₽
                    </span>
                  </span>
                </div>

                <div className={styles.payRow}>
                  <span className={styles.payLabel}>Получатель</span>
                  <span className={styles.payValue}>
                    <span className={styles.addressInline}>
                      {shortenAddress(session.quote.toAddress, 10, 8)}
                      <button
                        className={styles.iconMini}
                        onClick={copyTonAddress}
                        title="Скопировать адрес"
                      >
                        <FiCopy size={13} />
                      </button>
                    </span>
                  </span>
                </div>

                <div className={styles.payRow}>
                  <span className={styles.payLabel}>Комментарий</span>
                  <span className={`${styles.payValue} ${styles.memoValue}`}>
                    {session.quote.memo}
                  </span>
                </div>

                <div className={styles.payRow}>
                  <span className={styles.payLabel}>Действует до</span>
                  <span className={styles.payValue}>
                    {formatExpiry(session.quote.expiresAt)}
                  </span>
                </div>

                <p className={styles.confirmHint}>
                  Мы подтверждаем перевод по данным блокчейна — ответ кошелька
                  сам по себе не считается оплатой.
                </p>

                {checkoutStore.error && (
                  <p className={styles.error}>{checkoutStore.error}</p>
                )}

                <button
                  className={styles.submitBtn}
                  onClick={confirmTonPayment}
                  disabled={checkoutStore.tonConfirming}
                >
                  {checkoutStore.tonConfirming
                    ? "Открываем кошелёк…"
                    : "Подтвердить в кошельке"}
                  <FiArrowRight size={16} />
                </button>
                <button
                  className={styles.ghostBtn}
                  onClick={() => void checkoutStore.cancelTonPayment()}
                  disabled={checkoutStore.tonConfirming}
                >
                  Отменить оплату
                </button>
              </div>
            ) : checkoutStore.step === "ton-waiting" && session ? (
              <div className={styles.processing}>
                <div className={styles.spinner} />
                <h2 className={styles.title}>Ждём подтверждение</h2>
                <p className={styles.processingText}>
                  Ожидаем, пока перевод появится в блокчейне. Обычно это
                  занимает несколько секунд.
                </p>
                {checkoutStore.error && (
                  <p className={styles.error}>{checkoutStore.error}</p>
                )}
                <button className={styles.ghostBtn} onClick={checkAgain}>
                  Проверить ещё раз
                </button>
                <button
                  className={styles.ghostBtn}
                  onClick={() => void checkoutStore.cancelTonPayment()}
                >
                  Отменить
                </button>
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

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>
                    {deliveryStore.needsPoint
                      ? "Адрес пункта"
                      : "Адрес доставки"}
                  </span>
                  <div className={styles.inputWrap}>
                    <FiMapPin size={16} className={styles.inputIcon} />
                    <input
                      className={styles.input}
                      placeholder={
                        deliveryStore.needsPoint
                          ? "Выберите пункт выдачи выше"
                          : "ул. Ленина, 10, кв. 5"
                      }
                      value={
                        deliveryStore.needsPoint
                          ? deliveryStore.pointAddress
                          : checkoutStore.address
                      }
                      readOnly={deliveryStore.needsPoint}
                      onChange={(e) => {
                        checkoutStore.address = e.target.value;
                      }}
                    />
                  </div>
                </label>

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
                  {checkoutStore.paymentMethod === "ton" &&
                    !tonWalletStore.isConnected && (
                      <p className={styles.payWarn}>
                        Сначала подключите кошелёк: Настройки → Криптовалюта
                      </p>
                    )}
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

export default observer(CheckoutSheet);
