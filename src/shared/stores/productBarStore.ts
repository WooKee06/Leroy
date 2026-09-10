import { makeAutoObservable } from "mobx";
import type { Product } from "@shared/api/models";
import { cartStore } from "@shared/stores/cartStore";

class ProductBarStore {
  product: Product | null = null;
  qty = 1;
  selectedSize: string | undefined = undefined;
  selectedColor: string | undefined = undefined;

  constructor() {
    makeAutoObservable(this);
  }

  set(
    product: Product,
    qty: number,
    selectedSize: string | undefined,
    selectedColor: string | undefined,
  ) {
    this.product = product;
    this.qty = qty;
    this.selectedSize = selectedSize;
    this.selectedColor = selectedColor;
  }

  inc() {
    this.qty = Math.min(99, this.qty + 1);
  }

  dec() {
    this.qty = Math.max(1, this.qty - 1);
  }

  get inCart(): boolean {
    if (!this.product) return false;
    return cartStore.items.some(
      (i) =>
        i.product.id === this.product!.id &&
        i.selectedSize === this.selectedSize &&
        i.selectedColor === this.selectedColor,
    );
  }

  get totalLabel(): string {
    if (!this.product) return "";
    return (this.qty * this.product.price).toLocaleString("ru-RU");
  }

  async toggleCart() {
    if (!this.product) return;
    if (this.inCart) {
      await cartStore.removeItem(
        this.product.id,
        this.selectedSize,
        this.selectedColor,
      );
    } else {
      await cartStore.addItem(
        this.product,
        this.selectedSize,
        this.selectedColor,
        this.qty,
      );
    }
  }
}

export const productBarStore = new ProductBarStore();