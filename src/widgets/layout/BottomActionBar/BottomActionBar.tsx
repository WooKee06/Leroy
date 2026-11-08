import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import {
  FiArrowLeft,
  FiCheck,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiShoppingCart,
} from "react-icons/fi";
import { productBarStore } from "@shared/stores/productBarStore";
import { checkoutStore } from "@shared/stores/checkoutStore";
import styles from "./BottomActionBar.module.scss";

function resolveShape(pathname: string): { left: string; right: string } {
  if (pathname.startsWith("/product/")) return { left: "qty", right: "cart" };
  if (pathname === "/cart") return { left: "back", right: "order" };
  return { left: "", right: "" };
}

function BottomActionBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const shape = resolveShape(location.pathname);

  const show = shape.left !== "" || shape.right !== "";

  const renderLeft = () => {
    if (shape.left === "qty") {
      return (
        <div className={styles.qty}>
          <button
            className={styles.qtyBtn}
            onClick={() => productBarStore.dec()}
            aria-label="Меньше"
          >
            <FiMinus size={16} />
          </button>
          <span className={styles.qtyValue}>{productBarStore.qty}</span>
          <button
            className={styles.qtyBtn}
            onClick={() => productBarStore.inc()}
            aria-label="Больше"
          >
            <FiPlus size={16} />
          </button>
        </div>
      );
    }
    if (shape.left === "back") {
      return (
        <button
          className={styles.iconBtn}
          onClick={() => navigate(-1)}
          aria-label="Назад"
        >
          <FiArrowLeft size={20} />
        </button>
      );
    }
    return null;
  };

  const renderRight = () => {
    if (shape.right === "cart") {
      const inCart = productBarStore.inCart;
      return (
        <button
          className={`${styles.cartBtn} ${inCart ? styles.cartBtnActive : ""}`}
          onClick={() => productBarStore.toggleCart()}
          aria-label={inCart ? "В корзине" : "В корзину"}
        >
          <span key={inCart ? "added" : "add"} className={styles.cartIcon}>
            {inCart ? <FiCheck size={22} /> : <FiShoppingCart size={22} />}
          </span>
        </button>
      );
    }
    if (shape.right === "order") {
      return (
        <button
          className={styles.orderBtn}
          onClick={() => checkoutStore.show()}
          aria-label="Оформить заказ"
        >
          <FiShoppingBag size={18} />
          Оформить
        </button>
      );
    }
    return null;
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.bar}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.left}>
            <div key={shape.left || "empty"} className={styles.slot}>
              {renderLeft()}
            </div>
          </div>

          <div className={styles.center}>
            {shape.left === "qty" && (
              <span className={styles.totalLabel}>
                {productBarStore.totalLabel} ₽
              </span>
            )}
          </div>

          <div className={styles.right}>
            <div key={shape.right || "empty"} className={styles.slot}>
              {renderRight()}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default observer(BottomActionBar);
