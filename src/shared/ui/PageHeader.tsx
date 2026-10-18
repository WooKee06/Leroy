import { FiShare } from "react-icons/fi";
import styles from "./PageHeader.module.scss";

interface Props {
  title?: string;
  trailing?: React.ReactNode;
  showShare?: boolean;
  onShare?: () => void;
}

/**
 * Заголовок страницы.
 *
 * Кнопка «назад» здесь намеренно отсутствует: навигация назад всегда
 * доступна в PersistentHeader (общая фиксированная шапка), поэтому
 * дублировать её в контенте не нужно.
 */
export default function PageHeader({ title, trailing, showShare, onShare }: Props) {
  return (
    <header className={styles.pageHeader}>
      {title && <h1 className={styles.pageHeaderTitle}>{title}</h1>}

      <div className={styles.pageHeaderRight}>
        {showShare && (
          <button
            className={styles.pageHeaderIconBtn}
            onClick={onShare}
            aria-label="Поделиться"
          >
            <FiShare size={22} />
          </button>
        )}
        {trailing}
      </div>
    </header>
  );
}
