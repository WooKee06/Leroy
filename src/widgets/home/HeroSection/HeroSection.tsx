import type { ReactNode } from "react";
import styles from "./HeroSection.module.scss";

interface Props {
  children?: ReactNode;
}

export default function HeroSection({ children }: Props) {
  return (
    <div className={styles.heroSection}>
      <h1 className={styles.heroSectionTitle}>
        Всё, что вам нужно, уже внутри Telegram!
      </h1>
      {children}
    </div>
  );
}
