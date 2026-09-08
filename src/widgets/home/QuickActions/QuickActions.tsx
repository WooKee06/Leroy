import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiStar, FiZap, FiGift, FiShoppingBag, FiHeart } from "react-icons/fi";
import styles from "./QuickActions.module.scss";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  to: string;
}

const actions: QuickAction[] = [
  { id: "stars", label: "За Stars", icon: <FiStar size={19} fill="currentColor" />, to: "/search" },
  { id: "deals", label: "Deals", icon: <FiZap size={19} />, to: "/search" },
  { id: "gifts", label: "Подарки", icon: <FiGift size={19} />, to: "/search" },
  { id: "stores", label: "Магазины", icon: <FiShoppingBag size={19} />, to: "/stores" },
  { id: "favorites", label: "Избранное", icon: <FiHeart size={19} />, to: "/favorites" },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <nav className={styles.quickActions} aria-label="Быстрые действия">
      {actions.map((action) => (
        <motion.button
          key={action.id}
          className={styles.quickAction}
          onClick={() => navigate(action.to)}
          whileTap={{ scale: 0.9 }}
        >
          <span className={styles.quickActionIcon}>{action.icon}</span>
          <span className={styles.quickActionLabel}>{action.label}</span>
        </motion.button>
      ))}
    </nav>
  );
}