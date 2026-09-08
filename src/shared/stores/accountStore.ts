import { makeAutoObservable } from 'mobx';
import {
  getTgUser,
  readyTelegramWebApp,
} from '@shared/lib/telegram';
import { userApi } from '@shared/api/userApi';

export type UserRole = 'buyer' | 'seller';

const DEFAULT_AVATAR =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
      <rect width="96" height="96" rx="24" fill="#1A1A1A"/>
      <text x="48" y="58" font-family="-apple-system,Arial,sans-serif" font-size="38"
        font-weight="700" fill="#FFFFFF" text-anchor="middle">L</text>
    </svg>`
  );

class AccountStore {
  displayName: string = '';
  avatarUrl: string | undefined;
  username: string | undefined;
  role: UserRole = 'buyer';
  initialized = false;
  stars = 1920;

  constructor() {
    makeAutoObservable(this);
  }

  initialize() {
    if (this.initialized) return;
    this.initialized = true;

    readyTelegramWebApp();

    void this.loadUser();
  }

  private async loadUser() {
    const tgUser = getTgUser();
    const initData = window.Telegram?.WebApp?.initData ?? '';

    if (!initData) {
      // Вне Telegram — демо-данные для предпросмотра
      this.displayName = 'Александр';
      return;
    }

    this.applyFromTelegram(tgUser);

    try {
      const profile = await userApi.getMe(initData);
      this.applyFromApi(profile);
    } catch {
      try {
        const profile = await userApi.auth(initData);
        this.applyFromApi(profile);
      } catch {
        // Бэкенд ещё не подключён — оставляем данные из Telegram initData.
      }
    }
  }

  private applyFromTelegram(user?: { first_name?: string; last_name?: string; username?: string; photo_url?: string }) {
    if (user) {
      this.displayName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || 'Гость';
      this.username = user.username;
      this.avatarUrl = user.photo_url;
    } else {
      this.displayName = 'Гость';
    }
  }

  private applyFromApi(profile: {
    firstName: string;
    lastName?: string;
    username?: string;
    avatarUrl?: string;
    role?: 'buyer' | 'seller';
  }) {
    this.displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || 'Гость';
    if (profile.username) this.username = profile.username;
    if (profile.avatarUrl) this.avatarUrl = profile.avatarUrl;
    if (profile.role) this.role = profile.role;
  }

  setRole(role: UserRole) {
    this.role = role;
  }

  get avatar(): string {
    return this.avatarUrl ?? DEFAULT_AVATAR;
  }

  get roleLabel(): string {
    return this.role === 'seller' ? 'Продавец' : 'Покупатель';
  }
}

export const accountStore = new AccountStore();
