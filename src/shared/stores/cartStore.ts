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
  private syncTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    makeAutoObservable(this);
  }

  private get shopId(): string | null {
    return getAuthToken();
  }

  private scheduleRefresh() {
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.syncTimer = undefined;
      void this.refresh();
    }, 800);
  }

  private upsertLocal(
    product: Product,
    size: string | undefined,
    color: string | undefined,
    quantity: number,
  ) {
    const existing = this.findItem(product.id, size, color);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.unshift({
        cartItemId: `local-${product.id}-${size ?? ""}-${color ?? ""}`,
        product,
        quantity,
        selectedSize: size,
        selectedColor: color,
      });
    }
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
    this.upsertLocal(product, size, color, quantity);
    if (!this.shopId) return;
    void leroyApi
      .addToCart({
        productId: product.id,
        quantity,
        selectedSize: size,
        selectedColor: color,
      })
      .catch(() => {});
    this.scheduleRefresh();
  }

  async updateQuantity(productId: string, quantity: number, size?: string, color?: string) {
    const item = this.findItem(productId, size, color);
    if (!item) return;
    if (quantity <= 0) {
      await this.removeItem(productId, size, color);
      return;
    }
    item.quantity = quantity;
    if (!this.shopId) return;
    void leroyApi.updateCartItem(item.cartItemId, quantity).catch(() => {});
    this.scheduleRefresh();
  }

  async removeItem(productId: string, size?: string, color?: string) {
    const item = this.findItem(productId, size, color);
    if (!item) return;
    this.items = this.items.filter((i) => i !== item);
    if (!this.shopId) return;
    void leroyApi.removeCartItem(item.cartItemId).catch(() => {});
    this.scheduleRefresh();
  }

  async clear() {
    this.items = [];
    this.loaded = false;
    if (!this.shopId) return;
    void leroyApi.clearCart().catch(() => {});
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