import styles from "./AppLoader.module.scss";

/** Neutral full-screen loading state used by route guards. */
export default function AppLoader({ label = "Загружаем…" }: { label?: string }) {
  return (
    <div className={styles.loader} role="status" aria-live="polite">
      <span className={styles.spinner} />
      <span>{label}</span>
    </div>
  );
}
