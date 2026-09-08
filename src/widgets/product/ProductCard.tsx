import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { FiArrowRight } from "react-icons/fi";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import type { Product } from "@shared/api/mockData";
import { quickViewStore } from "@shared/stores/quickViewStore";
import { favoritesStore } from "@shared/stores/favoritesStore";
import styles from "./ProductCard.module.scss";
import "swiper/css";
import "swiper/css/pagination";

interface Props {
  product: Product;
  variant: "large" | "medium" | "small";
  showSeller?: boolean;
}

function ProductCard({ product, variant, showSeller = false }: Props) {
  const filledStars = Math.round(product.rating);
  const isFav = favoritesStore.isFavorite(product.id);

  const cardClass =
    variant === "large"
      ? `${styles.card} ${styles.cardLarge}`
      : variant === "small"
        ? `${styles.card} ${styles.cardSmall}`
        : `${styles.card} ${styles.cardMedium}`;

  const open = () => quickViewStore.open(product);

  return (
    <motion.div className={cardClass} onClick={open}>
      <div className={styles.imageWrap}>
        <div className={styles.imageBox}>
          {product.images.length > 1 ? (
            <Swiper
              grabCursor
              modules={[Pagination]}
              pagination={{ clickable: true }}
              className={styles.cardSwiper}
            >
              {product.images.map((src, i) => (
                <SwiperSlide key={i}>
                  <img
                    src={src}
                    alt={product.name}
                    className={styles.image}
                    loading="lazy"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <img
              src={product.images[0]}
              alt={product.name}
              className={styles.image}
              loading="lazy"
            />
          )}
        </div>

        {product.rating > 0 && (
          <span className={styles.rating}>
            <span className={styles.ratingStars}>
              {[1].map((i) => (
                <span
                  key={i}
                  className={
                    i <= filledStars ? styles.ratingStarOn : styles.ratingStarOff
                  }
                >
                  ★
                </span>
              ))}
            </span>
            <span className={styles.ratingValue}>{product.rating.toFixed(1)}</span>
          </span>
        )}

        <motion.button
          className={`${styles.like}${isFav ? ` ${styles.likeActive}` : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            favoritesStore.toggle(product.id);
          }}
          whileTap={{ scale: 0.85 }}
          aria-label={isFav ? "Убрать из избранного" : "В избранное"}
          aria-pressed={isFav}
        >
          {isFav ? <AiFillHeart size={17} /> : <AiOutlineHeart size={17} />}
        </motion.button>
      </div>

      <div className={styles.info}>
        <span className={styles.name}>{product.name}</span>

        <span className={styles.price}>
          {product.price.toLocaleString("ru-RU")} ₽
        </span>
        {showSeller && (
          <span className={styles.seller}>{product.seller.name}</span>
        )}

        <motion.button
          className={styles.detailsBtn}
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          whileTap={{ scale: 0.96 }}
          aria-label={`Подробнее: ${product.name}`}
        >
          <span>Подробнее</span>
          <FiArrowRight size={14} />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default observer(ProductCard);