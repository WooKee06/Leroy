import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import {
  FiCheck,
  FiChevronRight,
  FiClock,
  FiCreditCard,
  FiGift,
  FiHeart,
  FiMapPin,
  FiPackage,
  FiSettings,
  FiStar,
  FiTruck,
} from "react-icons/fi";
import { getProductById } from "@shared/api/mockData";
import { accountStore } from "@shared/stores/accountStore";
import { favoritesStore } from "@shared/stores/favoritesStore";
import PageContainer from "@shared/ui/PageContainer";
import BalanceCard from "@widgets/home/BalanceCard/BalanceCard";
import ProductCard from "@widgets/product/ProductCard";
import styles from "./ProfilePage.module.scss";

const RECOMMENDED_IDS = ["4", "7", "12", "15", "19"];

function ProfilePage() {
  const navigate = useNavigate();

  const favoriteItems = [...favoritesStore.favoriteIds]
    .map((id) => getProductById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const recommended = RECOMMENDED_IDS.map((id) => getProductById(id)).filter(
    (p): p is NonNullable<typeof p> => Boolean(p),
  );

  const orderStats = [
    { value: 12, label: "Заказы" },
    { value: favoriteItems.length, label: "Избранное" },
    { value: 5, label: "Отзывы" },
  ];

  const orderTiles = [
    { icon: <FiPackage size={20} />, label: "Заказы", value: 12, tint: "#111111" },
    { icon: <FiClock size={20} />, label: "Ожидают", value: 2, tint: "#f5a623" },
    { icon: <FiTruck size={20} />, label: "В пути", value: 3, tint: "#007aff" },
    { icon: <FiCheck size={20} />, label: "Получены", value: 7, tint: "#34c759" },
  ];

  const menu: {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    label: string;
    desc?: string;
    path?: string;
  }[] = [
    {
      icon: <FiHeart size={20} />,
      iconBg: "#fff0f0",
      iconColor: "#ff3b30",
      label: "Избранное",
      desc: `${favoriteItems.length} товара`,
      path: "/favorites",
    },
    {
      icon: <FiMapPin size={20} />,
      iconBg: "#f0f4ff",
      iconColor: "#007aff",
      label: "Адреса доставки",
      desc: "2 адреса",
    },
    {
      icon: <FiCreditCard size={20} />,
      iconBg: "#f0fbf3",
      iconColor: "#34c759",
      label: "Способы оплаты",
      desc: "Telegram Stars",
    },
    {
      icon: <FiStar size={20} />,
      iconBg: "#fff4e0",
      iconColor: "#f5a623",
      label: "Stars / Баланс",
      desc: `${accountStore.stars.toLocaleString("ru-RU")} Telegram Stars`,
    },
    {
      icon: <FiGift size={20} />,
      iconBg: "#f3f0ff",
      iconColor: "#8e5cf7",
      label: "Мои подарки",
      desc: "3 подарка",
    },
    {
      icon: <FiSettings size={20} />,
      iconBg: "#f2f2f3",
      iconColor: "#8e8e93",
      label: "Настройки",
    },
  ];

  return (
    <div className={`page-wrapper ${styles.page}`}>
      <PageContainer>
        <div className={styles.user}>
          <img
            className={styles.avatar}
            src={accountStore.avatar}
            alt={accountStore.displayName}
          />
          <div className={styles.identity}>
            <h1 className={styles.name}>{accountStore.displayName}</h1>
            {accountStore.username && (
              <span className={styles.username}>@{accountStore.username}</span>
            )}
            {!accountStore.username && (
              <span className={styles.role}>{accountStore.roleLabel}</span>
            )}
          </div>
          <button
            className={styles.settingsBtn}
            onClick={() => {}}
            aria-label="Настройки"
          >
            <FiSettings size={20} />
          </button>
        </div>

        <div className={styles.stats}>
          {orderStats.map((s) => (
            <div className={styles.stat} key={s.label}>
              <div className={styles.statValue}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Мои заказы</h2>
          <button className={styles.seeAll} onClick={() => {}}>
            Все <FiChevronRight size={16} />
          </button>
        </div>

        <div className={styles.orderRow}>
          {orderTiles.map((t) => (
            <motion.button
              key={t.label}
              className={styles.orderTile}
              whileTap={{ scale: 0.94 }}
              onClick={() => {}}
            >
              <span
                className={styles.orderIcon}
                style={{ background: t.tint }}
              >
                {t.icon}
              </span>
              <span className={styles.orderValue}>{t.value}</span>
              <span className={styles.orderLabel}>{t.label}</span>
            </motion.button>
          ))}
        </div>

        <div className={styles.balanceWrap}>
          <BalanceCard />
        </div>

        <div className={styles.menu}>
          {menu.map((m) => (
            <motion.button
              key={m.label}
              className={styles.menuItem}
              whileTap={{ scale: 0.98 }}
              onClick={() => m.path && navigate(m.path)}
            >
              <span
                className={styles.menuIcon}
                style={{ background: m.iconBg, color: m.iconColor }}
              >
                {m.icon}
              </span>
              <span className={styles.menuText}>
                <span className={styles.menuLabel}>{m.label}</span>
                {m.desc && <span className={styles.menuDesc}>{m.desc}</span>}
              </span>
              <FiChevronRight
                size={18}
                className={styles.menuChevron}
                color="#C7C7CC"
              />
            </motion.button>
          ))}
        </div>

        {recommended.length > 0 && (
          <div className={styles.recs}>
            <h2 className={styles.sectionTitle}>Вам может понравиться</h2>
            <div className={styles.recsRow}>
              {recommended.map((product) => (
                <div key={product.id} className={styles.recCard}>
                  <ProductCard product={product} variant="small" />
                </div>
              ))}
            </div>
          </div>
        )}
      </PageContainer>
    </div>
  );
}

export default observer(ProfilePage);