export type OrdersGroup = "all" | "awaiting" | "shipping" | "received";

interface StatusInfo {
  label: string;
  group: OrdersGroup;
  tint: string;
}

const STATUS_MAP: Record<string, StatusInfo> = {
  pending: { label: "Ожидает оплаты", group: "awaiting", tint: "#f5a623" },
  paid: { label: "Оплачен", group: "awaiting", tint: "#f5a623" },
  accepted: { label: "Принят", group: "awaiting", tint: "#f5a623" },
  preparing: { label: "Готовится", group: "shipping", tint: "#007aff" },
  ready_for_delivery: {
    label: "Готов к отправке",
    group: "shipping",
    tint: "#007aff",
  },
  shipped: { label: "В пути", group: "shipping", tint: "#007aff" },
  delivered: { label: "Получен", group: "received", tint: "#34c759" },
  completed: { label: "Выполнен", group: "received", tint: "#34c759" },
  cancelled: { label: "Отменён", group: "received", tint: "#8e8e93" },
};

const DEFAULT: StatusInfo = {
  label: "В обработке",
  group: "awaiting",
  tint: "#8e8e93",
};

export function statusInfo(status: string): StatusInfo {
  return STATUS_MAP[status] ?? DEFAULT;
}

const EVENT_MAP: Record<string, string> = {
  created: "Заказ создан",
  paid: "Оплачен",
  accepted: "Принят продавцом",
  preparing: "Готовится к отправке",
  ready_for_delivery: "Готов к отправке",
  shipped: "Передан в доставку",
  delivered: "Доставлен",
  completed: "Завершён",
  cancelled: "Отменён",
};

export function orderEventLabel(type: string): string {
  return EVENT_MAP[type] ?? "Событие заказа";
}

/**
 * Buyer may cancel until the parcel is handed to the carrier. Mirrors the
 * server's CANCELLABLE_STATUSES; the server validates again.
 */
const BUYER_CANCELLABLE = [
  "pending",
  "paid",
  "accepted",
  "preparing",
  "ready_for_delivery",
];

export function canBuyerCancelOrder(status: string): boolean {
  return BUYER_CANCELLABLE.includes(status);
}
