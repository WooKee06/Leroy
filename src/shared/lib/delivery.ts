import type {
  DeliveryKindDto,
  DeliveryQuoteOptionDto,
  Order,
} from "@shared/api/models";

/**
 * Flat estimate used ONLY when the CDEK quote endpoint is unavailable
 * (network error, CDEK outage, integration not configured yet).
 *
 * This is the single place in the client where the old "350 ₽ / free over
 * 5000 ₽" rule lives. The server keeps the same rule as its own fallback;
 * the happy path is always a quote from /api/delivery/quote.
 */
export const FALLBACK_DELIVERY_BASE = 350;
export const FALLBACK_DELIVERY_FREE_FROM = 5000;

export function fallbackDeliveryPrice(subtotal: number): number {
  return subtotal >= FALLBACK_DELIVERY_FREE_FROM ? 0 : FALLBACK_DELIVERY_BASE;
}

export const DELIVERY_KIND_LABELS: Record<DeliveryKindDto, string> = {
  pickup_point: "Пункт выдачи",
  postamat: "Постамат",
  courier: "Курьер",
};

export function isPickupKind(kind: DeliveryKindDto): boolean {
  return kind === "pickup_point" || kind === "postamat";
}

export function deliveryKindLabel(kind?: string): string {
  if (kind === "pickup_point") return "Пункт выдачи";
  if (kind === "postamat") return "Постамат";
  if (kind === "courier") return "Курьер";
  return "Доставка";
}

export function formatDeliveryAmount(price: number, currency = "RUB"): string {
  const value = Math.max(0, Number(price) || 0).toLocaleString("ru-RU");
  return currency === "RUB" ? `${value} ₽` : `${value} ${currency}`;
}

/** "2–5 дней" from either the explicit eta or min/max days. */
export function formatDeliveryEta(
  option: Pick<DeliveryQuoteOptionDto, "eta" | "minDays" | "maxDays">,
): string {
  if (option.eta) return option.eta;
  const { minDays, maxDays } = option;
  if (minDays && maxDays && minDays !== maxDays) {
    return `${minDays}–${maxDays} дн.`;
  }
  if (minDays && maxDays) return `${minDays} дн.`;
  if (maxDays) return `до ${maxDays} дн.`;
  return "";
}

/**
 * How the delivery is shown in an order. `deliveryMethod` already carries the
 * human-readable name (e.g. "СДЭК — пункт выдачи"), so it wins; the provider
 * is only a fallback for legacy orders without a method.
 */
export function orderDeliveryLabel(order: Order): string | null {
  const method = order.deliveryMethod?.trim();
  if (method) return method;
  if (order.deliveryProvider) {
    return order.deliveryProvider === "cdek"
      ? "СДЭК"
      : order.deliveryProvider;
  }
  return null;
}
