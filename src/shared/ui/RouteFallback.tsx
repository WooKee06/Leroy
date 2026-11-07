import styles from "./RouteFallback.module.scss";

/**
 * Показывается, пока грузится JS-чанк ленивой страницы. Чанки маленькие и
 * после первого визита кэшируются, поэтому обычно fallback не виден.
 */
export default function RouteFallback() {
  return (
    <div className="page-wrapper" aria-busy="true">
      <div className={styles.wrap}>
        <span className={styles.spinner} />
      </div>
    </div>
  );
}
