import styles from "./SearchBar.module.scss";
import { RiSearch2Line } from "react-icons/ri";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  trailing?: React.ReactNode;
  onFocus?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Что вы ищете?",
  trailing,
  onFocus,
  autoFocus,
}: Props) {
  return (
    <div className={styles.searchBar}>
      <section>
        <RiSearch2Line size={20} className={styles.searchBarIcon} />
        <input
          type="text"
          className={styles.searchBarInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={onFocus}
          autoFocus={autoFocus}
        />
      </section>
      {trailing && <div className={styles.searchBarTrailing}>{trailing}</div>}
    </div>
  );
}
