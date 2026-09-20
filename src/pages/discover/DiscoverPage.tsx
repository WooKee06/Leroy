import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { catalogStore } from "@shared/stores/catalogStore";
import PageContainer from "@shared/ui/PageContainer";
import PageHeader from "@shared/ui/PageHeader";
import CategoriesScroll from "@widgets/home/CategoriesScroll/CategoriesScroll";
import PromoSlider from "@widgets/home/PromoSlider/PromoSlider";
import PopularStores from "@widgets/home/PopularStores/PopularStores";
import FeaturedProducts from "@widgets/home/FeaturedProducts/FeaturedProducts";
import styles from "./DiscoverPage.module.scss";

function DiscoverPage() {
  const [active, setActive] = useState("all");

  useEffect(() => {
    void catalogStore.load();
  }, []);

  const filtered =
    active === "all"
      ? catalogStore.products
      : catalogStore.products.filter((p) => p.category === active);

  return (
    <div className={`page-wrapper ${styles.page}`}>
      <PageContainer>
        <PageHeader title="Каталог" />

        <CategoriesScroll active={active} onChange={setActive} />

        {active === "all" && (
          <div className={styles.banners}>
            <PromoSlider />
          </div>
        )}

        {filtered.length > 0 ? (
          <section className={styles.gridSection}>
            <h2 className={styles.sectionTitle}>
              {active === "all" ? "Популярное" : catalogStore.categoryName(active)}
            </h2>
            <FeaturedProducts products={filtered} variant="grid" />
          </section>
        ) : (
          <p className={styles.empty}>Товары загружаются…</p>
        )}

        {active === "all" && (
          <div className={styles.storesBlock}>
            <PopularStores />
          </div>
        )}
      </PageContainer>
    </div>
  );
}

export default observer(DiscoverPage);