import { useCallback, useEffect, useState } from "react";
import { FiChevronDown, FiChevronUp, FiSearch } from "react-icons/fi";
import { observer } from "mobx-react-lite";
import type { RawOrder } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import { imageUrlWithCacheBust } from "@shared/api/client";
import {
  canAdminChangeOrderStatus,
  formatDate,
  formatMoney,
  ORDER_STATUSES,
  personName,
  statusMeta,
} from "@shared/lib/admin";
import {
  AdminCard,
  ConfirmDialog,
  PageIntro,
  ReasonDialog,
  SelectInput,
  StateBlock,
  StatusBadge,
  Toolbar,
} from "@shared/ui/admin/AdminUi";
import styles from "./AdminOrdersPage.module.scss";

const PAGE_SIZE = 20;

function AdminOrdersPage() {
  const [orders, setOrders] = useState<RawOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<{ id: string; status: string } | null>(null);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    leroyApi
      .adminOrders({ page, limit: PAGE_SIZE, status: status || undefined })
      .then((result) => {
        if (!alive) return;
        setOrders(
          result.items.map((order) => ({
            ...order,
            sellerOrders: order.sellerOrders?.map((sellerOrder) => ({
              ...sellerOrder,
              items: sellerOrder.items?.map((item) => ({
                ...item,
                imageUrl: imageUrlWithCacheBust(item.imageUrl, order.createdAt),
              })),
            })),
          })),
        );
        setTotal(result.total);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [page, status]);

  useEffect(() => load(), [load]);
  useEffect(() => setPage(1), [status]);

  const filtered = orders.filter((order) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      String(order.orderNumber).includes(query) ||
      personName(order.user).toLowerCase().includes(query)
    );
  });

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const changeStatus = async (reason?: string) => {
    if (!nextStatus) return;
    setActionError(null);
    try {
      const updated = await leroyApi.adminUpdateOrderStatus(
        nextStatus.id,
        nextStatus.status,
        reason,
      );
      setOrders((prev) =>
        prev.map((order) => (order.id === updated.id ? { ...order, ...updated } : order)),
      );
      setNextStatus(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не удалось изменить статус");
      setNextStatus(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageIntro
        title="Заказы"
        description="Список заказов, покупатели и продавцы, суммы и статусы."
      />

      <Toolbar>
        <div className={styles.search}>
          <FiSearch size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Номер заказа или покупатель"
          />
        </div>
        <SelectInput
          value={status}
          onChange={setStatus}
          options={[
            { id: "", label: "Все статусы" },
            ...Object.entries(ORDER_STATUSES).map(([id, value]) => ({
              id,
              label: value.label,
            })),
          ]}
        />
      </Toolbar>

      {actionError && <StateBlock kind="error" text={actionError} />}

      <AdminCard padded={false}>
        {error ? (
          <StateBlock kind="error" text={error} />
        ) : loading ? (
          <StateBlock kind="loading" text="Загружаем заказы…" />
        ) : filtered.length === 0 ? (
          <StateBlock kind="empty" text="Заказы не найдены" />
        ) : (
          <div className={styles.list}>
            {filtered.map((order) => {
              const isOpen = expanded.has(order.id);
              const items = order.sellerOrders?.flatMap((sellerOrder) => sellerOrder.items ?? []) ?? [];
              const statusInfo = statusMeta(ORDER_STATUSES, order.status);
              return (
                <div key={order.id} className={styles.order}>
                  <button
                    type="button"
                    className={styles.orderHead}
                    onClick={() => toggle(order.id)}
                  >
                    <span className={styles.number}>№{order.orderNumber}</span>
                    <span className={styles.buyer}>{personName(order.user)}</span>
                    <span className={styles.seller}>
                      {order.sellerOrders?.map((sellerOrder) => sellerOrder.store?.name).filter(Boolean).join(", ") || "—"}
                    </span>
                    <StatusBadge {...statusInfo} />
                    <span className={styles.total}>{formatMoney(order.total)}</span>
                    <span className={styles.date}>{formatDate(order.createdAt)}</span>
                    {isOpen ? <FiChevronUp size={17} /> : <FiChevronDown size={17} />}
                  </button>
                  {isOpen && (
                    <div className={styles.orderBody}>
                      <div className={styles.orderMeta}>
                        <span>Адрес: {order.deliveryAddress || "—"}</span>
                        <span>Способ: {order.deliveryMethod || "—"}</span>
                        <label>
                          Статус:{" "}
                          <select
                            value={order.status}
                            onChange={(event) =>
                              setNextStatus({ id: order.id, status: event.target.value })
                            }
                          >
                            {Object.entries(ORDER_STATUSES)
                              .filter(
                                ([id]) =>
                                  id === order.status ||
                                  canAdminChangeOrderStatus(order.status, id),
                              )
                              .map(([id, value]) => (
                                <option key={id} value={id}>
                                  {value.label}
                                </option>
                              ))}
                          </select>
                        </label>
                      </div>
                      <div className={styles.items}>
                        {items.map((item) => (
                          <div key={item.id} className={styles.item}>
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt="" loading="lazy" />
                            )}
                            <div>
                              <strong>{item.name}</strong>
                              <span>
                                {item.quantity} × {formatMoney(item.price)}
                              </span>
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
      </AdminCard>

      <div className={styles.pagination}>
        <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
          Назад
        </button>
        <span>
          Страница {page} из {totalPages} · {total} заказов
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((value) => value + 1)}
        >
          Вперёд
        </button>
      </div>

      {nextStatus &&
        (nextStatus.status === "cancelled" ? (
          <ReasonDialog
            title="Отменить заказ"
            message="Товар вернётся на склад, а оплаченная сумма — на кошелёк покупателя. Укажите причину отмены."
            confirmLabel="Отменить заказ"
            danger
            onCancel={() => setNextStatus(null)}
            onConfirm={(reason) => void changeStatus(reason)}
          />
        ) : (
          <ConfirmDialog
            title="Изменить статус заказа"
            message={`Новый статус: ${
              ORDER_STATUSES[nextStatus.status]?.label ?? nextStatus.status
            }.`}
            confirmLabel="Изменить"
            onCancel={() => setNextStatus(null)}
            onConfirm={() => void changeStatus()}
          />
        ))}
    </div>
  );
}

export default observer(AdminOrdersPage);
