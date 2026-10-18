import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav/BottomNav';
import BottomActionBar from './BottomActionBar/BottomActionBar';
import PersistentHeader from './PersistentHeader/PersistentHeader';
import ProductQuickView from '@widgets/product/ProductQuickView';
import CheckoutSheet from '@widgets/checkout/CheckoutSheet';
import styles from './Layout.module.scss';

export default function Layout() {
  const location = useLocation();
  // Нижняя навигация — только на корневых вкладках. На странице товара и в
  // корзине своя нижняя панель (BottomActionBar), а на остальных — нет.
  const showBottomNav = ["/", "/search", "/stores", "/profile"].includes(
    location.pathname,
  );

  return (
    <div className={`${styles.layout} ${showBottomNav ? "" : styles.layoutNoNav}`}>
      <PersistentHeader />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className={styles.layoutMain}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      {showBottomNav && <BottomNav />}
      <BottomActionBar />
      <ProductQuickView />
      <CheckoutSheet />
    </div>
  );
}
