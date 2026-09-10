import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { observer } from "mobx-react-lite";
import { FiActivity, FiCheck, FiGrid, FiHeart } from "react-icons/fi";
import { catalogStore } from "@shared/stores/catalogStore";
import styles from "./PromoSlider.module.scss";
import "swiper/css";
import "swiper/css/pagination";

const slideImages = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=600&fit=crop",
];

const slideBadges = ["-15%", "-20%", "-40%"];

const fmt = (n: number) => n.toLocaleString("ru-RU");

function PromoSlider() {
  const navigate = useNavigate();

  useEffect(() => {
    void catalogStore.load();
  }, []);

  const slides = useMemo(() => catalogStore.stores.slice(0, 3), [
    catalogStore.stores,
  ]);

  return (
    <div className={styles.wrap}>
      <Swiper
        slidesPerView={1.1}
        spaceBetween={12}
        centeredSlides
        loop
        grabCursor
        modules={[Autoplay, Pagination]}
        autoplay={{
          delay: 4500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{ clickable: true }}
        className={styles.deck}
      >
        {slides.map((store, i) => {
          const storeProducts = catalogStore.products.filter(
            (p) => p.seller?.id === store.id,
          );
          const minPrice = storeProducts.length
            ? Math.min(...storeProducts.map((p) => p.price))
            : null;

          return (
            <SwiperSlide key={store.id} className={styles.slide}>
              <div
                className={styles.card}
                onClick={() => navigate(`/store/${store.id}`)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.imageWrap}>
                  <img
                    className={styles.image}
                    src={store.avatar || slideImages[i % slideImages.length]}
                    alt={store.name}
                    loading="lazy"
                  />
                  <span className={styles.overlayRow}>
                    <button
                      className={styles.overlayValue}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={slideBadges[i % slideBadges.length]}
                    >
                      {slideBadges[i % slideBadges.length]}
                    </button>
                    <button
                      className={styles.overlayIcon}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="В избранное"
                    >
                      <FiHeart size={16} />
                    </button>
                  </span>
                </div>

                <div className={styles.info}>
                  <div className={styles.nameRow}>
                    <span className={styles.name}>{store.name}</span>
                    {store.verified && (
                      <span className={styles.check}>
                        <FiCheck size={12} />
                      </span>
                    )}
                  </div>
                  <span className={styles.floor}>
                    {minPrice != null
                      ? `Floor price ${fmt(minPrice)} ₽`
                      : "Floor price —"}
                  </span>
                </div>

                <div className={styles.buttons}>
                  <span className={styles.btnLight}>
                    <FiActivity size={16} />
                    Activity
                  </span>
                  <span className={styles.btnDark}>
                    <FiGrid size={16} />
                    Collection
                  </span>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}

export default observer(PromoSlider);