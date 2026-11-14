import { AnimatePresence, motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { FiImage, FiPlus, FiX } from "react-icons/fi";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { catalogStore } from "@shared/stores/catalogStore";
import { leroyApi } from "@shared/api/leroyApi";
import { fileUrlFromApi } from "@shared/api/client";
import type { ProductDto, StoreDto } from "@shared/api/models";
import ImageCropModal from "@shared/ui/ImageCropModal";
import styles from "./CreateSheets.module.scss";
import "swiper/css";
import "swiper/css/pagination";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  onDone: (store?: StoreDto) => void;
}

function GalleryField({
  existingImages,
  removedImages,
  onRemoveExisting,
  newFiles,
  onChangeNewFiles,
}: {
  existingImages: string[];
  removedImages: Set<string>;
  onRemoveExisting: (url: string) => void;
  newFiles: File[];
  onChangeNewFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const visibleExisting = existingImages.filter((u) => !removedImages.has(u));
  const newPreviews = useMemo(
    () => newFiles.map((f) => URL.createObjectURL(f)),
    [newFiles],
  );

  const addFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length) onChangeNewFiles([...newFiles, ...picked]);
    e.target.value = "";
  };

  const removeNewFile = (i: number) =>
    onChangeNewFiles(newFiles.filter((_, idx) => idx !== i));

  const total = visibleExisting.length + newFiles.length;

  return (
    <div className={styles.galleryWrap}>
      <span className={styles.fieldLabel}>Фотографии</span>

      {total === 0 ? (
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
              {visibleExisting.map((src, i) => (
                <SwiperSlide key={`existing-${i}-${src}`}>
                  <img src={src} className={styles.galleryImage} alt="" />
                </SwiperSlide>
              ))}
              {newPreviews.map((src, i) => (
                <SwiperSlide key={`new-${i}-${src}`}>
                  <img src={src} className={styles.galleryImage} alt="" />
                </SwiperSlide>
              ))}
            </Swiper>
            <span className={styles.galleryCount}>
              {total} {total === 1 ? "фото" : "фото"}
            </span>
          </div>

          <div className={styles.galleryThumbs}>
            {visibleExisting.map((url, i) => (
              <div key={`existing-${i}-${url}`} className={styles.thumb}>
                <img src={url} className={styles.thumbImage} alt="" />
                <button
                  type="button"
                  className={styles.thumbRemove}
                  onClick={() => onRemoveExisting(url)}
                  aria-label="Удалить фото"
                >
                  <FiX size={12} />
                </button>
              </div>
            ))}
            {newFiles.map((file, i) => (
              <div key={`new-${i}-${file.name}`} className={styles.thumb}>
                <img
                  src={newPreviews[i]}
                  className={styles.thumbImage}
                  alt=""
                />
                <button
                  type="button"
                  className={styles.thumbRemove}
                  onClick={() => removeNewFile(i)}
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
  const [cropRequest, setCropRequest] = useState<{
    file: File;
    target: "logo" | "cover";
  } | null>(null);
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
      setCropRequest(null);
      setError(null);
    }
  }, [open]);

  const pickCover = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCropRequest({ file, target: "cover" });
    e.target.value = "";
  };

  const pickAvatar = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCropRequest({ file, target: "logo" });
    e.target.value = "";
  };

  const applyCrop = (file: File) => {
    if (cropRequest?.target === "logo") setLogoFile(file);
    else if (cropRequest?.target === "cover") setCoverFile(file);
    setCropRequest(null);
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
      const store = await leroyApi.createStore({
        name: sellerName,
        description: description.trim() || undefined,
        logoUrl,
        coverUrl,
      });
      onDone(store);
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
            initial={{ y: "100%", scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: "100%", scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className={styles.handle} />
            <button
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Закрыть"
            >
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
                  <img
                    className={styles.coverPreview}
                    src={coverPreview}
                    alt=""
                  />
                )}
                <span className={styles.coverHint}>
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
                  <img
                    className={styles.avatarPreview}
                    src={avatarPreview}
                    alt=""
                  />
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

          <ImageCropModal
            open={cropRequest !== null}
            file={cropRequest?.file ?? null}
            title={
              cropRequest?.target === "cover"
                ? "Обрезка шапки"
                : "Обрезка аватарки"
            }
            aspect={cropRequest?.target === "cover" ? 16 / 9 : 1}
            cropShape={cropRequest?.target === "cover" ? "rect" : "round"}
            outputWidth={cropRequest?.target === "cover" ? 1440 : 512}
            onCancel={() => setCropRequest(null)}
            onApply={applyCrop}
          />
        </>
      )}
    </AnimatePresence>
  );
});

interface ProductSheetProps extends SheetProps {
  mode?: "create" | "edit";
  initialProduct?: ProductDto;
}

