import { useState, type ReactNode } from "react";
import { FiX } from "react-icons/fi";
import type { AdminTone } from "@shared/lib/admin";
import styles from "./AdminUi.module.scss";

export function AdminCard({
  title,
  subtitle,
  action,
  children,
  padded = true,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <section className={styles.card}>
      {(title || action) && (
        <header className={styles.cardHeader}>
          <div>
            {title && <h2 className={styles.cardTitle}>{title}</h2>}
            {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? styles.cardBody : undefined}>{children}</div>
    </section>
  );
}

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: AdminTone;
}) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{label}</span>;
}

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
  hideBelow?: number;
}

export function AdminTable<T extends { id?: string }>({
  columns,
  rows,
  rowKey = (row) => row.id ?? "",
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey?: (row: T) => string;
  onRowClick?: (row: T) => void;
}) {
  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={onRowClick ? styles.clickableRow : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((column) => (
                <td key={column.key} className={column.className}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PageIntro({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.pageIntro}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {description && <p className={styles.pageDescription}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className={styles.toolbar}>{children}</div>;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Поиск",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      className={styles.searchInput}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type="search"
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <select
      className={styles.select}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function StateBlock({
  kind,
  text,
}: {
  kind: "loading" | "empty" | "error";
  text: string;
}) {
  return (
    <div className={`${styles.state} ${styles[`state_${kind}`]}`}>
      {kind === "loading" && <span className={styles.spinner} />}
      <span>{text}</span>
    </div>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <h3>{title}</h3>
          <button type="button" onClick={onClose} aria-label="Закрыть">
            <FiX size={18} />
          </button>
        </header>
        <div className={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Подтвердить",
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className={styles.modalText}>{message}</p>
      <div className={styles.modalActions}>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>
          Отмена
        </button>
        <button
          type="button"
          className={danger ? styles.dangerButton : styles.primaryButton}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function ReasonDialog({
  title,
  message,
  confirmLabel = "Подтвердить",
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Modal title={title} onClose={onCancel}>
      <p className={styles.modalText}>{message}</p>
      <textarea
        className={styles.textarea}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Причина решения"
        rows={4}
        autoFocus
      />
      <div className={styles.modalActions}>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>
          Отмена
        </button>
        <button
          type="button"
          className={danger ? styles.dangerButton : styles.primaryButton}
          disabled={!reason.trim()}
          onClick={() => onConfirm(reason.trim())}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function DetailGrid({ children }: { children: ReactNode }) {
  return <div className={styles.detailGrid}>{children}</div>;
}

export function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.detailItem}>
      <span className={styles.detailLabel}>{label}</span>
      <div className={styles.detailValue}>{children}</div>
    </div>
  );
}

export function ActionRow({ children }: { children: ReactNode }) {
  return <div className={styles.actionRow}>{children}</div>;
}
