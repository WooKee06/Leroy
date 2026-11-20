import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import type { AdminSellerDto } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import {
  formatDate,
  personName,
  STORE_STATUSES,
  statusMeta,
} from "@shared/lib/admin";
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
import styles from "./AdminSellersPage.module.scss";

const PAGE_SIZE = 20;

function AdminSellersPage() {
  const [items, setItems] = useState<AdminSellerDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setPage(1), [search, status]);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    leroyApi
      .adminSellers({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
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
  }, [page, search, status]);

  useEffect(() => load(), [load]);

  const columns: Column<AdminSellerDto>[] = [
    {
      key: "store",
      label: "Магазин",
      render: (seller) => (
        <Link to={`/admin/sellers/${seller.id}`} className={styles.storeCell}>
          {seller.logoUrl && <img src={seller.logoUrl} alt="" />}
          <span>{seller.name}</span>
        </Link>
      ),
    },
    { key: "owner", label: "Продавец", render: (seller) => personName(seller.owner) },
    {
      key: "type",
      label: "Тип",
      render: (seller) => (seller.owner?.role === "seller" ? "Продавец" : seller.owner?.role ?? "—"),
    },
    { key: "inn", label: "ИНН", render: () => "—" },
    { key: "date", label: "Дата регистрации", render: (seller) => formatDate(seller.createdAt) },
    {
      key: "status",
      label: "Проверка",
      render: (seller) => (
        <StatusBadge {...statusMeta(STORE_STATUSES, seller.moderationStatus)} />
      ),
    },
    { key: "products", label: "Товаров", render: (seller) => seller.productCount ?? 0 },
    {
      key: "open",
      label: "",
      render: (seller) => (
        <Link to={`/admin/sellers/${seller.id}`}>Открыть</Link>
      ),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageIntro
        title="Продавцы"
        description="Проверка магазинов, документы и управление статусом продавца."
      />
      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Название магазина"
        />
        <SelectInput
          value={status}
          onChange={setStatus}
          options={[
            { id: "", label: "Все статусы" },
            ...STORE_STATUSES.map((item) => ({ id: item.id, label: item.label })),
          ]}
        />
      </Toolbar>
      <AdminCard padded={false}>
        {error ? (
          <StateBlock kind="error" text={error} />
        ) : loading ? (
          <StateBlock kind="loading" text="Загружаем продавцов…" />
        ) : items.length === 0 ? (
          <StateBlock kind="empty" text="Продавцы не найдены" />
        ) : (
          <AdminTable columns={columns} rows={items} />
        )}
      </AdminCard>
      <div className={styles.pagination}>
        <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
          Назад
        </button>
        <span>
          Страница {page} из {totalPages} · {total} продавцов
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

export default observer(AdminSellersPage);
