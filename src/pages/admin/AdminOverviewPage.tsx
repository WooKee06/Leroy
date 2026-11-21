import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import type {
  AdminComplaintDto,
  AdminDashboardDto,
  AdminSellerDto,
} from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import {
  actionLabel,
  auditObjectLabel,
  auditTargetHref,
  COMPLAINT_REASONS,
  formatDateTime,
  formatMoney,
  personName,
  statusMeta,
  PRODUCT_STATUSES,
  STORE_STATUSES,
} from "@shared/lib/admin";
import {
  AdminCard,
  PageIntro,
  StateBlock,
  StatusBadge,
} from "@shared/ui/admin/AdminUi";
import styles from "./AdminOverviewPage.module.scss";

function AdminOverviewPage() {
  const [data, setData] = useState<AdminDashboardDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    leroyApi
      .adminDashboard()
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((err: Error) => {
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, []);

  const metrics = data
    ? [
        { label: "Пользователи", value: data.totalUsers, to: "/admin/users" },
        { label: "Продавцы", value: data.totalSellers, to: "/admin/sellers" },
        {
          label: "Активные продавцы",
          value: data.activeSellers,
          to: "/admin/sellers",
        },
        { label: "Товары", value: data.totalProducts, to: "/admin/catalog" },
        {
          label: "На модерации",
          value: data.pendingProducts,
          to: "/admin/moderation",
        },
        {
          label: "Заблокировано товаров",
          value: data.blockedProducts,
          to: "/admin/catalog",
        },
        {
          label: "Новые жалобы",
          value: data.newComplaints,
          to: "/admin/complaints",
        },
        { label: "Заказы", value: data.totalOrders, to: "/admin/orders" },
      ]
    : [];

  return (
    <div>
      <PageIntro
        title="Обзор"
        description="Ключевые показатели маркетплейса и последние события."
      />

      {error && <StateBlock kind="error" text={error} />}
      {!data && !error && <StateBlock kind="loading" text="Загружаем данные…" />}

      {data && (
        <>
          <div className={styles.metrics}>
            {metrics.map((metric) => (
              <Link key={metric.label} to={metric.to} className={styles.metric}>
                <span className={styles.metricValue}>{metric.value}</span>
                <span className={styles.metricLabel}>{metric.label}</span>
              </Link>
            ))}
          </div>

          <div className={styles.revenue}>
            <span>Выручка за всё время</span>
            <strong>{formatMoney(data.totalRevenue)}</strong>
          </div>

          <div className={styles.grid}>
            <AdminCard
              title="Последние действия"
              action={<Link to="/admin/audit">Все</Link>}
              padded={false}
            >
              {(data.recentAudit ?? []).length === 0 ? (
                <p className={styles.empty}>Действий пока нет</p>
              ) : (
                <ul className={styles.list}>
                  {data.recentAudit!.map((log) => {
                    const href = auditTargetHref(log);
                    const content = (
                      <>
                        <div>
                          <strong>{actionLabel(log.action)}</strong>
                          <span>{auditObjectLabel(log)}</span>
                        </div>
                        <time>{formatDateTime(log.createdAt)}</time>
                      </>
                    );
                    return (
                      <li key={log.id} className={styles.listItem}>
                        {href ? (
                          <Link
                            to={href}
                            state={{ from: "/admin" }}
                            className={styles.listLink}
                          >
                            {content}
                          </Link>
                        ) : (
                          <div className={styles.listLink}>{content}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </AdminCard>

            <AdminCard
              title="Последние жалобы"
              action={<Link to="/admin/complaints">Все</Link>}
              padded={false}
            >
              {(data.recentComplaints ?? []).length === 0 ? (
                <p className={styles.empty}>Жалоб пока нет</p>
              ) : (
                <ul className={styles.list}>
                  {data.recentComplaints!.map((complaint) => (
                    <ComplaintRow key={complaint.id} complaint={complaint} />
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard
              title="Товары на проверке"
              action={<Link to="/admin/moderation">Все</Link>}
              padded={false}
            >
              {(data.recentProducts ?? []).length === 0 ? (
                <p className={styles.empty}>Очередь пуста</p>
              ) : (
                <ul className={styles.list}>
                  {data.recentProducts!.map((product) => (
                    <li key={product.id} className={styles.listItem}>
                      <Link
                        to={`/admin/catalog/${product.id}`}
                        state={{ from: "/admin" }}
                        className={styles.listLink}
                      >
                        <div>
                          <strong>{product.name}</strong>
                          <span>{product.store?.name ?? "—"}</span>
                        </div>
                        <StatusBadge
                          {...statusMeta(PRODUCT_STATUSES, product.moderationStatus)}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </AdminCard>

            <AdminCard
              title="Новые продавцы"
              action={<Link to="/admin/sellers">Все</Link>}
              padded={false}
            >
              {(data.recentSellers ?? []).length === 0 ? (
                <p className={styles.empty}>Продавцов пока нет</p>
              ) : (
                <ul className={styles.list}>
                  {data.recentSellers!.map((seller) => (
                    <SellerRow key={seller.id} seller={seller} />
                  ))}
                </ul>
              )}
            </AdminCard>
          </div>
        </>
      )}
    </div>
  );
}

function ComplaintRow({ complaint }: { complaint: AdminComplaintDto }) {
  const status = statusMeta(
    [
      { id: "new", label: "Новая", tone: "warn" as const },
      { id: "under_review", label: "На проверке", tone: "info" as const },
      { id: "resolved", label: "Решена", tone: "good" as const },
      { id: "rejected", label: "Отклонена", tone: "neutral" as const },
    ],
    complaint.status,
  );
  return (
    <li className={styles.listItem}>
      <Link
        to={`/admin/complaints/${complaint.id}`}
        state={{ from: "/admin" }}
        className={styles.listLink}
      >
        <div>
          <strong>{COMPLAINT_REASONS[complaint.reason] ?? complaint.reason}</strong>
          <span>{personName(complaint.reporter)}</span>
        </div>
        <StatusBadge {...status} />
      </Link>
    </li>
  );
}

function SellerRow({ seller }: { seller: AdminSellerDto }) {
  return (
    <li className={styles.listItem}>
      <Link
        to={`/admin/sellers/${seller.id}`}
        state={{ from: "/admin" }}
        className={styles.listLink}
      >
        <div>
          <strong>{seller.name}</strong>
          <span>{personName(seller.owner)}</span>
        </div>
        <StatusBadge {...statusMeta(STORE_STATUSES, seller.moderationStatus)} />
      </Link>
    </li>
  );
}

export default observer(AdminOverviewPage);
