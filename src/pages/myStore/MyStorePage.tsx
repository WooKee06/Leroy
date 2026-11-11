import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheck,
  FiDollarSign,
  FiEdit2,
  FiPlus,
  FiShoppingBag,
  FiTrash2,
} from "react-icons/fi";
import type {
  PayoutDto,
  ProductDto,
  RawSellerOrder,
  Seller,
  SellerAnalyticsDto,
  SellerBalanceDto,
  SellerDashboardDto,
} from "@shared/api/models";
import { mapProduct, mapSeller } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import { accountStore } from "@shared/stores/accountStore";
import { statusInfo } from "@shared/lib/orders";
import PageContainer from "@shared/ui/PageContainer";
import { StorePageSkeleton } from "@shared/ui/Skeletons";
import ProductCard from "@widgets/product/ProductCard";
import {
  ProductFormSheet,
  StoreCreateSheet,
} from "@widgets/store/CreateSheets";
import styles from "./MyStorePage.module.scss";

type Tab = "items" | "orders" | "analytics" | "balance";

const formatCompact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

const formatMoney = (value: number | string) =>
  `${Number(value || 0).toLocaleString("ru-RU")} ₽`;

const formatDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("ru-RU");
};

const SELLER_ACTIONS: Record<string, { next: string; label: string }[]> = {
  pending: [{ next: "accepted", label: "Принять" }],
  paid: [{ next: "accepted", label: "Принять" }],
  accepted: [{ next: "preparing", label: "Готовить" }],
  preparing: [{ next: "ready_for_delivery", label: "Готов к отправке" }],
  ready_for_delivery: [{ next: "shipped", label: "Отправить" }],
  shipped: [{ next: "delivered", label: "Доставлено" }],
  delivered: [{ next: "completed", label: "Завершить" }],
};

