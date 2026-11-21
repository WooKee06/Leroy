import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import type { AdminUserDetailsDto } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import {
  actionLabel,
  COMPLAINT_REASONS,
  formatDate,
  formatDateTime,
  formatMoney,
  personName,
  stateValue,
} from "@shared/lib/admin";
import {
  ActionRow,
  AdminCard,
  ConfirmDialog,
  DetailGrid,
  DetailItem,
  PageIntro,
  StateBlock,
} from "@shared/ui/admin/AdminUi";
import styles from "./AdminUserDetailPage.module.scss";

type Confirmation = { kind: "status" | "role"; value: string } | null;

function AdminUserDetailPage() {
  const { id = "" } = useParams();
  const [details, setDetails] = useState<AdminUserDetailsDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setError(null);
    leroyApi
      .adminUser(id)
      .then((result) => {
        if (alive) setDetails(result);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const run = async () => {
    if (!confirmation) return;
    setBusy(true);
    setActionError(null);
    try {
      if (confirmation.kind === "status") {
        await leroyApi.adminUpdateUserStatus(
          id,
          confirmation.value as "active" | "blocked",
        );
      } else {
        await leroyApi.adminUpdateUserRole(
          id,
          confirmation.value as "buyer" | "seller",
        );
      }
      setDetails(await leroyApi.adminUser(id));
      setConfirmation(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не удалось обновить пользователя");
    } finally {
      setBusy(false);
    }
  };

  const user = details?.user;

  return (
    <div>
      <PageIntro
        title="Пользователь"
        description={user ? personName(user) : "Профиль пользователя"}
        action={<Link to="/admin/users" className={styles.back}>К списку</Link>}
      />

      {error && <StateBlock kind="error" text={error} />}
      {!details && !error && <StateBlock kind="loading" text="Загружаем профиль…" />}

      {details && user && (
        <div className={styles.grid}>
          <div className={styles.column}>
            <AdminCard title="Профиль">
              <DetailGrid>
                <DetailItem label="Имя">{personName(user)}</DetailItem>
                <DetailItem label="Telegram ID">{user.telegramId}</DetailItem>
                <DetailItem label="Username">
                  {user.username ? `@${user.username}` : "—"}
                </DetailItem>
                <DetailItem label="Роль">{user.role}</DetailItem>
                <DetailItem label="Статус">
                  {user.status === "blocked" ? "Заблокирован" : "Активен"}
                </DetailItem>
                <DetailItem label="Регистрация">{formatDate(user.createdAt)}</DetailItem>
              </DetailGrid>
            </AdminCard>

            <AdminCard title="Заказы" padded={false}>
              {details.orders.length === 0 ? (
                <p className={styles.empty}>Заказов нет</p>
              ) : (
                <ul className={styles.rows}>
                  {details.orders.map((order) => (
                    <li key={order.id}>
                      <span>№{order.orderNumber}</span>
                      <span>{formatMoney(order.total)}</span>
                      <span>{order.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard title="Магазины" padded={false}>
              {details.stores.length === 0 ? (
                <p className={styles.empty}>Магазинов нет</p>
              ) : (
                <ul className={styles.rows}>
                  {details.stores.map((store) => (
                    <li key={store.id}>
                      <Link to={`/admin/sellers/${store.id}`}>{store.name}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard title="Жалобы" padded={false}>
              {details.complaints.length === 0 ? (
                <p className={styles.empty}>Жалоб нет</p>
              ) : (
                <ul className={styles.rows}>
                  {details.complaints.map((complaint) => (
                    <li key={complaint.id}>
                      <Link to={`/admin/complaints/${complaint.id}`}>
                        {COMPLAINT_REASONS[complaint.reason] ?? complaint.reason}
                      </Link>
                      <span>{complaint.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>

          <div className={styles.column}>
            <AdminCard title="Управление доступом">
              <ActionRow>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={busy || user.status !== "blocked"}
                  onClick={() => setConfirmation({ kind: "status", value: "active" })}
                >
                  Разблокировать
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  disabled={busy || user.status === "blocked"}
                  onClick={() => setConfirmation({ kind: "status", value: "blocked" })}
                >
                  Заблокировать
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={busy || user.role === "buyer"}
                  onClick={() => setConfirmation({ kind: "role", value: "buyer" })}
                >
                  Роль: покупатель
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={busy || user.role === "seller"}
                  onClick={() => setConfirmation({ kind: "role", value: "seller" })}
                >
                  Роль: продавец
                </button>
              </ActionRow>
              {actionError && <p className={styles.actionError}>{actionError}</p>}
            </AdminCard>

            <AdminCard title="История действий" padded={false}>
              {details.audit.length === 0 ? (
                <p className={styles.empty}>Действий нет</p>
              ) : (
                <ul className={styles.timeline}>
                  {details.audit.map((log) => (
                    <li key={log.id}>
                      <strong>{actionLabel(log.action)}</strong>
                      <span>
                        {stateValue(log.before)} → {stateValue(log.after)}
                      </span>
                      {log.reason && <span>Причина: {log.reason}</span>}
                      <time>{formatDateTime(log.createdAt)}</time>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>
        </div>
      )}

      {confirmation && (
        <ConfirmDialog
          title={confirmation.kind === "status" ? "Статус аккаунта" : "Роль пользователя"}
          message={`Вы уверены? Новое значение: ${confirmation.value}. Назначить admin через админку нельзя.`}
          confirmLabel="Подтвердить"
          danger={confirmation.kind === "status" && confirmation.value === "blocked"}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => void run()}
        />
      )}
    </div>
  );
}

export default observer(AdminUserDetailPage);
