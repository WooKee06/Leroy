import type { Product } from "@shared/api/models";
import ProductCard from "@widgets/product/ProductCard";
import styles from "./FeaturedProducts.module.scss";

interface Props {
  products: Product[];
  variant?: "hero" | "grid";
}

export default function FeaturedProducts({
  products,
  variant = "hero",
}: Props) {
  const isGrid = variant === "grid";

  return (
    <section className={styles.featuredProducts}>
      <div className={styles.featuredProductsGrid}>
        {products.slice(0, isGrid ? 8 : 4).map((product) => (
          <div key={product.id}>
            <ProductCard product={product} variant="medium" />
          </div>
        ))}
      </div>
    </section>
  );
}
