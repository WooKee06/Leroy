export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

export interface TelegramLoginUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
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
    onTelegramAuth?: (user: TelegramLoginUser) => void;
  }
}

export function getTelegramWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}

export function isInTelegram(): boolean {
  return Boolean(window.Telegram?.WebApp?.initData);
}

export function isOnWeb(): boolean {
  return !isInTelegram();
}

export function buildTelegramLoginInitData(user: TelegramLoginUser): string {
  const parts: string[] = [`auth_date=${user.auth_date}`, `id=${user.id}`];

  if (user.first_name !== undefined && user.first_name !== null) {
    parts.push(`first_name=${encodeURIComponent(user.first_name)}`);
  }
  if (user.last_name !== undefined && user.last_name !== null) {
    parts.push(`last_name=${encodeURIComponent(user.last_name)}`);
  }
  if (user.username !== undefined && user.username !== null) {
    parts.push(`username=${encodeURIComponent(user.username)}`);
  }
  if (user.photo_url !== undefined && user.photo_url !== null) {
    parts.push(`photo_url=${encodeURIComponent(user.photo_url)}`);
  }

  parts.push(`hash=${user.hash}`);
  return parts.join('&');
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
