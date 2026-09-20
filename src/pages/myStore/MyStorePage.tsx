import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheck, FiPlus, FiShoppingBag } from "react-icons/fi";
import type { Product, Seller } from "@shared/api/models";
import { mapProduct, mapSeller } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import { accountStore } from "@shared/stores/accountStore";
import PageContainer from "@shared/ui/PageContainer";
import ProductCard from "@widgets/product/ProductCard";
import {
  ProductFormSheet,
  StoreCreateSheet,
} from "@widgets/store/CreateSheets";
import storeStyles from "@pages/store/StorePage.module.scss";
import styles from "./MyStorePage.module.scss";

type Tab = "items" | "analytics" | "activity";

const wide = (url: string) =>
  url.replace(/w=\d+&h=\d+&fit=crop/, "w=1200&h=700&fit=crop");

const avatarFit = (url: string) =>
  url.replace(/w=\d+&h=\d+&fit=crop/, "w=200&h=200&fit=crop");

const formatCompact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

export default function MyStorePage() {
  const [tab, setTab] = useState<Tab>("items");
  const [seller, setSeller] = useState<Seller | undefined>(undefined);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [storeOpen, setStoreOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setSeller(undefined);
    setSellerProducts([]);
    leroyApi
      .myStore(accountStore.userId)
      .then((store) => {
        if (!alive || !store) return;
        const mapped = mapSeller(store);
        setSeller(mapped);
        return leroyApi
          .storeProducts(store.id)
          .then((res) => res.items)
          .then((items) => {
            if (!alive) return;
            setSellerProducts(items.map((p) => mapProduct(p, mapped)));
          });
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [tick]);

  const reload = () => setTick((t) => t + 1);

  if (loading) {
    return (
      <div className={`page-wrapper ${styles.page}`}>
        <PageContainer>
          <p style={{ color: "var(--text-secondary)", textAlign: "center", paddingTop: 24 }}>
            Загрузка…
          </p>
        </PageContainer>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className={`page-wrapper ${styles.page}`}>
        <PageContainer>
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <FiShoppingBag size={28} />
            </div>
            <div>
              <h1>Магазин ещё не создан</h1>
              <p>Создайте магазин и добавьте первые товары</p>
            </div>
            <button className={styles.emptyBtn} onClick={() => setStoreOpen(true)}>
              <FiPlus size={18} /> Создать магазин
            </button>
          </div>
        </PageContainer>

        <StoreCreateSheet
          open={storeOpen}
          onClose={() => setStoreOpen(false)}
          onDone={() => {
            setStoreOpen(false);
            reload();
          }}
        />
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
  ];

  return (
    <div className={storeStyles.page}>
      <div className={storeStyles.cover}>
        <img
          className={storeStyles.coverImage}
          src={wide(seller.cover ?? "")}
          alt=""
        />
      </div>

      <PageContainer>
        <div className={storeStyles.header}>
          <img
            className={storeStyles.avatar}
            src={avatarFit(seller.avatar)}
            alt={seller.name}
          />

          <div className={storeStyles.identity}>
            <div className={storeStyles.nameRow}>
              <h1 className={storeStyles.name}>{seller.name}</h1>
              {seller.verified && (
                <span className={storeStyles.verified}>
                  <FiCheck size={16} />
                </span>
              )}
            </div>
            <p className={storeStyles.desc}>{seller.description}</p>
          </div>
        </div>

        <div className={storeStyles.stats}>
          {stats.map((s) => (
            <div className={storeStyles.stat} key={s.label}>
              <div className={storeStyles.statValue}>{s.value}</div>
              <div className={storeStyles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className={storeStyles.tabs}>
          <button
            className={tab === "items" ? storeStyles.tabActive : storeStyles.tab}
            onClick={() => setTab("items")}
          >
            Товары
          </button>
          <button
            className={
              tab === "analytics" ? storeStyles.tabActive : storeStyles.tab
            }
            onClick={() => setTab("analytics")}
          >
            Аналитика
          </button>
          <button
            className={
              tab === "activity" ? storeStyles.tabActive : storeStyles.tab
            }
            onClick={() => setTab("activity")}
          >
            Активность
          </button>
        </div>

        <div className={storeStyles.content}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              {tab === "analytics" ? (
                <div className={storeStyles.analytics}>
                  <div className={storeStyles.analyticsRow}>
                    <span className={storeStyles.analyticsValue}>
                      {formatCompact(seller.orderCount)}
                    </span>
                    <span className={storeStyles.analyticsLabel}>
                      Заказов всего
                    </span>
                  </div>
                  <div className={storeStyles.analyticsRow}>
                    <span className={storeStyles.analyticsValue}>
                      {seller.productCount}
                    </span>
                    <span className={storeStyles.analyticsLabel}>
                      Товаров в каталоге
                    </span>
                  </div>
                  <div className={storeStyles.analyticsRow}>
                    <span className={storeStyles.analyticsValue}>
                      {seller.rating.toFixed(1)}
                    </span>
                    <span className={storeStyles.analyticsLabel}>
                      Средний рейтинг
                    </span>
                  </div>
                </div>
              ) : tab === "activity" ? (
                <div className={storeStyles.activity}>
                  <span className={storeStyles.activityText}>
                    Активность появится после первых взаимодействий
                  </span>
                </div>
              ) : (
                <>
                  <button
                    className={styles.addBtn}
                    onClick={() => setProductOpen(true)}
                  >
                    <FiPlus size={18} /> Добавить товар
                  </button>
                  <div className={storeStyles.grid}>
                    {sellerProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        variant="medium"
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </PageContainer>

      <ProductFormSheet
        open={productOpen}
        onClose={() => setProductOpen(false)}
        onDone={() => {
          setProductOpen(false);
          reload();
        }}
      />
    </div>
  );
}