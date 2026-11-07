import { Suspense, useLayoutEffect, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';
import BottomNav from './BottomNav/BottomNav';
import BottomActionBar from './BottomActionBar/BottomActionBar';
import PersistentHeader from './PersistentHeader/PersistentHeader';
import ProductQuickView from '@widgets/product/ProductQuickView';
import CheckoutSheet from '@widgets/checkout/CheckoutSheet';
import RouteFallback from '@shared/ui/RouteFallback';
import styles from './Layout.module.scss';

/**
 * Сбрасывает прокрутку после завершения анимации ухода старой страницы.
 * Компонент живёт внутри keyed-контейнера, поэтому монтируется уже вместе
 * с новой страницей — старой странице не приходится «прыгать» вверх.
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function Layout() {
  const location = useLocation();
  const outlet = useOutlet();
  // Нижняя навигация — только на корневых вкладках. На странице товара и в
  // корзине своя нижняя панель (BottomActionBar), а на остальных — нет.
  const showBottomNav = ['/', '/search', '/stores', '/profile'].includes(
    location.pathname,
  );

  // Отступ под навигацию задаём на самой странице. Так уходящая страница
  // сохраняет свой отступ до конца анимации и контент не дёргается.
  const pageStyle = showBottomNav
    ? undefined
    : ({ '--bottom-nav-space': '0px' } as CSSProperties);

  return (
    <div className={styles.layout}>
      <PersistentHeader />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          className={styles.layoutMain}
          style={pageStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.14, ease: [0.22, 1, 0.36, 1] } }}
          exit={{ opacity: 0, transition: { duration: 0.06, ease: 'linear' } }}
        >
          <ScrollToTop />
          <Suspense fallback={<RouteFallback />}>{outlet}</Suspense>
        </motion.main>
      </AnimatePresence>

      <AnimatePresence>
        {showBottomNav && <BottomNav key="bottom-nav" />}
      </AnimatePresence>

      <BottomActionBar />
      <ProductQuickView />
      <CheckoutSheet />
    </div>
  );
}
