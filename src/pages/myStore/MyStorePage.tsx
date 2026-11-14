import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { FiCheck, FiEdit2 } from "react-icons/fi";
import type { ProductDto, RawSellerOrder } from "@shared/api/models";

import { leroyApi } from "@shared/api/leroyApi";
import { sellerStore } from "@shared/stores/sellerStore";

import PageContainer from "@shared/ui/PageContainer";
import { StorePageSkeleton } from "@shared/ui/Skeletons";
import SellerOrderSheet from "@widgets/seller/SellerOrderSheet";
import { ProductFormSheet } from "@widgets/store/CreateSheets";
import styles from "./MyStorePage.module.scss";
import Items from "./TabComponents/Items/Items";
import Orders from "./TabComponents/Orders/Orders";
import Balance from "./TabComponents/Balance/Balance";
import Tabs from "./TabComponents/Tabs/Tabs";
import EmptyStore from "./TabComponents/EmptyStore/EmptyStore";
import { FormatMoney } from "@/shared/lib/formatMoney";
import { FormatCompact } from "@/shared/lib/formatCompact";
import { FormatDate } from "@/shared/lib/formatDate";

type Tab = "items" | "orders" | "balance";

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
      console.log("Failed to delete product");
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
      console.log("Failed to update order status");
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
    return <EmptyStore storeOpen={storeOpen} setStoreOpen={setStoreOpen} />;
  }

  const stats = [
    { value: FormatCompact(dashboard?.totalOrders ?? 0), label: "Заказов" },
    { value: dashboard?.totalProducts ?? 0, label: "Товаров" },
    { value: Number(dashboard?.rating ?? 0).toFixed(1), label: "Рейтинг" },
    { value: FormatCompact(dashboard?.productViews ?? 0), label: "Просмотров" },
    { value: FormatMoney(dashboard?.balance ?? 0), label: "Баланс" },
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
              formatDate={FormatMoney}
              formatMoney={FormatMoney}
              setSelectedOrder={setSelectedOrder}
            />
          )}

          {tab === "balance" && (
            <Balance formatDate={FormatDate} formatMoney={FormatMoney} />
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
