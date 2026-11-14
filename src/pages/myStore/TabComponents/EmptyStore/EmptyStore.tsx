import PageContainer from "@/shared/ui/PageContainer";
import styles from "./EmptyStore.module.scss";
import { FiPlus, FiShoppingBag } from "react-icons/fi";
import { StoreCreateSheet } from "@/widgets/store/CreateSheets";
import { sellerStore } from "@/shared/stores/sellerStore";

type Props = {
  setStoreOpen: (open: boolean) => void;
  storeOpen: boolean;
};

const EmptyStore = ({ setStoreOpen, storeOpen }: Props) => {
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
        onDone={(store) => {
          setStoreOpen(false);
          if (store) {
            sellerStore.setStore(store);
          } else {
            void sellerStore.refresh();
          }
        }}
      />
    </div>
  );
};

export default EmptyStore;
