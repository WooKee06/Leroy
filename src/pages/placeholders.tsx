import styles from "./Placeholders.module.scss";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className={styles.placeholderPage}>
      <h2>{title}</h2>
      <p>Скоро здесь появится новый экран</p>
    </div>
  );
}

export const DiscoverPlaceholder = () => <PlaceholderPage title="Каталог" />;
export const FavoritesPlaceholder = () => <PlaceholderPage title="Избранное" />;