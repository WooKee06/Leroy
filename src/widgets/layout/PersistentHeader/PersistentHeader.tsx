import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { FiArrowLeft, FiEdit, FiSearch, FiSettings, FiShare } from "react-icons/fi";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BsCartDash } from "react-icons/bs";
import { accountStore } from "@shared/stores/accountStore";
import { cartStore } from "@shared/stores/cartStore";
import { favoritesStore } from "@shared/stores/favoritesStore";
import hStyles from "@widgets/home/HeroSection/HomeHeader.module.scss";
import styles from "./PersistentHeader.module.scss";

type LeftId = "profile" | "back";
type ActionId = "search" | "favorites" | "cart" | "favorite" | "share" | "settings" | "edit";

interface HeaderShape {
  left: LeftId;
  right: ActionId[];
}

function resolveShape(pathname: string): HeaderShape {
  if (pathname === "/") return { left: "profile", right: ["settings", "search", "favorites", "cart"] };
  if (pathname === "/discover" || pathname === "/stores") return { left: "back", right: ["search", "cart"] };
  if (pathname.startsWith("/product/")) return { left: "back", right: ["favorite", "share", "cart"] };
  if (pathname.startsWith("/store/")) return { left: "back", right: ["share", "cart"] };
  if (pathname === "/my-store") return { left: "back", right: ["edit"] };
  if (pathname === "/profile") return { left: "back", right: ["settings", "cart"] };
  if (pathname === "/settings" || pathname === "/role") return { left: "back", right: ["cart"] };
  return { left: "back", right: ["cart"] };
}

const PAGE_TITLES: Record<string, string> = {
  "/discover": "Каталог",
  "/stores": "Магазины",
  "/cart": "Корзина",
  "/profile": "Профиль",
  "/settings": "Настройки",
  "/role": "Роль",
  "/addresses": "Адреса",
  "/favorites": "Избранное",
  "/balance": "Баланс",
  "/payment-methods": "Оплата",
  "/my-store": "Мой магазин",
  "/my-store/edit": "Редактирование",
  "/admin/orders": "Админка",
  "/orders": "Мои заказы",
  "/gifts": "Подарки",
};

function PersistentHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  const shape = resolveShape(location.pathname);
  const pageTitle = PAGE_TITLES[location.pathname];
  const favCount = favoritesStore.count;
  const cartCount = cartStore.totalCount;
  const [showTitle, setShowTitle] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowTitle(window.scrollY > 60);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const productId = location.pathname.startsWith("/product/")
    ? location.pathname.slice("/product/".length)
    : undefined;
  const productFav = productId ? favoritesStore.isFavorite(productId) : false;

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
          onClick={() => navigate("/discover")}
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
          {cartCount > 0 && <span className={hStyles.homeHeaderBadge}>{cartCount}</span>}
        </button>
      )}
      {shape.right.includes("favorite") && productId && (
        <button
          className={hStyles.homeHeaderIconBtn}
          onClick={() => favoritesStore.toggle(productId)}
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
      {shape.right.includes("settings") && (
        <button
          className={hStyles.homeHeaderIconBtn}
          onClick={() => navigate("/settings")}
          aria-label="Настройки"
        >
          <FiSettings size={20} />
        </button>
      )}
      {shape.right.includes("edit") && (
        <button
          className={hStyles.homeHeaderIconBtn}
          onClick={() => navigate("/my-store/edit")}
          aria-label="Редактировать магазин"
        >
          <FiEdit size={18} />
        </button>
      )}
    </>
  );

  return (
    <header className={styles.header}>
      <div className={styles.row}>
        <div className={`${styles.slot} ${styles.leftSlot}`}>
          <div key={`left-${shape.left}`} className={styles.content}>
            {renderLeft()}
          </div>
        </div>

        {pageTitle && (
          <div className={`${styles.titleSlot} ${showTitle ? styles.titleSlotVisible : ""}`}>
            <span className={styles.pageTitle}>{pageTitle}</span>
          </div>
        )}

        <div className={`${styles.slot} ${styles.rightSlot}`}>
          <div
            key={`right-${shape.right.join("+")}`}
            className={styles.content}
          >
            {renderRight()}
          </div>
        </div>
      </div>
    </header>
  );
}

export default observer(PersistentHeader);