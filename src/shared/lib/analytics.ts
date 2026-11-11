import { leroyApi } from "@shared/api/leroyApi";
import type { AnalyticsEventInput } from "@shared/api/models";

/**
 * Fire-and-forget analytics events. The server resolves storeId from
 * productId, so the client only needs the product/order context.
 */
export function trackAnalytics(events: AnalyticsEventInput[]): void {
  if (events.length === 0) return;
  if (typeof leroyApi.trackAnalytics !== "function") return;
  void leroyApi.trackAnalytics(events).catch(() => {
    // Analytics must never break the user flow.
  });
}

export function trackProductView(productId: string): void {
  trackAnalytics([{ type: "product_view", productId }]);
}

export function trackAddToCart(productId: string, quantity = 1): void {
  trackAnalytics([
    { type: "add_to_cart", productId, metadata: { quantity } },
  ]);
}

export function trackCheckoutStarted(): void {
  trackAnalytics([{ type: "checkout_started" }]);
}

export function trackPurchase(orderId: string, amount: number): void {
  trackAnalytics([{ type: "purchase", orderId, amount }]);
}
