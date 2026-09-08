import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiCheck, FiArrowRight } from "react-icons/fi";
import { sellers } from "@shared/api/mockData";
import styles from "./PopularStores.module.scss";

export default function PopularStores() {
  const navigate = useNavigate();

  const popular = useMemo(
    () => [...sellers].sort((a, b) => b.orderCount - a.orderCount).slice(0, 8),
    [],
  );

  return (
    <section className={styles.storeSection}>
      <div className={styles.sectionHeading}>
        <h2 className={styles.sectionTitle}>Популярные магазины</h2>
        <button
          className={styles.seeAll}
          onClick={() => navigate("/stores")}
          aria-label="Все магазины"
        >
          Все
          <FiArrowRight size={14} />
        </button>
      </div>

      <div className={styles.storesRow}>
        {popular.map((store) => (
          <motion.button
            key={store.id}
            className={styles.storeItem}
            onClick={() => navigate(`/store/${store.id}`)}
            whileTap={{ scale: 0.92 }}
          >
            <span className={styles.storeAvatarWrap}>
              <img
                className={styles.storeAvatar}
                src={store.avatar}
                alt={store.name}
                loading="lazy"
              />
              {store.verified && (
                <span className={styles.storeVerified} aria-label="Проверенный магазин">
                  <FiCheck size={10} />
                </span>
              )}
            </span>
            <span className={styles.storeName}>{store.name}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}