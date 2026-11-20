import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import type { AdminAuditLogDto } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import {
  actionLabel,
  auditObjectLabel,
  formatDateTime,
  stateValue,
} from "@shared/lib/admin";
import {
  AdminCard,
  AdminTable,
  PageIntro,
  SelectInput,
  StateBlock,
  type Column,
} from "@shared/ui/admin/AdminUi";
import styles from "./AdminAuditPage.module.scss";

const PAGE_SIZE = 30;

const ENTITIES = [
  { id: "", label: "Все объекты" },
  { id: "product", label: "Товары" },
  { id: "store", label: "Магазины" },
  { id: "complaint", label: "Жалобы" },
  { id: "order", label: "Заказы" },
  { id: "user", label: "Пользователи" },
  { id: "category", label: "Категории" },
];

const ACTIONS = [
  { id: "", label: "Все действия" },
  { id: "product.approve", label: "Товар одобрен" },
  { id: "product.reject", label: "Товар отклонён" },
  { id: "product.block", label: "Товар заблокирован" },
  { id: "store.verify", label: "Магазин подтверждён" },
  { id: "store.block", label: "Магазин заблокирован" },
  { id: "complaint.resolved", label: "Жалоба решена" },
  { id: "user.status_changed", label: "Статус пользователя" },
  { id: "order.status_changed", label: "Статус заказа" },
];

function AdminAuditPage() {
  const [items, setItems] = useState<AdminAuditLogDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    leroyApi
      .adminAudit({
        page,
        limit: PAGE_SIZE,
        search: entity || undefined,
        status: action || undefined,
      })
      .then((result) => {
        if (!alive) return;
        setItems(result.items);
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
  }, [page, entity, action]);

  useEffect(() => load(), [load]);
  useEffect(() => setPage(1), [entity, action]);

  const columns: Column<AdminAuditLogDto>[] = [
    { key: "date", label: "Дата", render: (log) => formatDateTime(log.createdAt) },
    { key: "action", label: "Действие", render: (log) => actionLabel(log.action) },
    { key: "object", label: "Объект", render: (log) => auditObjectLabel(log) },
    { key: "actor", label: "Кто", render: (log) => log.actorId?.slice(0, 8) ?? "система" },
    {
      key: "before",
      label: "Было → Стало",
      render: (log) => (
        <span className={styles.states}>
          {stateValue(log.before)} → {stateValue(log.after)}
        </span>
      ),
    },
    { key: "reason", label: "Причина", render: (log) => log.reason || "—" },
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageIntro
        title="Журнал действий"
        description="Backend-журнал решений администратора: кто, что и когда изменил."
      />
      <div className={styles.filters}>
        <SelectInput value={entity} onChange={setEntity} options={ENTITIES} />
        <SelectInput value={action} onChange={setAction} options={ACTIONS} />
      </div>
      <AdminCard padded={false}>
        {error ? (
          <StateBlock kind="error" text={error} />
        ) : loading ? (
          <StateBlock kind="loading" text="Загружаем журнал…" />
        ) : items.length === 0 ? (
          <StateBlock kind="empty" text="Записей нет" />
        ) : (
          <AdminTable columns={columns} rows={items} />
        )}
      </AdminCard>
      <div className={styles.pagination}>
        <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
          Назад
        </button>
        <span>
          Страница {page} из {totalPages} · {total} записей
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((value) => value + 1)}
        >
          Вперёд
        </button>
      </div>
    </div>
  );
}

export default observer(AdminAuditPage);
