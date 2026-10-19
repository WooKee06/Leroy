import { makeAutoObservable } from "mobx";
import { leroyApi } from "@shared/api/leroyApi";
import { cartStore } from "@shared/stores/cartStore";
import type { Order, TonPaymentQuote } from "@shared/api/models";
import { waitForPayment } from "@shared/lib/ton";
import { addressStore } from "./addressStore";

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
  deliveryMethod = "СДЭК";
  paymentMethod = "mock";
  order: Order | null = null;
  error = "";
  tonSession: TonPaymentSession | null = null;
  tonConfirming = false;
  tonWaiting = false;

  constructor() {
    makeAutoObservable(this);
  }

  show() {
    this.open = true;
    this.step = "form";
    this.error = "";
  }

  close() {
    this.open = false;
    this.step = "closed";
    this.order = null;
    this.error = "";
    this.tonSession = null;
    this.tonConfirming = false;
    this.tonWaiting = false;
  }

  async submit() {
    if (!this.address.trim()) {
      await addressStore.load();
    }
    const address = this.address.trim() || addressStore.defaultAddressText;
    if (!address) {
      this.error = "Укажите адрес доставки";
      return;
    }
    this.step = "processing";
    this.error = "";
    try {
      const order = await leroyApi.createOrder({
        deliveryAddress: address,
        deliveryMethod: this.deliveryMethod,
        paymentMethod: this.paymentMethod,
      });
      this.order = order;
      await cartStore.clear();

      if (this.paymentMethod === "ton") {
        const { payment, quote } = await leroyApi.tonPaymentInit(order.id);
        this.tonSession = { paymentId: payment.id, quote };
        this.step = "ton-confirm";
        return;
      }

      const provider =
        this.paymentMethod === "stars" ? "telegram_stars" : "mock";
      await leroyApi.pay(order, provider);
      this.step = "success";
    } catch (e) {
      this.step = "form";
      this.error = e instanceof Error ? e.message : "Не удалось оформить заказ";
      this.tonSession = null;
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
