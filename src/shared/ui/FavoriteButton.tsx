import { motion } from 'framer-motion';
import styles from './FavoriteButton.module.scss';

interface Props {
  isActive: boolean;
  onToggle: () => void;
  size?: number;
}

export default function FavoriteButton({ isActive, onToggle, size = 24 }: Props) {
  return (
    <motion.button
      className={`${styles.favoriteButton} ${isActive ? styles.favoriteButtonActive : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      whileTap={{ scale: 0.8 }}
      aria-label={isActive ? 'Убрать из избранного' : 'Добавить в избранное'}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        animate={{ scale: isActive ? 1 : 1 }}
        initial={false}
      >
        <motion.path
          d="M12 21C12 21 3 15.5 3 9.3C3 6.4 5.3 4.5 7.7 4.5C9.2 4.5 10.6 5.3 12 6.8C13.4 5.3 14.8 4.5 16.3 4.5C18.7 4.5 21 6.4 21 9.3C21 15.5 12 21 12 21Z"
          fill={isActive ? '#1A1A1A' : 'none'}
          stroke={isActive ? '#1A1A1A' : '#1A1A1A'}
          strokeWidth="1.8"
          strokeLinejoin="round"
          animate={{ fill: isActive ? '#1A1A1A' : 'none' }}
          transition={{ duration: 0.2 }}
        />
      </motion.svg>
    </motion.button>
  );
}
