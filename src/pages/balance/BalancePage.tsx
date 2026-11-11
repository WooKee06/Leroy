import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowDownLeft,
  FiArrowRight,
  FiArrowUpRight,
  FiCheck,
  FiClock,
} from "react-icons/fi";
import { observer } from "mobx-react-lite";
import type { WalletTransactionDto } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import { ApiError } from "@shared/api/client";
import { accountStore } from "@shared/stores/accountStore";
import {
  formatSignedWalletAmount,
  formatWalletAmount,
  formatWalletDate,
  isIncomingTransaction,
  walletTransactionLabel,
} from "@shared/lib/wallet";
import PageContainer from "@shared/ui/PageContainer";
import PageHeader from "@shared/ui/PageHeader";
import Skeleton from "@shared/ui/Skeleton";
import styles from "./BalancePage.module.scss";

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];
const PAGE_SIZE = 20;

interface TopUpResult {
  amount: number;
  /** true — top-up created but not confirmed yet (production/manual path). */
  pending: boolean;
}

const BalancePage = observer(function BalancePage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TopUpResult | null>(null);
  const [error, setError] = useState("");

  const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txLoadingMore, setTxLoadingMore] = useState(false);
  const [txError, setTxError] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const parseCustom = Number(custom.trim());
  const selected =
    amount ??
    (custom.trim() && !Number.isNaN(parseCustom) ? parseCustom : null);

  const applyPage = (page: {
    items: WalletTransactionDto[];
    nextCursor: string | null;
    hasMore: boolean;
  }) => {
    setTransactions(page.items);
    setCursor(page.nextCursor);
    setHasMore(page.hasMore);
  };

  useEffect(() => {
    let alive = true;
    void accountStore.loadWallet(true);

    (async () => {
      try {
        const page = await leroyApi.walletTransactions({ limit: PAGE_SIZE });
        if (!alive) return;
        setTransactions(page.items);
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      } catch (e) {
        if (!alive) return;
        setTxError(
          e instanceof Error ? e.message : "Не удалось загрузить историю",
        );
      } finally {
        if (alive) setTxLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const loadMore = async () => {
    if (!cursor || txLoadingMore) return;
    setTxLoadingMore(true);
    setTxError("");
    try {
      const page = await leroyApi.walletTransactions({
        limit: PAGE_SIZE,
        cursor,
      });
      setTransactions((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (e) {
      setTxError(
        e instanceof Error ? e.message : "Не удалось загрузить историю",
      );
    } finally {
      setTxLoadingMore(false);
    }
  };

  const confirm = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    setError("");
    setTxError("");

    let pending = false;
    try {
      const topUp = await leroyApi.createTopUp(selected);
      try {
        await leroyApi.confirmTopUp(topUp.id);
      } catch (e) {
        // Production path: the money is credited by a provider webhook or an
        // admin, so the owner cannot confirm their own top-up (403).
        if (e instanceof ApiError && e.status === 403) {
          pending = true;
        } else {
          throw e;
        }
      }

      await accountStore.loadWallet(true);
      if (!pending) {
        const page = await leroyApi.walletTransactions({ limit: PAGE_SIZE });
        applyPage(page);
      }
      setResult({ amount: selected, pending });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось пополнить баланс");
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setAmount(null);
    setCustom("");
    setResult(null);
    setError("");
  };

  const balanceLoading = accountStore.walletLoading && !accountStore.walletLoaded;
  const currency = accountStore.currency;

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
              <span className={styles.balanceValue}>
                {balanceLoading
                  ? "…"
                  : formatWalletAmount(accountStore.balance, currency)}
              </span>
              <span className={styles.balanceHint}>Доступно для покупок</span>
            </span>
          </div>
        </div>

        {accountStore.walletError && (
          <p className={styles.error}>{accountStore.walletError}</p>
        )}

        {result ? (
          <div className={styles.successBlock}>
            <div className={styles.successIcon}>
              {result.pending ? (
                <FiClock size={28} />
              ) : (
                <FiCheck size={28} />
              )}
            </div>
            <h2 className={styles.successTitle}>
              {result.pending ? "Заявка создана" : "Баланс пополнен"}
            </h2>
            <p className={styles.successText}>
              {result.pending
                ? `${formatWalletAmount(result.amount, currency)} будут зачислены после подтверждения.`
                : `${formatWalletAmount(result.amount, currency)} зачислено на ваш счёт`}
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

            {error && <p className={styles.error}>{error}</p>}

            <button
              type="button"
              className={styles.confirmBtn}
              disabled={!selected || submitting}
              onClick={() => void confirm()}
            >
              {submitting
                ? "Пополняем…"
                : `Пополнить на ${
                    selected ? formatWalletAmount(selected, currency) : "…"
                  }`}
              {!submitting && <FiArrowRight size={16} />}
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

        <section className={styles.history}>
          <h2 className={styles.sectionTitle}>История операций</h2>

          {txLoading ? (
            <div className={styles.historyList}>
              {[0, 1, 2].map((i) => (
                <div key={i} className={styles.txRow}>
                  <Skeleton width={36} height={36} radius={12} />
                  <span className={styles.txMain}>
                    <Skeleton width={110} height={13} radius={4} />
                    <Skeleton width={70} height={11} radius={4} />
                  </span>
                  <Skeleton width={64} height={14} radius={4} />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className={styles.historyEmpty}>Пока нет операций</p>
          ) : (
            <>
              <div className={styles.historyList}>
                {transactions.map((tx) => {
                  const incoming = isIncomingTransaction(tx);
                  return (
                    <div key={tx.id} className={styles.txRow}>
                      <span
                        className={`${styles.txIcon} ${
                          incoming ? styles.txIconIn : styles.txIconOut
                        }`}
                      >
                        {incoming ? (
                          <FiArrowDownLeft size={16} />
                        ) : (
                          <FiArrowUpRight size={16} />
                        )}
                      </span>
                      <span className={styles.txMain}>
                        <span className={styles.txLabel}>
                          {walletTransactionLabel(tx.type)}
                        </span>
                        <span className={styles.txDate}>
                          {formatWalletDate(tx.createdAt)}
                        </span>
                      </span>
                      <span className={styles.txAmounts}>
                        <span
                          className={
                            incoming ? styles.txAmountIn : styles.txAmountOut
                          }
                        >
                          {formatSignedWalletAmount(tx.amount, currency)}
                        </span>
                        <span className={styles.txBalance}>
                          {formatWalletAmount(tx.balanceAfter, currency)}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>

              {txError && <p className={styles.error}>{txError}</p>}

              {hasMore && (
                <button
                  type="button"
                  className={styles.moreBtn}
                  disabled={txLoadingMore}
                  onClick={() => void loadMore()}
                >
                  {txLoadingMore ? "Загружаем…" : "Показать ещё"}
                </button>
              )}
            </>
          )}
        </section>
      </PageContainer>
    </div>
  );
});

export default BalancePage;
