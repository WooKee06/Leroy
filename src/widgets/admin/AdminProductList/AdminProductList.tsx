import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  AdminCategoryDto,
  AdminProductDto,
  AdminSellerDto,
} from "@shared/api/models";
import { imageUrlWithCacheBust } from "@shared/api/client";
import { leroyApi } from "@shared/api/leroyApi";
import {
  formatDate,
  formatMoney,
  PRODUCT_STATUSES,
  statusMeta,
} from "@shared/lib/admin";
import {
  AdminCard,
  AdminTable,
  SearchInput,
  SelectInput,
  StateBlock,
  StatusBadge,
  Toolbar,
  type Column,
} from "@shared/ui/admin/AdminUi";
import styles from "./AdminProductList.module.scss";

const PAGE_SIZE = 20;

export default function AdminProductList({
  mode,
}: {
  mode: "moderation" | "catalog";
}) {
  const [items, setItems] = useState<AdminProductDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [categories, setCategories] = useState<AdminCategoryDto[]>([]);
  const [sellers, setSellers] = useState<AdminSellerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      leroyApi.categories().catch(() => []),
      leroyApi.adminSellers({ limit: 100 }).catch(() => ({ items: [] })),
    ]).then(([cats, sellerList]) => {
      setCategories(cats);
      setSellers(sellerList.items);
    });
  }, []);

  // Reset to the first page whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [search, status, categoryId, storeId, dateFrom]);

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    const query = {
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      moderationStatus: (status || undefined) as AdminProductDto["moderationStatus"],
      categoryId: categoryId || undefined,
      storeId: storeId || undefined,
      dateFrom: dateFrom || undefined,
    };
    const request =
      mode === "moderation"
        ? leroyApi.adminModerationQueue(query)
        : leroyApi.adminProducts(query);

    request
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
  }, [mode, page, search, status, categoryId, storeId, dateFrom]);

  useEffect(() => load(), [load]);

  const detailBase = mode === "moderation" ? "/admin/moderation" : "/admin/catalog";
  const columns: Column<AdminProductDto>[] = [
    {
      key: "product",
      label: "Товар",
      render: (product) => (
        <Link to={`${detailBase}/${product.id}`} className={styles.productCell}>
          <span className={styles.thumb}>
            {product.images?.[0] && (
              <img
                src={imageUrlWithCacheBust(product.images[0], product.createdAt)}
                alt=""
                loading="lazy"
              />
            )}
          </span>
          <span className={styles.productName}>{product.name}</span>
        </Link>
      ),
    },
    {
      key: "category",
      label: "Категория",
      render: (product) => product.category?.name ?? "—",
    },
    {
      key: "price",
      label: "Цена",
      render: (product) => formatMoney(product.price),
    },
    {
      key: "seller",
      label: "Продавец",
      render: (product) => (
        <Link to={`/admin/sellers/${product.storeId}`}>{product.store?.name ?? "—"}</Link>
      ),
    },
    {
      key: "created",
      label: "Создан",
      render: (product) => formatDate(product.createdAt),
    },
    {
      key: "status",
      label: "Статус",
      render: (product) => (
        <StatusBadge {...statusMeta(PRODUCT_STATUSES, product.moderationStatus)} />
      ),
    },
    {
      key: "open",
      label: "",
      render: (product) => (
        <Link className={styles.openLink} to={`${detailBase}/${product.id}`}>
          Открыть
        </Link>
      ),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className={styles.stack}>
      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Название товара или продавец"
        />
        <SelectInput
          value={status}
          onChange={setStatus}
          options={[
            { id: "", label: mode === "moderation" ? "Все статусы" : "Все товары" },
            ...PRODUCT_STATUSES.map((item) => ({ id: item.id, label: item.label })),
          ]}
        />
        <SelectInput
          value={categoryId}
          onChange={setCategoryId}
          options={[
            { id: "", label: "Все категории" },
            ...categories.map((category) => ({
              id: category.id,
              label: category.name,
            })),
          ]}
        />
        <SelectInput
          value={storeId}
          onChange={setStoreId}
          options={[
            { id: "", label: "Все продавцы" },
            ...sellers.map((seller) => ({ id: seller.id, label: seller.name })),
          ]}
        />
        <input
          className={styles.dateInput}
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          aria-label="Дата создания с"
        />
      </Toolbar>

      <AdminCard padded={false}>
        {error ? (
          <StateBlock kind="error" text={error} />
        ) : loading ? (
          <StateBlock kind="loading" text="Загружаем товары…" />
        ) : items.length === 0 ? (
          <StateBlock kind="empty" text="Товары не найдены" />
        ) : (
          <AdminTable columns={columns} rows={items} />
        )}
      </AdminCard>

      <div className={styles.pagination}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((value) => value - 1)}
        >
          Назад
        </button>
        <span>
          Страница {page} из {totalPages} · {total} товаров
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((value) => value + 1)}
        >
          Вперёд
        </button>
      </div>
    </div>
  );
}
