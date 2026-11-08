import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheck,
  FiChevronRight,
  FiStar,
  FiTrendingUp,
  FiShoppingBag,
  FiZap,
  FiSmartphone,
  FiDroplet,
  FiHome,
  FiWatch,
  FiLayers,
} from "react-icons/fi";
import { RiSearch2Line } from "react-icons/ri";
import { catalogStore } from "@shared/stores/catalogStore";
import PageContainer from "@shared/ui/PageContainer";
import {
  ChipRowSkeleton,
  StoreCardsSkeleton,
  StoreListSkeleton,
} from "@shared/ui/Skeletons";
import styles from "./StoresPage.module.scss";

const catIcons: Record<string, ReactNode> = {
  clothing: <FiShoppingBag size={15} />,
  shoes: <FiZap size={15} />,
  electronics: <FiSmartphone size={15} />,
  beauty: <FiDroplet size={15} />,
  home: <FiHome size={15} />,
  accessories: <FiWatch size={15} />,
};

const formatOrders = (n: number): string => {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".", ",")}k`;
  return String(n);
}

function StoresPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("all");

  useEffect(() => {
    void catalogStore.load();
  }, []);

  const sellers = catalogStore.stores;

  const popular = useMemo(
    () => [...sellers].sort((a, b) => b.orderCount - a.orderCount),
    [sellers],
  );

  const catMeta = useMemo(() => {
    const map = new Map<string, { label: string; icon?: ReactNode }>();
    catalogStore.categories.forEach((c) =>
      map.set(c.id, { label: c.name, icon: catIcons[c.id] }),
    );
    return map;
  }, []);

  const storeCats = useMemo(() => {
    const set = new Set<string>();
    sellers.forEach((s) => {
      const cat = catalogStore.storeCategory(s.id);
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [sellers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sellers.filter((s) => {
      if (activeCat !== "all" && catalogStore.storeCategory(s.id) !== activeCat)
        return false;
      if (
        q &&
        !s.name.toLowerCase().includes(q) &&
        !s.description.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [query, activeCat, sellers]);

  const loading = catalogStore.loading && !catalogStore.loaded;
  const noResults = filtered.length === 0;
  const cardsRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`page-wrapper ${styles.storesPage}`}>
      <PageContainer>
        <header className={styles.storesHeader}>
          <h1 className={styles.storesTitle}>Магазины</h1>
          <p className={styles.storesSubtitle}>
            Популярные магазины и витрины маркетплейса
          </p>
          <div className={styles.storesSearch}>
            <RiSearch2Line size={18} className={styles.storesSearchIcon} />
            <input
              className={styles.storesSearchInput}
              placeholder="Найти магазин..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </header>

        <section className={styles.storesSection}>
          <h2 className={styles.storesSectionTitle}>
            <FiTrendingUp size={18} />
            <span>Самые популярные</span>
          </h2>
          {loading ? (
            <StoreCardsSkeleton count={3} />
          ) : (
            <div className={styles.popularRow} ref={cardsRef}>
              {popular.map((s, i) => (
                <button
                  key={s.id}
                  className={styles.popularCard}
                  style={{ backgroundImage: `url(${s.avatar})` }}
                  onClick={() => navigate(`/store/${s.id}`)}
                >
                  <span className={styles.popularScrim} aria-hidden />
                  <span className={styles.popularRank}>
                    #{String(i + 1).padStart(2, "0")}
                  </span>

                  <span className={styles.popularName}>
                    {s.name}
                    {s.verified && (
                      <FiCheck className={styles.popularVerified} size={11} />
                    )}
                  </span>
                  <span className={styles.popularMeta}>
                    <FiStar size={12} fill="currentColor" /> {s.rating} ·{" "}
                    {formatOrders(s.orderCount)} продаж
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      </PageContainer>

      {/* <PromoSlider /> */}

      <PageContainer>
        <section className={styles.storesSection}>
          <h2 className={styles.storesSectionTitle}>
            <FiLayers size={18} />
            <span>Категории</span>
          </h2>
          {loading ? (
            <ChipRowSkeleton count={4} />
          ) : (
            <div className={styles.chipsRow}>
              <button
                className={activeCat === "all" ? styles.chipActive : styles.chip}
                onClick={() => setActiveCat("all")}
              >
                Все
              </button>
              {storeCats.map((id) => {
                const meta = catMeta.get(id);
                return (
                  <button
                    key={id}
                    className={activeCat === id ? styles.chipActive : styles.chip}
                    onClick={() => setActiveCat(id)}
                      >
                    {meta?.icon}
                    {meta?.label ?? id}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.storesSection}>
          <h2 className={styles.storesSectionTitle}>
            <FiShoppingBag size={18} />
            <span>Все магазины</span>
            {!loading && (
              <span className={styles.storesCount}>{filtered.length}</span>
            )}
          </h2>
          {loading ? (
            <StoreListSkeleton count={3} />
          ) : (
            <div className={styles.storesList}>
              {filtered.map((s) => {
                const cat = catalogStore.storeCategory(s.id);
                const catLabel = cat
                  ? (catMeta.get(cat)?.label ?? cat)
                  : "Магазин";
                return (
                  <button
                    key={s.id}
                    className={styles.storeRow}
                    onClick={() => navigate(`/store/${s.id}`)}
                  >
                    {s.avatar && (
                      <img
                        className={styles.storeRowBg}
                        src={s.avatar}
                        alt=""
                        aria-hidden
                      />
                    )}
                    <span className={styles.storeRowInfo}>
                      <span className={styles.storeRowName}>
                        {s.name}
                        {s.verified && (
                          <FiCheck
                            className={styles.storeRowVerified}
                            size={11}
                          />
                        )}
                      </span>
                      <span className={styles.storeRowMeta}>
                        {catLabel} · {s.productCount} товаров
                      </span>
                    </span>
                    <span className={styles.storeRowStats}>
                      <span className={styles.storeRowRating}>
                        <FiStar size={12} fill="currentColor" /> {s.rating}
                      </span>
                      <span className={styles.storeRowOrders}>
                        {formatOrders(s.orderCount)} продаж
                      </span>
                    </span>
                    <FiChevronRight size={18} className={styles.storeRowArrow} />
                  </button>
                );
              })}
              {noResults && (
                <p className={styles.storesEmpty}>Ничего не найдено</p>
              )}
            </div>
          )}
        </section>
      </PageContainer>
    </div>
  );
}

export default StoresPage;