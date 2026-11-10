import styles from "./SoonBadge.module.scss";

interface SoonBadgeProps {
  className?: string;
}

export default function SoonBadge({ className }: SoonBadgeProps) {
  return (
    <span className={`${styles.badge}${className ? ` ${className}` : ""}`}>
      скоро
    </span>
  );
}
