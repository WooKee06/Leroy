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
} from "react-icons/fi";
import { observer } from "mobx-react-lite";
import { getProductById } from "@shared/api/mockData";
import type { Product } from "@shared/api/mockData";
import { productBarStore } from "@shared/stores/productBarStore";
import PageContainer from "@shared/ui/PageContainer";
import styles from "./ProductPage.module.scss";
import "swiper/css";
import "swiper/css/pagination";

function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = id ? getProductById(id) : undefined;

  const [selectedSize, setSelectedSize] = useState<string | undefined>(
    product?.sizes?.[2] ?? undefined,
  );
  const [selectedColor] = useState<string | undefined>(
    product?.colors?.[0]?.name ?? undefined,
  );
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">(
    "description",
  );
  const swiperRef = useRef<SwiperClass | null>(null);

  useEffect(() => {
    if (product) {
      productBarStore.set(product, 1, selectedSize, selectedColor);
    }
  }, [product?.id, selectedSize, selectedColor]); // eslint-disable-line

  if (!product) {
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
                { id: "reviews", label: `Отзывы (${product.reviewCount})`, icon: FiStar },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  className={active ? styles.tabActive : styles.tab}
                  onClick={() => setActiveTab(tab.id)}
                  whileTap={{ scale: 0.94 }}
                >
                  {active && (
                    <motion.span
                      layoutId="productTabPill"
                      className={styles.tabPill}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className={styles.tabIcon}>
                    <tab.icon size={15} />
                  </span>
                  <span className={styles.tabLabel}>{tab.label}</span>
                </motion.button>
              );
            })}
          </div>

          <div className={styles.tabBody}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                {activeTab === "description" && (
                  <p className={styles.detailsText}>{product.description}</p>
                )}
                {activeTab === "specs" && <Specs product={product} />}
                {activeTab === "reviews" && <Reviews product={product} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </PageContainer>
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

const REVIEW_AUTHORS = ["Дмитрий", "Анна", "Сергей", "Мария", "Илья", "Ольга"];
const REVIEW_TEXTS = [
  "Отличное качество, соответствует описанию. Рекомендую!",
  "Доставка быстрая, упаковка надёжная. Всем доволен.",
  "Пользуюсь уже месяц, нареканий нет. Цена/качество на месте.",
  "Взял в подарок — получателю очень понравилось.",
  "Хороший магазин, товар как на фото. Буду заказывать ещё.",
  "Свои деньги отрабатывает полностью. Пять звёзд.",
];

function buildSpecs(product: Product): [string, string][] {
  const base = SPECS_BY_CATEGORY[product.category] ?? SPECS_BY_CATEGORY.default;
  return [
    ...base,
    ["Продавец", product.seller.name],
    ["Реализация", "В наличии"],
    ["Возврат", "14 дней"],
  ];
}

function buildReviews(product: Product): {
  author: string;
  rating: number;
  text: string;
  date: string;
}[] {
  const count = Math.min(3 + (product.reviewCount % 4), 6);
  return Array.from({ length: count }, (_, i) => ({
    author: REVIEW_AUTHORS[i % REVIEW_AUTHORS.length],
    rating: 4 + ((product.reviewCount + i) % 2),
    text: REVIEW_TEXTS[i % REVIEW_TEXTS.length],
    date: `2 недели назад`,
  }));
}

function Specs({ product }: { product: Product }) {
  const specs = buildSpecs(product);
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

function Reviews({ product }: { product: Product }) {
  const reviews = buildReviews(product);
  return (
    <div className={styles.reviewsList}>
      <div className={styles.reviewsSummary}>
        <span className={styles.reviewsScore}>{product.rating.toFixed(1)}</span>
        <span className={styles.reviewsMeta}>
          {product.rating.toFixed(1)} из 5 · {product.reviewCount} отзывов
        </span>
      </div>
      {reviews.map((r, i) => (
        <div key={i} className={styles.reviewCard}>
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
  );
}

export default observer(ProductPage);