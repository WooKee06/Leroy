import { FiX } from "react-icons/fi";
import type { FilterChip } from "@shared/lib/productFilters";
import styles from "./ProductFilterChips.module.scss";

interface Props {
  chips: FilterChip[];
  onRemove: (chip: FilterChip) => void;
  onReset: () => void;
}

/** Строка применённых фильтров с возможностью убрать каждый по отдельности. */
export default function ProductFilterChips({
  chips,
  onRemove,
  onReset,
}: Props) {
  if (chips.length === 0) return null;

  return (
    <div className={styles.row}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          className={styles.chip}
          onClick={() => onRemove(chip)}
        >
          {chip.label}
          <FiX size={13} />
        </button>
      ))}
      <button type="button" className={styles.reset} onClick={onReset}>
        Сбросить
      </button>
    </div>
  );
}
