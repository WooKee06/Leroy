import { Navigate, Outlet } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { accountStore, type UserRole } from "@shared/stores/accountStore";

interface RequireRoleProps {
  /**
   * Роли, которым разрешён доступ. Если список не передан — достаточно
   * просто быть авторизованным.
   */
  roles?: UserRole[];
}

/**
 * Route-level guard: проверка выполняется ДО монтирования страницы, поэтому
 * buyer не только не увидит админку, но и не загрузит её чанк.
 *
 * Ждём `accountStore.initialized` намеренно: после перезагрузки страницы роль
 * приходит с `/auth/me`, и редирект раньше этого момента выкинул бы даже
 * настоящего администратора на главную.
 *
 * Сервер — всё равно финальный авторитет: этот guard только UX/первый рубеж.
 */
function RequireRole({ roles }: RequireRoleProps) {
  if (!accountStore.initialized) {
    return null;
  }

  if (!accountStore.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (roles && !roles.includes(accountStore.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default observer(RequireRole);
