import { describe, it, expect } from "vitest";
import { mapSeller, mapProduct, mapCategory } from "./models";
import type { StoreDto, ProductDto, CategoryDto } from "./models";

describe("mapSeller", () => {
  it("returns empty seller for null/undefined", () => {
    const seller = mapSeller(null);
    expect(seller.id).toBe("");
    expect(seller.name).toBe("Магазин");
  });

  it("maps store dto fields", () => {
    const dto: StoreDto = {
      id: "s1",
      ownerId: "u1",
      name: "Магазинчик",
      slug: "shop",
      isVerified: true,
      rating: "4.5",
      productCount: 10,
      orderCount: "3",
      logoUrl: "https://example.com/logo.png",
      coverUrl: "https://example.com/cover.png",
      description: "Описание",
    };
    const seller = mapSeller(dto);
    expect(seller.id).toBe("s1");
    expect(seller.name).toBe("Магазинчик");
    expect(seller.verified).toBe(true);
    expect(seller.rating).toBe(4.5);
    expect(seller.productCount).toBe(10);
    expect(seller.orderCount).toBe(3);
    expect(seller.avatar).toBe("https://example.com/logo.png");
  });
});

describe("mapProduct", () => {
  it("maps product with store", () => {
    const dto: ProductDto = {
      id: "p1",
      storeId: "s1",
      store: {
        id: "s1",
        ownerId: "u1",
        name: "Магазин",
        slug: "shop",
      },
      name: "Товар",
      slug: "product",
      price: "1200",
      oldPrice: "1500",
      images: ["img1.jpg"],
      stock: 5,
      isActive: true,
      rating: "4.2",
      reviewCount: 7,
      tags: ["new"],
      isFeatured: true,
      createdAt: "2026-01-01",
    };

    const product = mapProduct(dto);
    expect(product.id).toBe("p1");
    expect(product.name).toBe("Товар");
    expect(product.price).toBe(1200);
    expect(product.originalPrice).toBe(1500);
    expect(product.image).toBe("img1.jpg?v=2026-01-01");
    expect(product.rating).toBe(4.2);
    expect(product.reviewCount).toBe(7);
    expect(product.isNew).toBe(true);
    expect(product.isFeatured).toBe(true);
    expect(product.seller.id).toBe("s1");
  });

  it("uses fallback seller when store missing", () => {
    const dto: ProductDto = {
      id: "p2",
      storeId: "s2",
      name: "Без магазина",
      slug: "no-store",
      price: 100,
      images: [],
      stock: 1,
      isActive: true,
    };
    const fallback = mapSeller(null);
    const product = mapProduct(dto, fallback);
    expect(product.seller.id).toBe("");
  });
});

describe("mapCategory", () => {
  it("returns slug when present", () => {
    expect(
      mapCategory({ slug: "shoes", id: "1", name: "Обувь" } as CategoryDto),
    ).toBe("shoes");
  });

  it("returns id when slug is missing", () => {
    expect(mapCategory({ id: "2", name: "X" } as CategoryDto)).toBe("2");
  });

  it("returns empty string for null", () => {
    expect(mapCategory(null)).toBe("");
  });
});
