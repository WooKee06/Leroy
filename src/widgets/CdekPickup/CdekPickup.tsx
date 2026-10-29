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

interface PickupPoint {
  code: string;
  name: string;
  address?: string;
  city?: string;
  type?: "PVZ" | "POSTAMAT";
}

interface Props {
  onSelect: (point: PickupPoint) => void;
}

const DELIVERY_TYPES = [
  { id: "ALL" as const, label: "Все" },
  { id: "PVZ" as const, label: "ПВЗ" },
  { id: "POSTAMAT" as const, label: "Постаматы" },
];

export function CdekPickup({ onSelect }: Props) {
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

      {selectedPoint && (
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
}

function CdekPicker({ onClose, onSelect }: PickerProps) {
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<CdekCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<CdekCity | null>(null);
  const [offices, setOffices] = useState<CdekOffice[]>([]);
  const [type, setType] = useState<"ALL" | "PVZ" | "POSTAMAT">("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const debouncedQuery = useDebounce(query, 350);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setCities([]);
    }
  }, []);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) return;

    setLoading(true);
    setError("");
    searchCities(trimmed)
      .then(setCities)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Не удалось найти город"),
      )
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    if (!selectedCity) {
      setOffices([]);
      return;
    }

    setLoading(true);
    setError("");
    getOffices(selectedCity.code, type)
      .then(setOffices)
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "Не удалось загрузить пункты выдачи",
        ),
      )
      .finally(() => setLoading(false));
  }, [selectedCity, type]);

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
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
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
            onSelectCity={setSelectedCity}
          />
        ) : (
          <OfficeList
            offices={offices}
            type={type}
            onChangeType={setType}
            loading={loading}
            error={error}
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
  onSelectCity: (city: CdekCity) => void;
}

function CitySearch({
  query,
  onChange,
  cities,
  loading,
  error,
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
      {error && <p className={styles.error}>{error}</p>}
      {showEmpty && <p className={styles.empty}>Город не найден</p>}

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
  onSelect: (point: PickupPoint) => void;
}

function OfficeList({
  offices,
  type,
  onChangeType,
  loading,
  error,
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
      {error && <p className={styles.error}>{error}</p>}
      {showEmpty && (
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
