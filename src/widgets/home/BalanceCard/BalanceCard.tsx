import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowRight, FiX } from "react-icons/fi";
import { observer } from "mobx-react-lite";
import { accountStore } from "@shared/stores/accountStore";
import styles from "./BalanceCard.module.scss";

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

function BalanceCard() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [success, setSuccess] = useState(false);

  const parseCustom = Number(custom.trim());
  const selected =
    amount ?? (custom.trim() && !Number.isNaN(parseCustom) ? parseCustom : null);

  const close = () => {
    setOpen(false);
    setAmount(null);
    setCustom("");
    setSuccess(false);
  };

  const confirm = () => {
    if (!selected) return;
    accountStore.topUp(selected);
    setSuccess(true);
    window.setTimeout(() => {
      close();
    }, 1400);
  };

  return (
    <>
      <div className={styles.balanceCard}>
        <div className={styles.balanceLeft}>
          <span className={styles.balanceIcon}>
            <span className={styles.balanceIconChar}>₽</span>
          </span>
          <span className={styles.balanceInfo}>
            <span className={styles.balanceLabel}>Баланс</span>
            <span className={styles.balanceValue}>
              {accountStore.balance.toLocaleString("ru-RU")} ₽
            </span>
            <span className={styles.balanceHint}>Доступно для покупок</span>
          </span>
        </div>
        <button
          className={styles.topUpBtn}
          onClick={() => setOpen(true)}
          aria-label="Пополнить баланс"
        >
          Пополнить
          <FiArrowRight size={14} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              aria-hidden="true"
            />
            <motion.div
              className={styles.sheet}
              role="dialog"
              aria-modal="true"
              aria-label="Пополнение баланса"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <div className={styles.handle} />
              <button
                className={styles.closeBtn}
                onClick={close}
                aria-label="Закрыть"
              >
                <FiX size={18} />
              </button>

              {success ? (
                <div className={styles.successBlock}>
                  <div className={styles.successIcon}>✓</div>
                  <h2 className={styles.sheetTitle}>Баланс пополнен</h2>
                  <p className={styles.successText}>
                    {selected?.toLocaleString("ru-RU")} ₽ зачислено на баланс
                  </p>
                </div>
              ) : (
                <>
                  <h2 className={styles.sheetTitle}>Пополнение баланса</h2>
                  <p className={styles.sheetSubtitle}>Выберите сумму</p>

                  <div className={styles.amountGrid}>
                    {QUICK_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        className={
                          amount === a
                            ? styles.amountChipActive
                            : styles.amountChip
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
                    className={styles.confirmBtn}
                    disabled={!selected}
                    onClick={confirm}
                  >
                    Пополнить на{" "}
                    {selected ? `${selected.toLocaleString("ru-RU")} ₽` : "…"}
                    <FiArrowRight size={16} />
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default observer(BalanceCard);