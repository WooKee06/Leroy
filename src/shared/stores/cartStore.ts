import { makeAutoObservable } from 'mobx';
import type { Product } from '@shared/api/mockData';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

class CartStore {
  items: CartItem[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  get totalCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get subtotal(): number {
    return this.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
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
      const key = item.product.seller.id;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(item);
    }
    return grouped;
  }

  addItem(product: Product, size?: string, color?: string) {
    const existing = this.items.find(
      (i) =>
        i.product.id === product.id &&
        i.selectedSize === size &&
        i.selectedColor === color
    );
    if (existing) {
      existing.quantity++;
    } else {
      this.items.push({ product, quantity: 1, selectedSize: size, selectedColor: color });
    }
  }

  removeItem(productId: string, size?: string, color?: string) {
    const index = this.items.findIndex(
      (i) =>
        i.product.id === productId &&
        i.selectedSize === size &&
        i.selectedColor === color
    );
    if (index !== -1) this.items.splice(index, 1);
  }

  updateQuantity(productId: string, quantity: number, size?: string, color?: string) {
    const item = this.items.find(
      (i) =>
        i.product.id === productId &&
        i.selectedSize === size &&
        i.selectedColor === color
    );
    if (item) {
      if (quantity <= 0) {
        this.removeItem(productId, size, color);
      } else {
        item.quantity = quantity;
      }
    }
  }

  clear() {
    this.items.splice(0, this.items.length);
  }
}

export const cartStore = new CartStore();
