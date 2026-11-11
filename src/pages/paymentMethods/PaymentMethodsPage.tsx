import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { FiCheck, FiCreditCard, FiGlobe, FiPlus, FiStar } from "react-icons/fi";
import { accountStore } from "@shared/stores/accountStore";
import { formatWalletAmount } from "@shared/lib/wallet";
import PageContainer from "@shared/ui/PageContainer";
import PageHeader from "@shared/ui/PageHeader";
import SoonBadge from "@shared/ui/SoonBadge";
import styles from "./PaymentMethodsPage.module.scss";

interface PaymentMethod {
  id: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
  tint: string;
  color: string;
  available?: boolean;
}

const methods: PaymentMethod[] = [
  {
    id: "balance",
    icon: <span className={styles.ruble}>₽</span>,
    label: "Официальный баланс",
    desc: "Оплата с внутреннего счёта Leroy",
    tint: "var(--tint-green)",
    color: "#34c759",
    available: true,
  },
  {
    id: "cards",
    icon: <FiCreditCard size={20} />,
    label: "Банковские карты",
    desc: "Visa, Mastercard, МИР",
    tint: "var(--tint-green)",
    color: "#34c759",
  },
  {
    id: "stars",
    icon: <FiStar size={20} />,
    label: "Telegram Stars",
    desc: "Оплата звёздами внутри Telegram",
    tint: "var(--tint-orange)",
    color: "#f5a623",
  },
  {
    id: "ton",
    icon: <FiGlobe size={20} />,
    label: "TON-кошелёк",
    desc: "Переводы в криптовалюте TON",
    tint: "var(--tint-blue)",
    color: "#007aff",
  },
];

const PaymentMethodsPage = observer(function PaymentMethodsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    void accountStore.loadWallet();
  }, []);

  const balanceLoading =
    accountStore.walletLoading && !accountStore.walletLoaded;

  return (
    <div className="page-wrapper">
      <PageContainer>
        <PageHeader title="Способы оплаты" />

        <p className={styles.hint}>
          Сейчас доступен только официальный баланс — оплачивайте покупки с
          внутреннего счёта без привязки карт и кошельков.
        </p>

        <div className={styles.list}>
          {methods.map((m) => (
            <div
              key={m.id}
              className={`${styles.row} ${m.available ? "" : styles.rowSoon}`}
              onClick={
                m.available ? () => navigate("/balance") : undefined
              }
              role={m.available ? "button" : undefined}
              tabIndex={m.available ? 0 : undefined}
            >
              <span
                className={styles.rowIcon}
                style={{ background: m.tint, color: m.color }}
              >
                {m.icon}
              </span>
              <span className={styles.rowMain}>
                <span className={styles.rowLabel}>{m.label}</span>
                <span className={styles.rowDesc}>
                  {m.id === "balance"
                    ? balanceLoading
                      ? "Загружаем баланс…"
                      : `Доступно ${formatWalletAmount(
                          accountStore.balance,
                          accountStore.currency,
                        )}`
                    : m.desc}
                </span>
              </span>
              {m.available ? (
                <span className={styles.activeMark}>
                  <FiCheck size={13} />
                  Доступен
                </span>
              ) : (
                <SoonBadge />
              )}
            </div>
          ))}
        </div>

        <button type="button" className={styles.addBtn} disabled>
          <FiPlus size={18} />
          Добавить способ оплаты
          <SoonBadge className={styles.addSoon} />
        </button>

        <p className={styles.note}>
          Привязка карт и кошельков появится в одном из ближайших обновлений.
        </p>
      </PageContainer>
    </div>
  );
});

export default PaymentMethodsPage;
