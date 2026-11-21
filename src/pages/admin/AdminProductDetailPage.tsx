import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import type { AdminProductDetailsDto, AdminProductDto } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import { imageUrlWithCacheBust } from "@shared/api/client";
import {
  canModerateProduct,
  COMPLAINT_REASONS,
  formatDate,
  formatDateTime,
  formatMoney,
  PRODUCT_STATUSES,
  stateValue,
  statusMeta,
  actionLabel,
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
import styles from "./AdminProductDetailPage.module.scss";

type PendingAction =
  | "approve"
  | "reject"
  | "block"
  | "request_docs"
  | "return_to_draft"
  | "archive"
  | null;

function AdminProductDetailPage() {
  const { id = "" } = useParams();
  const [details, setDetails] = useState<AdminProductDetailsDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    let alive = true;
    setError(null);
    leroyApi
      .adminProduct(id)
      .then((result) => {
        if (alive) setDetails(result);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  };

  useEffect(() => load(), [id]);

  const applyProduct = (product: AdminProductDto) => {
    setDetails((prev) => (prev ? { ...prev, product } : prev));
  };

  const runAction = async (action: Exclude<PendingAction, null>, reason?: string) => {
    setBusy(true);
    setActionError(null);
    try {
      const product = await leroyApi.adminModerateProduct(id, {
        action,
        reason,
      });
      applyProduct(product);
      const next = await leroyApi.adminProduct(id);
      setDetails(next);
      setPending(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Не удалось выполнить действие");
    } finally {
      setBusy(false);
    }
  };

  const product = details?.product;
  const status = statusMeta(PRODUCT_STATUSES, product?.moderationStatus);

  return (
    <div>
      <PageIntro
        title="Товар"
        description={product?.name ?? "Просмотр и решение по товару"}
        action={<Link to="/admin/moderation" className={styles.back}>К очереди</Link>}
      />

      {error && <StateBlock kind="error" text={error} />}
      {!details && !error && <StateBlock kind="loading" text="Загружаем товар…" />}

      {details && product && (
        <div className={styles.grid}>
          <div className={styles.column}>
            <AdminCard title={product.name} subtitle={product.category?.name ?? "Без категории"}>
              <div className={styles.gallery}>
                {(product.images ?? []).length === 0 ? (
                  <div className={styles.noImage}>Изображений нет</div>
                ) : (
                  product.images.map((image, index) => (
                    <img
                      key={`${image}-${index}`}
                      src={imageUrlWithCacheBust(image, product.createdAt)}
                      alt={`${product.name} — фото ${index + 1}`}
                    />
                  ))
                )}
              </div>
              <p className={styles.description}>
                {product.description || "Описание отсутствует"}
              </p>
              <DetailGrid>
                <DetailItem label="Цена">{formatMoney(product.price)}</DetailItem>
                <DetailItem label="Остаток">{product.stock ?? 0} шт.</DetailItem>
                <DetailItem label="Статус">
                  <StatusBadge {...status} />
                </DetailItem>
                <DetailItem label="Создан">{formatDate(product.createdAt)}</DetailItem>
                <DetailItem label="Рейтинг">{product.rating ?? "—"}</DetailItem>
                <DetailItem label="Продаж">{product.salesCount ?? 0}</DetailItem>
              </DetailGrid>
              {product.moderationReason && (
                <p className={styles.reason}>
                  Причина последнего решения: {product.moderationReason}
                </p>
              )}
            </AdminCard>

            <AdminCard title="Продавец" padded={false}>
              <div className={styles.sellerBlock}>
                <DetailGrid>
                  <DetailItem label="Магазин">
                    <Link to={`/admin/sellers/${product.storeId}`}>
                      {product.store?.name ?? "—"}
                    </Link>
                  </DetailItem>
                  <DetailItem label="Проверен">
                    {product.store?.isVerified ? "Да" : "Нет"}
                  </DetailItem>
                  <DetailItem label="Рейтинг">{product.store?.rating ?? "—"}</DetailItem>
                  <DetailItem label="Товаров">{product.store?.productCount ?? "—"}</DetailItem>
                </DetailGrid>
                <Link className={styles.sellerLink} to={`/admin/sellers/${product.storeId}`}>
                  Открыть профиль продавца
                </Link>
              </div>
            </AdminCard>

            <AdminCard title="Жалобы на товар" padded={false}>
              {details.complaints.length === 0 ? (
                <p className={styles.empty}>Жалоб нет</p>
              ) : (
                <ul className={styles.timeline}>
                  {details.complaints.map((complaint) => (
                    <li key={complaint.id}>
                      <strong>{COMPLAINT_REASONS[complaint.reason] ?? complaint.reason}</strong>
                      <span>{complaint.comment || "Без комментария"}</span>
                      <time>{formatDateTime(complaint.createdAt)}</time>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>

          <div className={styles.column}>
            <AdminCard title="Решение модератора">
              <p className={styles.help}>
                Изменение статуса сохраняется в журнале действий backend. Повторное
                применение того же решения заблокировано.
              </p>
              <ActionRow>
                <button
                  type="button"
                  className={styles.primary}
                  disabled={
                    busy || !canModerateProduct(product.moderationStatus, "approve")
                  }
                  onClick={() => setPending("approve")}
                >
                  Одобрить
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={
                    busy || !canModerateProduct(product.moderationStatus, "reject")
                  }
                  onClick={() => setPending("reject")}
                >
                  Отклонить
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  disabled={
                    busy || !canModerateProduct(product.moderationStatus, "block")
                  }
                  onClick={() => setPending("block")}
                >
                  Заблокировать
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={
                    busy ||
                    !canModerateProduct(product.moderationStatus, "request_docs")
                  }
                  onClick={() => setPending("request_docs")}
                >
                  Запросить документы
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={
                    busy ||
                    !canModerateProduct(product.moderationStatus, "return_to_draft")
                  }
                  onClick={() => setPending("return_to_draft")}
                >
                  На доработку
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={
                    busy || !canModerateProduct(product.moderationStatus, "archive")
                  }
                  onClick={() => setPending("archive")}
                >
                  В архив
                </button>
              </ActionRow>
              {actionError && <p className={styles.actionError}>{actionError}</p>}
            </AdminCard>

            <AdminCard title="История решений" padded={false}>
              {details.history.length === 0 ? (
                <p className={styles.empty}>Решений пока нет</p>
              ) : (
                <ul className={styles.timeline}>
                  {details.history.map((log) => (
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

      {pending === "approve" && (
        <ConfirmDialog
          title="Одобрить товар"
          message={`Товар «${product?.name ?? ""}» станет доступен покупателям.`}
          confirmLabel="Одобрить"
          onCancel={() => setPending(null)}
          onConfirm={() => void runAction("approve")}
        />
      )}
      {pending === "return_to_draft" && (
        <ConfirmDialog
          title="Отправить на доработку"
          message="Товар будет скрыт из каталога и вернётся продавцу."
          confirmLabel="Вернуть"
          onCancel={() => setPending(null)}
          onConfirm={() => void runAction("return_to_draft")}
        />
      )}
      {pending === "archive" && (
        <ConfirmDialog
          title="Архивировать товар"
          message="Товар будет скрыт из каталога."
          confirmLabel="В архив"
          onCancel={() => setPending(null)}
          onConfirm={() => void runAction("archive")}
        />
      )}
      {(pending === "reject" || pending === "block" || pending === "request_docs") && (
        <ReasonDialog
          title={
            pending === "reject"
              ? "Отклонить товар"
              : pending === "block"
                ? "Заблокировать товар"
                : "Запросить документы"
          }
          message="Укажите причину — она будет сохранена в истории и отправлена продавцу."
          confirmLabel={pending === "request_docs" ? "Запросить" : "Подтвердить"}
          danger={pending === "block"}
          onCancel={() => setPending(null)}
          onConfirm={(reason) => void runAction(pending, reason)}
        />
      )}
    </div>
  );
}

export default observer(AdminProductDetailPage);
