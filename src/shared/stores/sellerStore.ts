import { makeAutoObservable, runInAction } from "mobx";
import type {
  ProductDto,
  RawSellerOrder,
  Seller,
  SellerAnalyticsDto,
  SellerBalanceDto,
  SellerDashboardDto,
  StoreDto,
} from "@shared/api/models";
import { mapSeller } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import { getAuthToken, imageUrlWithCacheBust } from "@shared/api/client";

class SellerStore {
  seller: Seller | null = null;
  sellerDto: StoreDto | null = null;
  products: ProductDto[] = [];
  dashboard: SellerDashboardDto | null = null;
  balance: SellerBalanceDto | null = null;
  analytics: SellerAnalyticsDto | null = null;
  orders: RawSellerOrder[] = [];

  loaded = false;
  loading = false;

  balanceLoading = false;
  analyticsLoading = false;
  ordersLoading = false;

  private loadPromise: Promise<void> | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  private get available(): boolean {
    return !!getAuthToken();
  }

  /**
   * Loads the seller storefront, products and dashboard stats once.
   * Subsequent calls return the cached data immediately.
   */
  async ensureLoaded(force = false) {
    if (!this.available) return;
    if (this.loaded && !force) return;
    if (this.loading) {
      await this.loadPromise;
      return;
    }

    this.loading = true;
    const promise = this.loadCore();
    this.loadPromise = promise;
    await promise;
  }

  private async loadCore() {
    try {
      const overview = await leroyApi.sellerOverview();

      runInAction(() => {
        this.sellerDto = overview.store;
        this.seller = mapSeller(overview.store);
        this.dashboard = overview.dashboard;
        this.products = overview.products.items;
        this.loaded = true;
      });
    } catch {
      // If overview fails (e.g. no store yet), fall back to empty state.
      runInAction(() => {
        this.loaded = true;
      });
    } finally {
      runInAction(() => {
        this.loading = false;
        this.loadPromise = null;
      });
    }
  }

  async refresh() {
    this.loaded = false;
    await this.ensureLoaded(true);
  }

  async refreshProducts() {
    if (!this.sellerDto?.id) return;
    try {
      const page = await leroyApi.storeProducts(this.sellerDto.id);
      runInAction(() => {
        this.products = page.items;
      });
    } catch {
      // ignore
    }
  }

  async loadBalance() {
    if (this.balance || this.balanceLoading) return;
    this.balanceLoading = true;
    try {
      const data = await leroyApi.sellerBalance();
      runInAction(() => {
        this.balance = data;
      });
    } catch {
      // ignore
    } finally {
      runInAction(() => {
        this.balanceLoading = false;
      });
    }
  }

  async loadAnalytics(period: "day" | "week" | "month" = "month") {
    if (this.analytics || this.analyticsLoading) return;
    this.analyticsLoading = true;
    try {
      const data = await leroyApi.sellerAnalytics(period);
      runInAction(() => {
        this.analytics = data;
      });
    } catch {
      // ignore
    } finally {
      runInAction(() => {
        this.analyticsLoading = false;
      });
    }
  }

  async loadOrders() {
    if (this.orders.length > 0 || this.ordersLoading) return;
    this.ordersLoading = true;
    try {
      const data = await leroyApi.sellerOrders();
      runInAction(() => {
        this.orders = data.map((order) => ({
          ...order,
          items: order.items?.map((item) => ({
            ...item,
            imageUrl: imageUrlWithCacheBust(item.imageUrl),
          })),
        }));
      });
    } catch {
      // ignore
    } finally {
      runInAction(() => {
        this.ordersLoading = false;
      });
    }
  }

  addProduct(product: ProductDto) {
    this.products.unshift(product);
    if (this.dashboard) {
      this.dashboard.totalProducts = (this.dashboard.totalProducts ?? 0) + 1;
    }
  }

  updateProduct(product: ProductDto) {
    const index = this.products.findIndex((p) => p.id === product.id);
    if (index >= 0) {
      this.products[index] = product;
    } else {
      this.addProduct(product);
    }
  }

  removeProduct(id: string) {
    this.products = this.products.filter((p) => p.id !== id);
    if (this.dashboard) {
      this.dashboard.totalProducts = Math.max(
        0,
        (this.dashboard.totalProducts ?? 0) - 1,
      );
    }
  }

  updateOrder(order: RawSellerOrder) {
    const normalized = {
      ...order,
      items: order.items?.map((item) => ({
        ...item,
        imageUrl: imageUrlWithCacheBust(item.imageUrl),
      })),
    };
    const index = this.orders.findIndex((o) => o.id === normalized.id);
    if (index >= 0) {
      this.orders[index] = normalized;
    } else {
      this.orders.unshift(normalized);
    }
  }
}

export const sellerStore = new SellerStore();
