import { http } from "./client";
import type {
  AddressDto,
  AnalyticsEventInput,
  CartDto,
  CategoryDto,
  CreateAddressInput,
  DeliveryQuoteDto,
  DeliveryQuoteRequestDto,
  DeliveryTrackingDto,
  FavoriteDto,
  Order as OrderView,
  OrderEventDto,
  Paginated,
  PaymentView,
  PayoutDto,
  ProductDto,
  ReviewDto,
  SearchResultDto,
  SellerAnalyticsDto,
  SellerBalanceDto,
  SellerDashboardDto,
  RawSellerOrder,
  StoreDto,
  TonBalanceView,
  TonPaymentInitResult,
  TonProof,
  TonWalletBound,
  TopUpConfirmDto,
  TopUpDto,
  UserDto,
  WalletBalanceDto,
  WalletTransactionsPageDto,
} from "./models";
import { mapOrder, mapSeller, type RawOrder } from "./models";

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: "popular" | "new" | "priceAsc" | "priceDesc";
  page?: number;
  limit?: number;
}

export const leroyApi = {
  authTelegram(
    initData: string,
    mode?: "login" | "register",
  ): Promise<{ token: string; user: UserDto; isNew?: boolean }> {
    return http.post<{ token: string; user: UserDto; isNew?: boolean }>(
      "/auth/telegram",
      { initData, mode },
    );
  },

  me(): Promise<UserDto> {
    return http.get<UserDto>("/auth/me");
  },

  /**
   * Local development login (backend requires ALLOW_DEV_AUTH=true).
   */
  devAuth(body: {
    role?: "buyer" | "seller" | "admin";
    telegramId?: number;
    firstName?: string;
    username?: string;
  }): Promise<{ token: string; user: UserDto; isNew?: boolean }> {
    return http.post<{ token: string; user: UserDto; isNew?: boolean }>(
      "/auth/dev",
      body,
    );
  },

  updateRole(
    role: "buyer" | "seller" | "admin",
  ): Promise<{ token: string; user: UserDto }> {
    return http.patch<{ token: string; user: UserDto }>("/auth/role", { role });
  },

  products(filters: ProductFilters = {}): Promise<Paginated<ProductDto>> {
    return http.get<Paginated<ProductDto>>("/products", filters);
  },

  addresses(): Promise<AddressDto[]> {
    return http.get<AddressDto[]>("/addresses");
  },

  createAddress(dto: CreateAddressInput): Promise<AddressDto> {
    return http.post<AddressDto>("/addresses", dto);
  },

  updateAddress(
    id: string,
    dto: Partial<CreateAddressInput>,
  ): Promise<AddressDto> {
    return http.patch<AddressDto>(`/addresses/${id}`, dto);
  },

  deleteAddress(id: string): Promise<void> {
    return http.delete<void>(`/addresses/${id}`);
  },

  setDefaultAddress(id: string): Promise<AddressDto> {
    return http.post<AddressDto>(`/addresses/${id}/default`);
  },

  product(id: string): Promise<ProductDto> {
    return http.get<ProductDto>(`/products/${id}`);
  },

  categories(): Promise<CategoryDto[]> {
    return http.get<CategoryDto[]>("/categories");
  },

  stores(limit = 20): Promise<Paginated<StoreDto>> {
    return http.get<Paginated<StoreDto>>("/stores", { limit });
  },

  store(id: string): Promise<StoreDto> {
    return http.get<StoreDto>(`/stores/${id}`);
  },

  async storeSummary(id: string) {
    const store = await this.store(id);
    return mapSeller(store);
  },

  storeProducts(
    id: string,
    page = 1,
    limit = 20,
  ): Promise<Paginated<ProductDto>> {
    return http.get<Paginated<ProductDto>>(`/stores/${id}/products`, {
      page,
      limit,
    });
  },

  async myStore(userId?: string): Promise<StoreDto | null> {
    const res = await this.stores(100);
    return userId
      ? (res.items.find((s) => s.ownerId === userId) ?? null)
      : null;
  },

  updateStore(
    id: string,
    dto: {
      name?: string;
      description?: string;
      logoUrl?: string;
      coverUrl?: string;
    },
  ): Promise<StoreDto> {
    return http.patch<StoreDto>(`/stores/${id}`, dto);
  },

  createStore(dto: {
    name: string;
    description?: string;
    logoUrl?: string;
    coverUrl?: string;
  }): Promise<StoreDto> {
    return http.post<StoreDto>("/stores", dto);
  },

  // ── Seller ───────────────────────────────────────────────────────────────

  sellerDashboard(): Promise<SellerDashboardDto> {
    return http.get<SellerDashboardDto>("/seller/dashboard");
  },

  sellerBalance(): Promise<SellerBalanceDto> {
    return http.get<SellerBalanceDto>("/seller/balance");
  },

  sellerAnalytics(
    period: "day" | "week" | "month" = "month",
  ): Promise<SellerAnalyticsDto> {
    return http.get<SellerAnalyticsDto>("/seller/analytics", { period });
  },

  sellerOrders(): Promise<RawSellerOrder[]> {
    return http.get<RawSellerOrder[]>("/seller/orders");
  },

  sellerOrder(id: string): Promise<RawSellerOrder> {
    return http.get<RawSellerOrder>(`/seller/orders/${id}`);
  },

  updateSellerOrderStatus(
    id: string,
    status: string,
  ): Promise<RawSellerOrder> {
    return http.patch<RawSellerOrder>(`/seller/orders/${id}/status`, {
      status,
    });
  },

  requestPayout(amount: number): Promise<PayoutDto> {
    return http.post<PayoutDto>("/seller/payout", { amount });
  },

  sellerPayouts(): Promise<PayoutDto[]> {
    return http.get<PayoutDto[]>("/seller/payouts");
  },

  trackAnalytics(events: AnalyticsEventInput[]): Promise<{ success: boolean }> {
    return http.post<{ success: boolean }>("/analytics/events", { events });
  },

  upload(file: File): Promise<{
    url: string;
    originalName: string;
    size: number;
    mimetype: string;
  }> {
    const form = new FormData();
    form.append("file", file);
    return http.postForm<{
      url: string;
      originalName: string;
      size: number;
      mimetype: string;
    }>("/upload", form);
  },

  createProduct(dto: {
    name: string;
    price: number;
    description?: string;
    categoryId?: string;
    images?: string[];
    stock?: number;
    oldPrice?: number;
    tags?: string[];
    variants?: Array<{
      type: "size" | "color";
      value: string;
      hex?: string;
      stock?: number;
      price?: number;
    }>;
    weightG?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
  }): Promise<ProductDto> {
    return http.post<ProductDto>("/products", dto);
  },

  updateProduct(
    id: string,
    dto: Partial<{
      name: string;
      price: number;
      description?: string;
      categoryId?: string;
      images?: string[];
      stock?: number;
      oldPrice?: number;
      tags?: string[];
      variants?: Array<{
        type: "size" | "color";
        value: string;
        hex?: string;
        stock?: number;
        price?: number;
      }>;
      weightG?: number;
      lengthCm?: number;
      widthCm?: number;
      heightCm?: number;
    }>,
  ): Promise<ProductDto> {
    return http.patch<ProductDto>(`/products/${id}`, dto);
  },

  deleteProduct(id: string): Promise<{ success: boolean }> {
    return http.delete<{ success: boolean }>(`/products/${id}`);
  },

  search(query: string, page = 1, limit = 20): Promise<SearchResultDto> {
    return http.get<SearchResultDto>("/search", { q: query, page, limit });
  },

  reviews(
    productId: string,
    page = 1,
    limit = 20,
  ): Promise<Paginated<ReviewDto>> {
    return http.get<Paginated<ReviewDto>>(`/products/${productId}/reviews`, {
      page,
      limit,
    });
  },

  cart(): Promise<CartDto[]> {
    return http.get<CartDto[]>("/cart");
  },

  addToCart(dto: {
    productId: string;
    quantity?: number;
    selectedSize?: string;
    selectedColor?: string;
  }): Promise<CartDto> {
    return http.post<CartDto>("/cart/items", dto);
  },

  updateCartItem(id: string, quantity: number): Promise<CartDto | null> {
    return http.patch<CartDto | null>(`/cart/items/${id}`, { quantity });
  },

  removeCartItem(id: string): Promise<void> {
    return http.delete<void>(`/cart/items/${id}`);
  },

  clearCart(): Promise<void> {
    return http.delete<void>("/cart");
  },

  favorites(): Promise<Paginated<FavoriteDto>> {
    return http.get<Paginated<FavoriteDto>>("/favorites", {
      type: "products",
      limit: 100,
    });
  },

  toggleFavorite(productId: string): Promise<{ isFavorite: boolean }> {
    return http.post<{ isFavorite: boolean }>("/favorites/toggle", {
      productId,
    });
  },

  createOrder(
    dto: {
      deliveryAddress: string;
      deliveryMethod: string;
      paymentMethod?: string;
      deliveryProvider?: string;
      deliveryTariff?: string;
      deliveryPrice?: number;
      pickupCode?: string;
      pickupAddress?: string;
    },
    idempotencyKey?: string,
  ): Promise<OrderView> {
    return http
      .post<RawOrder>(
        "/orders",
        dto,
        idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      )
      .then((order) => mapOrder(order));
  },

  myOrders(): Promise<OrderView[]> {
    return http
      .get<RawOrder[]>("/orders")
      .then((orders) => orders.map((order) => mapOrder(order)));
  },

  order(id: string): Promise<OrderView> {
    return http
      .get<RawOrder>(`/orders/${id}`)
      .then((order) => mapOrder(order));
  },

  /** Append-only order timeline (created → paid → … → delivered/cancelled). */
  orderEvents(id: string): Promise<OrderEventDto[]> {
    return http.get<OrderEventDto[]>(`/orders/${id}/events`);
  },

  /** Buyer cancels before shipment: server refunds the wallet and restocks. */
  cancelOrder(id: string, reason?: string): Promise<OrderView> {
    return http
      .post<RawOrder>(`/orders/${id}/cancel`, reason ? { reason } : {})
      .then((order) => mapOrder(order));
  },

  // ── Delivery ───────────────────────────────────────────────────────────

  /**
   * Server-side CDEK quote. The server knows product weights/dimensions and
   * returns ready-to-render options; the client only supplies the city and
   * the cart composition.
   */
  deliveryQuote(dto: DeliveryQuoteRequestDto): Promise<DeliveryQuoteDto> {
    return http.post<DeliveryQuoteDto>("/delivery/quote", dto);
  },

  deliveryTrack(orderId: string): Promise<DeliveryTrackingDto> {
    return http.get<DeliveryTrackingDto>(`/delivery/track/${orderId}`);
  },

  pay(
    order: OrderView,
    provider: "balance" | "mock" | "ton" | "stars" = "balance",
  ): Promise<{ id: string; status: string }> {
    return http.post<{ id: string; status: string }>("/payments", {
      orderId: order.id,
      provider,
    });
  },

  // ── Wallet / balance ───────────────────────────────────────────────────

  wallet(): Promise<WalletBalanceDto> {
    return http.get<WalletBalanceDto>("/wallet");
  },

  walletTransactions(params: {
    limit?: number;
    cursor?: string;
  } = {}): Promise<WalletTransactionsPageDto> {
    return http.get<WalletTransactionsPageDto>("/wallet/transactions", params);
  },

  createTopUp(amount: number): Promise<TopUpDto> {
    return http.post<TopUpDto>("/wallet/topup", {
      amount,
      provider: "manual",
    });
  },

  confirmTopUp(id: string): Promise<TopUpConfirmDto> {
    return http.post<TopUpConfirmDto>(`/wallet/topup/${id}/confirm`);
  },

  // ── TON / Telegram Wallet ──────────────────────────────────────────────

  tonNonce(): Promise<{ payload: string }> {
    return http.post<{ payload: string }>("/auth/ton/nonce");
  },

  tonVerify(body: {
    address: string;
    publicKey: string;
    proof: TonProof;
  }): Promise<{ verified: boolean; wallet: TonWalletBound }> {
    return http.post<{ verified: boolean; wallet: TonWalletBound }>(
      "/auth/ton/verify",
      body,
    );
  },

  tonBalance(refresh = false): Promise<TonBalanceView> {
    return http.get<TonBalanceView>(
      "/ton/wallet/balance",
      refresh ? { refresh: "1" } : undefined,
    );
  },

  tonPaymentInit(orderId: string): Promise<TonPaymentInitResult> {
    return http.post<TonPaymentInitResult>("/payments/ton/init", { orderId });
  },

  paymentStatus(id: string): Promise<PaymentView> {
    return http.get<PaymentView>(`/payments/${id}/status`);
  },

  paymentCancel(id: string): Promise<PaymentView> {
    return http.post<PaymentView>(`/payments/${id}/cancel`);
  },

  createReview(dto: {
    productId: string;
    rating: number;
    text?: string;
    images?: string[];
  }): Promise<ReviewDto> {
    return http.post<ReviewDto>("/reviews", dto);
  },

  myReviews(): Promise<ReviewDto[]> {
    return http.get<ReviewDto[]>("/reviews/mine");
  },
};
