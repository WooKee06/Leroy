import { describe, it, expect, beforeEach, vi } from "vitest";
import { cartStore } from "./cartStore";

vi.mock("@shared/api/leroyApi", () => ({
  leroyApi: {
    cart: vi.fn(),
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeCartItem: vi.fn(),
    clearCart: vi.fn(),
  },
}));

vi.mock("@shared/api/client", () => ({
  getAuthToken: vi.fn(() => "test-token"),
  setAuthToken: vi.fn(),
}));

import { leroyApi } from "@shared/api/leroyApi";
import type { Product, CartDto } from "@shared/api/models";

function makeProduct(id: string): Product {
  return { id, price: 100 } as Product;
}

describe("cartStore", () => {
  beforeEach(() => {
    cartStore.items = [];
    vi.clearAllMocks();

    vi.mocked(leroyApi.addToCart).mockResolvedValue({} as CartDto);
    vi.mocked(leroyApi.removeCartItem).mockResolvedValue(undefined);
  });

  it("adds a product to the cart", async () => {
    const product = makeProduct("p1");
    await cartStore.addItem(product, "M", "Red");
    expect(cartStore.items).toHaveLength(1);
    expect(cartStore.items[0].product.id).toBe("p1");
    expect(cartStore.items[0].quantity).toBe(1);

    expect(leroyApi.addToCart).toHaveBeenCalledWith({
      productId: "p1",
      quantity: 1,
      selectedSize: "M",
      selectedColor: "Red",
    });
  });

  it("removes a product from the cart", async () => {
    const product = makeProduct("p1");
    await cartStore.addItem(product, "M", "Red");
    await cartStore.removeItem(product.id, "M", "Red");
    expect(cartStore.items).toHaveLength(0);
  });
});
