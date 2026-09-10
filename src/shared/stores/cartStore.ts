import { makeAutoObservable, runInAction } from 'mobx';
import type { Product } from '@shared/api/models';
import { leroyApi } from '@shared/api/leroyApi';
import { mapCartItem } from '@shared/api/models';
import { getAuthToken } from '@shared/api/client';

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

class CartStore {
  items: CartItem[] = [];
  loading = false;
  loaded = false;

  constructor() {
    makeAutoObservable(this);
  }

  private get shopId(): string | null {
    return getAuthToken();
  }

  async load(force = false) {
    if (!this.shopId) return;
    if (this.loaded && !force) return;
    this.loading = true;
    try {
      const res = await leroyApi.cart();
      runInAction(() => {
        this.items = res.map(mapCartItem);
        this.loaded = true;
      });
    } catch {
      // не авторизован или сервер недоступен
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async refresh() {
    this.loaded = false;
    await this.load(true);
  }

  async addItem(product: Product, size?: string, color?: string, quantity = 1) {
    if (!this.shopId) return;
    try {
      await leroyApi.addToCart({
        productId: product.id,
        quantity,
        selectedSize: size,
        selectedColor: color,
      });
      await this.refresh();
    } catch {
      // ignore
    }
  }

  async updateQuantity(productId: string, quantity: number, size?: string, color?: string) {
    const item = this.findItem(productId, size, color);
    if (!item) return;
    if (quantity <= 0) {
      await this.removeItem(productId, size, color);
      return;
    }
    if (!this.shopId) return;
    try {
      await leroyApi.updateCartItem(item.cartItemId, quantity);
      await this.refresh();
    } catch {
      // ignore
    }
  }

  async removeItem(productId: string, size?: string, color?: string) {
    const item = this.findItem(productId, size, color);
    if (!item) return;
    if (!this.shopId) return;
    try {
      await leroyApi.removeCartItem(item.cartItemId);
      await this.refresh();
    } catch {
      // ignore
    }
  }

  async clear() {
    if (!this.shopId) return;
    try {
      await leroyApi.clearCart();
    } catch {
      // ignore
    }
    this.items = [];
    this.loaded = false;
  }

  private findItem(productId: string, size?: string, color?: string): CartItem | undefined {
    return this.items.find(
      (i) =>
        i.product.id === productId &&
        i.selectedSize === size &&
        i.selectedColor === color,
    );
  }

  get totalCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get subtotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
  }

  get delivery(): number {
    return this.subtotal > 5000 ? 0 : 350;
  }

  get total(): number {
    return this.subtotal + this.delivery;
  }

  get itemsBySeller(): Map<string, CartItem[]> {
    const grouped = new Map<string, CartItem[]>();
    for (const item of this.items) {
      const key = item.product.seller.id || 'seller';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(item);
    }
    return grouped;
  }
}

export const cartStore = new CartStore();