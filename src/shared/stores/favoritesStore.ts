import { makeAutoObservable } from 'mobx';

class FavoritesStore {
  favoriteIds: Set<string> = new Set();

  constructor() {
    makeAutoObservable(this);
  }

  isFavorite(productId: string): boolean {
    return this.favoriteIds.has(productId);
  }

  toggle(productId: string) {
    if (this.favoriteIds.has(productId)) {
      this.favoriteIds.delete(productId);
    } else {
      this.favoriteIds.add(productId);
    }
  }

  get count(): number {
    return this.favoriteIds.size;
  }
}

export const favoritesStore = new FavoritesStore();
