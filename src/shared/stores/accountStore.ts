import { makeAutoObservable } from 'mobx';
import {
  getTgUser,
  readyTelegramWebApp,
} from '@shared/lib/telegram';
import { leroyApi } from '@shared/api/leroyApi';
import { getAuthToken, setAuthToken } from '@shared/api/client';

export type UserRole = 'buyer' | 'seller' | 'admin';

const DEFAULT_AVATAR =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
      <rect width="96" height="96" rx="24" fill="#1A1A1A"/>
      <text x="48" y="58" font-family="-apple-system,Arial,sans-serif" font-size="38"
        font-weight="700" fill="#FFFFFF" text-anchor="middle">L</text>
    </svg>`
  );

const DEV_BUYER_INIT_DATA = `user=${encodeURIComponent(
  JSON.stringify({
    id: 300000001,
    first_name: 'Иван',
    last_name: 'Кузнецов',
    username: 'ivan_k',
  }),
)}`;

interface Profile {
  firstName: string;
  lastName?: string;
  username?: string;
  avatarUrl?: string;
  role?: 'buyer' | 'seller' | 'admin';
  id?: string;
}

class AccountStore {
  displayName: string = '';
  avatarUrl: string | undefined;
  username: string | undefined;
  role: UserRole = 'buyer';
  userId: string | undefined;
  isAuthenticated = false;
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
    const initData = window.Telegram?.WebApp?.initData ?? '';

    const savedToken = getAuthToken();
    if (savedToken) {
      try {
        const profile = await leroyApi.me();
        this.applyProfile(profile);
        this.isAuthenticated = true;
        return;
      } catch {
        setAuthToken(null);
      }
    }

    try {
      if (initData) {
        await this.loginWithInitData(initData);
        return;
      }
      if (import.meta.env.DEV) {
        await this.loginWithInitData(DEV_BUYER_INIT_DATA);
        return;
      }
    } catch (error) {
      console.error('[account] auth failed', error);
    }

    this.applyFromTelegram(getTgUser());
  }

  private async loginWithInitData(initData: string) {
    const { token, user } = await leroyApi.authTelegram(initData);
    setAuthToken(token);
    this.applyProfile(user);
    this.isAuthenticated = true;
  }

  private applyProfile(profile: Profile) {
    if (profile.id) this.userId = profile.id;
    this.displayName =
      [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() ||
      'Гость';
    if (profile.username) this.username = profile.username;
    if (profile.avatarUrl) this.avatarUrl = profile.avatarUrl;
    if (profile.role) this.role = profile.role as UserRole;
  }

  private applyFromTelegram(user?: {
    id?: number | string;
    first_name?: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  }) {
    if (user) {
      this.displayName =
        [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
        'Гость';
      this.username = user.username;
      this.avatarUrl = user.photo_url;
      this.userId =
        user.id !== undefined ? String(user.id) : undefined;
    } else {
      this.displayName = 'Гость';
    }
  }

  setRole(role: UserRole) {
    this.role = role;
  }

  async updateRole(role: UserRole): Promise<void> {
    const { token, user } = await leroyApi.updateRole(role);
    setAuthToken(token);
    this.applyProfile(user);
  }

  logout() {
    setAuthToken(null);
    this.userId = undefined;
    this.isAuthenticated = false;
    this.username = undefined;
    this.avatarUrl = undefined;
    this.displayName = 'Гость';
    this.role = 'buyer';
  }

  get avatar(): string {
    return this.avatarUrl ?? DEFAULT_AVATAR;
  }

  get roleLabel(): string {
    if (this.role === 'seller') return 'Продавец';
    if (this.role === 'admin') return 'Администратор';
    return 'Покупатель';
  }
}

export const accountStore = new AccountStore();