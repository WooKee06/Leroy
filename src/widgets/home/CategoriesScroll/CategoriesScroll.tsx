import { useEffect } from 'react';
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
      <ul className={styles.categoriesScrollList}>
        {categories.map((cat) => {
          const isActive = active === cat.id;
          return (
            <li key={cat.id}>
              <button
                className={
                  isActive
                    ? styles.categoriesScrollPillActive
                    : styles.categoriesScrollPill
                }
                onClick={() => onChange(cat.id)}
              >
                {cat.name}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default observer(CategoriesScroll);
