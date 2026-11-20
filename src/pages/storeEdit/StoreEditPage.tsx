import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { FiCamera, FiSave } from "react-icons/fi";

import { fileUrlFromApi } from "@shared/api/client";
import { leroyApi } from "@shared/api/leroyApi";
import {
  DEFAULT_STORE_AVATAR,
  DEFAULT_STORE_COVER,
} from "@shared/lib/placeholders";
import { accountStore } from "@shared/stores/accountStore";
import ImageCropModal from "@shared/ui/ImageCropModal";
import PageContainer from "@shared/ui/PageContainer";
import { StoreEditSkeleton } from "@shared/ui/Skeletons";
import styles from "./StoreEditPage.module.scss";

type CropTarget = "logo" | "cover";

interface CropRequest {
  file: File;
  target: CropTarget;
}

export default function StoreEditPage() {
  const navigate = useNavigate();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [storeId, setStoreId] = useState<string | undefined>(undefined);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | undefined>(undefined);
  const [coverFile, setCoverFile] = useState<File | undefined>(undefined);
  const [cropRequest, setCropRequest] = useState<CropRequest | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const coverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : null),
    [coverFile],
  );
  const logoPreview = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : null),
    [logoFile],
  );

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [coverPreview, logoPreview]);

  useEffect(() => {
    let alive = true;
    leroyApi
      .myStore(accountStore.userId)
      .then((store) => {
        if (!alive || !store) return;
        setStoreId(store.id);
        setName(store.name ?? "");
        setDescription(store.description ?? "");
        setLogoUrl(store.logoUrl ?? "");
        setCoverUrl(store.coverUrl ?? "");
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const pickCover = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setCropRequest({ file, target: "cover" });
    event.target.value = "";
  };

  const pickLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setCropRequest({ file, target: "logo" });
    event.target.value = "";
  };

  const applyCrop = (file: File) => {
    if (cropRequest?.target === "logo") setLogoFile(file);
    else if (cropRequest?.target === "cover") setCoverFile(file);
    setCropRequest(null);
  };

  const save = async () => {
    if (!storeId || saving) return;
    if (!name.trim()) {
      setError("Укажите название магазина");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const [nextLogoUrl, nextCoverUrl] = await Promise.all([
        logoFile
          ? leroyApi.upload(logoFile).then((res) => fileUrlFromApi(res.url))
          : Promise.resolve(logoUrl.trim() || undefined),
        coverFile
          ? leroyApi.upload(coverFile).then((res) => fileUrlFromApi(res.url))
          : Promise.resolve(coverUrl.trim() || undefined),
      ]);

      await leroyApi.updateStore(storeId, {
        name: name.trim(),
        description: description.trim(),
        logoUrl: nextLogoUrl,
        coverUrl: nextCoverUrl,
      });
      navigate("/my-store");
    } catch {
      setError("Не удалось сохранить. Попробуйте ещё раз");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`page-wrapper ${styles.page}`}>
        <PageContainer>
          <h1 className={styles.title}>Редактирование магазина</h1>
          <StoreEditSkeleton />
        </PageContainer>
      </div>
    );
  }

  const coverSource = coverPreview || coverUrl.trim() || DEFAULT_STORE_COVER;
  const logoSource = logoPreview || logoUrl.trim() || DEFAULT_STORE_AVATAR;

  return (
    <div className={`page-wrapper ${styles.page}`}>
      <PageContainer>
        <h1 className={styles.title}>Редактирование магазина</h1>

        <div className={styles.preview}>
          <button
            type="button"
            className={styles.coverArea}
            onClick={() => coverInputRef.current?.click()}
            disabled={saving}
            aria-label="Выбрать обложку магазина"
          >
            <img className={styles.cover} src={coverSource} alt="" />
            <span className={styles.coverHint}>
              <FiCamera size={16} />
              {coverFile || coverUrl ? "Заменить шапку" : "Добавить шапку"}
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
            onClick={() => logoInputRef.current?.click()}
            disabled={saving}
            aria-label="Выбрать аватарку магазина"
          >
            <img className={styles.avatar} src={logoSource} alt="" />
            <span className={styles.avatarHint}>
              <FiCamera size={14} />
            </span>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenFile}
              onChange={pickLogo}
            />
          </button>
        </div>

        <p className={styles.previewHint}>
          Нажмите на шапку или аватарку, чтобы выбрать файл. Изображение можно
          будет обрезать перед сохранением.
        </p>

        <div className={styles.form}>
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
              rows={4}
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.saveBtn}
            onClick={() => void save()}
            disabled={saving}
          >
            <FiSave size={18} /> {saving ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
      </PageContainer>

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
    </div>
  );
}
