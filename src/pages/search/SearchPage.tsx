import { useEffect, useMemo, useState } from 'react';
import { FiSliders } from 'react-icons/fi';
import PageContainer from '@shared/ui/PageContainer';
import SearchBar from '@shared/ui/SearchBar';
import ProductCard from '@widgets/product/ProductCard';
import { searchProducts, products } from '@shared/api/mockData';
import { pageActionsStore } from '@shared/stores/pageActionsStore';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './SearchPage.module.scss';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'priceAsc' | 'priceDesc'>('popular');

  useEffect(() => {
    pageActionsStore.set('filters', () => setShowFilters(true));
    return () => pageActionsStore.clear('filters');
  }, []);

  const results = useMemo(() => {
    if (query.trim() === '') return products;
    return searchProducts(query);
  }, [query]);

  const sorted = useMemo(() => {
    const arr = [...results];
    if (sortBy === 'priceAsc') return arr.sort((a, b) => a.price - b.price);
    if (sortBy === 'priceDesc') return arr.sort((a, b) => b.price - a.price);
    return arr;
  }, [results, sortBy]);

  const isSearching = query.trim() !== '';

  return (
    <div className="page-wrapper">
      <PageContainer>
        <div className={styles.searchPageSearch} onClick={(e) => e.stopPropagation()}>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Что вы ищете?"
            autoFocus
          />
        </div>

        <div className={styles.searchPageResultsHeader}>
          <span className={styles.searchPageCount}>
            {isSearching ? `${sorted.length} результата` : 'Все товары'}
          </span>
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

        <div className={styles.searchPageGrid}>
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} variant="small" showSeller />
          ))}
        </div>
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
