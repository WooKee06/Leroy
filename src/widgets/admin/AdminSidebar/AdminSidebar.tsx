import { NavLink } from "react-router-dom";
import {
  FiGrid,
  FiFlag,
  FiClock,
  FiLayers,
  FiPackage,
  FiSettings,
  FiShoppingBag,
  FiShoppingCart,
  FiTag,
  FiUsers,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import styles from "./AdminSidebar.module.scss";

const NAV: { to: string; label: string; icon: IconType }[] = [
  { to: "/admin", label: "Overview", icon: FiGrid },
  { to: "/admin/moderation", label: "Модерация товаров", icon: FiPackage },
  { to: "/admin/sellers", label: "Продавцы", icon: FiShoppingBag },
  { to: "/admin/complaints", label: "Жалобы", icon: FiFlag },
  { to: "/admin/catalog", label: "Каталог товаров", icon: FiLayers },
  { to: "/admin/orders", label: "Заказы", icon: FiShoppingCart },
  { to: "/admin/users", label: "Пользователи", icon: FiUsers },
  { to: "/admin/categories", label: "Категории", icon: FiTag },
  { to: "/admin/audit", label: "Журнал действий", icon: FiClock },
  { to: "/admin/settings", label: "Настройки", icon: FiSettings },
];

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className={styles.nav} aria-label="Разделы админ-панели">
      <div className={styles.navGroupTitle}>Управление</div>
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/admin"}
          onClick={onNavigate}
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <Icon size={17} />
          <span>{label}</span>
        </NavLink>
      ))}
      <div className={styles.navFooter}>
        <span>Avilon Admin</span>
        <span className={styles.version}>v1.0</span>
      </div>
    </nav>
  );
}
