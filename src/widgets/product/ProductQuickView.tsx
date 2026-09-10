import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { FiCheck, FiArrowRight } from "react-icons/fi";
import { observer } from "mobx-react-lite";
import type { Product } from "@shared/api/models";
import { quickViewStore } from "@shared/stores/quickViewStore";
import { cartStore } from "@shared/stores/cartStore";
import { favoritesStore } from "@shared/stores/favoritesStore";
import FavoriteButton from "@shared/ui/FavoriteButton";
import styles from "./ProductQuickView.module.scss";
import "swiper/css";
import "swiper/css/pagination";

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

  if (!product) return null;

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            aria-hidden="true"
          />
          <motion.div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label={`${product.name} — предпросмотр`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
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
          <Swiper
            grabCursor
            modules={[Pagination]}
            pagination={{ clickable: true }}
            slidesPerView={1}
            className={styles.qvSwiper}
          >
            {product.images.map((src, i) => (
              <SwiperSlide key={i}>
                <img
                  className={styles.image}
                  src={src}
                  alt={product.name}
                  loading="lazy"
                />
              </SwiperSlide>
            ))}
          </Swiper>
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
          <AnimatePresence initial={false}>
            {sizeChosen && (
              <motion.span
                key="price"
                className={styles.price}
                initial={{ opacity: 0, x: -8, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -8, filter: "blur(4px)" }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                {product.price.toLocaleString("ru-RU")} ₽
              </motion.span>
            )}
          </AnimatePresence>
          <motion.button
            className={styles.addBtn}
            layout
            onClick={handleAdd}
            whileTap={sizeChosen ? { scale: 0.94 } : undefined}
            animate={{
              backgroundColor: inCart ? "#34c759" : "--inverted",
              opacity: sizeChosen ? 1 : 0.5,
            }}
            transition={{ duration: 0.25 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {inCart ? (
                <motion.span
                  key="added"
                  className={styles.addLabel}
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.18, ease: "easeInOut" }}
                >
                  <FiCheck size={18} /> Добавлено
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  className={styles.addLabel}
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.18, ease: "easeInOut" }}
                >
                  В корзину
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
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
