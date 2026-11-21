import { Navigate, Outlet } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { accountStore } from "@shared/stores/accountStore";
import AppLoader from "@shared/ui/AppLoader";
import styles from "./RequireAdmin.module.scss";

/**
 * Admin-only route guard. Unauthenticated visitors go to the dedicated admin
 * login page; authenticated non-admins get an explicit "forbidden" screen.
 * The backend enforces the same rule on every /api/admin request.
 */
function RequireAdmin() {
  if (!accountStore.initialized) return <AppLoader label="Проверяем доступ…" />;

  if (!accountStore.isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (accountStore.role !== "admin") {
    return (
      <div className={styles.forbidden}>
        <strong>Доступ запрещён</strong>
        <span>У вашего аккаунта нет прав администратора.</span>
        <a href="/">Вернуться в приложение</a>
      </div>
    );
  }

  return <Outlet />;
}

export default observer(RequireAdmin);
