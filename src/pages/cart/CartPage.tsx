import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { FiChevronRight, FiShoppingBag } from "react-icons/fi";
import { cartStore } from "@shared/stores/cartStore";
import PageContainer from "@shared/ui/PageContainer";
import styles from "./CartPage.module.scss";

function CartPage() {
  const navigate = useNavigate();

  useEffect(() => {
    void cartStore.load();
  }, []);

  const isEmpty = cartStore.items.length === 0;
  const loading = cartStore.loading && isEmpty;
  const sellers = cartStore.itemsBySeller;

  if (loading) {
    return (
      <div className={`page-wrapper ${styles.cartPage}`}>
        <PageContainer>
          <h1 className={styles["cartPage-heading"]}>Корзина</h1>
          <p style={{ color: "var(--text-secondary)", textAlign: "center", paddingTop: 24 }}>
            Загрузка…
          </p>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className={`page-wrapper ${styles.cartPage}`}>
      <PageContainer>
        <h1 className={styles["cartPage-heading"]}>Корзина</h1>

        {isEmpty ? (
          <div className={styles["cartPage-empty"]}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                background: "var(--bg-surface-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-secondary)",
                fontSize: 32,
              }}
            >
              <FiShoppingBag size={32} />
            </div>
            <div>
              <h2>Корзина пуста</h2>
              <p>Найдите то, что вам понравится</p>
            </div>
            <button
              className={styles["cartPage-empty-btn"]}
              onClick={() => navigate("/")}
            >
              Начать покупки
            </button>
          </div>
        ) : (
          <>
            <div className={styles["cartPage-sellers"]}>
              {Array.from(sellers.entries()).map(([sellerId, items]) => {
                const seller = items[0].product.seller;
                return (
                  <div
                    key={sellerId}
                    className={styles["cartPage-seller-block"]}
                  >
                    <button
                      className={styles["cartPage-seller"]}
                      onClick={() => navigate(`/store/${seller.id}`)}
                    >
                      <span className={styles["cartPage-seller-name"]}>
                        {seller.name}
                      </span>
                      <FiChevronRight size={18} style={{ color: "var(--text-tertiary)" }} />
                    </button>

                    <div className={styles["cartPage-items"]}>
                      <AnimatePresence initial={false}>
                        {items.map((item) => (
                          <motion.div
                            key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                            layout
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className={styles["cartPage-item"]}
                          >
                            <div className={styles["cartPage-item-top"]}>
                              <div
                                className={styles["cartPage-item-image-wrap"]}
                              >
                                <img
                                  className={styles["cartPage-item-image"]}
                                  src={item.product.image}
                                  alt={item.product.name}
                                />
                              </div>

                              <div className={styles["cartPage-item-info"]}>
                                <span className={styles["cartPage-item-name"]}>
                                  {item.product.name}
                                </span>
                                <span
                                  className={styles["cartPage-item-variant"]}
                                >
                                  {[
                                    item.selectedSize
                                      ? `Size : ${item.selectedSize}`
                                      : "",
                                    item.selectedColor
                                      ? `Color : ${item.selectedColor}`
                                      : "",
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </span>
                                <span className={styles["cartPage-item-price"]}>
                                  {item.product.price.toLocaleString("ru-RU")} ₽
                                </span>
                              </div>

                              <span className={styles["cartPage-item-qty"]}>
                                ×{item.quantity}
                              </span>
                            </div>

                            <div className={styles["cartPage-item-divider"]} />

                            <div className={styles["cartPage-item-bottom"]}>
                              <div className={styles["cartPage-item-total"]}>
                                <span
                                  className={
                                    styles["cartPage-item-total-label"]
                                  }
                                >
                                  Estimate Total
                                </span>
                                <span
                                  className={
                                    styles["cartPage-item-total-value"]
                                  }
                                >
                                  {(
                                    item.product.price * item.quantity
                                  ).toLocaleString("ru-RU")}{" "}
                                  ₽
                                </span>
                              </div>
                              <div className={styles["cartPage-item-actions"]}>
                                <button
                                  className={styles["cartPage-item-order-btn"]}
                                  onClick={() => {}}
                                >
                                  Order Received
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles["cartPage-summary"]}>
              <div className={styles["cartPage-summary-row"]}>
                <span className={styles["cartPage-summary-row-label"]}>
                  Товары
                </span>
                <span className={styles["cartPage-summary-row-value"]}>
                  {cartStore.subtotal.toLocaleString("ru-RU")} ₽
                </span>
              </div>
              <div className={styles["cartPage-summary-row"]}>
                <span className={styles["cartPage-summary-row-label"]}>
                  Доставка
                </span>
                <span
                  className={`${styles["cartPage-summary-row-value"]} ${
                    cartStore.delivery === 0
                      ? styles["cartPage-summary-row-free"]
                      : ""
                  }`}
                >
                  {cartStore.delivery === 0
                    ? "Бесплатно"
                    : `${cartStore.delivery.toLocaleString("ru-RU")} ₽`}
                </span>
              </div>
              <div
                className={`${styles["cartPage-summary-row"]} ${styles["cartPage-summary-row-total"]}`}
              >
                <span className={styles["cartPage-summary-row-label"]}>
                  Итого
                </span>
                <span className={styles["cartPage-summary-row-value"]}>
                  {cartStore.total.toLocaleString("ru-RU")} ₽
                </span>
              </div>
            </div>
          </>
        )}
      </PageContainer>
    </div>
  );
}

export default observer(CartPage);
