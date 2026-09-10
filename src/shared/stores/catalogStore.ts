import { makeAutoObservable, runInAction } from 'mobx';
import type { Category, Product, Seller } from '@shared/api/models';
import { mapProduct, mapSeller } from '@shared/api/models';
import { leroyApi } from '@shared/api/leroyApi';

class CatalogStore {
  products: Product[] = [];
  categories: Category[] = [];
  stores: Seller[] = [];
  loaded = false;
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  async load(force = false) {
    if (this.loaded && !force) return;
    if (this.loading) return;
    this.loading = true;
    try {
      const [productPage, categoryList, storePage] = await Promise.all([
        leroyApi.products({ sort: 'popular', limit: 20 }),
        leroyApi.categories(),
        leroyApi.stores(20),
      ]);
      runInAction(() => {
        this.products = productPage.items
          .map((p) => mapProduct(p))
          .filter((p) => Boolean(p.id));
        this.categories = categoryList.map((c) => ({
          id: c.slug || c.id,
          name: c.name,
          icon: c.icon ?? '',
        })).filter((c) => c.id !== 'all');
        this.categories.unshift({ id: 'all', name: 'Все', icon: 'discover' });
        this.stores = storePage.items
          .map((s) => mapSeller(s))
          .filter((s) => Boolean(s.id));
        this.loaded = true;
      });
    } catch {
      // сервер недоступен
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  categoryName(id: string): string {
    return this.categories.find((c) => c.id === id)?.name ?? id;
  }

  storeCategory(storeId: string): string | undefined {
    return this.products.find((p) => p.seller.id === storeId)?.category;
  }

  get featuredProducts(): Product[] {
    return this.products.length > 0
      ? this.products.filter((p) => p.isFeatured)
      : [];
  }
}

export const catalogStore = new CatalogStore();