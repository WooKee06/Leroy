import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import {
  FiCheck,
  FiLock,
  FiShoppingBag,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { accountStore, type UserRole } from "@shared/stores/accountStore";
import PageContainer from "@shared/ui/PageContainer";
import styles from "./RolePage.module.scss";

const ROLES: {
  id: UserRole;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "buyer",
    label: "Покупатель",
    desc: "Покупка товаров, избранное, корзина, заказы",
    icon: <FiUser size={20} />,
  },
  {
    id: "seller",
    label: "Продавец",
    desc: "Свой магазин, товары, заказы покупателей",
    icon: <FiShoppingBag size={20} />,
  },
  {
    id: "admin",
    label: "Администратор",
    desc: "Управление платформой и модерация",
    icon: <FiShield size={20} />,
  },
];

function RolePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = accountStore.role === "admin";

  const select = async (role: UserRole) => {
    if (saving || role === accountStore.role) return;
    if (role === "admin" && !isAdmin) {
      setError("Роль администратора недоступна для самостоятельного назначения");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await accountStore.updateRole(role);
      navigate("/settings");
    } catch {
      setError("Не удалось сменить роль. Попробуйте ещё раз");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`page-wrapper ${styles.page}`}>
      <PageContainer>
        <h1 className={styles.pageTitle}>Роль</h1>
        <p className={styles.subtitle}>
          Роль определяет, какой интерфейс доступен. Смена роли сохраняется на
          сервере.
        </p>

        <div className={styles.card}>
          {ROLES.map((r) => {
            const active = r.id === accountStore.role;
            const locked = r.id === "admin" && !isAdmin;
            return (
              <button
                key={r.id}
                className={`${styles.row} ${active ? styles.rowActive : ""}`}
                onClick={() => select(r.id)}
                disabled={saving || locked}
                type="button"
              >
                <span className={styles.rowIcon}>{r.icon}</span>
                <span className={styles.rowMain}>
                  <span className={styles.rowLabel}>{r.label}</span>
                  <span className={styles.rowDesc}>{r.desc}</span>
                </span>
                {active && <FiCheck size={20} className={styles.rowCheck} />}
                {locked && <FiLock size={16} className={styles.rowLock} />}
              </button>
            );
          })}
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </PageContainer>
    </div>
  );
}

export default observer(RolePage);