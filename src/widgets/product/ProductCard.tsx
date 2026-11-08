import { observer } from "mobx-react-lite";
import { FiArrowRight } from "react-icons/fi";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import type { Product } from "@shared/api/models";
import { quickViewStore } from "@shared/stores/quickViewStore";
import { favoritesStore } from "@shared/stores/favoritesStore";
import styles from "./ProductCard.module.scss";

interface Props {
  product: Product;
  variant: "large" | "medium" | "small";
  showSeller?: boolean;
}

/**
 * Карточка товара намеренно НЕ содержит Swiper: раньше каждая карточка
 * создавала отдельный экземпляр слайдера, и на экране с 20 товарами это
 * означало 20 Swiper'ов, 20 наборов event-слушателей и тяжёлый первый кадр.
 * Галерея с несколькими фото доступна в быстром просмотре и на странице
 * товара — там достаточно одного экземпляра.
 */
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
    <div className={cardClass} onClick={open}>
      <div className={styles.imageWrap}>
        <div className={styles.imageBox}>
          <img
            src={product.images[0]}
            alt={product.name}
            className={styles.image}
            loading="lazy"
            decoding="async"
          />
        </div>

        {product.rating > 0 && (
          <span className={styles.rating}>
            <span className={styles.ratingStars}>
              <span
                className={
                  filledStars > 0
                    ? styles.ratingStarOn
                    : styles.ratingStarOff
                }
              >
                ★
              </span>
            </span>
            <span className={styles.ratingValue}>
              {product.rating.toFixed(1)}
            </span>
          </span>
        )}

        <button
          className={`${styles.like}${isFav ? ` ${styles.likeActive}` : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            void favoritesStore.toggle(product.id, product);
          }}
          aria-label={isFav ? "Убрать из избранного" : "В избранное"}
          aria-pressed={isFav}
        >
          {isFav ? <AiFillHeart size={17} /> : <AiOutlineHeart size={17} />}
        </button>
      </div>

      <div className={styles.info}>
        <span className={styles.name}>{product.name}</span>

        <span className={styles.price}>
          {product.price.toLocaleString("ru-RU")} ₽
        </span>
        {showSeller && (
          <span className={styles.seller}>{product.seller.name}</span>
        )}

        <button
          className={styles.detailsBtn}
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          aria-label={`Подробнее: ${product.name}`}
        >
          <span>Подробнее</span>
          <FiArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

export default observer(ProductCard);
