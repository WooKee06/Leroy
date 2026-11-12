import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { FiArrowRight, FiMinus } from "react-icons/fi";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import type { Product } from "@shared/api/models";
import { quickViewStore } from "@shared/stores/quickViewStore";
import { favoritesStore } from "@shared/stores/favoritesStore";
import { cartStore } from "@shared/stores/cartStore";
import styles from "./ProductCard.module.scss";

interface Props {
  product: Product;
  variant: "large" | "medium" | "small";
  showSeller?: boolean;
}

const DEBOUNCE_MS = 300;

type PendingAction = "add" | "remove";

function ProductCard({ product, variant, showSeller = false }: Props) {
  const filledStars = Math.round(product.rating);
  const isFav = favoritesStore.isFavorite(product.id);
  const actualInCart = cartStore.items.some(
    (item) => item.product.id === product.id,
  );

  // Optimistic pending action for rapid toggles. UI updates immediately,
  // but the server request is debounced so fast clicks don't spam the API.
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null,
  );
  const [addPressed, setAddPressed] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPendingRef = useRef<PendingAction | null>(null);

  const displayedInCart =
    pendingAction === "add" ? true : pendingAction === "remove" ? false : actualInCart;

  const cardClass =
    variant === "large"
      ? `${styles.card} ${styles.cardLarge}`
      : variant === "small"
        ? `${styles.card} ${styles.cardSmall}`
        : `${styles.card} ${styles.cardMedium}`;

  const open = () => quickViewStore.open(product);

  const executeAction = useCallback(
    (action: PendingAction) => {
      if (action === "add") {
        const color = product.colors?.[0]?.name;
        void cartStore.addItem(product, undefined, color);
      } else {
        cartStore.items
          .filter((item) => item.product.id === product.id)
          .forEach((item) => {
            void cartStore.removeItem(
              product.id,
              item.selectedSize,
              item.selectedColor,
            );
          });
      }
    },
    [product],
  );

  useEffect(() => {
    return () => {
      // Flush any pending toggle if the card unmounts so the cart isn't left
      // in an inconsistent state.
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        if (lastPendingRef.current) {
          executeAction(lastPendingRef.current);
        }
      }
    };
  }, [executeAction]);

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    // Products with sizes can't be added directly from the card — open quick view.
    if (!displayedInCart && product.sizes && product.sizes.length > 0) {
      open();
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const nextAction: PendingAction = displayedInCart ? "remove" : "add";
    setPendingAction(nextAction);
    lastPendingRef.current = nextAction;

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setPendingAction(null);
      lastPendingRef.current = null;
      executeAction(nextAction);
    }, DEBOUNCE_MS);
  };

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
                  filledStars > 0 ? styles.ratingStarOn : styles.ratingStarOff
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

        <div className={styles.actions}>
          <button
            className={`${styles.addToCartBtn} ${displayedInCart ? styles.addToCartBtnInCart : ""} ${addPressed ? styles.addToCartBtnPressed : ""}`}
            onPointerDown={() => setAddPressed(true)}
            onPointerUp={() => setAddPressed(false)}
            onPointerLeave={() => setAddPressed(false)}
            onClick={handleAddToCart}
            aria-label={
              displayedInCart
                ? `Убрать из корзины: ${product.name}`
                : `В корзину: ${product.name}`
            }
          >
            {displayedInCart ? (
              <>
                <FiMinus size={16} /> <span>Убрать</span>
              </>
            ) : (
              <span>В корзину</span>
            )}
          </button>
          <button
            className={styles.detailsBtn}
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            aria-label={`Подробнее: ${product.name}`}
          >
            <FiArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default observer(ProductCard);