export const ProductFormSheet = observer(function ProductFormSheet({
  open,
  onClose,
  onDone,
  mode = "create",
  initialProduct,
}: ProductSheetProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("");
  const [tags, setTags] = useState("");
  const [weightG, setWeightG] = useState("");
  const [lengthCm, setLengthCm] = useState("");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [variants, setVariants] = useState<
    Array<{
      type: "size" | "color";
      value: string;
      hex?: string;
      stock?: number;
      price?: number;
    }>
  >([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<Set<string>>(new Set());
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = catalogStore.categories.filter((c) => c.id !== "all");

  const reset = () => {
    setName("");
    setPrice("");
    setOldPrice("");
    setCategoryId("");
    setDescription("");
    setStock("");
    setTags("");
    setWeightG("");
    setLengthCm("");
    setWidthCm("");
    setHeightCm("");
    setVariants([]);
    setExistingImages([]);
    setRemovedImages(new Set());
    setNewFiles([]);
    setError(null);
  };

  useEffect(() => {
    if (!open) return;
    void catalogStore.load();
    if (mode === "edit" && initialProduct) {
      setName(initialProduct.name ?? "");
      setPrice(String(initialProduct.price ?? ""));
      setOldPrice(
        initialProduct.oldPrice != null ? String(initialProduct.oldPrice) : "",
      );
      setCategoryId(initialProduct.categoryId ?? "");
      setDescription(initialProduct.description ?? "");
      setStock(String(initialProduct.stock ?? ""));
      setTags((initialProduct.tags ?? []).join(", "));
      setWeightG(String(initialProduct.weightG ?? ""));
      setLengthCm(String(initialProduct.lengthCm ?? ""));
      setWidthCm(String(initialProduct.widthCm ?? ""));
      setHeightCm(String(initialProduct.heightCm ?? ""));
      setVariants(
        (initialProduct.variants ?? []).map((v) => ({
          type: v.type,
          value: v.value,
          hex: v.hex,
          stock: v.stock,
          price: v.price != null ? Number(v.price) : undefined,
        })),
      );
      setExistingImages(initialProduct.images ?? []);
      setRemovedImages(new Set());
      setNewFiles([]);
      setError(null);
    } else {
      reset();
    }
  }, [open, mode, initialProduct]);

  const addVariant = (type: "size" | "color") => {
    setVariants((prev) => [...prev, { type, value: "", stock: 0 }]);
  };

  const updateVariant = (
    index: number,
    patch: Partial<(typeof variants)[number]>,
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    );
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const parseIntOrUndefined = (value: string): number | undefined => {
    const n = parseInt(value.trim(), 10);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };

  const parseNumberOrUndefined = (value: string): number | undefined => {
    const n = Number(value.trim());
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

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
      const newUrls = await Promise.all(
        newFiles.map((f) =>
          leroyApi.upload(f).then((r) => fileUrlFromApi(r.url)),
        ),
      );
      const images = [
        ...existingImages.filter((url) => !removedImages.has(url)),
        ...newUrls,
      ];
      const payload = {
        name: name.trim(),
        price: parsedPrice,
        categoryId,
        description: description.trim() || undefined,
        images: images.length ? images : undefined,
        stock: parseIntOrUndefined(stock),
        oldPrice: parseNumberOrUndefined(oldPrice),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        variants: variants.length
          ? variants
              .filter((v) => v.value.trim())
              .map((v) => ({
                type: v.type,
                value: v.value.trim(),
                hex: v.type === "color" ? v.hex?.trim() || undefined : undefined,
                stock: v.stock,
                price: v.price,
              }))
          : undefined,
        weightG: parseIntOrUndefined(weightG),
        lengthCm: parseIntOrUndefined(lengthCm),
        widthCm: parseIntOrUndefined(widthCm),
        heightCm: parseIntOrUndefined(heightCm),
      };
      if (mode === "edit" && initialProduct) {
        await leroyApi.updateProduct(initialProduct.id, payload);
      } else {
        await leroyApi.createProduct(payload);
      }
      onDone();
    } catch {
      setError(
        mode === "edit"
          ? "Не удалось обновить товар. Попробуйте ещё раз"
          : "Не удалось создать товар. Попробуйте ещё раз",
      );
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
            initial={{ y: "100%", scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: "100%", scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <div className={styles.handle} />
            <button
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Закрыть"
            >
              <FiX size={18} />
            </button>

            <h2 className={styles.sheetTitle}>
              {mode === "edit" ? "Редактировать товар" : "Добавить товар"}
            </h2>
            <p className={styles.sheetSubtitle}>
              {mode === "edit"
                ? "Обновите параметры товара"
                : "Укажите параметры нового товара"}
            </p>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Название</span>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название товара"
              />
            </label>

            <div className={styles.twoCol}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Цена</span>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value.replace(/[^\d.]/g, ""))
                  }
                  placeholder="1 250"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Старая цена</span>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  value={oldPrice}
                  onChange={(e) =>
                    setOldPrice(e.target.value.replace(/[^\d.]/g, ""))
                  }
                  placeholder="2 000"
                />
              </label>
            </div>

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

            <div className={styles.twoCol}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Остаток</span>
                <input
                  className={styles.input}
                  inputMode="numeric"
                  value={stock}
                  onChange={(e) =>
                    setStock(e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="10"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Теги (через запятую)</span>
                <input
                  className={styles.input}
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="new, sale"
                />
              </label>
            </div>

            <div className={styles.field}>
              <span className={styles.fieldLabel}>Варианты</span>
              <div className={styles.variants}>
                {variants.map((variant, index) => (
                  <div key={index} className={styles.variantRow}>
                    <select
                      className={styles.input}
                      value={variant.type}
                      onChange={(e) =>
                        updateVariant(index, {
                          type: e.target.value as "size" | "color",
                        })
                      }
                    >
                      <option value="size">Размер</option>
                      <option value="color">Цвет</option>
                    </select>
                    <input
                      className={styles.input}
                      value={variant.value}
                      onChange={(e) =>
                        updateVariant(index, { value: e.target.value })
                      }
                      placeholder={
                        variant.type === "color" ? "Красный" : "XL"
                      }
                    />
                    {variant.type === "color" && (
                      <input
                        className={styles.input}
                        value={variant.hex ?? ""}
                        onChange={(e) =>
                          updateVariant(index, { hex: e.target.value })
                        }
                        placeholder="#FF0000"
                      />
                    )}
                    <input
                      className={styles.input}
                      inputMode="numeric"
                      value={variant.stock ?? ""}
                      onChange={(e) =>
                        updateVariant(index, {
                          stock: parseIntOrUndefined(e.target.value),
                        })
                      }
                      placeholder="Остаток"
                    />
                    <input
                      className={styles.input}
                      inputMode="numeric"
                      value={variant.price ?? ""}
                      onChange={(e) =>
                        updateVariant(index, {
                          price: parseNumberOrUndefined(e.target.value),
                        })
                      }
                      placeholder="Цена (не обязательно)"
                    />
                    <button
                      type="button"
                      className={styles.variantRemove}
                      onClick={() => removeVariant(index)}
                      aria-label="Удалить вариант"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <div className={styles.variantActions}>
                <button
                  type="button"
                  className={styles.variantAdd}
                  onClick={() => addVariant("size")}
                >
                  <FiPlus size={14} /> Размер
                </button>
                <button
                  type="button"
                  className={styles.variantAdd}
                  onClick={() => addVariant("color")}
                >
                  <FiPlus size={14} /> Цвет
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <span className={styles.fieldLabel}>Вес и габариты</span>
              <div className={styles.dimsRow}>
                <label className={styles.dimField}>
                  <span>Вес, г</span>
                  <input
                    className={styles.input}
                    inputMode="numeric"
                    value={weightG}
                    onChange={(e) =>
                      setWeightG(e.target.value.replace(/[^\d]/g, ""))
                    }
                    placeholder="500"
                  />
                </label>
                <label className={styles.dimField}>
                  <span>Длина, см</span>
                  <input
                    className={styles.input}
                    inputMode="numeric"
                    value={lengthCm}
                    onChange={(e) =>
                      setLengthCm(e.target.value.replace(/[^\d]/g, ""))
                    }
                    placeholder="20"
                  />
                </label>
                <label className={styles.dimField}>
                  <span>Ширина, см</span>
                  <input
                    className={styles.input}
                    inputMode="numeric"
                    value={widthCm}
                    onChange={(e) =>
                      setWidthCm(e.target.value.replace(/[^\d]/g, ""))
                    }
                    placeholder="15"
                  />
                </label>
                <label className={styles.dimField}>
                  <span>Высота, см</span>
                  <input
                    className={styles.input}
                    inputMode="numeric"
                    value={heightCm}
                    onChange={(e) =>
                      setHeightCm(e.target.value.replace(/[^\d]/g, ""))
                    }
                    placeholder="10"
                  />
                </label>
              </div>
            </div>

            <GalleryField
              existingImages={existingImages}
              removedImages={removedImages}
              onRemoveExisting={(url) =>
                setRemovedImages((prev) => new Set(prev).add(url))
              }
              newFiles={newFiles}
              onChangeNewFiles={setNewFiles}
            />

            {error && <p className={styles.error}>{error}</p>}

            <button
              className={styles.submitBtn}
              onClick={() => void submit()}
              disabled={saving}
            >
              {saving
                ? mode === "edit"
                  ? "Сохраняем…"
                  : "Добавляем…"
                : mode === "edit"
                  ? "Сохранить изменения"
                  : "Добавить товар"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
