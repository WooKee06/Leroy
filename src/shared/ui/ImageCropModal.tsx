import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { AnimatePresence, motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import { cropImageToFile } from "@shared/lib/cropImage";
import styles from "./ImageCropModal.module.scss";
import "react-easy-crop/react-easy-crop.css";

interface Props {
  open: boolean;
  file: File | null;
  title: string;

  aspect: number;
  cropShape?: "rect" | "round";

  outputWidth?: number;
  onCancel: () => void;
  onApply: (file: File) => void;
}

export default function ImageCropModal({
  open,
  file,
  title,
  aspect,
  cropShape = "rect",
  outputWidth = 1200,
  onCancel,
  onApply,
}: Props) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setImageUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAreaPixels(null);
    setError(null);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !processing) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, processing, onCancel]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const apply = async () => {
    if (!imageUrl || !areaPixels || processing) return;
    setProcessing(true);
    setError(null);
    try {
      const cropped = await cropImageToFile(imageUrl, areaPixels, outputWidth);
      onApply(cropped);
    } catch {
      setError("Не удалось обработать фото. Попробуйте другое изображение");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {open && imageUrl && (
        <>
          <motion.div
            className={styles.backdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => !processing && onCancel()}
            aria-hidden="true"
          />
          <div className={styles.layer}>
            <motion.div
              className={styles.dialog}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={styles.stage}>
                <Cropper
                  image={imageUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspect}
                  cropShape={cropShape}
                  showGrid={false}
                  objectFit="contain"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_area, pixels) => setAreaPixels(pixels)}
                />
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${styles.button} ${styles.cancel}`}
                  onClick={onCancel}
                  disabled={processing}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className={`${styles.button} ${styles.apply}`}
                  onClick={() => void apply()}
                  disabled={!areaPixels || processing}
                >
                  {processing ? "Обрабатываем…" : "Применить"}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
