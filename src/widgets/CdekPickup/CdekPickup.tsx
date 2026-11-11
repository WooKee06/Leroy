import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { FiChevronLeft, FiSearch, FiX } from "react-icons/fi";
import { useDebounce } from "@shared/lib/hooks/useDebounce";
import {
  getOffices,
  searchCities,
  type CdekCity,
  type CdekOffice,
} from "@shared/api/cdekApi";
import styles from "./CdekPickup.module.scss";

export interface PickupPoint {
  code: string;
  name: string;
  address?: string;
  city?: string;
  /** CDEK location code — needed for server-side delivery quotes. */
  cityCode?: number;
  type?: "PVZ" | "POSTAMAT";
}

interface Props {
  onSelect: (point: PickupPoint) => void;
  /** Fires as soon as a city is chosen, even before a pickup point. */
  onCityChange?: (city: CdekCity) => void;
  /** Показывать карточку выбранного пункта под кнопкой. */
  showSelected?: boolean;
}

const DELIVERY_TYPES = [
  { id: "ALL" as const, label: "Все" },
  { id: "PVZ" as const, label: "ПВЗ" },
  { id: "POSTAMAT" as const, label: "Постаматы" },
];

export function CdekPickup({
  onSelect,
  onCityChange,
  showSelected = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);

  const handleSelect = useCallback(
    (point: PickupPoint) => {
      setSelectedPoint(point);
      onSelect(point);
      setOpen(false);
    },
    [onSelect],
  );

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
      >
        {selectedPoint ? "Изменить пункт выдачи" : "Выбрать пункт СДЭК"}
      </button>

      {showSelected && selectedPoint && (
        <div className={styles.selected}>
          <strong>{selectedPoint.name}</strong>
          <p>
            {selectedPoint.city && `${selectedPoint.city}, `}
            {selectedPoint.address}
          </p>
          <small>Код ПВЗ: {selectedPoint.code}</small>
        </div>
      )}

      {createPortal(
        <AnimatePresence>
          {open && (
            <CdekPicker
              onClose={() => setOpen(false)}
              onSelect={handleSelect}
              onCityChange={onCityChange}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

interface PickerProps {
  onClose: () => void;
  onSelect: (point: PickupPoint) => void;
  onCityChange?: (city: CdekCity) => void;
}

function CdekPicker({ onClose, onSelect, onCityChange }: PickerProps) {
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<CdekCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<CdekCity | null>(null);
  const [offices, setOffices] = useState<CdekOffice[]>([]);
  const [type, setType] = useState<"ALL" | "PVZ" | "POSTAMAT">("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedQuery = useDebounce(query, 350);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setCities([]);
    }
  }, []);

  const retry = useCallback(() => {
    setError("");
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) return;

    let alive = true;
    setLoading(true);
    setError("");
    searchCities(trimmed)
      .then((result) => {
        if (alive) setCities(result);
      })
      .catch((e) => {
        if (alive) {
          setError(
            e instanceof Error ? e.message : "Не удалось найти город",
          );
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [debouncedQuery, reloadKey]);

  useEffect(() => {
    if (!selectedCity) {
      setOffices([]);
      return;
    }

    let alive = true;
    setLoading(true);
    setError("");
    getOffices(selectedCity.code, type)
      .then((result) => {
        if (alive) setOffices(result);
      })
      .catch((e) => {
        if (alive) {
          setError(
            e instanceof Error
              ? e.message
              : "Не удалось загрузить пункты выдачи",
          );
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [selectedCity, type, reloadKey]);

  const title = useMemo(
    () => (selectedCity ? selectedCity.city : "Выбор города"),
    [selectedCity],
  );

  return (
    <>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className={styles.sheet}
        initial={{ y: "100%", scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: "100%", scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        <div className={styles.handle} />
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Закрыть"
        >
          <FiX size={18} />
        </button>

        <div className={styles.header}>
          {selectedCity && (
            <button
              type="button"
              className={styles.back}
              onClick={() => setSelectedCity(null)}
              aria-label="Назад"
            >
              <FiChevronLeft size={20} />
            </button>
          )}
          <h2 className={styles.title}>{title}</h2>
        </div>

        {!selectedCity ? (
          <CitySearch
            query={query}
            onChange={handleQueryChange}
            cities={cities}
            loading={loading}
            error={error}
            onRetry={retry}
            onSelectCity={(city) => {
              onCityChange?.(city);
              setSelectedCity(city);
            }}
          />
        ) : (
          <OfficeList
            offices={offices}
            type={type}
            onChangeType={setType}
            loading={loading}
            error={error}
            onRetry={retry}
            onSelect={onSelect}
          />
        )}
      </motion.div>
    </>
  );
}

interface CitySearchProps {
  query: string;
  onChange: (value: string) => void;
  cities: CdekCity[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onSelectCity: (city: CdekCity) => void;
}

function CitySearch({
  query,
  onChange,
  cities,
  loading,
  error,
  onRetry,
  onSelectCity,
}: CitySearchProps) {
  const showEmpty = !loading && query.trim().length >= 2 && cities.length === 0;

  return (
    <>
      <div className={styles.searchWrap}>
        <FiSearch size={16} className={styles.searchIcon} />
        <input
          className={styles.search}
          type="text"
          placeholder="Введите город"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      </div>

      {loading && <div className={styles.spinner} />}
      {error && (
        <div className={styles.errorBox}>
          <p className={styles.error}>{error}</p>
          <button type="button" className={styles.retry} onClick={onRetry}>
            Повторить
          </button>
        </div>
      )}
      {showEmpty && !error && <p className={styles.empty}>Город не найден</p>}

      <ul className={styles.list}>
        {cities.map((city) => (
          <li
            key={city.code}
            className={styles.cityItem}
            onClick={() => onSelectCity(city)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelectCity(city);
            }}
          >
            <span className={styles.cityName}>{city.city}</span>
            {city.region && (
              <span className={styles.cityRegion}>{city.region}</span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

interface OfficeListProps {
  offices: CdekOffice[];
  type: "ALL" | "PVZ" | "POSTAMAT";
  onChangeType: (type: "ALL" | "PVZ" | "POSTAMAT") => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onSelect: (point: PickupPoint) => void;
}

function OfficeList({
  offices,
  type,
  onChangeType,
  loading,
  error,
  onRetry,
  onSelect,
}: OfficeListProps) {
  const showEmpty = !loading && offices.length === 0;

  return (
    <>
      <div className={styles.filters}>
        {DELIVERY_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={type === t.id ? styles.filterActive : styles.filter}
            onClick={() => onChangeType(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className={styles.spinner} />}
      {error && (
        <div className={styles.errorBox}>
          <p className={styles.error}>{error}</p>
          <button type="button" className={styles.retry} onClick={onRetry}>
            Повторить
          </button>
        </div>
      )}
      {showEmpty && !error && (
        <p className={styles.empty}>В этом городе нет пунктов выдачи</p>
      )}

      <ul className={styles.list}>
        {offices.map((office) => (
          <li
            key={office.code}
            className={styles.officeItem}
            onClick={() =>
              onSelect({
                code: office.code,
                name: office.name,
                address: office.address,
                city: office.city,
                cityCode: office.city_code,
                type: office.type,
              })
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onSelect({
                  code: office.code,
                  name: office.name,
                  address: office.address,
                  city: office.city,
                  cityCode: office.city_code,
                  type: office.type,
                });
              }
            }}
          >
            <div className={styles.officeMain}>
              <span className={styles.officeName}>{office.name}</span>
              {office.address && (
                <span className={styles.officeAddress}>{office.address}</span>
              )}
              {office.work_time && (
                <span className={styles.officeTime}>{office.work_time}</span>
              )}
            </div>
            <div className={styles.officeMeta}>
              <span className={styles.officeType}>
                {office.type === "POSTAMAT" ? "Постамат" : "ПВЗ"}
              </span>
              {office.have_cashless && (
                <span className={styles.badge}>Картой</span>
              )}
              {office.is_dressing_room && (
                <span className={styles.badge}>Примерочная</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
