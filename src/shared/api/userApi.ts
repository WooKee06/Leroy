export interface UserProfile {
  id: string;
  firstName: string;
  lastName?: string;
  username?: string;
  avatarUrl?: string;
  role: 'buyer' | 'seller';
  stars: number;
}

const API_BASE = '/api';

export const userApi = {
  getMe(initData: string): Promise<UserProfile> {
    return fetch(`${API_BASE}/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': initData,
      },
    }).then((res) => {
      if (!res.ok) throw new Error(`getMe failed: ${res.status}`);
      return res.json();
    });
  },

  auth(initData: string): Promise<UserProfile> {
    return fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    }).then((res) => {
      if (!res.ok) throw new Error(`auth failed: ${res.status}`);
      return res.json();
    });
  },
};
