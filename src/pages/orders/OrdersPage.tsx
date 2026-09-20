import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiChevronRight, FiPackage } from "react-icons/fi";
import type { Order } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import PageContainer from "@shared/ui/PageContainer";
import PageHeader from "@shared/ui/PageHeader";
import { statusInfo } from "@shared/lib/orders";
import styles from "./OrdersPage.module.scss";

type Tab = "all" | "awaiting" | "shipping" | "received";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "awaiting", label: "Ожидают" },
  { id: "shipping", label: "В пути" },
  { id: "received", label: "Получены" },
];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = (searchParams.get("tab") as Tab) || "all";
  const tab = TABS.some((t) => t.id === rawTab) ? rawTab : "all";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    leroyApi
      .myOrders()
      .then((items) => {
        if (alive) setOrders(items);
      })
      .catch(() => {
        if (alive) setOrders([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (tab === "all") return orders;
    return orders.filter((o) => statusInfo(o.status).group === tab);
  }, [orders, tab]);

  const itemCount = useMemo(
    () => filtered.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0),
    [filtered],
  );

  const selectTab = (id: Tab) => {
    setSearchParams(id === "all" ? {} : { tab: id });
  };

  return (
    <div className="page-wrapper">
      <PageContainer>
        <PageHeader title="Мои заказы" />

        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={t.id === tab ? styles.tabActive : styles.tab}
              onClick={() => selectTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className={styles.empty}>
            <FiPackage size={26} />
            <p>
              {tab === "all"
                ? "Заказов пока нет"
                : "В этой категории заказов нет"}
            </p>
          </div>
        )}

        {loading && (
          <p className={styles.loading}>Загрузка…</p>
        )}

        {filtered.length > 0 && (
          <div className={styles.summary}>
            {filtered.length} заказ(а) · {itemCount} товаров
          </div>
        )}

        <div className={styles.list}>
          {filtered.map((order) => {
            const info = statusInfo(order.status);
            return (
              <button
                key={order.id}
                className={styles.card}
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className={styles.cardHead}>
                  <span className={styles.orderNumber}>
                    Заказ №{order.orderNumber}
                  </span>
                  <span
                    className={styles.statusBadge}
                    style={{ color: info.tint, background: `${info.tint}1a` }}
                  >
                    {info.label}
                  </span>
                </div>
                <div className={styles.cardMeta}>
                  {order.createdAt &&
                    new Date(order.createdAt).toLocaleDateString("ru-RU")}
                  {order.stores.length > 0 && ` · ${order.stores.join(", ")}`}
                </div>
                <div className={styles.cardFoot}>
                  <span className={styles.total}>
                    {order.total.toLocaleString("ru-RU")} ₽
                  </span>
                  <span className={styles.detail}>
                    Детали <FiChevronRight size={16} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </PageContainer>
    </div>
  );
}