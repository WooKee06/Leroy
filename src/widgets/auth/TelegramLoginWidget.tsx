import { useEffect, useRef, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import type { TelegramLoginUser } from "@shared/lib/telegram";
import styles from "./TelegramLoginWidget.module.scss";

const BOT_USERNAME = import.meta.env
  .VITE_TELEGRAM_BOT_USERNAME as string | undefined;
const WIDGET_URL = "https://telegram.org/js/telegram-widget.js?22";

let scriptInjected = false;

interface TelegramLoginWidgetProps {
  onAuth: (user: TelegramLoginUser) => void;
}

function TelegramLoginWidget({ onAuth }: TelegramLoginWidgetProps) {
  const [loadError, setLoadError] = useState(false);
  const handlerRef = useRef(onAuth);
  handlerRef.current = onAuth;

  useEffect(() => {
    window.onTelegramAuth = (user) => handlerRef.current(user);

    if (!BOT_USERNAME) return;

    if (scriptInjected) return;
    scriptInjected = true;

    const script = document.createElement("script");
    script.async = true;
    script.src = WIDGET_URL;
    script.onerror = () => setLoadError(true);
    document.head.appendChild(script);
  }, []);

  if (loadError) {
    return (
      <div className={styles.widgetError}>
        <FiAlertCircle size={16} />
        <span>Не удалось загрузить виджет входа. Попробуйте позже.</span>
      </div>
    );
  }

  if (!BOT_USERNAME) {
    return (
      <div className={styles.widgetError}>
        <FiAlertCircle size={16} />
        <span>Вход через Telegram временно недоступен.</span>
      </div>
    );
  }

  return (
    <div
      className={styles.widgetContainer}
      data-telegram-login={BOT_USERNAME}
      data-size="large"
      data-radius="14"
      data-request-access="write"
      data-onauth="onTelegramAuth"
    />
  );
}

export default TelegramLoginWidget;