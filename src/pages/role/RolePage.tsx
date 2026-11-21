import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { FiCheck, FiShoppingBag, FiUser } from "react-icons/fi";
import { accountStore } from "@shared/stores/accountStore";
import PageContainer from "@shared/ui/PageContainer";
import styles from "./RolePage.module.scss";

/** Only these roles can be switched from the user-facing UI. Admin is
 * assigned in the database and is changing here neither visible nor enabled. */
type SelectableRole = "buyer" | "seller";

const ROLES: {
  id: SelectableRole;
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
];

function RolePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The server forbids self-demotion, so there is nothing to switch here.
  if (accountStore.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const select = async (role: SelectableRole) => {
    if (saving || role === accountStore.role) return;
    setSaving(true);
    setError(null);
    try {
      await accountStore.updateRole(role);
      navigate("/settings");
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Не удалось сменить роль. Попробуйте ещё раз",
      );
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
            return (
              <button
                key={r.id}
                className={`${styles.row} ${active ? styles.rowActive : ""}`}
                onClick={() => select(r.id)}
                disabled={saving}
                type="button"
              >
                <span className={styles.rowIcon}>{r.icon}</span>
                <span className={styles.rowMain}>
                  <span className={styles.rowLabel}>{r.label}</span>
                  <span className={styles.rowDesc}>{r.desc}</span>
                </span>
                {active && <FiCheck size={20} className={styles.rowCheck} />}
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
