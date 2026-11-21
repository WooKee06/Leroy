import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useDebounce } from "@shared/lib/hooks/useDebounce";
import type { AdminUserDto } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import { formatDate, personName } from "@shared/lib/admin";
import {
  AdminCard,
  AdminTable,
  PageIntro,
  SearchInput,
  SelectInput,
  StateBlock,
  StatusBadge,
  Toolbar,
  type Column,
} from "@shared/ui/admin/AdminUi";
import styles from "./AdminUsersPage.module.scss";

const PAGE_SIZE = 20;

function AdminUsersPage() {
  const [items, setItems] = useState<AdminUserDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    leroyApi
      .adminUsers({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
        role: role || undefined,
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
  }, [page, debouncedSearch, role, status]);

  useEffect(() => load(), [load]);
  useEffect(() => setPage(1), [debouncedSearch, role, status]);

  const columns: Column<AdminUserDto>[] = [
    {
      key: "user",
      label: "Пользователь",
      render: (user) => (
        <Link to={`/admin/users/${user.id}`} className={styles.userCell}>
          {user.avatarUrl && <img src={user.avatarUrl} alt="" />}
          <span>{personName(user)}</span>
        </Link>
      ),
    },
    { key: "tg", label: "Telegram ID", render: (user) => user.telegramId },
    {
      key: "username",
      label: "Username",
      render: (user) => (user.username ? `@${user.username}` : "—"),
    },
    {
      key: "role",
      label: "Роль",
      render: (user) => (
        <StatusBadge
          label={user.role === "admin" ? "Админ" : user.role === "seller" ? "Продавец" : "Покупатель"}
          tone={user.role === "admin" ? "info" : "neutral"}
        />
      ),
    },
    { key: "orders", label: "Заказов", render: (user) => user.orderCount ?? 0 },
    { key: "date", label: "Регистрация", render: (user) => formatDate(user.createdAt) },
    {
      key: "status",
      label: "Статус",
      render: (user) => (
        <StatusBadge
          label={user.status === "blocked" ? "Заблокирован" : "Активен"}
          tone={user.status === "blocked" ? "bad" : "good"}
        />
      ),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageIntro
        title="Пользователи"
        description="Поиск пользователей, роли, статус аккаунта и количество заказов."
      />
      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Имя, username или Telegram ID"
        />
        <SelectInput
          value={role}
          onChange={setRole}
          options={[
            { id: "", label: "Все роли" },
            { id: "buyer", label: "Покупатель" },
            { id: "seller", label: "Продавец" },
            { id: "admin", label: "Админ" },
          ]}
        />
        <SelectInput
          value={status}
          onChange={setStatus}
          options={[
            { id: "", label: "Все статусы" },
            { id: "active", label: "Активен" },
            { id: "blocked", label: "Заблокирован" },
          ]}
        />
      </Toolbar>
      <AdminCard padded={false}>
        {error ? (
          <StateBlock kind="error" text={error} />
        ) : loading ? (
          <StateBlock kind="loading" text="Загружаем пользователей…" />
        ) : items.length === 0 ? (
          <StateBlock kind="empty" text="Пользователи не найдены" />
        ) : (
          <AdminTable columns={columns} rows={items} />
        )}
      </AdminCard>
      <div className={styles.pagination}>
        <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
          Назад
        </button>
        <span>
          Страница {page} из {totalPages} · {total} пользователей
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

export default observer(AdminUsersPage);
