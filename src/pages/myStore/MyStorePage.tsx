import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { FiCheck, FiEdit2, FiPlus, FiShoppingBag } from "react-icons/fi";
import type { ProductDto, RawSellerOrder } from "@shared/api/models";

import { leroyApi } from "@shared/api/leroyApi";
import { sellerStore } from "@shared/stores/sellerStore";

import PageContainer from "@shared/ui/PageContainer";
import { StorePageSkeleton } from "@shared/ui/Skeletons";
import SellerOrderSheet from "@widgets/seller/SellerOrderSheet";
import {
  ProductFormSheet,
  StoreCreateSheet,
} from "@widgets/store/CreateSheets";
import styles from "./MyStorePage.module.scss";
import Items from "./TabComponents/Items/Items";
import Orders from "./TabComponents/Orders/Orders";
import Balance from "./TabComponents/Balance/Balance";
import Tabs from "./TabComponents/Tabs/Tabs";

type Tab = "items" | "orders" | "balance";

const formatCompact = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

const formatMoney = (value: number | string) =>
  `${Number(value || 0).toLocaleString("ru-RU")} ₽`;

const formatDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("ru-RU");
};

const MyStorePage = observer(function MyStorePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("items");
  const [storeOpen, setStoreOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDto | undefined>(
    undefined,
  );
  const [selectedOrder, setSelectedOrder] = useState<RawSellerOrder | null>(
    null,
  );
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    void sellerStore.ensureLoaded();
  }, []);

  useEffect(() => {
    if (tab === "orders") void sellerStore.loadOrders();
    if (tab === "balance") void sellerStore.loadBalance();
  }, [tab]);

  const seller = sellerStore.seller;
  const dashboard = sellerStore.dashboard;

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Удалить товар?")) return;
    try {
      await leroyApi.deleteProduct(id);
      sellerStore.removeProduct(id);
    } catch {
      // ignore
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setStatusLoading(true);
    try {
      const updated = await leroyApi.updateSellerOrderStatus(orderId, status);
      sellerStore.updateOrder(updated);
      setSelectedOrder((current) =>
        current?.id === orderId ? updated : current,
      );
    } catch {
      // ignore
    } finally {
      setStatusLoading(false);
    }
  };

  const handleProductDone = () => {
    setProductOpen(false);
    void sellerStore.refreshProducts();
  };

  if (sellerStore.loading && !sellerStore.loaded) {
    return (
      <div className={styles.page}>
        <StorePageSkeleton />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className={`page-wrapper ${styles.page}`}>
        <PageContainer>
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <FiShoppingBag size={28} />
            </div>
            <div>
              <h1>Магазин ещё не создан</h1>
              <p>Создайте магазин и добавьте первые товары</p>
            </div>
            <button
              className={styles.emptyBtn}
              onClick={() => setStoreOpen(true)}
            >
              <FiPlus size={18} /> Создать магазин
            </button>
          </div>
        </PageContainer>

        <StoreCreateSheet
          open={storeOpen}
          onClose={() => setStoreOpen(false)}
          onDone={() => {
            setStoreOpen(false);
            void sellerStore.refresh();
          }}
        />
      </div>
    );
  }

  const stats = [
    { value: formatCompact(dashboard?.totalOrders ?? 0), label: "Заказов" },
    { value: dashboard?.totalProducts ?? 0, label: "Товаров" },
    { value: Number(dashboard?.rating ?? 0).toFixed(1), label: "Рейтинг" },
    { value: formatCompact(dashboard?.productViews ?? 0), label: "Просмотров" },
    { value: formatMoney(dashboard?.balance ?? 0), label: "Баланс" },
  ];

  return (
    <div className={styles.page}>
      <PageContainer>
        <div className={styles.sellerHeader}>
          <img
            className={styles.sellerAvatar}
            src={seller.avatar}
            alt={seller.name}
          />
          <div className={styles.sellerInfo}>
            <div className={styles.sellerNameRow}>
              <h1 className={styles.sellerName}>{seller.name}</h1>
              {seller.verified && (
                <span className={styles.verifiedBadge}>
                  <FiCheck size={14} />
                </span>
              )}
            </div>
            <p className={styles.sellerDesc}>{seller.description}</p>
          </div>
          <button
            className={styles.editStoreBtn}
            onClick={() => navigate("/my-store/edit")}
          >
            <FiEdit2 size={16} /> Редактировать
          </button>
        </div>

        <div className={styles.statsGrid}>
          {stats.map((s) => (
            <div className={styles.statCard} key={s.label}>
              <div className={styles.statCardValue}>{s.value}</div>
              <div className={styles.statCardLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <Tabs tab={tab} setTab={setTab} />

        <div className={styles.tabContent}>
          {tab === "items" && (
            <Items
              setEditingProduct={setEditingProduct}
              setProductOpen={setProductOpen}
              handleDeleteProduct={handleDeleteProduct}
            />
          )}

          {tab === "orders" && (
            <Orders
              formatDate={formatDate}
              formatMoney={formatMoney}
              setSelectedOrder={setSelectedOrder}
            />
          )}

          {tab === "balance" && (
            <Balance formatDate={formatDate} formatMoney={formatMoney} />
          )}
        </div>
      </PageContainer>

      <SellerOrderSheet
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleUpdateStatus}
        loading={statusLoading}
      />

      <ProductFormSheet
        open={productOpen}
        onClose={() => setProductOpen(false)}
        onDone={handleProductDone}
        mode={editingProduct ? "edit" : "create"}
        initialProduct={editingProduct}
      />
    </div>
  );
});

export default MyStorePage;
