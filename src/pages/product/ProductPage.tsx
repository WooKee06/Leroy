import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperClass } from "swiper";
import { Pagination } from "swiper/modules";
import {
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
  FiStar,
  FiTag,
  FiX,
} from "react-icons/fi";
import { observer } from "mobx-react-lite";
import type { Product, Review } from "@shared/api/models";
import { mapProduct, mapReview } from "@shared/api/models";
import { ApiError } from "@shared/api/client";
import { leroyApi } from "@shared/api/leroyApi";
import { trackProductView } from "@shared/lib/analytics";
import { productBarStore } from "@shared/stores/productBarStore";
import PageContainer from "@shared/ui/PageContainer";
import { ProductPageSkeleton } from "@shared/ui/Skeletons";
import styles from "./ProductPage.module.scss";
import "swiper/css";
import "swiper/css/pagination";

interface ProductCacheEntry {
  product?: Product;
  reviews?: Review[];
}

/**
 * Кэш последних открытых товаров. Без него каждый возврат на страницу товара
 * показывал скелетон и заново ждал ответ сервера (~1 c на Render). Теперь
 * карточка рисуется мгновенно из памяти и тихо обновляется в фоне.
 */
const productCache = new Map<string, ProductCacheEntry>();
const PRODUCT_CACHE_LIMIT = 20;

function writeProductCache(id: string, patch: ProductCacheEntry) {
  const next = { ...productCache.get(id), ...patch };
  // Переставляем запись в конец, чтобы вытеснялись самые старые.
  productCache.delete(id);
  productCache.set(id, next);

  if (productCache.size > PRODUCT_CACHE_LIMIT) {
    const oldest = productCache.keys().next().value;
    if (oldest) productCache.delete(oldest);
  }
}

