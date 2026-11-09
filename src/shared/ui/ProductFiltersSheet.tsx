import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiCheck, FiX } from "react-icons/fi";
import type { Category, Product } from "@shared/api/models";
import {
  DEFAULT_PRODUCT_FILTERS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  collectColors,
  collectSizes,
  pluralizeProducts,
  type ProductFilters,
  type SortBy,
} from "@shared/lib/productFilters";
import styles from "./ProductFiltersSheet.module.scss";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Товары, по которым строятся доступные цвета и размеры. */
  products: Product[];
  categories: Category[];
  filters: ProductFilters;
  onChange: (next: ProductFilters) => void;
  resultCount: number;
}

function isLightColor(hex: string): boolean {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return true;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 165;
}

/**
 * Нижняя шторка с фильтрами каталога: сортировка, категории, цена,
 * цвет, размер, рейтинг и дополнительные переключатели.
 */
export default function ProductFiltersSheet({
  open,
  onClose,
  products,
  categories,
  filters,
  onChange,
  resultCount,
}: Props) {
  const allColors = useMemo(() => collectColors(products), [products]);
  const allSizes = useMemo(() => collectSizes(products), [products]);

  const toggleCategory = (id: string) => {
    if (id === "all") {
      onChange({ ...filters, categories: [] });
      return;
    }
    onChange({
      ...filters,
      categories: filters.categories.includes(id)
        ? filters.categories.filter((c) => c !== id)
        : [...filters.categories, id],
    });
  };

  const toggleColor = (name: string) => {
    onChange({
      ...filters,
      colors: filters.colors.includes(name)
        ? filters.colors.filter((c) => c !== name)
        : [...filters.colors, name],
    });
  };

  const toggleSize = (size: string) => {
    onChange({
      ...filters,
      sizes: filters.sizes.includes(size)
        ? filters.sizes.filter((s) => s !== size)
        : [...filters.sizes, size],
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className={styles.sheet}
            initial={{ y: "100%", scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: "100%", scale: 0.98 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Фильтры и сортировка"
          >
            <div className={styles.sheetHeader}>
              <span className={styles.sheetHandle} />
              <div className={styles.sheetTitleRow}>
                <h3 className={styles.sheetTitle}>Фильтры</h3>
                <div className={styles.sheetHeaderActions}>
                  <button
                    type="button"
                    className={styles.sheetReset}
                    onClick={() => onChange(DEFAULT_PRODUCT_FILTERS)}
                  >
                    Сбросить
                  </button>
                  <button
                    className={styles.sheetClose}
                    onClick={onClose}
                    aria-label="Закрыть"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.sheetBody}>
              <div className={styles.sheetSection}>
                <span className={styles.sheetSectionTitle}>Сортировка</span>
                <div className={styles.options}>
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={
                        filters.sortBy === opt.value
                          ? styles.optionActive
                          : styles.option
                      }
                      onClick={() =>
                        onChange({
                          ...filters,
                          sortBy: opt.value as SortBy,
                        })
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.sheetSection}>
                <span className={styles.sheetSectionTitle}>Категория</span>
                <div className={styles.options}>
                  <button
                    type="button"
                    className={
                      filters.categories.length === 0
                        ? styles.optionActive
                        : styles.option
                    }
                    onClick={() => toggleCategory("all")}
                  >
                    Все
                  </button>
                  {categories
                    .filter((c) => c.id !== "all")
                    .map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={
                          filters.categories.includes(cat.id)
                            ? styles.optionActive
                            : styles.option
                        }
                        onClick={() => toggleCategory(cat.id)}
                      >
                        {cat.name}
                      </button>
                    ))}
                </div>
              </div>

              <div className={styles.sheetSection}>
                <span className={styles.sheetSectionTitle}>Цена, ₽</span>
                <div className={styles.priceRow}>
                  <label className={styles.priceField}>
                    <span className={styles.priceLabel}>От</span>
                    <input
                      className={styles.priceInput}
                      inputMode="numeric"
                      placeholder="0"
                      value={filters.priceMin}
                      onChange={(e) =>
                        onChange({
                          ...filters,
                          priceMin: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 7),
                        })
                      }
                    />
                  </label>
                  <span className={styles.priceDash}>—</span>
                  <label className={styles.priceField}>
                    <span className={styles.priceLabel}>До</span>
                    <input
                      className={styles.priceInput}
                      inputMode="numeric"
                      placeholder="∞"
                      value={filters.priceMax}
                      onChange={(e) =>
                        onChange({
                          ...filters,
                          priceMax: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 7),
                        })
                      }
                    />
                  </label>
                </div>
              </div>

              {allColors.length > 0 && (
                <div className={styles.sheetSection}>
                  <span className={styles.sheetSectionTitle}>Цвет</span>
                  <div className={styles.colorGrid}>
                    {allColors.map((color) => {
                      const selected = filters.colors.includes(color.name);
                      return (
                        <button
                          key={color.name}
                          type="button"
                          className={
                            selected ? styles.colorItemActive : styles.colorItem
                          }
                          onClick={() => toggleColor(color.name)}
                          aria-pressed={selected}
                          title={color.name}
                        >
                          <span
                            className={styles.colorSwatch}
                            style={{
                              background: color.hex,
                              color: isLightColor(color.hex)
                                ? "#111111"
                                : "#ffffff",
                            }}
                          >
                            {selected && <FiCheck size={14} />}
                          </span>
                          <span className={styles.colorName}>{color.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {allSizes.length > 0 && (
                <div className={styles.sheetSection}>
                  <span className={styles.sheetSectionTitle}>Размер</span>
                  <div className={styles.options}>
                    {allSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={
                          filters.sizes.includes(size)
                            ? styles.optionActive
                            : styles.option
                        }
                        onClick={() => toggleSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.sheetSection}>
                <span className={styles.sheetSectionTitle}>Рейтинг</span>
                <div className={styles.options}>
                  {RATING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={
                        filters.minRating === opt.value
                          ? styles.optionActive
                          : styles.option
                      }
                      onClick={() =>
                        onChange({
                          ...filters,
                          minRating:
                            filters.minRating === opt.value ? null : opt.value,
                        })
                      }
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.sheetSection}>
                <span className={styles.sheetSectionTitle}>Показывать</span>
                <div className={styles.options}>
                  <button
                    type="button"
                    className={
                      filters.onlyDiscount
                        ? styles.optionActive
                        : styles.option
                    }
                    onClick={() =>
                      onChange({
                        ...filters,
                        onlyDiscount: !filters.onlyDiscount,
                      })
                    }
                  >
                    Только со скидкой
                  </button>
                  <button
                    type="button"
                    className={
                      filters.onlyNew ? styles.optionActive : styles.option
                    }
                    onClick={() =>
                      onChange({ ...filters, onlyNew: !filters.onlyNew })
                    }
                  >
                    Только новинки
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.sheetFooter}>
              <button
                type="button"
                className={styles.doneBtn}
                onClick={onClose}
              >
                Показать {resultCount} {pluralizeProducts(resultCount)}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
