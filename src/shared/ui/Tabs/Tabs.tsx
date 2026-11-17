import styles from "./Tabs.module.scss";

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

interface Props<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
}

export default function Tabs<T extends string>({
  tabs,
  activeTab,
  onChange,
}: Props<T>) {
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === activeTab),
  );

  return (
    <div className={styles.tabs} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={isActive ? styles.tabActive : styles.tab}
            onClick={() => onChange(tab.id)}
            type="button"
          >
            {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
            <span className={styles.label}>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={styles.badge}>{tab.badge}</span>
            )}
          </button>
        );
      })}
      <span
        className={styles.activeIndicator}
        style={{
          ["--active-index" as string]: activeIndex,
          ["--tab-count" as string]: tabs.length,
        }}
      />
    </div>
  );
}
