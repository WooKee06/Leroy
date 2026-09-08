import { motion } from "framer-motion";
import type { Product } from "@shared/api/mockData";
import ProductCard from "@widgets/product/ProductCard";
import styles from "./FeaturedProducts.module.scss";

interface Props {
  products: Product[];
  variant?: "hero" | "grid";
}

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

export default function FeaturedProducts({
  products,
  variant = "hero",
}: Props) {
  const isGrid = variant === "grid";

  return (
    <section className={styles.featuredProducts}>
      <motion.div
        className={styles.featuredProductsGrid}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {products.slice(0, isGrid ? 8 : 4).map((product) => (
          <motion.div key={product.id} variants={item}>
            <ProductCard product={product} variant="medium" />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
