import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { FiActivity, FiCheck, FiGrid, FiHeart } from "react-icons/fi";
import { getProductsBySeller, getSellerById } from "@shared/api/mockData";
import styles from "./PromoSlider.module.scss";
import "swiper/css";
import "swiper/css/pagination";

interface SlideData {
  id: string;
  badge: string;
  image: string;
  to: string;
}

const slides: SlideData[] = [
  {
    id: "nike",
    badge: "-15%",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop",
    to: "/store/nike-store",
  },
  {
    id: "beauty",
    badge: "-20%",
    image:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&h=600&fit=crop",
    to: "/store/beauty-bar",
  },
  {
    id: "urban",
    badge: "-40%",
    image:
      "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=600&fit=crop",
    to: "/store/urban-fit",
  },
];

const fmt = (n: number) => n.toLocaleString("ru-RU");

export default function PromoSlider() {
  const navigate = useNavigate();

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
        {slides.map((slide) => {
          const seller = getSellerById(slide.to.replace("/store/", ""));
          const sellerProducts = seller ? getProductsBySeller(seller.id) : [];
          const minPrice = sellerProducts.length
            ? Math.min(...sellerProducts.map((p) => p.price))
            : null;
          const name = seller?.name ?? "";
          const verified = seller?.verified ?? false;

          return (
            <SwiperSlide key={slide.id} className={styles.slide}>
              <div
                className={styles.card}
                onClick={() => navigate(slide.to)}
                role="button"
                tabIndex={0}
              >
                <div className={styles.imageWrap}>
                  <img
                    className={styles.image}
                    src={slide.image}
                    alt={name}
                    loading="lazy"
                  />
                  <span className={styles.overlayRow}>
                    <button
                      className={styles.overlayValue}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={slide.badge}
                    >
                      {slide.badge}
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
                    <span className={styles.name}>{name}</span>
                    {verified && (
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
