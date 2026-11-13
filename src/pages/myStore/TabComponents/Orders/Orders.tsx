import { sellerStore } from "@/shared/stores/sellerStore";
import styles from "./Orders.module.scss";
import { statusInfo } from "@/shared/lib/orders";
import Skeleton from "@/shared/ui/Skeleton";

type Props = {
  setSelectedOrder: (order: any) => void;
  formatDate: (date: string) => string;
  formatMoney: (amount: number | string) => string;
};

const Orders = ({ setSelectedOrder, formatDate, formatMoney }: Props) => {
  const orders = sellerStore.orders;

  const loading = sellerStore.ordersLoading && orders.length === 0;

  return (
    <div className={styles.ordersList}>
      {loading ? (
        Array.from({ length: 3 }, (_, i) => (
          <div key={i} className={styles.orderCard}>
            <div className={styles.orderHead}>
              <div className={styles.orderMain}>
                <Skeleton width={100} height={14} radius={4} />
                <Skeleton width={70} height={12} radius={4} />
              </div>
              <Skeleton width={80} height={22} radius={10} />
            </div>
            <div className={styles.orderPreview}>
              <Skeleton className={styles.orderPreviewImage} />
              <div className={styles.orderPreviewInfo}>
                <Skeleton width="60%" height={14} radius={4} />
                <Skeleton width="40%" height={12} radius={4} />
              </div>
            </div>
          </div>
        ))
      ) : orders.length === 0 ? (
        <p className={styles.emptyTab}>Пока нет заказов</p>
      ) : (
        orders.map((order) => {
          const firstItem = order.items?.[0];
          const itemCount = order.items?.length ?? 0;
          return (
            <button
              key={order.id}
              type="button"
              className={styles.orderCard}
              onClick={() => setSelectedOrder(order)}
            >
              <div className={styles.orderHead}>
                <div className={styles.orderMain}>
                  <span className={styles.orderNumber}>
                    Заказ №{order.order?.orderNumber ?? "—"}
                  </span>
                  <span className={styles.orderDate}>
                    {formatDate(order.createdAt)}
                  </span>
                </div>
                <span
                  className={styles.orderStatus}
                  style={{
                    color: statusInfo(order.status).tint,
                    background: `${statusInfo(order.status).tint}1a`,
                  }}
                >
                  {statusInfo(order.status).label}
                </span>
              </div>
              <div className={styles.orderPreview}>
                {firstItem?.imageUrl && (
                  <img
                    src={firstItem.imageUrl}
                    alt={firstItem.name}
                    className={styles.orderPreviewImage}
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <div className={styles.orderPreviewInfo}>
                  <p className={styles.orderPreviewName}>
                    {firstItem?.name ?? "Товар"}
                  </p>
                  <p className={styles.orderPreviewMeta}>
                    {itemCount} {itemCount === 1 ? "товар" : "товара"} ·{" "}
                    {formatMoney(order.subtotal)}
                  </p>
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );
};

export default Orders;
