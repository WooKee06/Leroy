import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
  if (!show) return null;

  const renderLeft = () => {
    if (shape.left === "qty") {
      return (
        <div className={styles.qty}>
          <motion.button
            className={styles.qtyBtn}
            onClick={() => productBarStore.dec()}
            whileTap={{ scale: 0.88 }}
            aria-label="Меньше"
          >
            <FiMinus size={16} />
          </motion.button>
          <span className={styles.qtyValue}>{productBarStore.qty}</span>
          <motion.button
            className={styles.qtyBtn}
            onClick={() => productBarStore.inc()}
            whileTap={{ scale: 0.88 }}
            aria-label="Больше"
          >
            <FiPlus size={16} />
          </motion.button>
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
        <motion.button
          className={styles.cartBtn}
          onClick={() => productBarStore.toggleCart()}
          whileTap={{ scale: 0.88 }}
          animate={{ backgroundColor: inCart ? "#34c759" : "#ffffff" }}
          transition={{ duration: 0.2 }}
          aria-label={inCart ? "В корзине" : "В корзину"}
        >
          <motion.span
            key={inCart ? "added" : "add"}
            className={styles.cartIcon}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.14 }}
          >
            {inCart ? <FiCheck size={22} /> : <FiShoppingCart size={22} />}
          </motion.span>
        </motion.button>
      );
    }
    if (shape.right === "order") {
      return (
        <button
          className={styles.orderBtn}
          onClick={() => {}}
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
    <motion.div
      className={styles.bar}
      initial={{ filter: "blur(5px)", opacity: 0 }}
      animate={{ filter: "blur(0px)", opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      <div className={styles.left}>{renderLeft()}</div>

      <div className={styles.center}>
        {shape.left === "qty" && (
          <span className={styles.totalLabel}>
            {productBarStore.totalLabel} ₽
          </span>
        )}
      </div>

      <div className={styles.right}>{renderRight()}</div>
    </motion.div>
  );
}

export default observer(BottomActionBar);
