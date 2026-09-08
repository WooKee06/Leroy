import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSliders, FiArrowRight } from "react-icons/fi";
import { motion } from "framer-motion";
import { getProductsByCategory, type Product } from "@shared/api/mockData";
import SearchBar from "@shared/ui/SearchBar";
import PageContainer from "@shared/ui/PageContainer";
import HeroSection from "@widgets/home/HeroSection/HeroSection";
import QuickActions from "@widgets/home/QuickActions/QuickActions";
import BalanceCard from "@widgets/home/BalanceCard/BalanceCard";
// import PopularStores from "@widgets/home/PopularStores/PopularStores";
import FeaturedProducts from "@widgets/home/FeaturedProducts/FeaturedProducts";
import styles from "./HomePage.module.scss";

type FilterId = "all" | "hot" | "new" | "deals" | "stars";

const filters: { id: FilterId; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "hot", label: "Hot" },
  { id: "new", label: "New" },
  { id: "deals", label: "Deals" },
  { id: "stars", label: "За Stars" },
];

function matchesFilter(product: Product, filter: FilterId): boolean {
  switch (filter) {
    case "hot":
      return !!product.isFeatured;
    case "new":
      return !!product.isNew;
    case "deals":
      return typeof product.originalPrice === "number";
    case "stars":
      return product.seller.verified;
    default:
      return true;
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

  const categoryProducts = useMemo(() => getProductsByCategory("all"), []);

  const filteredProducts = useMemo(
    () => categoryProducts.filter((p) => matchesFilter(p, activeFilter)),
    [categoryProducts, activeFilter],
  );

  const featured = useMemo(
    () => filteredProducts.find((p) => p.isFeatured) ?? filteredProducts[0],
    [filteredProducts],
  );

  return (
    <div className="page-wrapper">
      <PageContainer>
        <HeroSection>
          <SearchBar
            value=""
            onChange={() => {}}
            placeholder="Что вы ищете?"
            onFocus={() => navigate("/search")}
            trailing={
              <FiSliders
                onClick={() => navigate("/search")}
                aria-label="Фильтры"
                size={20}
              />
            }
          />
        </HeroSection>

        <QuickActions />
        <BalanceCard />
        {/* <PopularStores /> */}
      </PageContainer>
      <PageContainer>
        <div className={styles.productsHeader}>
          <h2 className={styles.productsTitle}>Популярные товары</h2>
          <button
            className={styles.seeAll}
            onClick={() => navigate("/search")}
            aria-label="Все товары"
          >
            Все
            <FiArrowRight size={14} />
          </button>
        </div>

        <div
          className={styles.filterChips}
          role="tablist"
          aria-label="Фильтры товаров"
        >
          {filters.map((f) => (
            <motion.button
              key={f.id}
              role="tab"
              aria-selected={activeFilter === f.id}
              className={
                activeFilter === f.id
                  ? `${styles.filterChip} ${styles.filterChipActive}`
                  : styles.filterChip
              }
              onClick={() => setActiveFilter(f.id)}
              whileTap={{ scale: 0.94 }}
            >
              {f.label}
            </motion.button>
          ))}
        </div>

        <FeaturedProducts
          products={filteredProducts.filter((p) => p.id !== featured?.id)}
          variant="grid"
        />
      </PageContainer>
    </div>
  );
}
