import "./shared/lib/polyfills";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import { accountStore } from "@shared/stores/accountStore";
import { themeStore } from "@shared/stores/themeStore";
import "./app/styles/global.scss";

accountStore.initialize();
themeStore.initialize();

const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();

  const webApp = tg as typeof tg & {
    disableVerticalSwipes?: () => void;
  };

  webApp.disableVerticalSwipes?.();
}

createRoot(document.getElementById("root")!).render(<App />);
