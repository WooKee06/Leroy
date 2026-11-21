import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import type {
  AdminComplaintDto,
  AdminSellerDetailsDto,
} from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import {
  actionLabel,
  canModerateStore,
  formatDate,
  formatDateTime,
  formatMoney,
  personName,
  stateValue,
  statusMeta,
  STORE_STATUSES,
} from "@shared/lib/admin";
import {
  ActionRow,
  AdminCard,
  ConfirmDialog,
  DetailGrid,
  DetailItem,
  PageIntro,
  ReasonDialog,
  StateBlock,
  StatusBadge,
} from "@shared/ui/admin/AdminUi";
import styles from "./AdminSellerDetailPage.module.scss";

type PendingAction =
  | "verify"
  | "reject"
  | "block"
  | "unblock"
  | "request_docs"
  | "unverify"
  | null;

function AdminSellerDetailPage() {
  const { id = "" } = useParams();
  const [details, setDetails] = useState<AdminSellerDetailsDto | null>(null);
  const [complaints, setComplaints] = useState<AdminComplaintDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    let alive = true;
    setError(null);
    Promise.all([
      leroyApi.adminSeller(id),
      leroyApi.adminComplaints({ targetType: "store", targetId: id, limit: 100 }),
    ])
      .then(([result, list]) => {
        if (!alive) return;
        setDetails(result);
        setComplaints(list.items);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  };

  useEffect(() => load(), [id]);

  const runAction = async (action: Exclude<PendingAction, null>, reason?: string) => {
    setBusy(true);
    setActionError(null);
    try {
      const store = await leroyApi.adminModerateStore(id, { action, reason });
      setDetails((prev) =>
        prev ? { ...prev, store: { ...prev.store, ...store } } : prev,
      );
      setPending(null);
      await leroyApi.adminSeller(id).then(setDetails).catch(() => undefined);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не удалось выполнить действие");
    } finally {
      setBusy(false);
    }
  };

  const store = details?.store;
  const status = statusMeta(STORE_STATUSES, store?.moderationStatus);

  return (
    <div>
      <PageIntro
        title="Продавец"
        description={store?.name ?? "Профиль магазина"}
        action={<Link to="/admin/sellers" className={styles.back}>К списку</Link>}
      />

      {error && <StateBlock kind="error" text={error} />}
      {!details && !error && <StateBlock kind="loading" text="Загружаем профиль…" />}

      {details && store && (
        <div className={styles.grid}>
          <div className={styles.column}>
            <AdminCard title="Основные данные">
              <DetailGrid>
                <DetailItem label="Магазин">{store.name}</DetailItem>
                <DetailItem label="Продавец">{personName(store.owner)}</DetailItem>
                <DetailItem label="Статус">
                  <StatusBadge {...status} />
                </DetailItem>
                <DetailItem label="Дата регистрации">{formatDate(store.createdAt)}</DetailItem>
                <DetailItem label="Товаров">{details.productCount}</DetailItem>
                <DetailItem label="Жалоб">{details.complaintCount}</DetailItem>
                <DetailItem label="Рейтинг">{store.rating ?? "—"}</DetailItem>
                <DetailItem label="Активен">{store.isActive ? "Да" : "Нет"}</DetailItem>
              </DetailGrid>
              {store.moderationReason && (
                <p className={styles.reason}>Причина: {store.moderationReason}</p>
              )}
            </AdminCard>

            <AdminCard title="Данные магазина">
              <p className={styles.description}>{store.description || "Описание отсутствует"}</p>
              <DetailGrid>
                <DetailItem label="Slug">{store.slug}</DetailItem>
                <DetailItem label="Время обработки">{store.processingTime ?? "—"}</DetailItem>
                <DetailItem label="Доставка">{store.deliveryPrice ? formatMoney(store.deliveryPrice) : "—"}</DetailItem>
                <DetailItem label="Способы доставки">
                  {store.deliveryMethods?.join(", ") || "—"}
                </DetailItem>
              </DetailGrid>
            </AdminCard>

            <AdminCard title="Контакты">
              <DetailGrid>
                <DetailItem label="Telegram">
                  {store.owner?.username ? `@${store.owner.username}` : "—"}
                </DetailItem>
                <DetailItem label="Telegram ID">{store.owner?.telegramId ?? "—"}</DetailItem>
              </DetailGrid>
            </AdminCard>

            <AdminCard title="Товары продавца" padded={false}>
              {details.products.length === 0 ? (
                <p className={styles.empty}>Товаров нет</p>
              ) : (
                <ul className={styles.rows}>
                  {details.products.map((product) => (
                    <li key={product.id}>
                      <Link
                        to={`/admin/catalog/${product.id}`}
                        state={{ from: `/admin/sellers/${id}` }}
                      >
                        {product.name}
                      </Link>
                      <span>{formatMoney(product.price)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard title="Заказы" padded={false}>
              {details.orders.length === 0 ? (
                <p className={styles.empty}>Заказов нет</p>
              ) : (
                <ul className={styles.rows}>
                  {details.orders.map((order) => (
                    <li key={order.id}>
                      <span>№{order.order?.orderNumber ?? order.id.slice(0, 8)}</span>
                      <span>{formatMoney(order.subtotal)}</span>
                      <span>{formatDate(order.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard title="Жалобы" padded={false}>
              {complaints.length === 0 ? (
                <p className={styles.empty}>Жалоб нет</p>
              ) : (
                <ul className={styles.rows}>
                  {complaints.map((complaint) => (
                    <li key={complaint.id}>
                      <Link to={`/admin/complaints/${complaint.id}`}>
                        {complaint.reason}
                      </Link>
                      <span>{formatDate(complaint.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>

          <div className={styles.column}>
            <AdminCard title="Проверка продавца">
              <p className={styles.help}>
                Автоматического подтверждения нет: статус меняется только после
                решения администратора.
              </p>
              <ActionRow>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={
                    busy || !canModerateStore(store.moderationStatus, "verify")
                  }
                  onClick={() => setPending("verify")}
                >
                  Подтвердить
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={
                    busy || !canModerateStore(store.moderationStatus, "reject")
                  }
                  onClick={() => setPending("reject")}
                >
                  Отклонить
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={
                    busy || !canModerateStore(store.moderationStatus, "request_docs")
                  }
                  onClick={() => setPending("request_docs")}
                >
                  Запросить документы
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  disabled={
                    busy || !canModerateStore(store.moderationStatus, "block")
                  }
                  onClick={() => setPending("block")}
                >
                  Заблокировать
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={
                    busy || !canModerateStore(store.moderationStatus, "unblock")
                  }
                  onClick={() => setPending("unblock")}
                >
                  Разблокировать
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={
                    busy || !canModerateStore(store.moderationStatus, "unverify")
                  }
                  onClick={() => setPending("unverify")}
                >
                  Снять подтверждение
                </button>
              </ActionRow>
              {actionError && <p className={styles.actionError}>{actionError}</p>}
            </AdminCard>

            <AdminCard title="История модерации" padded={false}>
              {details.moderationHistory.length === 0 ? (
                <p className={styles.empty}>Решений пока нет</p>
              ) : (
                <ul className={styles.timeline}>
                  {details.moderationHistory.map((log) => (
                    <li key={log.id}>
                      <strong>{actionLabel(log.action)}</strong>
                      <span>
                        {stateValue(log.before)} → {stateValue(log.after)}
                        {log.reason ? ` · ${log.reason}` : ""}
                      </span>
                      <time>{formatDateTime(log.createdAt)}</time>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>
        </div>
      )}

      {(pending === "verify" ||
        pending === "unblock" ||
        pending === "unverify") && (
        <ConfirmDialog
          title={
            pending === "verify"
              ? "Подтвердить продавца"
              : pending === "unblock"
                ? "Разблокировать продавца"
                : "Снять подтверждение"
          }
          message="Действие будет записано в журнал администратора."
          confirmLabel="Подтвердить"
          onCancel={() => setPending(null)}
          onConfirm={() => void runAction(pending)}
        />
      )}
      {(pending === "reject" ||
        pending === "block" ||
        pending === "request_docs") && (
        <ReasonDialog
          title={
            pending === "reject"
              ? "Отклонить проверку"
              : pending === "block"
                ? "Заблокировать продавца"
                : "Запросить документы"
          }
          message="Укажите причину — она сохранится в истории и будет отправлена продавцу."
          confirmLabel={pending === "request_docs" ? "Запросить" : "Подтвердить"}
          danger={pending === "block"}
          onCancel={() => setPending(null)}
          onConfirm={(reason) => void runAction(pending, reason)}
        />
      )}
    </div>
  );
}

export default observer(AdminSellerDetailPage);
