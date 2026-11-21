import { lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@widgets/layout/Layout';
import AdminLayout from '@widgets/admin/AdminLayout/AdminLayout';
import HomePage from '@pages/home/HomePage';
import LoginGate from '@widgets/auth/LoginGate';
import RequireRole from '@shared/guards/RequireRole';
import RequireAdmin from '@shared/guards/RequireAdmin';

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
  adminLogin: () => import('@pages/admin/AdminLoginPage'),
  adminOverview: () => import('@pages/admin/AdminOverviewPage'),
  adminModeration: () => import('@pages/admin/AdminModerationPage'),
  adminProductDetail: () => import('@pages/admin/AdminProductDetailPage'),
  adminSellers: () => import('@pages/admin/AdminSellersPage'),
  adminSellerDetail: () => import('@pages/admin/AdminSellerDetailPage'),
  adminComplaints: () => import('@pages/admin/AdminComplaintsPage'),
  adminComplaintDetail: () => import('@pages/admin/AdminComplaintDetailPage'),
  adminCatalog: () => import('@pages/admin/AdminCatalogPage'),
  adminOrders: () => import('@pages/admin/AdminOrdersPage'),
  adminUsers: () => import('@pages/admin/AdminUsersPage'),
  adminUserDetail: () => import('@pages/admin/AdminUserDetailPage'),
  adminCategories: () => import('@pages/admin/AdminCategoriesPage'),
  adminAudit: () => import('@pages/admin/AdminAuditPage'),
  adminSettings: () => import('@pages/admin/AdminSettingsPage'),
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
const AdminLoginPage = lazy(pageLoaders.adminLogin);
const AdminOverviewPage = lazy(pageLoaders.adminOverview);
const AdminModerationPage = lazy(pageLoaders.adminModeration);
const AdminProductDetailPage = lazy(pageLoaders.adminProductDetail);
const AdminSellersPage = lazy(pageLoaders.adminSellers);
const AdminSellerDetailPage = lazy(pageLoaders.adminSellerDetail);
const AdminComplaintsPage = lazy(pageLoaders.adminComplaints);
const AdminComplaintDetailPage = lazy(pageLoaders.adminComplaintDetail);
const AdminCatalogPage = lazy(pageLoaders.adminCatalog);
const AdminOrdersPage = lazy(pageLoaders.adminOrders);
const AdminUsersPage = lazy(pageLoaders.adminUsers);
const AdminUserDetailPage = lazy(pageLoaders.adminUserDetail);
const AdminCategoriesPage = lazy(pageLoaders.adminCategories);
const AdminAuditPage = lazy(pageLoaders.adminAudit);
const AdminSettingsPage = lazy(pageLoaders.adminSettings);

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
    <BrowserRouter>
      <LoginGate />
      <Routes>
        {/* Admin: отдельный layout и отдельная защита, вне пользовательского UI. */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminOverviewPage />} />
            <Route path="/admin/moderation" element={<AdminModerationPage />} />
            <Route path="/admin/moderation/:id" element={<AdminProductDetailPage />} />
            <Route path="/admin/catalog" element={<AdminCatalogPage />} />
            <Route path="/admin/catalog/:id" element={<AdminProductDetailPage />} />
            <Route path="/admin/sellers" element={<AdminSellersPage />} />
            <Route path="/admin/sellers/:id" element={<AdminSellerDetailPage />} />
            <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
            <Route path="/admin/complaints/:id" element={<AdminComplaintDetailPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
            <Route path="/admin/categories" element={<AdminCategoriesPage />} />
            <Route path="/admin/audit" element={<AdminAuditPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Route>

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

          {/* Зона продавца: /my-store и /my-store/edit */}
          <Route element={<RequireRole roles={['seller']} />}>
            <Route path="/my-store" element={<MyStorePage />} />
            <Route path="/my-store/edit" element={<StoreEditPage />} />
          </Route>

          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/addresses" element={<AddressesPage />} />
          {/* Смена роли — только для авторизованных. Повышение до admin
              сервер всё равно запрещает (AuthService.updateRole). */}
          <Route element={<RequireRole />}>
            <Route path="/role" element={<RolePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
