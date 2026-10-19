export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  category: string;
  seller: Seller;
  rating: number;
  reviewCount: number;
  description: string;
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  isNew?: boolean;
  isFeatured?: boolean;
}

export interface Seller {
  id: string;
  name: string;
  avatar: string;
  cover?: string;
  logo?: string;
  verified: boolean;
  rating: number;
  productCount: number;
  orderCount: number;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface CartItem {
  cartItemId: string;
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface OrderItemView {
  id: string;
  name: string;
  imageUrl?: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  status: string;
  total: number;
  deliveryAddress?: string;
  deliveryMethod?: string;
  createdAt: string;
  items: OrderItemView[];
  stores: string[];
}

export interface RawOrder {
  id: string;
  orderNumber: number;
  status: string;
  total: number | string;
  deliveryAddress?: string;
  deliveryMethod?: string;
  createdAt?: string;
  sellerOrders?: {
    store?: StoreDto;
    items?: {
      id: string;
      name: string;
      imageUrl?: string;
      price: number | string;
      quantity: number;
      selectedSize?: string;
      selectedColor?: string;
    }[];
  }[];
}

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  delivery: number;
  total: number;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface StoreDto {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  isVerified?: boolean;
  rating?: number | string;
  reviewCount?: number;
  productCount?: number;
  orderCount?: number | string;
  isActive?: boolean;
  processingTime?: string;
  deliveryMethods?: string[];
  deliveryPrice?: number | string;
}

export interface ProductVariantDto {
  id: string;
  productId: string;
  type: "size" | "color";
  value: string;
  hex?: string;
  stock: number;
  price?: number | string;
}

export interface ProductDto {
  id: string;
  storeId: string;
  store?: StoreDto;
  categoryId?: string;
  category?: CategoryDto;
  name: string;
  slug: string;
  description?: string;
  price: number | string;
  oldPrice?: number | string | null;
  images: string[];
  stock: number;
  isActive: boolean;
  isFeatured?: boolean;
  rating?: number | string;
  reviewCount?: number;
  salesCount?: number;
  tags?: string[];
  variants?: ProductVariantDto[];
  createdAt?: string;
}

export interface AddressDto {
  id: string;
  label: "home" | "work" | "other";
  city: string;
  street: string;
  house: string;
  apartment?: string;
  entrance?: string;
  floor?: string;
  intercom?: string;
  postalCode?: string;
  comment?: string;
  isDefault: boolean;
  recipientName: string;
  phone: string;
  region?: string;
}

/** Тело запроса на создание адреса: сервер сам выдаёт id и решает про isDefault. */
export type CreateAddressInput = Omit<AddressDto, "id" | "isDefault"> & {
  isDefault?: boolean;
};

export interface UserDto {
  id: string;
  telegramId: string;
  username?: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
  role: "buyer" | "seller" | "admin";
}

export interface CartDto {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  storeId: string;
  product: ProductDto;
  store?: StoreDto;
}

export interface FavoriteDto {
  id: string;
  userId: string;
  productId?: string;
  storeId?: string;
  product?: ProductDto;
  store?: StoreDto;
  createdAt?: string;
}

export interface ReviewDto {
  id: string;
  userId: string;
  productId: string;
  storeId: string;
  rating: number;
  text?: string;
  images?: string[];
  createdAt?: string;
  user?: {
    id: string;
    firstName: string;
    lastName?: string;
    avatarUrl?: string;
  };
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchResultDto {
  products: ProductDto[];
  stores: StoreDto[];
  categories: {
    id: string;
    name: string;
    slug: string;
    icon: string;
    productCount: string;
  }[];
  totalProducts: number;
  totalStores: number;
  page: number;
  limit: number;
  totalPages: number;
}

import {
  DEFAULT_STORE_AVATAR,
  DEFAULT_STORE_COVER,
} from "@shared/lib/placeholders";

const EMPTY_SELLER: Seller = {
  id: "",
  name: "Магазин",
  avatar: DEFAULT_STORE_AVATAR,
  cover: DEFAULT_STORE_COVER,
  verified: false,
  rating: 0,
  productCount: 0,
  orderCount: 0,
  description: "",
};

export function mapSeller(store?: StoreDto | null): Seller {
  if (!store) return { ...EMPTY_SELLER };
  return {
    id: store.id,
    name: store.name,
    avatar: store.logoUrl ?? store.coverUrl ?? DEFAULT_STORE_AVATAR,
    cover: store.coverUrl ?? DEFAULT_STORE_COVER,
    logo: store.logoUrl,
    verified: !!store.isVerified,
    rating: Number(store.rating ?? 0),
    productCount: store.productCount ?? 0,
    orderCount: Number(store.orderCount ?? 0),
    description: store.description ?? "",
  };
}

export function mapCategory(category?: CategoryDto | null): string {
  return category?.slug ?? category?.id ?? "";
}

export function mapProduct(
  product: ProductDto,
  fallbackSeller?: Seller,
): Product {
  const price = Number(product.price ?? 0);
  const originalPrice =
    product.oldPrice !== undefined && product.oldPrice !== null
      ? Number(product.oldPrice)
      : undefined;
  const seller = product.store
    ? mapSeller(product.store)
    : (fallbackSeller ?? { ...EMPTY_SELLER });

  const sizes = (product.variants ?? [])
    .filter((v) => v.type === "size")
    .map((v) => v.value);
  const colors = (product.variants ?? [])
    .filter((v) => v.type === "color")
    .map((v) => ({ name: v.value, hex: v.hex ?? "#CCCCCC" }));

  return {
    id: product.id,
    name: product.name,
    price,
    originalPrice,
    image: product.images?.[0] ?? "",
    images: product.images ?? [],
    category: mapCategory(product.category),
    seller,
    rating: Number(product.rating ?? 0),
    reviewCount: product.reviewCount ?? 0,
    description: product.description ?? "",
    sizes: sizes.length > 0 ? sizes : undefined,
    colors: colors.length > 0 ? colors : undefined,
    isNew: !!product.tags?.includes("new"),
    isFeatured: !!product.isFeatured,
  };
}

export function mapCartItem(item: CartDto): CartItem {
  const seller = item.store ? mapSeller(item.store) : undefined;
  return {
    cartItemId: item.id,
    product: mapProduct(item.product || ({} as ProductDto), seller),
    quantity: item.quantity,
    selectedSize: item.selectedSize,
    selectedColor: item.selectedColor,
  };
}

export function mapReview(review: ReviewDto): Review {
  const fullName = [review.user?.firstName, review.user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return {
    id: review.id,
    author: fullName || "Покупатель",
    rating: review.rating,
    text: review.text ?? "",
    date: formatDate(review.createdAt),
  };
}

export function mapFavoriteProduct(favorite: FavoriteDto): Product | undefined {
  if (!favorite.product) return undefined;
  const seller = favorite.product.store
    ? mapSeller(favorite.product.store)
    : undefined;
  return mapProduct(favorite.product, seller);
}

export function mapOrder(order: RawOrder): Order {
  const sellerOrders = order.sellerOrders ?? [];
  const items = sellerOrders.flatMap((so) =>
    (so.items ?? []).map((i) => ({
      id: i.id,
      name: i.name,
      imageUrl: i.imageUrl,
      price: Number(i.price),
      quantity: i.quantity,
      selectedSize: i.selectedSize,
      selectedColor: i.selectedColor,
    })),
  );
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: Number(order.total),
    deliveryAddress: order.deliveryAddress,
    deliveryMethod: order.deliveryMethod,
    createdAt: order.createdAt ?? "",
    items,
    stores: sellerOrders.map((so) => so.store?.name ?? "Магазин"),
  };
}

function formatDate(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(date);
}

// ─────────────────────────────────────────────────────────────────────────────
// TON / Telegram Wallet (Gram Wallet via TON Connect)
// ─────────────────────────────────────────────────────────────────────────────

export interface TonJettonBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balanceRaw: string;
  balance: string;
}

export interface TonBalanceView {
  addressRaw: string;
  addressFriendly: string;
  balance: string;
  balanceNano: string;
  jettons: TonJettonBalance[];
  lastUpdated: string;
}

export interface TonProofDomain {
  lengthBytes: number;
  value: string;
}

export interface TonProof {
  timestamp: number;
  domain: TonProofDomain;
  signature: string;
  payload: string;
  state_init?: string;
}

export interface TonWalletBound {
  id: string;
  userId: string;
  addressRaw: string;
  addressFriendly: string;
  publicKeyHex: string;
  network: string;
  isVerified: boolean;
}

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "expired";

export interface PaymentView {
  id: string;
  orderId: string;
  provider: "mock" | "ton" | "stars";
  amount: number;
  currency: string;
  status: PaymentStatus;
  memo?: string;
  toAddress?: string;
  fromAddress?: string;
  txHash?: string;
  tonAmountNano?: string;
  rateRubPerTon?: string;
  network?: string;
  expiresAt?: string;
}

export interface TonPaymentQuote {
  totalRub: number;
  rateRubPerTon: number;
  tonAmountNano: string;
  toAddress: string;
  memo: string;
  expiresAt: string;
}

export interface TonPaymentInitResult {
  payment: PaymentView;
  quote: TonPaymentQuote;
}
