import { describe, it, expect } from "vitest";
import {
  fallbackDeliveryPrice,
  formatDeliveryAmount,
  formatDeliveryEta,
  orderDeliveryLabel,
} from "./delivery";
import { mapOrder, type RawOrder } from "@shared/api/models";

describe("fallbackDeliveryPrice", () => {
  it("charges the flat base below the free threshold", () => {
    expect(fallbackDeliveryPrice(0)).toBe(350);
    expect(fallbackDeliveryPrice(4999)).toBe(350);
  });

  it("is free from the threshold", () => {
    expect(fallbackDeliveryPrice(5000)).toBe(0);
    expect(fallbackDeliveryPrice(12000)).toBe(0);
  });
});

describe("formatDeliveryEta", () => {
  it("prefers an explicit eta", () => {
    expect(formatDeliveryEta({ eta: "2–4 дня" })).toBe("2–4 дня");
  });

  it("builds a range from min/max days", () => {
    expect(formatDeliveryEta({ minDays: 2, maxDays: 5 })).toBe("2–5 дн.");
  });

  it("handles equal days and max-only", () => {
    expect(formatDeliveryEta({ minDays: 3, maxDays: 3 })).toBe("3 дн.");
    expect(formatDeliveryEta({ maxDays: 7 })).toBe("до 7 дн.");
  });

  it("returns an empty string when nothing is known", () => {
    expect(formatDeliveryEta({})).toBe("");
  });
});

describe("formatDeliveryAmount", () => {
  it("formats rubles", () => {
    expect(formatDeliveryAmount(350)).toBe("350 ₽");
    expect(formatDeliveryAmount(0)).toBe("0 ₽");
  });
});

describe("mapOrder delivery fields", () => {
  const raw: RawOrder = {
    id: "o1",
    orderNumber: 42,
    status: "shipped",
    total: "5250.00",
    deliveryAddress: "Москва, Ленина 10",
    deliveryMethod: "СДЭК — пункт выдачи",
    deliveryPrice: "350.00",
    deliveryProvider: "cdek",
    deliveryTariff: "136",
    pickupCode: "MSK123",
    pickupAddress: "Москва, Тверская 1",
    trackingNumber: "CDEK123456",
    deliveryStatus: "В пути",
    paidAt: "2026-01-01T10:00:00.000Z",
    shippedAt: "2026-01-02T10:00:00.000Z",
    deliveredAt: null as unknown as string,
    cancelReason: undefined,
    createdAt: "2026-01-01T09:00:00.000Z",
    sellerOrders: [],
  };

  it("maps delivery, pickup and tracking fields", () => {
    const order = mapOrder(raw);
    expect(order.deliveryPrice).toBe(350);
    expect(order.deliveryProvider).toBe("cdek");
    expect(order.deliveryTariff).toBe("136");
    expect(order.pickupCode).toBe("MSK123");
    expect(order.pickupAddress).toBe("Москва, Тверская 1");
    expect(order.trackingNumber).toBe("CDEK123456");
    expect(order.deliveryStatus).toBe("В пути");
    expect(order.paidAt).toBe("2026-01-01T10:00:00.000Z");
  });

  it("prefers the stored delivery method for display", () => {
    expect(orderDeliveryLabel(mapOrder(raw))).toBe("СДЭК — пункт выдачи");
  });
});
