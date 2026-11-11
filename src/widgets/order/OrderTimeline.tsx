import type { ReactNode } from "react";
import {
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiPackage,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";
import type { OrderEventDto } from "@shared/api/models";
import { orderEventLabel } from "@shared/lib/orders";
import styles from "./OrderTimeline.module.scss";

const EVENT_ICONS: Record<string, ReactNode> = {
  created: <FiClock size={15} />,
  paid: <FiCheckCircle size={15} />,
  accepted: <FiCheck size={15} />,
  preparing: <FiPackage size={15} />,
  ready_for_delivery: <FiPackage size={15} />,
  shipped: <FiTruck size={15} />,
  delivered: <FiCheckCircle size={15} />,
  completed: <FiCheck size={15} />,
  cancelled: <FiXCircle size={15} />,
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function formatEventDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

interface Props {
  events: OrderEventDto[];
}

/** Append-only order timeline rendered from GET /orders/:id/events. */
export default function OrderTimeline({ events }: Props) {
  if (events.length === 0) return null;

  return (
    <div className={styles.timeline}>
      {events.map((event, index) => {
        const cancelled = event.type === "cancelled";
        const reason =
          typeof event.data?.reason === "string" ? event.data.reason : "";

        return (
          <div
            key={event.id}
            className={`${styles.row} ${
              index === events.length - 1 ? styles.last : ""
            }`}
          >
            <span
              className={`${styles.dot} ${cancelled ? styles.dotCancelled : ""}`}
            >
              {EVENT_ICONS[event.type] ?? <FiClock size={15} />}
            </span>
            <div className={styles.body}>
              <span className={styles.label}>{orderEventLabel(event.type)}</span>
              {reason && <span className={styles.note}>{reason}</span>}
            </div>
            <span className={styles.date}>{formatEventDate(event.createdAt)}</span>
          </div>
        );
      })}
    </div>
  );
}
