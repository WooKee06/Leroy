import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShare } from 'react-icons/fi';
import styles from './PageHeader.module.scss';

interface Props {
  title?: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
  showShare?: boolean;
  onShare?: () => void;
}

export default function PageHeader({ title, onBack, trailing, showShare, onShare }: Props) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={styles.pageHeader}>
      <button className={styles.pageHeaderIconBtn} onClick={handleBack} aria-label="Назад">
        <FiArrowLeft size={24} />
      </button>

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
