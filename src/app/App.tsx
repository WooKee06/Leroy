import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@widgets/layout/Layout';
import HomePage from '@pages/home/HomePage';
import SearchPage from '@pages/search/SearchPage';
import ProductPage from '@pages/product/ProductPage';
import StorePage from '@pages/store/StorePage';
import CartPage from '@pages/cart/CartPage';
import ProfilePage from '@pages/profile/ProfilePage';
import SettingsPage from '@pages/settings/SettingsPage';
import RolePage from '@pages/role/RolePage';
import StoresPage from '@pages/stores/StoresPage';
import FavoritesPage from '@pages/favorites/FavoritesPage';
import MyStorePage from '@pages/myStore/MyStorePage';
import StoreEditPage from '@pages/storeEdit/StoreEditPage';
import OrdersPage from '@pages/orders/OrdersPage';
import OrderDetailPage from '@pages/orders/OrderDetailPage';
import DiscoverPage from '@pages/discover/DiscoverPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/stores" element={<StoresPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/store/:id" element={<StorePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/my-store" element={<MyStorePage />} />
          <Route path="/my-store/edit" element={<StoreEditPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/role" element={<RolePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
