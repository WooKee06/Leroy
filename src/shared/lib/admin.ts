import type {
  AdminAuditLogDto,
  ComplaintReason,
  ComplaintStatus,
  ProductModerationStatus,
  StoreModerationStatus,
} from "@shared/api/models";

export type AdminTone = "neutral" | "good" | "warn" | "bad" | "info";

export const PRODUCT_STATUSES: {
  id: ProductModerationStatus;
  label: string;
  tone: AdminTone;
}[] = [
  { id: "pending_review", label: "Ожидает проверки", tone: "warn" },
  { id: "under_review", label: "На проверке", tone: "info" },
  { id: "approved", label: "Одобрен", tone: "good" },
  { id: "draft", label: "Черновик", tone: "neutral" },
  { id: "rejected", label: "Отклонён", tone: "bad" },
  { id: "blocked", label: "Заблокирован", tone: "bad" },
  { id: "archived", label: "В архиве", tone: "neutral" },
];

export const STORE_STATUSES: {
  id: StoreModerationStatus;
  label: string;
  tone: AdminTone;
}[] = [
  { id: "pending", label: "Ожидает проверки", tone: "warn" },
  { id: "under_review", label: "На проверке", tone: "info" },
  { id: "verified", label: "Проверен", tone: "good" },
  { id: "rejected", label: "Отклонён", tone: "bad" },
  { id: "blocked", label: "Заблокирован", tone: "bad" },
];

export type ProductModerationAction =
  | "approve"
  | "reject"
  | "block"
  | "request_docs"
  | "return_to_draft"
  | "archive";

export type StoreModerationAction =
  | "verify"
  | "reject"
  | "request_docs"
  | "block"
  | "unblock"
  | "unverify";

/** UI mirror of the server transition tables; backend remains authoritative. */
const PRODUCT_ACTIONS_BY_STATUS: Record<
  ProductModerationStatus,
  ProductModerationAction[]
> = {
  pending_review: ["approve", "reject", "block", "return_to_draft", "archive"],
  under_review: ["approve", "reject", "block", "return_to_draft", "archive"],
  approved: ["reject", "block", "request_docs", "return_to_draft", "archive"],
  draft: ["block", "archive"],
  rejected: ["block", "request_docs", "return_to_draft", "archive"],
  blocked: ["return_to_draft", "archive"],
  archived: ["return_to_draft"],
};

const STORE_ACTIONS_BY_STATUS: Record<
  StoreModerationStatus,
  StoreModerationAction[]
> = {
  pending: ["verify", "reject", "block", "request_docs"],
  under_review: ["verify", "reject", "block"],
  verified: ["reject", "block", "request_docs", "unverify"],
  rejected: ["verify", "block", "request_docs"],
  blocked: ["unblock"],
};

export function canModerateProduct(
  status: ProductModerationStatus | undefined | null,
  action: ProductModerationAction,
): boolean {
  return status ? (PRODUCT_ACTIONS_BY_STATUS[status] ?? []).includes(action) : false;
}

export function canModerateStore(
  status: StoreModerationStatus | undefined | null,
  action: StoreModerationAction,
): boolean {
  return status ? (STORE_ACTIONS_BY_STATUS[status] ?? []).includes(action) : false;
}

export const COMPLAINT_STATUSES: {
  id: ComplaintStatus;
  label: string;
  tone: AdminTone;
}[] = [
  { id: "new", label: "Новая", tone: "warn" },
  { id: "under_review", label: "На проверке", tone: "info" },
  { id: "resolved", label: "Решена", tone: "good" },
  { id: "rejected", label: "Отклонена", tone: "neutral" },
];

export const COMPLAINT_REASONS: Record<ComplaintReason, string> = {
  prohibited: "Запрещённый товар",
  fake: "Подделка",
  scam: "Мошенничество",
  mismatch: "Несоответствие описанию",
  missing_docs: "Нет документов",
  copyright: "Нарушение авторских прав",
  other: "Другое",
};

