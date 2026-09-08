import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { FiStar, FiArrowRight } from "react-icons/fi";
import { accountStore } from "@shared/stores/accountStore";
import styles from "./BalanceCard.module.scss";

function BalanceCard() {
  const navigate = useNavigate();

  return (
    <div className={styles.balanceCard}>
      <div className={styles.balanceLeft}>
        <span className={styles.balanceStar}>
          <FiStar size={22} fill="currentColor" />
        </span>
        <span className={styles.balanceInfo}>
          <span className={styles.balanceValue}>
            {accountStore.stars.toLocaleString("ru-RU")}
          </span>
          <span className={styles.balanceUnit}>Telegram Stars</span>
        </span>
      </div>
      <button
        className={styles.topUpBtn}
        onClick={() => navigate("/profile")}
        aria-label="Пополнить баланс"
      >
        Пополнить
        <FiArrowRight size={14} />
      </button>
    </div>
  );
}

export default observer(BalanceCard);