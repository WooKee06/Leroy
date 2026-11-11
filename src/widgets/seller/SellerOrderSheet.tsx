import { AnimatePresence, motion } from "framer-motion";
import { FiCheck, FiMapPin, FiPackage, FiTruck, FiX } from "react-icons/fi";
import type { RawSellerOrder } from "@shared/api/models";
import { statusInfo } from "@shared/lib/orders";
import styles from "./SellerOrderSheet.module.scss";

const formatMoney = (value: number | string) =>
  `${Number(value || 0).toLocaleString("ru-RU")} ₽`;

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const SELLER_ACTIONS: Record<string, { next: string; label: string }[]> = {
  pending: [{ next: "accepted", label: "Принять заказ" }],
  paid: [{ next: "accepted", label: "Принять заказ" }],
  accepted: [{ next: "preparing", label: "Готовить" }],
  preparing: [{ next: "ready_for_delivery", label: "Готов к отправке" }],
  ready_for_delivery: [{ next: "shipped", label: "Отправить" }],
  shipped: [{ next: "delivered", label: "Доставлено" }],
  delivered: [{ next: "completed", label: "Завершить" }],
};

interface Props {
  order: RawSellerOrder | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  loading?: boolean;
}

export default function SellerOrderSheet({
  order,
  onClose,
  onStatusChange,
  loading,
}: Props) {
  if (!order) return null;

  const actions = SELLER_ACTIONS[order.status] ?? [];
  const user = order.order?.user;
  const items = order.items ?? [];

  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label={`Заказ №${order.order?.orderNumber}`}
            initial={{ y: "100%", scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: "100%", scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className={styles.handle} />
            <button
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Закрыть"
            >
              <FiX size={18} />
            </button>

            <div className={styles.header}>
              <h2 className={styles.title}>
                Заказ №{order.order?.orderNumber}
              </h2>
              <span
                className={styles.status}
                style={{
                  color: statusInfo(order.status).tint,
                  background: `${statusInfo(order.status).tint}1a`,
                }}
              >
                {statusInfo(order.status).label}
              </span>
            </div>

            <p className={styles.date}>{formatDate(order.createdAt)}</p>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Покупатель</h3>
              <div className={styles.infoCard}>
                <p className={styles.infoValue}>
                  {user
                    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
                      user.username ||
                      "Покупатель"
                    : "—"}
                </p>
                {user?.username && (
                  <p className={styles.infoSub}>@{user.username}</p>
                )}
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Куда отправлять</h3>
              <div className={styles.infoCard}>
                <div className={styles.infoRow}>
                  <FiMapPin size={16} />
                  <span>
                    {order.order?.deliveryAddress ||
                      order.order?.pickupAddress ||
                      "Адрес не указан"}
                  </span>
                </div>
                {order.order?.deliveryMethod && (
                  <div className={styles.infoRow}>
                    <FiTruck size={16} />
                    <span>{order.order.deliveryMethod}</span>
                  </div>
                )}
                {order.order?.pickupCode && (
                  <div className={styles.infoRow}>
                    <FiPackage size={16} />
                    <span>Код ПВЗ: {order.order.pickupCode}</span>
                  </div>
                )}
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Товары к отправке</h3>
              <div className={styles.items}>
                {items.map((item) => (
                  <div key={item.id} className={styles.item}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className={styles.itemImage}
                      />
                    ) : (
                      <div className={styles.itemImagePlaceholder}>
                        <FiPackage size={20} />
                      </div>
                    )}
                    <div className={styles.itemBody}>
                      <p className={styles.itemName}>{item.name}</p>
                      <p className={styles.itemMeta}>
                        {item.quantity} шт. × {formatMoney(item.price)}
                      </p>
                      {(item.selectedSize || item.selectedColor) && (
                        <p className={styles.itemVariant}>
                          {item.selectedSize && `Размер: ${item.selectedSize}`}
                          {item.selectedSize && item.selectedColor && " · "}
                          {item.selectedColor && `Цвет: ${item.selectedColor}`}
                        </p>
                      )}
                    </div>
                    <span className={styles.itemTotal}>
                      {formatMoney(Number(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Итоги</h3>
              <div className={styles.totals}>
                <div className={styles.totalRow}>
                  <span>Сумма заказа</span>
                  <span>{formatMoney(order.subtotal)}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>Комиссия</span>
                  <span>{formatMoney(order.commission)}</span>
                </div>
                <div className={`${styles.totalRow} ${styles.totalRowBold}`}>
                  <span>Заработок</span>
                  <span>{formatMoney(order.sellerEarnings)}</span>
                </div>
              </div>
            </section>

            {actions.length > 0 && (
              <div className={styles.actions}>
                {actions.map((action) => (
                  <button
                    key={action.next}
                    type="button"
                    className={styles.actionBtn}
                    disabled={loading}
                    onClick={() => onStatusChange(order.id, action.next)}
                  >
                    <FiCheck size={16} />
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
