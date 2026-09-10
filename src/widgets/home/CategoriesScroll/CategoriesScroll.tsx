import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { catalogStore } from '@shared/stores/catalogStore';
import styles from './CategoriesScroll.module.scss';

interface Props {
  active: string;
  onChange: (id: string) => void;
}

function CategoriesScroll({ active, onChange }: Props) {
  useEffect(() => {
    void catalogStore.load();
  }, []);

  const categories = catalogStore.categories;

  return (
    <nav className={styles.categoriesScroll} aria-label="Категории">
      <motion.ul className={styles.categoriesScrollList} layout>
        {categories.map((cat) => {
          const isActive = active === cat.id;
          return (
            <li key={cat.id}>
              <motion.button
                className={
                  isActive
                    ? styles.categoriesScrollPillActive
                    : styles.categoriesScrollPill
                }
                onClick={() => onChange(cat.id)}
                whileTap={{ scale: 0.92 }}
                layout
              >
                {cat.name}
              </motion.button>
            </li>
          );
        })}
      </motion.ul>
    </nav>
  );
}

export default observer(CategoriesScroll);