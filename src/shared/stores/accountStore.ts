import { makeAutoObservable } from 'mobx';
import {
  buildTelegramLoginInitData,
  getTgUser,
  isOnWeb,
  readyTelegramWebApp,
  type TelegramLoginUser,
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
  authLoading = false;
  stars = 1920;

  /**
   * Wallet state mirrors `GET /api/wallet`. The balance is never changed
   * locally — top-ups and purchases go through the server ledger and the
   * fresh balance is re-read from there.
   */
  balance = 0;
  hold = 0;
  currency = 'RUB';
  walletLoaded = false;
  walletLoading = false;
  walletError = '';
  private walletRequest: Promise<void> | null = null;

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
    const webApp = window.Telegram?.WebApp;
    const initData = webApp?.initData ?? '';

    const savedToken = getAuthToken();
    if (savedToken) {
      try {
        const profile = await leroyApi.me();
        this.applyProfile(profile);
        this.isAuthenticated = true;
        void this.loadWallet(true);
        return;
      } catch {
        setAuthToken(null);
      }
    }

    try {
      if (initData && !isOnWeb()) {
        await this.loginWithInitData(initData);
        return;
      }
    } catch (error) {
      console.error('[account] auth failed', error);
    }

    this.applyFromTelegram(getTgUser());
  }

  private async loginWithInitData(
    initData: string,
    mode?: 'login' | 'register',
  ) {
    const { token, user } = await leroyApi.authTelegram(initData, mode);
    setAuthToken(token);
    this.applyProfile(user);
    this.isAuthenticated = true;
    void this.loadWallet(true);
  }

  async loginWithTelegramWidget(user: TelegramLoginUser) {
    this.authLoading = true;
    try {
      await this.loginWithInitData(buildTelegramLoginInitData(user), 'login');
    } finally {
      this.authLoading = false;
    }
  }

  /**
   * Local-only login for development. Backend must run with ALLOW_DEV_AUTH=true.
   * Creates/updates a test user with the given role and authenticates it.
   */
  async devLogin(options: {
    role: UserRole;
    telegramId?: number;
    firstName?: string;
  }) {
    this.authLoading = true;
    try {
      const { token, user } = await leroyApi.devAuth(options);
      setAuthToken(token);
      this.applyProfile(user);
      this.isAuthenticated = true;
      void this.loadWallet(true);
    } finally {
      this.authLoading = false;
    }
  }

  async registerWithTelegramWidget(user: TelegramLoginUser) {
    this.authLoading = true;
    try {
      await this.loginWithInitData(buildTelegramLoginInitData(user), 'register');
    } finally {
      this.authLoading = false;
    }
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

  /**
   * Re-reads the wallet balance from the server. Safe to call often: it
   * deduplicates concurrent calls and only skips the request when a fresh
   * value is already cached (pass `force` after money movements).
   */
  async loadWallet(force = false): Promise<void> {
    if (!getAuthToken()) return;

    // Join an in-flight request instead of starting a parallel one: callers
    // (checkout pre-check, post-payment refresh) must observe the fresh value,
    // not the old balance.
    if (this.walletRequest) {
      await this.walletRequest;
      if (!force) return;
    }
    if (this.walletLoaded && !force) return;

    const request = this.fetchWallet();
    this.walletRequest = request;
    try {
      await request;
    } finally {
      if (this.walletRequest === request) this.walletRequest = null;
    }
  }

  private async fetchWallet(): Promise<void> {
    this.walletLoading = true;
    this.walletError = '';
    try {
      const wallet = await leroyApi.wallet();
      // The user may have logged out while the request was in flight.
      if (!getAuthToken()) return;
      this.balance = Number(wallet.available ?? 0);
      this.hold = Number(wallet.hold ?? 0);
      this.currency = wallet.currency || 'RUB';
      this.walletLoaded = true;
    } catch (e) {
      this.walletError =
        e instanceof Error ? e.message : 'Не удалось загрузить баланс';
    } finally {
      this.walletLoading = false;
    }
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
    this.balance = 0;
    this.hold = 0;
    this.currency = 'RUB';
    this.walletLoaded = false;
    this.walletError = '';
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