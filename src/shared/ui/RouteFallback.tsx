import { useLocation } from "react-router-dom";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";
import styles from "./RouteFallback.module.scss";

const PAGE_TITLES: Record<
  string,
  { label: string; centered?: boolean } | undefined
> = {
  "/discover": { label: "Каталог", centered: true },
  "/stores": { label: "Магазины" },
  "/cart": { label: "Корзина" },
  "/favorites": { label: "Избранное" },
  "/settings": { label: "Настройки" },
  "/addresses": { label: "Адреса доставки", centered: true },
  "/my-store/edit": { label: "Редактирование магазина" },
  "/orders": { label: "Мои заказы", centered: true },
  "/balance": { label: "Баланс", centered: true },
  "/gifts": { label: "Подарки", centered: true },
  "/payment-methods": { label: "Способы оплаты", centered: true },
  "/role": { label: "Роль" },
};

/**
 * Показывается, пока грузится JS-чанк ленивой страницы. Заголовок маршрута
 * известен заранее, поэтому рисуем его сразу — без «пустого» заголовка,
 * который появляется только после загрузки.
 */
export default function RouteFallback() {
  const location = useLocation();
  const stateOrderNumber = (
    location.state as { orderNumber?: number } | null
  )?.orderNumber;

  let pageTitle = PAGE_TITLES[location.pathname];
  if (!pageTitle) {
    if (location.pathname.startsWith("/orders/")) {
      pageTitle = {
        label: stateOrderNumber ? `Заказ №${stateOrderNumber}` : "Заказ",
        centered: true,
      };
    } else if (location.pathname.startsWith("/product/")) {
      pageTitle = { label: "Товар" };
    } else if (location.pathname.startsWith("/store/")) {
      pageTitle = { label: "Магазин" };
    }
  }

  return (
    <div className="page-wrapper" aria-busy="true">
      <PageContainer>
        {pageTitle &&
          (pageTitle.centered ? (
            <PageHeader title={pageTitle.label} />
          ) : (
            <h1 className={styles.title}>{pageTitle.label}</h1>
          ))}
        <div className={styles.body}>
          <span className={styles.spinner} />
        </div>
      </PageContainer>
    </div>
  );
}
