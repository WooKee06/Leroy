import styles from './RatingStars.module.scss';

interface Props {
  rating: number;
  size?: number;
}

export default function RatingStars({ rating, size = 14 }: Props) {
  const filled = Math.round(rating);
  return (
    <div className={styles.ratingStars} aria-label={`Рейтинг ${rating} из 5`}>
      <div className={styles.ratingStarsStarRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={
              i <= filled
                ? styles.ratingStarsStarFilled
                : styles.ratingStarsStar
            }
            style={{ fontSize: size }}
          >
            ★
          </span>
        ))}
      </div>
      <span className={styles.ratingStarsValue}>{rating.toFixed(1)}</span>
    </div>
  );
}