export default function MyStorePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("items");
  const [seller, setSeller] = useState<Seller | undefined>(undefined);
  const [sellerDto, setSellerDto] = useState<ProductDto["store"] | undefined>(
    undefined,
  );
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [dashboard, setDashboard] = useState<SellerDashboardDto | null>(null);
  const [balance, setBalance] = useState<SellerBalanceDto | null>(null);
  const [analytics, setAnalytics] = useState<SellerAnalyticsDto | null>(null);
  const [orders, setOrders] = useState<RawSellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [storeOpen, setStoreOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | undefined>(
    undefined,
  );
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);

  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    async function load() {
      const storeRes = await leroyApi.myStore(accountStore.userId);
      if (!alive) return;
      if (!storeRes) {
        setLoading(false);
        return;
      }

      const mappedSeller = mapSeller(storeRes);
      setSeller(mappedSeller);
      setSellerDto(storeRes);

      const [productsPage, dash, bal, anal, ords] = await Promise.all([
        leroyApi.storeProducts(storeRes.id),
        leroyApi.sellerDashboard(),
        leroyApi.sellerBalance(),
        leroyApi.sellerAnalytics("month"),
        leroyApi.sellerOrders(),
      ]);

      if (!alive) return;
      setProducts(productsPage.items);
      setDashboard(dash);
      setBalance(bal);
      setAnalytics(anal);
      setOrders(ords);
      setLoading(false);
    }

    void load().catch(() => {
      if (alive) setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [tick]);

  const mappedProducts = useMemo(
    () => products.map((p) => mapProduct(p, seller)),
    [products, seller],
  );

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Удалить товар?")) return;
    try {
      await leroyApi.deleteProduct(id);
      reload();
    } catch {
      // ignore
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await leroyApi.updateSellerOrderStatus(orderId, status);
      reload();
    } catch {
      // ignore
    }
  };

  const handleRequestPayout = async () => {
    const amount = Number(payoutAmount.replace(/\s/g, ""));
    if (!Number.isFinite(amount) || amount < 100) return;
    setPayoutLoading(true);
    try {
      await leroyApi.requestPayout(amount);
      setPayoutAmount("");
      reload();
    } catch {
      // ignore
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <StorePageSkeleton />
      </div>
    );
  }

  if (!seller || !sellerDto) {
    return (
      <div className={`page-wrapper ${styles.page}`}>
        <PageContainer>
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <FiShoppingBag size={28} />
            </div>
            <div>
              <h1>Магазин ещё не создан</h1>
              <p>Создайте магазин и добавьте первые товары</p>
            </div>
            <button
              className={styles.emptyBtn}
              onClick={() => setStoreOpen(true)}
            >
              <FiPlus size={18} /> Создать магазин
            </button>
          </div>
        </PageContainer>

        <StoreCreateSheet
          open={storeOpen}
          onClose={() => setStoreOpen(false)}
          onDone={() => {
            setStoreOpen(false);
            reload();
          }}
        />
      </div>
    );
  }

  const stats = [
    { value: formatCompact(dashboard?.totalOrders ?? 0), label: "Заказов" },
    { value: dashboard?.totalProducts ?? 0, label: "Товаров" },
    { value: Number(dashboard?.rating ?? 0).toFixed(1), label: "Рейтинг" },
    { value: formatCompact(dashboard?.productViews ?? 0), label: "Просмотров" },
    { value: formatMoney(dashboard?.balance ?? 0), label: "Баланс" },
  ];

  return (
    <div className={styles.page}>
      <PageContainer>
        <div className={styles.sellerHeader}>
          <img
            className={styles.sellerAvatar}
            src={seller.avatar}
            alt={seller.name}
          />
          <div className={styles.sellerInfo}>
            <div className={styles.sellerNameRow}>
              <h1 className={styles.sellerName}>{seller.name}</h1>
              {seller.verified && (
                <span className={styles.verifiedBadge}>
                  <FiCheck size={14} />
                </span>
              )}
            </div>
            <p className={styles.sellerDesc}>{seller.description}</p>
          </div>
          <button
            className={styles.editStoreBtn}
            onClick={() => navigate("/my-store/edit")}
          >
            <FiEdit2 size={16} /> Редактировать
          </button>
        </div>

        <div className={styles.statsGrid}>
          {stats.map((s) => (
            <div className={styles.statCard} key={s.label}>
              <div className={styles.statCardValue}>{s.value}</div>
              <div className={styles.statCardLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.tabs}>
          <button
            className={tab === "items" ? styles.tabActive : styles.tab}
            onClick={() => setTab("items")}
          >
            Товары
          </button>
          <button
            className={tab === "orders" ? styles.tabActive : styles.tab}
            onClick={() => setTab("orders")}
          >
            Заказы
          </button>
          <button
            className={tab === "analytics" ? styles.tabActive : styles.tab}
            onClick={() => setTab("analytics")}
          >
            Аналитика
          </button>
          <button
            className={tab === "balance" ? styles.tabActive : styles.tab}
            onClick={() => setTab("balance")}
          >
            Баланс
          </button>
        </div>

        <div className={styles.tabContent}>
            {tab === "items" && (
              <>
                <button
                  className={styles.addBtn}
                  onClick={() => {
                    setEditingProduct(undefined);
                    setProductOpen(true);
                  }}
                >
                  <FiPlus size={18} /> Добавить товар
                </button>
                <div className={styles.productGrid}>
                  {mappedProducts.map((product, index) => (
                    <div key={product.id} className={styles.productWrap}>
                      <ProductCard
                        product={product}
                        variant="medium"
                      />
                      <div className={styles.productActions}>
                        <button
                          type="button"
                          className={styles.productAction}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProduct(products[index]);
                            setProductOpen(true);
                          }}
                          aria-label="Редактировать"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.productAction} ${styles.productActionDanger}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteProduct(product.id);
                          }}
                          aria-label="Удалить"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === "orders" && (
              <div className={styles.ordersList}>
                {orders.length === 0 ? (
                  <p className={styles.emptyTab}>Пока нет заказов</p>
                ) : (
                  orders.map((order) => {
                    const actions = SELLER_ACTIONS[order.status] ?? [];
                    return (
                      <div key={order.id} className={styles.orderCard}>
                        <div className={styles.orderHead}>
                          <span className={styles.orderNumber}>
                            Заказ №{order.order?.orderNumber ?? "—"}
                          </span>
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
                        <p className={styles.orderDate}>
                          {formatDate(order.createdAt)}
                        </p>
                        <div className={styles.orderItems}>
                          {(order.items ?? []).map((item) => (
                            <div key={item.id} className={styles.orderItem}>
                              {item.imageUrl && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className={styles.orderItemImage}
                                />
                              )}
                              <div>
                                <p className={styles.orderItemName}>
                                  {item.name}
                                </p>
                                <p className={styles.orderItemMeta}>
                                  {item.quantity} ×{" "}
                                  {formatMoney(item.price)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className={styles.orderTotal}>
                          Сумма: {formatMoney(order.subtotal)} · Заработок:{" "}
                          {formatMoney(order.sellerEarnings)}
                        </div>
                        {actions.length > 0 && (
                          <div className={styles.orderActions}>
                            {actions.map((action) => (
                              <button
                                key={action.next}
                                type="button"
                                className={styles.orderActionBtn}
                                onClick={() =>
                                  void handleUpdateStatus(order.id, action.next)
                                }
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {tab === "analytics" && analytics && (
              <div className={styles.analyticsGrid}>
                <div className={styles.metricCard}>
                  <span className={styles.metricValue}>
                    {formatCompact(analytics.views)}
                  </span>
                  <span className={styles.metricLabel}>Просмотров</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricValue}>
                    {formatCompact(analytics.addToCart)}
                  </span>
                  <span className={styles.metricLabel}>В корзину</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricValue}>
                    {formatCompact(analytics.orders)}
                  </span>
                  <span className={styles.metricLabel}>Заказов</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricValue}>
                    {analytics.conversion}%
                  </span>
                  <span className={styles.metricLabel}>Конверсия</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricValue}>
                    {formatMoney(analytics.revenue)}
                  </span>
                  <span className={styles.metricLabel}>Выручка</span>
                </div>

                {analytics.topProducts.length > 0 && (
                  <div className={styles.topProducts}>
                    <h3 className={styles.sectionTitle}>Топ товары</h3>
                    {analytics.topProducts.map((p, i) => (
                      <div key={i} className={styles.topProductRow}>
                        <span className={styles.topProductName}>{p.name}</span>
                        <span className={styles.topProductSales}>
                          {p.sales} шт. · {formatMoney(p.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "balance" && balance && (
              <div className={styles.balanceTab}>
                <div className={styles.metricCard}>
                  <span className={styles.metricValue}>
                    {formatMoney(balance.available)}
                  </span>
                  <span className={styles.metricLabel}>Доступно</span>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricValue}>
                    {formatMoney(balance.pending)}
                  </span>
                  <span className={styles.metricLabel}>В обработке</span>
                </div>

                <div className={styles.payoutForm}>
                  <input
                    className={styles.input}
                    inputMode="numeric"
                    placeholder="Сумма выплаты"
                    value={payoutAmount}
                    onChange={(e) =>
                      setPayoutAmount(e.target.value.replace(/[^\d]/g, ""))
                    }
                  />
                  <button
                    className={styles.payoutBtn}
                    onClick={() => void handleRequestPayout()}
                    disabled={
                      payoutLoading ||
                      !payoutAmount ||
                      Number(payoutAmount) > Number(balance.available)
                    }
                  >
                    <FiDollarSign size={16} />
                    {payoutLoading ? "Запрос…" : "Запросить выплату"}
                  </button>
                </div>

                {balance.recentPayouts.length > 0 && (
                  <div className={styles.recentList}>
                    <h3 className={styles.sectionTitle}>Выплаты</h3>
                    {balance.recentPayouts.map((p) => (
                      <PayoutRow key={p.id} payout={p} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
      </PageContainer>

      <ProductFormSheet
        open={productOpen}
        onClose={() => setProductOpen(false)}
        onDone={() => {
          setProductOpen(false);
          reload();
        }}
        mode={editingProduct ? "edit" : "create"}
        initialProduct={editingProduct}
      />
    </div>
  );
}

function PayoutRow({ payout }: { payout: PayoutDto }) {
  const statusLabels: Record<string, string> = {
    pending: "В очереди",
    processing: "В обработке",
    completed: "Выплачено",
    failed: "Ошибка",
  };
  return (
    <div className={styles.recentRow}>
      <span className={styles.recentAmount}>{formatMoney(payout.amount)}</span>
      <span
        className={styles.recentStatus}
        style={{
          color:
            payout.status === "completed"
              ? "#34c759"
              : payout.status === "failed"
                ? "#ff3b30"
                : "#f5a623",
        }}
      >
        {statusLabels[payout.status] ?? payout.status}
      </span>
      <span className={styles.recentDate}>{formatDate(payout.createdAt)}</span>
    </div>
  );
}
