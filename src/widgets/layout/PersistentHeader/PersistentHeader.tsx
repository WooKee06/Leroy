import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { observer } from "mobx-react-lite";
import { FiArrowLeft, FiSearch, FiShare, FiSliders } from "react-icons/fi";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BsCartDash } from "react-icons/bs";
import { accountStore } from "@shared/stores/accountStore";
import { favoritesStore } from "@shared/stores/favoritesStore";
import { pageActionsStore } from "@shared/stores/pageActionsStore";
import { getProductById } from "@shared/api/mockData";
import hStyles from "@widgets/home/HeroSection/HomeHeader.module.scss";
import styles from "./PersistentHeader.module.scss";

type LeftId = "profile" | "back";
type ActionId = "search" | "favorites" | "cart" | "favorite" | "share" | "filters";

interface HeaderShape {
  left: LeftId;
  right: ActionId[];
}

function resolveShape(pathname: string): HeaderShape {
  if (pathname === "/") return { left: "profile", right: ["search", "favorites", "cart"] };
  if (pathname.startsWith("/search")) return { left: "back", right: ["filters"] };
  if (pathname.startsWith("/product/")) return { left: "back", right: ["favorite", "share"] };
  if (pathname.startsWith("/store/")) return { left: "back", right: ["share"] };
  if (pathname === "/profile") return { left: "back", right: [] };
  return { left: "back", right: [] };
}

const contentAnim: Variants = {
  initial: { opacity: 0, y: 6, scale: 0.96, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: -6, scale: 0.96, filter: "blur(8px)" },
};

function PersistentHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const shape = resolveShape(location.pathname);
  const favCount = favoritesStore.count;

  const productId = location.pathname.startsWith("/product/")
    ? location.pathname.slice("/product/".length)
    : undefined;
  const product = productId ? getProductById(productId) : undefined;
  const productFav = product ? favoritesStore.isFavorite(product.id) : false;

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: document.title, url: window.location.href }).catch(() => {});
    }
  };

  const renderLeft = () => {
    if (shape.left === "profile") {
      return (
        <button
          className={hStyles.homeHeaderAccount}
          onClick={() => navigate("/profile")}
          aria-label="Профиль"
        >
          <img
            className={hStyles.homeHeaderAvatar}
            src={accountStore.avatar}
            alt={accountStore.displayName}
          />
          <span className={hStyles.homeHeaderAccountText}>
            <span className={hStyles.homeHeaderNickname}>{accountStore.displayName}</span>
            <span className={hStyles.homeHeaderRole}>{accountStore.roleLabel}</span>
          </span>
        </button>
      );
    }

    return (
      <button
        className={hStyles.homeHeaderIconBtn}
        onClick={() => navigate(-1)}
        aria-label="Назад"
      >
        <FiArrowLeft size={24} />
      </button>
    );
  };

  const renderRight = () => (
    <>
      {shape.right.includes("search") && (
        <button
          className={hStyles.homeHeaderIconBtn}
          onClick={() => navigate("/search")}
          aria-label="Поиск"
        >
          <FiSearch size={20} />
        </button>
      )}
      {shape.right.includes("favorites") && (
        <button
          className={hStyles.homeHeaderIconBtn}
          onClick={() => navigate("/favorites")}
          aria-label="Избранное"
        >
          <AiOutlineHeart size={18} />
          {favCount > 0 && <span className={hStyles.homeHeaderBadge}>{favCount}</span>}
        </button>
      )}
      {shape.right.includes("cart") && (
        <button
          className={hStyles.homeHeaderIconBtn}
          onClick={() => navigate("/cart")}
          aria-label="Корзина"
        >
          <BsCartDash size={16} />
        </button>
      )}
      {shape.right.includes("favorite") && product && (
        <button
          className={hStyles.homeHeaderIconBtn}
          onClick={() => favoritesStore.toggle(product.id)}
          aria-label={productFav ? "Убрать из избранного" : "В избранное"}
          aria-pressed={productFav}
        >
          {productFav ? (
            <AiFillHeart size={20} className={styles.favActive} />
          ) : (
            <AiOutlineHeart size={20} />
          )}
        </button>
      )}
      {shape.right.includes("share") && (
        <button className={hStyles.homeHeaderIconBtn} onClick={share} aria-label="Поделиться">
          <FiShare size={20} />
        </button>
      )}
      {shape.right.includes("filters") && (
        <button
          className={hStyles.homeHeaderIconBtn}
          onClick={() => pageActionsStore.run("filters")}
          aria-label="Фильтры"
        >
          <FiSliders size={20} />
        </button>
      )}
    </>
  );

  return (
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
      <div className={styles.row}>
        <div className={`${styles.slot} ${styles.leftSlot}`}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`left-${shape.left}`}
              className={styles.content}
              variants={contentAnim}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {renderLeft()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className={`${styles.slot} ${styles.rightSlot}`}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`right-${shape.right.join("+")}`}
              className={styles.content}
              variants={contentAnim}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {renderRight()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export default observer(PersistentHeader);