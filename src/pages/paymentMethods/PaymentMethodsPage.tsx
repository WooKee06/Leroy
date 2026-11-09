import { FiCreditCard, FiStar, FiGlobe, FiPlus } from "react-icons/fi";
import PageContainer from "@shared/ui/PageContainer";
import PageHeader from "@shared/ui/PageHeader";
import styles from "./PaymentMethodsPage.module.scss";

const methods = [
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

export default function PaymentMethodsPage() {
  return (
    <div className="page-wrapper">
      <PageContainer>
        <PageHeader title="Способы оплаты" />

        <p className={styles.hint}>
          Выберите способ, которым хотите оплачивать покупки.
        </p>

        <div className={styles.list}>
          {methods.map((m) => (
            <div key={m.id} className={styles.row}>
              <span
                className={styles.rowIcon}
                style={{ background: m.tint, color: m.color }}
              >
                {m.icon}
              </span>
              <span className={styles.rowMain}>
                <span className={styles.rowLabel}>{m.label}</span>
                <span className={styles.rowDesc}>{m.desc}</span>
              </span>
            </div>
          ))}
        </div>

        <button type="button" className={styles.addBtn}>
          <FiPlus size={18} />
          Добавить способ оплаты
        </button>

        <p className={styles.note}>
          Добавление карт и привязка кошельков появится в одном из ближайших
          обновлений.
        </p>
      </PageContainer>
    </div>
  );
}
