import { makeAutoObservable, runInAction } from 'mobx';
import type { Order } from '@shared/api/models';
import { leroyApi } from '@shared/api/leroyApi';
import { getAuthToken } from '@shared/api/client';

class OrdersStore {
  orders: Order[] = [];
  loaded = false;
  loading = false;

  constructor() {
    makeAutoObservable(this);
  }

  private get available(): boolean {
    return !!getAuthToken();
  }

  async ensureLoaded(force = false) {
    if (!this.available) return;
    if (this.loaded && !force) return;
    if (this.loading) {
      await this.loadingPromise;
      return;
    }

    this.loading = true;
    const promise = leroyApi
      .myOrders()
      .then((items) => {
        runInAction(() => {
          this.orders = items;
          this.loaded = true;
        });
      })
      .catch(() => {
        // keep existing orders if we already have them
      })
      .finally(() => {
        runInAction(() => {
          this.loading = false;
          this.loadingPromise = null;
        });
      });

    this.loadingPromise = promise;
    await promise;
  }

  private loadingPromise: Promise<void> | null = null;

  async refresh() {
    await this.ensureLoaded(true);
  }

  updateOrder(order: Order) {
    const index = this.orders.findIndex((o) => o.id === order.id);
    if (index >= 0) {
      this.orders[index] = order;
    } else {
      this.orders.unshift(order);
    }
  }

  get awaitingCount(): number {
    return this.orders.filter((o) =>
      ['pending', 'paid', 'accepted'].includes(o.status),
    ).length;
  }

  get shippingCount(): number {
    return this.orders.filter((o) =>
      ['preparing', 'ready_for_delivery', 'shipped'].includes(o.status),
    ).length;
  }

  get receivedCount(): number {
    return this.orders.filter((o) =>
      ['delivered', 'completed'].includes(o.status),
    ).length;
  }
}

export const ordersStore = new OrdersStore();
