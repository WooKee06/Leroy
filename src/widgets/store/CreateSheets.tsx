import { AnimatePresence, motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { FiCamera, FiImage, FiPlus, FiX } from "react-icons/fi";
import { observer } from "mobx-react-lite";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { catalogStore } from "@shared/stores/catalogStore";
import { leroyApi } from "@shared/api/leroyApi";
import { fileUrlFromApi } from "@shared/api/client";
import styles from "./CreateSheets.module.scss";
import "swiper/css";
import "swiper/css/pagination";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

function GalleryField({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(
    () => files.map((f) => URL.createObjectURL(f)),
    [files],
  );

  const addFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length) onChange([...files, ...picked]);
    e.target.value = "";
  };

  const removeFile = (i: number) =>
    onChange(files.filter((_, idx) => idx !== i));

  return (
    <div className={styles.galleryWrap}>
      <span className={styles.fieldLabel}>Фотографии</span>

      {files.length === 0 ? (
        <button
          type="button"
          className={styles.galleryEmpty}
          onClick={() => inputRef.current?.click()}
        >
          <FiImage size={22} />
          <span>Добавить фото</span>
        </button>
      ) : (
        <>
          <div className={styles.galleryPreview}>
            <Swiper
              modules={[Pagination]}
              pagination={{ clickable: true }}
              grabCursor
              className={styles.gallerySwiper}
            >
              {previews.map((src, i) => (
                <SwiperSlide key={`${i}-${src}`}>
                  <img src={src} className={styles.galleryImage} alt="" />
                </SwiperSlide>
              ))}
            </Swiper>
            <span className={styles.galleryCount}>
              {files.length} {files.length === 1 ? "фото" : "фото"}
            </span>
          </div>

          <div className={styles.galleryThumbs}>
            {files.map((file, i) => (
              <div key={`${i}-${file.name}`} className={styles.thumb}>
                <img src={previews[i]} className={styles.thumbImage} alt="" />
                <button
                  type="button"
                  className={styles.thumbRemove}
                  onClick={() => removeFile(i)}
                  aria-label="Удалить фото"
                >
                  <FiX size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.thumbAdd}
              onClick={() => inputRef.current?.click()}
              aria-label="Добавить фото"
            >
              <FiPlus size={18} />
            </button>
          </div>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className={styles.hiddenFile}
        onChange={addFiles}
      />
    </div>
  );
}

export const StoreCreateSheet = observer(function StoreCreateSheet({
  open,
  onClose,
  onDone,
}: SheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState<File | undefined>(undefined);
  const [coverFile, setCoverFile] = useState<File | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const coverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : undefined),
    [coverFile],
  );
  const avatarPreview = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : undefined),
    [logoFile],
  );

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setLogoFile(undefined);
      setCoverFile(undefined);
      setError(null);
    }
  }, [open]);

  const pickCover = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCoverFile(file);
    e.target.value = "";
  };

  const pickAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setLogoFile(file);
    e.target.value = "";
  };

  const submit = async () => {
    const sellerName = name.trim();
    if (!sellerName) {
      setError("Укажите название магазина");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const [logoUrl, coverUrl] = await Promise.all([
        logoFile
          ? leroyApi.upload(logoFile).then((r) => fileUrlFromApi(r.url))
          : Promise.resolve(undefined),
        coverFile
          ? leroyApi.upload(coverFile).then((r) => fileUrlFromApi(r.url))
          : Promise.resolve(undefined),
      ]);
      await leroyApi.createStore({
        name: sellerName,
        description: description.trim() || undefined,
        logoUrl,
        coverUrl,
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
            <p className={styles.sheetSubtitle}>
              Как будет выглядеть ваша страница
            </p>

            <div className={styles.storeSkeleton}>
              <button
                type="button"
                className={styles.coverArea}
                onClick={() => coverInputRef.current?.click()}
              >
                {coverPreview && (
                  <img className={styles.coverPreview} src={coverPreview} alt="" />
                )}
                <span className={styles.coverHint}>
                  <FiCamera size={16} />
                  {coverPreview ? "Заменить шапку" : "Добавить шапку"}
                </span>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.hiddenFile}
                  onChange={pickCover}
                />
              </button>

              <button
                type="button"
                className={styles.avatarArea}
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img className={styles.avatarPreview} src={avatarPreview} alt="" />
                ) : (
                  <span className={styles.avatarPlaceholder}>
                    <FiPlus size={26} />
                  </span>
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.hiddenFile}
                  onChange={pickAvatar}
                />
              </button>
            </div>

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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = catalogStore.categories.filter((c) => c.id !== "all");

  useEffect(() => {
    if (open) {
      setName("");
      setPrice("");
      setCategoryId("");
      setDescription("");
      setImageFiles([]);
      setError(null);
      void catalogStore.load();
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
      const imageUrls = await Promise.all(
        imageFiles.map((f) =>
          leroyApi.upload(f).then((r) => fileUrlFromApi(r.url)),
        ),
      );
      await leroyApi.createProduct({
        name: name.trim(),
        price: parsedPrice,
        categoryId,
        description: description.trim() || undefined,
        images: imageUrls.length ? imageUrls : undefined,
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

            <GalleryField files={imageFiles} onChange={setImageFiles} />

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