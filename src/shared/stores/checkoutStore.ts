import { makeAutoObservable } from "mobx";
import { leroyApi } from "@shared/api/leroyApi";
import { cartStore } from "@shared/stores/cartStore";
import { accountStore } from "@shared/stores/accountStore";
import { deliveryStore } from "@shared/stores/deliveryStore";
import type { Order, TonPaymentQuote } from "@shared/api/models";
import { DELIVERY_KIND_LABELS } from "@shared/lib/delivery";
import { waitForPayment } from "@shared/lib/ton";
import { addressStore } from "./addressStore";

/** Secure-context UUID with a fallback for older WebViews. */
function createIdempotencyKey(): string {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export type Step =
  | "closed"
  | "form"
  | "processing"
  | "ton-confirm"
  | "ton-waiting"
  | "success";

interface TonPaymentSession {
  paymentId: string;
  quote: TonPaymentQuote;
}

class CheckoutStore {
  open = false;
  step: Step = "closed";
  address = "";
  paymentMethod = "balance";
  order: Order | null = null;
  error = "";
  tonSession: TonPaymentSession | null = null;
  tonConfirming = false;
  tonWaiting = false;
  /**
   * One key per checkout attempt: retries of `POST /orders` (double tap,
   * network timeout, re-render) reuse it, so the server returns the same
   * order instead of creating a second one.
   */
  idempotencyKey = "";

  constructor() {
    makeAutoObservable(this);
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
  }

  /**
   * Prefills the address/city from the saved address and asks the server for
   * a quote. Runs in the background: the form stays usable even while the
   * quote is loading (and falls back to an estimate if it fails).
   */
  private async prepareDelivery(): Promise<void> {
    await Promise.allSettled([addressStore.load(), cartStore.load()]);
    if (!this.open) return;

    if (!this.address.trim()) {
      this.address = addressStore.defaultAddressText;
    }

    const city = deliveryStore.city || addressStore.defaultAddress?.city || "";
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
    this.error = "";
    this.paymentMethod = "balance";
    this.tonSession = null;
    this.tonConfirming = false;
    this.tonWaiting = false;
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
    if (!this.address.trim()) {
      await addressStore.load();
    }

    const point = deliveryStore.selectedPoint;
    const needsPoint = deliveryStore.needsPoint;

    if (needsPoint && !point) {
      this.error = "Выберите пункт выдачи или постамат";
      this.step = "form";
      return;
    }

    let address = this.address.trim();
    if (needsPoint && point) {
      address = deliveryStore.pointAddress;
    } else if (!address) {
      address = addressStore.defaultAddressText;
    }
    if (!address) {
      this.error = "Укажите адрес доставки";
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
            pickupCode: needsPoint ? point?.code : undefined,
            pickupAddress: needsPoint ? deliveryStore.pointAddress : undefined,
          },
          this.idempotencyKey,
        );
        this.order = order;
        await cartStore.clear();
      }

      if (this.paymentMethod === "ton") {
        const { payment, quote } = await leroyApi.tonPaymentInit(order.id);
        this.tonSession = { paymentId: payment.id, quote };
        this.step = "ton-confirm";
        return;
      }

      await leroyApi.pay(order, "balance");
      await accountStore.loadWallet(true);
      this.step = "success";
    } catch (e) {
      this.step = "form";
      this.error = e instanceof Error ? e.message : "Не удалось оформить заказ";
      this.tonSession = null;
      // A price/quote mismatch means the cart changed under us — refresh the
      // quote so the next tap uses current prices.
      void deliveryStore.loadQuote(true);
    }
  }

  beginTonWaiting() {
    this.tonConfirming = false;
    this.tonWaiting = true;
    this.step = "ton-waiting";
    this.error = "";
  }

  async waitForTonResult(): Promise<void> {
    const session = this.tonSession;
    if (!session || !this.order) return;
    const result = await waitForPayment(
      () => leroyApi.paymentStatus(session.paymentId),
      { expiresAt: session.quote.expiresAt },
    );
    this.tonWaiting = false;
    if (result === "completed") {
      this.step = "success";
    } else if (result === "expired") {
      this.error = "Платёж просрочен. Создайте новый с актуальным курсом.";
      this.step = "ton-confirm";
    } else if (result === "cancelled") {
      this.error = "Платёж отменён.";
      this.step = "ton-confirm";
    } else if (result === "failed") {
      this.error = "Платёж не прошёл. Попробуйте ещё раз.";
      this.step = "ton-confirm";
    } else {
      this.error = "Платёж ещё не подтверждён в блокчейне.";
      this.step = "ton-confirm";
    }
  }

  async cancelTonPayment(): Promise<void> {
    const session = this.tonSession;
    this.tonConfirming = false;
    this.tonWaiting = false;
    if (session) {
      await leroyApi.paymentCancel(session.paymentId).catch(() => undefined);
    }
    this.error = "Оплата отменена — заказ можно оформить другим способом";
    this.step = "form";
  }
}

export const checkoutStore = new CheckoutStore();
