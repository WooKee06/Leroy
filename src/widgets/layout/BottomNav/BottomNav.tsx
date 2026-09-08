import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { FiHome, FiSearch, FiUser } from "react-icons/fi";
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
    key: "search",
    path: "/search",
    label: "Поиск",
    icon: () => <FiSearch strokeWidth={1} />,
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
      initial={{ filter: "blur(5px)", opacity: 0 }}
      animate={{ filter: "blur(0px)", opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
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
          <motion.button
            key={item.key}
            className={itemClass}
            onClick={() => navigate(item.path)}
            whileTap={{ scale: 0.9 }}
            aria-label={item.label}
          >
            {active && (
              <motion.span
                layoutId="bottomNavActivePill"
                className={styles.bottomNavPill}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}

            <span className={styles.bottomNavItemIcon}>
              {item.icon(active)}
            </span>

            {item.key === "profile" && cartCount > 0 && (
              <span className={styles.bottomNavBadge}>{cartCount}</span>
            )}
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

export default observer(BottomNav);
