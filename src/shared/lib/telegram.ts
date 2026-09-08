export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: TelegramUser;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  colorScheme?: 'light' | 'dark';
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}

export function isInTelegram(): boolean {
  return Boolean(window.Telegram?.WebApp?.initData);
}

export function getTgUser(): TelegramUser | undefined {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.user;
}

export function readyTelegramWebApp(): void {
  const webApp = getTelegramWebApp();
  webApp?.ready();
  webApp?.expand();
}

export function getTgDisplayName(user?: TelegramUser): string {
  if (!user) return 'Гость';
  return user.username
    ? `@${user.username}`
    : [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
}
