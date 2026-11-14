import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { observer } from "mobx-react-lite";
import type { AdminDashboardDto, RawOrder } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import { accountStore } from "@shared/stores/accountStore";
import { imageUrlWithCacheBust } from "@shared/api/client";
import { statusInfo } from "@shared/lib/orders";
import PageContainer from "@shared/ui/PageContainer";
import PageHeader from "@shared/ui/PageHeader";
import styles from "./AdminOrdersPage.module.scss";

const STATUS_OPTIONS = [
  { id: "", label: "Все" },
  { id: "pending", label: "Ожидает" },
  { id: "paid", label: "Оплачен" },
  { id: "accepted", label: "Принят" },
  { id: "shipped", label: "В пути" },
  { id: "delivered", label: "Доставлен" },
  { id: "completed", label: "Завершён" },
  { id: "cancelled", label: "Отменён" },
];

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

export default observer(function AdminOrdersPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<AdminDashboardDto | null>(null);
  const [orders, setOrders] = useState<RawOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (accountStore.role !== "admin") {
      navigate("/", { replace: true });
      return;
    }

    let alive = true;
    setLoading(true);

    Promise.all([leroyApi.adminDashboard(), leroyApi.adminOrders(1, 100, status)])
      .then(([dash, list]) => {
        if (!alive) return;
        setDashboard(dash);
        setOrders(
          list.data.map((order) => ({
            ...order,
            sellerOrders: order.sellerOrders?.map((so) => ({
              ...so,
              items: so.items?.map((item) => ({
                ...item,
                imageUrl: imageUrlWithCacheBust(item.imageUrl, order.createdAt),
              })),
            })),
          })),
        );
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [navigate, status]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        String(o.orderNumber).includes(q) ||
        o.user?.firstName?.toLowerCase().includes(q) ||
        o.user?.username?.toLowerCase().includes(q),
    );
  }, [orders, search]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="page-wrapper">
      <PageContainer>
        <PageHeader title="Админка · Заказы" />

        {dashboard && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{dashboard.totalOrders}</span>
              <span className={styles.statLabel}>Заказов</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {formatMoney(dashboard.totalRevenue)}
              </span>
              <span className={styles.statLabel}>Выручка</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{dashboard.totalSellers}</span>
              <span className={styles.statLabel}>Магазинов</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{dashboard.totalUsers}</span>
              <span className={styles.statLabel}>Пользователей</span>
            </div>
          </div>
        )}

        <div className={styles.filters}>
          <div className={styles.search}>
            <FiSearch size={16} />
            <input
              placeholder="Поиск по номеру или покупателю"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.statusChips}>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.id}
                className={status === s.id ? styles.chipActive : styles.chip}
                onClick={() => setStatus(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className={styles.loading}>Загрузка…</p>
        ) : filteredOrders.length === 0 ? (
          <p className={styles.empty}>Заказы не найдены</p>
        ) : (
          <div className={styles.ordersList}>
            {filteredOrders.map((order) => {
              const isOpen = expanded.has(order.id);
              const items =
                order.sellerOrders?.flatMap((so) => so.items ?? []) ?? [];

              return (
                <div key={order.id} className={styles.orderCard}>
                  <button
                    type="button"
                    className={styles.orderHead}
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className={styles.orderMain}>
                      <span className={styles.orderNumber}>
                        №{order.orderNumber}
                      </span>
                      <span className={styles.orderDate}>
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div className={styles.orderMeta}>
                      <span
                        className={styles.orderStatus}
                        style={{
                          color: statusInfo(order.status).tint,
                          background: `${statusInfo(order.status).tint}1a`,
                        }}
                      >
                        {statusInfo(order.status).label}
                      </span>
                      <span className={styles.orderTotal}>
                        {formatMoney(order.total)}
                      </span>
                      {isOpen ? (
                        <FiChevronUp size={18} />
                      ) : (
                        <FiChevronDown size={18} />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className={styles.orderBody}>
                      <p className={styles.orderBuyer}>
                        Покупатель:{" "}
                        {order.user
                          ? `${order.user.firstName ?? ""} ${order.user.lastName ?? ""}`.trim() ||
                            order.user.username ||
                            order.user.id
                          : "—"}
                      </p>
                      {order.deliveryAddress && (
                        <p className={styles.orderDelivery}>
                          Адрес: {order.deliveryAddress}
                        </p>
                      )}
                      <div className={styles.orderItems}>
                        {items.map((item) => (
                          <div key={item.id} className={styles.orderItem}>
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className={styles.orderItemImage}
                                loading="lazy"
                                decoding="async"
                              />
                            )}
                            <div>
                              <p className={styles.orderItemName}>{item.name}</p>
                              <p className={styles.orderItemMeta}>
                                {item.quantity} × {formatMoney(item.price)}
                                {item.selectedSize && ` · р. ${item.selectedSize}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>
    </div>
  );
});
