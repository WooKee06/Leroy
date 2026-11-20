import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import type { AdminComplaintDto } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import {
  COMPLAINT_REASONS,
  COMPLAINT_STATUSES,
  formatDateTime,
  personName,
  statusMeta,
} from "@shared/lib/admin";
import {
  AdminCard,
  AdminTable,
  PageIntro,
  SelectInput,
  StateBlock,
  StatusBadge,
  Toolbar,
  type Column,
} from "@shared/ui/admin/AdminUi";
import styles from "./AdminComplaintsPage.module.scss";

const PAGE_SIZE = 20;

function AdminComplaintsPage() {
  const [items, setItems] = useState<AdminComplaintDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    leroyApi
      .adminComplaints({
        page,
        limit: PAGE_SIZE,
        status: status || undefined,
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
  }, [page, status]);

  useEffect(() => load(), [load]);
  useEffect(() => setPage(1), [status]);

  const columns: Column<AdminComplaintDto>[] = [
    {
      key: "target",
      label: "Объект",
      render: (complaint) => (
        <Link to={`/admin/complaints/${complaint.id}`}>
          {complaint.targetType}: {complaint.targetId.slice(0, 8)}
        </Link>
      ),
    },
    { key: "reporter", label: "Отправитель", render: (c) => personName(c.reporter) },
    {
      key: "reason",
      label: "Причина",
      render: (c) => COMPLAINT_REASONS[c.reason] ?? c.reason,
    },
    {
      key: "comment",
      label: "Комментарий",
      render: (c) => c.comment || "—",
    },
    { key: "date", label: "Дата", render: (c) => formatDateTime(c.createdAt) },
    {
      key: "status",
      label: "Статус",
      render: (c) => (
        <StatusBadge {...statusMeta(COMPLAINT_STATUSES, c.status)} />
      ),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageIntro
        title="Жалобы"
        description="Жалобы пользователей на товары и продавцов, решения и история обработок."
      />
      <Toolbar>
        <SelectInput
          value={status}
          onChange={setStatus}
          options={[
            { id: "", label: "Все статусы" },
            ...COMPLAINT_STATUSES.map((item) => ({ id: item.id, label: item.label })),
          ]}
        />
      </Toolbar>
      <AdminCard padded={false}>
        {error ? (
          <StateBlock kind="error" text={error} />
        ) : loading ? (
          <StateBlock kind="loading" text="Загружаем жалобы…" />
        ) : items.length === 0 ? (
          <StateBlock kind="empty" text="Жалоб не найдено" />
        ) : (
          <AdminTable columns={columns} rows={items} />
        )}
      </AdminCard>
      <div className={styles.pagination}>
        <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
          Назад
        </button>
        <span>
          Страница {page} из {totalPages} · {total} жалоб
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

export default observer(AdminComplaintsPage);
