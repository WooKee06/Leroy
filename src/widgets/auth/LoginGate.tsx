import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { FiExternalLink } from "react-icons/fi";
import { accountStore } from "@shared/stores/accountStore";
import { isOnWeb } from "@shared/lib/telegram";
import type { TelegramLoginUser } from "@shared/lib/telegram";
import { ApiError } from "@shared/api/client";
import TelegramLoginWidget from "./TelegramLoginWidget";
import styles from "./LoginGate.module.scss";

type AuthMode = "login" | "register";

const TG_BOT_USERNAME = import.meta.env
  .VITE_TELEGRAM_BOT_USERNAME as string | undefined;
const TG_REGISTER_URL = TG_BOT_USERNAME
  ? `https://t.me/${TG_BOT_USERNAME}?startapp=register`
  : undefined;

function LoginGate() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const show =
    accountStore.initialized &&
    !accountStore.isAuthenticated &&
    isOnWeb();

  if (!show) return null;

  const handleAuth = async (user: TelegramLoginUser) => {
    setError(null);
    try {
      if (mode === "register") {
        await accountStore.registerWithTelegramWidget(user);
        navigate("/role", { replace: true });
      } else {
        await accountStore.loginWithTelegramWidget(user);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (mode === "register") {
          setError("Этот аккаунт уже зарегистрирован. Войдите как обычно.");
          setMode("login");
        } else {
          setError("Аккаунт не найден. Зарегистрируйтесь через Telegram.");
          setMode("register");
        }
      } else {
        setError("Что-то не так с соединением. Попробуйте ещё раз.");
      }
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
  };

  return (
    <div className={styles.gate}>
      <div className={styles.gateInner}>
        <div className={styles.logo}>L</div>
        <h1 className={styles.title}>Leroy</h1>
        <p className={styles.subtitle}>
          {mode === "login"
            ? "Вход через аккаунт Telegram"
            : "Регистрация через Telegram"}
        </p>

        <div className={styles.segment}>
          <button
            className={
              mode === "login" ? styles.segmentActive : styles.segmentItem
            }
            onClick={() => switchMode("login")}
            type="button"
          >
            Войти
          </button>
          <button
            className={
              mode === "register" ? styles.segmentActive : styles.segmentItem
            }
            onClick={() => switchMode("register")}
            type="button"
          >
            Регистрация
          </button>
        </div>

        <div className={styles.widgetBlock}>
          <TelegramLoginWidget onAuth={handleAuth} />
          {accountStore.authLoading && (
            <div className={styles.loadingRow}>
              <span className={styles.spinner} />
              <span>Проверяем аккаунт…</span>
            </div>
          )}
        </div>

        {TG_REGISTER_URL && (
          <a
            className={styles.tgButton}
            href={TG_REGISTER_URL}
            target="_blank"
            rel="noreferrer"
          >
            <FiExternalLink size={15} />
            Открыть в Telegram и зарегистрироваться
          </a>
        )}

        {error && <p className={styles.error}>{error}</p>}

        {mode === "login" && (
          <button
            className={styles.switchLink}
            onClick={() => switchMode("register")}
            type="button"
          >
            Нет аккаунта? Зарегистрироваться
          </button>
        )}
        {mode === "register" && (
          <button
            className={styles.switchLink}
            onClick={() => switchMode("login")}
            type="button"
          >
            Уже есть аккаунт? Войти
          </button>
        )}

        <p className={styles.hint}>
          Покупки, продажи и заказы — всё в одном месте
        </p>
      </div>
    </div>
  );
}

export default observer(LoginGate);