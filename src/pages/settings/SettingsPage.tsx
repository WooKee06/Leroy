import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import {
  FiChevronRight,
  FiCreditCard,
  FiGlobe,
  FiHeadphones,
  FiMapPin,
  FiMoon,
  FiShield,
  FiSun,
  FiUser,
} from "react-icons/fi";
import { accountStore } from "@shared/stores/accountStore";
import { themeStore } from "@shared/stores/themeStore";
import PageContainer from "@shared/ui/PageContainer";
import styles from "./SettingsPage.module.scss";

interface RowProps {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
}

function Row({ icon, label, desc, onClick, trailing }: RowProps) {
  return (
    <div className={styles.row} onClick={onClick}>
      <span className={styles.rowIcon}>{icon}</span>
      <span className={styles.rowMain}>
        <span className={styles.rowLabel}>{label}</span>
        {desc && <span className={styles.rowDesc}>{desc}</span>}
      </span>
      {trailing ?? <FiChevronRight size={18} className={styles.rowChevron} />}
    </div>
  );
}

function SettingsPage() {
  const navigate = useNavigate();
  const { isDark } = themeStore;

  const logout = () => {
    accountStore.logout();
    navigate("/");
  };

  return (
    <div className={`page-wrapper ${styles.page}`}>
      <PageContainer>
        <h1 className={styles.pageTitle}>Настройки</h1>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Оформление</div>
          <div className={styles.card}>
            <Row
              icon={isDark ? <FiMoon size={20} /> : <FiSun size={20} />}
              label="Тема"
              desc={isDark ? "Тёмная" : "Светлая"}
              onClick={() => themeStore.toggle()}
              trailing={
                <div className={styles.switch} role="radiogroup" aria-label="Тема">
                  <button
                    className={`${styles.switchOption} ${!isDark ? styles.switchOptionActive : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      themeStore.setTheme("light");
                    }}
                  >
                    <FiSun size={14} /> Светлая
                  </button>
                  <button
                    className={`${styles.switchOption} ${isDark ? styles.switchOptionActive : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      themeStore.setTheme("dark");
                    }}
                  >
                    <FiMoon size={14} /> Тёмная
                  </button>
                </div>
              }
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Аккаунт</div>
          <div className={styles.card}>
            <Row
              icon={<FiUser size={20} />}
              label={accountStore.displayName}
              desc={accountStore.username ? `@${accountStore.username}` : accountStore.roleLabel}
            />
            <Row
              icon={<FiShield size={20} />}
              label="Роль"
              desc={accountStore.roleLabel}
              onClick={() => navigate("/role")}
            />
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Общие</div>
          <div className={styles.card}>
            <Row icon={<FiMapPin size={20} />} label="Адреса доставки" desc="2 адреса" />
            <Row icon={<FiCreditCard size={20} />} label="Способы оплаты" desc="Telegram Stars" />
            <Row icon={<FiGlobe size={20} />} label="Язык" desc="Русский" />
            <Row icon={<FiHeadphones size={20} />} label="Поддержка" desc="Онлайн-чат" />
          </div>
        </div>

        <button className={styles.logout} onClick={logout}>
          Выйти из аккаунта
        </button>
      </PageContainer>
    </div>
  );
}

export default observer(SettingsPage);