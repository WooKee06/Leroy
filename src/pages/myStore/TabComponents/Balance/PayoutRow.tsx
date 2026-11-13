import styles from "./Balance.module.scss";

export function PayoutRow({
  payout,
  formatMoney,
  formatDate,
}: {
  payout: {
    id: string;
    amount: number | string;
    status: string;
    createdAt: string;
  };
  formatMoney: (value: number | string) => string;
  formatDate: (value?: string | undefined) => string;
}) {
  const statusLabels: Record<string, string> = {
    pending: "В очереди",
    processing: "В обработке",
    completed: "Выплачено",
    failed: "Ошибка",
  };
  return (
    <div className={styles.recentRow}>
      <span className={styles.recentAmount}>{formatMoney(payout.amount)}</span>
      <span
        className={styles.recentStatus}
        style={{
          color:
            payout.status === "completed"
              ? "#34c759"
              : payout.status === "failed"
                ? "#ff3b30"
                : "#f5a623",
        }}
      >
        {statusLabels[payout.status] ?? payout.status}
      </span>
      <span className={styles.recentDate}>{formatDate(payout.createdAt)}</span>
    </div>
  );
}
