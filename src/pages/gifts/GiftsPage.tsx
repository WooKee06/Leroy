import PageContainer from "@shared/ui/PageContainer";
import PageHeader from "@shared/ui/PageHeader";
import styles from "./GiftsPage.module.scss";

export default function GiftsPage() {
  return (
    <div className="page-wrapper">
      <PageContainer>
        <PageHeader title="Подарки" />

        <div className={styles.placeholder}>
          <h2 className={styles.title}>Раздел в разработке</h2>
          <p className={styles.text}>
            Подарки и бонусы появятся совсем скоро. Следите за обновлениями!
          </p>
        </div>
      </PageContainer>
    </div>
  );
}
