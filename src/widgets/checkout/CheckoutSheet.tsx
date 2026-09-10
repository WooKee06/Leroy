import { AnimatePresence, motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiX, FiMapPin } from 'react-icons/fi';
import { checkoutStore } from '@shared/stores/checkoutStore';
import { cartStore } from '@shared/stores/cartStore';
import styles from './CheckoutSheet.module.scss';

const DELIVERY_METHODS = ['СДЭК', 'Почта России', 'Курьер', 'Самовывоз'];

function CheckoutSheet() {
  const navigate = useNavigate();

  const close = () => checkoutStore.close();

  const goToShop = () => {
    close();
    navigate('/');
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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.handle} />
            <button className={styles.close} onClick={close} aria-label="Закрыть">
              <FiX size={18} />
            </button>

            {checkoutStore.step === 'success' && checkoutStore.order ? (
              <div className={styles.success}>
                <div className={styles.successIcon}>
                  <FiCheck size={26} />
                </div>
                <h2 className={styles.title}>Заказ оплачен</h2>
                <p className={styles.successText}>
                  Заказ №{checkoutStore.order.orderNumber} на сумму{' '}
                  {checkoutStore.order.total.toLocaleString('ru-RU')} ₽ успешно
                  оплачен. Продавцы уже обрабатывают его.
                </p>
                <button className={styles.submitBtn} onClick={goToShop}>
                  К покупкам
                  <FiArrowRight size={16} />
                </button>
              </div>
            ) : checkoutStore.step === 'processing' ? (
              <div className={styles.processing}>
                <div className={styles.spinner} />
                <h2 className={styles.title}>Оформляем заказ</h2>
                <p className={styles.processingText}>
                  Создаём заказ и проводим оплату… это займёт пару секунд
                </p>
              </div>
            ) : (
              <div className={styles.form}>
                <h2 className={styles.title}>Оформление заказа</h2>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Адрес доставки</span>
                  <div className={styles.inputWrap}>
                    <FiMapPin size={16} className={styles.inputIcon} />
                    <input
                      className={styles.input}
                      placeholder="ул. Ленина, 10, кв. 5"
                      value={checkoutStore.address}
                      onChange={(e) => {
                        checkoutStore.address = e.target.value;
                      }}
                    />
                  </div>
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Способ доставки</span>
                  <div className={styles.chips}>
                    {DELIVERY_METHODS.map((method) => (
                      <button
                        key={method}
                        className={
                          checkoutStore.deliveryMethod === method
                            ? styles.chipActive
                            : styles.chip
                        }
                        onClick={() => {
                          checkoutStore.deliveryMethod = method;
                        }}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Оплата</span>
                  <div className={styles.chips}>
                    {[
                      { id: 'mock', label: 'Мок-оплата' },
                      { id: 'stars', label: 'Telegram Stars' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        className={
                          checkoutStore.paymentMethod === p.id
                            ? styles.chipActive
                            : styles.chip
                        }
                        onClick={() => {
                          checkoutStore.paymentMethod = p.id;
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </label>

                <div className={styles.summary}>
                  <div className={styles.summaryRow}>
                    <span>Товары</span>
                    <span>{cartStore.subtotal.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Доставка</span>
                    <span>
                      {cartStore.delivery === 0
                        ? 'Бесплатно'
                        : `${cartStore.delivery.toLocaleString('ru-RU')} ₽`}
                    </span>
                  </div>
                  <div
                    className={`${styles.summaryRow} ${styles.summaryTotal}`}
                  >
                    <span>Итого</span>
                    <span>{cartStore.total.toLocaleString('ru-RU')} ₽</span>
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