import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { FiHeart } from "react-icons/fi";
import { favoritesStore } from "@shared/stores/favoritesStore";
import PageContainer from "@shared/ui/PageContainer";
import ProductCard from "@widgets/product/ProductCard";
import styles from "./FavoritesPage.module.scss";

type Filter = "all" | "discount" | "new";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "discount", label: "Скидки" },
  { value: "new", label: "Новинки" },
];

function FavoritesPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    void favoritesStore.ensureLoaded();
  }, []);

  const all = favoritesStore.products;

  const items = useMemo(() => {
    if (filter === "discount")
      return all.filter(
        (p) => p.originalPrice != null && p.originalPrice > p.price,
      );
    if (filter === "new") return all.filter((p) => p.isNew);
    return all;
  }, [all, filter]);

  const isEmpty = all.length === 0;

  return (
    <div className={`page-wrapper ${styles.page}`}>
      <PageContainer>
        <div className={styles.head}>
          <h1 className={styles.title}>Избранное</h1>
          <span className={styles.subtitle}>
            {items.length} {items.length === 1 ? "товар" : "товаров"}
          </span>
        </div>

        {isEmpty ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <FiHeart size={30} />
            </div>
            <h2 className={styles.emptyTitle}>Пока ничего нет</h2>
            <p className={styles.emptyText}>
              Добавляйте товары в избранное, чтобы быстро найти их позже
            </p>
            <button
              className={styles.emptyBtn}
              onClick={() => navigate("/")}
            >
              Перейти к покупкам
            </button>
          </div>
        ) : (
          <>
            <div className={styles.filters}>
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={
                    filter === f.value ? styles.filterActive : styles.filter
                  }
                  onClick={() => setFilter(f.value)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <motion.div className={styles.grid} layout>
              <AnimatePresence mode="popLayout">
                {items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{
                      opacity: { duration: 0.25 },
                      y: { duration: 0.3 },
                      delay: i * 0.04,
                    }}
                    className={styles.cell}
                  >
                    <ProductCard product={item} variant="medium" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </PageContainer>
    </div>
  );
}

export default observer(FavoritesPage);