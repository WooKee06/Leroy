import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";
import styles from "./Items.module.scss";
import { useMemo } from "react";
import { mapProduct } from "@/shared/api/models";
import { sellerStore } from "@/shared/stores/sellerStore";
import ProductCard from "@/widgets/product/ProductCard";

type Props = {
  setEditingProduct: (product: any) => void;
  setProductOpen: (open: boolean) => void;
  handleDeleteProduct: (productId: string) => Promise<void>;
};

const Items = ({
  setEditingProduct,
  setProductOpen,
  handleDeleteProduct,
}: Props) => {
  const seller = sellerStore.seller;
  const products = sellerStore.products;

  const mappedProducts = useMemo(
    () => products.map((p) => mapProduct(p, seller ?? undefined)),
    [products, seller],
  );

  return (
    <>
      <button
        className={styles.addBtn}
        onClick={() => {
          setEditingProduct(undefined);
          setProductOpen(true);
        }}
      >
        <FiPlus size={18} /> Добавить товар
      </button>
      <div className={styles.productGrid}>
        {mappedProducts.map((product, index) => (
          <div key={product.id} className={styles.productWrap}>
            <ProductCard product={product} variant="medium" />
            <div className={styles.productActions}>
              <button
                type="button"
                className={styles.productAction}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingProduct(products[index]);
                  setProductOpen(true);
                }}
                aria-label="Редактировать"
              >
                <FiEdit2 size={14} />
              </button>
              <button
                type="button"
                className={`${styles.productAction} ${styles.productActionDanger}`}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDeleteProduct(product.id);
                }}
                aria-label="Удалить"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default Items;
