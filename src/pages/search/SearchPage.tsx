import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiSliders } from 'react-icons/fi';
import PageContainer from '@shared/ui/PageContainer';
import SearchBar from '@shared/ui/SearchBar';
import Skeleton from '@shared/ui/Skeleton';
import { ProductGridSkeleton } from '@shared/ui/Skeletons';
import ProductCard from '@widgets/product/ProductCard';
import type { Product } from '@shared/api/models';
import { mapProduct } from '@shared/api/models';
import { leroyApi } from '@shared/api/leroyApi';
import { catalogStore } from '@shared/stores/catalogStore';
import { pageActionsStore } from '@shared/stores/pageActionsStore';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './SearchPage.module.scss';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'priceAsc' | 'priceDesc'>('popular');

  useEffect(() => {
    void catalogStore.load();
  }, []);

  useEffect(() => {
    pageActionsStore.set('filters', () => setShowFilters(true));
    return () => pageActionsStore.clear('filters');
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

  const allProducts = query.trim() === '' ? catalogStore.products : results;

  const sorted = useMemo(() => {
    const arr = [...allProducts];
    if (sortBy === 'priceAsc') return arr.sort((a, b) => a.price - b.price);
    if (sortBy === 'priceDesc') return arr.sort((a, b) => b.price - a.price);
    return arr;
  }, [allProducts, sortBy]);

  const isSearching = query.trim() !== '';
  const loading = isSearching
    ? searching
    : catalogStore.loading && !catalogStore.loaded;

  return (
    <div className="page-wrapper">
      <PageContainer>
        <div className={styles.searchPageSearch} onClick={(e) => e.stopPropagation()}>
          <SearchBar
            value={query}
            onChange={handleQueryChange}
            placeholder="Что вы ищете?"
            autoFocus
          />
        </div>

        <div className={styles.searchPageResultsHeader}>
          {loading ? (
            <Skeleton width={92} height={18} radius={5} />
          ) : (
            <span className={styles.searchPageCount}>
              {isSearching ? `${sorted.length} результата` : 'Все товары'}
            </span>
          )}
          <button
            className={styles.searchPageFilterBtn}
            onClick={() => setShowFilters(true)}
          >
            <span>
              {sortBy === 'popular'
                ? 'Популярные'
                : sortBy === 'priceAsc'
                  ? 'Дешевле'
                  : 'Дороже'}
            </span>
            <FiSliders size={16} />
          </button>
        </div>

        {loading ? (
          <ProductGridSkeleton count={6} variant="small" />
        ) : (
          <div className={styles.searchPageGrid}>
            {sorted.map((product) => (
              <ProductCard key={product.id} product={product} variant="small" showSeller />
            ))}
          </div>
        )}
      </PageContainer>

      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              className={styles.bottomSheetOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              className={styles.bottomSheet}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className={styles.bottomSheetHandle} />
              <h3 className={styles.bottomSheetTitle}>Сортировка</h3>
              <div className={styles.bottomSheetOptions}>
                {[
                  { value: 'popular', label: 'Популярные' },
                  { value: 'priceAsc', label: 'Сначала дешевле' },
                  { value: 'priceDesc', label: 'Сначала дороже' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    className={
                      sortBy === opt.value
                        ? styles.bottomSheetOptionActive
                        : styles.bottomSheetOption
                    }
                    onClick={() => {
                      setSortBy(opt.value as typeof sortBy);
                      setShowFilters(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                className={styles.bottomSheetDone}
                onClick={() => setShowFilters(false)}
              >
                Готово
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}