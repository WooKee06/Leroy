import { lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import Layout from '@widgets/layout/Layout';
import TonConnectBridge from '@widgets/ton/TonConnectBridge';
import HomePage from '@pages/home/HomePage';
import LoginGate from '@widgets/auth/LoginGate';

const TON_MANIFEST_URL =
  (import.meta.env.VITE_TON_MANIFEST_URL as string | undefined) ??
  `${window.location.origin}/tonconnect-manifest.json`;

/**
 * Route-level code splitting: главная (самый частый вход) остаётся в основном
 * бандле, остальные страницы грузятся отдельными чанками. После первой
 * отрисовки прогреваем их в фоне, поэтому переходы по табам ощущаются
 * мгновенными, но стартовый JS остаётся маленьким.
 */
const pageLoaders = {
  product: () => import('@pages/product/ProductPage'),
  store: () => import('@pages/store/StorePage'),
  cart: () => import('@pages/cart/CartPage'),
  profile: () => import('@pages/profile/ProfilePage'),
  settings: () => import('@pages/settings/SettingsPage'),
  addresses: () => import('@pages/addresses/AddressesPage'),
  role: () => import('@pages/role/RolePage'),
  stores: () => import('@pages/stores/StoresPage'),
  favorites: () => import('@pages/favorites/FavoritesPage'),
  myStore: () => import('@pages/myStore/MyStorePage'),
  storeEdit: () => import('@pages/storeEdit/StoreEditPage'),
  orders: () => import('@pages/orders/OrdersPage'),
  orderDetail: () => import('@pages/orders/OrderDetailPage'),
  discover: () => import('@pages/discover/DiscoverPage'),
  balance: () => import('@pages/balance/BalancePage'),
  gifts: () => import('@pages/gifts/GiftsPage'),
  paymentMethods: () => import('@pages/paymentMethods/PaymentMethodsPage'),
};

const ProductPage = lazy(pageLoaders.product);
const StorePage = lazy(pageLoaders.store);
const CartPage = lazy(pageLoaders.cart);
const ProfilePage = lazy(pageLoaders.profile);
const SettingsPage = lazy(pageLoaders.settings);
const AddressesPage = lazy(pageLoaders.addresses);
const RolePage = lazy(pageLoaders.role);
const StoresPage = lazy(pageLoaders.stores);
const FavoritesPage = lazy(pageLoaders.favorites);
const MyStorePage = lazy(pageLoaders.myStore);
const StoreEditPage = lazy(pageLoaders.storeEdit);
const OrdersPage = lazy(pageLoaders.orders);
const OrderDetailPage = lazy(pageLoaders.orderDetail);
const DiscoverPage = lazy(pageLoaders.discover);
const BalancePage = lazy(pageLoaders.balance);
const GiftsPage = lazy(pageLoaders.gifts);
const PaymentMethodsPage = lazy(pageLoaders.paymentMethods);

const PREFETCH_AFTER_IDLE = [
  pageLoaders.product,
  pageLoaders.cart,
  pageLoaders.stores,
  pageLoaders.profile,
  pageLoaders.favorites,
  pageLoaders.discover,
  pageLoaders.myStore,
  pageLoaders.storeEdit,
  pageLoaders.orders,
  pageLoaders.orderDetail,
  pageLoaders.settings,
  pageLoaders.addresses,
  pageLoaders.role,
  pageLoaders.balance,
  pageLoaders.gifts,
  pageLoaders.paymentMethods,
];

export default function App() {
  useEffect(() => {
    const prefetch = () => {
      for (const load of PREFETCH_AFTER_IDLE) void load();
    };

    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(prefetch, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }

    const id = window.setTimeout(prefetch, 1500);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <TonConnectUIProvider manifestUrl={TON_MANIFEST_URL}>
      <TonConnectBridge />
      <BrowserRouter>
        <LoginGate />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<Navigate to="/discover" replace />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/stores" element={<StoresPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/store/:id" element={<StorePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/balance" element={<BalancePage />} />
            <Route path="/gifts" element={<GiftsPage />} />
            <Route path="/payment-methods" element={<PaymentMethodsPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/my-store" element={<MyStorePage />} />
            <Route path="/my-store/edit" element={<StoreEditPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/addresses" element={<AddressesPage />} />
            <Route path="/role" element={<RolePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TonConnectUIProvider>
  );
}
