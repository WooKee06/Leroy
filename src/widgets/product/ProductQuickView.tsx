import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheck, FiArrowRight } from "react-icons/fi";
import { observer } from "mobx-react-lite";
import type { Product } from "@shared/api/models";
import { quickViewStore } from "@shared/stores/quickViewStore";
import { cartStore } from "@shared/stores/cartStore";
import { favoritesStore } from "@shared/stores/favoritesStore";
import FavoriteButton from "@shared/ui/FavoriteButton";
import styles from "./ProductQuickView.module.scss";

/**
 * Лёгкая галерея на CSS scroll-snap вместо Swiper.
 *
 * Swiper на каждое открытие модалки инициализирует наблюдатели, слушатели и
 * пересчитывает размеры — на слабых устройствах это заметный «затык» ровно
 * в момент, когда шторка начинает выезжать. Нативная прокрутка с snap даёт
 * тот же UX, но без единого лишнего экземпляра слайдера.
 */
function QuickViewGallery({ product }: { product: Product }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.round(track.scrollLeft / track.clientWidth);
    setIndex((prev) => (prev === next ? prev : next));
  };

  const goTo = (next: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  };

  return (
    <div className={styles.galleryWrap}>
      <div
        ref={trackRef}
        className={styles.gallery}
        onScroll={handleScroll}
      >
        {product.images.map((src, i) => (
          <div className={styles.gallerySlide} key={i}>
            <img
              className={styles.image}
              src={src}
              alt={`${product.name} — фото ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
            />
          </div>
        ))}
      </div>

      {product.images.length > 1 && (
        <div className={styles.dots}>
          {product.images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === index ? styles.dotActive : styles.dot}
              onClick={() => goTo(i)}
              aria-label={`Фото ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductQuickView() {
  const product = quickViewStore.product;
  const location = useLocation();

  useEffect(() => {
    quickViewStore.close();
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = product ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [product]);

  const close = () => quickViewStore.close();

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={close}
            aria-hidden="true"
          />
          <motion.div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label={`${product.name} — предпросмотр`}
            initial={{ y: "100%", scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: "100%", scale: 0.98 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className={styles.handle} />
            <button
              className={styles.close}
              onClick={close}
              aria-label="Закрыть"
            >
              Закрыть
            </button>
            <QuickViewBody key={product.id} product={product} onClose={close} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const QuickViewBody = observer(function QuickViewBody({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    undefined,
  );

  const hasSizes = !!product.sizes && product.sizes.length > 0;
  const sizeChosen = !hasSizes || !!selectedSize;

  const selectedColor = product.colors?.[0]?.name ?? undefined;
  const isFav = favoritesStore.isFavorite(product.id);
  const inCart = cartStore.items.some(
    (i) =>
      i.product.id === product.id &&
      i.selectedSize === selectedSize &&
      i.selectedColor === selectedColor,
  );
  const filledStars = Math.round(product.rating);

  const handleAdd = () => {
    if (!sizeChosen) return;
    if (inCart) {
      cartStore.removeItem(product.id, selectedSize, selectedColor);
    } else {
      cartStore.addItem(product, selectedSize, selectedColor);
    }
  };

  const gotoPage = () => {
    onClose();
    navigate(`/product/${product.id}`);
  };

  return (
    <>
      <div className={styles.scroller}>
        <div className={styles.imageWrap}>
          <QuickViewGallery product={product} />
          <div className={styles.favorite}>
            <FavoriteButton
              isActive={isFav}
              onToggle={() => void favoritesStore.toggle(product.id, product)}
              size={20}
            />
          </div>
        </div>

        <div className={styles.info}>
          <h3 className={styles.name}>{product.name}</h3>
          <div className={styles.ratingRow}>
            <span className={styles.stars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={i <= filledStars ? styles.starOn : styles.starOff}
                >
                  ★
                </span>
              ))}
            </span>
            <span className={styles.ratingValue}>
              ({product.rating.toFixed(1)})
            </span>
            <span className={styles.ratingBased}>
              Based on {product.reviewCount} reviews
            </span>
          </div>

          {product.sizes && (
            <div className={styles.sizes}>
              {product.sizes.map((size) => (
                <button
                  key={size}
                  className={
                    selectedSize === size ? styles.sizeActive : styles.size
                  }
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerRow}>
          {sizeChosen && (
            <span className={styles.price}>
              {product.price.toLocaleString("ru-RU")} ₽
            </span>
          )}
          <button
            className={`${styles.addBtn} ${inCart ? styles.addBtnInCart : ""}`}
            onClick={handleAdd}
            disabled={!sizeChosen}
          >
            <span key={inCart ? "added" : "add"} className={styles.addLabel}>
              {inCart ? (
                <>
                  <FiCheck size={18} /> Добавлено
                </>
              ) : (
                "В корзину"
              )}
            </span>
          </button>
          <button
            className={styles.arrowBtn}
            onClick={gotoPage}
            aria-label="Открыть товар"
          >
            <FiArrowRight size={20} />
          </button>
        </div>
      </div>
    </>
  );
});

export default observer(ProductQuickView);
