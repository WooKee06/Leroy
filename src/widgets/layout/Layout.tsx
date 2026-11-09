import { Suspense, useLayoutEffect, type CSSProperties } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';
import BottomNav from './BottomNav/BottomNav';
import BottomActionBar from './BottomActionBar/BottomActionBar';
import PersistentHeader from './PersistentHeader/PersistentHeader';
import ProductQuickView from '@widgets/product/ProductQuickView';
import CheckoutSheet from '@widgets/checkout/CheckoutSheet';
import RouteFallback from '@shared/ui/RouteFallback';
import styles from './Layout.module.scss';

/**
 * Сбрасывает прокрутку до отрисовки новой страницы (useLayoutEffect), чтобы
 * первый кадр уже был вверху и не мигал старым скроллом.
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
  const showBottomNav = ['/', '/discover', '/stores', '/profile'].includes(
    location.pathname,
  );

  // На не-табовых страницах нижней навигации нет — убираем отступ под неё.
  const pageStyle = showBottomNav
    ? undefined
    : ({ '--bottom-nav-space': '0px' } as CSSProperties);

  return (
    <div className={styles.layout}>
      <PersistentHeader />
      <main
        key={location.pathname}
        className={styles.layoutMain}
        style={pageStyle}
      >
        <ScrollToTop />
        <Suspense fallback={<RouteFallback />}>{outlet}</Suspense>
      </main>

      <AnimatePresence>
        {showBottomNav && <BottomNav key="bottom-nav" />}
      </AnimatePresence>

      <BottomActionBar />
      <ProductQuickView />
      <CheckoutSheet />
    </div>
  );
}
