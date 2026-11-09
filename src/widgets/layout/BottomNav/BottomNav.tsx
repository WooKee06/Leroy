import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { FiGrid, FiHome, FiUser } from "react-icons/fi";
import { observer } from "mobx-react-lite";
import { cartStore } from "@shared/stores/cartStore";
import styles from "./BottomNav.module.scss";
import { AiTwotoneShop } from "react-icons/ai";

interface NavItem {
  key: string;
  path: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const items: NavItem[] = [
  {
    key: "home",
    path: "/",
    label: "Главная",
    icon: () => <FiHome strokeWidth={1} />,
  },
  {
    key: "catalog",
    path: "/discover",
    label: "Каталог",
    icon: () => <FiGrid strokeWidth={1} />,
  },
  {
    key: "stores",
    path: "/stores",
    label: "Магазины",
    icon: () => <AiTwotoneShop strokeWidth={1} />,
  },
  {
    key: "profile",
    path: "/profile",
    label: "Профиль",
    icon: () => <FiUser strokeWidth={1} />,
  },
];

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const getActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const cartCount = cartStore.totalCount;

  return (
    <motion.nav
      className={styles.bottomNav}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {items.map((item) => {
        const active = getActive(item.path);
        const isCenter = item.key === "discover";

        const itemClass = [
          styles.bottomNavItem,
          isCenter ? styles.bottomNavItemCenter : "",
          active ? styles.bottomNavItemActive : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={item.key}
            className={itemClass}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
          >
            <span className={styles.bottomNavItemIcon}>
              {item.icon(active)}
            </span>

            {item.key === "cart" && cartCount > 0 && (
              <span className={styles.bottomNavBadge}>{cartCount}</span>
            )}
          </button>
        );
      })}
    </motion.nav>
  );
}

export default observer(BottomNav);
