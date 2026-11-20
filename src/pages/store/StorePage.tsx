import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiActivity, FiBarChart2, FiGrid } from "react-icons/fi";
import type { Product, Seller } from "@shared/api/models";
import { mapProduct, mapSeller } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import { favoritesStore } from "@shared/stores/favoritesStore";
import PageContainer from "@shared/ui/PageContainer";
import { StorePageSkeleton } from "@shared/ui/Skeletons";
import Tabs from "@shared/ui/Tabs/Tabs";
import type { TabItem } from "@shared/ui/Tabs/Tabs";
import ProductCard from "@widgets/product/ProductCard";
import StoreStatusBadge from "@shared/ui/store/StoreStatusBadge";
import styles from "./StorePage.module.scss";
import { useInfiniteScroll } from "@/shared/lib/hooks/useInfiniteScroll";

type Tab = "items" | "analytics" | "activity";

const STORE_TABS: TabItem<Tab>[] = [
  { id: "items", label: "Товары", icon: <FiGrid size={16} /> },
  { id: "analytics", label: "Аналитика", icon: <FiBarChart2 size={16} /> },
  { id: "activity", label: "Активность", icon: <FiActivity size={16} /> },
];

const wide = (url: string) =>
  url.replace(/w=\d+&h=\d+&fit=crop/, "w=1200&h=700&fit=crop");

const avatarFit = (url: string) =>
  url.replace(/w=\d+&h=\d+&fit=crop/, "w=200&h=200&fit=crop");

const formatCompact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

export default function StorePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("items");
  const [seller, setSeller] = useState<Seller | undefined>(undefined);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [notFound, setNotFound] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = useCallback(async () => {
    if (!id) return;
    if (loadingMore) return;
    if (page >= totalPages) return;

    setLoadingMore(true);
    const requestedId = id;
    try {
      const next = page + 1;
      const res = await leroyApi.storeProducts(id, next, 20);

      if (id !== requestedId) return;

      setSellerProducts((prev) => [
        ...prev,
        ...res.items.map((p) => mapProduct(p, seller)),
      ]);
      setPage(next);
    } catch (error) {
    } finally {
      setLoadingMore(false);
    }
  }, [id, page, totalPages, loadingMore, seller]);

  const sentinelRef = useInfiniteScroll(loadMore, page < totalPages);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      return;
    }
    let alive = true;
    setSeller(undefined);
    setSellerProducts([]);
    setPage(1);
    setTotalPages(1);
    setLoadingMore(false);
    setNotFound(false);

    Promise.all([
      leroyApi.store(id).then(mapSeller),
      leroyApi.storeProducts(id, 1, 20),
    ])
      .then(([store, products]) => {
        if (!alive) return;
        setSeller(store);
        setSellerProducts(products.items.map((p) => mapProduct(p, store)));
        setTotalPages(products.totalPages);
      })
      .catch(() => {
        if (alive) setNotFound(true);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  if (notFound) {
    return (
      <div
        className="page-wrapper"
        style={{ padding: 40, textAlign: "center" }}
      >
        <p>Магазин не найден</p>
        <button onClick={() => navigate(-1)}>Назад</button>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className={styles.page}>
        <StorePageSkeleton />
      </div>
    );
  }

  const totalReviews = sellerProducts.reduce(
    (sum, p) => sum + p.reviewCount,
    0,
  );

  const stats = [
    { value: formatCompact(seller.orderCount), label: "Заказов" },
    { value: seller.productCount, label: "Товаров" },
    { value: seller.rating.toFixed(1), label: "Рейтинг" },
    { value: totalReviews, label: "Отзывов" },
    { value: favoritesStore.countForStore(seller.id), label: "В избранном" },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.cover}>
        <img
          className={styles.coverImage}
          src={wide(seller.cover ?? "")}
          alt=""
        />
      </div>

      <PageContainer>
        <div className={styles.header}>
          <img
            className={styles.avatar}
            src={avatarFit(seller.avatar)}
            alt={seller.name}
          />

          <div className={styles.identity}>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{seller.name}</h1>
              <StoreStatusBadge seller={seller} />
            </div>
            <p className={styles.desc}>{seller.description}</p>
          </div>
        </div>

        <div className={styles.stats}>
          {stats.map((s) => (
            <div className={styles.stat} key={s.label}>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <Tabs tabs={STORE_TABS} activeTab={tab} onChange={setTab} />

        <div className={styles.content}>
          <div key={tab} className={styles.tabContent}>
            {tab === "analytics" ? (
              <div className={styles.analytics}>
                <div className={styles.analyticsRow}>
                  <span className={styles.analyticsValue}>
                    {formatCompact(seller.orderCount)}
                  </span>
                  <span className={styles.analyticsLabel}>Заказов всего</span>
                </div>
                <div className={styles.analyticsRow}>
                  <span className={styles.analyticsValue}>
                    {seller.productCount}
                  </span>
                  <span className={styles.analyticsLabel}>
                    Товаров в каталоге
                  </span>
                </div>
                <div className={styles.analyticsRow}>
                  <span className={styles.analyticsValue}>
                    {seller.rating.toFixed(1)}
                  </span>
                  <span className={styles.analyticsLabel}>Средний рейтинг</span>
                </div>
              </div>
            ) : tab === "activity" ? (
              <div className={styles.activity}>
                <span className={styles.activityText}>
                  Активность появится после первых взаимодействий
                </span>
              </div>
            ) : (
              <div className={styles.grid}>
                {sellerProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="medium"
                  />
                ))}
                {loadingMore && <div className={styles.spinner}>Загрузка…</div>}
                <div ref={sentinelRef} />
              </div>
            )}
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
