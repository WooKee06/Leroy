import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { FiArrowLeft, FiShield } from "react-icons/fi";
import { accountStore } from "@shared/stores/accountStore";
import { ApiError } from "@shared/api/client";
import type { TelegramLoginUser } from "@shared/lib/telegram";
import TelegramLoginWidget from "@widgets/auth/TelegramLoginWidget";
import styles from "./AdminLoginPage.module.scss";

/**
 * Production entrance. The Telegram widget is the same one used by the app,
 * but it calls a dedicated backend route that verifies the signature and the
 * admin role from the database. No password or secret exists in the client.
 * The dev button is compiled away in production builds.
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
  const alreadyAdmin =
    accountStore.initialized &&
    accountStore.isAuthenticated &&
    accountStore.role === "admin";

  useEffect(() => {
    if (alreadyAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [alreadyAdmin, navigate]);

  const handleAdminAuth = async (user: TelegramLoginUser) => {
    setError(null);
    try {
      await accountStore.adminLoginWithTelegramWidget(user);
      if (accountStore.role !== "admin") {
        throw new Error("У вашего аккаунта нет прав администратора");
      }
      navigate("/admin", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError(
          "У вашего аккаунта нет прав администратора. Войдите в Telegram под аккаунтом администратора.",
        );
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось войти. Попробуйте ещё раз.",
      );
    }
  };

  const handleDevLogin = async () => {
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

        <div className={styles.widgetBlock}>
          <TelegramLoginWidget onAuth={handleAdminAuth} />
          {accountStore.authLoading && (
            <div className={styles.loadingRow}>
              <span className={styles.spinner} />
              <span>Проверяем права…</span>
            </div>
          )}
        </div>

        <p className={styles.hint}>
          Вход доступен только аккаунтам с ролью администратора. Роль
          проверяется сервером.
        </p>

        {devEnabled && (
          <div className={styles.devBlock}>
            <span className={styles.devBadge}>DEV</span>
            <button
              type="button"
              className={styles.loginButton}
              onClick={handleDevLogin}
              disabled={accountStore.authLoading}
            >
              {accountStore.authLoading ? "Входим…" : "Войти как dev-админ"}
            </button>
            <p className={styles.hint}>
              Тестовый вход без Telegram для локальной разработки.
            </p>
          </div>
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
