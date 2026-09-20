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
  ready_for_delivery: { label: "Готов к отправке", group: "shipping", tint: "#007aff" },
  shipped: { label: "В пути", group: "shipping", tint: "#007aff" },
  delivered: { label: "Доставлен", group: "received", tint: "#34c759" },
  completed: { label: "Выполнен", group: "received", tint: "#34c759" },
  canceled: { label: "Отменён", group: "received", tint: "#8e8e93" },
};

const DEFAULT: StatusInfo = {
  label: "В обработке",
  group: "awaiting",
  tint: "#8e8e93",
};

export function statusInfo(status: string): StatusInfo {
  return STATUS_MAP[status] ?? DEFAULT;
}