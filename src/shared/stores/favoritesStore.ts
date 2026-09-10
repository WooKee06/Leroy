import { makeAutoObservable, runInAction } from 'mobx';
import type { Product } from '@shared/api/models';
import { mapFavoriteProduct } from '@shared/api/models';
import { leroyApi } from '@shared/api/leroyApi';
import { getAuthToken } from '@shared/api/client';

class FavoritesStore {
  favoriteIds: Set<string> = new Set();
  productsById: Map<string, Product> = new Map();
  loaded = false;
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  private get available(): boolean {
    return !!getAuthToken();
  }

  async ensureLoaded(force = false) {
    if (!this.available) return;
    if (this.loaded && !force) return;
    if (this.loading) return;
    this.loading = true;
    try {
      const res = await leroyApi.favorites();
      runInAction(() => {
        this.favoriteIds = new Set(
          res.items
            .map((f) => f.productId)
            .filter((id): id is string => Boolean(id)),
        );
        this.productsById = new Map(
          res.items
            .map(mapFavoriteProduct)
            .filter((p): p is Product => Boolean(p))
            .map((p) => [p.id, p]),
        );
        this.loaded = true;
      });
    } catch {
      // сервер недоступен или не авторизованы
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async refresh() {
    this.loaded = false;
    await this.ensureLoaded(true);
  }

  isFavorite(productId: string): boolean {
    return this.favoriteIds.has(productId);
  }

  get products(): Product[] {
    return Array.from(this.productsById.values());
  }

  get count(): number {
    return this.favoriteIds.size;
  }

  async toggle(productId: string, product?: Product) {
    const wasFavorite = this.favoriteIds.has(productId);

    if (wasFavorite) {
      this.favoriteIds.delete(productId);
      if (product) this.productsById.delete(productId);
    } else {
      this.favoriteIds.add(productId);
      if (product) this.productsById.set(productId, product);
    }

    if (!this.available) return;
    try {
      const res = await leroyApi.toggleFavorite(productId);
      if (!res.isFavorite) {
        this.favoriteIds.delete(productId);
        this.productsById.delete(productId);
      }
    } catch {
      if (wasFavorite) {
        this.favoriteIds.add(productId);
        if (product) this.productsById.set(productId, product);
      } else {
        this.favoriteIds.delete(productId);
        this.productsById.delete(productId);
      }
    }
  }
}

export const favoritesStore = new FavoritesStore();