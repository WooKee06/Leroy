import { FiBox, FiDollarSign, FiShoppingBag } from "react-icons/fi";
import Tabs from "@/shared/ui/Tabs/Tabs";
import type { TabItem } from "@/shared/ui/Tabs/Tabs";

type Tab = "items" | "orders" | "balance";

type Props = {
  tab: Tab;
  setTab: (tab: Tab) => void;
};

const TABS: TabItem<Tab>[] = [
  { id: "items", label: "Товары", icon: <FiBox size={16} /> },
  { id: "orders", label: "Заказы", icon: <FiShoppingBag size={16} /> },
  { id: "balance", label: "Баланс", icon: <FiDollarSign size={16} /> },
];

const StoreTabs = ({ tab, setTab }: Props) => {
  return <Tabs tabs={TABS} activeTab={tab} onChange={setTab} />;
};

export default StoreTabs;
