import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { FiArrowLeft, FiShield } from "react-icons/fi";
import { accountStore } from "@shared/stores/accountStore";
import styles from "./AdminLoginPage.module.scss";

/**
 * Temporary development entrance. The form intentionally contains no secret:
 * the backend creates the test admin session and returns a JWT, exactly as a
 * future production admin login endpoint will. Replace `accountStore.devLogin`
 * with a dedicated `adminLogin` call when production auth is ready.
 */
const DEV_ADMIN = {
  role: "admin" as const,
  telegramId: 900000003,
  firstName: "Dev Админ",
};

function AdminLoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const devEnabled = import.meta.env.DEV;

  useEffect(() => {
    if (accountStore.initialized && accountStore.isAuthenticated && accountStore.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [accountStore.initialized, accountStore.isAuthenticated, accountStore.role, navigate]);

  const login = async () => {
    setError(null);
    try {
      await accountStore.devLogin(DEV_ADMIN);
      if (accountStore.role !== "admin") {
        throw new Error("Выданная сессия не имеет прав администратора");
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось войти. Проверьте, что локальный backend запущен.",
      );
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.mark}>
          <FiShield size={22} />
        </div>
        <h1 className={styles.title}>Avilon Admin</h1>
        <p className={styles.subtitle}>
          Вход в административную панель маркетплейса
        </p>

        {devEnabled ? (
          <>
            <button
              type="button"
              className={styles.loginButton}
              onClick={login}
              disabled={accountStore.authLoading}
            >
              {accountStore.authLoading
                ? "Входим…"
                : "Войти в админ-панель"}
            </button>
            <p className={styles.hint}>
              Временный тестовый вход. Сессию и роль выдаёт backend; в
              production здесь будет отдельный admin login.
            </p>
          </>
        ) : (
          <p className={styles.hint}>
            Тестовый вход доступен только в dev-сборке. Подключите
            административную авторизацию backend для работы в production.
          </p>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <a className={styles.back} href="/">
          <FiArrowLeft size={15} />
          Вернуться в приложение
        </a>
      </div>
    </div>
  );
}

export default observer(AdminLoginPage);
