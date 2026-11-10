import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { observer } from "mobx-react-lite";
import { FiActivity, FiCheck, FiGrid } from "react-icons/fi";
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

function PromoSlider() {
  const navigate = useNavigate();

  useEffect(() => {
    void catalogStore.load();
  }, []);

  const slides = useMemo(
    () => catalogStore.stores.slice(0, 3),
    [catalogStore.stores],
  );

  return (
    <div className={styles.wrap}>
      <Swiper
        slidesPerView={1.04}
        spaceBetween={12}
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
                style={{
                  backgroundImage: `url(${store.avatar || slideImages[i % slideImages.length]})`,
                }}
                role="button"
                tabIndex={0}
              >
                <span className={styles.overlayRow}>
                  <button
                    className={styles.overlayValue}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={slideBadges[i % slideBadges.length]}
                  >
                    {slideBadges[i % slideBadges.length]}
                  </button>
                </span>

                <div className={styles.info}>
                  <div className={styles.nameRow}>
                    <span className={styles.name}>{store.name}</span>
                    {store.verified && (
                      <span className={styles.check}>
                        <FiCheck size={12} />
                      </span>
                    )}
                  </div>
                  <p className={styles.description}>{store.description}</p>
                </div>

                <div className={styles.buttons}>
                  <span className={styles.btnLight}>
                    <FiActivity size={16} />
                    Активность
                  </span>
                  <span className={styles.btnDark}>
                    <FiGrid size={16} />
                    Коллекция
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