function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const initialCache = id ? productCache.get(id) : undefined;
  const [product, setProduct] = useState<Product | undefined>(
    initialCache?.product,
  );
  const [reviews, setReviews] = useState<Review[]>(
    initialCache?.reviews ?? [],
  );
  const [notFound, setNotFound] = useState(false);

  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [colorName, setColorName] = useState<string | undefined>(undefined);
  const selectedColor = colorName ?? product?.colors?.[0]?.name;
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewsTick, setReviewsTick] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">(
    "description",
  );
  const swiperRef = useRef<SwiperClass | null>(null);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      return;
    }
    let alive = true;
    const cached = productCache.get(id);

    if (cached?.product) {
      setProduct(cached.product);
    } else {
      setProduct(undefined);
    }
    setReviews(cached?.reviews ?? []);
    setNotFound(false);

    leroyApi
      .product(id)
      .then((dto) => {
        if (!alive) return;
        const mapped = mapProduct(dto);
        writeProductCache(id, { product: mapped });
        setProduct(mapped);
        trackProductView(mapped.id);
      })
      .catch(() => {
        // Если данные уже были в кэше, оставляем их на экране.
        if (alive && !cached?.product) setNotFound(true);
      });

    leroyApi
      .reviews(id)
      .then((res) => {
        if (!alive) return;
        const mapped = res.items.map(mapReview);
        writeProductCache(id, { reviews: mapped });
        setReviews(mapped);
      })
      .catch(() => {
        if (alive && !cached?.reviews) setReviews([]);
      });

    return () => {
      alive = false;
    };
  }, [id, reviewsTick]);

  useEffect(() => {
    if (product) {
      const size = selectedSize ?? product.sizes?.[0];
      productBarStore.set(product, 1, size, selectedColor);
    }
  }, [product?.id, selectedSize, selectedColor]); // eslint-disable-line

  if (notFound) {
    return (
      <div
        className="page-wrapper"
        style={{ padding: 40, textAlign: "center" }}
      >
        <p>Товар не найден</p>
        <button onClick={() => navigate(-1)}>Назад</button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-wrapper">
        <PageContainer>
          <ProductPageSkeleton />
        </PageContainer>
      </div>
    );
  }

  const prevImage = () => swiperRef.current?.slidePrev();
  const nextImage = () => swiperRef.current?.slideNext();

  const filledStars = Math.round(product.rating);

  return (
    <div className="page-wrapper">
      <PageContainer>
        <div className={styles.gallery}>
          <Swiper
            grabCursor
            slidesPerView={1}
            modules={[Pagination]}
            pagination={{ clickable: true }}
            className={styles.gallerySwiper}
            onSwiper={(sw) => {
              swiperRef.current = sw;
            }}
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

          {product.images.length > 1 && (
            <>
              <button
                className={`${styles.arrow} ${styles.arrowLeft}`}
                onClick={prevImage}
                aria-label="Предыдущее фото"
              >
                <FiChevronLeft size={18} />
              </button>
              <button
                className={`${styles.arrow} ${styles.arrowRight}`}
                onClick={nextImage}
                aria-label="Следующее фото"
              >
                <FiChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        <div className={styles.content}>
          <h2 className={styles.title}>{product.name}</h2>

          <div className={styles.ratingRow}>
            <span className={styles.stars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={i <= filledStars ? styles.filledStar : styles.emptyStar}
                >
                  ★
                </span>
              ))}
            </span>
            <span className={styles.ratingValue}>({product.rating.toFixed(1)})</span>
            <span className={styles.ratingBased}>
              Based on {product.reviewCount} reviews
            </span>
          </div>

          <button
            className={styles.seller}
            onClick={() => navigate(`/store/${product.seller.id}`)}
          >
            <img
              className={styles.sellerAvatar}
              src={product.seller.avatar}
              alt={product.seller.name}
            />
            <span className={styles.sellerInfo}>
              <span className={styles.sellerLabel}>Продавец</span>
              <span className={styles.sellerName}>{product.seller.name}</span>
            </span>
            <FiChevronRight size={18} className={styles.sellerChevron} />
          </button>

          {product.colors && (
            <div className={styles.colors}>
              <div className={styles.colorsMeta}>
                <span className={styles.colorsLabel}>Цвет</span>
                <span className={styles.colorsValue}>{selectedColor}</span>
              </div>
              <div className={styles.colorsList}>
                {product.colors.map((color) => {
                  const active = selectedColor === color.name;
                  return (
                    <button
                      key={color.name}
                      aria-label={color.name}
                      aria-pressed={active}
                      className={active ? styles.colorActive : styles.colorBtn}
                      style={{ background: color.hex }}
                      onClick={() => setColorName(color.name)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {product.sizes && (
            <div className={styles.sizes}>
              {product.sizes.map((size) => (
                <button
                  key={size}
                  className={selectedSize === size ? styles.sizeActive : styles.sizeBtn}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          )}

          <div className={styles.tabs}>
            {(
              [
                { id: "description", label: "Описание", icon: FiInfo },
                { id: "specs", label: "Характеристики", icon: FiTag },
                { id: "reviews", label: `Отзывы (${reviews.length})`, icon: FiStar },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={active ? styles.tabActive : styles.tab}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className={styles.tabIcon}>
                    <tab.icon size={15} />
                  </span>
                  <span className={styles.tabLabel}>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.tabBody}>
            <div key={activeTab} className={styles.tabBodyInner}>
              {activeTab === "description" && (
                <p className={styles.detailsText}>{product.description}</p>
              )}
              {activeTab === "specs" && (
                <Specs
                  product={product}
                  color={selectedColor}
                  size={selectedSize}
                />
              )}
              {activeTab === "reviews" && (
                <Reviews reviews={reviews} onWrite={() => setReviewOpen(true)} />
              )}
            </div>
          </div>
        </div>
      </PageContainer>

      <ReviewFormSheet
        open={reviewOpen}
        product={product}
        onClose={() => setReviewOpen(false)}
        onDone={() => {
          setReviewOpen(false);
          setReviewsTick((t) => t + 1);
        }}
      />
    </div>
  );
}

const SPECS_BY_CATEGORY: Record<string, [string, string][]> = {
  clothing: [
    ["Состав", "Хлопок 95%, эластан 5%"],
    ["Страна", "Россия"],
    ["Уход", "Машинная стирка при 30°"],
    ["Фасон", "Прямой"],
  ],
  shoes: [
    ["Материал верха", "Натуральная кожа"],
    ["Подошва", "Каучук"],
    ["Размерная сетка", "36–45"],
    ["Сезон", "Всесезонный"],
  ],
  electronics: [
    ["Гарантия", "12 месяцев"],
    ["Страна", "Китай"],
    ["Питание", "Аккумулятор"],
    ["Разъём", "USB-C"],
  ],
  beauty: [
    ["Объём", "50 мл"],
    ["Срок годности", "36 месяцев"],
    ["Страна", "Франция"],
  ],
  home: [
    ["Материал", "Натуральное дерево"],
    ["Страна", "Россия"],
  ],
  accessories: [
    ["Материал", "Нержавеющая сталь"],
    ["Страна", "Италия"],
  ],
  default: [
    ["Страна", "Россия"],
    ["Гарантия", "6 месяцев"],
  ],
};

function buildSpecs(
  product: Product,
  color?: string,
  size?: string,
): [string, string][] {
  const base = SPECS_BY_CATEGORY[product.category] ?? SPECS_BY_CATEGORY.default;
  const options: [string, string][] = [];
  if (color) options.push(["Цвет", color]);
  if (size) options.push(["Размер", size]);
  return [
    ...options,
    ...base,
    ["Продавец", product.seller.name],
    ["Реализация", "В наличии"],
    ["Возврат", "14 дней"],
  ];
}

function Specs({
  product,
  color,
  size,
}: {
  product: Product;
  color?: string;
  size?: string;
}) {
  const specs = buildSpecs(product, color, size);
  return (
    <div className={styles.specsList}>
      {specs.map(([label, value]) => (
        <div key={label} className={styles.specRow}>
          <span className={styles.specLabel}>{label}</span>
          <span className={styles.specValue}>{value}</span>
        </div>
      ))}
    </div>
  );
}

function Reviews({
  reviews,
  onWrite,
}: {
  reviews: Review[];
  onWrite: () => void;
}) {
  const average =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className={styles.reviewsBlock}>
      {reviews.length > 0 && (
        <div className={styles.reviewsSummary}>
          <span className={styles.reviewsScore}>{average.toFixed(1)}</span>
          <span className={styles.reviewsMeta}>
            {average.toFixed(1)} из 5 · {reviews.length} отзывов
          </span>
        </div>
      )}

      <button className={styles.writeReview} onClick={onWrite}>
        {reviews.length === 0 ? "Написать первый отзыв" : "Написать отзыв"}
      </button>

      {reviews.length === 0 ? (
        <p className={styles.detailsText}>Отзывов пока нет</p>
      ) : (
        <div className={styles.reviewsList}>
          {reviews.map((r) => (
            <div key={r.id} className={styles.reviewCard}>
              <div className={styles.reviewHead}>
                <span className={styles.reviewAuthor}>{r.author}</span>
                <span className={styles.reviewDate}>{r.date}</span>
              </div>
              <div className={styles.reviewStars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={s <= r.rating ? styles.filledStar : styles.emptyStar}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className={styles.reviewText}>{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewFormSheet({
  open,
  product,
  onClose,
  onDone,
}: {
  open: boolean;
  product: Product;
  onClose: () => void;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setRating(5);
      setText("");
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    if (!text.trim()) {
      setError("Напишите пару слов о товаре");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await leroyApi.createReview({
        productId: product.id,
        rating,
        text: text.trim(),
      });
      onDone();
    } catch (err) {
      setError(
        err instanceof ApiError && err.message
          ? err.message
          : "Не удалось отправить отзыв. Попробуйте ещё раз",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Написать отзыв"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className={styles.handle} />
            <button className={styles.sheetClose} onClick={onClose} aria-label="Закрыть">
              <FiX size={18} />
            </button>

            <h2 className={styles.sheetTitle}>Оценка товара</h2>
            <p className={styles.sheetProduct}>{product.name}</p>

            <div className={styles.ratingPicker}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  aria-label={`Оценка ${s}`}
                  className={s <= rating ? styles.ratingStarActive : styles.ratingStar}
                  onClick={() => setRating(s)}
                >
                  <FiStar size={26} />
                </button>
              ))}
            </div>

            <textarea
              className={styles.sheetTextarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Поделитесь впечатлениями о товаре"
              rows={4}
            />

            {error && <p className={styles.sheetError}>{error}</p>}

            <button
              className={styles.sheetSubmit}
              onClick={() => void submit()}
              disabled={saving}
            >
              {saving ? "Отправляем…" : "Опубликовать отзыв"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default observer(ProductPage);