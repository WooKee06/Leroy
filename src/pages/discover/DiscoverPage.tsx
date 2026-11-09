import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { FiSliders, FiX } from "react-icons/fi";
import { catalogStore } from "@shared/stores/catalogStore";
import { leroyApi } from "@shared/api/leroyApi";
import { mapProduct, type Product } from "@shared/api/models";
import PageContainer from "@shared/ui/PageContainer";
import PageHeader from "@shared/ui/PageHeader";
import SearchBar from "@shared/ui/SearchBar";
import Skeleton from "@shared/ui/Skeleton";
import {
  ChipRowSkeleton,
  ProductGridSkeleton,
  PromoSliderSkeleton,
} from "@shared/ui/Skeletons";
import ProductFilterChips from "@shared/ui/ProductFilterChips";
import ProductFiltersSheet from "@shared/ui/ProductFiltersSheet";
import {
  DEFAULT_PRODUCT_FILTERS,
  applyProductFilters,
  buildFilterChips,
  hasActiveFilters,
  removeFilterChip,
} from "@shared/lib/productFilters";
import CategoriesScroll from "@widgets/home/CategoriesScroll/CategoriesScroll";
import PromoSlider from "@widgets/home/PromoSlider/PromoSlider";
import PopularStores from "@widgets/home/PopularStores/PopularStores";
import FeaturedProducts from "@widgets/home/FeaturedProducts/FeaturedProducts";
import styles from "./DiscoverPage.module.scss";

const DiscoverPage = observer(function DiscoverPage() {
  const [active, setActive] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_PRODUCT_FILTERS);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    void catalogStore.load();
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;

    let alive = true;
    const handle = setTimeout(async () => {
      try {
        const res = await leroyApi.search(q);
        if (alive) setResults(res.products.map((p) => mapProduct(p)));
      } catch {
        if (alive) setResults([]);
      } finally {
        if (alive) setSearching(false);
      }
    }, 300);

    return () => {
      alive = false;
      clearTimeout(handle);
    };
  }, [query]);

  const isSearching = query.trim() !== "";
  const source = isSearching ? results : catalogStore.products;

  const filtered = useMemo(
    () => applyProductFilters(source, filters, isSearching ? "all" : active),
    [source, filters, isSearching, active],
  );

  const chips = buildFilterChips(filters, (id) =>
    catalogStore.categoryName(id),
  );
  const filtersActive = hasActiveFilters(filters);

  const loading = isSearching
    ? searching
    : catalogStore.loading && !catalogStore.loaded;

  const showCatalogExtras =
    !isSearching && active === "all" && filters.categories.length === 0;

  const resetFilters = () => {
    setFilters(DEFAULT_PRODUCT_FILTERS);
  };

  const openFilters = () => {
    if (!isSearching && active !== "all") {
      setFilters((f) => ({ ...f, categories: [active] }));
      setActive("all");
    }
    setShowFilters(true);
  };

  const handleQuickCategory = (id: string) => {
    setActive(id);
    // Быстрые чипы и мультивыбор категорий не должны конфликтовать.
    if (filters.categories.length > 0) {
      setFilters((f) => ({ ...f, categories: [] }));
    }
  };

  const handleRemoveChip = (chip: Parameters<typeof removeFilterChip>[1]) => {
    setFilters((f) => removeFilterChip(f, chip));
  };

  return (
    <div className={`page-wrapper ${styles.page}`}>
      <PageContainer>
        <PageHeader
          title="Каталог"
          trailing={
            <button
              className={styles.filterBtn}
              onClick={openFilters}
              aria-label="Фильтры"
            >
              <FiSliders size={20} />
              {chips.length > 0 && (
                <span className={styles.filterBadge}>{chips.length}</span>
              )}
            </button>
          }
        />

        <div className={styles.searchWrap}>
          <SearchBar
            value={query}
            onChange={handleQueryChange}
            placeholder="Что вы ищете?"
            trailing={
              query ? (
                <button
                  type="button"
                  className={styles.searchClear}
                  onClick={() => handleQueryChange("")}
                  aria-label="Очистить поиск"
                >
                  <FiX size={18} />
                </button>
              ) : undefined
            }
          />
        </div>

        {!isSearching &&
          (loading ? (
            <div className={styles.categoriesSkeleton}>
              <ChipRowSkeleton count={5} />
            </div>
          ) : (
            <CategoriesScroll active={active} onChange={handleQuickCategory} />
          ))}

        <ProductFilterChips
          chips={chips}
          onRemove={handleRemoveChip}
          onReset={resetFilters}
        />

        {showCatalogExtras && (
          <div className={styles.banners}>
            {loading ? <PromoSliderSkeleton /> : <PromoSlider />}
          </div>
        )}

        {loading ? (
          <section className={styles.gridSection}>
            <Skeleton
              width={172}
              height={26}
              radius={7}
              className={styles.sectionTitleSkeleton}
            />
            <ProductGridSkeleton count={6} />
          </section>
        ) : filtered.length > 0 ? (
          <section className={styles.gridSection}>
            <h2 className={styles.sectionTitle}>
              {isSearching || filtersActive
                ? `Найдено ${filtered.length}`
                : active !== "all"
                  ? catalogStore.categoryName(active)
                  : "Популярное"}
            </h2>
            <FeaturedProducts products={filtered} variant="grid" />
          </section>
        ) : (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>
              {isSearching ? "Ничего не найдено" : "Ничего не нашлось"}
            </p>
            <p className={styles.emptyText}>
              {isSearching
                ? "Попробуйте изменить запрос или убрать часть фильтров."
                : "Попробуйте изменить цену или убрать часть фильтров."}
            </p>
            <div className={styles.emptyActions}>
              {filtersActive && (
                <button
                  type="button"
                  className={styles.emptyBtn}
                  onClick={resetFilters}
                >
                  Сбросить фильтры
                </button>
              )}
              {isSearching && (
                <button
                  type="button"
                  className={styles.emptyBtnGhost}
                  onClick={() => handleQueryChange("")}
                >
                  Очистить поиск
                </button>
              )}
            </div>
          </div>
        )}

        {!loading && showCatalogExtras && (
          <div className={styles.storesBlock}>
            <PopularStores />
          </div>
        )}
      </PageContainer>

      <ProductFiltersSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        products={source}
        categories={catalogStore.categories}
        filters={filters}
        onChange={setFilters}
        resultCount={filtered.length}
      />
    </div>
  );
});

export default DiscoverPage;
