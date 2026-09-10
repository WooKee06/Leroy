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
  const hideBottomNav =
    location.pathname.startsWith('/product/') || location.pathname.startsWith('/cart');

  return (
    <div className={styles.layout}>
      <PersistentHeader />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className={styles.layoutMain}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
      {!hideBottomNav && <BottomNav />}
      <BottomActionBar />
      <ProductQuickView />
      <CheckoutSheet />
    </div>
  );
}
