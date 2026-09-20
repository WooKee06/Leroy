import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiChevronRight, FiMapPin, FiPackage } from "react-icons/fi";
import type { Order } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import PageContainer from "@shared/ui/PageContainer";
import PageHeader from "@shared/ui/PageHeader";
import { statusInfo } from "@shared/lib/orders";
import styles from "./OrdersPage.module.scss";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoading(true);
    leroyApi
      .myOrders()
      .then((items) => {
        if (alive) setOrder(items.find((o) => o.id === id));
      })
      .catch(() => {
        if (alive) setOrder(undefined);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <PageContainer>
          <PageHeader title="Заказ" />
          <p className={styles.loading}>Загрузка…</p>
        </PageContainer>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-wrapper">
        <PageContainer>
          <PageHeader title="Заказ" />
          <div className={styles.empty}>
            <FiPackage size={26} />
            <p>Заказ не найден</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  const info = statusInfo(order.status);
  const itemsTotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="page-wrapper">
      <PageContainer>
        <PageHeader title={`Заказ №${order.orderNumber}`} />

        <div className={styles.hero}>
          <span
            className={styles.statusBadge}
            style={{ color: info.tint, background: `${info.tint}1a` }}
          >
            {info.label}
          </span>
          <span className={styles.heroDate}>
            {order.createdAt
              ? new Date(order.createdAt).toLocaleDateString("ru-RU")
              : ""}
          </span>
        </div>

        <div className={styles.block}>
          <h2 className={styles.blockTitle}>Товары</h2>
          {order.items.map((item) => (
            <div key={item.id} className={styles.itemRow}>
              {item.imageUrl ? (
                <img
                  className={styles.itemImage}
                  src={item.imageUrl}
                  alt={item.name}
                />
              ) : (
                <span className={styles.itemImageFallback}>
                  <FiPackage size={18} />
                </span>
              )}
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.itemMeta}>
                  {item.selectedColor && `${item.selectedColor} · `}
                  {item.selectedSize && `${item.selectedSize} · `}
                  {item.quantity} шт
                </span>
              </div>
              <span className={styles.itemTotal}>
                {(item.price * item.quantity).toLocaleString("ru-RU")} ₽
              </span>
            </div>
          ))}
          <div className={styles.row}>
            <span>Товары</span>
            <span>{itemsTotal.toLocaleString("ru-RU")} ₽</span>
          </div>
          <div className={`${styles.row} ${styles.rowTotal}`}>
            <span>Итого</span>
            <span>{order.total.toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>

        <div className={styles.block}>
          <h2 className={styles.blockTitle}>Доставка</h2>
          {order.deliveryAddress && (
            <div className={styles.row}>
              <FiMapPin size={16} className={styles.rowIcon} />
              <span>{order.deliveryAddress}</span>
            </div>
          )}
          {order.deliveryMethod && (
            <div className={styles.row}>
              <span>{order.deliveryMethod}</span>
            </div>
          )}
          {order.stores.length > 0 && (
            <div className={styles.row}>
              <span>Продавец: {order.stores.join(", ")}</span>
            </div>
          )}
        </div>

        <button
          className={styles.backBtn}
          onClick={() => navigate("/orders")}
        >
          Все заказы <FiChevronRight size={16} />
        </button>
      </PageContainer>
    </div>
  );
}