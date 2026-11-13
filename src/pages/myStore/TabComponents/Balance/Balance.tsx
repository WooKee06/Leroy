import { sellerStore } from "@/shared/stores/sellerStore";
import styles from "./Balance.module.scss";
import { FiDollarSign } from "react-icons/fi";
import { PayoutRow } from "./PayoutRow";
import Skeleton from "@/shared/ui/Skeleton";
import { useState } from "react";

type Props = {
  formatMoney: (value: number | string) => string;
  formatDate: (value?: string | undefined) => string;
};

const Balance = ({ formatMoney, formatDate }: Props) => {
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutLoading, _] = useState(false);

  const balance = sellerStore.balance;

  const handlePayoutAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    setPayoutAmount(value);
  };

  const loading = sellerStore.balanceLoading && !balance;

  return (
    <div className={styles.balanceTab}>
      <div className={styles.metricCard}>
        <span className={styles.metricValue}>
          {loading ? (
            <Skeleton width={80} height={22} radius={6} />
          ) : (
            formatMoney(balance?.available ?? 0)
          )}
        </span>
        <span className={styles.metricLabel}>Доступно</span>
      </div>
      <div className={styles.metricCard}>
        <span className={styles.metricValue}>
          {loading ? (
            <Skeleton width={80} height={22} radius={6} />
          ) : (
            formatMoney(balance?.pending ?? 0)
          )}
        </span>
        <span className={styles.metricLabel}>В обработке</span>
      </div>

      <div className={styles.payoutForm}>
        <input
          className={styles.input}
          inputMode="numeric"
          placeholder="Сумма выплаты"
          value={payoutAmount}
          onChange={handlePayoutAmountChange}
          disabled={loading || !balance}
        />
        <button
          className={styles.payoutBtn}
          disabled={
            loading ||
            payoutLoading ||
            !payoutAmount ||
            !balance ||
            Number(payoutAmount) > Number(balance.available)
          }
        >
          <FiDollarSign size={16} />
          {payoutLoading ? "Запрос…" : "Запросить выплату"}
        </button>
      </div>

      {loading ? (
        <div className={styles.recentList}>
          <h3 className={styles.sectionTitle}>Выплаты</h3>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={styles.recentRow}>
              <Skeleton width={80} height={16} radius={4} />
              <Skeleton width={60} height={14} radius={4} />
              <Skeleton width={70} height={14} radius={4} />
            </div>
          ))}
        </div>
      ) : balance && balance.recentPayouts.length > 0 ? (
        <div className={styles.recentList}>
          <h3 className={styles.sectionTitle}>Выплаты</h3>
          {balance.recentPayouts.map((p) => (
            <PayoutRow
              key={p.id}
              payout={p}
              formatMoney={formatMoney}
              formatDate={formatDate}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Balance;
