import type {
  WalletTransactionDto,
  WalletTransactionType,
} from "@shared/api/models";

const TYPE_LABELS: Record<WalletTransactionType, string> = {
  topup: "Пополнение",
  purchase: "Покупка",
  refund: "Возврат",
  payout: "Выплата",
  commission: "Комиссия",
  bonus: "Бонус",
  adjustment: "Корректировка",
};

export function walletTransactionLabel(type: WalletTransactionType): string {
  return TYPE_LABELS[type] ?? "Операция";
}

/** Positive amounts are money in, negative are money out. */
export function isIncomingTransaction(tx: WalletTransactionDto): boolean {
  return tx.amount > 0;
}

export function formatWalletAmount(
  amount: number,
  currency = "RUB",
): string {
  const value = Math.abs(Number(amount)).toLocaleString("ru-RU");
  return currency === "RUB" ? `${value} ₽` : `${value} ${currency}`;
}

export function formatSignedWalletAmount(
  amount: number,
  currency = "RUB",
): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return `${sign}${formatWalletAmount(amount, currency)}`;
}

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatWalletDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return dateFormatter.format(date);
}
