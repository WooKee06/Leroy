import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FiCheck,
  FiChevronRight,
  FiCopy,
  FiMapPin,
  FiPackage,
  FiStar,
  FiTruck,
} from "react-icons/fi";
import type { Order, OrderEventDto, OrderItemView } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import { accountStore } from "@shared/stores/accountStore";
import { canBuyerCancelOrder, statusInfo } from "@shared/lib/orders";
import {
  formatDeliveryAmount,
  orderDeliveryLabel,
} from "@shared/lib/delivery";
import { copyText } from "@shared/lib/ton";
import PageContainer from "@shared/ui/PageContainer";
import PageHeader from "@shared/ui/PageHeader";
import { OrderDetailSkeleton } from "@shared/ui/Skeletons";
import OrderReviewSheet from "@widgets/order/OrderReviewSheet";
import OrderTimeline from "@widgets/order/OrderTimeline";
import styles from "./OrdersPage.module.scss";

const REVIEWABLE_STATUSES = ["delivered", "completed"];
const STARS = [1, 2, 3, 4, 5];

const formatMoney = (value: number) => `${value.toLocaleString("ru-RU")} ₽`;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as {
    orderNumber?: number;
    order?: Order;
  } | null;
  const preloadedOrder = navigationState?.order;
  const [order, setOrder] = useState<Order | undefined>(preloadedOrder);
  const [events, setEvents] = useState<OrderEventDto[]>([]);
  const [reviewed, setReviewed] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(!preloadedOrder);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<OrderItemView | undefined>(
    undefined,
  );
  const [cancelArmed, setCancelArmed] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let alive = true;
    const stateOrder = navigationState?.order;

    if (stateOrder?.id === id) {
      setOrder(stateOrder);
      setLoading(false);
    } else {
      setLoading(true);
    }

    Promise.allSettled([
      leroyApi.myOrders(),
      leroyApi.orderEvents(id),
      leroyApi.myReviews(),
    ])
      .then(([ordersResult, eventsResult, reviewsResult]) => {
        if (!alive) return;

        if (ordersResult.status === "fulfilled") {
          setOrder(ordersResult.value.find((item) => item.id === id));
        } else if (stateOrder?.id !== id) {
          setOrder(undefined);
        }

        if (eventsResult.status === "fulfilled") {
          setEvents(eventsResult.value);
        }

        if (reviewsResult.status === "fulfilled") {
          const map: Record<string, number> = {};
          for (const review of reviewsResult.value) {
            if (!(review.productId in map)) {
              map[review.productId] = review.rating;
            }
          }
          setReviewed(map);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id, navigationState]);

  const itemCount = useMemo(
    () => order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [order],
  );

  const canReview = order ? REVIEWABLE_STATUSES.includes(order.status) : false;

  const unreviewedCount = order
    ? order.items.filter(
        (item) => item.productId && reviewed[item.productId] == null,
      ).length
    : 0;

  const stateOrderNumber = navigationState?.orderNumber;

  const title = order
    ? `Заказ №${order.orderNumber}`
    : stateOrderNumber
      ? `Заказ №${stateOrderNumber}`
      : "Заказ";

  const openReview = (item: OrderItemView) => {
    setReviewTarget(item);
    setReviewOpen(true);
  };

  const handleSubmitted = (productId: string, rating: number) => {
    setReviewed((prev) => ({ ...prev, [productId]: rating }));
  };

  const handleCancel = async () => {
    if (!order || cancelling) return;
    setCancelling(true);
    setCancelError("");
    try {
      const updated = await leroyApi.cancelOrder(order.id);
      setOrder(updated);
      setCancelArmed(false);

      const [freshEvents] = await Promise.allSettled([
        leroyApi.orderEvents(order.id),
      ]);
      if (freshEvents.status === "fulfilled") setEvents(freshEvents.value);

      // A paid order is refunded to the wallet by the server.
      if (updated.paidAt) void accountStore.loadWallet(true);
    } catch (e) {
      setCancelError(
        e instanceof Error ? e.message : "Не удалось отменить заказ",
      );
    } finally {
      setCancelling(false);
    }
  };

  const copyTracking = async () => {
    if (order?.trackingNumber) await copyText(order.trackingNumber);
  };

  const itemsTotal = order
    ? order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : 0;

  const deliveryLabel = order ? orderDeliveryLabel(order) : null;
  const pickupAddress = order?.pickupAddress;
  const canCancel = order ? canBuyerCancelOrder(order.status) : false;

  return (
    <div className="page-wrapper">
      <PageContainer>
        <PageHeader title={title} />

        {loading ? (
          <OrderDetailSkeleton />
        ) : !order ? (
          <div className={styles.empty}>
            <FiPackage size={26} />
            <p>Заказ не найден</p>
          </div>
        ) : (
          <>
            <div className={styles.hero}>
              <span
                className={styles.statusBadge}
                style={{
                  color: statusInfo(order.status).tint,
                  background: `${statusInfo(order.status).tint}1a`,
                }}
              >
                {statusInfo(order.status).label}
              </span>
              <span className={styles.heroDate}>
                {order.createdAt
                  ? new Date(order.createdAt).toLocaleDateString("ru-RU")
                  : ""}
              </span>
            </div>

            {order.status === "cancelled" && order.cancelReason && (
              <p className={styles.cancelNotice}>
                Причина отмены: {order.cancelReason}
              </p>
            )}

            {canReview && unreviewedCount > 0 && (
              <div className={styles.reviewBanner}>
                <span className={styles.reviewBannerIcon}>
                  <FiStar size={18} />
                </span>
                <div className={styles.reviewBannerText}>
                  <strong>Как вам покупка?</strong>
                  <span>
                    Оставьте отзыв — это помогает другим покупателям выбрать
                  </span>
                </div>
              </div>
            )}

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Товары</h2>
                <span className={styles.countBadge}>{itemCount}</span>
              </div>

              <div className={styles.itemList}>
                {order.items.map((item) => {
                  const rating = item.productId
                    ? reviewed[item.productId]
                    : undefined;
                  const variant = [
                    item.selectedColor,
                    item.selectedSize && `Размер ${item.selectedSize}`,
                  ]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <div key={item.id} className={styles.itemCard}>
                      <div className={styles.itemTop}>
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
                          {variant && (
                            <span className={styles.itemMeta}>{variant}</span>
                          )}
                          <div className={styles.itemPriceRow}>
                            <span className={styles.itemPrice}>
                              {formatMoney(item.price)}
                            </span>
                            <span className={styles.itemQty}>
                              ×{item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>

                      {canReview && item.productId && (
                        <div className={styles.itemReview}>
                          {rating ? (
                            <div className={styles.reviewed}>
                              <span
                                className={styles.reviewedStars}
                                aria-hidden="true"
                              >
                                {STARS.map((star) => (
                                  <FiStar
                                    key={star}
                                    size={14}
                                    className={
                                      star <= rating
                                        ? styles.reviewedStarActive
                                        : styles.reviewedStar
                                    }
                                  />
                                ))}
                              </span>
                              <span className={styles.reviewedText}>
                                <FiCheck size={14} /> Отзыв оставлен
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className={styles.reviewBtn}
                              onClick={() => openReview(item)}
                            >
                              <FiStar size={15} />
                              Оставить отзыв
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className={styles.totalsCard}>
                <div className={styles.row}>
                  <span>Товары</span>
                  <span>{formatMoney(itemsTotal)}</span>
                </div>
                {order.deliveryPrice !== undefined && (
                  <div className={styles.row}>
                    <span>Доставка</span>
                    <span>
                      {order.deliveryPrice === 0
                        ? "Бесплатно"
                        : formatDeliveryAmount(order.deliveryPrice)}
                    </span>
                  </div>
                )}
                <div className={`${styles.row} ${styles.rowTotal}`}>
                  <span>Итого</span>
                  <span>{formatMoney(order.total)}</span>
                </div>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Доставка</h2>
              </div>

              <div className={styles.deliveryCard}>
                {order.deliveryAddress && !pickupAddress && (
                  <div className={styles.deliveryRow}>
                    <span className={styles.deliveryIcon}>
                      <FiMapPin size={17} />
                    </span>
                    <div className={styles.deliveryInfo}>
                      <span className={styles.deliveryLabel}>Адрес</span>
                      <span className={styles.deliveryValue}>
                        {order.deliveryAddress}
                      </span>
                    </div>
                  </div>
                )}
                {deliveryLabel && (
                  <div className={styles.deliveryRow}>
                    <span className={styles.deliveryIcon}>
                      <FiTruck size={17} />
                    </span>
                    <div className={styles.deliveryInfo}>
                      <span className={styles.deliveryLabel}>Способ</span>
                      <span className={styles.deliveryValue}>
                        {deliveryLabel}
                      </span>
                    </div>
                  </div>
                )}
                {pickupAddress && (
                  <div className={styles.deliveryRow}>
                    <span className={styles.deliveryIcon}>
                      <FiMapPin size={17} />
                    </span>
                    <div className={styles.deliveryInfo}>
                      <span className={styles.deliveryLabel}>Пункт выдачи</span>
                      <span className={styles.deliveryValue}>
                        {pickupAddress}
                        {order.pickupCode && (
                          <span className={styles.deliverySub}>
                            Код ПВЗ: {order.pickupCode}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
                {order.trackingNumber && (
                  <div className={styles.deliveryRow}>
                    <span className={styles.deliveryIcon}>
                      <FiPackage size={17} />
                    </span>
                    <div className={styles.deliveryInfo}>
                      <span className={styles.deliveryLabel}>Трек-номер</span>
                      <span className={styles.deliveryValue}>
                        <button
                          type="button"
                          className={styles.trackValue}
                          onClick={() => void copyTracking()}
                          title="Скопировать трек-номер"
                        >
                          {order.trackingNumber}
                          <FiCopy size={13} />
                        </button>
                      </span>
                    </div>
                  </div>
                )}
                {order.deliveryStatus && (
                  <div className={styles.deliveryRow}>
                    <span className={styles.deliveryIcon}>
                      <FiPackage size={17} />
                    </span>
                    <div className={styles.deliveryInfo}>
                      <span className={styles.deliveryLabel}>
                        Статус доставки
                      </span>
                      <span className={styles.deliveryValue}>
                        {order.deliveryStatus}
                      </span>
                    </div>
                  </div>
                )}
                {order.stores.length > 0 && (
                  <div className={styles.deliveryRow}>
                    <span className={styles.deliveryIcon}>
                      <FiPackage size={17} />
                    </span>
                    <div className={styles.deliveryInfo}>
                      <span className={styles.deliveryLabel}>Продавец</span>
                      <span className={styles.deliveryValue}>
                        {order.stores.join(", ")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {events.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>История заказа</h2>
                </div>
                <OrderTimeline events={events} />
              </section>
            )}

            {canCancel && (
              <section className={styles.cancelSection}>
                {cancelError && (
                  <p className={styles.cancelError}>{cancelError}</p>
                )}

                {!cancelArmed ? (
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setCancelArmed(true)}
                  >
                    Отменить заказ
                  </button>
                ) : (
                  <div className={styles.cancelConfirm}>
                    <p className={styles.cancelHint}>
                      {order.paidAt
                        ? "Оплата вернётся на баланс, товары снова появятся в наличии."
                        : "Заказ будет отменён, товары снова появятся в наличии."}
                    </p>
                    <div className={styles.cancelActions}>
                      <button
                        type="button"
                        className={styles.cancelGhost}
                        disabled={cancelling}
                        onClick={() => setCancelArmed(false)}
                      >
                        Оставить
                      </button>
                      <button
                        type="button"
                        className={styles.cancelDanger}
                        disabled={cancelling}
                        onClick={() => void handleCancel()}
                      >
                        {cancelling ? "Отменяем…" : "Да, отменить"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            <button
              className={styles.backBtn}
              onClick={() => navigate("/orders")}
            >
              Все заказы <FiChevronRight size={16} />
            </button>
          </>
        )}
      </PageContainer>

      <OrderReviewSheet
        open={reviewOpen}
        item={reviewTarget}
        onClose={() => setReviewOpen(false)}
        onSubmitted={handleSubmitted}
      />
    </div>
  );
}
