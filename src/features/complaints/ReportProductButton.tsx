import { useState } from "react";
import { observer } from "mobx-react-lite";
import { FiFlag, FiX } from "react-icons/fi";
import type { ComplaintReason } from "@shared/api/models";
import { leroyApi } from "@shared/api/leroyApi";
import styles from "./ReportProductButton.module.scss";

const REASONS: { id: ComplaintReason; label: string }[] = [
  { id: "prohibited", label: "Запрещённый товар" },
  { id: "fake", label: "Подделка" },
  { id: "scam", label: "Мошенничество" },
  { id: "mismatch", label: "Несоответствие описанию" },
  { id: "missing_docs", label: "Отсутствие документов" },
  { id: "copyright", label: "Нарушение авторских прав" },
  { id: "other", label: "Другое" },
];

function ReportProductButton({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ComplaintReason>("mismatch");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await leroyApi.createComplaint({
        targetType: "product",
        targetId: productId,
        reason,
        comment: comment.trim() || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Не удалось отправить жалобу",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => {
          setOpen(true);
          setSent(false);
          setError(null);
        }}
      >
        <FiFlag size={14} />
        Пожаловаться
      </button>

      {open && (
        <div className={styles.overlay} onMouseDown={() => setOpen(false)}>
          <div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.header}>
              <strong>Жалоба на товар</strong>
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть">
                <FiX size={18} />
              </button>
            </header>

            {sent ? (
              <p className={styles.success}>
                Жалоба отправлена. Администратор рассмотрит её.
              </p>
            ) : (
              <div className={styles.body}>
                <label className={styles.field}>
                  Причина
                  <select
                    value={reason}
                    onChange={(event) =>
                      setReason(event.target.value as ComplaintReason)
                    }
                  >
                    {REASONS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  Комментарий
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows={3}
                    placeholder="Добавьте детали"
                  />
                </label>
                {error && <p className={styles.error}>{error}</p>}
                <button
                  type="button"
                  className={styles.submit}
                  disabled={busy}
                  onClick={() => void submit()}
                >
                  {busy ? "Отправляем…" : "Отправить жалобу"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default observer(ReportProductButton);
