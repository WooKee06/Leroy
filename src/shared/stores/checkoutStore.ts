import { makeAutoObservable } from "mobx";
import { leroyApi } from "@shared/api/leroyApi";
import { cartStore } from "@shared/stores/cartStore";
import { accountStore } from "@shared/stores/accountStore";
import { deliveryStore } from "@shared/stores/deliveryStore";
import { ordersStore } from "@shared/stores/ordersStore";
import type { Order, PaymentView } from "@shared/api/models";
import { DELIVERY_KIND_LABELS } from "@shared/lib/delivery";
import { trackCheckoutStarted, trackPurchase } from "@shared/lib/analytics";
import { addressStore } from "./addressStore";
import { formatAddress } from "@shared/lib/address";

/** Secure-context UUID with a fallback for older WebViews. */
function createIdempotencyKey(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export type Step = "closed" | "form" | "processing" | "pending" | "success";

class CheckoutStore {
  open = false;
  step: Step = "closed";
  selectedAddressId: string | null = null;
  paymentMethod = "balance";
  order: Order | null = null;
  payment: PaymentView | null = null;
  error = "";
  /**
   * One key per checkout attempt: retries of `POST /orders` (double tap,
   * network timeout, re-render) reuse it, so the server returns the same
   * order instead of creating a second one.
   */
  idempotencyKey = "";

  constructor() {
    makeAutoObservable(this);
  }

  get selectedAddress() {
    return (
      addressStore.addresses.find((a) => a.id === this.selectedAddressId) ??
      addressStore.defaultAddress
    );
  }

  get addressText(): string {
    return this.selectedAddress
      ? formatAddress(this.selectedAddress)
      : addressStore.defaultAddressText;
  }

  selectAddress(id: string) {
    this.selectedAddressId = id;
  }

  show() {
    this.reset();
    this.open = true;
    this.step = "form";
    this.error = "";
    this.idempotencyKey = createIdempotencyKey();
    void cartStore.load();
    void accountStore.loadWallet();
    void this.prepareDelivery();
    trackCheckoutStarted();
  }

  /**
   * Prefills the address/city from the saved address and asks the server for
   * a quote. Runs in the background: the form stays usable even while the
   * quote is loading (and falls back to an estimate if it fails).
   */
  private async prepareDelivery(): Promise<void> {
    await Promise.allSettled([addressStore.load(), cartStore.load()]);
    if (!this.open) return;

    const city =
      deliveryStore.city || this.selectedAddress?.city || addressStore.defaultAddress?.city || "";
    if (city) deliveryStore.setCity(city);
    await deliveryStore.loadQuote();
  }

  close() {
    // Не сбрасываем шаг и заказ сразу: иначе во время анимации закрытия
    // шторка успевает перерисоваться в пустую форму. Сброс — в show().
    this.open = false;
    this.error = "";
  }

  private reset() {
    this.step = "closed";
    this.order = null;
    this.payment = null;
    this.error = "";
    this.paymentMethod = "balance";
    this.selectedAddressId = null;
    this.idempotencyKey = "";
    deliveryStore.reset();
  }

  /** Goods + delivery, or the server total once the order exists. */
  get total(): number {
    if (this.order) return this.order.total;
    return cartStore.subtotal + deliveryStore.price;
  }

  get deliveryPrice(): number {
    if (this.order) return this.order.deliveryPrice ?? 0;
    return deliveryStore.price;
  }

  async submit() {
    const point = deliveryStore.selectedPoint;
    const needsPoint = deliveryStore.needsPoint;

    if (needsPoint && !point) {
      this.error = "Выберите пункт выдачи или постамат";
      this.step = "form";
      return;
    }

    let address = needsPoint && point
      ? deliveryStore.pointAddress
      : this.addressText;
    if (!address) {
      this.error = "Выберите адрес доставки в профиле";
      return;
    }

    this.step = "processing";
    this.error = "";
    try {
      // Quote is refreshed for the current cart/city; if CDEK is unavailable
      // the store keeps the flat estimate and marks it as fallback.
      if (!this.order) {
        await deliveryStore.loadQuote();
      }

      const option = deliveryStore.selectedOption;
      if (!option) {
        throw new Error("Не удалось рассчитать стоимость доставки");
      }

      const deliveryPrice = Number(option.price) || 0;
      const expectedTotal = cartStore.subtotal + deliveryPrice;

      // Balance is checked before creating the order: otherwise an
      // insufficient-funds error would leave a pending order and an emptied
      // cart with nothing to retry.
      if (this.paymentMethod === "balance" && !this.order) {
        await accountStore.loadWallet();
        if (accountStore.balance < expectedTotal) {
          this.error = `Недостаточно средств на балансе. Не хватает ${(
            expectedTotal - accountStore.balance
          ).toLocaleString("ru-RU")} ₽.`;
          this.step = "form";
          return;
        }
      }

      // A pending order created by a previous attempt is reused: retrying the
      // payment must not create a second order.
      let order = this.order;
      if (!order) {
        order = await leroyApi.createOrder(
          {
            deliveryAddress: address,
            deliveryMethod:
              option.title ??
              `СДЭК — ${DELIVERY_KIND_LABELS[option.kind]}`,
            paymentMethod: this.paymentMethod,
            deliveryProvider: option.provider || "cdek",
            deliveryTariff: String(option.tariffCode ?? option.id),
            deliveryPrice,
            deliveryCityCode: deliveryStore.cityCode ?? undefined,
            deliveryQuoteId: option.quoteId,
            pickupCode: needsPoint ? point?.code : undefined,
            pickupAddress: needsPoint ? deliveryStore.pointAddress : undefined,
          },
          this.idempotencyKey,
        );
        this.order = order;
        await cartStore.clear();
      }

      // The selected method drives the real provider call. Never pay from the
      // wallet after creating an order labelled as a different method.
      const provider = this.paymentMethod === "yookassa" ? "yookassa" : "balance";
      const payment = await leroyApi.pay(order, provider);
      this.payment = payment;

      if (payment.status === "completed") {
        this.finishPaidOrder(order);
        return;
      }

      if (provider === "yookassa") {
        // External payment is still pending: show a real confirmation link and
        // wait for the webhook. Success copy must not appear before that.
        this.step = "pending";
        void ordersStore.refresh();
        return;
      }

      throw new Error("Платёж не подтверждён. Попробуйте ещё раз.");
    } catch (e) {
      this.step = "form";
      this.error = e instanceof Error ? e.message : "Не удалось оформить заказ";
      // A price/quote mismatch means the cart changed under us — refresh the
      // quote so the next tap uses current prices.
      void deliveryStore.loadQuote(true);
    }
  }

  /** Real status refresh for the pending YooKassa screen. */
  async checkPayment(): Promise<void> {
    if (!this.payment || !this.order) return;
    this.error = "";
    try {
      const payment = await leroyApi.paymentStatus(this.payment.id);
      this.payment = payment;
      if (payment.status === "completed") {
        this.finishPaidOrder(this.order);
        return;
      }
      if (
        payment.status === "failed" ||
        payment.status === "cancelled" ||
        payment.status === "expired" ||
        payment.status === "refunded"
      ) {
        this.error = "Платёж не прошёл. Оформите заказ заново.";
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : "Не удалось проверить платёж";
    }
    void ordersStore.refresh();
  }

  private finishPaidOrder(order: Order): void {
    if (this.payment?.provider === "balance") {
      void accountStore.loadWallet(true);
    }
    this.step = "success";
    trackPurchase(order.id, order.total);
    void ordersStore.refresh();
  }
}

export const checkoutStore = new CheckoutStore();
