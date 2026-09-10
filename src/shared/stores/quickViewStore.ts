import { makeAutoObservable } from "mobx";
import type { Product } from "@shared/api/models";

class QuickViewStore {
  product: Product | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  open(product: Product) {
    this.product = product;
  }

  close() {
    this.product = null;
  }
}

export const quickViewStore = new QuickViewStore();