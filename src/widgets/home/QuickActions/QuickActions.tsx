import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiStar, FiZap, FiGift, FiShoppingBag, FiHeart } from "react-icons/fi";
import SoonBadge from "@shared/ui/SoonBadge";
import styles from "./QuickActions.module.scss";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  to: string;
  soon?: boolean;
}

const actions: QuickAction[] = [
  {
    id: "stars",
    label: "За Stars",
    icon: <FiStar size={19} fill="currentColor" />,
    to: "/discover",
    soon: true,
  },
  { id: "deals", label: "Deals", icon: <FiZap size={19} />, to: "/discover" },
  { id: "gifts", label: "Подарки", icon: <FiGift size={19} />, to: "/gifts" },
  {
    id: "stores",
    label: "Магазины",
    icon: <FiShoppingBag size={19} />,
    to: "/stores",
  },
  {
    id: "favorites",
    label: "Избранное",
    icon: <FiHeart size={19} />,
    to: "/favorites",
  },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <nav className={styles.quickActions} aria-label="Быстрые действия">
      {actions.map((action) => (
        <motion.button
          key={action.id}
          className={styles.quickAction}
          disabled={action.soon}
          aria-disabled={action.soon}
          onClick={() => {
            if (!action.soon) navigate(action.to);
          }}
          whileTap={action.soon ? undefined : { scale: 0.9 }}
        >
          <span className={styles.quickActionIcon}>
            {action.icon}
            {action.soon && <SoonBadge className={styles.quickActionSoon} />}
          </span>
          <span className={styles.quickActionLabel}>{action.label}</span>
        </motion.button>
      ))}
    </nav>
  );
}