import type { ReactNode } from "react";
import styles from "./PageContainer.module.scss";

interface Props {
  children: ReactNode;
}

export default function PageContainer({ children }: Props) {
  return <div className={styles.container}>{children}</div>;
}