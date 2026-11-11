import { makeAutoObservable } from "mobx";
import type {
  DeliveryKindDto,
  DeliveryQuoteDto,
  DeliveryQuoteOptionDto,
} from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import {
  DELIVERY_KIND_LABELS,
  fallbackDeliveryPrice,
  isPickupKind,
} from "@shared/lib/delivery";
import { cartStore } from "./cartStore";

export interface SelectedPickupPoint {
  code: string;
  name: string;
  address?: string;
  city?: string;
  cityCode?: number;
  type?: "PVZ" | "POSTAMAT";
}

const FALLBACK_KINDS: Array<{
  kind: DeliveryKindDto;
  tariffCode: number;
  title: string;
}> = [
  { kind: "pickup_point", tariffCode: 136, title: "СДЭК — пункт выдачи" },
  { kind: "postamat", tariffCode: 138, title: "СДЭК — постамат" },
  { kind: "courier", tariffCode: 137, title: "СДЭК — курьер" },
];

/**
 * Delivery quote + selection state for the checkout.
 *
 * The happy path is `POST /api/delivery/quote`: the server knows the CDEK
 * tariffs, the product dimensions and the cart total. When that endpoint is
 * unavailable (not deployed yet, CDEK outage, offline) the store builds the
 * three SDEK options from the flat fallback price and marks them as
 * `fallback: true`, so the UI can honestly say "предварительная стоимость".
 */
class DeliveryStore {
  city = "";
  cityCode: number | null = null;

  quote: DeliveryQuoteDto | null = null;
  loading = false;
  error = "";

  selectedKind: DeliveryKindDto = "pickup_point";
  selectedPoint: SelectedPickupPoint | null = null;

  private requestKey = "";
  private inFlight: Promise<void> | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  /** Server options, or the three fallback options while unavailable. */
  get options(): DeliveryQuoteOptionDto[] {
    const serverOptions = this.quote?.options ?? [];
    if (serverOptions.length > 0) return serverOptions;

    const price = fallbackDeliveryPrice(cartStore.subtotal);
    return FALLBACK_KINDS.map((item) => ({
      id: `fallback-${item.kind}`,
      provider: "cdek",
      kind: item.kind,
      tariffCode: item.tariffCode,
      title: item.title,
      price,
      currency: "RUB",
      eta: "2–5 дней",
      fallback: true,
    }));
  }

  get selectedOption(): DeliveryQuoteOptionDto | undefined {
    return (
      this.options.find((option) => option.kind === this.selectedKind) ??
      this.options[0]
    );
  }

  get price(): number {
    return this.selectedOption?.price ?? fallbackDeliveryPrice(cartStore.subtotal);
  }

  /** True while the displayed prices are a flat estimate, not a live quote. */
  get isFallback(): boolean {
    return this.quote?.fallback === true || !this.quote;
  }

  get needsPoint(): boolean {
    return isPickupKind(this.selectedKind);
  }

  get selectedTitle(): string {
    return (
      this.selectedOption?.title ??
      DELIVERY_KIND_LABELS[this.selectedKind]
    );
  }

  get pointAddress(): string {
    const point = this.selectedPoint;
    if (!point) return "";
    return [point.city, point.address].filter(Boolean).join(", ");
  }

  reset(): void {
    this.city = "";
    this.cityCode = null;
    this.quote = null;
    this.loading = false;
    this.error = "";
    this.selectedKind = "pickup_point";
    this.selectedPoint = null;
    this.requestKey = "";
    this.inFlight = null;
  }

  setCity(city: string, cityCode?: number | null): void {
    const nextCity = city.trim();
    const nextCode = cityCode ?? this.cityCode;
    if (nextCity === this.city && nextCode === this.cityCode) return;

    this.city = nextCity;
    this.cityCode = nextCode ?? null;
    void this.loadQuote(true);
  }

  selectKind(kind: DeliveryKindDto): void {
    this.selectedKind = kind;
  }

  selectPoint(point: SelectedPickupPoint | null): void {
    this.selectedPoint = point;
    if (!point) return;

    this.selectedKind = point.type === "POSTAMAT" ? "postamat" : "pickup_point";
    if (point.city) this.setCity(point.city, point.cityCode);
  }

  /**
   * Fetches the server quote for the current cart + city.
   * Concurrent calls share one request; an unchanged cart/city is not
   * re-quoted unless `force` is set.
   */
  async loadQuote(force = false): Promise<void> {
    if (this.inFlight) await this.inFlight;

    const items = cartStore.items.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
    }));

    if (items.length === 0) {
      this.quote = null;
      this.requestKey = "";
      return;
    }

    const key = JSON.stringify({
      city: this.city,
      cityCode: this.cityCode,
      subtotal: cartStore.subtotal,
      items,
    });
    if (!force && this.quote && key === this.requestKey) return;
    this.requestKey = key;

    const run = this.fetchQuote(items);
    this.inFlight = run;
    try {
      await run;
    } finally {
      if (this.inFlight === run) this.inFlight = null;
    }
  }

  private async fetchQuote(
    items: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    this.loading = true;
    this.error = "";
    try {
      const quote = await leroyApi.deliveryQuote({
        city: this.city || undefined,
        cityCode: this.cityCode ?? undefined,
        subtotal: cartStore.subtotal,
        items,
      });
      this.quote = quote;

      if (
        quote.options?.length &&
        !quote.options.some((option) => option.kind === this.selectedKind)
      ) {
        this.selectedKind = quote.options[0].kind;
      }
    } catch (e) {
      // Keep an earlier successful quote; otherwise the getters above fall
      // back to the flat estimate and the UI marks it as preliminary.
      if (!this.quote) this.quote = null;
      this.error =
        e instanceof Error
          ? e.message
          : "Не удалось рассчитать доставку";
    } finally {
      this.loading = false;
    }
  }
}

export const deliveryStore = new DeliveryStore();
