import type { ReactNode } from "react";
import {
  FiCheck,
  FiCheckCircle,
  FiClock,
  FiPackage,
  FiTruck,
  FiXCircle,
} from "react-icons/fi";
import type { Order, OrderEventDto } from "@shared/api/models";
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

const FLOW: string[] = [
  "created",
  "paid",
  "accepted",
  "preparing",
  "ready_for_delivery",
  "shipped",
  "delivered",
  "completed",
];

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  created: 0,
  paid: 1,
  accepted: 2,
  preparing: 3,
  ready_for_delivery: 4,
  shipped: 5,
  delivered: 6,
  completed: 7,
  cancelled: -1,
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function formatEventDate(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : dateFormatter.format(date);
}

function stageDate(
  stage: string,
  order: Order,
  events: OrderEventDto[],
): string {
  const event = events.find((e) => e.type === stage);
  if (event?.createdAt) return event.createdAt;

  switch (stage) {
    case "created":
      return order.createdAt;
    case "paid":
      return order.paidAt ?? "";
    case "shipped":
      return order.shippedAt ?? "";
    case "delivered":
      return order.deliveredAt ?? "";
    default:
      return "";
  }
}

interface Props {
  order: Order;
  events: OrderEventDto[];
}

/** Full order timeline: all stages are visible, actual events fill in dates. */
export default function OrderTimeline({ order, events }: Props) {
  const currentIndex = STATUS_INDEX[order.status] ?? 0;
  const isCancelled = order.status === "cancelled";

  const stages = isCancelled
    ? ["created", "cancelled"]
    : FLOW.slice(0, Math.max(1, currentIndex + 1));

  return (
    <div className={styles.timeline}>
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;
        const date = stageDate(stage, order, events);
        const reason =
          stage === "cancelled" && typeof order.cancelReason === "string"
            ? order.cancelReason
            : "";

        return (
          <div
            key={stage}
            className={`${styles.row} ${isLast ? styles.last : ""}`}
          >
            <span
              className={`${styles.dot} ${
                stage === "cancelled" ? styles.dotCancelled : ""
              }`}
            >
              {EVENT_ICONS[stage] ?? <FiClock size={15} />}
            </span>
            <div className={styles.body}>
              <span className={styles.label}>{orderEventLabel(stage)}</span>
              {reason && <span className={styles.note}>{reason}</span>}
            </div>
            <span className={styles.date}>{formatEventDate(date)}</span>
          </div>
        );
      })}
    </div>
  );
}
