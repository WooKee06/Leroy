import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheck } from "react-icons/fi";
import type { Product, Seller } from "@shared/api/models";
import { mapProduct, mapSeller } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import { favoritesStore } from "@shared/stores/favoritesStore";
import PageContainer from "@shared/ui/PageContainer";
import ProductCard from "@widgets/product/ProductCard";
import styles from "./StorePage.module.scss";

type Tab = "items" | "analytics" | "activity";

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

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      return;
    }
    let alive = true;
    setSeller(undefined);
    setSellerProducts([]);
    setNotFound(false);

    Promise.all([
      leroyApi.store(id).then(mapSeller),
      leroyApi.storeProducts(id).then((res) => res.items),
    ])
      .then(([store, products]) => {
        if (!alive) return;
        setSeller(store);
        setSellerProducts(products.map((p) => mapProduct(p, store)));
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
      <div className="page-wrapper" style={{ padding: 40, textAlign: "center" }}>
        <p>Магазин не найден</p>
        <button onClick={() => navigate(-1)}>Назад</button>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="page-wrapper" style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
        Загрузка…
      </div>
    );
  }

  const totalReviews = sellerProducts.reduce((sum, p) => sum + p.reviewCount, 0);

  const stats = [
    { value: formatCompact(seller.orderCount), label: "Заказов" },
    { value: seller.productCount, label: "Товаров" },
    { value: seller.rating.toFixed(1), label: "Рейтинг" },
    { value: totalReviews, label: "Отзывов" },
    { value: favoritesStore.count, label: "В избранном" },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.cover}>
        <img className={styles.coverImage} src={wide(seller.avatar)} alt="" />
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
              {seller.verified && (
                <span className={styles.verified}>
                  <FiCheck size={16} />
                </span>
              )}
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

        <div className={styles.tabs}>
          <button
            className={tab === "items" ? styles.tabActive : styles.tab}
            onClick={() => setTab("items")}
          >
            Товары
          </button>
          <button
            className={tab === "analytics" ? styles.tabActive : styles.tab}
            onClick={() => setTab("analytics")}
          >
            Аналитика
          </button>
          <button
            className={tab === "activity" ? styles.tabActive : styles.tab}
            onClick={() => setTab("activity")}
          >
            Активность
          </button>
        </div>

        <div className={styles.content}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
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
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </PageContainer>
    </div>
  );
}