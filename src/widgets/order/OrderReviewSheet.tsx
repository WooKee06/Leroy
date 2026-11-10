import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiCamera,
  FiCheck,
  FiPackage,
  FiSend,
  FiStar,
  FiX,
} from "react-icons/fi";
import type { OrderItemView } from "@shared/api/models";
import { ApiError, fileUrlFromApi } from "@shared/api/client";
import { leroyApi } from "@shared/api/leroyApi";
import styles from "./OrderReviewSheet.module.scss";

const MAX_PHOTOS = 4;
const MAX_TEXT = 600;
const STARS = [1, 2, 3, 4, 5];

const RATING_LABELS: Record<number, string> = {
  0: "Выберите оценку",
  1: "Ужасно",
  2: "Плохо",
  3: "Нормально",
  4: "Хорошо",
  5: "Отлично",
};

interface Props {
  open: boolean;
  item?: OrderItemView;
  onClose: () => void;
  onSubmitted: (productId: string, rating: number) => void;
}

/**
 * Нижняя шторка для отзыва прямо из заказа. Показывает товар, на который
 * пользователь оставляет отзыв, и мягко анимирует выбор оценки и успех.
 */
export default function OrderReviewSheet({
  open,
  item,
  onClose,
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setRating(0);
    setText("");
    setImages([]);
    setSaving(false);
    setUploading(false);
    setSuccess(false);
    setError(null);
  }, [open, item?.id]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const variant = useMemo(() => {
    if (!item) return "";
    return [item.selectedColor, item.selectedSize && `Размер ${item.selectedSize}`]
      .filter(Boolean)
      .join(" · ");
  }, [item]);

  const pickPhotos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(
      0,
      MAX_PHOTOS - images.length,
    );
    event.target.value = "";
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const urls = await Promise.all(
        files.map((file) =>
          leroyApi.upload(file).then((res) => fileUrlFromApi(res.url)),
        ),
      );
      setImages((prev) => [...prev, ...urls].slice(0, MAX_PHOTOS));
    } catch {
      setError("Не удалось загрузить фото. Попробуйте ещё раз");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (url: string) => {
    setImages((prev) => prev.filter((image) => image !== url));
  };

  const submit = async () => {
    if (!item?.productId || !rating || saving || uploading) return;

    setSaving(true);
    setError(null);
    try {
      await leroyApi.createReview({
        productId: item.productId,
        rating,
        text: text.trim() || undefined,
        images: images.length > 0 ? images : undefined,
      });
      onSubmitted(item.productId, rating);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? "Вы уже оставляли отзыв на этот товар"
          : "Не удалось отправить отзыв. Попробуйте ещё раз",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && item && (
        <>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className={styles.sheet}
            initial={{ y: "100%", scale: 0.985 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: "100%", scale: 0.985 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            role="dialog"
            aria-modal="true"
            aria-label="Отзыв о товаре"
          >
            <div className={styles.top}>
              <span className={styles.handle} />
              <div className={styles.headRow}>
                <div>
                  <span className={styles.eyebrow}>Отзыв о товаре</span>
                  <h3 className={styles.title}>Как вам покупка?</h3>
                </div>
                <button
                  type="button"
                  className={styles.close}
                  onClick={onClose}
                  aria-label="Закрыть"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            <div className={styles.body}>
              <div className={styles.product}>
                <div className={styles.productImageWrap}>
                  {item.imageUrl ? (
                    <img
                      className={styles.productImage}
                      src={item.imageUrl}
                      alt={item.name}
                    />
                  ) : (
                    <span className={styles.productImageFallback}>
                      <FiPackage size={22} />
                    </span>
                  )}
                </div>
                <div className={styles.productInfo}>
                  <span className={styles.productName}>{item.name}</span>
                  <span className={styles.productMeta}>
                    {variant || "Товар из заказа"}
                    {item.quantity > 1 ? ` · ${item.quantity} шт` : ""}
                  </span>
                </div>
              </div>

              {success ? (
                <motion.div
                  className={styles.success}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                >
                  <motion.span
                    className={styles.successIcon}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 340, damping: 20 }}
                  >
                    <FiCheck size={30} />
                  </motion.span>
                  <h4 className={styles.successTitle}>Спасибо за отзыв!</h4>
                  <p className={styles.successText}>
                    Он уже опубликован и поможет другим покупателям сделать
                    выбор.
                  </p>
                  <div className={styles.successStars} aria-hidden="true">
                    {STARS.map((star) => (
                      <FiStar
                        key={star}
                        size={20}
                        className={
                          star <= rating ? styles.successStarActive : ""
                        }
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className={styles.done}
                    onClick={onClose}
                  >
                    Отлично
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className={styles.ratingBlock}>
                    <span className={styles.ratingTitle}>Ваша оценка</span>
                    <div
                      className={styles.stars}
                      role="radiogroup"
                      aria-label="Оценка товара"
                    >
                      {STARS.map((star) => {
                        const active = star <= rating;
                        return (
                          <button
                            key={star}
                            type="button"
                            role="radio"
                            aria-checked={rating === star}
                            aria-label={`${star} из 5`}
                            className={`${styles.star} ${
                              active ? styles.starActive : ""
                            }`}
                            onClick={() => setRating(star)}
                          >
                            <FiStar size={34} />
                          </button>
                        );
                      })}
                    </div>
                    <div className={styles.ratingLabelWrap}>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                          key={rating}
                          className={styles.ratingLabel}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.14 }}
                        >
                          {RATING_LABELS[rating]}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </div>

                  <label className={styles.textField}>
                    <span className={styles.textLabel}>
                      Комментарий <em>необязательно</em>
                    </span>
                    <textarea
                      className={styles.textarea}
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      maxLength={MAX_TEXT}
                      rows={4}
                      placeholder="Что понравилось? Что можно улучшить?"
                    />
                    <span className={styles.counter}>
                      {text.length}/{MAX_TEXT}
                    </span>
                  </label>

                  <div className={styles.photos}>
                    <div className={styles.photosHead}>
                      <span className={styles.textLabel}>Фото</span>
                      <span className={styles.photosCount}>
                        {images.length}/{MAX_PHOTOS}
                      </span>
                    </div>
                    <div className={styles.photoRow}>
                      <AnimatePresence initial={false}>
                        {images.map((url) => (
                          <motion.div
                            key={url}
                            className={styles.photo}
                            initial={{ opacity: 0, scale: 0.86 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.86 }}
                            transition={{ duration: 0.16 }}
                          >
                            <img
                              className={styles.photoImage}
                              src={url}
                              alt="Фото к отзыву"
                            />
                            <button
                              type="button"
                              className={styles.photoRemove}
                              onClick={() => removePhoto(url)}
                              aria-label="Удалить фото"
                            >
                              <FiX size={12} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {images.length < MAX_PHOTOS && (
                        <label
                          className={`${styles.photoAdd} ${
                            uploading ? styles.photoAddBusy : ""
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            multiple
                            onChange={pickPhotos}
                            disabled={uploading}
                            hidden
                          />
                          {uploading ? (
                            <span className={styles.spinner} />
                          ) : (
                            <>
                              <FiCamera size={20} />
                              <span>Добавить</span>
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  </div>

                  {error && <p className={styles.error}>{error}</p>}

                  <motion.button
                    type="button"
                    className={styles.submit}
                    onClick={submit}
                    disabled={!rating || saving || uploading}
                    whileTap={rating ? { scale: 0.985 } : undefined}
                  >
                    {saving ? (
                      <span className={styles.spinner} />
                    ) : (
                      <FiSend size={16} />
                    )}
                    {saving ? "Отправляем…" : "Отправить отзыв"}
                  </motion.button>
                  <p className={styles.note}>
                    Отзыв будет опубликован от вашего имени
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
