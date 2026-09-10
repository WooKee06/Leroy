import { makeAutoObservable } from 'mobx';
import { leroyApi } from '@shared/api/leroyApi';
import { cartStore } from '@shared/stores/cartStore';
import type { Order } from '@shared/api/models';

type Step = 'closed' | 'form' | 'processing' | 'success';

class CheckoutStore {
  open = false;
  step: Step = 'closed';
  address = '';
  deliveryMethod = 'СДЭК';
  paymentMethod = 'mock';
  order: Order | null = null;
  error = '';

  constructor() {
    makeAutoObservable(this);
  }

  show() {
    this.open = true;
    this.step = 'form';
    this.error = '';
  }

  close() {
    this.open = false;
    this.step = 'closed';
    this.order = null;
    this.error = '';
  }

  async submit() {
    const address = this.address.trim();
    if (!address) {
      this.error = 'Укажите адрес доставки';
      return;
    }
    this.step = 'processing';
    this.error = '';
    try {
      const order = await leroyApi.createOrder({
        deliveryAddress: address,
        deliveryMethod: this.deliveryMethod,
        paymentMethod: this.paymentMethod,
      });
      await leroyApi.pay(order);
      this.order = order;
      this.step = 'success';
      await cartStore.clear();
    } catch (e) {
      this.step = 'form';
      this.error = e instanceof Error ? e.message : 'Не удалось оформить заказ';
    }
  }
}

export const checkoutStore = new CheckoutStore();