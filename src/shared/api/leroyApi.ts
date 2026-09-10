import { http } from './client';
import type {
  CartDto,
  CategoryDto,
  FavoriteDto,
  Order as OrderView,
  Paginated,
  ProductDto,
  ReviewDto,
  SearchResultDto,
  StoreDto,
  UserDto,
} from './models';
import { mapOrder, mapSeller, type RawOrder } from './models';

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  storeId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: 'popular' | 'new' | 'priceAsc' | 'priceDesc';
  page?: number;
  limit?: number;
}

export const leroyApi = {
  authTelegram(initData: string): Promise<{ token: string; user: UserDto }> {
    return http.post<{ token: string; user: UserDto }>('/auth/telegram', { initData });
  },

  me(): Promise<UserDto> {
    return http.get<UserDto>('/auth/me');
  },

  updateRole(role: 'buyer' | 'seller' | 'admin'): Promise<{ token: string; user: UserDto }> {
    return http.patch<{ token: string; user: UserDto }>('/auth/role', { role });
  },

  products(filters: ProductFilters = {}): Promise<Paginated<ProductDto>> {
    return http.get<Paginated<ProductDto>>('/products', filters);
  },

  product(id: string): Promise<ProductDto> {
    return http.get<ProductDto>(`/products/${id}`);
  },

  categories(): Promise<CategoryDto[]> {
    return http.get<CategoryDto[]>('/categories');
  },

  stores(limit = 20): Promise<Paginated<StoreDto>> {
    return http.get<Paginated<StoreDto>>('/stores', { limit });
  },

  store(id: string): Promise<StoreDto> {
    return http.get<StoreDto>(`/stores/${id}`);
  },

  async storeSummary(id: string) {
    const store = await this.store(id);
    return mapSeller(store);
  },

  storeProducts(id: string, page = 1, limit = 20): Promise<Paginated<ProductDto>> {
    return http.get<Paginated<ProductDto>>(`/stores/${id}/products`, { page, limit });
  },

  search(query: string, page = 1, limit = 20): Promise<SearchResultDto> {
    return http.get<SearchResultDto>('/search', { q: query, page, limit });
  },

  reviews(productId: string, page = 1, limit = 20): Promise<Paginated<ReviewDto>> {
    return http.get<Paginated<ReviewDto>>(`/products/${productId}/reviews`, { page, limit });
  },

  cart(): Promise<CartDto[]> {
    return http.get<CartDto[]>('/cart');
  },

  addToCart(dto: {
    productId: string;
    quantity?: number;
    selectedSize?: string;
    selectedColor?: string;
  }): Promise<CartDto> {
    return http.post<CartDto>('/cart/items', dto);
  },

  updateCartItem(id: string, quantity: number): Promise<CartDto | null> {
    return http.patch<CartDto | null>(`/cart/items/${id}`, { quantity });
  },

  removeCartItem(id: string): Promise<void> {
    return http.delete<void>(`/cart/items/${id}`);
  },

  clearCart(): Promise<void> {
    return http.delete<void>('/cart');
  },

  favorites(): Promise<Paginated<FavoriteDto>> {
    return http.get<Paginated<FavoriteDto>>('/favorites', { type: 'products', limit: 100 });
  },

  toggleFavorite(productId: string): Promise<{ isFavorite: boolean }> {
    return http.post<{ isFavorite: boolean }>('/favorites/toggle', { productId });
  },

  createOrder(dto: {
    deliveryAddress: string;
    deliveryMethod: string;
    paymentMethod?: string;
  }): Promise<OrderView> {
    return http
      .post<RawOrder>('/orders', dto)
      .then((order) => mapOrder(order));
  },

  myOrders(): Promise<OrderView[]> {
    return http
      .get<RawOrder[]>('/orders')
      .then((orders) => orders.map((order) => mapOrder(order)));
  },

  pay(order: OrderView): Promise<{ id: string; status: string }> {
    return http.post<{ id: string; status: string }>('/payments', {
      orderId: order.id,
      provider: 'mock',
    });
  },

  createReview(dto: { productId: string; rating: number; text?: string }): Promise<ReviewDto> {
    return http.post<ReviewDto>('/reviews', dto);
  },
};