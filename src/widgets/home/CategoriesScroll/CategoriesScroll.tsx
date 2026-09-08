import { motion } from 'framer-motion';
import { categories } from '@shared/api/mockData';
import styles from './CategoriesScroll.module.scss';

interface Props {
  active: string;
  onChange: (id: string) => void;
}

export default function CategoriesScroll({ active, onChange }: Props) {
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
