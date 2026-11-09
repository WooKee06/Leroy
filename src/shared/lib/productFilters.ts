import type { Product } from "@shared/api/models";

export type SortBy = "popular" | "priceAsc" | "priceDesc" | "new";

export interface ProductFilters {
  sortBy: SortBy;
  categories: string[];
  priceMin: string;
  priceMax: string;
  colors: string[];
  sizes: string[];
  minRating: number | null;
  onlyDiscount: boolean;
  onlyNew: boolean;
}

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  sortBy: "popular",
  categories: [],
  priceMin: "",
  priceMax: "",
  colors: [],
  sizes: [],
  minRating: null,
  onlyDiscount: false,
  onlyNew: false,
};

export const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "popular", label: "Популярные" },
  { value: "priceAsc", label: "Сначала дешевле" },
  { value: "priceDesc", label: "Сначала дороже" },
  { value: "new", label: "Сначала новые" },
];

export const RATING_OPTIONS = [
  { value: 4, label: "4.0 и выше" },
  { value: 4.5, label: "4.5 и выше" },
];

function sortProducts(products: Product[], sortBy: SortBy): Product[] {
  const arr = [...products];
  switch (sortBy) {
    case "priceAsc":
      return arr.sort((a, b) => a.price - b.price);
    case "priceDesc":
      return arr.sort((a, b) => b.price - a.price);
    case "new":
      return arr.sort(
        (a, b) =>
          Number(Boolean(b.isNew)) - Number(Boolean(a.isNew)) ||
          b.rating - a.rating,
      );
    case "popular":
    default:
      return arr.sort((a, b) => b.rating - a.rating);
  }
}

/**
 * Применяет все фильтры по порядку и сортирует результат.
 * `activeCategory` — быстрый чип категории на странице каталога.
 */
export function applyProductFilters(
  products: Product[],
  filters: ProductFilters,
  activeCategory = "all",
): Product[] {
  let list = products;

  if (activeCategory !== "all") {
    list = list.filter((p) => p.category === activeCategory);
  }
  if (filters.categories.length > 0) {
    list = list.filter((p) => filters.categories.includes(p.category));
  }

  const min = filters.priceMin ? Number(filters.priceMin) : null;
  const max = filters.priceMax ? Number(filters.priceMax) : null;
  if (min !== null) list = list.filter((p) => p.price >= min);
  if (max !== null) list = list.filter((p) => p.price <= max);

  if (filters.colors.length > 0) {
    list = list.filter((p) =>
      p.colors?.some((c) => filters.colors.includes(c.name)),
    );
  }
  if (filters.sizes.length > 0) {
    list = list.filter((p) => p.sizes?.some((s) => filters.sizes.includes(s)));
  }

  const minRating = filters.minRating;
  if (minRating !== null) {
    list = list.filter((p) => p.rating >= minRating);
  }
  if (filters.onlyDiscount) {
    list = list.filter((p) => typeof p.originalPrice === "number");
  }
  if (filters.onlyNew) {
    list = list.filter((p) => p.isNew);
  }

  return sortProducts(list, filters.sortBy);
}

export function collectColors(
  products: Product[],
): { name: string; hex: string }[] {
  const map = new Map<string, { name: string; hex: string }>();
  products.forEach((p) => {
    p.colors?.forEach((c) => {
      if (!map.has(c.name)) map.set(c.name, c);
    });
  });
  return [...map.values()];
}

export function collectSizes(products: Product[]): string[] {
  const set = new Set<string>();
  products.forEach((p) => p.sizes?.forEach((s) => set.add(s)));
  return [...set].sort((a, b) => a.localeCompare(b, "ru", { numeric: true }));
}

export function hasActiveFilters(filters: ProductFilters): boolean {
  return (
    filters.categories.length > 0 ||
    filters.priceMin !== "" ||
    filters.priceMax !== "" ||
    filters.colors.length > 0 ||
    filters.sizes.length > 0 ||
    filters.minRating !== null ||
    filters.onlyDiscount ||
    filters.onlyNew
  );
}

export type FilterChipGroup =
  | "category"
  | "price"
  | "color"
  | "size"
  | "rating"
  | "discount"
  | "new";

export interface FilterChip {
  key: string;
  label: string;
  group: FilterChipGroup;
  value?: string | number;
}

/** Готовые подписи для строки применённых фильтров. */
export function buildFilterChips(
  filters: ProductFilters,
  categoryName: (id: string) => string,
): FilterChip[] {
  const chips: FilterChip[] = [];

  filters.categories.forEach((id) => {
    chips.push({
      key: `cat-${id}`,
      label: categoryName(id),
      group: "category",
      value: id,
    });
  });

  if (filters.priceMin || filters.priceMax) {
    const from = filters.priceMin
      ? `${Number(filters.priceMin).toLocaleString("ru-RU")} ₽`
      : "0 ₽";
    const to = filters.priceMax
      ? `${Number(filters.priceMax).toLocaleString("ru-RU")} ₽`
      : "∞";
    chips.push({
      key: "price",
      label: `${from} – ${to}`,
      group: "price",
    });
  }

  filters.colors.forEach((name) => {
    chips.push({
      key: `color-${name}`,
      label: name,
      group: "color",
      value: name,
    });
  });

  filters.sizes.forEach((size) => {
    chips.push({
      key: `size-${size}`,
      label: size,
      group: "size",
      value: size,
    });
  });

  if (filters.minRating !== null) {
    chips.push({
      key: "rating",
      label: `${filters.minRating.toFixed(1)} ★`,
      group: "rating",
    });
  }
  if (filters.onlyDiscount) {
    chips.push({
      key: "discount",
      label: "Со скидкой",
      group: "discount",
    });
  }
  if (filters.onlyNew) {
    chips.push({ key: "new", label: "Новинки", group: "new" });
  }

  return chips;
}

/** Убирает один применённый фильтр и возвращает новое состояние. */
export function removeFilterChip(
  filters: ProductFilters,
  chip: FilterChip,
): ProductFilters {
  switch (chip.group) {
    case "category":
      return {
        ...filters,
        categories: filters.categories.filter((c) => c !== chip.value),
      };
    case "price":
      return { ...filters, priceMin: "", priceMax: "" };
    case "color":
      return {
        ...filters,
        colors: filters.colors.filter((c) => c !== chip.value),
      };
    case "size":
      return {
        ...filters,
        sizes: filters.sizes.filter((s) => s !== chip.value),
      };
    case "rating":
      return { ...filters, minRating: null };
    case "discount":
      return { ...filters, onlyDiscount: false };
    case "new":
      return { ...filters, onlyNew: false };
    default:
      return filters;
  }
}

/** «1 товар», «2 товара», «5 товаров». */
export function pluralizeProducts(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "товар";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) {
    return "товара";
  }
  return "товаров";
}
