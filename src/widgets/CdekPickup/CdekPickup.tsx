import { useEffect, useRef, useState } from "react";
import styles from "./CdekPickup.module.scss";

declare global {
  interface Window {
    CDEKWidget?: new (options: Record<string, unknown>) => {
      open?: () => void;
    };
  }
}

interface PickupPoint {
  code?: string;
  name?: string;
  address?: string;
  city?: string;
}

interface Props {
  onSelect: (point: PickupPoint) => void;
}

export function CdekPickup({ onSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<{ open?: () => void } | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);

  useEffect(() => {
    if (!mapRef.current || !window.CDEKWidget) return;

    const widget = new window.CDEKWidget({
      root: mapRef.current,
      apiKey: "dc220914-4492-4589-9a58-533ac28796d6",
      servicePath: "/api/cdek/service.php",
      from: "Москва",
      defaultLocation: "Москва",
      canChoose: true,
      popup: true,

      onChoose: (type: string, _tariff: unknown, target: PickupPoint) => {
        if (type !== "office") return;

        setSelectedPoint(target);
        onSelect(target);
      },
    });

    widgetRef.current = widget;

    return () => {
      widgetRef.current = null;
    };
  }, [onSelect]);

  return (
    <div className={styles.container}>
      <button type="button" onClick={() => widgetRef.current?.open?.()}>
        {selectedPoint ? "Изменить пункт выдачи" : "Выбрать пункт СДЭК"}
      </button>

      {selectedPoint && (
        <div className={styles.selected}>
          <strong>{selectedPoint.name ?? "Пункт выдачи СДЭК"}</strong>
          <p>{selectedPoint.address}</p>
          <small>Код ПВЗ: {selectedPoint.code}</small>
        </div>
      )}

      <div ref={mapRef} className={styles.map} />
    </div>
  );
}
