import type { CSSProperties } from "react";
import styles from "./Skeleton.module.scss";

interface Props {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  radius?: CSSProperties["borderRadius"];
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function Skeleton({
  width,
  height,
  radius,
  circle = false,
  className,
  style,
}: Props) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.skeleton}${circle ? ` ${styles.circle}` : ""}${
        className ? ` ${className}` : ""
      }`}
      style={{
        width,
        height,
        borderRadius: circle ? "50%" : radius,
        ...style,
      }}
    />
  );
}
