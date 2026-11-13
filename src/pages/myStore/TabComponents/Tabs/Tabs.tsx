import styles from "./Tabs.module.scss";

type Props = {
  tab: "items" | "orders" | "balance";
  setTab: (tab: "items" | "orders" | "balance") => void;
};

const Tabs = ({ tab, setTab }: Props) => {
  return (
    <div className={styles.tabs}>
      <button
        className={tab === "items" ? styles.tabActive : styles.tab}
        onClick={() => setTab("items")}
      >
        Товары
      </button>
      <button
        className={tab === "orders" ? styles.tabActive : styles.tab}
        onClick={() => setTab("orders")}
      >
        Заказы
      </button>
      <button
        className={tab === "balance" ? styles.tabActive : styles.tab}
        onClick={() => setTab("balance")}
      >
        Баланс
      </button>
    </div>
  );
};

export default Tabs;
