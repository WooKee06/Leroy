import { describe, it, expect, beforeEach, vi } from 'vitest';
import { favoritesStore } from './favoritesStore';

// Mock the API layer so tests don't hit the network.
vi.mock('@shared/api/leroyApi', () => ({
  leroyApi: {
    favorites: vi.fn(),
    toggleFavorite: vi.fn(),
  },
}));

vi.mock('@shared/api/client', () => ({
  getAuthToken: vi.fn(() => 'test-token'),
  setAuthToken: vi.fn(),
}));

import { leroyApi } from '@shared/api/leroyApi';

describe('favoritesStore', () => {
  beforeEach(() => {
    // Reset observable state between tests.
    favoritesStore.favoriteIds = new Set();
    favoritesStore.productsById = new Map();
    favoritesStore.loaded = false;
    favoritesStore.loading = false;
    vi.clearAllMocks();
  });

  it('isFavorite returns false initially', () => {
    expect(favoritesStore.isFavorite('p1')).toBe(false);
  });

  it('toggles favorite optimistically', async () => {
    vi.mocked(leroyApi.toggleFavorite).mockResolvedValue({ isFavorite: true });

    await favoritesStore.toggle('p1');

    expect(favoritesStore.isFavorite('p1')).toBe(true);
    expect(leroyApi.toggleFavorite).toHaveBeenCalledWith('p1');
  });

  it('rolls back on API error', async () => {
    vi.mocked(leroyApi.toggleFavorite).mockRejectedValue(new Error('boom'));

    await favoritesStore.toggle('p1');

    expect(favoritesStore.isFavorite('p1')).toBe(false);
  });
});