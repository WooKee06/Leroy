import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import type {
  AdminComplaintDto,
  AdminProductDto,
  AdminSellerDto,
} from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import {
  actionLabel,
  COMPLAINT_REASONS,
  COMPLAINT_STATUSES,
  formatDateTime,
  personName,
  stateValue,
  statusMeta,
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
import styles from "./AdminComplaintDetailPage.module.scss";

type Pending =
  | "review"
  | "hide_product"
  | "block_product"
  | "block_seller"
  | "reject"
  | "resolve"
  | null;

function AdminComplaintDetailPage() {
  const { id = "" } = useParams();
  const [complaint, setComplaint] = useState<AdminComplaintDto | null>(null);
  const [product, setProduct] = useState<AdminProductDto | null>(null);
  const [seller, setSeller] = useState<AdminSellerDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setError(null);
    leroyApi
      .adminComplaint(id)
      .then(async (result) => {
        if (!alive) return;
        setComplaint(result);
        if (result.targetType === "product") {
          leroyApi
            .adminProduct(result.targetId)
            .then((details) => {
              if (alive) setProduct(details.product);
            })
            .catch(() => undefined);
        } else if (result.targetType === "store") {
          leroyApi
            .adminSeller(result.targetId)
            .then((details) => {
              if (alive) setSeller(details.store);
            })
            .catch(() => undefined);
        }
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const update = async (dto: {
    status: string;
    resolution?: string;
    productAction?: string;
    storeAction?: string;
  }) => {
    setBusy(true);
    setActionError(null);
    try {
      const result = await leroyApi.adminUpdateComplaint(id, dto);
      setComplaint(result);
      const refreshed = await leroyApi.adminComplaint(id);
      setComplaint(refreshed);
      setPending(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не удалось обновить жалобу");
    } finally {
      setBusy(false);
    }
  };

  const status = statusMeta(COMPLAINT_STATUSES, complaint?.status);

  return (
    <div>
      <PageIntro
        title="Жалоба"
        description={complaint ? `№ ${complaint.id.slice(0, 8)}` : "Просмотр жалобы"}
        action={<Link to="/admin/complaints" className={styles.back}>К списку</Link>}
      />

      {error && <StateBlock kind="error" text={error} />}
      {!complaint && !error && <StateBlock kind="loading" text="Загружаем жалобу…" />}

      {complaint && (
        <div className={styles.grid}>
          <div className={styles.column}>
            <AdminCard title="Информация">
              <DetailGrid>
                <DetailItem label="Статус">
                  <StatusBadge {...status} />
                </DetailItem>
                <DetailItem label="Причина">
                  {COMPLAINT_REASONS[complaint.reason] ?? complaint.reason}
                </DetailItem>
                <DetailItem label="Отправитель">{personName(complaint.reporter)}</DetailItem>
                <DetailItem label="Дата">{formatDateTime(complaint.createdAt)}</DetailItem>
                <DetailItem label="Объект">
                  {product ? (
                    <Link to={`/admin/catalog/${product.id}`}>{product.name}</Link>
                  ) : seller ? (
                    <Link to={`/admin/sellers/${seller.id}`}>{seller.name}</Link>
                  ) : (
                    `${complaint.targetType}: ${complaint.targetId.slice(0, 8)}`
                  )}
                </DetailItem>
                <DetailItem label="Продавец">
                  {product?.store?.name ?? seller?.name ?? "—"}
                </DetailItem>
              </DetailGrid>
              <p className={styles.comment}>
                {complaint.comment || "Комментарий не оставлен"}
              </p>
              {complaint.resolution && (
                <p className={styles.resolution}>Решение: {complaint.resolution}</p>
              )}
            </AdminCard>

            <AdminCard title="История решений" padded={false}>
              {(complaint.history ?? []).length === 0 ? (
                <p className={styles.empty}>Истории пока нет</p>
              ) : (
                <ul className={styles.timeline}>
                  {complaint.history!.map((log) => (
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

          <div className={styles.column}>
            <AdminCard title="Действия">
              <ActionRow>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={busy || complaint.status === "under_review"}
                  onClick={() => setPending("review")}
                >
                  Начать проверку
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={busy || complaint.targetType !== "product"}
                  onClick={() => setPending("hide_product")}
                >
                  Скрыть товар
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  disabled={busy || complaint.targetType !== "product"}
                  onClick={() => setPending("block_product")}
                >
                  Заблокировать товар
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  disabled={busy || complaint.targetType !== "store"}
                  onClick={() => setPending("block_seller")}
                >
                  Заблокировать продавца
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={busy || complaint.status === "rejected"}
                  onClick={() => setPending("reject")}
                >
                  Отклонить жалобу
                </button>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={busy || complaint.status === "resolved"}
                  onClick={() => setPending("resolve")}
                >
                  Закрыть жалобу
                </button>
              </ActionRow>
              {actionError && <p className={styles.actionError}>{actionError}</p>}
            </AdminCard>
          </div>
        </div>
      )}

      {pending === "review" && (
        <ConfirmDialog
          title="Начать проверку"
          message="Жалоба перейдёт в статус «На проверке»."
          confirmLabel="Начать"
          onCancel={() => setPending(null)}
          onConfirm={() => void update({ status: "under_review" })}
        />
      )}
      {pending === "hide_product" && (
        <ConfirmDialog
          title="Скрыть товар"
          message="Товар будет скрыт из каталога и отправлен в архив."
          confirmLabel="Скрыть"
          danger
          onCancel={() => setPending(null)}
          onConfirm={() =>
            void update({
              status: "under_review",
              productAction: "hide",
              resolution: `Жалоба ${id.slice(0, 8)}: товар скрыт`,
            })
          }
        />
      )}
      {pending === "block_product" && (
        <ConfirmDialog
          title="Заблокировать товар"
          message="Товар будет заблокирован и удалён из каталога."
          confirmLabel="Заблокировать"
          danger
          onCancel={() => setPending(null)}
          onConfirm={() =>
            void update({
              status: "resolved",
              productAction: "block",
              resolution: `Жалоба ${id.slice(0, 8)}: товар заблокирован`,
            })
          }
        />
      )}
      {pending === "block_seller" && (
        <ConfirmDialog
          title="Заблокировать продавца"
          message="Магазин будет заблокирован, его товары станут недоступны."
          confirmLabel="Заблокировать"
          danger
          onCancel={() => setPending(null)}
          onConfirm={() =>
            void update({
              status: "resolved",
              storeAction: "block",
              resolution: `Жалоба ${id.slice(0, 8)}: продавец заблокирован`,
            })
          }
        />
      )}
      {(pending === "reject" || pending === "resolve") && (
        <ReasonDialog
          title={pending === "reject" ? "Отклонить жалобу" : "Закрыть жалобу"}
          message="Укажите решение — оно сохранится в истории жалобы."
          confirmLabel={pending === "reject" ? "Отклонить" : "Закрыть"}
          onCancel={() => setPending(null)}
          onConfirm={(reason) =>
            void update({
              status: pending === "reject" ? "rejected" : "resolved",
              resolution: reason,
            })
          }
        />
      )}
    </div>
  );
}

export default observer(AdminComplaintDetailPage);
