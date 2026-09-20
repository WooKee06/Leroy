import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { catalogStore } from "@shared/stores/catalogStore";
import { leroyApi } from "@shared/api/leroyApi";
import styles from "./CreateSheets.module.scss";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

export const StoreCreateSheet = observer(function StoreCreateSheet({
  open,
  onClose,
  onDone,
}: SheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setLogoUrl("");
      setCoverUrl("");
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    const sellerName = name.trim();
    if (!sellerName) {
      setError("Укажите название магазина");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await leroyApi.createStore({
        name: sellerName,
        description: description.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        coverUrl: coverUrl.trim() || undefined,
      });
      onDone();
    } catch {
      setError("Не удалось создать магазин. Попробуйте ещё раз");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Создание магазина"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className={styles.handle} />
            <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
              <FiX size={18} />
            </button>

            <h2 className={styles.sheetTitle}>Создать магазин</h2>
            <p className={styles.sheetSubtitle}>Заполните информацию о вашем магазине</p>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Название</span>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название магазина"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Описание</span>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Коротко о магазине"
                rows={3}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Обложка (URL)</span>
              <input
                className={styles.input}
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://…"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Логотип (URL)</span>
              <input
                className={styles.input}
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://…"
              />
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button
              className={styles.submitBtn}
              onClick={() => void submit()}
              disabled={saving}
            >
              {saving ? "Создаём…" : "Создать магазин"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export const ProductFormSheet = observer(function ProductFormSheet({
  open,
  onClose,
  onDone,
}: SheetProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = catalogStore.categories.filter((c) => c.id !== "all");

  useEffect(() => {
    if (open) {
      setName("");
      setPrice("");
      setCategoryId("");
      setDescription("");
      setImageUrl("");
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    const parsedPrice = Number(price);
    if (!name.trim()) {
      setError("Укажите название товара");
      return;
    }
    if (!price || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("Укажите цену");
      return;
    }
    if (!categoryId) {
      setError("Выберите категорию");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await leroyApi.createProduct({
        name: name.trim(),
        price: parsedPrice,
        categoryId,
        description: description.trim() || undefined,
        images: imageUrl.trim() ? [imageUrl.trim()] : undefined,
      });
      onDone();
    } catch {
      setError("Не удалось создать товар. Попробуйте ещё раз");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Добавление товара"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className={styles.handle} />
            <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">
              <FiX size={18} />
            </button>

            <h2 className={styles.sheetTitle}>Добавить товар</h2>
            <p className={styles.sheetSubtitle}>Укажите параметры нового товара</p>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Название</span>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название товара"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Цена</span>
              <input
                className={styles.input}
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="1 250"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Категория</span>
              <div className={styles.chips}>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={
                      categoryId === c.id ? styles.chipActive : styles.chip
                    }
                    onClick={() => setCategoryId(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Описание</span>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание товара"
                rows={3}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Фото (URL)</span>
              <input
                className={styles.input}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
              />
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button
              className={styles.submitBtn}
              onClick={() => void submit()}
              disabled={saving}
            >
              {saving ? "Добавляем…" : "Добавить товар"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});