export const ORDER_STATUSES: Record<string, { label: string; tone: AdminTone }> = {
  pending: { label: "Ожидает", tone: "warn" },
  paid: { label: "Оплачен", tone: "info" },
  accepted: { label: "Принят", tone: "info" },
  preparing: { label: "Собирается", tone: "info" },
  ready_for_delivery: { label: "Готов к отправке", tone: "info" },
  shipped: { label: "В пути", tone: "info" },
  delivered: { label: "Доставлен", tone: "good" },
  completed: { label: "Завершён", tone: "good" },
  cancelled: { label: "Отменён", tone: "bad" },
};

const ADMIN_ORDER_NEXT: Record<string, string> = {
  paid: "accepted",
  accepted: "preparing",
  preparing: "ready_for_delivery",
  ready_for_delivery: "shipped",
  shipped: "delivered",
  delivered: "completed",
};

const CANCELLABLE_ORDER_STATUSES = new Set([
  "pending",
  "paid",
  "accepted",
  "preparing",
  "ready_for_delivery",
]);

/** UI-подсказка; сервер всё равно проверяет переходы авторитетно. */
export function canAdminChangeOrderStatus(from: string, to: string): boolean {
  if (to === "paid") return false;
  if (to === "cancelled") return CANCELLABLE_ORDER_STATUSES.has(from);
  return ADMIN_ORDER_NEXT[from] === to;
}

export function statusMeta(
  list:
    | { id: string; label: string; tone: AdminTone }[]
    | Record<string, { label: string; tone: AdminTone }>,
  value?: string | null,
): { label: string; tone: AdminTone } {
  const found = Array.isArray(list)
    ? list.find((item) => item.id === value)
    : value
      ? list[value]
      : undefined;
  return found ?? { label: value ?? "—", tone: "neutral" };
}

export function formatMoney(value: number | string | null | undefined): string {
  return `${Number(value || 0).toLocaleString("ru-RU")} ₽`;
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function personName(user?: {
  firstName?: string;
  lastName?: string;
  username?: string;
  id?: string;
}): string {
  if (!user) return "—";
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username ||
    user.id ||
    "—"
  );
}

const ACTION_LABELS: Record<string, string> = {
  "product.approve": "Товар одобрен",
  "product.reject": "Товар отклонён",
  "product.block": "Товар заблокирован",
  "product.request_docs": "Запрошены документы",
  "product.return_to_draft": "Товар отправлен на доработку",
  "product.archive": "Товар архивирован",
  "product.resubmit": "Товар отправлен на проверку продавцом",
  "store.verify": "Магазин подтверждён",
  "store.reject": "Магазин отклонён",
  "store.block": "Магазин заблокирован",
  "store.unblock": "Магазин разблокирован",
  "store.request_docs": "Запрошены документы магазина",
  "store.unverify": "Подтверждение снято",
  "store.resubmit": "Магазин отправлен на проверку продавцом",
  "complaint.new": "Жалоба создана",
  "complaint.under_review": "Жалоба взята в работу",
  "complaint.resolved": "Жалоба решена",
  "complaint.rejected": "Жалоба отклонена",
  "user.status_changed": "Статус пользователя изменён",
  "user.role_changed": "Роль пользователя изменена",
  "order.status_changed": "Статус заказа изменён",
  "category.create": "Категория создана",
  "category.update": "Категория обновлена",
  "category.delete": "Категория удалена",
};

export function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export function auditObjectLabel(log: AdminAuditLogDto): string {
  const map: Record<string, string> = {
    product: "товар",
    store: "магазин",
    complaint: "жалоба",
    order: "заказ",
    user: "пользователь",
    category: "категория",
  };
  const suffix = log.entityId ? ` · ${log.entityId.slice(0, 8)}` : "";
  return `${map[log.entityType] ?? log.entityType}${suffix}`;
}

export function stateValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
