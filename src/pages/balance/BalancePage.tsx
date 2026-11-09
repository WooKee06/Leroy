import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import { observer } from "mobx-react-lite";
import { accountStore } from "@shared/stores/accountStore";
import PageContainer from "@shared/ui/PageContainer";
import PageHeader from "@shared/ui/PageHeader";
import styles from "./BalancePage.module.scss";

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

const BalancePage = observer(function BalancePage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [success, setSuccess] = useState(false);

  const parseCustom = Number(custom.trim());
  const selected =
    amount ?? (custom.trim() && !Number.isNaN(parseCustom) ? parseCustom : null);

  const confirm = () => {
    if (!selected) return;
    accountStore.topUp(selected);
    setSuccess(true);
  };

  const reset = () => {
    setAmount(null);
    setCustom("");
    setSuccess(false);
  };

  return (
    <div className="page-wrapper">
      <PageContainer>
        <PageHeader title="Баланс" />

        <div className={styles.balanceCard}>
          <div className={styles.balanceLeft}>
            <span className={styles.balanceIcon}>
              <span className={styles.balanceIconChar}>₽</span>
            </span>
            <span className={styles.balanceInfo}>
              <span className={styles.balanceLabel}>Текущий баланс</span>
              <span className={styles.balanceValue}>
                {accountStore.balance.toLocaleString("ru-RU")} ₽
              </span>
              <span className={styles.balanceHint}>Доступно для покупок</span>
            </span>
          </div>
        </div>

        {success ? (
          <div className={styles.successBlock}>
            <div className={styles.successIcon}>
              <FiCheck size={28} />
            </div>
            <h2 className={styles.successTitle}>Баланс пополнен</h2>
            <p className={styles.successText}>
              {selected?.toLocaleString("ru-RU")} ₽ зачислено на ваш счёт
            </p>
            <button className={styles.confirmBtn} onClick={reset}>
              Пополнить ещё
              <FiArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            <h2 className={styles.sectionTitle}>Выберите сумму</h2>

            <div className={styles.amountGrid}>
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={
                    amount === a ? styles.amountChipActive : styles.amountChip
                  }
                  onClick={() => {
                    setAmount(a);
                    setCustom("");
                  }}
                >
                  {a.toLocaleString("ru-RU")} ₽
                </button>
              ))}
            </div>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Другая сумма</span>
              <input
                className={styles.input}
                inputMode="numeric"
                placeholder="например, 750"
                value={custom}
                onChange={(e) => {
                  setCustom(e.target.value.replace(/\D/g, ""));
                  setAmount(null);
                }}
              />
            </label>

            <button
              type="button"
              className={styles.confirmBtn}
              disabled={!selected}
              onClick={confirm}
            >
              Пополнить на{" "}
              {selected ? `${selected.toLocaleString("ru-RU")} ₽` : "…"}
              <FiArrowRight size={16} />
            </button>

            <button
              type="button"
              className={styles.backLink}
              onClick={() => navigate(-1)}
            >
              Вернуться назад
            </button>
          </>
        )}
      </PageContainer>
    </div>
  );
});

export default BalancePage;
