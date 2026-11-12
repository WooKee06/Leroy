import { makeAutoObservable, runInAction } from 'mobx';
import type { Product } from '@shared/api/models';
import { leroyApi } from '@shared/api/leroyApi';
import { mapCartItem } from '@shared/api/models';
import { ApiError, getAuthToken } from '@shared/api/client';
import { trackAddToCart } from '@shared/lib/analytics';

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
    const localKey = `local-${product.id}-${size ?? ""}-${color ?? ""}`;
    this.upsertLocal(product, size, color, quantity);
    trackAddToCart(product.id, quantity);
    if (!this.shopId) return;

    try {
      const created = await leroyApi.addToCart({
        productId: product.id,
        quantity,
        selectedSize: size,
        selectedColor: color,
      });
      if (created?.id) {
        runInAction(() => {
          const index = this.items.findIndex((i) => i.cartItemId === localKey);
          if (index >= 0) {
            // Preserve the locally-known product (with cache-busted images)
            // and only swap in the server-generated cartItemId.
            this.items[index] = {
              ...this.items[index],
              cartItemId: created.id,
            };
          }
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[cartStore] addItem failed:", error);
      runInAction(() => {
        this.items = this.items.filter((i) => i.cartItemId !== localKey);
      });
    }
  }

  async updateQuantity(productId: string, quantity: number, size?: string, color?: string) {
    const item = this.findItem(productId, size, color);
    if (!item) return;
    if (quantity <= 0) {
      await this.removeItem(productId, size, color);
      return;
    }
    const previousQuantity = item.quantity;
    item.quantity = quantity;
    if (!this.shopId) return;

    try {
      await leroyApi.updateCartItem(item.cartItemId, quantity);
    } catch (error) {
      // 404 means the item no longer exists on the server — drop it locally.
      if (error instanceof ApiError && error.status === 404) {
        runInAction(() => {
          this.items = this.items.filter((i) => i !== item);
        });
        return;
      }
      // eslint-disable-next-line no-console
      console.error("[cartStore] updateQuantity failed:", error);
      runInAction(() => {
        item.quantity = previousQuantity;
      });
    }
  }

  async removeItem(productId: string, size?: string, color?: string) {
    const item = this.findItem(productId, size, color);
    if (!item) return;
    const removedItem = item;
    this.items = this.items.filter((i) => i !== item);
    if (!this.shopId) return;

    try {
      await leroyApi.removeCartItem(removedItem.cartItemId);
    } catch (error) {
      // 404 means the item is already gone on the server — that's the desired
      // end state, so keep it removed locally instead of restoring it.
      if (error instanceof ApiError && error.status === 404) {
        return;
      }
      // eslint-disable-next-line no-console
      console.error("[cartStore] removeItem failed:", error);
      runInAction(() => {
        this.items.unshift(removedItem);
      });
    }
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

  /**
   * Delivery is priced by the server quote in checkout, not here: the cart
   * has no destination yet. `total` therefore means "goods total"; checkout
   * adds `deliveryStore.price` on top.
   */
  get total(): number {
    return this.subtotal;
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