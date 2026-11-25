import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowDownLeft,
  FiArrowRight,
  FiArrowUpRight,
  FiCheck,
  FiClock,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { observer } from "mobx-react-lite";
import type { WalletTransactionDto } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
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
const PENDING_TOPUP_KEY = "leroy:pendingTopUpId";
const POLL_ATTEMPTS = 20;

interface TopUpResult {
  amount: number;
  status: "awaiting" | "completed" | "failed";
  confirmationUrl?: string | null;
  failureReason?: string | null;
}

const BalancePage = observer(function BalancePage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<TopUpResult | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(() =>
    localStorage.getItem(PENDING_TOPUP_KEY),
  );
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

  // A gateway top-up is confirmed by webhook. Poll the server after creating
  // it and after returning from YooKassa so the UI does not wait forever.
  useEffect(() => {
    if (!pendingId) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async (attempt: number) => {
      try {
        const topUp = await leroyApi.topUp(pendingId);
        if (!alive) return;

        const status: TopUpResult["status"] =
          topUp.status === "completed"
            ? "completed"
            : topUp.status === "failed" || topUp.status === "expired"
              ? "failed"
              : "awaiting";
        setResult({
          amount: Number(topUp.amount),
          status,
          confirmationUrl: topUp.confirmationUrl,
          failureReason: topUp.failureReason,
        });

        if (status !== "awaiting") {
          localStorage.removeItem(PENDING_TOPUP_KEY);
          setPendingId(null);
          await accountStore.loadWallet(true);
          const page = await leroyApi.walletTransactions({ limit: PAGE_SIZE });
          if (!alive) return;
          setTransactions(page.items);
          setCursor(page.nextCursor);
          setHasMore(page.hasMore);
          return;
        }
      } catch {
        // Transient error: keep the pending state and try again below.
      }

      if (alive && attempt < POLL_ATTEMPTS) {
        timer = setTimeout(() => void poll(attempt + 1), 2000);
      }
    };

    void poll(0);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [pendingId]);

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

    try {
      const topUp = await leroyApi.createTopUp(selected, "yookassa");
      if (!topUp.confirmationUrl) {
        throw new Error("ЮKassa не вернула ссылку на оплату");
      }
      localStorage.setItem(PENDING_TOPUP_KEY, topUp.id);
      setPendingId(topUp.id);
      setResult({
        amount: Number(topUp.amount),
        status: "awaiting",
        confirmationUrl: topUp.confirmationUrl,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось пополнить баланс");
    } finally {
      setSubmitting(false);
    }
  };

  const checkNow = async () => {
    if (!pendingId || checking) return;
    setError("");
    setChecking(true);
    try {
      const topUp = await leroyApi.topUp(pendingId);
      const status: TopUpResult["status"] =
        topUp.status === "completed"
          ? "completed"
          : topUp.status === "failed" || topUp.status === "expired"
            ? "failed"
            : "awaiting";
      setResult({
        amount: Number(topUp.amount),
        status,
        confirmationUrl: topUp.confirmationUrl,
        failureReason: topUp.failureReason,
      });
      if (status === "awaiting") {
        setError("Платёж ещё не подтверждён. Попробуйте чуть позже.");
        return;
      }
      localStorage.removeItem(PENDING_TOPUP_KEY);
      setPendingId(null);
      await accountStore.loadWallet(true);
      const page = await leroyApi.walletTransactions({ limit: PAGE_SIZE });
      applyPage(page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось проверить платёж");
    } finally {
      setChecking(false);
    }
  };

  const reset = () => {
    localStorage.removeItem(PENDING_TOPUP_KEY);
    setPendingId(null);
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
              {result.status === "awaiting" ? (
                <FiClock size={28} />
              ) : result.status === "completed" ? (
                <FiCheck size={28} />
              ) : (
                <FiX size={28} />
              )}
            </div>
            <h2 className={styles.successTitle}>
              {result.status === "awaiting"
                ? "Ожидаем оплату"
                : result.status === "completed"
                  ? "Баланс пополнен"
                  : "Пополнение не удалось"}
            </h2>
            <p className={styles.successText}>
              {result.status === "awaiting"
                ? `Перейдите на защищённую страницу ЮKassa и оплатите ${formatWalletAmount(result.amount, currency)}. Баланс обновится автоматически.`
                : result.status === "completed"
                  ? `${formatWalletAmount(result.amount, currency)} зачислено на ваш счёт`
                  : result.failureReason ||
                    "Платёж не прошёл. Попробуйте ещё раз."}
            </p>
            {error && <p className={styles.error}>{error}</p>}
            {result.status === "awaiting" && (
              <>
                {result.confirmationUrl && (
                  <a
                    className={styles.confirmBtn}
                    href={result.confirmationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Перейти к оплате
                    <FiArrowRight size={16} />
                  </a>
                )}
                <button
                  type="button"
                  className={styles.checkBtn}
                  disabled={checking}
                  onClick={() => void checkNow()}
                >
                  <FiRefreshCw
                    size={18}
                    className={checking ? styles.spin : undefined}
                  />
                  {checking ? "Проверяем…" : "Проверить оплату"}
                </button>
              </>
            )}
            <button
              type="button"
              className={
                result.status === "awaiting"
                  ? styles.backLink
                  : styles.confirmBtn
              }
              onClick={reset}
            >
              Пополнить ещё
              {result.status !== "awaiting" && <FiArrowRight size={16} />}
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
