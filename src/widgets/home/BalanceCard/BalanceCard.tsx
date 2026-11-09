import { useNavigate } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { observer } from "mobx-react-lite";
import { accountStore } from "@shared/stores/accountStore";
import styles from "./BalanceCard.module.scss";

const BalanceCard = observer(function BalanceCard() {
  const navigate = useNavigate();

  return (
    <div className={styles.balanceCard}>
      <div className={styles.balanceLeft}>
        <span className={styles.balanceIcon}>
          <span className={styles.balanceIconChar}>₽</span>
        </span>
        <span className={styles.balanceInfo}>
          <span className={styles.balanceValue}>
            {accountStore.balance.toLocaleString("ru-RU")} ₽
          </span>
          <span className={styles.balanceHint}>Доступно для покупок</span>
        </span>
      </div>
      <button
        className={styles.topUpBtn}
        onClick={() => navigate("/balance")}
        aria-label="Пополнить баланс"
      >
        Пополнить
        <FiArrowRight size={14} />
      </button>
    </div>
  );
});

export default BalanceCard;
