import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@widgets/layout/Layout';
import HomePage from '@pages/home/HomePage';
import SearchPage from '@pages/search/SearchPage';
import ProductPage from '@pages/product/ProductPage';
import StorePage from '@pages/store/StorePage';
import CartPage from '@pages/cart/CartPage';
import ProfilePage from '@pages/profile/ProfilePage';
import StoresPage from '@pages/stores/StoresPage';
import FavoritesPage from '@pages/favorites/FavoritesPage';
import { DiscoverPlaceholder } from '@pages/placeholders';

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
          <Route path="/discover" element={<DiscoverPlaceholder />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
